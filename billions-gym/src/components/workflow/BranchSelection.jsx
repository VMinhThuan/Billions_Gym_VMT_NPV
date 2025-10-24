import React, { useState } from 'react';
import { api } from '../../services/api';
import './WorkflowComponents.css';

const BranchSelection = ({ branches, selectedBranch, onSelectBranch, loading }) => {
    const [selectedBranchId, setSelectedBranchId] = useState(selectedBranch?._id || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBranchId) {
            setError('Vui lòng chọn chi nhánh');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await onSelectBranch(selectedBranchId);
        } catch (err) {
            setError('Lỗi khi cập nhật chi nhánh');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="branch-selection">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh sách chi nhánh...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="branch-selection">
            <div className="selection-header">
                <h3>Xác nhận chi nhánh tập luyện</h3>
                <p>Vui lòng xác nhận chi nhánh bạn sẽ tập. Bạn có thể chọn chi nhánh khác nếu muốn.</p>
            </div>

            <form onSubmit={handleSubmit} className="branch-form">
                {/* Current selection preview */}
                {selectedBranchId && (
                    <div style={{
                        background: '#101010',
                        border: '1px solid #262626',
                        borderRadius: 12,
                        padding: '1rem',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span className="branch-icon">📍</span>
                            <strong style={{ color: '#f2f2f2' }}>Chi nhánh đã chọn</strong>
                        </div>
                        {branches.filter(b => b._id === selectedBranchId).map(b => (
                            <div key={b._id} style={{ color: '#a3a3a3' }}>
                                <div style={{ fontWeight: 600, color: '#e5e5e5', marginBottom: 4 }}>{b.tenChiNhanh}</div>
                                <div style={{ marginBottom: 10 }}>{b.diaChi}</div>
                                {/* Mini map placeholder */}
                                <div style={{
                                    height: 140,
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg,#0f172a 0%, #111827 100%)',
                                    border: '1px solid #1f2937',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#94a3b8', fontSize: 12
                                }}>
                                    Bản đồ vị trí chi nhánh (đang phát triển)
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="branch-grid">
                    {branches.map((branch) => (
                        <div
                            key={branch._id}
                            className={`branch-card ${selectedBranchId === branch._id ? 'selected' : ''}`}
                            onClick={() => setSelectedBranchId(branch._id)}
                        >
                            <div className="branch-icon">🏢</div>
                            <h4 className="branch-name">{branch.tenChiNhanh}</h4>
                            <p className="branch-address">{branch.diaChi}</p>
                            {branch.location ? (
                                (() => {
                                    const loc = branch.location;
                                    let display = '';
                                    if (typeof loc === 'string') {
                                        display = loc;
                                    } else if (loc && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
                                        display = `${loc.coordinates[1]}, ${loc.coordinates[0]}`; // lat, lng
                                    }
                                    return display ? (
                                        <div className="branch-location">
                                            <span className="location-icon">📍</span>
                                            <span>{display}</span>
                                        </div>
                                    ) : null;
                                })()
                            ) : null}
                            <div className="selection-indicator">
                                {selectedBranchId === branch._id && <span className="checkmark">✓</span>}
                            </div>
                        </div>
                    ))}
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
                        disabled={!selectedBranchId || submitting}
                    >
                        {submitting ? 'Đang xác nhận...' : 'Xác nhận chi nhánh'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BranchSelection;
