import React, { useEffect, useMemo, useRef, useState } from "react";
import api, { workoutAPI } from '../services/api';
import { authUtils } from '../utils/auth';
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import chatService from '../services/chat.service';
import './Exercises.css';

const InlineChatView = ({ roomId, recipient, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUser = authUtils.getUser();

    const senderId = (s) => (s?._id || s?.id || s || null);

    useEffect(() => {
        if (!roomId) return;
        if (!chatService.isConnected) chatService.connect();

        chatService.joinRoom(roomId);
        chatService.markRead(roomId);
        loadMessages();

        const handleNewMessage = (message) => {
            if (message.room !== roomId) return;

            const incomingSender = senderId(message.sender);

            setMessages(prev => {
                const exists = prev.some(m =>
                    m._id === message._id ||
                    (m._id?.startsWith('temp_') &&
                        m.message === message.message &&
                        senderId(m.sender) === incomingSender)
                );

                if (exists) {
                    return prev.map(m =>
                        (m._id?.startsWith('temp_') &&
                            m.message === message.message &&
                            senderId(m.sender) === incomingSender)
                            ? message
                            : m
                    );
                }

                return [...prev, message];
            });

            chatService.markRead(roomId);
        };
        const handleUserTyping = (data) => {
            if (data.roomId === roomId && data.userId !== currentUser?._id) setTyping(true);
        };
        const handleUserStopTyping = (data) => {
            if (data.roomId === roomId) setTyping(false);
        };

        chatService.on('new-message', handleNewMessage);
        chatService.on('user-typing', handleUserTyping);
        chatService.on('user-stop-typing', handleUserStopTyping);
        return () => {
            chatService.off('new-message', handleNewMessage);
            chatService.off('user-typing', handleUserTyping);
            chatService.off('user-stop-typing', handleUserStopTyping);
        };
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await chatService.getChatMessages(roomId, { limit: 50 });
            const msgs = response?.data || response || [];
            setMessages(msgs);
        } catch (error) {
            console.error('[InlineChat] Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        try {
            setSending(true);
            const text = newMessage.trim();
            const currentUserId = authUtils.getUserId();
            setMessages(prev => [...prev, {
                _id: `temp_${Date.now()}`,
                message: text,
                sender: { _id: currentUserId || currentUser?._id || senderId(currentUser), hoTen: currentUser?.hoTen },
                room: roomId,
                createdAt: new Date().toISOString()
            }]);
            setNewMessage('');
            chatService.sendMessage(roomId, text);
            chatService.stopTyping(roomId);
        } catch (error) {
            console.error('[InlineChat] Error sending:', error);
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        chatService.typing(roomId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => chatService.stopTyping(roomId), 1500);
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const grouped = useMemo(() => {
        const groups = {};
        messages.forEach(m => {
            const key = formatDate(m.createdAt);
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [messages]);

    const phoneLabel = useMemo(() => {
        const phone =
            recipient?.sdt ||
            recipient?.soDienThoai ||
            recipient?.phone ||
            recipient?.phoneNumber ||
            '';
        return phone || null;
    }, [recipient]);

    const branchLabel = useMemo(() => {
        return (
            recipient?.chiNhanh?.tenChiNhanh ||
            recipient?.chiNhanh?.ten ||
            recipient?.branchName ||
            recipient?.tenChiNhanh ||
            null
        );
    }, [recipient]);

    return (
        <div className="flex flex-col h-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#da2128] flex items-center justify-center text-white font-semibold">
                        {recipient?.anhDaiDien ? (
                            <img src={recipient.anhDaiDien} alt={recipient.hoTen} className="w-full h-full object-cover" />
                        ) : (
                            (recipient?.hoTen || 'PT')[0]
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <div className="text-white font-semibold leading-tight">{recipient?.hoTen || 'Huấn luyện viên'}</div>
                        {(phoneLabel || branchLabel) && (
                            <div className="text-xs text-gray-300 space-x-2 leading-tight">
                                {phoneLabel && <span>SĐT: {phoneLabel}</span>}
                                {branchLabel && <span>• CN: {branchLabel}</span>}
                            </div>
                        )}
                        {typing && <div className="text-xs text-gray-300 leading-tight">Đang nhập...</div>}
                    </div>
                </div>
                <button onClick={onClose} className="text-sm text-gray-300 hover:text-white px-3 py-1 border border-[#2a2a2a] rounded-lg">
                    Đóng
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Đang tải tin nhắn...</div>
                ) : (
                    Object.entries(grouped).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center justify-center my-2">
                                <span className="text-xs text-gray-400 px-3 py-1 rounded-full bg-[#1a1a1a]">{date}</span>
                            </div>
                            <div className="space-y-2">
                                {msgs.map((m) => {
                                    const currentUserId = authUtils.getUserId();
                                    const isOwn = !!currentUserId && senderId(m.sender) === currentUserId;
                                    return (
                                        <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${isOwn
                                                    ? 'bg-[#da2128] text-white rounded-br-sm'
                                                    : 'bg-[#1f1f1f] text-gray-100 rounded-bl-sm'
                                                    }`}
                                            >
                                                <div className="text-sm break-words leading-snug">{m.message}</div>
                                                <div className={`text-[11px] mt-1 ${isOwn ? 'text-red-100' : 'text-gray-400'}`}>
                                                    {formatTime(m.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-2">
                    <input
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-3 py-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#da2128]"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-[#da2128] text-white rounded-full hover:bg-[#b81d23] disabled:opacity-50"
                    >
                        Gửi
                    </button>
                </div>
            </form>
        </div>
    );
};

const ChatWithPT = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [ptSessionsMap, setPtSessionsMap] = useState({});
    const [ptSessionsLoading, setPtSessionsLoading] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [chatRoomsLoading, setChatRoomsLoading] = useState(false);
    const [selectedPT, setSelectedPT] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchPhone, setSearchPhone] = useState('');
    const [searchingPT, setSearchingPT] = useState(false);
    const [searchResultPT, setSearchResultPT] = useState(null);

    useEffect(() => {
        const handleSidebarToggle = (event) => setSidebarCollapsed(event.detail.collapsed);
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (!chatService.isConnected) chatService.connect();

        const handleNewMessage = (message) => {
            const currentUser = authUtils.getUser();
            if (message.sender._id !== currentUser?._id && message.sender !== currentUser?._id) {
                if (!chatRoom || chatRoom._id !== message.room) {
                    setUnreadCount((prev) => prev + 1);
                }
            }
        };

        chatService.on('new-message', handleNewMessage);
        return () => chatService.off('new-message', handleNewMessage);
    }, [chatRoom]);

    useEffect(() => {
        const loadMemberSessionsWithPT = async () => {
            const memberId = authUtils.getUserId();
            if (!memberId) return;
            setPtSessionsLoading(true);
            try {
                const response = await workoutAPI.getWorkoutSessions(memberId);
                const sessions = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
                const map = {};
                sessions.forEach((session) => {
                    const ptRaw = session.ptPhuTrach || session.pt || session.ptDuocChon || session.trainer;
                    const ptId = (ptRaw && ptRaw._id) || (typeof ptRaw === 'string' ? ptRaw : null);
                    if (!ptRaw || !ptId || typeof ptRaw !== 'object') return;
                    const normalizedPt = {
                        _id: ptId,
                        hoTen: ptRaw.hoTen || ptRaw.tenPT || 'Huấn luyện viên',
                        anhDaiDien: ptRaw.anhDaiDien || ptRaw.avatar || ptRaw.imageUrl || null,
                        chuyenMon: ptRaw.chuyenMon || ptRaw.specialty || 'PT cá nhân',
                        sdt: ptRaw.sdt || ptRaw.soDienThoai || ptRaw.phone || ptRaw.phoneNumber || '',
                        chiNhanh: ptRaw.chiNhanh || ptRaw.branch || ptRaw.branchId || null
                    };
                    const normalizedSession = {
                        _id: session._id || session.id,
                        tenBuoiTap: session.tenBuoiTap || session.ten || session.buoiTap?.tenBuoiTap || 'Buổi tập',
                        ngayTap: session.ngayTap || session.ngay || session.buoiTap?.ngayTap || session.thoiGian || null,
                        gioBatDau: session.gioBatDau || session.gioBatdau || session.buoiTap?.gioBatDau || null,
                        gioKetThuc: session.gioKetThuc || session.buoiTap?.gioKetThuc || null,
                        trangThai: session.trangThai || session.status || session.buoiTap?.trangThai || 'Đã đăng ký',
                        chiNhanh: session.chiNhanh?.tenChiNhanh || session.buoiTap?.chiNhanh?.tenChiNhanh || null,
                        phongTap: session.phongTap || session.buoiTap?.phongTap || null,
                    };
                    if (!map[ptId]) map[ptId] = { pt: normalizedPt, sessions: [] };
                    map[ptId].sessions.push(normalizedSession);
                });
                setPtSessionsMap(map);
            } catch (error) {
                console.error('[Exercises] Không thể tải buổi tập đã đăng ký:', error);
            } finally {
                setPtSessionsLoading(false);
            }
        };
        loadMemberSessionsWithPT();
    }, []);

    useEffect(() => {
        const loadChatRooms = async () => {
            setChatRoomsLoading(true);
            try {
                const res = await chatService.getChatRooms();
                const rooms = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
                setChatRooms(rooms);
                const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
                setUnreadCount(totalUnread);
            } catch (err) {
                console.error('[Exercises] Không thể tải danh sách chat:', err);
            } finally {
                setChatRoomsLoading(false);
            }
        };
        loadChatRooms();
    }, []);

    const conversations = useMemo(() => {
        const items = [];
        Object.values(ptSessionsMap).forEach(({ pt, sessions }) => {
            items.push({
                type: 'session-pt',
                pt,
                sessionCount: sessions.length,
                lastSession: sessions[0],
                lastMessage: null,
                unreadCount: 0,
                room: null
            });
        });
        chatRooms.forEach(room => {
            const pt = room.pt || room.hoiVien || room.user || room.otherUser;
            if (!pt) return;
            const ptId = pt._id || pt.id;
            const existing = items.find(i => i.pt._id === ptId);
            if (existing) {
                existing.room = room;
                existing.lastMessage = room.lastMessage;
                existing.unreadCount = room.unreadCount || 0;
            } else {
                items.push({
                    type: 'chat-room',
                    pt: {
                        _id: ptId,
                        hoTen: pt.hoTen || pt.tenPT || 'Huấn luyện viên',
                        anhDaiDien: pt.anhDaiDien || pt.avatar || pt.imageUrl || null,
                        chuyenMon: pt.chuyenMon || pt.specialty || 'PT cá nhân',
                        sdt: pt.sdt || pt.soDienThoai || pt.phone || pt.phoneNumber || '',
                        chiNhanh: pt.chiNhanh || pt.branch || pt.branchId || null
                    },
                    sessionCount: 0,
                    lastSession: null,
                    lastMessage: room.lastMessage,
                    unreadCount: room.unreadCount || 0,
                    room
                });
            }
        });
        return items.sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0));
    }, [ptSessionsMap, chatRooms]);

    const handleSelectConversation = async (item) => {
        const pt = item.pt;
        if (!pt?._id) return;
        try {
            if (!chatService.isConnected) chatService.connect();
            const res = await chatService.getOrCreateRoom(pt._id);
            const room = res?.data || res;
            setSelectedPT(pt);
            setChatRoom(room);
            setUnreadCount((prev) => Math.max(prev - (item.unreadCount || 0), 0));
        } catch (error) {
            console.error('Không thể mở chat:', error);
            alert('Không thể mở chat. Vui lòng thử lại.');
        }
    };

    const handleSearchPTByPhone = async () => {
        const phone = (searchPhone || '').trim();
        if (!phone) return;
        try {
            setSearchingPT(true);
            setSearchResultPT(null);
            const res = await api.api.get(`/user/pt?sdt=${encodeURIComponent(phone)}`);

            const list = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : (res?.data && !Array.isArray(res.data) ? [res.data] : []);

            const normalizePhone = (p) => (p || '').replace(/\D/g, '');
            const target = normalizePhone(phone);

            const matched = list.find((pt) => {
                const candidate =
                    normalizePhone(pt?.sdt) ||
                    normalizePhone(pt?.soDienThoai) ||
                    normalizePhone(pt?.phone) ||
                    normalizePhone(pt?.phoneNumber);
                return candidate && candidate === target;
            });

            if (matched) {
                setSearchResultPT(matched);
            } else {
                alert('Không tìm thấy PT với số điện thoại này.');
            }
        } catch (err) {
            console.error('[ChatWithPT] Tìm PT theo số điện thoại lỗi:', err);
            alert('Không tìm thấy PT. Vui lòng kiểm tra lại số điện thoại.');
        } finally {
            setSearchingPT(false);
        }
    };

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`min-h-screen bg-[#0a0a0a] w-full transition-all ${sidebarCollapsed ? 'lg:pl-6' : 'lg:pl-[260px] xl:pl-[300px]'}`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    <div className="text-white text-2xl font-bold mb-2">Chat với PT</div>
                    <div className="text-gray-400 text-sm mb-6">Danh sách PT bạn đã tập và lịch sử chat</div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-4 flex flex-col h-[70vh] sm:h-[74vh] lg:h-[78vh]">
                            <div className="flex items-center gap-2">
                                <input
                                    value={searchPhone}
                                    onChange={(e) => setSearchPhone(e.target.value)}
                                    placeholder="Tìm PT theo số điện thoại"
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#da2128]"
                                />
                                <button
                                    onClick={handleSearchPTByPhone}
                                    disabled={searchingPT}
                                    className="px-3 py-2 bg-[#da2128] text-white rounded-lg text-sm hover:bg-[#b81d23] disabled:opacity-50"
                                >
                                    Tìm
                                </button>
                            </div>

                            {searchResultPT && (
                                <div className="mt-3 p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={searchResultPT.anhDaiDien || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                                            alt={searchResultPT.hoTen}
                                            className="w-10 h-10 rounded-md object-cover"
                                        />
                                        <div>
                                            <div className="text-white font-semibold">{searchResultPT.hoTen}</div>
                                            <div className="text-xs text-gray-400">{searchResultPT.chuyenMon || 'PT cá nhân'}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectConversation({ pt: searchResultPT, sessionCount: 0, lastSession: null, lastMessage: null, unreadCount: 0 })}
                                        className="px-3 py-1.5 text-sm bg-[#da2128] text-white rounded-lg hover:bg-[#b81d23]"
                                    >
                                        Chat
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-4 mb-2">
                                <div className="text-sm text-gray-300">PT của bạn</div>
                                <div className="text-xs text-gray-500">
                                    {chatRoomsLoading || ptSessionsLoading ? 'Đang tải...' : `${conversations.length} PT`}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {conversations.length === 0 && !chatRoomsLoading && !ptSessionsLoading && (
                                    <div className="text-gray-500 text-sm">Chưa có PT hoặc hội thoại nào.</div>
                                )}

                                {conversations.map((item) => {
                                    const lastText = item.lastMessage?.message || item.lastSession?.tenBuoiTap || 'Bấm để chat';
                                    return (
                                        <button
                                            key={item.pt._id}
                                            onClick={() => handleSelectConversation(item)}
                                            className="w-full text-left p-3 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#2a2a2a] transition flex gap-3"
                                        >
                                            <img
                                                src={item.pt.anhDaiDien || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                                                alt={item.pt.hoTen}
                                                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-white font-semibold truncate">{item.pt.hoTen}</div>
                                                    {item.unreadCount > 0 && (
                                                        <span className="bg-[#da2128] text-white text-[11px] px-2 py-0.5 rounded-full">{item.unreadCount}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    {lastText}
                                                </div>
                                                {item.sessionCount > 0 && (
                                                    <div className="text-[11px] text-gray-500 mt-1">Đã tập cùng bạn: {item.sessionCount} buổi</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-4 h-[70vh] sm:h-[74vh] lg:h-[78vh]">
                            {selectedPT && chatRoom ? (
                                <InlineChatView
                                    roomId={chatRoom._id}
                                    recipient={selectedPT}
                                    onClose={() => {
                                        setSelectedPT(null);
                                        setChatRoom(null);
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Chọn PT ở danh sách bên trái để bắt đầu chat.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatWithPT;

