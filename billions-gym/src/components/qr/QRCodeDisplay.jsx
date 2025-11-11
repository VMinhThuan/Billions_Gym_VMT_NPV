import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ qrCode, hoTen, onClose }) => {
    const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Debug: Log when qrCode changes
    useEffect(() => {
        console.log('[QRCodeDisplay] QR code prop changed:', {
            hasQrCode: !!qrCode,
            qrCodeType: typeof qrCode,
            qrCodeLength: qrCode?.length,
            qrCodePreview: qrCode ? qrCode.substring(0, 20) + '...' : 'null'
        });
    }, [qrCode]);

    // Generate QR code when qrCode changes
    useEffect(() => {
        if (!qrCode) {
            setIsLoading(false);
            setQrCodeImageUrl(null);
            setError('Không có mã QR để hiển thị');
            return;
        }

        const generateQRCode = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setQrCodeImageUrl(null);

                console.log('[QRCodeDisplay] Generating QR code for:', qrCode?.substring(0, 20) + '...');
                console.log('[QRCodeDisplay] QR code length:', qrCode?.length);

                // Generate QR code as data URL (more reliable than canvas)
                const dataUrl = await QRCode.toDataURL(qrCode, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                });

                console.log('[QRCodeDisplay] QR code generated successfully, data URL length:', dataUrl?.length);
                setQrCodeImageUrl(dataUrl);
                setIsLoading(false);
            } catch (err) {
                console.error('[QRCodeDisplay] Error generating QR code:', err);
                console.error('[QRCodeDisplay] Error details:', {
                    message: err.message,
                    stack: err.stack,
                    name: err.name,
                    qrCodeLength: qrCode?.length,
                    qrCodeType: typeof qrCode
                });
                setError(`Lỗi khi tạo mã QR: ${err.message || 'Unknown error'}`);
                setIsLoading(false);
            }
        };

        generateQRCode();
    }, [qrCode]);

    const handleDownload = () => {
        if (!qrCodeImageUrl) return;

        try {
            // Download QR code image
            const link = document.createElement('a');
            link.download = `qr-code-${hoTen || 'hoi-vien'}.png`;
            link.href = qrCodeImageUrl;
            link.click();
        } catch (err) {
            console.error('Error downloading QR code:', err);
            setError('Lỗi khi tải mã QR');
        }
    };

    const handleCopyText = () => {
        if (!qrCode) return;

        try {
            navigator.clipboard.writeText(qrCode);
            alert('Đã sao chép mã QR vào clipboard!');
        } catch (err) {
            console.error('Error copying QR code:', err);
            setError('Lỗi khi sao chép mã QR');
        }
    };

    return (
        <div className="qr-code-display-container">
            <div className="qr-code-display-header">
                <h3>Mã QR của tôi</h3>
                {onClose && (
                    <button className="qr-code-display-close" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            {hoTen && (
                <div className="qr-code-display-name">
                    <p>{hoTen}</p>
                </div>
            )}

            <div className="qr-code-display-content">
                {!qrCode ? (
                    <div className="qr-code-display-loading">
                        <p>Đang tải mã QR...</p>
                    </div>
                ) : isLoading ? (
                    <div className="qr-code-display-loading">
                        <p>Đang tạo mã QR...</p>
                    </div>
                ) : error ? (
                    <div className="qr-code-display-error">
                        <p>{error}</p>
                    </div>
                ) : qrCodeImageUrl ? (
                    <div className="qr-code-display-canvas-wrapper">
                        <img
                            src={qrCodeImageUrl}
                            alt="QR Code"
                            className="qr-code-display-image"
                            style={{
                                display: 'block',
                                maxWidth: '100%',
                                height: 'auto',
                                width: '300px',
                                height: '300px'
                            }}
                        />
                    </div>
                ) : (
                    <div className="qr-code-display-loading">
                        <p>Đang tạo mã QR...</p>
                    </div>
                )}
            </div>

            <div className="qr-code-display-actions">
                <button
                    className="qr-code-display-btn qr-code-display-btn-download"
                    onClick={handleDownload}
                    disabled={isLoading || error || !qrCodeImageUrl}
                >
                    Tải xuống
                </button>
                <button
                    className="qr-code-display-btn qr-code-display-btn-copy"
                    onClick={handleCopyText}
                    disabled={isLoading || error || !qrCode}
                >
                    Sao chép mã
                </button>
            </div>

            <div className="qr-code-display-instructions">
                <p>Bạn có thể sử dụng mã QR này để check-in/check-out tại phòng gym.</p>
                <p>Vui lòng lưu mã QR này để sử dụng sau.</p>
            </div>
        </div>
    );
};

export default QRCodeDisplay;

