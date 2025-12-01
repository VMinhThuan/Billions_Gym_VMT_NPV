import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Image as ImageIcon, Smile, ArrowLeft, Minus } from 'lucide-react';
import chatService from '../../services/chat.service';
import { authUtils } from '../../utils/auth';

const ChatWindow = ({ roomId, recipient, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUser = authUtils.getUser();

    console.log('[ChatWindow] Rendered with:', { roomId, recipient, currentUser });

    useEffect(() => {
        if (roomId) {
            console.log('[ChatWindow] Room ID changed, loading messages...');
            loadMessages();
            joinRoom();

            // Lắng nghe tin nhắn mới
            chatService.on('new-message', handleNewMessage);
            chatService.on('user-typing', handleUserTyping);
            chatService.on('user-stop-typing', handleUserStopTyping);

            return () => {
                chatService.off('new-message', handleNewMessage);
                chatService.off('user-typing', handleUserTyping);
                chatService.off('user-stop-typing', handleUserStopTyping);
            };
        }
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const joinRoom = () => {
        chatService.joinRoom(roomId);
        chatService.markRead(roomId);
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            console.log('[ChatWindow] Loading messages for room:', roomId);
            const response = await chatService.getChatMessages(roomId, { limit: 50 });
            console.log('[ChatWindow] Messages response:', response);
            if (response.success) {
                setMessages(response.data || []);
            }
        } catch (error) {
            console.error('[ChatWindow] Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        if (message.room === roomId) {
            setMessages(prev => [...prev, message]);
            chatService.markRead(roomId);
        }
    };

    const handleUserTyping = (data) => {
        if (data.roomId === roomId && data.userId !== currentUser?.id) {
            setTyping(true);
        }
    };

    const handleUserStopTyping = (data) => {
        if (data.roomId === roomId) {
            setTyping(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            chatService.sendMessage(roomId, newMessage.trim());
            setNewMessage('');
            chatService.stopTyping(roomId);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        // Gửi typing indicator
        chatService.typing(roomId);

        // Clear timeout cũ
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout mới để stop typing sau 2s
        typingTimeoutRef.current = setTimeout(() => {
            chatService.stopTyping(roomId);
        }, 2000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        } else {
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    };

    const groupMessagesByDate = (messages) => {
        const groups = {};
        messages.forEach(msg => {
            const date = formatDate(msg.createdAt);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });
        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#92A3FD] to-[#9DCEFF] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="lg:hidden text-white hover:bg-white/20 rounded-full p-2 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                            {recipient?.hoTen ? recipient.hoTen.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">{recipient?.hoTen || 'Chat'}</h3>
                            {typing && <p className="text-white/80 text-xs">Đang nhập...</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="hidden lg:block text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#92A3FD]"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(messageGroups).map(([date, msgs]) => (
                                <div key={date}>
                                    <div className="flex items-center justify-center mb-4">
                                        <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                                            {date}
                                        </span>
                                    </div>
                                    {msgs.map((message) => {
                                        const isOwn = message.sender?._id === currentUser?.id || message.sender === currentUser?.id;
                                        return (
                                            <div
                                                key={message._id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                                            >
                                                <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    {!isOwn && (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#92A3FD] to-[#9DCEFF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {message.sender?.hoTen ? message.sender.hoTen.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div
                                                            className={`rounded-2xl px-4 py-2 ${isOwn
                                                                ? 'bg-gradient-to-r from-[#92A3FD] to-[#9DCEFF] text-white'
                                                                : 'bg-white text-gray-800 shadow-sm'
                                                                }`}
                                                        >
                                                            <p className="text-sm break-words">{message.message}</p>
                                                        </div>
                                                        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(message.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleTyping}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#92A3FD] focus:border-transparent"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-gradient-to-r from-[#92A3FD] to-[#9DCEFF] text-white rounded-full p-3 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
