import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// Try multiple CDN sources for face-api.js models
// Models are in the /weights directory of the main face-api.js repository
// Repository: https://github.com/justadudewhohacks/face-api.js
const MODEL_URLS = [
    '/models',  // Local fallback - try first if models are downloaded
    'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',  // Primary - jsdelivr CDN
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',  // Fallback 1 - direct GitHub
    'https://unpkg.com/@vladmandic/face-api/model',  // Fallback 2 - unpkg (alternative package)
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'  // Fallback 3 - jsdelivr npm
];

export const useFaceDetection = (videoRef, canvasRef, options = {}) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [error, setError] = useState(null);
    const detectionIntervalRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState('');
    const startDetectionAttemptsRef = useRef(0);

    const {
        detectionInterval = 100, // Run detection every 100ms
        minConfidence = 0.5,
        withLandmarks = true,
        withDescriptors = true
    } = options;

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            setError(null);
            setLoadingProgress('Đang tải mô hình nhận diện khuôn mặt...');

            // Try each CDN source until one works
            for (let i = 0; i < MODEL_URLS.length; i++) {
                const modelUrl = MODEL_URLS[i];
                try {
                    console.log(`Trying to load models from source ${i + 1}/${MODEL_URLS.length}: ${modelUrl}`);

                    // Load models one by one to show progress
                    // Using SSD MobileNetV1 for better accuracy (can switch to tinyFaceDetector for faster performance)
                    setLoadingProgress('Đang tải SSD MobileNet face detector...');
                    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
                    console.log('✓ SSD MobileNet face detector loaded');

                    // Verify the model is actually loaded
                    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
                        throw new Error('SSD MobileNet model not properly loaded');
                    }

                    setLoadingProgress('Đang tải face landmarks...');
                    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
                    console.log('✓ Face landmarks loaded');

                    // Verify the model is actually loaded
                    if (!faceapi.nets.faceLandmark68Net.isLoaded) {
                        throw new Error('Face landmarks model not properly loaded');
                    }

                    setLoadingProgress('Đang tải face recognition...');
                    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
                    console.log('✓ Face recognition loaded');

                    // Verify the model is actually loaded
                    if (!faceapi.nets.faceRecognitionNet.isLoaded) {
                        throw new Error('Face recognition model not properly loaded');
                    }

                    // Double-check all models are loaded before proceeding
                    const allModelsLoaded =
                        faceapi.nets.ssdMobilenetv1.isLoaded &&
                        faceapi.nets.faceLandmark68Net.isLoaded &&
                        faceapi.nets.faceRecognitionNet.isLoaded;

                    if (!allModelsLoaded) {
                        throw new Error('Some models failed to load properly');
                    }

                    console.log(`✓ All models loaded and verified from: ${modelUrl}`);
                    console.log('Model status:', {
                        ssdMobilenetv1: faceapi.nets.ssdMobilenetv1.isLoaded,
                        faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
                        faceRecognitionNet: faceapi.nets.faceRecognitionNet.isLoaded
                    });

                    // Add a small delay to ensure models are fully initialized
                    await new Promise(resolve => setTimeout(resolve, 100));

                    setModelsLoaded(true);
                    setLoadingProgress('');
                    return; // Success, exit the function
                } catch (loadError) {
                    console.warn(`Failed to load from ${modelUrl}:`, loadError.message);
                    // Continue to next source
                    if (i === MODEL_URLS.length - 1) {
                        // Last source failed
                        console.error('All model loading sources failed');
                        setError(
                            'Không thể tải mô hình nhận diện khuôn mặt. ' +
                            'Vui lòng kiểm tra kết nối internet và thử lại. ' +
                            'Hoặc chạy lệnh: npm run download-models để tải models về local.'
                        );
                        setLoadingProgress('');
                    }
                }
            }
        };

        loadModels();
    }, []);

    // Start face detection - memoized to prevent recreation on every render
    const startDetection = useCallback(() => {
        if (!modelsLoaded || !videoRef.current || !canvasRef.current) {
            console.warn('Cannot start detection: models not loaded or video/canvas not ready');
            return;
        }

        // Verify all models are actually loaded before starting detection
        const allModelsReady =
            faceapi.nets.ssdMobilenetv1.isLoaded &&
            faceapi.nets.faceLandmark68Net.isLoaded &&
            faceapi.nets.faceRecognitionNet.isLoaded;

        if (!allModelsReady) {
            console.error('Models not fully loaded. Status:', {
                ssdMobilenetv1: faceapi.nets.ssdMobilenetv1.isLoaded,
                faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
                faceRecognitionNet: faceapi.nets.faceRecognitionNet.isLoaded
            });
            setError('Mô hình nhận diện chưa sẵn sàng. Vui lòng thử lại.');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Wait for video dimensions to be available
        // This should not happen if videoReady is properly set, but add check as safety
        if (!video.videoWidth || !video.videoHeight) {
            console.warn('Video dimensions not available yet, this should not happen if videoReady is true', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                paused: video.paused,
                srcObject: !!video.srcObject
            });

            // Don't retry here - wait for videoReady to be set properly
            // The parent component (CheckInCamera) should handle video readiness
            return;
        }

        // Verify video is playing
        if (video.paused || video.ended) {
            console.warn('Video is not playing when starting detection', {
                paused: video.paused,
                ended: video.ended
            });
            // Try to play
            video.play().catch(err => {
                console.error('Failed to play video in startDetection:', err);
            });
            return;
        }

        // Reset attempts counter on success
        startDetectionAttemptsRef.current = 0;

        // Prevent starting detection multiple times
        if (detectionIntervalRef.current) {
            console.warn('Detection already running, skipping start');
            return;
        }

        setIsDetecting(true);

        const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight
        };

        faceapi.matchDimensions(canvas, displaySize);

        detectionIntervalRef.current = setInterval(async () => {
            if (!video || video.readyState !== 4) return;

            // Get current refs to avoid stale closures
            const currentVideo = videoRef.current;
            const currentCanvas = canvasRef.current;
            if (!currentVideo || !currentCanvas) return;

            try {
                // Use SSD MobileNetV1 for better accuracy
                let detectionTask = faceapi
                    .detectSingleFace(currentVideo, new faceapi.SsdMobilenetv1Options({ minConfidence: minConfidence }));

                if (withLandmarks) {
                    detectionTask = detectionTask.withFaceLandmarks();
                }

                if (withDescriptors) {
                    detectionTask = detectionTask.withFaceDescriptor();
                }

                const detections = await detectionTask;

                if (detections && detections.detection.score >= minConfidence) {
                    // Only update faceDetected state if it changed (was false, now true)
                    setFaceDetected(prev => {
                        if (prev) return prev; // Already true, no update
                        return true; // Was false, update to true
                    });

                    // Only update descriptor if it's significantly different (reduced threshold for faster updates)
                    setFaceDescriptor(prev => {
                        const newDescriptor = detections.descriptor;
                        if (!prev) return newDescriptor;
                        if (!newDescriptor) return prev;

                        if (prev.length !== newDescriptor.length) {
                            return newDescriptor;
                        }

                        // Check if descriptors are significantly different (> 0.15 threshold - reduced from 0.2 for faster updates)
                        let maxDiff = 0;
                        for (let i = 0; i < prev.length; i++) {
                            const diff = Math.abs(prev[i] - newDescriptor[i]);
                            if (diff > maxDiff) maxDiff = diff;
                        }

                        return maxDiff > 0.15 ? newDescriptor : prev;
                    });

                    // Draw detection on canvas
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    const ctx = currentCanvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
                        faceapi.draw.drawDetections(currentCanvas, resizedDetections);
                        if (withLandmarks && detections.landmarks) {
                            faceapi.draw.drawFaceLandmarks(currentCanvas, resizedDetections);
                        }
                    }
                } else {
                    // Only update state if face detection status changed (was true, now false)
                    setFaceDetected(prev => {
                        if (!prev) return prev; // Already false, no update
                        return false; // Was true, update to false
                    });
                    setFaceDescriptor(prev => {
                        if (!prev) return prev; // Already null, no update
                        return null; // Had value, clear it
                    });

                    const ctx = currentCanvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
                    }
                }
            } catch (err) {
                console.error('Error during face detection:', err);
                if (err.message && err.message.includes('load model before inference')) {
                    setError('Mô hình nhận diện chưa sẵn sàng. Vui lòng tải lại trang.');
                    stopDetection();
                }
            }
        }, detectionInterval);
    }, [modelsLoaded, minConfidence, withLandmarks, withDescriptors, detectionInterval]);

    // Stop face detection
    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setIsDetecting(false);
        setFaceDetected(false);
        setFaceDescriptor(null);
        startDetectionAttemptsRef.current = 0; // Reset attempts counter
        if (canvasRef.current) {
            canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    // Get face descriptor (128D vector)
    const getFaceDescriptor = () => {
        return faceDescriptor ? Array.from(faceDescriptor) : null;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
        };
    }, []);

    return {
        modelsLoaded,
        isDetecting,
        faceDetected,
        faceDescriptor: getFaceDescriptor(),
        error,
        loadingProgress,
        startDetection,
        stopDetection
    };
};

