import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minus } from 'lucide-react';
import chatService from '../../services/chat.service';
import { authUtils } from '../../utils/auth';

const ChatWindowPopup = ({ roomId, recipient, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    console.log('[ChatWindowPopup] Rendered with:', { roomId, recipient });

    useEffect(() => {
        if (roomId) {
            console.log('[ChatWindowPopup] Room ID changed, loading messages...');
            loadMessages();
            joinRoom();

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

    // Mark read khi mở rộng chat từ trạng thái minimize
    useEffect(() => {
        if (!isMinimized && roomId) {
            chatService.markRead(roomId);
        }
    }, [isMinimized, roomId]);

    const joinRoom = () => {
        chatService.joinRoom(roomId);
        chatService.markRead(roomId);
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            console.log('[ChatWindowPopup] Loading messages for room:', roomId);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            const response = await Promise.race([
                chatService.getChatMessages(roomId, { limit: 50 }),
                timeoutPromise
            ]);
            console.log('[ChatWindowPopup] Messages loaded:', response);
            if (response && response.success && response.data) {
                setMessages(response.data);
                console.log('[ChatWindowPopup] Set messages:', response.data.length);
            } else {
                console.log('[ChatWindowPopup] No messages or invalid response');
                setMessages([]);
            }
        } catch (error) {
            console.error('[ChatWindowPopup] Error loading messages:', error);
            setMessages([]);
        } finally {
            console.log('[ChatWindowPopup] Loading finished');
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        const currentUser = authUtils.getUser();
        if (message.room === roomId) {
            setMessages(prev => {
                // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh duplicate từ optimistic update)
                const exists = prev.some(m =>
                    m._id === message._id ||
                    (m._id.startsWith('temp_') && m.message === message.message && m.sender._id === message.sender._id)
                );

                if (exists) {
                    // Thay thế tin nhắn tạm (optimistic) bằng tin nhắn thật từ server
                    return prev.map(m =>
                        (m._id.startsWith('temp_') && m.message === message.message && m.sender._id === message.sender._id)
                            ? message
                            : m
                    );
                }

                // Tin nhắn mới từ người khác
                return [...prev, message];
            });

            // Mark read nếu không phải tin nhắn của mình VÀ chat không bị minimize
            if (message.sender._id !== currentUser?._id && !isMinimized) {
                chatService.markRead(roomId);
            }
        }
    };

    const handleUserTyping = (data) => {
        const currentUser = authUtils.getUser();
        if (data.roomId === roomId && data.userId !== currentUser?._id) {
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

        const messageText = newMessage.trim();
        const tempId = 'temp_' + Date.now();
        const currentUser = authUtils.getUser();

        try {
            setSending(true);

            // Optimistic UI update - add message immediately
            const optimisticMessage = {
                _id: tempId,
                message: messageText,
                sender: {
                    _id: currentUser?._id,
                    hoTen: currentUser?.hoTen
                },
                room: roomId,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            setMessages(prev => [...prev, optimisticMessage]);
            setNewMessage('');

            // Send to server
            chatService.sendMessage(roomId, messageText);
            chatService.stopTyping(roomId);

            console.log('[ChatWindowPopup] Message sent:', messageText);
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally: remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        chatService.typing(roomId);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

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
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col shadow-2xl rounded-lg overflow-hidden bg-[#141414] transition-all duration-300"
            style={{
                width: '380px',
                height: isMinimized ? '60px' : '600px',
                maxHeight: '90vh'
            }}
        >
            {/* Header */}
            <div className="bg-[#da2128] p-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {recipient?.anhDaiDien ? (
                            <img src={recipient.anhDaiDien} alt={recipient.hoTen} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    {recipient?.hoTen ? recipient.hoTen.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{recipient?.hoTen || 'Chat'}</h3>
                        {!isMinimized && typing && <p className="text-white/80 text-xs">Đang nhập...</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                        aria-label={isMinimized ? "Mở rộng" : "Thu nhỏ"}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                        aria-label="Đóng chat"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages - Hidden when minimized */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-3 bg-[#1a1a1a]" style={{ minHeight: 0 }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da2128]"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-sm">Chưa có tin nhắn nào</p>
                                <p className="text-xs mt-1">Gửi tin nhắn để bắt đầu trò chuyện</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(messageGroups).map(([date, msgs]) => (
                                    <div key={date}>
                                        <div className="flex items-center justify-center mb-3">
                                            <span className="bg-[#2a2a2a] px-3 py-1 rounded-full text-xs text-gray-400 shadow-sm">
                                                {date}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {msgs.map((message, index) => {
                                                const currentUser = authUtils.getUser();
                                                const isOwn = message.sender?._id === currentUser?._id || message.sender === currentUser?._id;
                                                
                                                // Kiểm tra xem tin nhắn trước có cùng người gửi không
                                                const prevMessage = index > 0 ? msgs[index - 1] : null;
                                                const prevIsOwn = prevMessage ? (prevMessage.sender?._id === currentUser?._id || prevMessage.sender === currentUser?._id) : null;
                                                const showAvatar = !isOwn && (prevIsOwn !== false); // Hiện avatar nếu tin nhắn trước là của mình hoặc là tin nhắn đầu tiên
                                                
                                                // Kiểm tra thời gian với tin nhắn sau (thay vì tin nhắn trước)
                                                const currentTime = formatTime(message.createdAt);
                                                const nextMessage = index < msgs.length - 1 ? msgs[index + 1] : null;
                                                const nextTime = nextMessage ? formatTime(nextMessage.createdAt) : null;
                                                const showTime = currentTime !== nextTime; // Hiện thời gian nếu khác với tin nhắn sau hoặc là tin nhắn cuối
                                                
                                                return (
                                                    <div
                                                        key={message._id}
                                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            {!isOwn && (
                                                                showAvatar ? (
                                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                                                        {message.sender?.anhDaiDien ? (
                                                                            <img 
                                                                                src={message.sender.anhDaiDien} 
                                                                                alt={message.sender.hoTen} 
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-[#da2128] flex items-center justify-center">
                                                                                {message.sender?.hoTen ? message.sender.hoTen.charAt(0).toUpperCase() : 'U'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-7 h-7 flex-shrink-0"></div>
                                                                )
                                                            )}
                                                            <div>
                                                                <div
                                                                    className={`rounded-2xl px-3 py-2 ${isOwn
                                                                        ? 'bg-[#da2128] text-white'
                                                                        : 'bg-[#2a2a2a] text-white shadow-sm'
                                                                        }`}
                                                                >
                                                                    <p className="text-sm break-words text-white">{message.message}</p>
                                                                </div>
                                                                {showTime && (
                                                                    <p className={`text-xs text-white mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                                        {currentTime}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-[#0a0a0a] border-t border-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 px-3 py-2 text-sm bg-[#1a1a1a] text-white border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#da2128] focus:border-transparent placeholder-gray-500"
                                disabled={sending}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="bg-[#da2128] text-white rounded-full p-2 hover:bg-[#c11f24] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatWindowPopup;
