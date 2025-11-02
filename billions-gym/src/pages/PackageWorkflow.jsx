import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import SimpleLayout from '../components/layout/SimpleLayout';
import BranchSelection from '../components/workflow/BranchSelection';
import TrainerSelection from '../components/workflow/TrainerSelection';
import ScheduleBuilder from '../components/workflow/ScheduleBuilder';
import WorkflowComplete from '../components/workflow/WorkflowComplete';
import { getBranchImage } from '../utils/branchImageMapper';
import './PackageWorkflow.css';

const PackageWorkflow = () => {
    const { registrationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [workflowData, setWorkflowData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasConfirmedBranch, setHasConfirmedBranch] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWorkflowStatus();
        fetchBranches();
    }, [registrationId]);

    const fetchWorkflowStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/package-workflow/workflow-status/${registrationId}`);

            if (response.success) {
                setWorkflowData(response.data);
                // Force stay at step 0 for owners until explicitly confirmed in this session
                if (response.data.isOwner && !hasConfirmedBranch) {
                    setCurrentStep(0);
                } else {
                    setCurrentStep(getStepIndex(response.data.currentStep, response.data.isOwner));
                }
            } else {
                setError(response.message || 'Không thể tải thông tin workflow');
            }
        } catch (err) {
            console.error('Error fetching workflow status:', err);
            setError('Lỗi khi tải thông tin workflow');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await api.get('/chinhanh');
            if (response.success) {
                setBranches(response.data);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    };

    const getStepIndex = (stepName, isOwner) => {
        const steps = isOwner
            ? ['selectBranch', 'selectTrainer', 'createSchedule', 'completed']
            : ['selectTrainer', 'createSchedule', 'completed'];

        return steps.indexOf(stepName);
    };

    const handleSelectBranch = async (branchId) => {
        try {
            // Use PATCH route for direct update from step 1
            const response = await api.patch(`/chitietgoitap/${registrationId}/branch`, { branchId });

            if (response.success) {
                // Mark as confirmed, then refresh status and advance
                setHasConfirmedBranch(true);
                await fetchWorkflowStatus();
                setCurrentStep(1);
            } else {
                setError(response.message || 'Lỗi khi cập nhật chi nhánh');
            }
        } catch (err) {
            console.error('Error updating branch:', err);
            setError('Lỗi khi cập nhật chi nhánh');
        }
    };

    const handleSelectTrainer = async (trainerId, gioTapUuTien, soNgayTapTrongTuan) => {
        try {
            const response = await api.post(`/package-workflow/select-trainer/${registrationId}`, {
                ptId: trainerId,
                gioTapUuTien,
                soNgayTapTrongTuan
            });

            if (response.success) {
                // Refresh workflow status
                await fetchWorkflowStatus();
            } else {
                setError(response.message || 'Lỗi khi chọn PT');
            }
        } catch (err) {
            console.error('Error selecting trainer:', err);
            setError('Lỗi khi chọn PT');
        }
    };

    const handleCreateSchedule = async (scheduleData) => {
        try {
            console.log('🎯 Parent handleCreateSchedule called with:', scheduleData);
            const response = await api.post('/lich-tap/create-schedule', scheduleData);

            if (response.success) {
                console.log('✅ Schedule created successfully, refreshing workflow status...');
                // Refresh workflow status
                await fetchWorkflowStatus();
                // Chuyển sang bước tiếp theo
                setCurrentStep(prev => prev + 1);
                console.log('🚀 Moved to next step');
            } else {
                setError(response.message || 'Lỗi khi tạo lịch tập');
            }
        } catch (err) {
            console.error('Error creating schedule:', err);
            setError('Lỗi khi tạo lịch tập');
        }
    };

    const handleCompleteWorkflow = async () => {
        try {
            const response = await api.post(`/package-workflow/complete-workflow/${registrationId}`);

            if (response.success) {
                // Refresh workflow status
                await fetchWorkflowStatus();
            } else {
                setError(response.message || 'Lỗi khi hoàn thành workflow');
            }
        } catch (err) {
            console.error('Error completing workflow:', err);
            setError('Lỗi khi hoàn thành workflow');
        }
    };

    const getStepTitle = (stepIndex, isOwner) => {
        const steps = isOwner
            ? ['Chọn chi nhánh', 'Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành']
            : ['Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành'];

        return steps[stepIndex] || '';
    };

    const renderStepContent = () => {
        if (!workflowData) return null;

        const { registration, isOwner, isPartner } = workflowData;

        switch (currentStep) {
            case 0: // Chọn chi nhánh (chỉ owner) hoặc Chọn PT (partner)
                if (isOwner) {
                    // Không render nội dung PT/lịch ở bước 1; chỉ mở modal khi người dùng chọn đổi chi nhánh
                    return null;
                } else {
                    return (
                        <TrainerSelection
                            registrationId={registrationId}
                            selectedTrainer={workflowData.workflowSteps.selectTrainer.data}
                            onSelectTrainer={handleSelectTrainer}
                            loading={loading}
                            registration={workflowData?.registration}
                        />
                    );
                }
            case 1: // Chọn PT (owner) hoặc Tạo lịch tập (partner)
                if (isOwner) {
                    return (
                        <TrainerSelection
                            registrationId={registrationId}
                            selectedTrainer={workflowData.workflowSteps.selectTrainer.data}
                            onSelectTrainer={handleSelectTrainer}
                            loading={loading}
                            registration={workflowData?.registration}
                        />
                    );
                } else {
                    return (
                        <ScheduleSelection
                            registrationId={registrationId}
                            selectedSchedule={workflowData.workflowSteps.createSchedule.data}
                            onCreateSchedule={handleCreateSchedule}
                            loading={loading}
                        />
                    );
                }
            case 2: // Tạo lịch tập (owner) hoặc Hoàn thành (partner)
                if (isOwner) {
                    return (
                        <ScheduleBuilder
                            registrationId={registrationId}
                            selectedTrainer={workflowData.workflowSteps.selectTrainer.data}
                            onCreateSchedule={handleCreateSchedule}
                            loading={loading}
                        />
                    );
                } else {
                    return (
                        <WorkflowComplete
                            registration={registration}
                            onComplete={handleCompleteWorkflow}
                        />
                    );
                }
            case 3: // Hoàn thành (owner)
                return (
                    <WorkflowComplete
                        registration={registration}
                        onComplete={handleCompleteWorkflow}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <SimpleLayout>
                <div className="workflow-page" style={{ minHeight: '100vh' }}>
                    <div className="package-workflow-container">
                        <div className="loading-container" style={{ background: 'transparent', minHeight: '50vh' }}>
                            <div className="loading-spinner"></div>
                            <p style={{ color: '#e5e7eb' }}>Đang tải thông tin workflow...</p>
                        </div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (error) {
        return (
            <SimpleLayout>
                <div className="package-workflow-container">
                    <div className="error-container">
                        <div className="error-icon">❌</div>
                        <h2>Lỗi xảy ra</h2>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>
                            Quay về trang chủ
                        </button>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (!workflowData) {
        return (
            <SimpleLayout>
                <div className="package-workflow-container">
                    <div className="error-container">
                        <div className="error-icon">⚠️</div>
                        <h2>Không tìm thấy thông tin</h2>
                        <p>Không thể tải thông tin workflow cho đăng ký này.</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>
                            Quay về trang chủ
                        </button>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    const { registration, isOwner, isPartner } = workflowData;
    const totalSteps = isOwner ? 4 : 3;

    return (
        <SimpleLayout>
            <div className="workflow-page">
                <div className="package-workflow-container">
                    <div className="workflow-header">
                        <h1>Hoàn tất đăng ký gói tập</h1>
                        <p className="package-name">{registration.goiTapId?.tenGoiTap}</p>
                        <div className="user-info">
                            {isOwner && <span className="badge owner">Người thanh toán</span>}
                            {isPartner && <span className="badge partner">Người được mời</span>}
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="workflow-steps steps-sticky">
                        <div className="steps-container">
                            {Array.from({ length: totalSteps }, (_, index) => (
                                <div key={index} className={`step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}>
                                    <div className="step-number">
                                        {index < currentStep ? '✓' : index + 1}
                                    </div>
                                    <div className="step-title">
                                        {getStepTitle(index, isOwner)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="workflow-content">
                        <div className="step-header">
                            <h2>{getStepTitle(currentStep, isOwner)}</h2>
                            <p className="step-description">
                                {currentStep === 0 && isOwner && "Chọn chi nhánh tập luyện cho gói tập của bạn"}
                                {currentStep === 0 && isPartner && "Chọn PT phù hợp với lịch trình của bạn"}
                                {currentStep === 1 && isOwner && "Chọn PT và thiết lập lịch trình ưu tiên"}
                                {currentStep === 1 && isPartner && "Tạo lịch tập phù hợp với thời gian của bạn"}
                                {currentStep === 2 && isOwner && "Tạo lịch tập phù hợp với thời gian của bạn"}
                                {currentStep === 2 && isPartner && "Hoàn tất đăng ký gói tập"}
                                {currentStep === 3 && isOwner && "Hoàn tất đăng ký gói tập"}
                            </p>
                        </div>

                        <div className="step-content fade-slide-enter fade-slide-enter-active">
                            {/* Banner confirm current branch for step 1 (owner) */}
                            {workflowData?.isOwner && currentStep === 0 && (
                                <div className="mb-6 rounded-xl border border-[#262626] bg-[#101010] p-4">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            {/* Branch Image */}
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-[#262626] flex-shrink-0">
                                                <img
                                                    src={getBranchImage(workflowData?.registration?.branchId)}
                                                    alt={workflowData?.registration?.branchId?.tenChiNhanh || 'Chi nhánh'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center text-gray-500 text-2xl" style={{ display: 'none' }}>
                                                    🏢
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-sm text-gray-400">Chi nhánh bạn chọn</div>
                                                <div className="text-lg font-semibold text-gray-100">
                                                    {workflowData?.registration?.branchId?.tenChiNhanh || 'Chưa chọn'}
                                                </div>
                                                {workflowData?.registration?.branchId?.diaChi && (
                                                    <div className="text-sm text-gray-400">{workflowData.registration.branchId.diaChi}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSelectBranch(workflowData?.registration?.branchId?._id)}
                                                className="btn-primary"
                                                disabled={!workflowData?.registration?.branchId?._id}
                                            >
                                                Xác nhận
                                            </button>
                                            <button
                                                onClick={() => setShowBranchModal(true)}
                                                className="btn-secondary"
                                            >
                                                Đổi chi nhánh
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {renderStepContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal chọn chi nhánh */}
            {showBranchModal && (
                <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowBranchModal(false)}>
                    <div className="w-full max-w-6xl bg-[#141414] border border-[#262626] rounded-xl shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] flex-shrink-0">
                            <h3 className="text-white font-semibold text-lg">Chọn chi nhánh mới</h3>
                            <button className="text-gray-400 hover:text-white text-xl" onClick={() => setShowBranchModal(false)}>✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <BranchSelection
                                branches={branches}
                                selectedBranch={workflowData?.registration?.branchId}
                                onSelectBranch={async (newBranchId) => {
                                    await handleSelectBranch(newBranchId);
                                    setShowBranchModal(false);
                                }}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            )}
        </SimpleLayout>
    );
};

export default PackageWorkflow;
