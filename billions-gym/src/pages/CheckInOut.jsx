import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authUtils } from '../utils/auth';
import { checkInAPI } from '../services/api';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CheckInCamera from '../components/face/CheckInCamera';
import FaceEnrollment from '../components/face/FaceEnrollment';
import './CheckInOut.css';

const CheckInOut = () => {
    const [hasFaceEncoding, setHasFaceEncoding] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEnrollment, setShowEnrollment] = useState(false);
    const [todaySessions, setTodaySessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const verificationRetryCountRef = useRef(0);

    // Get user and auth status at component level
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
        // Check if user is authenticated before making API calls

        if (!user || !isAuth) {
            setError('Vui lòng đăng nhập để sử dụng tính năng này');
            setIsLoading(false);
            return;
        }

        checkFaceEncodingStatus();
        loadTodaySessions();

        // Cleanup: This will be called when component unmounts (user navigates away)
        return () => {
            console.log('CheckInOut: Component unmounting - camera should stop automatically');
            // Camera will be stopped automatically when CheckInCamera component unmounts
        };
    }, []);

    const checkFaceEncodingStatus = async () => {
        try {
            const result = await checkInAPI.checkFaceEncoding();
            if (result && result.success !== false) {
                setHasFaceEncoding(result.hasFaceEncoding);
                if (!result.hasFaceEncoding) {
                    setShowEnrollment(true);
                }
            }
        } catch (err) {
            console.error('Error checking face encoding:', err);
            // If error is about authentication, don't set enrollment
            if (err.message && err.message.includes('Session expired')) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                // If face encoding doesn't exist, show enrollment
                setHasFaceEncoding(false);
                setShowEnrollment(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadTodaySessions = async () => {
        try {
            const result = await checkInAPI.getTodaySessions();
            if (result && result.success) {
                setTodaySessions(result.data || []);
            }
        } catch (err) {
            console.error('Error loading today sessions:', err);
            // Don't show error for sessions, just log it
        }
    };

    const loadHistory = async () => {
        try {
            const result = await checkInAPI.getHistory(20);
            if (result.success) {
                setHistory(result.data || []);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    const handleEnrollmentComplete = () => {
        setShowEnrollment(false);
        setHasFaceEncoding(true);
    };

    const handleFaceDetected = useCallback((descriptor) => {
        // Only update if descriptor actually changed to prevent infinite loops
        setFaceDescriptor(prev => {
            if (!prev || !descriptor) return descriptor;
            // Compare descriptors to avoid unnecessary updates
            if (prev.length !== descriptor.length) return descriptor;
            // Only update if there's a meaningful difference (reduced threshold for faster updates)
            const isDifferent = prev.some((val, idx) => Math.abs(val - descriptor[idx]) > 0.005); // Reduced from 0.01 to 0.005
            return isDifferent ? descriptor : prev;
        });
    }, []);

    const handleFaceVerified = useCallback((isVerified, similarity, threshold = 0.85) => {
        console.log('[CheckInOut] Face verification result:', { isVerified, similarity, threshold });
        setFaceVerified(isVerified);

        if (isVerified) {
            setVerificationError(null);
            verificationRetryCountRef.current = 0; // Reset retry count on success
            console.log('[CheckInOut] ✅ Face verified successfully, similarity:', similarity, 'threshold:', threshold);
        } else {
            const thresholdMsg = `≥${(threshold * 100).toFixed(0)}%`;
            const errorMsg = `Gương mặt không hợp lệ. Độ tương đồng: ${((similarity || 0) * 100).toFixed(1)}% (Yêu cầu: ${thresholdMsg})`;
            setVerificationError(errorMsg);
            console.log('[CheckInOut] ❌ Face verification failed, similarity:', similarity, 'threshold:', threshold);
            // Don't auto-retry - require user to reposition face
            verificationRetryCountRef.current = 0;
        }
    }, []);

    const captureImage = (videoElement) => {
        if (!videoElement) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const handleCheckIn = async () => {
        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập');
            return;
        }

        if (!faceDescriptor) {
            setError('Vui lòng đợi hệ thống nhận diện khuôn mặt của bạn');
            return;
        }

        // CRITICAL: Verify face before check-in - double check on server side
        if (!faceVerified) {
            setError('Gương mặt chưa được xác thực. Vui lòng đợi hệ thống xác thực khuôn mặt của bạn.');
            console.error('[CheckInOut] Check-in blocked: Face not verified');
            return;
        }

        // Additional verification: Check if face descriptor exists
        if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
            setError('Dữ liệu khuôn mặt không hợp lệ. Vui lòng quét lại.');
            console.error('[CheckInOut] Check-in blocked: Invalid face descriptor');
            return;
        }

        // CRITICAL SECURITY: Double-check verification before check-in
        console.log('[CheckInOut] Performing final verification before check-in...');
        try {
            const verifyResult = await checkInAPI.verifyFace(faceDescriptor);
            console.log('[CheckInOut] Final verification result:', verifyResult);

            if (!verifyResult.success || !verifyResult.isMatch) {
                setError(verifyResult.message || 'Gương mặt không hợp lệ. Vui lòng quét lại.');
                setFaceVerified(false);
                setVerificationError(verifyResult.message || 'Gương mặt không hợp lệ');
                console.error('[CheckInOut] Check-in blocked: Final verification failed', {
                    success: verifyResult.success,
                    isMatch: verifyResult.isMatch,
                    similarity: verifyResult.similarity,
                    threshold: verifyResult.threshold
                });
                return;
            }

            console.log('[CheckInOut] ✅ Final verification passed, proceeding with check-in');
        } catch (verifyErr) {
            console.error('[CheckInOut] Final verification error:', verifyErr);
            setError('Lỗi khi xác thực khuôn mặt. Vui lòng thử lại.');
            setFaceVerified(false);
            return;
        }

        setError(null);
        setVerificationError(null);
        setCheckInStatus('processing');

        try {
            // Get video element from camera component (we'll pass it via callback)
            const videoElement = document.querySelector('.camera-video');
            const image = captureImage(videoElement);
            console.log('[CheckInOut] Sending check-in request with face encoding...');
            const result = await checkInAPI.checkIn(selectedSession._id, faceDescriptor, image);
            console.log('[CheckInOut] Check-in response:', result);

            if (result.success) {
                setCheckInStatus('success');
                setError(null);
                loadTodaySessions();
                setTimeout(() => {
                    setCheckInStatus(null);
                    setSelectedSession(null);
                    setFaceDescriptor(null);
                }, 3000);
            } else {
                setCheckInStatus('error');
                setError(result.message || 'Check-in thất bại');
            }
        } catch (err) {
            setCheckInStatus('error');
            setError(err.message || 'Lỗi khi check-in');
        }
    };

    const handleCheckOut = async () => {
        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập');
            return;
        }

        if (!faceDescriptor) {
            setError('Vui lòng đợi hệ thống nhận diện khuôn mặt của bạn');
            return;
        }

        // CRITICAL: Verify face before check-out - double check on server side
        if (!faceVerified) {
            setError('Gương mặt chưa được xác thực. Vui lòng đợi hệ thống xác thực khuôn mặt của bạn.');
            console.error('[CheckInOut] Check-out blocked: Face not verified');
            return;
        }

        // Additional verification: Check if face descriptor exists
        if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
            setError('Dữ liệu khuôn mặt không hợp lệ. Vui lòng quét lại.');
            console.error('[CheckInOut] Check-out blocked: Invalid face descriptor');
            return;
        }

        // CRITICAL SECURITY: Double-check verification before check-out
        console.log('[CheckInOut] Performing final verification before check-out...');
        try {
            const verifyResult = await checkInAPI.verifyFace(faceDescriptor);
            console.log('[CheckInOut] Final verification result:', verifyResult);

            if (!verifyResult.success || !verifyResult.isMatch) {
                setError(verifyResult.message || 'Gương mặt không hợp lệ. Vui lòng quét lại.');
                setFaceVerified(false);
                setVerificationError(verifyResult.message || 'Gương mặt không hợp lệ');
                console.error('[CheckInOut] Check-out blocked: Final verification failed', {
                    success: verifyResult.success,
                    isMatch: verifyResult.isMatch,
                    similarity: verifyResult.similarity,
                    threshold: verifyResult.threshold
                });
                return;
            }

            console.log('[CheckInOut] ✅ Final verification passed, proceeding with check-out');
        } catch (verifyErr) {
            console.error('[CheckInOut] Final verification error:', verifyErr);
            setError('Lỗi khi xác thực khuôn mặt. Vui lòng thử lại.');
            setFaceVerified(false);
            return;
        }

        setError(null);
        setVerificationError(null);
        setCheckInStatus('processing');

        try {
            // Get video element from camera component
            const videoElement = document.querySelector('.camera-video');
            const image = captureImage(videoElement);
            console.log('[CheckInOut] Sending check-out request with face encoding...');
            const result = await checkInAPI.checkOut(selectedSession._id, faceDescriptor, image);
            console.log('[CheckInOut] Check-out response:', result);

            if (result.success) {
                setCheckInStatus('success');
                setError(null);
                setVerificationError(null);
                loadTodaySessions();
                setTimeout(() => {
                    setCheckInStatus(null);
                    setSelectedSession(null);
                    setFaceDescriptor(null);
                    setFaceVerified(false); // Reset verification after successful check-out
                    verificationRetryCountRef.current = 0;
                }, 3000);
            } else {
                setCheckInStatus('error');
                setError(result.message || 'Check-out thất bại');
            }
        } catch (err) {
            setCheckInStatus('error');
            setError(err.message || 'Lỗi khi check-out');
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
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

    const getStatusColor = (status) => {
        const colorMap = {
            'DUNG_GIO': '#22c55e',
            'SOM': '#f59e0b',
            'MUON': '#ef4444',
            'CHUA_CHECKOUT': '#6b7280'
        };
        return colorMap[status] || '#6b7280';
    };

    // Check authentication
    if (!user || !isAuth) {
        return (
            <div className="checkin-page">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`checkin-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                    <div className="checkin-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showEnrollment) {
        return (
            <div className="checkin-page">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`checkin-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                    <FaceEnrollment
                        onComplete={handleEnrollmentComplete}
                        onCancel={() => window.history.back()}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="checkin-page">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`checkin-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="checkin-header">
                    <h1>Check-in / Check-out</h1>
                    <p>Chào mừng, {user?.hoTen || 'Hội viên'}!</p>
                    {error && !showEnrollment && (
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

                <div className="checkin-main">
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
                                        const canCheckIn = session.attendanceStatus === 'DA_DANG_KY' && !session.hasCheckedIn;
                                        const canCheckOut = session.hasCheckedIn && session.checkInRecord && !session.checkInRecord.checkOutTime;
                                        const isSelected = selectedSession?._id === session._id;

                                        return (
                                            <div
                                                key={session._id}
                                                className={`session-card ${isSelected ? 'selected' : ''} ${canCheckIn || canCheckOut ? 'clickable' : ''}`}
                                                onClick={() => {
                                                    if (canCheckIn || canCheckOut) {
                                                        setSelectedSession(session);
                                                        setError(null);
                                                        setVerificationError(null);
                                                        setFaceVerified(false); // Reset verification when selecting new session
                                                        verificationRetryCountRef.current = 0;
                                                    }
                                                }}
                                            >
                                                <div className="session-info">
                                                    <h3>{session.tenBuoiTap}</h3>
                                                    <p className="session-time">
                                                        {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                                    </p>
                                                    {session.chiNhanh && (
                                                        <p className="session-branch">{session.chiNhanh.tenChiNhanh}</p>
                                                    )}
                                                </div>
                                                <div className="session-status">
                                                    {session.hasCheckedIn ? (
                                                        <div>
                                                            <span className="status-badge checked-in">Đã check-in</span>
                                                            {session.checkInRecord && (
                                                                <div className="check-in-details">
                                                                    <p>Check-in: {new Date(session.checkInRecord.checkInTime).toLocaleTimeString('vi-VN')}</p>
                                                                    <p style={{ color: getStatusColor(session.checkInRecord.checkInStatus) }}>
                                                                        {getStatusText(session.checkInRecord.checkInStatus)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {canCheckOut && (
                                                                <button
                                                                    className="btn-checkout"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedSession(session);
                                                                        setError(null);
                                                                        setVerificationError(null);
                                                                        setFaceVerified(false);
                                                                        verificationRetryCountRef.current = 0;
                                                                    }}
                                                                >
                                                                    Check-out
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : canCheckIn ? (
                                                        <button
                                                            className="btn-checkin"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedSession(session);
                                                                setError(null);
                                                                setVerificationError(null);
                                                                setFaceVerified(false);
                                                                verificationRetryCountRef.current = 0;
                                                            }}
                                                        >
                                                            Check-in
                                                        </button>
                                                    ) : (
                                                        <span className="status-badge">{session.attendanceStatus || 'N/A'}</span>
                                                    )}
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
                                                <div className="history-info">
                                                    <h4>{record.buoiTap?.tenBuoiTap || 'Buổi tập'}</h4>
                                                    <p>
                                                        {new Date(record.checkInTime).toLocaleString('vi-VN')}
                                                        {record.checkOutTime && (
                                                            <> - {new Date(record.checkOutTime).toLocaleString('vi-VN')}</>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="history-status">
                                                    <span
                                                        className="status-badge"
                                                        style={{ backgroundColor: getStatusColor(record.checkInStatus) }}
                                                    >
                                                        Check-in: {getStatusText(record.checkInStatus)}
                                                    </span>
                                                    {record.checkOutStatus && (
                                                        <span
                                                            className="status-badge"
                                                            style={{ backgroundColor: getStatusColor(record.checkOutStatus) }}
                                                        >
                                                            Check-out: {getStatusText(record.checkOutStatus)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="checkin-right">
                        <div className="camera-section">
                            <h2>Camera nhận diện</h2>
                            {/* Only render CheckInCamera when on this page - unmounting will stop camera */}
                            <CheckInCamera
                                key="checkin-camera" // Key ensures fresh mount when page loads
                                onFaceDetected={handleFaceDetected}
                                onError={setError}
                                autoStart={true}
                                verificationMode={true}
                                onFaceVerified={handleFaceVerified}
                            />
                            {verificationError && (
                                <div className="verification-error" style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: '#da2128',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    textAlign: 'center'
                                }}>
                                    <p className='text-white'>{verificationError}</p>
                                </div>
                            )}
                            {selectedSession && (
                                <div className="action-buttons">
                                    {selectedSession.hasCheckedIn && selectedSession.checkInRecord && !selectedSession.checkInRecord.checkOutTime ? (
                                        <button
                                            className="btn-action btn-checkout-action"
                                            onClick={handleCheckOut}
                                            disabled={!faceDescriptor || !faceVerified || checkInStatus === 'processing'}
                                        >
                                            {checkInStatus === 'processing'
                                                ? 'Đang xử lý...'
                                                : !faceVerified
                                                    ? 'Chờ xác thực khuôn mặt'
                                                    : 'Check-out'
                                            }
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-action btn-checkin-action"
                                            onClick={handleCheckIn}
                                            disabled={!faceDescriptor || !faceVerified || checkInStatus === 'processing'}
                                        >
                                            {checkInStatus === 'processing'
                                                ? 'Đang xử lý...'
                                                : !faceVerified
                                                    ? 'Chờ xác thực khuôn mặt'
                                                    : 'Check-in'
                                            }
                                        </button>
                                    )}
                                </div>
                            )}
                            {checkInStatus === 'success' && (
                                <div className="success-message">
                                    <p>✓ Thành công!</p>
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
        </div>
    );
};

export default CheckInOut;

