import { useRef, useState, useCallback } from 'react';

/**
 * Liveness Detection Hook
 * Detects if a face is from a live person or a static image/video
 * 
 * Techniques:
 * 1. Eye Blink Detection - Detects eye blinks using Eye Aspect Ratio (EAR)
 * 2. Head Motion Detection - Detects head movement by tracking face landmarks
 * 3. Mouth Movement Detection - Detects mouth opening/closing
 * 4. Face Size Variation - Detects if face size changes (indicating movement)
 */
export const useLivenessDetection = (options = {}) => {
    const {
        minBlinks = 1, // Minimum number of blinks required
        minHeadMovements = 2, // Minimum head movements required
        detectionWindow = 5000, // Detection window in milliseconds (5 seconds)
        earThreshold = 0.25, // Eye Aspect Ratio threshold for blink detection
        movementThreshold = 0.02 // Minimum movement threshold for head motion
    } = options;

    const [livenessScore, setLivenessScore] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [livenessChecks, setLivenessChecks] = useState({
        blinks: 0,
        headMovements: 0,
        mouthMovements: 0,
        faceSizeVariations: 0
    });

    const landmarksHistoryRef = useRef([]);
    const blinkCountRef = useRef(0);
    const headMovementCountRef = useRef(0);
    const mouthMovementCountRef = useRef(0);
    const faceSizeVariationCountRef = useRef(0);
    const lastBlinkTimeRef = useRef(null);
    const lastEARRef = useRef(null);
    const detectionStartTimeRef = useRef(null);
    const maxHistorySize = 30; // Keep last 30 frames for analysis

    /**
     * Calculate Eye Aspect Ratio (EAR)
     * EAR decreases when eye closes (blink)
     */
    const calculateEAR = useCallback((eyeLandmarks) => {
        if (!eyeLandmarks || eyeLandmarks.length < 6) return null;

        // Handle both array format and object format from face-api.js
        const getPoint = (idx) => {
            const point = eyeLandmarks[idx];
            if (point && typeof point === 'object') {
                return { x: point.x || point._x, y: point.y || point._y };
            }
            return null;
        };

        const p0 = getPoint(0);
        const p1 = getPoint(1);
        const p2 = getPoint(2);
        const p3 = getPoint(3);
        const p4 = getPoint(4);
        const p5 = getPoint(5);

        if (!p0 || !p1 || !p2 || !p3 || !p4 || !p5) return null;

        // Calculate vertical distances
        const vertical1 = Math.sqrt(
            Math.pow(p1.x - p5.x, 2) + Math.pow(p1.y - p5.y, 2)
        );
        const vertical2 = Math.sqrt(
            Math.pow(p2.x - p4.x, 2) + Math.pow(p2.y - p4.y, 2)
        );

        // Calculate horizontal distance
        const horizontal = Math.sqrt(
            Math.pow(p0.x - p3.x, 2) + Math.pow(p0.y - p3.y, 2)
        );

        if (horizontal === 0) return null;

        // EAR formula
        const ear = (vertical1 + vertical2) / (2.0 * horizontal);
        return ear;
    }, []);

    /**
     * Calculate distance between two landmark points
     */
    const calculateDistance = useCallback((point1, point2) => {
        // Handle both object and array formats
        const getX = (p) => p && (p.x !== undefined ? p.x : (p._x !== undefined ? p._x : (Array.isArray(p) ? p[0] : null)));
        const getY = (p) => p && (p.y !== undefined ? p.y : (p._y !== undefined ? p._y : (Array.isArray(p) ? p[1] : null)));

        const x1 = getX(point1);
        const y1 = getY(point1);
        const x2 = getX(point2);
        const y2 = getY(point2);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return 0;

        return Math.sqrt(
            Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
        );
    }, []);

    /**
     * Calculate face bounding box size from landmarks
     */
    const calculateFaceSize = useCallback((landmarks) => {
        // Normalize landmarks format
        const normalizeLandmarks = (landmarks) => {
            if (Array.isArray(landmarks)) {
                return landmarks;
            }
            if (landmarks && landmarks.positions && Array.isArray(landmarks.positions)) {
                return landmarks.positions;
            }
            return null;
        };

        const normalizedLandmarks = normalizeLandmarks(landmarks);
        if (!normalizedLandmarks || normalizedLandmarks.length < 68) return null;

        // Use key facial points to estimate face size
        const noseTip = normalizedLandmarks[30]; // Nose tip
        const chin = normalizedLandmarks[8]; // Chin
        const leftCheek = normalizedLandmarks[0]; // Left face boundary
        const rightCheek = normalizedLandmarks[16]; // Right face boundary

        if (!noseTip || !chin || !leftCheek || !rightCheek) return null;

        const height = calculateDistance(noseTip, chin);
        const width = calculateDistance(leftCheek, rightCheek);
        return height * width; // Face area
    }, [calculateDistance]);

    /**
     * Detect head movement by comparing current landmarks with history
     */
    const detectHeadMovement = useCallback((currentLandmarks) => {
        // Normalize landmarks format
        const normalizeLandmarks = (landmarks) => {
            if (Array.isArray(landmarks)) {
                return landmarks;
            }
            if (landmarks && landmarks.positions && Array.isArray(landmarks.positions)) {
                return landmarks.positions;
            }
            return null;
        };

        const normalizedCurrent = normalizeLandmarks(currentLandmarks);
        if (!normalizedCurrent || normalizedCurrent.length < 68) {
            return false;
        }

        if (landmarksHistoryRef.current.length === 0) {
            landmarksHistoryRef.current.push(normalizedCurrent);
            return false;
        }

        // Compare with previous landmarks
        const previousLandmarks = landmarksHistoryRef.current[landmarksHistoryRef.current.length - 1];
        if (!previousLandmarks || previousLandmarks.length < 68) {
            landmarksHistoryRef.current.push(normalizedCurrent);
            return false;
        }

        // Calculate average movement of key facial points (normalized by face size)
        const keyPoints = [30, 8, 0, 16, 27, 33]; // Nose, chin, cheeks, eyes
        let totalMovement = 0;
        let movementCount = 0;

        // Calculate face size for normalization
        const faceWidth = calculateDistance(normalizedCurrent[0], normalizedCurrent[16]);
        const normalizationFactor = faceWidth > 0 ? faceWidth : 1;

        keyPoints.forEach(pointIndex => {
            const currentPoint = normalizedCurrent[pointIndex];
            const previousPoint = previousLandmarks[pointIndex];
            if (currentPoint && previousPoint) {
                const movement = calculateDistance(currentPoint, previousPoint);
                // Normalize movement by face size
                const normalizedMovement = movement / normalizationFactor;
                totalMovement += normalizedMovement;
                movementCount++;
            }
        });

        if (movementCount === 0) {
            landmarksHistoryRef.current.push(normalizedCurrent);
            if (landmarksHistoryRef.current.length > maxHistorySize) {
                landmarksHistoryRef.current.shift();
            }
            return false;
        }

        const avgMovement = totalMovement / movementCount;

        // Add to history
        landmarksHistoryRef.current.push(normalizedCurrent);
        if (landmarksHistoryRef.current.length > maxHistorySize) {
            landmarksHistoryRef.current.shift();
        }

        // Detect significant movement
        if (avgMovement > movementThreshold) {
            headMovementCountRef.current++;
            console.log('[Liveness] Head movement detected! Total movements:', headMovementCountRef.current, 'avgMovement:', avgMovement.toFixed(4));
            return true;
        }

        return false;
    }, [calculateDistance, movementThreshold]);

    /**
     * Detect blink using EAR
     */
    const detectBlink = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 68) return false;

        // Extract landmarks - handle both array and object formats
        const getLandmark = (idx) => {
            if (Array.isArray(landmarks)) {
                return landmarks[idx];
            }
            // If landmarks is an object with positions property
            if (landmarks.positions && Array.isArray(landmarks.positions)) {
                return landmarks.positions[idx];
            }
            return null;
        };

        // Left eye landmarks (points 36-41)
        const leftEye = [36, 37, 38, 39, 40, 41].map(idx => getLandmark(idx)).filter(p => p !== null);
        // Right eye landmarks (points 42-47)
        const rightEye = [42, 43, 44, 45, 46, 47].map(idx => getLandmark(idx)).filter(p => p !== null);

        if (leftEye.length < 6 || rightEye.length < 6) return false;

        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);

        if (leftEAR === null || rightEAR === null) return false;

        const avgEAR = (leftEAR + rightEAR) / 2.0;

        // Detect blink: EAR drops below threshold
        if (lastEARRef.current !== null) {
            // Eye was open, now closed (blink detected)
            if (lastEARRef.current > earThreshold && avgEAR < earThreshold) {
                const now = Date.now();
                // Prevent multiple detections of the same blink (debounce 200ms)
                if (!lastBlinkTimeRef.current || (now - lastBlinkTimeRef.current) > 200) {
                    blinkCountRef.current++;
                    lastBlinkTimeRef.current = now;
                    console.log('[Liveness] Blink detected! Total blinks:', blinkCountRef.current);
                    return true;
                }
            }
        }

        lastEARRef.current = avgEAR;
        return false;
    }, [calculateEAR, earThreshold]);

    /**
     * Detect mouth movement
     */
    const detectMouthMovement = useCallback((landmarks) => {
        // Normalize landmarks format
        const normalizeLandmarks = (landmarks) => {
            if (Array.isArray(landmarks)) {
                return landmarks;
            }
            if (landmarks && landmarks.positions && Array.isArray(landmarks.positions)) {
                return landmarks.positions;
            }
            return null;
        };

        const normalizedLandmarks = normalizeLandmarks(landmarks);
        if (!normalizedLandmarks || normalizedLandmarks.length < 68) return false;

        // Key points for mouth opening detection
        const upperLip = normalizedLandmarks[51]; // Upper lip center
        const lowerLip = normalizedLandmarks[57]; // Lower lip center
        const leftCorner = normalizedLandmarks[48]; // Mouth left corner
        const rightCorner = normalizedLandmarks[54]; // Mouth right corner

        if (!upperLip || !lowerLip || !leftCorner || !rightCorner) return false;

        const verticalDistance = calculateDistance(upperLip, lowerLip);
        const horizontalDistance = calculateDistance(leftCorner, rightCorner);

        if (horizontalDistance === 0) return false;

        // Mouth aspect ratio (MAR)
        const mar = verticalDistance / horizontalDistance;

        // Detect mouth opening (MAR increases significantly)
        // Compare with history to detect changes
        if (mar > 0.35) {
            mouthMovementCountRef.current++;
            return true;
        }

        return false;
    }, [calculateDistance]);

    /**
     * Detect face size variation (indicating movement toward/away from camera)
     */
    const detectFaceSizeVariation = useCallback((landmarks) => {
        const currentSize = calculateFaceSize(landmarks);
        if (currentSize === null) return false;

        if (landmarksHistoryRef.current.length < 5) return false;

        // Compare with average size from history
        const recentSizes = landmarksHistoryRef.current.slice(-5).map(l => calculateFaceSize(l)).filter(s => s !== null && s > 0);
        if (recentSizes.length === 0) return false;

        const avgSize = recentSizes.reduce((sum, size) => sum + size, 0) / recentSizes.length;
        if (avgSize === 0) return false;

        const variation = Math.abs(currentSize - avgSize) / avgSize;

        // Significant size variation indicates movement (toward/away from camera)
        if (variation > 0.05) {
            faceSizeVariationCountRef.current++;
            console.log('[Liveness] Face size variation detected! Variation:', (variation * 100).toFixed(2) + '%');
            return true;
        }

        return false;
    }, [calculateFaceSize]);

    /**
     * Process landmarks for liveness detection
     */
    const processLandmarks = useCallback((landmarks) => {
        // Normalize landmarks format first
        const normalizeLandmarks = (landmarks) => {
            if (Array.isArray(landmarks)) {
                return landmarks;
            }
            if (landmarks && landmarks.positions && Array.isArray(landmarks.positions)) {
                return landmarks.positions;
            }
            return null;
        };

        const normalizedLandmarks = normalizeLandmarks(landmarks);
        if (!normalizedLandmarks || normalizedLandmarks.length < 68) {
            return {
                isLive: false,
                score: 0,
                checks: livenessChecks
            };
        }

        // Initialize detection start time
        if (!detectionStartTimeRef.current) {
            detectionStartTimeRef.current = Date.now();
        }

        // Run all detection methods with normalized landmarks
        const hasBlink = detectBlink(normalizedLandmarks);
        const hasHeadMovement = detectHeadMovement(normalizedLandmarks);
        const hasMouthMovement = detectMouthMovement(normalizedLandmarks);
        const hasFaceSizeVariation = detectFaceSizeVariation(normalizedLandmarks);

        // Update checks
        const newChecks = {
            blinks: blinkCountRef.current,
            headMovements: headMovementCountRef.current,
            mouthMovements: mouthMovementCountRef.current,
            faceSizeVariations: faceSizeVariationCountRef.current
        };
        setLivenessChecks(newChecks);

        // Calculate liveness score (0-100)
        let score = 0;
        const maxScore = 100;

        // Blink detection (30 points)
        if (blinkCountRef.current >= minBlinks) {
            score += 30;
        } else {
            score += (blinkCountRef.current / minBlinks) * 30;
        }

        // Head movement (30 points)
        if (headMovementCountRef.current >= minHeadMovements) {
            score += 30;
        } else {
            score += (headMovementCountRef.current / minHeadMovements) * 30;
        }

        // Mouth movement (20 points)
        if (mouthMovementCountRef.current > 0) {
            score += 20;
        }

        // Face size variation (20 points)
        if (faceSizeVariationCountRef.current > 0) {
            score += 20;
        }

        setLivenessScore(score);

        // Determine if face is live
        // Require at least blinks and head movements
        const isLiveFace =
            blinkCountRef.current >= minBlinks &&
            headMovementCountRef.current >= minHeadMovements &&
            score >= 60; // At least 60% score

        setIsLive(isLiveFace);

        return {
            isLive: isLiveFace,
            score: score,
            checks: newChecks
        };
    }, [
        detectBlink,
        detectHeadMovement,
        detectMouthMovement,
        detectFaceSizeVariation,
        minBlinks,
        minHeadMovements,
        livenessChecks
    ]);

    /**
     * Reset liveness detection
     */
    const reset = useCallback(() => {
        landmarksHistoryRef.current = [];
        blinkCountRef.current = 0;
        headMovementCountRef.current = 0;
        mouthMovementCountRef.current = 0;
        faceSizeVariationCountRef.current = 0;
        lastBlinkTimeRef.current = null;
        lastEARRef.current = null;
        detectionStartTimeRef.current = null;
        setLivenessScore(0);
        setIsLive(false);
        setLivenessChecks({
            blinks: 0,
            headMovements: 0,
            mouthMovements: 0,
            faceSizeVariations: 0
        });
    }, []);

    return {
        processLandmarks,
        reset,
        isLive,
        livenessScore,
        livenessChecks
    };
};

