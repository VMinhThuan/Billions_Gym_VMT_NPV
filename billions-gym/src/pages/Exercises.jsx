import React, { useState, useEffect } from "react";
import api, { apiRequest } from '../services/api';
import { authUtils } from '../utils/auth';
import './Exercises.css';
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ChatWindowPopup from "../components/chat/ChatWindowPopup";
import chatService from '../services/chat.service';

const VISIBLE_COUNT = 4;
const MAX_CACHE_ITEMS = 20;

const sanitizeForStorage = (items, fields) => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, MAX_CACHE_ITEMS).map(item => {
        const sanitized = {};
        fields.forEach(field => {
            if (item[field] !== undefined) {
                sanitized[field] = item[field];
            }
        });
        return sanitized;
    });
};

const safeSetStorage = (key, data, fields = null) => {
    try {
        let dataToStore = data;

        if (fields && Array.isArray(data)) {
            dataToStore = sanitizeForStorage(data, fields);
        } else if (Array.isArray(data)) {
            dataToStore = data.slice(0, MAX_CACHE_ITEMS);
        }

        const jsonString = JSON.stringify(dataToStore);
        const sizeInMB = new Blob([jsonString]).size / 1024 / 1024;

        if (sizeInMB > 4) {
            console.warn(`Data too large for localStorage (${sizeInMB.toFixed(2)}MB), skipping cache for key: ${key}`);
            return;
        }

        localStorage.setItem(key, jsonString);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.warn(`localStorage quota exceeded for key: ${key}. Attempting to clear old cache...`);
            try {
                localStorage.removeItem(key);
                if (fields && Array.isArray(data)) {
                    const smallerData = sanitizeForStorage(data.slice(0, 10), fields);
                    localStorage.setItem(key, JSON.stringify(smallerData));
                }
            } catch (e2) {
                console.warn(`Failed to save to localStorage for key: ${key}`, e2.message);
            }
        } else {
            console.warn(`Failed to save to localStorage for key: ${key}`, e.message);
        }
    }
};

