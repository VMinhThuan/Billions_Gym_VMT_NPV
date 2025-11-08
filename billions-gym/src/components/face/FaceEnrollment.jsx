import React, { useState, useEffect, useCallback } from 'react';
import CheckInCamera from './CheckInCamera';
import { checkInAPI } from '../../services/api';
import { compareWithStoredEncodings, validateEncodingsSimilarity } from '../../utils/faceUtils';
import './FaceEnrollment.css';

const FaceEnrollment = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [encodings, setEncodings] = useState([]);
    const [currentEncoding, setCurrentEncoding] = useState(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [faceValidated, setFaceValidated] = useState([false, false, false]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const handleFaceDetected = useCallback((descriptor) => {
        setCurrentEncoding(descriptor);
        setValidationError(null);
    }, []);

    // Validate current encoding with stored encodings (from step 2 onwards)
    useEffect(() => {
        if (step > 1 && currentEncoding && encodings.length > 0) {
            setIsValidating(true);
            setValidationError(null);

            // Use client-side validation first for faster feedback
            const clientValidation = compareWithStoredEncodings(currentEncoding, encodings, 0.65);

            if (clientValidation.isValid) {
                // If client validation passes, also validate with API for final confirmation
                const allEncodings = [...encodings, currentEncoding];
                if (allEncodings.length === 3) {
                    // Final validation with all 3 encodings
                    checkInAPI.validateEnrollmentEncodings(allEncodings)
                        .then(result => {
                            if (result.success && result.isValid) {
                                setFaceValidated(prev => {
                                    const newValidated = [...prev];
                                    newValidated[step - 1] = true;
                                    return newValidated;
                                });
                                setValidationError(null);
                            } else {
                                setFaceValidated(prev => {
                                    const newValidated = [...prev];
                                    newValidated[step - 1] = false;
                                    return newValidated;
                                });
                                setValidationError(result.message || 'Khuôn mặt không khớp với các lần quét trước');
                            }
                            setIsValidating(false);
                        })
                        .catch(err => {
                            console.error('Validation error:', err);
                            // Fallback to client-side validation
                            if (clientValidation.isValid) {
                                setFaceValidated(prev => {
                                    const newValidated = [...prev];
                                    newValidated[step - 1] = true;
                                    return newValidated;
                                });
                            } else {
                                setFaceValidated(prev => {
                                    const newValidated = [...prev];
                                    newValidated[step - 1] = false;
                                    return newValidated;
                                });
                                setValidationError(clientValidation.message);
                            }
                            setIsValidating(false);
                        });
                } else {
                    // Intermediate validation (step 2)
                    setFaceValidated(prev => {
                        const newValidated = [...prev];
                        newValidated[step - 1] = clientValidation.isValid;
                        return newValidated;
                    });
                    if (!clientValidation.isValid) {
                        setValidationError(clientValidation.message);
                    }
                    setIsValidating(false);
                }
            } else {
                setFaceValidated(prev => {
                    const newValidated = [...prev];
                    newValidated[step - 1] = false;
                    return newValidated;
                });
                setValidationError(clientValidation.message);
                setIsValidating(false);
            }
        } else if (step === 1 && currentEncoding) {
            // First step - no validation needed, just mark as validated
            setFaceValidated(prev => {
                const newValidated = [...prev];
                newValidated[0] = true;
                return newValidated;
            });
        }
    }, [step, currentEncoding, encodings]);

    const handleCapture = async () => {
        if (!currentEncoding) {
            setError('Vui lòng đợi hệ thống nhận diện khuôn mặt của bạn');
            return;
        }

        // Validate encoding before capturing (from step 2 onwards)
        if (step > 1 && !faceValidated[step - 1]) {
            setError('Khuôn mặt không khớp với các lần quét trước. Vui lòng quét lại.');
            return;
        }

        // Prepare all encodings including current one
        const allEncodings = [...encodings, currentEncoding];

        // If this is the final step, validate all 3 encodings together
        if (step === 3) {
            setIsValidating(true);
            setError(null);

            try {
                const result = await checkInAPI.validateEnrollmentEncodings(allEncodings);
                if (!result.success || !result.isValid) {
                    setError(result.message || '3 lần quét không khớp. Vui lòng đảm bảo quét cùng một khuôn mặt.');
                    setIsValidating(false);
                    return;
                }
            } catch (err) {
                console.error('Validation error:', err);
                setError('Lỗi khi xác thực. Vui lòng thử lại.');
                setIsValidating(false);
                return;
            }
            setIsValidating(false);

            // For final step, update state and immediately call handleEnroll with all encodings
            setEncodings(allEncodings);
            setCurrentEncoding(null);
            setError(null);
            setValidationError(null);

            // Call handleEnroll with the complete encodings array
            handleEnroll(allEncodings);
            return; // Don't increment step or continue
        }

        // For steps 1 and 2, just update state normally
        setEncodings(allEncodings);
        setStep(step + 1);
        setCurrentEncoding(null);
        setError(null);
        setValidationError(null);
    };

    const handleEnroll = async (finalEncodings = null) => {
        // Use provided encodings or fallback to state (for safety)
        const encodingsToUse = finalEncodings || encodings;

        if (!encodingsToUse || encodingsToUse.length !== 3) {
            setError('Cần đủ 3 lần quét khuôn mặt');
            console.error('Enrollment error: Expected 3 encodings, got:', encodingsToUse?.length || 0);
            return;
        }

        setIsEnrolling(true);
        setError(null);

        try {
            const result = await checkInAPI.enrollFace(encodingsToUse);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    if (onComplete) {
                        onComplete();
                    }
                }, 2000);
            } else {
                setError(result.message || 'Đăng ký khuôn mặt thất bại');
            }
        } catch (err) {
            setError(err.message || 'Lỗi khi đăng ký khuôn mặt');
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setEncodings([]);
        setCurrentEncoding(null);
        setError(null);
        setSuccess(false);
        setFaceValidated([false, false, false]);
        setValidationError(null);
        setIsValidating(false);
    };

    const handleRetryCurrentStep = () => {
        setCurrentEncoding(null);
        setValidationError(null);
        setFaceValidated(prev => {
            const newValidated = [...prev];
            newValidated[step - 1] = false;
            return newValidated;
        });
    };

    if (success) {
        return (
            <div className="face-enrollment-success">
                <div className="success-icon">✓</div>
                <h2>Đăng ký thành công!</h2>
                <p>Khuôn mặt của bạn đã được đăng ký thành công.</p>
            </div>
        );
    }

    return (
        <div className="face-enrollment-container">
            <div className="enrollment-header">
                <h2>Đăng ký khuôn mặt</h2>
                <p>Vui lòng quét khuôn mặt của bạn 3 lần để đảm bảo độ chính xác</p>
            </div>

            <div className="enrollment-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
                <p className="progress-text">
                    Bước {step}/3: Quét khuôn mặt lần {step}
                </p>
            </div>

            <div className="enrollment-camera">
                <CheckInCamera
                    onFaceDetected={handleFaceDetected}
                    onError={setError}
                    autoStart={true}
                    verificationMode={false}
                    storedEncodings={step > 1 ? encodings : null}
                />
                {/* Show validation status based on faceValidated state */}
                {step > 1 && currentEncoding && !faceValidated[step - 1] && !isValidating && (
                    <div style={{
                        position: 'absolute',
                        bottom: '60px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#7f1d1d',
                        color: '#fca5a5',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        zIndex: 10
                    }}>
                        <span>Khuôn mặt chưa khớp với lần quét trước</span>
                    </div>
                )}
            </div>

            {isValidating && (
                <div className="enrollment-info" style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#1e3a8a',
                    borderRadius: '8px',
                    color: '#dbeafe'
                }}>
                    <p>Đang xác thực khuôn mặt...</p>
                </div>
            )}

            {validationError && (
                <div className="enrollment-error" style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#7f1d1d',
                    border: '1px solid #991b1b',
                    borderRadius: '8px',
                    color: '#fca5a5'
                }}>
                    <p>{validationError}</p>
                    <button
                        onClick={handleRetryCurrentStep}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#991b1b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Quét lại
                    </button>
                </div>
            )}

            {error && !validationError && (
                <div className="enrollment-error">
                    <p>{error}</p>
                </div>
            )}

            <div className="enrollment-instructions">
                <h3>Hướng dẫn:</h3>
                <ul>
                    <li>Ngồi ở nơi có đủ ánh sáng</li>
                    <li>Nhìn thẳng vào camera</li>
                    <li>Giữ nguyên tư thế khi hệ thống nhận diện</li>
                    <li>Không đeo khẩu trang hoặc kính râm</li>
                </ul>
            </div>

            <div className="enrollment-actions">
                {step < 3 && (
                    <button
                        onClick={handleCapture}
                        disabled={!currentEncoding || isEnrolling || isValidating || (step > 1 && !faceValidated[step - 1])}
                        className="btn-capture"
                    >
                        {isValidating
                            ? 'Đang xác thực...'
                            : !currentEncoding
                                ? 'Đang nhận diện...'
                                : (step > 1 && !faceValidated[step - 1])
                                    ? 'Khuôn mặt chưa khớp'
                                    : 'Xác nhận lần quét này'
                        }
                    </button>
                )}
                {step === 3 && (
                    <button
                        onClick={handleCapture}
                        disabled={!currentEncoding || isEnrolling || isValidating || !faceValidated[step - 1]}
                        className="btn-capture btn-final"
                    >
                        {isEnrolling ? 'Đang đăng ký...' : isValidating ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
                    </button>
                )}
                <button
                    onClick={handleReset}
                    disabled={isEnrolling || isValidating}
                    className="btn-reset"
                >
                    Làm lại từ đầu
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isEnrolling || isValidating}
                        className="btn-cancel"
                    >
                        Hủy
                    </button>
                )}
            </div>
        </div>
    );
};

export default FaceEnrollment;

