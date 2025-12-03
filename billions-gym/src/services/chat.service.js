import { io } from 'socket.io-client';
import { API_CONFIG } from '../constants/api';
import { authUtils } from '../utils/auth';
import { apiRequest } from './api';

// Determine chat API base based on user role
const getChatApiBase = () => {
    const user = authUtils.getUser();
    return user?.vaiTro === 'PT' || user?.vaiTro === 'OngChu' ? '/pt/chat' : '/member/chat';
};
// Socket.IO server URL - remove /api if present, or use base URL directly
const SOCKET_URL = API_CONFIG.BASE_URL.includes('/api')
    ? API_CONFIG.BASE_URL.replace('/api', '')
    : API_CONFIG.BASE_URL;

class ChatService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
    }

    // Kết nối WebSocket
    connect() {
        if (this.socket && this.isConnected) {
            return;
        }

        const token = authUtils.getToken();
        if (!token) {
            console.error('No token found, cannot connect to WebSocket');
            return;
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('[ChatService] Connected to WebSocket');
            this.isConnected = true;
            this.emit('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('[ChatService] Disconnected from WebSocket');
            this.isConnected = false;
            this.emit('disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('[ChatService] WebSocket error:', error);
            this.emit('error', error);
        });

        // Lắng nghe tin nhắn mới
        this.socket.on('new-message', (message) => {
            this.emit('new-message', message);
        });

        // Lắng nghe typing indicator
        this.socket.on('user-typing', (data) => {
            this.emit('user-typing', data);
        });

        this.socket.on('user-stop-typing', (data) => {
            this.emit('user-stop-typing', data);
        });

        // Lắng nghe messages đã đọc
        this.socket.on('messages-read', (data) => {
            this.emit('messages-read', data);
        });

        this.socket.on('joined-room', (data) => {
            this.emit('joined-room', data);
        });
    }

    // Ngắt kết nối
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Join room
    joinRoom(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-room', roomId);
        }
    }

    // Gửi tin nhắn
    sendMessage(roomId, message, type = 'text', fileData = null) {
        if (this.socket && this.isConnected) {
            const data = {
                roomId,
                message,
                type
            };

            if (fileData) {
                data.fileUrl = fileData.fileUrl;
                data.fileName = fileData.fileName;
                data.fileSize = fileData.fileSize;
            }

            this.socket.emit('send-message', data);
        }
    }

    // Typing indicator
    typing(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing', { roomId });
        }
    }

    stopTyping(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('stop-typing', { roomId });
        }
    }

    // Đánh dấu tin nhắn đã đọc
    markRead(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('mark-read', { roomId });
        }
    }

    // Event listeners
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[ChatService] Error in callback for event ${event}:`, error);
                }
            });
        }
    }

    // API methods
    async getChatRooms() {
        const apiBase = getChatApiBase();
        return apiRequest(`${apiBase}/rooms`, {
            method: 'GET'
        });
    }

    async getOrCreateRoom(otherUserId) {
        const apiBase = getChatApiBase();
        return apiRequest(`${apiBase}/rooms/${otherUserId}`, {
            method: 'GET'
        });
    }

    async getChatMessages(roomId, params = {}) {
        const apiBase = getChatApiBase();
        console.log('[ChatService] Getting messages for room:', roomId, 'with params:', params);
        console.log('[ChatService] API base:', apiBase);

        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        const url = `${apiBase}/rooms/${roomId}/messages${queryString ? `?${queryString}` : ''}`;
        console.log('[ChatService] Request URL:', url);

        try {
            const response = await apiRequest(url, {
                method: 'GET'
            });
            console.log('[ChatService] Messages response:', response);
            return response;
        } catch (error) {
            console.error('[ChatService] Error getting messages:', error);
            throw error;
        }
    }

    async uploadFile(file) {
        const apiBase = getChatApiBase();
        const formData = new FormData();
        formData.append('file', file);

        const token = authUtils.getToken();
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}${apiBase}/upload`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return response.json();
    }

    async deleteChatRoom(roomId) {
        const apiBase = getChatApiBase();
        return apiRequest(`${apiBase}/rooms/${roomId}`, {
            method: 'DELETE'
        });
    }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;