const Exercises = () => {
    const [workoutData, setWorkoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [templates, setTemplates] = useState([]); // playlists / templates
    const [banners, setBanners] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [pts, setPts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [selectedPT, setSelectedPT] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Lưu trữ video đã xem - sẽ fetch từ backend
    const [watchedExercises, setWatchedExercises] = useState({});
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    // Fetch watch progress từ backend
    useEffect(() => {
        const fetchWatchProgress = async () => {
            console.log('🔄 Bắt đầu load tiến độ...');

            try {
                setIsLoadingProgress(true);

                // Kiểm tra xem user đã đăng nhập chưa
                const token = localStorage.getItem('token');
                console.log('🔑 Token:', token ? 'Có' : 'Không có');

                if (!token) {
                    console.log('⚠️ Chưa đăng nhập - Tiến độ sẽ không được lưu giữa các thiết bị');
                    setIsLoadingProgress(false);
                    return;
                }

                // Load từ localStorage trước (nhanh, luôn có)
                const result = {};
                try {
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('watched_exercises_')) {
                            const templateId = key.replace('watched_exercises_', '');
                            const watchedArray = JSON.parse(localStorage.getItem(key) || '[]');
                            result[templateId] = new Set(watchedArray);
                        }
                    });
                    console.log('✅ Đã tải tiến độ từ localStorage:', Object.keys(result).length, 'templates');
                } catch (e) {
                    console.warn('⚠️ Không thể load từ localStorage:', e);
                }

                // Nếu đã đăng nhập, load từ backend và merge
                if (token) {
                    try {
                        console.log('📡 Đang gọi API backend...');
                        const response = await api.api.get('/watch-history');

                        if (response && response.data) {
                            // Convert array format to Set format và merge với localStorage
                            const progressData = response.data;
                            Object.keys(progressData).forEach(templateId => {
                                const backendArray = progressData[templateId] || [];
                                if (result[templateId]) {
                                    // Merge: kết hợp cả local và backend
                                    backendArray.forEach(id => result[templateId].add(id));
                                } else {
                                    result[templateId] = new Set(backendArray);
                                }
                            });
                            console.log('✅ Đã merge tiến độ từ backend:', Object.keys(progressData).length, 'templates');
                        }
                    } catch (e) {
                        console.warn('⚠️ Không thể load từ backend (sử dụng local):', e);
                        // Không hiển thị alert - chỉ dùng localStorage
                    }
                }

                setWatchedExercises(result);
                console.log('📈 Tổng số template có tiến độ:', Object.keys(result).length);
            } catch (e) {
                console.error('❌ Lỗi khi load tiến độ:', e);
            } finally {
                setIsLoadingProgress(false);
            }
        };

        fetchWatchProgress();
    }, []);

    // Đánh dấu video đã xem - Lưu vào backend và localStorage (fallback)
    const markAsWatched = async (templateId, exerciseId) => {
        console.log('🎯 Đánh dấu đã xem:', { templateId, exerciseId });

        // Cập nhật UI ngay lập tức (optimistic update)
        setWatchedExercises(prev => {
            const updated = { ...prev };
            if (!updated[templateId]) {
                updated[templateId] = new Set();
            }
            updated[templateId].add(exerciseId);
            return updated;
        });

        // Lưu vào localStorage làm fallback (luôn lưu để không mất dữ liệu)
        try {
            const storageKey = `watched_exercises_${templateId}`;
            const existing = localStorage.getItem(storageKey);
            const watchedSet = existing ? new Set(JSON.parse(existing)) : new Set();
            watchedSet.add(exerciseId);
            localStorage.setItem(storageKey, JSON.stringify([...watchedSet]));
            console.log('✅ Đã lưu vào localStorage');
        } catch (e) {
            console.warn('⚠️ Không thể lưu vào localStorage:', e);
        }

        // Lưu vào backend nếu có token (silent - không hiển thị lỗi nếu fail)
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Sử dụng dontClearTokenOn401=true để không bị logout khi lỗi 401
                // Vì watch-history là endpoint không critical, có thể fail mà không ảnh hưởng app
                const response = await apiRequest('/watch-history/mark', {
                    method: 'POST',
                    body: JSON.stringify({
                        templateId,
                        exerciseId
                    }),
                    requireAuth: true,
                    dontClearTokenOn401: true // Không xóa token khi 401 - để user không bị logout
                });
                console.log('✅ Đã lưu tiến độ vào backend:', response);
            } catch (e) {
                console.error('❌ Không thể lưu tiến độ vào backend:', e);

                // Nếu lỗi 401, token không bị xóa nhờ dontClearTokenOn401=true
                // Chỉ log warning, không làm phiền user
                if (e.message && (e.message.includes('Session expired') || e.message.includes('Unauthorized'))) {
                    console.warn('⚠️ Không thể lưu tiến độ vào backend - Tiến độ đã được lưu local, sẽ sync khi có thể');
                }

                // KHÔNG rollback UI - giữ nguyên trạng thái đã click
                // Dữ liệu đã được lưu trong localStorage
            }
        } else {
            console.log('ℹ️ Chưa đăng nhập - Tiến độ chỉ được lưu local');
        }
    };

    // Hàm tính % tiến độ đã xem
    const getProgress = (template) => {
        const totalVideos = (template.baiTap && template.baiTap.length) || 0;
        if (totalVideos === 0) return 0;

        const watchedSet = watchedExercises[template._id];
        const watchedCount = watchedSet ? watchedSet.size : 0;
        const percentage = Math.round((watchedCount / totalVideos) * 100);
        return Math.min(percentage, 100);
    };

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);

        return () => {
            window.removeEventListener('sidebar:toggle', handleSidebarToggle);
        };
    }, []);

    // Lắng nghe tin nhắn mới từ PT
    useEffect(() => {
        chatService.connect();

        const handleNewMessage = (message) => {
            console.log('[Exercises] New message received:', message);

            const currentUser = authUtils.getUser();

            // Chỉ cập nhật unread nếu:
            // 1. Không phải tin nhắn của mình
            // 2. Không đang mở chat HOẶC đang mở chat nhưng không phải room này
            if (message.sender._id !== currentUser?._id && message.sender !== currentUser?._id) {
                if (!showChat || (chatRoom && chatRoom._id !== message.room)) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        };

        chatService.on('new-message', handleNewMessage);

        // Load unread count khi component mount
        const loadUnreadCount = async () => {
            try {
                const response = await chatService.getChatRooms();
                if (response.success && response.data.length > 0) {
                    const totalUnread = response.data.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
                    setUnreadCount(totalUnread);
                }
            } catch (error) {
                console.error('[Exercises] Error loading unread count:', error);
            }
        };

        loadUnreadCount();

        return () => {
            chatService.off('new-message', handleNewMessage);
        };
    }, [showChat, chatRoom]);

    useEffect(() => {
        const load = async () => {
            try {
                const cachedTpl = localStorage.getItem('workout_templates');
                const cachedPts = localStorage.getItem('workout_trainers');
                if (cachedTpl) {
                    try {
                        const parsed = JSON.parse(cachedTpl);
                        if (Array.isArray(parsed)) {
                            setTemplates(parsed);
                            setBanners(parsed.slice(0, 2));
                        }
                    } catch (e) {
                        console.warn('Failed to parse cached templates:', e.message);
                        localStorage.removeItem('workout_templates');
                    }
                }
                if (cachedPts) {
                    try {
                        const parsedPts = JSON.parse(cachedPts);
                        if (Array.isArray(parsedPts)) {
                            setPts(parsedPts.slice(0, 6));
                        }
                    } catch (e) {
                        console.warn('Failed to parse cached trainers:', e.message);
                        localStorage.removeItem('workout_trainers');
                    }
                }
            } catch (e) {
                console.warn('Failed to load from localStorage:', e.message);
            }

            setLoading(true);
            try {
                const user = authUtils.getUser();
                let branchId = null;

                // Thử lấy từ cache trước (nhanh nhất)
                const cachedBranchId = localStorage.getItem('user_branchId');
                if (cachedBranchId) {
                    branchId = cachedBranchId;
                } else {
                    // Thử lấy từ user object
                    if (user?.maChiNhanh) {
                        branchId = user.maChiNhanh;
                    } else if (user?.chiNhanh?._id) {
                        branchId = user.chiNhanh._id;
                    }

                    // Cache branchId nếu tìm thấy
                    if (branchId) {
                        localStorage.setItem('user_branchId', branchId);
                    }
                }

                // Load templates và PT ngay lập tức (không đợi active package)
                // Nếu có branchId thì filter, không có thì load tất cả
                const ptApiUrl = branchId ? `/user/pt?branchId=${branchId}` : '/user/pt';
                console.log('📡 Loading PT for branchId:', branchId || 'all');

                // Load song song: templates, PT, và active package (nếu cần)
                const loadPromises = [
                    api.api.get('/session-templates/public'),
                    api.api.get(ptApiUrl)
                ];

                // Chỉ load active package nếu chưa có branchId và có user._id
                if (!branchId && user?._id) {
                    loadPromises.push(
                        api.api.get(`/chitietgoitap/hoi-vien/${user._id}/active`)
                            .then(activePackage => {
                                let foundBranchId = null;
                                if (activePackage?.branchId?._id) {
                                    foundBranchId = activePackage.branchId._id;
                                } else if (activePackage?.branchId) {
                                    foundBranchId = typeof activePackage.branchId === 'string'
                                        ? activePackage.branchId
                                        : activePackage.branchId._id;
                                }
                                if (foundBranchId) {
                                    localStorage.setItem('user_branchId', foundBranchId);
                                    return foundBranchId;
                                }
                                return null;
                            })
                            .catch(e => {
                                console.warn('Không thể load active package để lấy branchId:', e);
                                return null;
                            })
                    );
                }

                const results = await Promise.all(loadPromises);
                const tplResponse = results[0];
                const trainersResponse = results[1];
                const newBranchId = results[2] || null;

                // Xử lý templates trước (không phụ thuộc branchId)
                let tpl = [];
                if (tplResponse) {
                    if (Array.isArray(tplResponse)) {
                        tpl = tplResponse;
                    } else if (tplResponse.data) {
                        tpl = Array.isArray(tplResponse.data) ? tplResponse.data : [];
                    } else if (tplResponse.success && Array.isArray(tplResponse.data)) {
                        tpl = tplResponse.data;
                    }
                }

                if (Array.isArray(tpl) && tpl.length > 0) {
                    setTemplates(tpl);
                    setBanners(tpl.slice(0, 2));
                    safeSetStorage('workout_templates', tpl, ['_id', 'ten', 'moTa', 'hinhAnh']);
                }

                // Xử lý trainers
                let trainers = [];
                if (trainersResponse) {
                    if (Array.isArray(trainersResponse)) {
                        trainers = trainersResponse;
                    } else if (trainersResponse.data) {
                        trainers = Array.isArray(trainersResponse.data) ? trainersResponse.data : [];
                    } else if (trainersResponse.success && Array.isArray(trainersResponse.data)) {
                        trainers = trainersResponse.data;
                    }
                }

                // Nếu có branchId mới từ active package và đã load PT tất cả, reload PT với filter (async, không block)
                if (!branchId && newBranchId && trainers.length > 0) {
                    // Set PT tất cả trước để UI hiển thị ngay
                    setPts(trainers.slice(0, 6));
                    safeSetStorage('workout_trainers', trainers, ['_id', 'hoTen', 'chuyenMon']);

                    // Reload PT với filter sau (không block UI)
                    console.log('📡 Found branchId from active package, reloading filtered PT in background...');
                    api.api.get(`/user/pt?branchId=${newBranchId}`)
                        .then(filteredTrainers => {
                            if (filteredTrainers) {
                                const filtered = Array.isArray(filteredTrainers)
                                    ? filteredTrainers
                                    : (filteredTrainers.data || []);
                                setPts(filtered.slice(0, 6));
                                safeSetStorage('workout_trainers', filtered, ['_id', 'hoTen', 'chuyenMon']);
                                console.log('✅ Đã cập nhật PT theo chi nhánh');
                            }
                        })
                        .catch(e => {
                            console.warn('Failed to reload filtered PT:', e);
                        });
                } else if (Array.isArray(trainers) && trainers.length > 0) {
                    // Nếu đã có branchId từ đầu hoặc không cần filter
                    setPts(trainers.slice(0, 6));
                    safeSetStorage('workout_trainers', trainers, ['_id', 'hoTen', 'chuyenMon']);
                }
            } catch (e) {
                console.error('Load workout page data failed', e);
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getVideoUrl = (exercise) => {
        if (!exercise) return null;

        if (exercise.type === 'external_link' && exercise.source_url) {
            if (exercise.source_url.includes('youtube.com') || exercise.source_url.includes('youtu.be')) {
                const videoId = exercise.source_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : exercise.source_url;
            }
            return exercise.source_url;
        }

        if (exercise.type === 'video_file' && exercise.file_url) {
            return exercise.file_url;
        }

        if (exercise.videoHuongDan) {
            if (exercise.videoHuongDan.includes('youtube.com') || exercise.videoHuongDan.includes('youtu.be')) {
                const videoId = exercise.videoHuongDan.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : exercise.videoHuongDan;
            }
            return exercise.videoHuongDan;
        }

        return null;
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = {
            'DE': 'Dễ',
            'TRUNG_BINH': 'Trung bình',
            'KHO': 'Khó'
        };
        return labels[difficulty] || difficulty;
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'DE': '#10b981',
            'TRUNG_BINH': '#f59e0b',
            'KHO': '#ef4444'
        };
        return colors[difficulty] || '#6b7280';
    };

    const handleTemplateClick = async (template) => {
        if (selectedTemplate?._id === template._id) {
            setSelectedTemplate(null);
            setSelectedExercise(null);
            setSearchTerm('');
            setFilterDifficulty('all');
            return;
        }

        try {
            const detail = await api.api.get(`/session-templates/public/${template._id}?populateExercises=true`);
            console.log('Template detail response:', detail);
            console.log('BaiTap array:', detail?.baiTap);
            setSelectedTemplate(detail);

            if (detail.baiTap && detail.baiTap.length > 0) {
                setSelectedExercise(detail.baiTap[0]);
            }
        } catch (e) {
            console.error('Error loading template:', e);
        }
    };

    const handleChatWithPT = async (pt) => {
        console.log('🔵 Starting chat with PT:', pt.hoTen);
        try {
            if (!chatService.socket || !chatService.socket.connected) {
                console.log('📡 WebSocket not connected, connecting...');
                await chatService.connect();
            }

            console.log('📞 Creating/getting chat room with PT ID:', pt._id);
            const response = await chatService.getOrCreateRoom(pt._id);
            console.log('✅ Chat room response:', response);

            const room = response.data; // Extract room from response.data
            console.log('✅ Chat room:', room);

            setSelectedPT(pt);
            setChatRoom(room);
            setShowChat(true);

            // Reset unread count khi mở chat
            setUnreadCount(0);
        } catch (error) {
            console.error('❌ Failed to open chat:', error);
            alert('Không thể mở chat. Vui lòng thử lại sau.');
        }
    };

    const handleCloseChat = () => {
        console.log('🔴 Closing chat window');
        setShowChat(false);
        setSelectedPT(null);
        setChatRoom(null);

        // Reset unread count khi đóng chat
        setUnreadCount(0);
    };

    const filteredExercises = selectedTemplate?.baiTap ? selectedTemplate.baiTap.filter(exercise => {
        const matchesSearch = !searchTerm || exercise.tenBaiTap?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || exercise.mucDoKho === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    }) : [];

    console.log('selectedTemplate:', selectedTemplate);
    console.log('filteredExercises:', filteredExercises);
    console.log('filteredExercises.length:', filteredExercises.length);

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`min-h-screen bg-[#0a0a0a] workout-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} pb-10`}>


                <div className="w-full flex gap-4 pl-8 pr-6 mt-12">
                    {banners.length ? banners.map((b, idx) => (
                        <div key={b._id || idx} className="flex-1 rounded-[30px] overflow-hidden relative h-56 bg-gradient-to-br from-[#017A56] to-[#015a40]">

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>

                            {/* Person Image - Right Side */}
                            <div className="absolute right-0 top-0 w-[70%] h-full overflow-hidden">
                                <img
                                    loading="eager"
                                    fetchPriority="high"
                                    src={'https://res.cloudinary.com/dfass7bhc/image/upload/v1762842662/de48232f90710658983c09dad3efc44947628647_jvweyr.png'}
                                    alt={b.ten}
                                    className="w-full h-full object-cover object-center"
                                    style={{ objectPosition: '45% center' }}
                                />
                            </div>

                            {/* Top Stats - Time & Calories */}
                            <div className="absolute top-3 left-5 flex items-center gap-2.5 z-10">
                                {/* Time */}
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span className="text-sm font-normal text-white">15min</span>
                                </div>

                                {/* Separator Dot */}
                                <div className="w-1 h-1 rounded-full bg-white/30"></div>

                                {/* Calories */}
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                                    <div className="w-[20px] h-[20px] flex items-center justify-center overflow-visible">
                                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="17" cy="17" r="17" fill="transparent" fillOpacity="0.3" />
                                            <mask id="mask0_43_2732" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="7" y="7" width="20" height="20">
                                                <rect x="7" y="7" width="20" height="20" fill="#D9D9D9" />
                                            </mask>
                                            <g mask="url(#mask0_43_2732)">
                                                <path d="M12.5 19C12.5 19.6389 12.6354 20.2465 12.9062 20.8229C13.1771 21.3993 13.5556 21.9097 14.0417 22.3542C14.0278 22.2847 14.0174 22.2153 14.0104 22.1458C14.0035 22.0764 14 22.0069 14 21.9375C14 21.5625 14.0694 21.2118 14.2083 20.8854C14.3472 20.559 14.5347 20.2639 14.7708 20L17 17.5L19.2292 20C19.4653 20.2778 19.6528 20.5799 19.7917 20.9062C19.9306 21.2326 20 21.5764 20 21.9375C20 22.0069 19.9965 22.0799 19.9896 22.1562C19.9826 22.2326 19.9722 22.3056 19.9583 22.375C20.4444 21.9722 20.8229 21.4757 21.0938 20.8854C21.3646 20.2951 21.5 19.6667 21.5 19C21.5 18.2917 21.3785 17.5938 21.1354 16.9062C20.8924 16.2188 20.5417 15.5833 20.0833 15C19.8472 15.1528 19.6007 15.2708 19.3438 15.3542C19.0868 15.4375 18.8056 15.4792 18.5 15.4792C17.7778 15.4792 17.1424 15.2569 16.5938 14.8125C16.0451 14.3681 15.7014 13.7917 15.5625 13.0833C15.0625 13.5417 14.625 14.0104 14.25 14.4896C13.875 14.9688 13.5556 15.4583 13.2917 15.9583C13.0278 16.4583 12.8299 16.9653 12.6979 17.4792C12.566 17.9931 12.5 18.5 12.5 19ZM17 19.75L15.8958 21C15.7708 21.1528 15.6736 21.309 15.6042 21.4688C15.5347 21.6285 15.5 21.8056 15.5 22C15.5 22.4167 15.6458 22.7708 15.9375 23.0625C16.2292 23.3542 16.5833 23.5 17 23.5C17.4167 23.5 17.7708 23.3542 18.0625 23.0625C18.3542 22.7708 18.5 22.4167 18.5 22C18.5 21.8056 18.4653 21.625 18.3958 21.4583C18.3264 21.2917 18.2292 21.1389 18.1042 21L17 19.75ZM17 10V12.4792C17 12.8958 17.1458 13.25 17.4375 13.5417C17.7292 13.8333 18.0833 13.9792 18.5 13.9792C18.7361 13.9792 18.9549 13.9306 19.1562 13.8333C19.3576 13.7361 19.5278 13.5972 19.6667 13.4167L20 13C20.8889 13.5278 21.6111 14.3507 22.1667 15.4688C22.7222 16.5868 23 17.7639 23 19C23 20.6667 22.4167 22.0833 21.25 23.25C20.0833 24.4167 18.6667 25 17 25C15.3333 25 13.9167 24.4167 12.75 23.25C11.5833 22.0833 11 20.6667 11 19C11 17.4444 11.5278 15.8715 12.5833 14.2812C13.6389 12.691 15.1111 11.2639 17 10Z" fill="white" />
                                            </g>
                                        </svg>
                                    </div>
                                    <span className="text-sm font-normal text-white">345kcal</span>
                                </div>
                            </div>

                            {/* Bottom Left Content */}
                            <div className="absolute left-3.5 bottom-6 z-10">
                                {/* Title */}
                                <h3 className="text-white font-semibold text-[26px] leading-tight mb-2.5" style={{ fontFamily: 'Raleway, sans-serif' }}>
                                    {b.ten || 'Body Weight'}
                                </h3>

                                {/* Subtitle & Badge */}
                                <div className="flex items-center gap-3">
                                    <span className="text-white text-sm font-normal" style={{ fontFamily: 'Raleway, sans-serif' }}>
                                        01 Lower Strength
                                    </span>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1">
                                        <span className="text-white text-xs font-bold" style={{ fontFamily: 'Raleway, sans-serif' }}>
                                            Intense
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Play Button - Bottom Right */}
                            <button
                                className="absolute bottom-6 right-8 w-[55px] h-[55px] rounded-[20px] bg-black border-[3px] border-white/20 flex items-center justify-center hover:bg-gray-900 transition-colors z-10"
                                onClick={() => {/* Handle play */ }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-1">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </button>
                        </div>
                    )) : (
                        <div className="flex-1 rounded-[30px] overflow-hidden relative h-56 bg-[#0a0a0a] animate-pulse"></div>
                    )}
                </div>

                {/* Playlists horizontal list */}
                <div className="w-full pl-8 pr-6 mt-6 pt-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-white text-xl mb-2">Các khóa học và bài tập phổ biến</h2>
                        <a className="text-sm text-[#da2128]" href="/courses">Xem tất cả</a>
                    </div>

                    <div className="mt-3">
                        <div className="flex flex-col gap-4 py-2 w-full">
                            {templates.slice(0, VISIBLE_COUNT).map(t => (
                                <div key={t._id} className="rounded-lg overflow-hidden shadow-sm bg-[#141414]">
                                    {/* Playlist Header - Always visible */}
                                    <div
                                        className="cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                                        onClick={() => handleTemplateClick(t)}
                                    >
                                        <div className="flex gap-4 p-3">
                                            <div className="h-24 w-40 flex-shrink-0 overflow-hidden relative bg-[#0b0b0b] rounded">
                                                <img loading="lazy" src={t.hinhAnh || ''} alt={t.ten} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="rounded-full w-10 h-10 bg-black bg-opacity-50 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 384" className="w-5 h-5 text-white fill-current" aria-hidden="true">
                                                            <path d="m0 43l235 149L0 341V43z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="absolute left-2 bottom-2 bg-black bg-opacity-40 text-white text-xs px-2 py-1 rounded">{(t.baiTap && t.baiTap.length) || 0} videos</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white text-base">{t.ten}</div>
                                                <div className="text-sm text-gray-400 mt-1">{t.moTa || 'Xem danh sách bài tập'}</div>

                                                {/* Progress Bar */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                                        <span>Tiến độ</span>
                                                        <span>{getProgress(t)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                        <div
                                                            className="bg-gradient-to-r from-[#da2128] to-[#ff3a3a] h-1.5 rounded-full transition-all duration-150 ease-out"
                                                            style={{ width: `${getProgress(t)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Expand/Collapse Icon */}
                                            <div className="flex items-center">
                                                <svg
                                                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${selectedTemplate?._id === t._id ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content - Dropdown */}
                                    {selectedTemplate?._id === t._id && (
                                        <div className="border-t border-gray-700 p-6 bg-[#1a1a1a]">
                                            {/* Search and Filter */}
                                            <div className="flex gap-3 mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm bài tập..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white placeholder-gray-500"
                                                />
                                                <select
                                                    value={filterDifficulty}
                                                    onChange={(e) => setFilterDifficulty(e.target.value)}
                                                    className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white cursor-pointer"
                                                >
                                                    <option value="all">Tất cả mức độ</option>
                                                    <option value="DE">Dễ</option>
                                                    <option value="TRUNG_BINH">Trung bình</option>
                                                    <option value="KHO">Khó</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                {/* Video Player */}
                                                <div className="lg:col-span-2">
                                                    {selectedExercise && getVideoUrl(selectedExercise) ? (
                                                        <div className="bg-[#0a0a0a] rounded-lg overflow-hidden">
                                                            {selectedExercise.type === 'external_link' ? (
                                                                <iframe
                                                                    src={getVideoUrl(selectedExercise)}
                                                                    title={selectedExercise.tenBaiTap}
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                    className="w-full aspect-video"
                                                                ></iframe>
                                                            ) : (
                                                                <video
                                                                    src={getVideoUrl(selectedExercise)}
                                                                    controls
                                                                    className="w-full aspect-video"
                                                                >
                                                                    Trình duyệt không hỗ trợ video.
                                                                </video>
                                                            )}
                                                            <div className="p-4">
                                                                <h4 className="text-white text-xl font-bold mb-2">{selectedExercise.tenBaiTap}</h4>
                                                                <div className="flex gap-3 mb-3 flex-wrap">
                                                                    {selectedExercise.mucDoKho && (
                                                                        <span
                                                                            className="px-3 py-1 rounded text-sm font-semibold"
                                                                            style={{ backgroundColor: getDifficultyColor(selectedExercise.mucDoKho), color: 'white' }}
                                                                        >
                                                                            {getDifficultyLabel(selectedExercise.mucDoKho)}
                                                                        </span>
                                                                    )}
                                                                    {selectedExercise.thoiGian && (
                                                                        <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded text-sm text-white font-medium shadow-sm">
                                                                            ⏱ {selectedExercise.thoiGian}s
                                                                        </span>
                                                                    )}
                                                                    {selectedExercise.kcal && (
                                                                        <span className="px-3 py-1 bg-gradient-to-r from-orange-600 to-red-500 rounded text-sm text-white font-medium shadow-sm">
                                                                            🔥 {selectedExercise.kcal} kcal
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {selectedExercise.moTa && (
                                                                    <p className="text-gray-400 mb-2">{selectedExercise.moTa}</p>
                                                                )}
                                                                {selectedExercise.thietBiSuDung && (
                                                                    <p className="text-gray-500 text-sm">Thiết bị: {selectedExercise.thietBiSuDung}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#0a0a0a] rounded-lg aspect-video flex items-center justify-center">
                                                            <p className="text-gray-500">Chọn một bài tập để xem video</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Exercise List */}
                                                <div className="exercise-list bg-[#0a0a0a] rounded-lg p-4 max-h-[600px] overflow-y-auto">
                                                    <h4 className="text-white font-semibold mb-3">
                                                        Danh sách bài tập ({filteredExercises.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {filteredExercises.map((exercise, index) => (
                                                            <div
                                                                key={exercise._id || index}
                                                                onClick={() => {
                                                                    setSelectedExercise(exercise);
                                                                    // Đánh dấu video đã xem ngay khi click (luôn đánh dấu, không check)
                                                                    if (selectedTemplate && exercise._id) {
                                                                        markAsWatched(selectedTemplate._id, exercise._id);
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${selectedExercise?._id === exercise._id
                                                                    ? 'bg-[#da2128] bg-opacity-20 border border-[#da2128]'
                                                                    : 'hover:bg-gray-800'
                                                                    }`}
                                                            >
                                                                <div className="text-white font-bold text-sm w-6">{index + 1}</div>
                                                                <img
                                                                    loading="lazy"
                                                                    src={exercise.hinhAnh || exercise.hinhAnhMinhHoa?.[0] || 'https://images.unsplash.com/photo-1517964100711-0a3b6f5a3f5f'}
                                                                    alt={exercise.tenBaiTap}
                                                                    className="w-16 h-12 object-cover rounded"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-white text-sm truncate">{exercise.tenBaiTap}</div>
                                                                    <div className="flex gap-2 text-xs text-gray-400">
                                                                        {exercise.thoiGian && <span>{exercise.thoiGian}s</span>}
                                                                        {exercise.mucDoKho && (
                                                                            <span style={{ color: getDifficultyColor(exercise.mucDoKho) }}>
                                                                                {getDifficultyLabel(exercise.mucDoKho)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Checkmark icon nếu đã xem */}
                                                                {selectedTemplate && watchedExercises[selectedTemplate._id]?.has(exercise._id) && (
                                                                    <div className="flex-shrink-0">
                                                                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PT list */}
                <div className="w-full pl-8 pr-6 mt-8 pt-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-white text-xl">Huấn Luyện Viên Nổi Bật</h2>
                        <a className="text-sm text-[#da2128]" href="/trainers">Xem tất cả</a>
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-wrap gap-6 items-stretch">
                            {pts.slice(0, VISIBLE_COUNT).map(pt => (
                                <div key={pt._id} className="bg-[#141414] rounded-lg p-3 flex-none w-full sm:w-1/2 md:flex-1">
                                    <div className="flex items-center gap-3">
                                        <img loading="lazy" src={pt.anhDaiDien || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'} alt={pt.hoTen} className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-md object-cover border border-[#141414]" />
                                        <div>
                                            <div className="font-medium text-white">{pt.hoTen}</div>
                                            <div className="text-xs text-[#f2f2f2]">{pt.chuyenMon || 'Gym Trainer'}</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end items-center gap-2">
                                        <button className="px-3 py-1.5 border border-[#da2128] rounded text-sm text-[#da2128] cursor-pointer hover:bg-[#da2128] hover:text-white hover:border-[#da2128] transition">Xem hồ sơ</button>
                                        <button
                                            onClick={() => handleChatWithPT(pt)}
                                            aria-label={`Message ${pt.hoTen}`}
                                            className="px-2 py-1.5 cursor-pointer border rounded text-sm flex items-center justify-center bg-[#da2128] bg-opacity-5 hover:bg-opacity-10 transition relative">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="#ffffff" aria-hidden="true">
                                                <path d="M10 0c5.342 0 10 4.41 10 9.5c0 5.004-4.553 8.942-10 8.942a11.01 11.01 0 0 1-3.43-.546c-.464.45-.623.603-1.608 1.553c-.71.536-1.378.718-1.975.38c-.602-.34-.783-1.002-.66-1.874l.4-2.319C.99 14.002 0 11.842 0 9.5C0 4.41 4.657 0 10 0Zm0 1.4c-4.586 0-8.6 3.8-8.6 8.1c0 2.045.912 3.928 2.52 5.33l.02.017l.297.258l-.067.39l-.138.804l-.037.214l-.285 1.658a2.79 2.79 0 0 0-.03.337v.095c0 .005-.001.007-.002.008c.007-.01.143-.053.376-.223l2.17-2.106l.414.156a9.589 9.589 0 0 0 3.362.605c4.716 0 8.6-3.36 8.6-7.543c0-4.299-4.014-8.1-8.6-8.1ZM5.227 7.813a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Zm4.998 0a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Zm4.997 0 a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Z" />
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-[#da2128] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            {showChat && selectedPT && chatRoom && (
                <ChatWindowPopup
                    roomId={chatRoom._id}
                    recipient={selectedPT}
                    onClose={handleCloseChat}
                />
            )}
        </>
    );
}

export default Exercises;