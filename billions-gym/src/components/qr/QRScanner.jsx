import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess, onError, autoStart = false }) => {
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        const scannerId = 'qr-scanner-' + Date.now();
        scannerRef.current = scannerId;

        return () => {
            // Cleanup on unmount
            console.log('QRScanner: Component unmounting, cleaning up...');
            if (html5QrcodeRef.current) {
                // Safely stop and clear
                const scanner = html5QrcodeRef.current;
                try {
                    if (scanner.stop && typeof scanner.stop === 'function') {
                        const stopPromise = scanner.stop();
                        if (stopPromise && typeof stopPromise.catch === 'function') {
                            stopPromise.catch(() => {
                                // Ignore cleanup errors
                            });
                        }
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }

                try {
                    if (scanner.clear && typeof scanner.clear === 'function') {
                        const clearPromise = scanner.clear();
                        if (clearPromise && typeof clearPromise.catch === 'function') {
                            clearPromise.catch(() => {
                                // Ignore cleanup errors
                            });
                        }
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }

                html5QrcodeRef.current = null;
            }
            hasStartedRef.current = false;
            setIsScanning(false);
        };
    }, []);

    const startScanning = async () => {
        // Prevent multiple simultaneous start attempts
        if (isScanning) {
            console.log('QRScanner: Already scanning, skipping start');
            return;
        }

        try {
            setError(null);
            const scannerId = scannerRef.current;

            if (!scannerId) {
                throw new Error('Scanner ID not available');
            }

            // Verify DOM element exists
            const scannerElement = document.getElementById(scannerId);
            if (!scannerElement) {
                throw new Error('Scanner element not found in DOM');
            }

            // Stop any existing scanner instance
            if (html5QrcodeRef.current) {
                try {
                    await html5QrcodeRef.current.stop().catch(() => { });
                    await html5QrcodeRef.current.clear().catch(() => { });
                } catch (e) {
                    // Ignore cleanup errors
                }
            }

            // Create Html5Qrcode instance
            const html5Qrcode = new Html5Qrcode(scannerId);
            html5QrcodeRef.current = html5Qrcode;

            // Configuration for QR code scanning
            const config = {
                fps: 10, // Frames per second
                qrbox: { width: 250, height: 250 }, // Scanning area
                aspectRatio: 1.0
            };

            console.log('QRScanner: Requesting camera access...');
            // Get available cameras
            const cameras = await Html5Qrcode.getCameras();

            if (cameras && cameras.length > 0) {
                console.log(`QRScanner: Found ${cameras.length} camera(s)`);
                // Prefer back camera on mobile, but use first available
                let cameraId = cameras[0].id;

                // Try to find back camera first (usually better for QR scanning)
                const backCamera = cameras.find(cam => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear'));
                if (backCamera) {
                    cameraId = backCamera.id;
                    console.log('QRScanner: Using back camera');
                } else {
                    console.log('QRScanner: Using first available camera');
                }

                // Start scanning
                console.log('QRScanner: Starting camera...');

                // Track if we've already processed a scan to prevent multiple calls
                let scanProcessed = false;

                await html5Qrcode.start(
                    cameraId,
                    config,
                    async (decodedText, decodedResult) => {
                        // Prevent multiple scans of the same code
                        if (scanProcessed) {
                            console.log('QRScanner: Scan already processed, ignoring duplicate');
                            return;
                        }

                        scanProcessed = true;
                        console.log('QRScanner: QR Code scanned successfully:', decodedText.substring(0, 20) + '...');

                        // Immediately prevent further scans
                        setIsScanning(false);
                        hasStartedRef.current = false;

                        // Stop camera gracefully (don't await to avoid blocking)
                        const stopCamera = async () => {
                            try {
                                if (html5QrcodeRef.current && html5QrcodeRef.current.stop) {
                                    const scanner = html5QrcodeRef.current;
                                    const stopPromise = scanner.stop();
                                    if (stopPromise && typeof stopPromise.catch === 'function') {
                                        await stopPromise.catch(() => {
                                            // Ignore stop errors
                                        });
                                    }
                                }
                            } catch (stopErr) {
                                // Ignore stop errors - camera might already be stopped
                                console.log('QRScanner: Error stopping camera (ignored):', stopErr);
                            }
                        };

                        // Call success callback FIRST (before stopping camera)
                        // This allows the parent to handle the scan result immediately
                        if (onScanSuccess) {
                            try {
                                console.log('QRScanner: Calling onScanSuccess callback');
                                await onScanSuccess(decodedText, decodedResult);
                                console.log('QRScanner: onScanSuccess callback completed');
                            } catch (callbackErr) {
                                console.error('QRScanner: Error in onScanSuccess callback:', callbackErr);
                                // Continue with cleanup even if callback fails
                            }
                        }

                        // Stop camera after callback (non-blocking)
                        stopCamera().catch(() => {
                            // Ignore errors
                        });
                    },
                    (errorMessage) => {
                        // Error callback (ignore errors during scanning, only log)
                        // This is called frequently during scanning, so we don't want to show every error
                        // Only log if it's not a "NotFoundException" (which is normal during scanning)
                        if (!errorMessage.includes('NotFoundException') &&
                            !errorMessage.includes('No QR code') &&
                            !errorMessage.includes('No MultiFormat Readers')) {
                            // Only log occasionally to avoid spam
                            if (Math.random() < 0.01) { // Log only 1% of errors
                                console.log('QRScanner: Scan error (ignored):', errorMessage);
                            }
                        }
                    }
                );

                console.log('QRScanner: Camera started successfully');
                setIsScanning(true);
                hasStartedRef.current = true;
            } else {
                throw new Error('Không tìm thấy camera. Vui lòng kiểm tra quyền truy cập camera.');
            }
        } catch (err) {
            console.error('QRScanner: Error starting scanner:', err);
            let errorMessage = 'Lỗi khi khởi động camera';

            if (err.message) {
                errorMessage = err.message;
            } else if (err.name === 'NotAllowedError' || err.message?.includes('NotAllowedError')) {
                errorMessage = 'Vui lòng cho phép truy cập camera để sử dụng tính năng này.';
            } else if (err.name === 'NotFoundError' || err.message?.includes('NotFoundError')) {
                errorMessage = 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.';
            } else if (err.name === 'NotReadableError' || err.message?.includes('NotReadableError')) {
                errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.';
            } else if (err.message?.includes('Scanner element not found')) {
                errorMessage = 'Không tìm thấy phần tử scanner. Vui lòng thử lại.';
            }

            setError(errorMessage);
            setIsScanning(false);
            hasStartedRef.current = false;

            if (onError) {
                onError(errorMessage);
            }
        }
    };

    // Auto-start scanning when autoStart is true
    useEffect(() => {
        console.log('QRScanner: Auto-start effect triggered', { autoStart, isScanning, hasStarted: hasStartedRef.current, error });

        if (!autoStart) {
            // Stop scanning when autoStart becomes false
            if (isScanning) {
                console.log('QRScanner: Auto-start disabled, stopping scanner');
                stopScanning();
            }
            hasStartedRef.current = false;
            return;
        }

        // Function to attempt starting the scanner
        const attemptStart = () => {
            if (!scannerRef.current) {
                console.log('QRScanner: scannerRef.current is not set yet');
                return false;
            }

            const scannerElement = document.getElementById(scannerRef.current);
            if (!scannerElement) {
                console.log('QRScanner: DOM element not found');
                return false;
            }

            // If already scanning successfully, don't restart
            if (isScanning && !error) {
                console.log('QRScanner: Already scanning, skipping');
                return true;
            }

            console.log('QRScanner: Attempting to start scanner...', { hasStarted: hasStartedRef.current, error });
            hasStartedRef.current = true;
            startScanning().catch(err => {
                console.error('QRScanner: Failed to start scanning:', err);
                hasStartedRef.current = false; // Allow retry on error
            });
            return true;
        };

        // Reset error state when autoStart becomes true (allows retry)
        if (error) {
            console.log('QRScanner: Resetting error state to allow retry');
            setError(null);
            hasStartedRef.current = false;
        }

        // Try to start immediately if conditions are met
        if (!isScanning) {
            if (attemptStart()) {
                return;
            }

            // If element doesn't exist yet, wait and retry multiple times
            let retryCount = 0;
            const maxRetries = 5;

            const retryInterval = setInterval(() => {
                retryCount++;
                console.log(`QRScanner: Retry attempt ${retryCount}/${maxRetries}`);

                if (attemptStart()) {
                    clearInterval(retryInterval);
                } else if (retryCount >= maxRetries) {
                    console.log('QRScanner: Max retries reached, giving up');
                    clearInterval(retryInterval);
                    setError('Không thể khởi động camera. Vui lòng thử lại hoặc nhấn nút "Bắt đầu quét mã QR".');
                }
            }, 500); // Retry every 500ms

            return () => {
                clearInterval(retryInterval);
            };
        }

        return () => {
            // Cleanup if component unmounts or autoStart changes
        };
    }, [autoStart]); // Only depend on autoStart - component remounts when key changes

    const stopScanning = async () => {
        try {
            setIsScanning(false); // Set state first to prevent race conditions

            if (html5QrcodeRef.current) {
                try {
                    // Check if stop method exists and is a function
                    if (html5QrcodeRef.current.stop && typeof html5QrcodeRef.current.stop === 'function') {
                        const stopPromise = html5QrcodeRef.current.stop();
                        // Only catch if it's a promise
                        if (stopPromise && typeof stopPromise.catch === 'function') {
                            await stopPromise.catch(err => {
                                // Ignore errors when stopping (camera might already be stopped)
                                console.log('QRScanner: Stop error (ignored):', err?.message || err);
                            });
                        }
                    }
                } catch (stopErr) {
                    // Ignore stop errors - camera might already be stopped
                    console.log('QRScanner: Stop error (ignored):', stopErr?.message || stopErr);
                }

                try {
                    // Check if clear method exists and is a function
                    if (html5QrcodeRef.current.clear && typeof html5QrcodeRef.current.clear === 'function') {
                        const clearPromise = html5QrcodeRef.current.clear();
                        // Only catch if it's a promise
                        if (clearPromise && typeof clearPromise.catch === 'function') {
                            await clearPromise.catch(err => {
                                // Ignore errors when clearing
                                console.log('QRScanner: Clear error (ignored):', err?.message || err);
                            });
                        }
                    }
                } catch (clearErr) {
                    // Ignore clear errors
                    console.log('QRScanner: Clear error (ignored):', clearErr?.message || clearErr);
                }

                // Clear the reference
                html5QrcodeRef.current = null;
            }
        } catch (err) {
            console.error('QRScanner: Error in stopScanning:', err);
            // Ensure state is updated even if there's an error
            setIsScanning(false);
        }
    };

    const handleStartClick = () => {
        if (!isScanning) {
            startScanning();
        }
    };

    const handleStopClick = () => {
        if (isScanning) {
            stopScanning();
        }
    };

    const scannerId = scannerRef.current || 'qr-scanner-default';

    return (
        <div className="qr-scanner-container">
            <div id={scannerId} className="qr-scanner"></div>

            {error && (
                <div className="qr-scanner-error">
                    <p>{error}</p>
                </div>
            )}

            <div className="qr-scanner-controls">
                {!isScanning ? (
                    <button
                        className="qr-scanner-btn qr-scanner-btn-start"
                        onClick={handleStartClick}
                    >
                        Bắt đầu quét mã QR
                    </button>
                ) : (
                    <button
                        className="qr-scanner-btn qr-scanner-btn-stop"
                        onClick={handleStopClick}
                    >
                        Dừng quét
                    </button>
                )}
            </div>

            {!isScanning && !error && (
                <div className="qr-scanner-instructions">
                    <p>Nhấn nút "Bắt đầu quét mã QR" để bắt đầu quét mã QR code của hội viên</p>
                </div>
            )}
        </div>
    );
};

export default QRScanner;

