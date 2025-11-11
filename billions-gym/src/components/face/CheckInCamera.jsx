import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useLivenessDetection } from '../../hooks/useLivenessDetection';
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
    // CRITICAL: Log verification mode on mount to ensure it's set correctly
    useEffect(() => {
        console.log('[CheckInCamera] Component mounted/updated with verificationMode:', verificationMode);
        console.log('[CheckInCamera] storedEncodings:', storedEncodings ? `${storedEncodings.length} encodings` : 'null');
        if (verificationMode) {
            console.log('[CheckInCamera] 🔒 SECURITY: Verification mode is ACTIVE - server verification is REQUIRED');
        }
    }, [verificationMode, storedEncodings]);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null); // Use ref to store stream for proper cleanup
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [faceVerified, setFaceVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const [livenessRequired, setLivenessRequired] = useState(false); // Track if liveness is required
    const [continuousDetectionTime, setContinuousDetectionTime] = useState(0); // Track continuous detection time
    const lastVerifiedDescriptorRef = useRef(null);
    const previousDescriptorRef = useRef(null); // Track previous descriptor to detect face changes
    const verificationTimeoutRef = useRef(null);
    const eventHandlersRef = useRef({}); // Store event handlers for cleanup
    const continuousDetectionStartRef = useRef(null); // Track when continuous detection started
    const minContinuousDetectionTime = 3000; // Require at least 3 seconds of continuous detection
    // Use refs to store latest liveness values to avoid stale closure values
    const latestLivenessChecksRef = useRef({ blinks: 0, headMovements: 0, mouthMovements: 0, faceSizeVariations: 0 });
    const latestContinuousDetectionTimeRef = useRef(0);
    const latestLivenessResultRef = useRef(null); // Store latest liveness result from processLandmarks

    const {
        modelsLoaded,
        isDetecting,
        faceDetected,
        faceDescriptor,
        faceLandmarks,
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

    // Liveness detection - only for verification mode
    const {
        processLandmarks,
        reset: resetLiveness,
        isLive,
        livenessScore,
        livenessChecks
    } = useLivenessDetection({
        minBlinks: 1,
        minHeadMovements: 2,
        detectionWindow: 5000,
        earThreshold: 0.25,
        movementThreshold: 0.02
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
        if (!descriptor) {
            console.error('[CheckInCamera] verifyFaceEncoding called with null descriptor');
            return false;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            // CRITICAL SECURITY FIX: In verification mode, ALWAYS verify with server
            // There is NO fallback or default pass - this prevents the security bypass bug
            if (verificationMode) {
                // CRITICAL: Validate descriptor before sending to server
                if (!descriptor) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Descriptor is null/undefined!');
                    setFaceVerified(false);
                    setVerificationError('Không thể lấy dữ liệu khuôn mặt. Vui lòng đảm bảo camera hoạt động tốt và thử lại.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                if (!Array.isArray(descriptor)) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Descriptor is not an array!', typeof descriptor);
                    setFaceVerified(false);
                    setVerificationError('Dữ liệu khuôn mặt không hợp lệ. Vui lòng thử lại.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                if (descriptor.length !== 128) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Descriptor length is not 128!', descriptor.length);
                    setFaceVerified(false);
                    setVerificationError(`Dữ liệu khuôn mặt không đúng định dạng (${descriptor.length} giá trị thay vì 128). Vui lòng thử lại.`);
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                // Check for invalid values
                const hasInvalidValues = descriptor.some(val => typeof val !== 'number' || isNaN(val) || !isFinite(val));
                if (hasInvalidValues) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Descriptor contains invalid values (NaN/Infinity)!');
                    setFaceVerified(false);
                    setVerificationError('Dữ liệu khuôn mặt chứa giá trị không hợp lệ. Vui lòng thử lại.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                // Check if all zeros
                const isAllZeros = descriptor.every(val => val === 0);
                if (isAllZeros) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Descriptor is all zeros!');
                    setFaceVerified(false);
                    setVerificationError('Không thể nhận diện khuôn mặt. Vui lòng đảm bảo camera hoạt động tốt và khuôn mặt được nhìn thấy rõ.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                console.log('[CheckInCamera] 🔒 VERIFICATION MODE: Starting server verification...');
                console.log('[CheckInCamera] Descriptor length:', descriptor.length);
                console.log('[CheckInCamera] Descriptor type:', typeof descriptor, Array.isArray(descriptor) ? 'Array' : 'Not Array');
                console.log('[CheckInCamera] Descriptor preview (first 10 values):', descriptor.slice(0, 10));
                console.log('[CheckInCamera] Descriptor stats:', {
                    length: descriptor.length,
                    min: Math.min(...descriptor),
                    max: Math.max(...descriptor),
                    sum: descriptor.reduce((a, b) => a + b, 0),
                    avg: descriptor.reduce((a, b) => a + b, 0) / descriptor.length,
                    hasNaN: descriptor.some(val => isNaN(val)),
                    hasInfinity: descriptor.some(val => !isFinite(val)),
                    isAllZeros: descriptor.every(val => val === 0)
                });

                // Verify with server - increased timeout to 10 seconds for reliability
                console.log('[CheckInCamera] 🔒 Sending descriptor to server for verification...');
                const verifyPromise = checkInAPI.verifyFace(descriptor);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Verification timeout after 10 seconds')), 10000)
                );

                let result;
                try {
                    result = await Promise.race([verifyPromise, timeoutPromise]);
                } catch (timeoutError) {
                    console.error('[CheckInCamera] ⚠️ Verification timeout:', timeoutError);
                    setFaceVerified(false);
                    setVerificationError('Server không phản hồi. Vui lòng thử lại.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                console.log('[CheckInCamera] 📊 Server verification result:', {
                    success: result.success,
                    isMatch: result.isMatch,
                    similarity: result.similarity,
                    similarityWithAverage: result.similarityWithAverage,
                    threshold: result.threshold,
                    message: result.message,
                    matchesWithStored: result.matchesWithStored,
                    totalStored: result.totalStored,
                    requiredMatches: result.requiredMatches
                });

                // CRITICAL: Log if similarity is 0 - this indicates a problem
                if (result.similarity === 0 || result.similarity === null || result.similarity === undefined) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL: Similarity is 0 or null!');
                    console.error('[CheckInCamera] This indicates a problem with face encoding comparison');
                    console.error('[CheckInCamera] Descriptor length:', currentDescriptor ? currentDescriptor.length : 'null');
                    console.error('[CheckInCamera] Descriptor preview (first 10 values):', currentDescriptor ? currentDescriptor.slice(0, 10) : 'null');
                    console.error('[CheckInCamera] Descriptor stats:', currentDescriptor ? {
                        length: currentDescriptor.length,
                        min: Math.min(...currentDescriptor),
                        max: Math.max(...currentDescriptor),
                        sum: currentDescriptor.reduce((a, b) => a + b, 0),
                        avg: currentDescriptor.reduce((a, b) => a + b, 0) / currentDescriptor.length,
                        hasNaN: currentDescriptor.some(val => isNaN(val)),
                        hasInfinity: currentDescriptor.some(val => !isFinite(val)),
                        isAllZeros: currentDescriptor.every(val => val === 0)
                    } : 'null');
                    console.error('[CheckInCamera] Full server response:', JSON.stringify(result, null, 2));

                    // Set a more helpful error message
                    setVerificationError('Không thể so sánh khuôn mặt. Vui lòng đảm bảo camera hoạt động tốt và thử lại. Nếu vấn đề vẫn tiếp tục, vui lòng đăng ký lại khuôn mặt.');
                }

                // CRITICAL: Only set faceVerified to true if result.isMatch is EXPLICITLY true
                // This is the ONLY way to pass verification in verification mode
                if (result.success === true && result.isMatch === true) {
                    console.log('[CheckInCamera] ✅✅✅ VERIFICATION PASSED - Face matches registered face');
                    console.log('[CheckInCamera] Similarity:', result.similarity, 'Threshold:', result.threshold);
                    setFaceVerified(true);
                    if (onFaceVerified) {
                        onFaceVerified(true, result.similarity, result.threshold || 0.95);
                    }
                    setIsVerifying(false);
                    return true;
                } else {
                    // Explicitly fail verification if not matching
                    console.log('[CheckInCamera] ❌❌❌ VERIFICATION FAILED - Face does NOT match registered face');
                    console.log('[CheckInCamera] Failure reason:', {
                        success: result.success,
                        isMatch: result.isMatch,
                        similarity: result.similarity,
                        threshold: result.threshold,
                        message: result.message
                    });
                    setFaceVerified(false); // Explicitly set to false
                    // Use server message if available, otherwise create custom message
                    const errorMessage = result.message ||
                        (result.similarity === 0
                            ? 'Không thể so sánh khuôn mặt. Vui lòng thử lại hoặc đăng ký lại khuôn mặt.'
                            : `Khuôn mặt không khớp với khuôn mặt đã đăng ký (Độ tương đồng: ${((result.similarity || 0) * 100).toFixed(1)}%, Yêu cầu: ≥${((result.threshold || 0.95) * 100).toFixed(0)}%)`);
                    setVerificationError(errorMessage);
                    if (onFaceVerified) {
                        // Ensure we use the threshold from server response, not default
                        onFaceVerified(false, result.similarity || 0, result.threshold || 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }
            }
            // Enrollment mode: Only verify with stored encodings if provided (for step 2+)
            else if (storedEncodings && storedEncodings.length > 0) {
                console.log('[CheckInCamera] 📝 ENROLLMENT MODE: Verifying with stored encodings...');
                const validation = compareWithStoredEncodings(descriptor, storedEncodings, 0.65);
                if (validation.isValid) {
                    console.log('[CheckInCamera] ✅ Enrollment verification passed (client-side)');
                    setFaceVerified(true);
                    setVerificationError(null);
                    setIsVerifying(false);
                    return true;
                } else {
                    console.log('[CheckInCamera] ❌ Enrollment verification failed (client-side)');
                    setFaceVerified(false);
                    setVerificationError(null); // Don't show error in enrollment mode, let parent handle it
                    setIsVerifying(false);
                    return false;
                }
            }
            // First enrollment step: No verification needed (just detecting face)
            // CRITICAL SECURITY: This branch should ONLY be reached when verificationMode = false
            // If verificationMode = true, we should have already handled it in the first branch
            else {
                // SECURITY CHECK: If we somehow reach here with verificationMode = true, it's a bug
                if (verificationMode) {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL SECURITY BUG: verificationMode = true but reached else branch!');
                    console.error('[CheckInCamera] This should NEVER happen - verificationMode must verify with server!');
                    setFaceVerified(false);
                    setVerificationError('Lỗi hệ thống: Không thể xác thực. Vui lòng thử lại.');
                    if (onFaceVerified) {
                        onFaceVerified(false, 0, 0.95);
                    }
                    setIsVerifying(false);
                    return false;
                }

                console.log('[CheckInCamera] 📝 ENROLLMENT MODE: First step - no verification needed, just detecting face');
                console.log('[CheckInCamera] verificationMode =', verificationMode, '(should be false)');
                // Only set to true for enrollment step 1 (not verification mode)
                // This is safe because enrollment mode doesn't allow check-in
                setFaceVerified(true);
                setVerificationError(null);
                setIsVerifying(false);
                return true;
            }
        } catch (err) {
            console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL ERROR in verification:', err);
            console.error('[CheckInCamera] Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name,
                verificationMode: verificationMode
            });

            // CRITICAL: Always set to false on error, especially in verification mode
            // This prevents false positives from errors
            setFaceVerified(false);
            setVerificationError('Lỗi khi xác thực khuôn mặt: ' + (err.message || 'Unknown error'));
            if (onFaceVerified) {
                onFaceVerified(false, 0, 0.85);
            }
            setIsVerifying(false);
            return false;
        }
    }, [verificationMode, storedEncodings, onFaceVerified]);

    // Process landmarks for liveness detection (in verification mode)
    useEffect(() => {
        if (verificationMode && faceDetected && faceLandmarks) {
            // Process landmarks for liveness detection
            const livenessResult = processLandmarks(faceLandmarks);
            // CRITICAL: Store latest result in ref to avoid stale closure values
            latestLivenessResultRef.current = livenessResult;
            latestLivenessChecksRef.current = livenessResult.checks;
            console.log('[CheckInCamera] Liveness detection:', {
                isLive: livenessResult.isLive,
                score: livenessResult.score,
                checks: livenessResult.checks
            });
        }
    }, [verificationMode, faceDetected, faceLandmarks, processLandmarks]);

    // Track continuous detection time (for time-based verification)
    useEffect(() => {
        let intervalId = null;

        if (verificationMode && faceDetected && faceDescriptor) {
            if (!continuousDetectionStartRef.current) {
                continuousDetectionStartRef.current = Date.now();
            }

            // Update time every 100ms for smoother UI
            intervalId = setInterval(() => {
                if (continuousDetectionStartRef.current) {
                    const elapsed = Date.now() - continuousDetectionStartRef.current;
                    setContinuousDetectionTime(elapsed);
                    // CRITICAL: Store latest time in ref to avoid stale closure values
                    latestContinuousDetectionTimeRef.current = elapsed;
                }
            }, 100);
        } else {
            continuousDetectionStartRef.current = null;
            setContinuousDetectionTime(0);
            latestContinuousDetectionTimeRef.current = 0;
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [verificationMode, faceDetected, faceDescriptor]);

    // Verify face when detected (debounced)
    // FIXED: Now triggers when liveness requirements are met by including livenessChecks and continuousDetectionTime in dependencies
    useEffect(() => {
        // Clear any pending verifications
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }

        // CRITICAL SECURITY: In verification mode, ALWAYS verify with server when face is detected
        // There is NO bypass, NO cache, NO fallback - every face must be verified with server
        // ADDITIONAL: Require liveness detection and continuous detection time
        if (verificationMode && faceDetected && faceDescriptor) {
            const currentDescriptor = faceDescriptor;
            const previousDescriptor = previousDescriptorRef.current;

            // CRITICAL SECURITY FIX: In verification mode, ALWAYS reset verification state when face changes
            // This ensures we never show "verified" from a previous face
            // We reset FIRST, then verify - this prevents any possibility of showing stale verification state

            let shouldReset = false;
            let resetReason = '';

            if (!previousDescriptor) {
                // First face detected - always reset
                shouldReset = true;
                resetReason = 'First face detected';
                console.log('[CheckInCamera] 🔒 FIRST FACE: Resetting verification state');
            } else if (previousDescriptor.length !== currentDescriptor.length) {
                // Descriptor length changed - definitely a different face
                shouldReset = true;
                resetReason = 'Descriptor length changed';
                console.log('[CheckInCamera] 🔒 DESCRIPTOR LENGTH CHANGED: Resetting verification state');
            } else {
                // Check if face has changed significantly by comparing descriptor values
                const diff = previousDescriptor.reduce((sum, val, idx) => {
                    return sum + Math.abs(val - currentDescriptor[idx]);
                }, 0);
                const avgDiff = diff / previousDescriptor.length;

                // CRITICAL: If average difference is > 0.05, treat it as a new face
                // This is a very sensitive threshold to catch ANY face change, including:
                // - Switching to a phone image
                // - Switching to another person
                // - Slight position changes that might indicate a different face
                if (avgDiff > 0.05) {
                    shouldReset = true;
                    resetReason = `Face changed (avgDiff: ${avgDiff.toFixed(4)})`;
                    console.log('[CheckInCamera] 🔒 FACE CHANGED: avgDiff =', avgDiff.toFixed(4), '- Resetting verification state');
                } else {
                    // Face seems the same - but in verification mode, we still want to re-verify periodically
                    // Check if we haven't verified this exact descriptor yet
                    const lastVerified = lastVerifiedDescriptorRef.current;
                    if (!lastVerified || lastVerified.length !== currentDescriptor.length) {
                        shouldReset = true;
                        resetReason = 'No previous verification for this descriptor';
                        console.log('[CheckInCamera] 🔒 NO PREVIOUS VERIFICATION: Resetting for fresh verification');
                    } else {
                        // Check if current descriptor matches last verified descriptor
                        const verifiedDiff = lastVerified.reduce((sum, val, idx) => {
                            return sum + Math.abs(val - currentDescriptor[idx]);
                        }, 0);
                        const verifiedAvgDiff = verifiedDiff / lastVerified.length;

                        // If current descriptor is different from last verified, reset
                        if (verifiedAvgDiff > 0.05) {
                            shouldReset = true;
                            resetReason = `Descriptor differs from last verified (avgDiff: ${verifiedAvgDiff.toFixed(4)})`;
                            console.log('[CheckInCamera] 🔒 DESCRIPTOR DIFFERS FROM VERIFIED: Resetting verification state');
                        }
                    }
                }
            }

            // CRITICAL SECURITY: Reset verification state immediately when face changes
            // This must happen BEFORE any async operations to prevent showing stale "verified" state
            if (shouldReset) {
                console.log('[CheckInCamera] 🔒 IMMEDIATE RESET:', resetReason);
                console.log('[CheckInCamera] Resetting verification state NOW to prevent showing stale verification');
                // Reset immediately - don't wait for debounce
                setFaceVerified(false);
                setVerificationError(null);
                // Don't reset lastVerifiedDescriptorRef here - we'll update it after verification
            }

            // Update previous descriptor AFTER reset
            previousDescriptorRef.current = currentDescriptor;

            console.log('[CheckInCamera] 🔒 VERIFICATION MODE: Face detected, starting server verification...');
            console.log('[CheckInCamera] Descriptor length:', currentDescriptor.length);
            console.log('[CheckInCamera] Previous descriptor exists:', !!previousDescriptor);
            console.log('[CheckInCamera] Descriptors are same object:', previousDescriptor === currentDescriptor);

            // Verify with short debounce to batch rapid updates but ensure security
            verificationTimeoutRef.current = setTimeout(() => {
                // Double check: make sure we're still looking at the same face
                if (!faceDetected || !faceDescriptor) {
                    console.log('[CheckInCamera] ⚠️ Face no longer detected, aborting verification');
                    setFaceVerified(false);
                    return;
                }

                // Check if descriptor still matches (face might have changed)
                if (faceDescriptor !== currentDescriptor) {
                    console.log('[CheckInCamera] ⚠️ Face descriptor changed during debounce, aborting verification');
                    setFaceVerified(false);
                    return;
                }

                // CRITICAL SECURITY: Check liveness and continuous detection requirements
                // Use refs to get latest values (avoid stale closure values)
                const latestTime = latestContinuousDetectionTimeRef.current;
                const latestChecks = latestLivenessChecksRef.current;
                const latestLivenessResult = latestLivenessResultRef.current;

                // Require at least 3 seconds of continuous detection (prevents photo spoofing)
                const hasMinContinuousTime = latestTime >= minContinuousDetectionTime;

                // Require liveness detection to pass (blinks, head movements)
                // FIXED: Use latest values from refs to ensure accuracy
                const hasBlinks = latestChecks.blinks >= 1;
                const hasHeadMovements = latestChecks.headMovements >= 2;
                const hasLiveness = hasBlinks || hasHeadMovements;

                console.log('[CheckInCamera] 🔒 SECURITY CHECKS (using latest ref values):', {
                    continuousDetectionTime: latestTime,
                    continuousDetectionTimeState: continuousDetectionTime,
                    minRequired: minContinuousDetectionTime,
                    hasMinContinuousTime: hasMinContinuousTime,
                    isLive: latestLivenessResult?.isLive || isLive,
                    livenessScore: latestLivenessResult?.score || livenessScore,
                    livenessChecks: latestChecks,
                    livenessChecksState: livenessChecks,
                    hasLiveness: hasLiveness,
                    hasBlinks: hasBlinks,
                    hasHeadMovements: hasHeadMovements,
                    blinks: latestChecks.blinks,
                    headMovements: latestChecks.headMovements
                });

                // CRITICAL: Block verification if time requirement not met
                if (!hasMinContinuousTime) {
                    console.log('[CheckInCamera] ⚠️ WAITING: Continuous detection time insufficient', {
                        current: latestTime,
                        required: minContinuousDetectionTime,
                        remaining: minContinuousDetectionTime - latestTime
                    });
                    setVerificationError(`Vui lòng giữ khuôn mặt ổn định thêm ${((minContinuousDetectionTime - latestTime) / 1000).toFixed(1)} giây...`);
                    return; // Wait for more time
                }

                // CRITICAL: Block verification if liveness requirements not met
                // FIXED: Now properly checks liveness requirements and blocks if not met
                if (!hasLiveness) {
                    console.log('[CheckInCamera] ⚠️ BLOCKED: Liveness requirements not met', {
                        blinks: latestChecks.blinks,
                        requiredBlinks: 1,
                        headMovements: latestChecks.headMovements,
                        requiredHeadMovements: 2,
                        hasBlinks: hasBlinks,
                        hasHeadMovements: hasHeadMovements
                    });
                    if (!hasBlinks && !hasHeadMovements) {
                        setVerificationError('Vui lòng chớp mắt ít nhất 1 lần HOẶC di chuyển đầu ít nhất 2 lần để xác thực liveness.');
                    } else if (!hasBlinks) {
                        setVerificationError('Vui lòng chớp mắt ít nhất 1 lần để xác thực liveness.');
                    } else if (!hasHeadMovements) {
                        setVerificationError('Vui lòng di chuyển đầu ít nhất 2 lần để xác thực liveness.');
                    }
                    return; // Block verification until liveness requirements are met
                }

                console.log('[CheckInCamera] ✅ SECURITY CHECKS PASSED:', {
                    hasMinContinuousTime: true,
                    hasLiveness: true,
                    blinks: latestChecks.blinks,
                    headMovements: latestChecks.headMovements,
                    continuousTime: latestTime
                });

                console.log('[CheckInCamera] 🔒 Calling verifyFaceEncoding - SERVER VERIFICATION REQUIRED');
                console.log('[CheckInCamera] Descriptor preview (first 5 values):', currentDescriptor.slice(0, 5));

                // CRITICAL: ALWAYS verify with server - NEVER skip or cache
                // This is the ONLY way to pass verification in verification mode
                // Liveness and time requirements have been checked above
                verifyFaceEncoding(currentDescriptor).then(verified => {
                    // Double check: make sure face is still detected and descriptor hasn't changed
                    if (!faceDetected || faceDescriptor !== currentDescriptor) {
                        console.log('[CheckInCamera] ⚠️ Face changed after verification, NOT updating state');
                        setFaceVerified(false);
                        return;
                    }

                    if (verified) {
                        console.log('[CheckInCamera] ✅✅✅ SERVER VERIFIED: Face matches registered face');
                        lastVerifiedDescriptorRef.current = currentDescriptor;
                    } else {
                        console.log('[CheckInCamera] ❌❌❌ SERVER REJECTED: Face does NOT match registered face');
                        setFaceVerified(false); // Explicitly set to false
                        lastVerifiedDescriptorRef.current = null; // Reset on failure
                    }
                }).catch(err => {
                    console.error('[CheckInCamera] ⚠️⚠️⚠️ CRITICAL ERROR in verifyFaceEncoding:', err);
                    setFaceVerified(false); // Explicitly set to false on error
                    lastVerifiedDescriptorRef.current = null;
                    setVerificationError('Lỗi khi xác thực: ' + (err.message || 'Unknown error'));
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
            continuousDetectionStartRef.current = null;
            setContinuousDetectionTime(0);
            latestContinuousDetectionTimeRef.current = 0;
            latestLivenessChecksRef.current = { blinks: 0, headMovements: 0, mouthMovements: 0, faceSizeVariations: 0 };
            latestLivenessResultRef.current = null;
            resetLiveness(); // Reset liveness detection
            if (onFaceVerified) {
                onFaceVerified(false, 0, 0.85);
            }
        }

        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
        };
        // FIXED: Include livenessChecks and continuousDetectionTime to trigger verification when requirements are met
    }, [verificationMode, faceDetected, faceDescriptor, verifyFaceEncoding, livenessChecks, continuousDetectionTime]);

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
                    background: '#da2128',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div className="error-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                    <p className='text-white'>{cameraError}</p>
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
                {/* CRITICAL SECURITY: Only show "verified" message when EXPLICITLY verified by server */}
                {/* This message should ONLY appear when server confirms the face matches the registered face */}
                {/* Added additional checks: verificationMode must be true, faceVerified must be explicitly true, and not verifying */}
                {verificationMode === true && faceDetected === true && faceDescriptor && faceVerified === true && isVerifying === false && (
                    <div className="face-detected-indicator" style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#10b981',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        <span>✓ Khuôn mặt đã được xác thực thành công</span>
                    </div>
                )}
                {/* Show liveness detection status */}
                {verificationMode === true && faceDetected === true && faceDescriptor && !faceVerified && (
                    <div style={{
                        position: 'absolute',
                        bottom: verificationError ? '160px' : '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        maxWidth: '80%',
                        textAlign: 'center',
                        zIndex: 19,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        <div>Đang xác thực liveness...</div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.9 }}>
                            Chớp mắt: {livenessChecks.blinks} / {1} | Di chuyển đầu: {livenessChecks.headMovements} / {2}
                        </div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.9 }}>
                            Thời gian: {(continuousDetectionTime / 1000).toFixed(1)}s / {(minContinuousDetectionTime / 1000).toFixed(1)}s
                        </div>
                    </div>
                )}

                {/* Show error message when verification fails - CRITICAL: This should show for ANY face that doesn't match */}
                {/* This includes: different person, phone image, or any face that fails server verification */}
                {verificationMode === true && faceDetected === true && faceDescriptor && (faceVerified === false || !faceVerified) && isVerifying === false && verificationError && (
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

