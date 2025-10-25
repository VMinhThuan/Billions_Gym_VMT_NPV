import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getBranchImage } from '../../utils/branchImageMapper';
import { getCurrentLocation, sortBranchesByDistance, formatDistance } from '../../utils/geoUtils';
import './WorkflowComponents.css';

const BranchSelection = ({ branches, selectedBranch, onSelectBranch, loading }) => {
    const [selectedBranchId, setSelectedBranchId] = useState(selectedBranch?._id || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [sortedBranches, setSortedBranches] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // Get user location and sort branches by distance
    useEffect(() => {
        const initializeLocation = async () => {
            try {
                setLocationLoading(true);
                const location = await getCurrentLocation();
                setUserLocation(location);

                // Sort branches by distance
                const sorted = sortBranchesByDistance(branches, location);
                setSortedBranches(sorted);

                // Auto-select closest branch if no branch is selected
                if (!selectedBranchId && sorted.length > 0) {
                    setSelectedBranchId(sorted[0]._id);
                }
            } catch (error) {
                console.error('Error getting location:', error);
                // Fallback: use original branches without sorting
                setSortedBranches(branches);
            } finally {
                setLocationLoading(false);
            }
        };

        if (branches && branches.length > 0) {
            initializeLocation();
        }
    }, [branches, selectedBranchId]);

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
                        {sortedBranches.filter(b => b._id === selectedBranchId).map(b => (
                            <div key={b._id} style={{ color: '#a3a3a3' }}>
                                <div style={{ fontWeight: 600, color: '#e5e5e5', marginBottom: 4 }}>{b.tenChiNhanh}</div>
                                <div style={{ marginBottom: 10 }}>{b.diaChi}</div>
                                {b.distance && (
                                    <div style={{
                                        marginBottom: 10,
                                        color: '#10b981',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}>
                                        📍 {formatDistance(b.distance)} từ vị trí của bạn
                                    </div>
                                )}
                                {/* Branch Image */}
                                <div style={{
                                    height: 140,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    border: '1px solid #1f2937',
                                    marginBottom: 8,
                                    position: 'relative'
                                }}>
                                    <img
                                        src={getBranchImage(b)}
                                        alt={b.tenChiNhanh}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div style={{
                                        height: '100%',
                                        background: 'linear-gradient(135deg,#0f172a 0%, #111827 100%)',
                                        display: 'none',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: 12
                                    }}>
                                        Không có ảnh
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {locationLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Đang tải vị trí và sắp xếp chi nhánh...</p>
                    </div>
                ) : (
                    <div className="branch-grid">
                        {sortedBranches.map((branch) => (
                            <div
                                key={branch._id}
                                className={`branch-card ${selectedBranchId === branch._id ? 'selected' : ''}`}
                                onClick={() => setSelectedBranchId(branch._id)}
                            >
                                {/* Branch Image */}
                                <div className="branch-image-container">
                                    <img
                                        src={getBranchImage(branch)}
                                        alt={branch.tenChiNhanh}
                                        className="branch-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="branch-image-fallback">
                                        <span className="branch-icon">🏢</span>
                                    </div>

                                    {/* Distance Badge */}
                                    {branch.distance && (
                                        <div className="distance-badge">
                                            {formatDistance(branch.distance)}
                                        </div>
                                    )}
                                </div>

                                <div className="branch-info">
                                    <h4 className="branch-name">{branch.tenChiNhanh}</h4>
                                    <p className="branch-address">{branch.diaChi}</p>
                                    {branch.distance && (
                                        <div className="branch-distance">
                                            <span className="distance-icon">📍</span>
                                            <span>{formatDistance(branch.distance)} từ vị trí của bạn</span>
                                        </div>
                                    )}
                                </div>

                                <div className="selection-indicator">
                                    {selectedBranchId === branch._id && <span className="checkmark">✓</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
