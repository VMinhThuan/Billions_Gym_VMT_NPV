import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { checkInAPI } from '../../services/api';
import { compareWithStoredEncodings } from '../../utils/faceUtils';
import './CheckInCamera.css';

const CheckInCamera = ({
    onFaceDetected,
    onError,
    autoStart = true,
    verificationMode = false,
    onFaceVerified = null,
    storedEncodings = null
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null); // Use ref to store stream for proper cleanup
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [faceVerified, setFaceVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const lastVerifiedDescriptorRef = useRef(null);
    const previousDescriptorRef = useRef(null); // Track previous descriptor to detect face changes
    const verificationTimeoutRef = useRef(null);
    const eventHandlersRef = useRef({}); // Store event handlers for cleanup

    const {
        modelsLoaded,
        isDetecting,
        faceDetected,
        faceDescriptor,
        error: faceApiError,
        loadingProgress,
        startDetection,
        stopDetection
    } = useFaceDetection(videoRef, canvasRef, {
        detectionInterval: 50, // Faster detection: every 50ms instead of 100ms
        minConfidence: 0.5,
        withLandmarks: true,
        withDescriptors: true
    });

    // Track if video is ready for detection
    const [videoReady, setVideoReady] = useState(false);

    // Note: stopCamera function removed - cleanup is done directly in useEffect cleanup
    // This prevents infinite loops from state updates

    // Start camera - only depend on autoStart to avoid infinite loop
    useEffect(() => {
        // Early return if autoStart is false - cleanup will handle stopping camera
        if (!autoStart) {
            return;
        }

        let isMounted = true; // Track if component is still mounted
        let currentStream = null; // Local variable to track stream for cleanup

        const startCamera = async () => {
            try {
                setCameraError(null);
                setVideoReady(false);
                console.log('Requesting camera access...');

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640, min: 320 },
                        height: { ideal: 480, min: 240 },
                        facingMode: 'user'
                    },
                    audio: false
                });

                console.log('Camera stream obtained:', mediaStream);
                console.log('Stream tracks:', mediaStream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled, readyState: t.readyState })));

                // Check if component is still mounted and autoStart is still true
                if (!isMounted) {
                    console.log('Component unmounted, stopping stream');
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                // Store stream in ref and local variable
                streamRef.current = mediaStream;
                currentStream = mediaStream;
                setStream(mediaStream); // Update state for UI

                if (videoRef.current && isMounted) {
                    const video = videoRef.current;

                    // Clear any existing stream first
                    if (video.srcObject) {
                        const oldStream = video.srcObject;
                        oldStream.getTracks().forEach(track => {
                            console.log('Stopping old track:', track.kind);
                            track.stop();
                        });
                    }

                    // Set the new stream
                    video.srcObject = mediaStream;
                    console.log('Video srcObject set, video element:', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        readyState: video.readyState,
                        paused: video.paused,
                        srcObject: !!video.srcObject
                    });

                    // Set video attributes
                    video.setAttribute('autoplay', '');
                    video.setAttribute('playsinline', '');
                    video.setAttribute('muted', '');

                    // Create event handlers and store them for cleanup
                    const handleLoadedMetadata = () => {
                        console.log('Video metadata loaded:', {
                            videoWidth: video.videoWidth,
                            videoHeight: video.videoHeight,
                            readyState: video.readyState,
                            paused: video.paused,
                            ended: video.ended
                        });

                        // Ensure video plays
                        const playVideo = async () => {
                            // Check if still mounted before playing
                            if (!isMounted || video.srcObject !== mediaStream) {
                                return;
                            }
                            try {
                                await video.play();
                                console.log('Video started playing successfully');
                                // Wait a bit for video to actually start playing
                                setTimeout(() => {
                                    if (!isMounted) return; // Check again after timeout
                                    if (video.videoWidth > 0 && video.videoHeight > 0 && video.srcObject === mediaStream) {
                                        console.log('Video is ready with dimensions:', {
                                            width: video.videoWidth,
                                            height: video.videoHeight
                                        });
                                        setVideoReady(true);
                                    }
                                }, 150); // Reduced delay
                            } catch (err) {
                                if (!isMounted) return;
                                console.error('Error playing video:', err);
                                setCameraError('Lỗi khi phát video. Vui lòng thử lại.');
                            }
                        };
                        playVideo();
                    };

                    const handleCanPlay = () => {
                        if (!isMounted || video.srcObject !== mediaStream) return;
                        console.log('Video can play');
                        if (video.paused && video.srcObject === mediaStream) {
                            video.play()
                                .then(() => {
                                    if (isMounted && video.videoWidth > 0 && video.videoHeight > 0) {
                                        setVideoReady(true);
                                    }
                                })
                                .catch(console.error);
                        } else if (video.videoWidth > 0 && video.videoHeight > 0) {
                            setVideoReady(true);
                        }
                    };

                    const handlePlay = () => {
                        if (!isMounted || video.srcObject !== mediaStream) return;
                        console.log('Video is playing');
                        // Double check dimensions after play
                        if (video.videoWidth > 0 && video.videoHeight > 0 && video.srcObject === mediaStream) {
                            setVideoReady(true);
                        }
                    };

                    const handleLoadedData = () => {
                        if (!isMounted || video.srcObject !== mediaStream) return;
                        console.log('Video loaded data');
                        if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused && video.srcObject === mediaStream) {
                            setVideoReady(true);
                        }
                    };

                    const handleError = (err) => {
                        console.error('Video error:', err);
                        setCameraError('Lỗi khi phát video. Vui lòng thử lại.');
                    };

                    // Store handlers for cleanup
                    eventHandlersRef.current = {
                        loadedmetadata: handleLoadedMetadata,
                        canplay: handleCanPlay,
                        play: handlePlay,
                        loadeddata: handleLoadedData,
                        error: handleError
                    };

                    // Add event listeners
                    video.addEventListener('loadedmetadata', handleLoadedMetadata);
                    video.addEventListener('canplay', handleCanPlay);
                    video.addEventListener('play', handlePlay);
                    video.addEventListener('loadeddata', handleLoadedData);
                    video.addEventListener('error', handleError);

                    // Try to play immediately
                    video.play()
                        .then(() => {
                            if (!isMounted || video.srcObject !== mediaStream) return;
                            console.log('Video play() called successfully on init');
                            // Check if video is actually playing
                            setTimeout(() => {
                                if (!isMounted || video.srcObject !== mediaStream) return;
                                console.log('Video status after play:', {
                                    paused: video.paused,
                                    ended: video.ended,
                                    videoWidth: video.videoWidth,
                                    videoHeight: video.videoHeight,
                                    readyState: video.readyState,
                                    currentTime: video.currentTime
                                });
                                if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
                                    setVideoReady(true);
                                }
                            }, 200);
                        })
                        .catch(playErr => {
                            if (!isMounted) return;
                            console.log('Video not ready to play yet, will wait for metadata:', playErr);
                            // Event listeners will handle playing when ready
                        });
                } else {
                    console.warn('videoRef.current is null, cannot set stream');
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                const errorMessage = err.name === 'NotAllowedError'
                    ? 'Vui lòng cho phép truy cập camera để sử dụng tính năng này.'
                    : err.name === 'NotFoundError'
                        ? 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.'
                        : err.name === 'NotReadableError'
                            ? 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.'
                            : 'Không thể truy cập camera. Vui lòng thử lại.';
                setCameraError(errorMessage);
                setVideoReady(false);
                setStream(null);
                streamRef.current = null;
                if (onError) {
                    onError(errorMessage);
                }
            }
        };

        // Start camera
        startCamera();

        // Cleanup function: Stop camera when component unmounts or autoStart changes
        return () => {
            console.log('CheckInCamera: Cleanup - stopping camera and detection');
            isMounted = false; // Mark as unmounted to prevent further operations

            // Stop stream directly without going through state updates
            // Use local variable first (fastest)
            if (currentStream) {
                try {
                    currentStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Track stopped in cleanup (currentStream):', track.kind);
                    });
                } catch (err) {
                    console.error('Error stopping currentStream in cleanup:', err);
                }
            }

            // Also stop from ref (backup)
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(track => {
                        track.stop();
                        console.log('Track stopped in cleanup (streamRef):', track.kind);
                    });
                } catch (err) {
                    console.error('Error stopping streamRef in cleanup:', err);
                }
                streamRef.current = null;
            }

            // Clear video element directly
            if (videoRef.current) {
                const video = videoRef.current;

                // Remove event listeners
                const handlers = eventHandlersRef.current;
                if (handlers && handlers.loadedmetadata) {
                    video.removeEventListener('loadedmetadata', handlers.loadedmetadata);
                    video.removeEventListener('canplay', handlers.canplay);
                    video.removeEventListener('play', handlers.play);
                    video.removeEventListener('loadeddata', handlers.loadeddata);
                    video.removeEventListener('error', handlers.error);
                    eventHandlersRef.current = {};
                }

                // Clear srcObject
                if (video.srcObject) {
                    const mediaStream = video.srcObject;
                    if (mediaStream && typeof mediaStream.getTracks === 'function') {
                        mediaStream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Track stopped in cleanup (video.srcObject):', track.kind);
                        });
                    }
                    video.srcObject = null;
                }

                video.pause();
            }

            // Stop detection
            if (stopDetection) {
                stopDetection();
            }

            // DO NOT set state here - it will cause re-renders and infinite loops
            // State will be cleared when component re-renders naturally
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart]); // ONLY depend on autoStart - this is critical to prevent infinite loop

    // Start detection when models are loaded and video is ready
    useEffect(() => {
        if (!modelsLoaded || !autoStart || !startDetection || !videoReady) {
            console.log('Waiting for detection to start:', {
                modelsLoaded,
                autoStart,
                startDetection: !!startDetection,
                videoReady
            });
            return;
        }

        const video = videoRef.current;
        if (!video) {
            console.warn('Video ref is null');
            return;
        }

        // Verify video has dimensions before starting detection
        if (!video.videoWidth || !video.videoHeight) {
            console.warn('Video dimensions not available:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                paused: video.paused
            });
            return;
        }

        // Verify video is actually playing
        if (video.paused || video.ended) {
            console.warn('Video is not playing:', {
                paused: video.paused,
                ended: video.ended
            });
            // Try to play
            video.play().catch(err => {
                console.error('Failed to play video:', err);
            });
            return;
        }

        console.log('All conditions met, starting detection...', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            paused: video.paused
        });

        // Small delay to ensure everything is stable (reduced for faster start)
        const timeoutId = setTimeout(() => {
            startDetection();
        }, 100); // Reduced from 200ms to 100ms

        return () => {
            clearTimeout(timeoutId);
        };
    }, [modelsLoaded, autoStart, startDetection, videoReady]);

    // Verify face encoding (for check-in mode or enrollment validation)
    const verifyFaceEncoding = useCallback(async (descriptor) => {
        if (!descriptor) return false;

        setIsVerifying(true);
        setVerificationError(null);

        try {
            if (verificationMode) {
                // Check-in mode: verify with server (with timeout for faster failure detection)
                console.log('[CheckInCamera] Starting face verification...');
                // Verify with server - increased timeout to 10 seconds for reliability
                const verifyPromise = checkInAPI.verifyFace(descriptor);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Verification timeout after 10 seconds')), 10000)
                );

                let result;
                try {
                    result = await Promise.race([verifyPromise, timeoutPromise]);
                } catch (timeoutError) {
                    console.error('[CheckInCamera] Verification timeout:', timeoutError);
                    throw new Error('Verification timeout - server không phản hồi');
                }

                console.log('[CheckInCamera] Verification result:', {
                    success: result.success,
                    isMatch: result.isMatch,
                    similarity: result.similarity,
                    threshold: result.threshold,
                    message: result.message
                });

                // CRITICAL: Only set faceVerified to true if result.isMatch is EXPLICITLY true
                if (result.success === true && result.isMatch === true) {
                    console.log('[CheckInCamera] ✅ Verification PASSED - similarity:', result.similarity, 'threshold:', result.threshold);
                    setFaceVerified(true);
                    if (onFaceVerified) {
                        onFaceVerified(true, result.similarity, result.threshold || 0.85);
                    }
                    setIsVerifying(false);
                    return true;
                } else {
                    // Explicitly fail verification if not matching
                    console.log('[CheckInCamera] ❌ Verification FAILED - success:', result.success, 'isMatch:', result.isMatch, 'similarity:', result.similarity, 'threshold:', result.threshold);
                    setFaceVerified(false); // Explicitly set to false
                    setVerificationError(result.message || 'Khuôn mặt không hợp lệ');
                    if (onFaceVerified) {
                        onFaceVerified(false, result.similarity || 0, result.threshold || 0.85);
                    }
                    setIsVerifying(false);
                    return false;
                }
            } else if (storedEncodings && storedEncodings.length > 0) {
                // Enrollment mode: verify with stored encodings (client-side only for faster feedback)
                const validation = compareWithStoredEncodings(descriptor, storedEncodings, 0.65);
                if (validation.isValid) {
                    setFaceVerified(true);
                    setVerificationError(null);
                    setIsVerifying(false);
                    return true;
                } else {
                    setFaceVerified(false);
                    setVerificationError(null); // Don't show error in enrollment mode, let parent handle it
                    setIsVerifying(false);
                    return false;
                }
            } else {
                // No verification needed (first enrollment step)
                setFaceVerified(true);
                setVerificationError(null);
                setIsVerifying(false);
                return true;
            }
        } catch (err) {
            console.error('[CheckInCamera] Verification error:', err);
            console.error('[CheckInCamera] Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            // CRITICAL: Always set to false on error
            setFaceVerified(false);
            setVerificationError('Lỗi khi xác thực khuôn mặt: ' + (err.message || 'Unknown error'));
            if (onFaceVerified) {
                onFaceVerified(false, 0, 0.85);
            }
            setIsVerifying(false);
            return false;
        }
    }, [verificationMode, storedEncodings, onFaceVerified]);

    // Verify face when detected (debounced)
    useEffect(() => {
        // Clear any pending verifications
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }

        // CRITICAL: In verification mode, ALWAYS verify when face is detected - no caching for security
        if (verificationMode && faceDetected && faceDescriptor) {
            const currentDescriptor = faceDescriptor;
            const previousDescriptor = previousDescriptorRef.current;

            // Check if face has changed significantly (different person)
            let faceChanged = false;
            if (previousDescriptor && previousDescriptor.length === currentDescriptor.length) {
                // Calculate difference between descriptors
                const diff = previousDescriptor.reduce((sum, val, idx) => {
                    return sum + Math.abs(val - currentDescriptor[idx]);
                }, 0);
                const avgDiff = diff / previousDescriptor.length;

                // If average difference is > 0.2, it's likely a different face
                if (avgDiff > 0.2) {
                    faceChanged = true;
                    console.log('[CheckInCamera] ⚠️ Face changed significantly (avgDiff:', avgDiff.toFixed(4), ') - resetting verification');
                }
            }

            // CRITICAL: Reset verification state immediately when new face is detected or face changes
            // This prevents showing "verified" from previous face
            if (!previousDescriptor || faceChanged) {
                console.log('[CheckInCamera] New face detected or face changed, resetting verification state');
                setFaceVerified(false);
                setVerificationError(null);
                lastVerifiedDescriptorRef.current = null;
            }

            // Update previous descriptor
            previousDescriptorRef.current = currentDescriptor;

            console.log('[CheckInCamera] Face detected in verification mode, verifying...');

            // Verify with short debounce to batch rapid updates but ensure security
            verificationTimeoutRef.current = setTimeout(() => {
                // Double check: make sure we're still looking at the same face
                if (!faceDetected || !faceDescriptor) {
                    console.log('[CheckInCamera] Face no longer detected, aborting verification');
                    setFaceVerified(false);
                    return;
                }

                // Check if descriptor still matches (face might have changed)
                if (faceDescriptor !== currentDescriptor) {
                    console.log('[CheckInCamera] Face descriptor changed during debounce, aborting verification');
                    setFaceVerified(false);
                    return;
                }

                console.log('[CheckInCamera] Calling verifyFaceEncoding with descriptor length:', currentDescriptor.length);

                // ALWAYS verify - never skip or cache for security
                verifyFaceEncoding(currentDescriptor).then(verified => {
                    // Double check: make sure face is still detected and descriptor hasn't changed
                    if (!faceDetected || faceDescriptor !== currentDescriptor) {
                        console.log('[CheckInCamera] Face changed after verification, not updating state');
                        setFaceVerified(false);
                        return;
                    }

                    if (verified) {
                        console.log('[CheckInCamera] ✅ Face verified successfully');
                        lastVerifiedDescriptorRef.current = currentDescriptor;
                    } else {
                        console.log('[CheckInCamera] ❌ Face verification FAILED');
                        setFaceVerified(false); // Explicitly set to false
                        lastVerifiedDescriptorRef.current = null; // Reset on failure
                    }
                }).catch(err => {
                    console.error('[CheckInCamera] Verification error:', err);
                    setFaceVerified(false); // Explicitly set to false on error
                    lastVerifiedDescriptorRef.current = null;
                });
            }, 300);
        } else if (!verificationMode && faceDetected && faceDescriptor) {
            // Non-verification mode: only verify if descriptor changed significantly
            verificationTimeoutRef.current = setTimeout(() => {
                const currentDescriptor = faceDescriptor;
                const lastVerified = lastVerifiedDescriptorRef.current;

                if (!lastVerified) {
                    verifyFaceEncoding(currentDescriptor).then(verified => {
                        if (verified) {
                            lastVerifiedDescriptorRef.current = currentDescriptor;
                        }
                    });
                    return;
                }

                // Compare descriptors - only verify if significantly different
                if (lastVerified.length !== currentDescriptor.length) {
                    verifyFaceEncoding(currentDescriptor).then(verified => {
                        if (verified) {
                            lastVerifiedDescriptorRef.current = currentDescriptor;
                        }
                    });
                    return;
                }

                // Calculate difference
                const diff = lastVerified.reduce((sum, val, idx) => {
                    return sum + Math.abs(val - currentDescriptor[idx]);
                }, 0);
                const avgDiff = diff / lastVerified.length;

                // Only verify if average difference is significant
                if (avgDiff > 0.1) {
                    verifyFaceEncoding(currentDescriptor).then(verified => {
                        if (verified) {
                            lastVerifiedDescriptorRef.current = currentDescriptor;
                        }
                    });
                }
            }, 200);
        } else if (!faceDetected || (verificationMode && !faceDescriptor)) {
            // Reset when face is no longer detected or descriptor is missing
            console.log('[CheckInCamera] Face not detected, resetting verification state');
            setFaceVerified(false);
            setVerificationError(null);
            lastVerifiedDescriptorRef.current = null;
            previousDescriptorRef.current = null; // Reset previous descriptor
            if (onFaceVerified) {
                onFaceVerified(false, 0, 0.85);
            }
        }

        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
        };
    }, [verificationMode, faceDetected, faceDescriptor, verifyFaceEncoding]);

    // Notify parent when face is detected (only if verified or not in verification mode)
    const lastNotifiedDescriptorRef = useRef(null);
    const notificationTimeoutRef = useRef(null);

    useEffect(() => {
        // Clear any pending notifications
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        // Only notify if face is detected and (not in verification mode or verified)
        if (faceDetected && faceDescriptor && onFaceDetected) {
            const shouldNotify = !verificationMode || faceVerified;

            if (shouldNotify) {
                // Debounce notifications
                notificationTimeoutRef.current = setTimeout(() => {
                    const currentDescriptor = faceDescriptor;
                    const lastNotified = lastNotifiedDescriptorRef.current;

                    if (!lastNotified) {
                        lastNotifiedDescriptorRef.current = currentDescriptor;
                        onFaceDetected(currentDescriptor);
                        return;
                    }

                    // Compare descriptors
                    if (lastNotified.length !== currentDescriptor.length) {
                        lastNotifiedDescriptorRef.current = currentDescriptor;
                        onFaceDetected(currentDescriptor);
                        return;
                    }

                    const diff = lastNotified.reduce((sum, val, idx) => {
                        return sum + Math.abs(val - currentDescriptor[idx]);
                    }, 0);
                    const avgDiff = diff / lastNotified.length;

                    // Reduced threshold (0.1 instead of 0.15) for faster notification
                    if (avgDiff > 0.1) {
                        lastNotifiedDescriptorRef.current = currentDescriptor;
                        onFaceDetected(currentDescriptor);
                    }
                }, 150); // Reduced debounce: 150ms instead of 500ms for faster response
            }
        } else if (!faceDetected) {
            lastNotifiedDescriptorRef.current = null;
        }

        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, [faceDetected, faceDescriptor, faceVerified, verificationMode, onFaceDetected]);

    // Handle errors
    useEffect(() => {
        if (faceApiError && onError) {
            onError(faceApiError);
        }
    }, [faceApiError, onError]);

    const handleStart = () => {
        startDetection();
    };

    const handleStop = () => {
        stopDetection();
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return null;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    // Always show camera wrapper, even when loading or error
    // This ensures the video element is always rendered and visible

    return (
        <div className="checkin-camera-container">
            {cameraError && (
                <div className="camera-error" style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#7f1d1d',
                    border: '1px solid #991b1b',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    textAlign: 'center'
                }}>
                    <div className="error-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                    <p>{cameraError}</p>
                </div>
            )}
            {!modelsLoaded && (
                <div className="camera-loading" style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#1e3a8a',
                    borderRadius: '8px',
                    color: '#dbeafe',
                    textAlign: 'center'
                }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p>{loadingProgress || 'Đang tải mô hình nhận diện khuôn mặt...'}</p>
                    {faceApiError && (
                        <p className="error-text" style={{ color: '#fca5a5', marginTop: '1rem' }}>
                            {faceApiError}
                        </p>
                    )}
                </div>
            )}
            <div className="camera-wrapper">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        backgroundColor: streamRef.current ? 'transparent' : '#000', // Black background when no stream
                        display: 'block',
                        minHeight: '300px',
                        position: 'relative',
                        zIndex: 1
                    }}
                />
                {!streamRef.current && !cameraError && autoStart && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#9ca3af',
                        fontSize: '1rem',
                        zIndex: 2,
                        textAlign: 'center',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '1rem',
                        borderRadius: '8px'
                    }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 0.5rem', width: '24px', height: '24px' }}></div>
                        Đang khởi động camera...
                    </div>
                )}
                {modelsLoaded && (
                    <canvas
                        ref={canvasRef}
                        className="camera-canvas"
                    />
                )}
                {/* CRITICAL: Only show "verified" message when EXPLICITLY verified by server in verification mode */}
                {verificationMode && faceDetected && faceDescriptor && faceVerified === true && !isVerifying && (
                    <div className="face-detected-indicator" style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        zIndex: 20
                    }}>
                        <span>✓ Khuôn mặt đã được xác thực thành công</span>
                    </div>
                )}
                {/* Show error message when verification fails */}
                {verificationMode && faceDetected && faceDescriptor && faceVerified === false && !isVerifying && verificationError && (
                    <div className="face-verification-error" style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#dc2626',
                        color: '#fee2e2',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        maxWidth: '80%',
                        textAlign: 'center',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        fontWeight: 'bold'
                    }}>
                        <span>❌ {verificationError}</span>
                    </div>
                )}
                {/* Show detection message only in enrollment mode (not verification) */}
                {!verificationMode && faceDetected && (
                    <div className="face-detected-indicator">
                        <span>✓ Khuôn mặt đã được nhận diện</span>
                    </div>
                )}
                {isVerifying && !faceVerified && (
                    <div className="face-verifying-indicator" style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1e3a8a',
                        color: '#dbeafe',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        <span>Đang xác thực khuôn mặt...</span>
                    </div>
                )}
                {verificationMode && faceDetected && !faceVerified && verificationError && !isVerifying && (
                    <div className="face-verification-error" style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#7f1d1d',
                        color: '#fca5a5',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        maxWidth: '80%',
                        textAlign: 'center',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        <span>{verificationError}</span>
                    </div>
                )}
            </div>
            {!stream && !cameraError && autoStart && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#1e3a8a',
                    borderRadius: '8px',
                    color: '#dbeafe',
                    textAlign: 'center'
                }}>
                    <p>Đang khởi động camera...</p>
                </div>
            )}
            <div className="camera-controls">
                {!isDetecting && modelsLoaded && (
                    <button onClick={handleStart} className="btn-start">
                        Bắt đầu nhận diện
                    </button>
                )}
                {isDetecting && (
                    <button onClick={handleStop} className="btn-stop">
                        Dừng nhận diện
                    </button>
                )}
            </div>
        </div>
    );
};

// Export capture function
CheckInCamera.captureImage = (videoRef) => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
};

export default CheckInCamera;

