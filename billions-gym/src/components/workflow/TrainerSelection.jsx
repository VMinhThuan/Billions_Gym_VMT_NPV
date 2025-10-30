import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './WorkflowComponents.css';

const TrainerSelection = ({ registrationId, selectedTrainer, onSelectTrainer, loading, registration }) => {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState(selectedTrainer?._id || '');
    const [preferences, setPreferences] = useState({
        gioTapUuTien: [],
        soNgayTapTrongTuan: 3
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loadingTrainers, setLoadingTrainers] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allTrainers, setAllTrainers] = useState([]);

    const timeSlots = [
        '06:00-08:00',
        '08:00-10:00',
        '10:00-12:00',
        '14:00-16:00',
        '16:00-18:00',
        '18:00-20:00',
        '20:00-22:00'
    ];

    useEffect(() => {
        fetchAvailableTrainers();
    }, [registrationId]);

    const fetchAvailableTrainers = async () => {
        try {
            setLoadingTrainers(true);
            const response = await api.post(`/package-workflow/available-trainers/${registrationId}`, {
                gioTapUuTien: preferences.gioTapUuTien,
                soNgayTapTrongTuan: preferences.soNgayTapTrongTuan
            });

            if (response.success) {
                const list = Array.isArray(response.data?.availablePTs)
                    ? response.data.availablePTs
                    : (Array.isArray(response.data) ? response.data
                        : (Array.isArray(response.data?.trainers) ? response.data.trainers : []));
                setAllTrainers(list);
                setTotalPages(Math.ceil(list.length / 15));
                setCurrentPage(1);
                updateDisplayedTrainers(list, 1);
            } else {
                setError(response.message || 'Không thể tải danh sách PT');
            }
        } catch (err) {
            console.error('Error fetching trainers:', err);
            setError('Lỗi khi tải danh sách PT');
        } finally {
            setLoadingTrainers(false);
        }
    };

    const updateDisplayedTrainers = (trainerList, page) => {
        const startIndex = (page - 1) * 15;
        const endIndex = startIndex + 15;
        setTrainers(trainerList.slice(startIndex, endIndex));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            updateDisplayedTrainers(allTrainers, newPage);
        }
    };

    const handleTimeSlotChange = (timeSlot) => {
        setPreferences(prev => ({
            ...prev,
            gioTapUuTien: prev.gioTapUuTien.includes(timeSlot)
                ? prev.gioTapUuTien.filter(t => t !== timeSlot)
                : [...prev.gioTapUuTien, timeSlot]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedTrainerId) {
            setError('Vui lòng chọn PT');
            return;
        }

        if (preferences.gioTapUuTien.length === 0) {
            setError('Vui lòng chọn ít nhất một khung giờ tập');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await onSelectTrainer(selectedTrainerId, preferences.gioTapUuTien, preferences.soNgayTapTrongTuan);
        } catch (err) {
            setError('Lỗi khi chọn PT');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="trainer-selection">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin PT...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trainer-selection">
            <div className="selection-header">
                <h3>Chọn PT và lịch trình tập</h3>
                <p>Chọn PT phù hợp và thiết lập lịch trình tập luyện của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="trainer-form">
                {/* Preferences Section */}
                <div className="preferences-section">
                    <h4>Lịch trình tập luyện</h4>

                    <div className="preference-group">
                        <label>Số ngày tập trong tuần:</label>
                        <select
                            value={preferences.soNgayTapTrongTuan}
                            onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                soNgayTapTrongTuan: parseInt(e.target.value)
                            }))}
                            className="form-select"
                        >
                            <option value={2}>2 ngày/tuần</option>
                            <option value={3}>3 ngày/tuần</option>
                            <option value={4}>4 ngày/tuần</option>
                            <option value={5}>5 ngày/tuần</option>
                            <option value={6}>6 ngày/tuần</option>
                        </select>
                    </div>

                    <div className="preference-group">
                        <label>Khung giờ tập ưu tiên:</label>
                        <div className="time-slots">
                            {timeSlots.map((timeSlot) => (
                                <label key={timeSlot} className="time-slot-option">
                                    <input
                                        type="checkbox"
                                        checked={preferences.gioTapUuTien.includes(timeSlot)}
                                        onChange={() => handleTimeSlotChange(timeSlot)}
                                    />
                                    <span className="time-slot-label">{timeSlot}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchAvailableTrainers}
                        className="bg-transparent border border-[#a3a3a3] px-5 py-2.5 cursor-pointer hover:bg-[#da2128] text-[#a3a3a3] hover:text-white hover:border-transparent transition rounded-md"
                        disabled={loadingTrainers}
                    >
                        {loadingTrainers ? 'Đang tải...' : 'Tìm PT phù hợp'}
                    </button>
                </div>

                {/* Trainers Section */}
                <div className="trainers-section">
                    <h4>
                        {registration?.branchId?.tenChiNhanh
                            ? `Danh sách PT chi nhánh '${registration.branchId.tenChiNhanh}' phù hợp`
                            : 'Danh sách PT phù hợp'}
                    </h4>

                    {loadingTrainers ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Đang tìm PT phù hợp...</p>
                        </div>
                    ) : (!Array.isArray(trainers) || trainers.length === 0) ? (
                        <div className="empty-state">
                            <div className="empty-icon">👨‍💼</div>
                            <p>Không tìm thấy PT phù hợp với lịch trình của bạn.</p>
                            <p>Vui lòng thử điều chỉnh lịch trình và tìm lại.</p>
                        </div>
                    ) : (
                        <>
                            <div className="trainers-grid">
                                {Array.isArray(trainers) && trainers.map((trainer) => (
                                    <div
                                        key={trainer._id}
                                        className={`trainer-card ${selectedTrainerId === trainer._id ? 'selected' : ''}`}
                                        onClick={() => setSelectedTrainerId(trainer._id)}
                                    >
                                        <div className="trainer-avatar">
                                            {trainer.avatar ? (
                                                <img src={trainer.avatar} alt={trainer.hoTen} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {trainer.hoTen?.charAt(0) || 'P'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="trainer-info">
                                            <h5 className="trainer-name">{trainer.hoTen}</h5>
                                            <p className="trainer-specialty">{trainer.chuyenMon || 'PT chuyên nghiệp'}</p>
                                            <div className="trainer-rating">
                                                <span className="stars">⭐⭐⭐⭐⭐</span>
                                                <span className="rating-text">5.0</span>
                                            </div>
                                            <div className="trainer-experience">
                                                <span className="experience-icon">💪</span>
                                                <span>{trainer.kinhNghiem || '3+'} năm kinh nghiệm</span>
                                            </div>
                                        </div>
                                        <div className="selection-indicator">
                                            {selectedTrainerId === trainer._id && <span className="checkmark">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        ← Trước
                                    </button>

                                    <div className="pagination-info">
                                        Trang {currentPage} / {totalPages}
                                    </div>

                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sau →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!selectedTrainerId || submitting || trainers.length === 0}
                    >
                        {submitting ? 'Đang chọn PT...' : 'Tiếp tục'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TrainerSelection;
