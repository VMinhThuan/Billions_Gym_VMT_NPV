import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import chatService from '../../services/chat.service';
import { authUtils } from '../../utils/auth';

const PTChat = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadChatRooms();
        chatService.connect();

        const handleNewMessage = (message) => {
            // Cập nhật tin nhắn trong phòng đang mở
            if (selectedRoom && message.room === selectedRoom._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
                // Mark as read ngay khi nhận tin trong phòng đang mở
                chatService.markRead(selectedRoom._id);
            }

            // Cập nhật danh sách rooms với lastMessage và unreadCount
            setRooms(prev => prev.map(room => {
                if (room._id === message.room) {
                    return {
                        ...room,
                        lastMessage: message.message || 'Đã gửi file',
                        lastMessageAt: message.createdAt,
                        // Tăng unread count nếu không phải phòng đang mở và không phải tin nhắn của mình
                        unreadCount: (selectedRoom?._id !== room._id && message.sender._id !== authUtils.getUser()?._id)
                            ? (room.unreadCount || 0) + 1
                            : room.unreadCount || 0
                    };
                }
                return room;
            }));
        };

        chatService.on('new-message', handleNewMessage);

        return () => {
            chatService.off('new-message', handleNewMessage);
        };
    }, [selectedRoom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatRooms = async () => {
        try {
            setLoading(true);
            const response = await chatService.getChatRooms();
            if (response.success) {
                setRooms(response.data || []);
            }
        } catch (error) {
            console.error('Error loading chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRoom = async (room) => {
        setSelectedRoom(room);

        // Reset unread count cho phòng này
        setRooms(prev => prev.map(r =>
            r._id === room._id ? { ...r, unreadCount: 0 } : r
        ));

        try {
            const response = await chatService.getChatMessages(room._id);
            if (response.success) {
                setMessages(response.data || []);
                chatService.joinRoom(room._id);
                chatService.markRead(room._id);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedRoom) return;

        chatService.sendMessage(selectedRoom._id, messageText);
        setMessageText('');
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Tin nhắn</h2>

                    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
                        {/* Sidebar - Danh sách phòng chat */}
                        <div className="w-full lg:w-1/3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex flex-col">
                            <div className="p-4 border-b border-[#2a2a2a]">
                                <h3 className="text-white font-semibold">Cuộc trò chuyện</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da2128]"></div>
                                    </div>
                                ) : rooms.length > 0 ? (
                                    <div className="space-y-2">
                                        {rooms.map(room => (
                                            <div
                                                key={room._id}
                                                onClick={() => handleSelectRoom(room)}
                                                className={`p-3 rounded-lg cursor-pointer transition ${selectedRoom?._id === room._id
                                                    ? 'bg-[#da2128]'
                                                    : 'bg-[#0a0a0a] hover:bg-[#2a2a2a] border border-[#2a2a2a]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {room.hoiVien?.anhDaiDien ? (
                                                        <img
                                                            src={room.hoiVien.anhDaiDien}
                                                            alt={room.hoiVien.hoTen}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#da2128] flex items-center justify-center text-white font-semibold">
                                                            {room.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-semibold truncate">{room.hoiVien?.hoTen || 'N/A'}</p>
                                                        <p className="text-gray-400 text-sm truncate">{room.lastMessage || 'Chưa có tin nhắn'}</p>
                                                    </div>
                                                    {room.unreadCount > 0 && (
                                                        <div className="flex-shrink-0">
                                                            <div className="bg-[#da2128] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                                {room.unreadCount > 9 ? '9+' : room.unreadCount}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">Chưa có cuộc trò chuyện nào</p>
                                )}
                            </div>
                        </div>

                        {/* Main chat area */}
                        <div className="flex-1 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex flex-col">
                            {selectedRoom ? (
                                <>
                                    <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3">
                                        {selectedRoom.hoiVien?.anhDaiDien ? (
                                            <img
                                                src={selectedRoom.hoiVien.anhDaiDien}
                                                alt={selectedRoom.hoiVien.hoTen}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#da2128] flex items-center justify-center text-white font-semibold">
                                                {selectedRoom.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                            </div>
                                        )}
                                        <h3 className="text-white font-semibold">{selectedRoom.hoiVien?.hoTen}</h3>
                                    </div>

                                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                        {messages.length > 0 ? (
                                            messages.map(msg => {
                                                const currentUserId = authUtils.getUserId();
                                                const isMyMessage = msg.sender?._id === currentUserId;
                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMyMessage
                                                                ? 'bg-[#da2128] text-white'
                                                                : 'bg-[#2a2a2a] text-white'
                                                                }`}
                                                        >
                                                            {msg.type === 'image' && msg.fileUrl ? (
                                                                <img src={msg.fileUrl} alt="Image" className="max-w-full rounded mb-1" />
                                                            ) : msg.type === 'file' && msg.fileUrl ? (
                                                                <a
                                                                    href={msg.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-400 hover:underline"
                                                                >
                                                                    📎 {msg.fileName || 'File'}
                                                                </a>
                                                            ) : (
                                                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                                            )}
                                                            <p className={`text-xs mt-1 ${isMyMessage ? 'text-red-100' : 'text-gray-400'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-400">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2a2a2a] flex gap-2">
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#da2128]"
                                            placeholder="Nhập tin nhắn..."
                                        />
                                        <button
                                            type="submit"
                                            className="bg-[#da2128] text-white px-6 py-2 rounded-lg hover:bg-[#b31a20] transition font-semibold"
                                        >
                                            Gửi
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <p className="text-gray-400 text-lg mb-2">Chọn một cuộc trò chuyện để bắt đầu</p>
                                        <p className="text-gray-500 text-sm">Tin nhắn sẽ được hiển thị ở đây</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PTChat;
