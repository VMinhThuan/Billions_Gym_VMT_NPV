import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authUtils } from '../utils/auth';
import { checkInAPI } from '../services/api';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CheckInCamera from '../components/face/CheckInCamera';
import FaceEnrollment from '../components/face/FaceEnrollment';
import QRScanner from '../components/qr/QRScanner';
import QRCodeDisplay from '../components/qr/QRCodeDisplay';
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
    const isProcessingRef = useRef(false); // Track if we're processing a scan
    const [checkInMode, setCheckInMode] = useState('face'); // 'face' or 'qr'
    const [showQRCodeDisplay, setShowQRCodeDisplay] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [qrCodeLoading, setQrCodeLoading] = useState(false);
    const [scannedQRCode, setScannedQRCode] = useState(null);
    const [checkInSuccessData, setCheckInSuccessData] = useState(null);
    const [checkOutSuccessData, setCheckOutSuccessData] = useState(null);

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

    const handleFaceVerified = useCallback((isVerified, similarity, threshold = 0.95) => {
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
                setVerificationError(null);
                // Stop camera immediately after successful check-in
                setShouldStopCamera(true);
                // Store success data to display detailed information
                setCheckInSuccessData(result.data || null);
                setCheckOutSuccessData(null);
                // Reload sessions to get updated status
                await loadTodaySessions();
                // Keep UI visible, don't clear selectedSession immediately
                setTimeout(() => {
                    setCheckInStatus(null);
                    setCheckInSuccessData(null);
                    setFaceDescriptor(null);
                    setFaceVerified(false);
                    verificationRetryCountRef.current = 0;
                    setShouldStopCamera(false); // Reset camera stop flag
                }, 5000); // Show success message for 5 seconds
            } else {
                setCheckInStatus('error');
                setError(result.message || 'Check-in thất bại');
                setCheckInSuccessData(null);
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
                // Store success data to display detailed information
                setCheckOutSuccessData(result.data || null);
                setCheckInSuccessData(null);
                // Reload sessions to get updated status
                await loadTodaySessions();
                // Keep UI visible, don't clear selectedSession immediately
                setTimeout(() => {
                    setCheckInStatus(null);
                    setCheckOutSuccessData(null);
                    setSelectedSession(null);
                    setFaceDescriptor(null);
                    setFaceVerified(false); // Reset verification after successful check-out
                    verificationRetryCountRef.current = 0;
                }, 5000); // Show success message for 5 seconds
            } else {
                setCheckInStatus('error');
                setError(result.message || 'Check-out thất bại');
                setCheckOutSuccessData(null);
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

    // Load QR code
    const loadQRCode = async () => {
        try {
            setQrCodeLoading(true);
            console.log('[CheckInOut] Loading QR code...');
            const result = await checkInAPI.getQRCode();
            console.log('[CheckInOut] QR code API response:', result);
            if (result && result.success) {
                console.log('[CheckInOut] QR code loaded:', result.data.qrCode?.substring(0, 20) + '...');
                setQrCode(result.data.qrCode);
            } else {
                console.error('[CheckInOut] Failed to load QR code:', result);
                setError('Không thể tải mã QR. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('[CheckInOut] Error loading QR code:', err);
            setError('Lỗi khi tải mã QR: ' + (err.message || 'Unknown error'));
        } finally {
            setQrCodeLoading(false);
        }
    };

    // Handle QR code scan success
    const handleQRScanSuccess = useCallback(async (decodedText) => {
        // Prevent multiple simultaneous calls using ref
        if (isProcessingRef.current) {
            console.log('[CheckInOut] Already processing, ignoring duplicate scan');
            return;
        }

        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập trước khi quét mã QR');
            return;
        }

        // Validate QR code format (should be a hex string)
        if (!decodedText || typeof decodedText !== 'string' || decodedText.length < 10) {
            setError('Mã QR không hợp lệ');
            return;
        }

        // Check if session is already completed
        if (selectedSession.hasCheckedIn &&
            selectedSession.checkInRecord &&
            selectedSession.checkInRecord.checkOutTime) {
            setError('Buổi tập này đã được hoàn thành. Không thể check-in/check-out lại.');
            return;
        }

        console.log('[CheckInOut] QR code scanned, processing...', decodedText.substring(0, 20) + '...');

        // Set processing flag
        isProcessingRef.current = true;
        setScannedQRCode(decodedText);
        setError(null);
        setVerificationError(null);
        setCheckInStatus('processing');

        try {
            // Determine if check-in or check-out
            const isCheckOut = selectedSession.hasCheckedIn &&
                selectedSession.checkInRecord &&
                !selectedSession.checkInRecord.checkOutTime;

            console.log('[CheckInOut] Calling API:', { isCheckOut, buoiTapId: selectedSession._id });

            let result;
            if (isCheckOut) {
                result = await checkInAPI.checkOutWithQR(selectedSession._id, decodedText);
            } else {
                result = await checkInAPI.checkInWithQR(selectedSession._id, decodedText);
            }

            console.log('[CheckInOut] API response:', result);

            if (result && result.success) {
                setCheckInStatus('success');
                setError(null);
                setVerificationError(null);
                setScannedQRCode(null);

                // Store success data to display detailed information
                if (isCheckOut) {
                    setCheckOutSuccessData(result.data || null);
                    setCheckInSuccessData(null);
                } else {
                    setCheckInSuccessData(result.data || null);
                    setCheckOutSuccessData(null);
                }

                // Reload sessions to get updated status (but don't clear selectedSession)
                // Store the current selectedSession ID to preserve it after reload
                const currentSessionId = selectedSession._id;

                // Use a small delay to ensure API call is complete and UI is stable
                setTimeout(async () => {
                    try {
                        const reloadResult = await checkInAPI.getTodaySessions();
                        if (reloadResult && reloadResult.success && reloadResult.data) {
                            console.log('[CheckInOut] Sessions reloaded successfully');
                            setTodaySessions(reloadResult.data || []);

                            // Update selectedSession with new data after reload
                            const updatedSession = reloadResult.data.find(
                                s => s._id.toString() === currentSessionId.toString()
                            );
                            if (updatedSession) {
                                console.log('[CheckInOut] Updating selectedSession with new data');
                                setSelectedSession(updatedSession);
                            } else {
                                console.log('[CheckInOut] Session not found in reloaded data, keeping current selectedSession');
                                // Keep the current selectedSession even if not found (might be a timing issue)
                            }
                        }
                    } catch (reloadErr) {
                        console.error('[CheckInOut] Error reloading sessions:', reloadErr);
                        // Don't show error to user, just log it
                        // Keep selectedSession to prevent UI from breaking
                    } finally {
                        // Reset processing flag after reload
                        isProcessingRef.current = false;
                    }
                }, 800); // Increased delay to ensure stability

                // Keep UI visible, don't clear selectedSession immediately
                // Show success message for 5 seconds, then clear status but keep session selected
                setTimeout(() => {
                    setCheckInStatus(null);
                    setCheckInSuccessData(null);
                    setCheckOutSuccessData(null);
                    // Keep selectedSession so user can see the updated status
                }, 5000);
            } else {
                // Handle API error response
                const errorMessage = result?.message || 'Check-in/Check-out thất bại';
                console.error('[CheckInOut] API error:', errorMessage);

                isProcessingRef.current = false; // Reset processing flag on error
                setCheckInStatus(null); // Don't show error status, just show error message

                // If error is "already checked in", don't show it as error, just reload sessions
                if (errorMessage.includes('đã check-in') || errorMessage.includes('already')) {
                    // Reload sessions to get updated status
                    setTimeout(async () => {
                        try {
                            const reloadResult = await checkInAPI.getTodaySessions();
                            if (reloadResult && reloadResult.success && reloadResult.data) {
                                setTodaySessions(reloadResult.data || []);
                                // Update selectedSession if it exists
                                const updatedSession = reloadResult.data.find(
                                    s => s._id.toString() === selectedSession._id.toString()
                                );
                                if (updatedSession) {
                                    setSelectedSession(updatedSession);
                                }
                            }
                        } catch (reloadErr) {
                            console.error('[CheckInOut] Error reloading sessions:', reloadErr);
                        }
                    }, 500);
                    // Don't show error message for "already checked in"
                    setError(null);
                } else {
                    setError(errorMessage);
                }

                setScannedQRCode(null);
                setCheckInSuccessData(null);
                setCheckOutSuccessData(null);
            }
        } catch (err) {
            console.error('[CheckInOut] Exception in handleQRScanSuccess:', err);

            // Extract error message from response
            let errorMessage = 'Lỗi khi check-in/check-out bằng QR code';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            isProcessingRef.current = false; // Reset processing flag on error
            setCheckInStatus(null); // Don't show error status

            // If error is "already checked in", reload sessions instead of showing error
            if (errorMessage.includes('đã check-in') || errorMessage.includes('already')) {
                setTimeout(async () => {
                    try {
                        const reloadResult = await checkInAPI.getTodaySessions();
                        if (reloadResult && reloadResult.success && reloadResult.data) {
                            setTodaySessions(reloadResult.data || []);
                            const updatedSession = reloadResult.data.find(
                                s => s._id.toString() === selectedSession._id.toString()
                            );
                            if (updatedSession) {
                                setSelectedSession(updatedSession);
                            }
                        }
                    } catch (reloadErr) {
                        console.error('[CheckInOut] Error reloading sessions:', reloadErr);
                    }
                }, 500);
                setError(null);
            } else {
                setError(errorMessage);
            }

            setScannedQRCode(null);
            setCheckInSuccessData(null);
            setCheckOutSuccessData(null);
        }
    }, [selectedSession]);

    // Handle QR code scan error
    const handleQRScanError = useCallback((errorMessage) => {
        setError(errorMessage);
    }, []);

    // Show QR code display
    const handleShowQRCode = async () => {
        setShowQRCodeDisplay(true);
        // Always load QR code to ensure we have the latest
        if (!qrCode || qrCodeLoading) {
            await loadQRCode();
        }
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
                    {/* Only show error message if it's not a "already checked in" message and there's a selected session */}
                    {error && !showEnrollment && !error.includes('đã check-in') && (
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
                    {/* Show info message if session needs check-out */}
                    {selectedSession && selectedSession.hasCheckedIn && selectedSession.checkInRecord && !selectedSession.checkInRecord.checkOutTime && !showEnrollment && (
                        <div className="info-message" style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#78350f',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            color: '#fde68a'
                        }}>
                            <p style={{ margin: 0, fontWeight: '600' }}>
                                ⚠️ Buổi tập này đã được check-in nhưng chưa check-out.
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                Vui lòng chọn buổi tập và sử dụng nút "Check-out" để hoàn tất.
                            </p>
                        </div>
                    )}
                    {/* Show info message if user tries to check-in a session that's already completed */}
                    {selectedSession && selectedSession.hasCheckedIn && selectedSession.checkInRecord && selectedSession.checkInRecord.checkOutTime && !showEnrollment && (
                        <div className="info-message" style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#1e3a8a',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            color: '#93c5fd'
                        }}>
                            Buổi tập này đã được hoàn thành (đã check-in và check-out).
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
                                                className={`session-card ${isSelected ? 'selected' : ''} ${canCheckIn || canCheckOut ? 'clickable' : ''} ${session.hasCheckedIn && session.checkInRecord && session.checkInRecord.checkOutTime ? 'completed' : ''} ${canCheckOut ? 'needs-checkout' : ''}`}
                                                onClick={() => {
                                                    // Allow clicking on any session to view details
                                                    // But only allow check-in/out for eligible sessions
                                                    setSelectedSession(session);
                                                    setError(null); // Clear error when selecting a session
                                                    setVerificationError(null);
                                                    setFaceVerified(false); // Reset verification when selecting new session
                                                    verificationRetryCountRef.current = 0;
                                                    setCheckInStatus(null); // Clear check-in status
                                                    setCheckInSuccessData(null);
                                                    setCheckOutSuccessData(null);

                                                    // If session needs check-out, show info message
                                                    if (canCheckOut) {
                                                        console.log('[CheckInOut] Session selected for check-out:', session.tenBuoiTap);
                                                    }

                                                    // If in QR mode, ensure camera will auto-start
                                                    // The key change in QRScanner will force a remount
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
                                                            {session.checkInRecord && session.checkInRecord.checkOutTime ? (
                                                                // Session completed (both check-in and check-out)
                                                                <>
                                                                    <span className="status-badge checked-in-completed">Đã hoàn thành</span>
                                                                    <div className="check-in-details">
                                                                        <p>Check-in: {new Date(session.checkInRecord.checkInTime).toLocaleTimeString('vi-VN')}</p>
                                                                        <p style={{
                                                                            color: getStatusColor(session.checkInRecord.checkInStatus),
                                                                            fontWeight: '600',
                                                                            marginTop: '4px'
                                                                        }}>
                                                                            {getStatusText(session.checkInRecord.checkInStatus)}
                                                                            {session.checkInRecord.thoiGianMuonCheckIn > 0 && (
                                                                                <span> ({session.checkInRecord.thoiGianMuonCheckIn} phút)</span>
                                                                            )}
                                                                        </p>
                                                                        <p style={{ marginTop: '8px' }}>
                                                                            Check-out: {new Date(session.checkInRecord.checkOutTime).toLocaleTimeString('vi-VN')}
                                                                        </p>
                                                                        {session.checkInRecord.checkOutStatus && (
                                                                            <p style={{
                                                                                color: getStatusColor(session.checkInRecord.checkOutStatus),
                                                                                fontWeight: '600',
                                                                                marginTop: '4px'
                                                                            }}>
                                                                                {getStatusText(session.checkInRecord.checkOutStatus)}
                                                                                {session.checkInRecord.thoiGianSomCheckOut > 0 && (
                                                                                    <span> ({session.checkInRecord.thoiGianSomCheckOut} phút)</span>
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                        {session.checkInRecord.sessionDuration && (
                                                                            <p style={{
                                                                                marginTop: '8px',
                                                                                fontSize: '0.9rem',
                                                                                color: '#9ca3af'
                                                                            }}>
                                                                                Thời gian tập: {session.checkInRecord.sessionDuration} phút
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                // Session checked in but not checked out
                                                                <>
                                                                    <span className="status-badge checked-in">Đã check-in</span>
                                                                    {session.checkInRecord && (
                                                                        <div className="check-in-details">
                                                                            <p>Check-in: {new Date(session.checkInRecord.checkInTime).toLocaleTimeString('vi-VN')}</p>
                                                                            <p style={{
                                                                                color: getStatusColor(session.checkInRecord.checkInStatus),
                                                                                fontWeight: '600',
                                                                                marginTop: '4px'
                                                                            }}>
                                                                                {getStatusText(session.checkInRecord.checkInStatus)}
                                                                                {session.checkInRecord.thoiGianMuonCheckIn > 0 && (
                                                                                    <span> ({session.checkInRecord.thoiGianMuonCheckIn} phút)</span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {canCheckOut && (
                                                                        <button
                                                                            className="btn-checkout"
                                                                            style={{
                                                                                marginTop: '0.5rem',
                                                                                width: '100%'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedSession(session);
                                                                                setError(null);
                                                                                setVerificationError(null);
                                                                                setFaceVerified(false);
                                                                                verificationRetryCountRef.current = 0;
                                                                                setCheckInStatus(null);
                                                                                setCheckInSuccessData(null);
                                                                                setCheckOutSuccessData(null);
                                                                                // Log for debugging
                                                                                console.log('[CheckInOut] Check-out button clicked for session:', session.tenBuoiTap);
                                                                            }}
                                                                        >
                                                                            Check-out ngay
                                                                        </button>
                                                                    )}
                                                                </>
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
                                                                setCheckInStatus(null);
                                                                setCheckInSuccessData(null);
                                                                setCheckOutSuccessData(null);
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
                            <div className="checkin-mode-tabs">
                                <button
                                    className={`checkin-mode-tab ${checkInMode === 'face' ? 'active' : ''}`}
                                    onClick={() => {
                                        setCheckInMode('face');
                                        setError(null);
                                        setVerificationError(null);
                                        setScannedQRCode(null);
                                        setCheckInStatus(null);
                                        setCheckInSuccessData(null);
                                        setCheckOutSuccessData(null);
                                    }}
                                >
                                    Quét khuôn mặt
                                </button>
                                <button
                                    className={`checkin-mode-tab ${checkInMode === 'qr' ? 'active' : ''}`}
                                    onClick={() => {
                                        setCheckInMode('qr');
                                        setError(null);
                                        setVerificationError(null);
                                        setScannedQRCode(null);
                                        setCheckInStatus(null);
                                        setCheckInSuccessData(null);
                                        setCheckOutSuccessData(null);
                                        // Reset face verification state when switching to QR mode
                                        setFaceVerified(false);
                                        setFaceDescriptor(null);
                                        // If a session is already selected, camera will auto-start
                                        // due to key change in QRScanner component
                                    }}
                                >
                                    Quét mã QR
                                </button>
                                <button
                                    className="checkin-mode-tab checkin-mode-tab-qr-display"
                                    onClick={handleShowQRCode}
                                    title="Xem mã QR của tôi"
                                >
                                    Mã QR của tôi
                                </button>
                            </div>

                            {checkInMode === 'face' ? (
                                <>
                                    <h2>Camera nhận diện</h2>
                                    {/* Only render CheckInCamera when in face mode - unmounting will stop camera */}
                                    <CheckInCamera
                                        key="checkin-camera-face" // Key ensures fresh mount when switching modes
                                        onFaceDetected={handleFaceDetected}
                                        onError={setError}
                                        autoStart={checkInMode === 'face'}
                                        verificationMode={true}
                                        onFaceVerified={handleFaceVerified}
                                    />
                                    {verificationError && (
                                        <div className="verification-error" style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            background: '#7f1d1d',
                                            border: '1px solid #991b1b',
                                            borderRadius: '8px',
                                            color: '#fca5a5',
                                            textAlign: 'center'
                                        }}>
                                            <p>{verificationError}</p>
                                        </div>
                                    )}
                                    {selectedSession && (
                                        <div className="action-buttons">
                                            {selectedSession.hasCheckedIn && selectedSession.checkInRecord && !selectedSession.checkInRecord.checkOutTime ? (
                                                <>
                                                    <div className="session-status-info" style={{
                                                        marginBottom: '1rem',
                                                        padding: '0.75rem',
                                                        background: '#1e3a8a',
                                                        border: '1px solid #3b82f6',
                                                        borderRadius: '8px',
                                                        color: '#93c5fd',
                                                        textAlign: 'center'
                                                    }}>
                                                        <p style={{ margin: 0, fontWeight: '600' }}>
                                                            Đã check-in - Vui lòng check-out
                                                        </p>
                                                        {selectedSession.checkInRecord.checkInTime && (
                                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                                                                Check-in lúc: {new Date(selectedSession.checkInRecord.checkInTime).toLocaleString('vi-VN')}
                                                            </p>
                                                        )}
                                                    </div>
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
                                                </>
                                            ) : selectedSession.hasCheckedIn && selectedSession.checkInRecord && selectedSession.checkInRecord.checkOutTime ? (
                                                <div className="session-status-info" style={{
                                                    padding: '0.75rem',
                                                    background: '#1e3a8a',
                                                    border: '1px solid #3b82f6',
                                                    borderRadius: '8px',
                                                    color: '#93c5fd',
                                                    textAlign: 'center'
                                                }}>
                                                    <p style={{ margin: 0, fontWeight: '600' }}>
                                                        Buổi tập này đã hoàn thành
                                                    </p>
                                                </div>
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
                                </>
                            ) : (
                                <>
                                    <h2>Quét mã QR</h2>
                                    {!selectedSession ? (
                                        <div className="qr-scanner-placeholder">
                                            <p>Vui lòng chọn buổi tập để quét mã QR</p>
                                        </div>
                                    ) : (
                                        <>
                                            <QRScanner
                                                key={`qr-scanner-${selectedSession._id}-${checkInMode}`} // Key ensures fresh mount when session or mode changes
                                                onScanSuccess={handleQRScanSuccess}
                                                onError={handleQRScanError}
                                                autoStart={checkInMode === 'qr' && !!selectedSession && checkInStatus !== 'processing' && checkInStatus !== 'success'}
                                            />
                                            {checkInStatus !== 'processing' && checkInStatus !== 'success' && (
                                                <div className="action-buttons">
                                                    {selectedSession.hasCheckedIn && selectedSession.checkInRecord && !selectedSession.checkInRecord.checkOutTime ? (
                                                        <div style={{
                                                            padding: '1rem',
                                                            background: '#78350f',
                                                            border: '1px solid #f59e0b',
                                                            borderRadius: '8px',
                                                            color: '#fde68a',
                                                            textAlign: 'center',
                                                            marginTop: '1rem'
                                                        }}>
                                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '1rem' }}>
                                                                ⚠️ Cần check-out
                                                            </p>
                                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                                                Quét mã QR để check-out buổi tập này
                                                            </p>
                                                            {selectedSession.checkInRecord.checkInTime && (
                                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                                                    Đã check-in lúc: {new Date(selectedSession.checkInRecord.checkInTime).toLocaleString('vi-VN')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="qr-scan-instruction">
                                                            Quét mã QR để check-in
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
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
                                                        <p className="status-detail">
                                                            Muộn {checkInSuccessData.checkInRecord.thoiGianMuonCheckIn} phút
                                                        </p>
                                                    )}
                                                </div>
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
                                                    {checkOutSuccessData.checkInRecord.thoiGianSomCheckOut > 0 && (
                                                        <p className="status-detail">
                                                            Sớm {checkOutSuccessData.checkInRecord.thoiGianSomCheckOut} phút
                                                        </p>
                                                    )}
                                                    {checkOutSuccessData.checkInRecord.sessionDuration && (
                                                        <p className="status-detail">
                                                            Thời gian tập: {checkOutSuccessData.checkInRecord.sessionDuration} phút
                                                        </p>
                                                    )}
                                                </div>
                                                {checkOutSuccessData.buoiTap && (
                                                    <p className="success-session">
                                                        Buổi tập: {checkOutSuccessData.buoiTap.tenBuoiTap} ({checkOutSuccessData.buoiTap.gioBatDau} - {checkOutSuccessData.buoiTap.gioKetThuc})
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
            </div>
        </div>
    );
};

export default CheckInOut;

