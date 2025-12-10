import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authUtils } from '../../utils/auth';
import { ptCheckInAPI } from '../../services/api';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import QRScanner from '../../components/qr/QRScanner';
import QRCodeDisplay from '../../components/qr/QRCodeDisplay';
import '../CheckInOut.css';

const PTCheckInOut = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [todaySessions, setTodaySessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isProcessingRef = useRef(false);
    const [scannedQRCode, setScannedQRCode] = useState(null);
    const [checkInSuccessData, setCheckInSuccessData] = useState(null);
    const [checkOutSuccessData, setCheckOutSuccessData] = useState(null);
    const [shouldStopCamera, setShouldStopCamera] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [qrCodeLoading, setQrCodeLoading] = useState(false);
    const [showQRCodeDisplay, setShowQRCodeDisplay] = useState(false);

    const user = authUtils.getUser();
    const isAuth = authUtils.isAuthenticated();

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (!user || !isAuth) {
            setError('Vui lòng đăng nhập để sử dụng tính năng này');
            setIsLoading(false);
            return;
        }

        loadTodaySessions();
    }, []);

    const loadTodaySessions = async () => {
        try {
            const result = await ptCheckInAPI.getTodaySessions();
            if (result && result.success) {
                setTodaySessions(result.data || []);
            } else {
                setError('Không thể tải danh sách buổi tập');
            }
        } catch (err) {
            console.error('Error loading today sessions:', err);
            setError('Lỗi khi tải danh sách buổi tập');
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const result = await ptCheckInAPI.getHistory(50);
            if (result && result.success) {
                setHistory(result.data || []);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    // Load QR code
    const loadQRCode = async () => {
        try {
            setQrCodeLoading(true);
            console.log('[PTCheckInOut] Loading QR code...');
            const result = await ptCheckInAPI.getQRCode();
            console.log('[PTCheckInOut] QR code API response:', result);
            if (result && result.success) {
                console.log('[PTCheckInOut] QR code loaded:', result.data.qrCode?.substring(0, 20) + '...');
                setQrCode(result.data.qrCode);
            } else {
                console.error('[PTCheckInOut] Failed to load QR code:', result);
                setError('Không thể tải mã QR. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('[PTCheckInOut] Error loading QR code:', err);
            setError('Lỗi khi tải mã QR: ' + (err.message || 'Unknown error'));
        } finally {
            setQrCodeLoading(false);
        }
    };

    const handleShowQRCode = async () => {
        if (!qrCode) {
            await loadQRCode();
        }
        setShowQRCodeDisplay(true);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()];
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${dayName}, ${day}/${month}/${year}`;
    };

    const getSessionIcon = (sessionName) => {
        const name = sessionName?.toLowerCase() || '';
        if (name.includes('back') || name.includes('biceps')) return '🏋️';
        if (name.includes('boxing')) return '🥊';
        if (name.includes('cardio') || name.includes('hiit')) return '💪';
        if (name.includes('core')) return '🔥';
        if (name.includes('leg')) return '🦵';
        if (name.includes('chest')) return '💪';
        if (name.includes('yoga') || name.includes('stretch')) return '🧘';
        return '🏋️';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'DUNG_GIO': 'Đúng giờ',
            'SOM': 'Sớm',
            'MUON': 'Muộn',
            'CHUA_CHECKOUT': 'Chưa check-out'
        };
        return statusMap[status] || status;
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            'DUNG_GIO': '✅',
            'SOM': '⏰',
            'MUON': '⏱️',
            'CHUA_CHECKOUT': '⏳'
        };
        return iconMap[status] || '⏳';
    };

    const getStatusBadgeClass = (status) => {
        const classMap = {
            'DUNG_GIO': 'on-time',
            'SOM': 'early',
            'MUON': 'late',
            'CHUA_CHECKOUT': 'pending'
        };
        return classMap[status] || 'pending';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'DUNG_GIO': '#22c55e',
            'SOM': '#f59e0b',
            'MUON': '#ef4444',
            'CHUA_CHECKOUT': '#6b7280'
        };
        return colorMap[status] || '#6b7280';
    };

    // Handle QR code scan success
    const handleQRScanSuccess = useCallback(async (decodedText) => {
        if (isProcessingRef.current) {
            console.log('[PTCheckInOut] Already processing, ignoring duplicate scan');
            return;
        }

        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập trước khi quét mã QR');
            return;
        }

        if (!decodedText || typeof decodedText !== 'string' || decodedText.length < 10) {
            setError('Mã QR không hợp lệ');
            return;
        }

        if (selectedSession.hasCheckedIn &&
            selectedSession.checkInRecord &&
            selectedSession.checkInRecord.checkOutTime) {
            setError('Buổi tập này đã được hoàn thành. Không thể check-in/check-out lại.');
            return;
        }

        console.log('[PTCheckInOut] QR code scanned, processing...', decodedText.substring(0, 20) + '...');

        isProcessingRef.current = true;
        setScannedQRCode(decodedText);
        setError(null);
        setCheckInStatus('processing');

        try {
            const isCheckOut = selectedSession.hasCheckedIn &&
                selectedSession.checkInRecord &&
                !selectedSession.checkInRecord.checkOutTime;

            console.log('[PTCheckInOut] Calling API:', { isCheckOut, buoiTapId: selectedSession._id });

            let result;
            if (isCheckOut) {
                // For check-out, send checkInRecordId and QR code
                result = await ptCheckInAPI.checkOut(
                    selectedSession.checkInRecord?._id || selectedSession._id,
                    decodedText
                );
            } else {
                // For check-in, send buoiTapId and QR code
                result = await ptCheckInAPI.checkIn(selectedSession._id, decodedText);
            }

            console.log('[PTCheckInOut] API response:', result);

            if (result && result.success) {
                setCheckInStatus('success');
                setError(null);
                setScannedQRCode(null);
                setShouldStopCamera(true);

                if (isCheckOut) {
                    setCheckOutSuccessData(result.data || null);
                    setCheckInSuccessData(null);
                } else {
                    setCheckInSuccessData(result.data || null);
                    setCheckOutSuccessData(null);
                }

                await loadTodaySessions();

                setTimeout(() => {
                    setCheckInStatus(null);
                    setCheckInSuccessData(null);
                    setCheckOutSuccessData(null);
                    setShouldStopCamera(false);
                }, 5000);
            } else {
                setCheckInStatus('error');
                setError(result?.message || 'Check-in/out thất bại');
            }
        } catch (err) {
            console.error('[PTCheckInOut] Error:', err);
            setCheckInStatus('error');
            setError(err.message || 'Lỗi khi check-in/out');
        } finally {
            isProcessingRef.current = false;
        }
    }, [selectedSession]);

    const handleQRScanError = (error) => {
        console.error('[PTCheckInOut] QR scan error:', error);
        if (!isProcessingRef.current) {
            setError('Lỗi khi quét mã QR. Vui lòng thử lại.');
        }
    };

    if (!user || !isAuth) {
        return (
            <div className="checkin-page">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="checkin-content">
                    <div className="checkin-error" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h2>Vui lòng đăng nhập</h2>
                        <p>Bạn cần đăng nhập để sử dụng tính năng check-in/check-out</p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1.5rem',
                                background: '#da2128',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="checkin-page">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`checkin-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                    <div className="checkin-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkin-page">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`checkin-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="checkin-header">
                    <h1>Check-in / Check-out PT</h1>
                    <div className="date-display">
                        📅 Hôm nay: {formatDate(new Date())}
                    </div>
                    <p className="greeting">Chào mừng, {user?.hoTen || 'PT'}!</p>
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleShowQRCode}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: '2px solid #10b981',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 6px 8px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
                            }}
                        >
                            <span>📱</span>
                            <span>{qrCodeLoading ? 'Đang tải...' : 'Hiển thị mã QR của tôi'}</span>
                        </button>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#1e3a8a',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#93c5fd',
                        fontSize: '0.875rem'
                    }}>
                        <p style={{ margin: 0, fontWeight: '600' }}>⚠️ Lưu ý:</p>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                            <li>PT phải check-in trước 15 phút giờ bắt đầu buổi tập</li>
                            <li>Nếu đi muộn sẽ bị trừ lương (5% mỗi 5 phút muộn)</li>
                            <li>PT chỉ được check-out khi buổi tập đã kết thúc</li>
                            <li>Lương được tính dựa trên check-in/out</li>
                        </ul>
                    </div>
                    {error && (
                        <div className="error-message" style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#da2128',
                            borderRadius: '8px',
                            color: '#ffffff'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                <div className="checkin-main qr-mode-active">
                    <div className="checkin-left">
                        <div className="sessions-section">
                            <h2>Buổi tập hôm nay</h2>
                            {todaySessions.length === 0 ? (
                                <div className="no-sessions">
                                    <p>Không có buổi tập nào hôm nay</p>
                                </div>
                            ) : (
                                <div className="sessions-list">
                                    {todaySessions.map((session) => {
                                        const canCheckIn = !session.hasCheckedIn;
                                        const canCheckOut = session.hasCheckedIn && session.checkInRecord && !session.checkInRecord.checkOutTime;
                                        const isSelected = selectedSession?._id === session._id;
                                        const isCompleted = session.hasCheckedIn && session.checkInRecord && session.checkInRecord.checkOutTime;

                                        // Tính thời gian còn lại để check-in (phải trước 15 phút)
                                        const now = new Date();
                                        const requiredCheckInTime = session.requiredCheckInTime ? new Date(session.requiredCheckInTime) : null;
                                        const timeUntilRequired = requiredCheckInTime ? Math.round((requiredCheckInTime - now) / (1000 * 60)) : null;

                                        return (
                                            <div
                                                key={session._id}
                                                className={`session-card ${isSelected ? 'selected' : ''} ${canCheckIn || canCheckOut ? 'clickable' : ''} ${isCompleted ? 'completed' : ''} ${canCheckOut ? 'needs-checkout' : ''}`}
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setError(null);
                                                    setCheckInStatus(null);
                                                    setCheckInSuccessData(null);
                                                    setCheckOutSuccessData(null);
                                                    setShouldStopCamera(false);
                                                }}
                                            >
                                                <div className="session-card-header">
                                                    <div className="session-info">
                                                        <h3>
                                                            <span className="session-icon">{getSessionIcon(session.tenBuoiTap)}</span>
                                                            {session.tenBuoiTap}
                                                        </h3>
                                                        <p className="session-time">
                                                            {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                                        </p>
                                                        {session.chiNhanh && (
                                                            <p className="session-branch">{session.chiNhanh.tenChiNhanh}</p>
                                                        )}
                                                        {requiredCheckInTime && timeUntilRequired !== null && (
                                                            <p className="session-required-time" style={{
                                                                fontSize: '0.875rem',
                                                                color: timeUntilRequired <= 15 ? '#ef4444' : '#f59e0b',
                                                                fontWeight: '600',
                                                                marginTop: '0.5rem'
                                                            }}>
                                                                ⏰ Phải check-in trước: {new Date(requiredCheckInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                {timeUntilRequired > 0 && ` (Còn ${timeUntilRequired} phút)`}
                                                                {timeUntilRequired <= 0 && timeUntilRequired > -15 && ` (Đã quá ${Math.abs(timeUntilRequired)} phút)`}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="session-status">
                                                        {session.hasCheckedIn ? (
                                                            session.checkInRecord && session.checkInRecord.checkOutTime ? (
                                                                <span className={`status-badge session-status-badge completed`}>
                                                                    ✅ Đã hoàn thành
                                                                </span>
                                                            ) : (
                                                                <span className={`status-badge session-status-badge checked-in`}>
                                                                    🟢 Đang dạy
                                                                </span>
                                                            )
                                                        ) : canCheckIn ? (
                                                            <span className={`status-badge session-status-badge pending`}>
                                                                ⏳ Chưa check-in
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {session.hasCheckedIn && session.checkInRecord && (
                                                    <div className="session-details">
                                                        {session.checkInRecord.checkInTime && (
                                                            <div className="session-detail-row">
                                                                <span className="session-detail-label">Check-in:</span>
                                                                <span className="session-detail-value">
                                                                    {new Date(session.checkInRecord.checkInTime).toLocaleTimeString('vi-VN')}
                                                                    {session.checkInRecord.checkInStatus && (
                                                                        <span className={`status-badge ${getStatusBadgeClass(session.checkInRecord.checkInStatus)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}>
                                                                            {getStatusIcon(session.checkInRecord.checkInStatus)} {getStatusText(session.checkInRecord.checkInStatus)}
                                                                            {session.checkInRecord.thoiGianMuonCheckIn > 0 && (
                                                                                <span> ({session.checkInRecord.thoiGianMuonCheckIn} phút)</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {session.checkInRecord.tienPhat > 0 && (
                                                            <div className="session-detail-row" style={{ color: '#ef4444', fontWeight: '600' }}>
                                                                <span className="session-detail-label">Tiền phạt:</span>
                                                                <span className="session-detail-value">
                                                                    -{session.checkInRecord.tienPhat.toLocaleString('vi-VN')} VNĐ
                                                                </span>
                                                            </div>
                                                        )}
                                                        {session.checkInRecord.tienLuong > 0 && (
                                                            <div className="session-detail-row" style={{ color: '#22c55e', fontWeight: '600' }}>
                                                                <span className="session-detail-label">Tiền lương:</span>
                                                                <span className="session-detail-value">
                                                                    {session.checkInRecord.tienLuong.toLocaleString('vi-VN')} VNĐ
                                                                </span>
                                                            </div>
                                                        )}
                                                        {session.checkInRecord.checkOutTime && (
                                                            <>
                                                                <div className="session-detail-row">
                                                                    <span className="session-detail-label">Check-out:</span>
                                                                    <span className="session-detail-value">
                                                                        {new Date(session.checkInRecord.checkOutTime).toLocaleTimeString('vi-VN')}
                                                                        {session.checkInRecord.checkOutStatus && (
                                                                            <span className={`status-badge ${getStatusBadgeClass(session.checkInRecord.checkOutStatus)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}>
                                                                                {getStatusIcon(session.checkInRecord.checkOutStatus)} {getStatusText(session.checkInRecord.checkOutStatus)}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {session.checkInRecord.sessionDuration && (
                                                                    <div className="session-detail-row">
                                                                        <span className="session-detail-label">Thời gian dạy:</span>
                                                                        <span className="session-detail-value">
                                                                            {session.checkInRecord.sessionDuration} phút
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="session-actions">
                                                    {session.hasCheckedIn ? (
                                                        canCheckOut ? (
                                                            <button
                                                                className="btn-checkout"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSession(session);
                                                                    setError(null);
                                                                    setCheckInStatus(null);
                                                                    setCheckInSuccessData(null);
                                                                    setCheckOutSuccessData(null);
                                                                }}
                                                            >
                                                                🚪 Check-out ngay
                                                            </button>
                                                        ) : null
                                                    ) : canCheckIn ? (
                                                        <button
                                                            className="btn-checkin"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedSession(session);
                                                                setError(null);
                                                                setCheckInStatus(null);
                                                                setCheckInSuccessData(null);
                                                                setCheckOutSuccessData(null);
                                                            }}
                                                        >
                                                            ✅ Check-in ngay
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="history-section">
                            <div className="history-header">
                                <h2>Lịch sử check-in</h2>
                                <button
                                    className="btn-toggle-history"
                                    onClick={() => {
                                        setShowHistory(!showHistory);
                                        if (!showHistory) {
                                            loadHistory();
                                        }
                                    }}
                                >
                                    {showHistory ? 'Ẩn' : 'Xem'} lịch sử
                                </button>
                            </div>
                            {showHistory && (
                                <div className="history-list">
                                    {history.length === 0 ? (
                                        <p>Chưa có lịch sử check-in</p>
                                    ) : (
                                        history.map((record) => (
                                            <div key={record._id} className="history-item">
                                                <div className="history-item-left">
                                                    <div className="history-info">
                                                        <h4>{record.buoiTap?.tenBuoiTap || 'Buổi tập'}</h4>
                                                        <div className="history-time-info">
                                                            <div className="history-time-row">
                                                                <span className="history-time-label">Check-in:</span>
                                                                <span className="history-time-value">
                                                                    {new Date(record.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                    {' '}
                                                                    {new Date(record.checkInTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            {record.checkOutTime && (
                                                                <div className="history-time-row">
                                                                    <span className="history-time-label">Check-out:</span>
                                                                    <span className="history-time-value">
                                                                        {new Date(record.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                        {' '}
                                                                        {new Date(record.checkOutTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {record.tienPhat > 0 && (
                                                                <div className="history-time-row" style={{ color: '#ef4444' }}>
                                                                    <span className="history-time-label">Tiền phạt:</span>
                                                                    <span className="history-time-value">
                                                                        -{record.tienPhat.toLocaleString('vi-VN')} VNĐ
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {record.tienLuong > 0 && (
                                                                <div className="history-time-row" style={{ color: '#22c55e' }}>
                                                                    <span className="history-time-label">Tiền lương:</span>
                                                                    <span className="history-time-value">
                                                                        {record.tienLuong.toLocaleString('vi-VN')} VNĐ
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="history-item-right">
                                                    <div className="history-status">
                                                        <span
                                                            className="status-badge history-status-badge"
                                                            style={{ backgroundColor: getStatusColor(record.checkInStatus) }}
                                                        >
                                                            CHECK-IN: {getStatusText(record.checkInStatus).toUpperCase()}
                                                        </span>
                                                        {record.checkOutStatus && (
                                                            <span
                                                                className="status-badge history-status-badge"
                                                                style={{ backgroundColor: getStatusColor(record.checkOutStatus) }}
                                                            >
                                                                CHECK-OUT: {getStatusText(record.checkOutStatus).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="checkin-right">
                        <div className="camera-section qr-mode-active">
                            <h2>📷 Khu vực quét QR</h2>
                            <div className="camera-viewer-container qr-mode">
                                {!selectedSession ? (
                                    <div className="qr-scanner-placeholder">
                                        <p>🕓 Gợi ý: Chọn buổi tập để quét mã QR</p>
                                    </div>
                                ) : (
                                    <>
                                        {!shouldStopCamera && checkInStatus !== 'success' ? (
                                            <QRScanner
                                                key={`qr-scanner-pt-${selectedSession._id}`}
                                                onScanSuccess={handleQRScanSuccess}
                                                onError={handleQRScanError}
                                                autoStart={!!selectedSession}
                                            />
                                        ) : (
                                            <div className="qr-scanner-placeholder">
                                                <p>Camera đã được tắt sau khi check-in/check-out thành công</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            {checkInStatus !== 'processing' && checkInStatus !== 'success' && !shouldStopCamera && selectedSession && (
                                <div className="action-buttons">
                                    {selectedSession.hasCheckedIn && selectedSession.checkInRecord && !selectedSession.checkInRecord.checkOutTime ? (
                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
                                            border: '2px solid #f59e0b',
                                            borderRadius: '12px',
                                            color: '#fde68a',
                                            textAlign: 'center',
                                            marginTop: '1rem',
                                            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                                        }}>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '1rem' }}>
                                                ⚠️ Cần check-out
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                                Quét mã QR để check-out buổi tập này
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                                ⚠️ Chỉ được check-out khi buổi tập đã kết thúc
                                            </p>
                                            {selectedSession.checkInRecord.checkInTime && (
                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                                    Đã check-in lúc: {new Date(selectedSession.checkInRecord.checkInTime).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                            border: '2px solid #3b82f6',
                                            borderRadius: '12px',
                                            color: '#93c5fd',
                                            textAlign: 'center',
                                            marginTop: '1rem',
                                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                                        }}>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '1rem' }}>
                                                ✅ Sẵn sàng check-in
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                                Quét mã QR để check-in buổi tập này
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                                ⚠️ Phải check-in trước 15 phút giờ bắt đầu
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {checkInStatus === 'processing' && (
                                <div className="processing-message">
                                    <div className="loading-spinner"></div>
                                    <p>Đang xử lý...</p>
                                </div>
                            )}

                            {checkInStatus === 'success' && (
                                <div className="success-message detailed-success">
                                    <div className="success-icon">✓</div>
                                    <div className="success-content">
                                        <h3>Thành công!</h3>
                                        {checkInSuccessData && checkInSuccessData.checkInRecord && (
                                            <div className="success-details">
                                                <p className="success-title">Check-in thành công</p>
                                                <p className="success-time">
                                                    Thời gian: {new Date(checkInSuccessData.checkInRecord.checkInTime).toLocaleString('vi-VN')}
                                                </p>
                                                <div className="success-status">
                                                    <span
                                                        className="status-badge-large"
                                                        style={{ backgroundColor: getStatusColor(checkInSuccessData.checkInRecord.checkInStatus) }}
                                                    >
                                                        {getStatusText(checkInSuccessData.checkInRecord.checkInStatus)}
                                                    </span>
                                                    {checkInSuccessData.checkInRecord.thoiGianMuonCheckIn > 0 && (
                                                        <p className="status-detail" style={{ color: '#ef4444', fontWeight: '600' }}>
                                                            Muộn {checkInSuccessData.checkInRecord.thoiGianMuonCheckIn} phút
                                                        </p>
                                                    )}
                                                </div>
                                                {checkInSuccessData.checkInRecord.tienPhat > 0 && (
                                                    <p className="status-detail" style={{ color: '#ef4444', fontWeight: '600', marginTop: '0.5rem' }}>
                                                        ⚠️ Tiền phạt: -{checkInSuccessData.checkInRecord.tienPhat.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                )}
                                                {checkInSuccessData.checkInRecord.tienLuong > 0 && (
                                                    <p className="status-detail" style={{ color: '#22c55e', fontWeight: '600', marginTop: '0.5rem' }}>
                                                        💰 Tiền lương: {checkInSuccessData.checkInRecord.tienLuong.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                )}
                                                {checkInSuccessData.buoiTap && (
                                                    <p className="success-session">
                                                        Buổi tập: {checkInSuccessData.buoiTap.tenBuoiTap} ({checkInSuccessData.buoiTap.gioBatDau} - {checkInSuccessData.buoiTap.gioKetThuc})
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {checkOutSuccessData && checkOutSuccessData.checkInRecord && (
                                            <div className="success-details">
                                                <p className="success-title">Check-out thành công</p>
                                                <p className="success-time">
                                                    Thời gian: {new Date(checkOutSuccessData.checkInRecord.checkOutTime).toLocaleString('vi-VN')}
                                                </p>
                                                <div className="success-status">
                                                    <span
                                                        className="status-badge-large"
                                                        style={{ backgroundColor: getStatusColor(checkOutSuccessData.checkInRecord.checkOutStatus) }}
                                                    >
                                                        {getStatusText(checkOutSuccessData.checkInRecord.checkOutStatus)}
                                                    </span>
                                                    {checkOutSuccessData.checkInRecord.sessionDuration && (
                                                        <p className="status-detail">
                                                            Thời gian dạy: {checkOutSuccessData.checkInRecord.sessionDuration} phút
                                                        </p>
                                                    )}
                                                </div>
                                                {checkOutSuccessData.checkInRecord.tienLuong > 0 && (
                                                    <p className="status-detail" style={{ color: '#22c55e', fontWeight: '600', marginTop: '0.5rem' }}>
                                                        💰 Tiền lương: {checkOutSuccessData.checkInRecord.tienLuong.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div className="error-message">
                                    <p className='text-white'>{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Display Modal */}
            {showQRCodeDisplay && (
                <div className="qr-code-display-modal" onClick={(e) => {
                    if (e.target.className === 'qr-code-display-modal') {
                        setShowQRCodeDisplay(false);
                    }
                }}>
                    <div className="qr-code-display-modal-content">
                        <QRCodeDisplay
                            qrCode={qrCode}
                            hoTen={user?.hoTen}
                            onClose={() => setShowQRCodeDisplay(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTCheckInOut;

