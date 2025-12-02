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
    const [previousPackageInfo, setPreviousPackageInfo] = useState(null);
    const [showInfoChoiceModal, setShowInfoChoiceModal] = useState(false);
    const [keepPreviousInfo, setKeepPreviousInfo] = useState(false);
    const [hasHandledInfoChoice, setHasHandledInfoChoice] = useState(false);

    // Kiểm tra gói hoàn tất trước đó NGAY KHI VÀO TRANG
    useEffect(() => {
        const checkPreviousPackage = async () => {
            try {
                console.log('🔍 [Workflow] Checking for previous completed package...');
                const response = await api.get('/chitietgoitap/last-completed', {}, { requireAuth: true });
                console.log('📦 [Workflow] Last completed package response:', response);

                if (response && response.success && response.hasPreviousPackage) {
                    setPreviousPackageInfo(response.data);
                    console.log('✅ [Workflow] Found previous completed package:', response.data);
                } else {
                    console.log('ℹ️ [Workflow] No previous completed package found');
                }
            } catch (error) {
                console.error('❌ [Workflow] Error checking previous package:', error);
                // This is normal for first-time users
            }
        };

        checkPreviousPackage();
    }, [registrationId]);

    useEffect(() => {
        const init = async () => {
            const response = await fetchWorkflowStatus();
            // If workflow is completed, don't load branches
            if (response?.data?.currentStep !== 'completed') {
                fetchBranches();
            }
        };
        init();
    }, [registrationId]);

    // Hiển thị modal khi có previousPackageInfo và workflow chưa hoàn tất
    useEffect(() => {
        if (!previousPackageInfo || !workflowData || hasHandledInfoChoice) {
            return;
        }

        // Kiểm tra workflow chưa hoàn tất
        const isNotCompleted = workflowData?.currentStep !== 'completed' &&
            workflowData?.workflowSteps?.completed?.status !== 'completed' &&
            workflowData?.registration?.trangThaiDangKy !== 'HOAN_THANH';

        if (isNotCompleted) {
            console.log('✅ [Workflow] Showing info choice modal - has previous package and workflow not completed', {
                currentStep: workflowData?.currentStep,
                trangThaiDangKy: workflowData?.registration?.trangThaiDangKy,
                previousPackageInfo
            });
            setShowInfoChoiceModal(true);
        }
    }, [previousPackageInfo, workflowData, hasHandledInfoChoice]);

    // Kiểm tra và quyết định có hiển thị modal không dựa trên workflow status
    const checkPreviousCompletedPackage = async (workflowStatusData) => {
        // Chỉ kiểm tra nếu đã có previousPackageInfo (đã được fetch ở useEffect đầu tiên)
        if (!previousPackageInfo) {
            console.log('ℹ️ [Workflow] No previous package info, skipping modal check');
            return;
        }

        // Đơn giản hóa: Hiển thị modal nếu workflow chưa hoàn tất
        // Không cần kiểm tra bước đầu tiên vì modal sẽ hiển thị trước khi vào workflow
        const isNotCompleted = workflowStatusData?.currentStep !== 'completed' &&
            workflowStatusData?.workflowSteps?.completed?.status !== 'completed' &&
            workflowStatusData?.registration?.trangThaiDangKy !== 'HOAN_THANH';

        if (isNotCompleted) {
            console.log('✅ [Workflow] Showing info choice modal - has previous package and workflow not completed', {
                currentStep: workflowStatusData?.currentStep,
                trangThaiDangKy: workflowStatusData?.registration?.trangThaiDangKy,
                isNotCompleted,
                previousPackageInfo
            });
            setShowInfoChoiceModal(true);
        } else {
            console.log('ℹ️ [Workflow] Not showing modal - workflow already completed:', {
                currentStep: workflowStatusData?.currentStep,
                trangThaiDangKy: workflowStatusData?.registration?.trangThaiDangKy,
                hasPreviousPackage: !!previousPackageInfo
            });
        }
    };

    const fetchWorkflowStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/package-workflow/workflow-status/${registrationId}`);

            if (response.success) {
                setWorkflowData(response.data);

                // If workflow is completed, stop here and don't update step
                if (response.data.currentStep === 'completed' ||
                    response.data.workflowSteps?.completed?.status === 'completed') {
                    setCurrentStep(getStepIndex('completed', response.data.isOwner));
                    return response;
                }

                // Force stay at step 0 for owners until explicitly confirmed in this session
                if (response.data.isOwner && !hasConfirmedBranch) {
                    setCurrentStep(0);
                } else {
                    setCurrentStep(getStepIndex(response.data.currentStep, response.data.isOwner));
                }
            } else {
                setError(response.message || 'Không thể tải thông tin workflow');
            }
            return response;
        } catch (err) {
            console.error('Error fetching workflow status:', err);
            setError('Lỗi khi tải thông tin workflow');
            throw err;
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

    // Xử lý khi chọn giữ thông tin từ gói cũ
    const handleKeepPreviousInfo = async () => {
        try {
            if (!previousPackageInfo) return;

            setLoading(true);
            setError(null);

            // 1. Cập nhật branchId
            if (previousPackageInfo.branchId) {
                await api.patch(`/chitietgoitap/${registrationId}/branch`, {
                    branchId: previousPackageInfo.branchId
                });
            }

            // 2. Cập nhật PT nếu có
            if (previousPackageInfo.ptId) {
                await api.post(`/package-workflow/select-trainer/${registrationId}`, {
                    trainerId: previousPackageInfo.ptId
                });
            }

            // 3. Nếu có cả branchId và ptId, cố gắng hoàn tất luôn workflow bằng cách bỏ qua bước tạo lịch tập
            if (previousPackageInfo.branchId && previousPackageInfo.ptId) {
                console.log('🔁 [Workflow] Completing workflow using previous branch & PT info...');
                const completeResponse = await api.post(`/package-workflow/complete-workflow/${registrationId}`, {
                    skipScheduleForReuse: true
                });

                if (completeResponse.success) {
                    console.log('✅ [Workflow] Completed using previous info:', completeResponse);
                    setShowInfoChoiceModal(false);
                    setKeepPreviousInfo(true);
                    setHasHandledInfoChoice(true);

                    // Cập nhật trạng thái mới nhất rồi về trang chủ với thông báo
                    await fetchWorkflowStatus();
                    navigate('/', {
                        state: {
                            completedWorkflow: true,
                            message: 'Đăng ký gói tập thành công! Thông tin chi nhánh và PT được giữ nguyên từ gói trước đó.'
                        }
                    });
                    return;
                } else {
                    console.warn('⚠️ [Workflow] Could not auto-complete workflow, falling back to normal flow:', completeResponse);
                }
            }

            // 4. Nếu không đủ dữ liệu để hoàn tất ngay, chỉ cập nhật branch/PT và chuyển sang bước tiếp theo như cũ
            await fetchWorkflowStatus();
            setShowInfoChoiceModal(false);
            setKeepPreviousInfo(true);
            setHasHandledInfoChoice(true);

            // Nếu đã có cả branch và PT, có thể skip đến bước tạo lịch tập
            if (previousPackageInfo.branchId && previousPackageInfo.ptId) {
                // Refresh để cập nhật step
                const status = await fetchWorkflowStatus();
                if (status?.data?.currentStep === 'createSchedule') {
                    setCurrentStep(2); // Bước tạo lịch tập
                } else {
                    setCurrentStep(1); // Bước chọn PT (nếu chưa có PT)
                }
            } else {
                setCurrentStep(1); // Chuyển đến bước chọn PT
            }
        } catch (err) {
            console.error('Error keeping previous info:', err);
            setError('Lỗi khi áp dụng thông tin từ gói cũ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
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
            setLoading(true);
            setError(null);

            // Tạo lịch tập mới
            const response = await api.post('/package-workflow/generate-schedule/' + registrationId, {
                ...scheduleData,
                registrationId
            });

            if (!response.success) {
                throw new Error(response.message || 'Lỗi khi tạo lịch tập');
            }

            // Đợi 1 giây để backend xử lý
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Lấy trạng thái mới nhất
            const statusCheck = await api.get(`/package-workflow/workflow-status/${registrationId}`);
            console.log('🔍 Status after creating schedule:', statusCheck.data);

            // Kiểm tra trạng thái
            if (statusCheck?.data?.registration?.lichTapDuocTao ||
                statusCheck?.data?.registration?.trangThai === 'DA_TAO_LICH') {
                console.log('✅ Schedule creation confirmed');
                setCurrentStep(prev => prev + 1);
            } else {
                throw new Error('Vui lòng thử lại sau vài giây. Hệ thống đang xử lý.');
            }

        } catch (err) {
            console.error('Error creating schedule:', err);

            if (err.response?.status === 409) {
                // Lịch tập đã tồn tại, chuyển sang bước tiếp theo
                setCurrentStep(prev => prev + 1);
                return;
            }

            setError(err.message || 'Lỗi khi tạo lịch tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteWorkflow = async () => {
        try {
            setLoading(true);

            // Kiểm tra trạng thái trước khi hoàn thành
            const statusCheck = await api.get(`/package-workflow/workflow-status/${registrationId}`);
            console.log('🔍 Kiểm tra trạng thái trước khi hoàn thành:', statusCheck.data);

            // Kiểm tra các điều kiện cần thiết
            if (!statusCheck.data?.registration) {
                throw new Error('Không tìm thấy thông tin đăng ký.');
            }

            if (!statusCheck.data.registration.lichTapDuocTao) {
                throw new Error('Lịch tập chưa được tạo. Vui lòng tạo lịch tập trước.');
            }

            if (statusCheck.data.registration.trangThaiDangKy === 'HOAN_THANH' ||
                statusCheck.data.registration.trangThai === 'HOAN_THANH' ||
                statusCheck.data.currentStep === 'completed') {
                // Nếu đã hoàn thành, chuyển hướng về trang chủ
                navigate('/', {
                    state: {
                        completedWorkflow: true,
                        message: 'Gói tập đã được đăng ký thành công trước đó.'
                    }
                });
                return;
            }

            // Đảm bảo đã lưu lịch tập
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Gọi API hoàn thành workflow
            const response = await api.post(`/package-workflow/complete-workflow/${registrationId}`);

            if (response.success) {
                console.log('✅ Workflow completed successfully');

                // Đợi backend cập nhật trạng thái
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Kiểm tra lại trạng thái cuối cùng
                const finalStatus = await api.get(`/package-workflow/workflow-status/${registrationId}`);

                console.log('🔍 Final status check:', {
                    trangThaiDangKy: finalStatus.data?.registration?.trangThaiDangKy,
                    trangThai: finalStatus.data?.registration?.trangThai,
                    lichTapDuocTao: finalStatus.data?.registration?.lichTapDuocTao,
                    currentStep: finalStatus.data?.currentStep
                });

                // Kiểm tra cả trangThaiDangKy và currentStep
                if (finalStatus.data?.registration?.trangThaiDangKy === 'HOAN_THANH' ||
                    finalStatus.data?.currentStep === 'completed' ||
                    finalStatus.data?.registration?.trangThai === 'HOAN_THANH') {
                    // Cập nhật workflow status và chuyển hướng
                    await fetchWorkflowStatus();
                    navigate('/', {
                        state: {
                            completedWorkflow: true,
                            message: 'Đăng ký gói tập thành công! Bạn có thể bắt đầu tập luyện ngay.'
                        }
                    });
                } else {
                    console.error('❌ Workflow not completed:', {
                        trangThaiDangKy: finalStatus.data?.registration?.trangThaiDangKy,
                        trangThai: finalStatus.data?.registration?.trangThai,
                        currentStep: finalStatus.data?.currentStep
                    });
                    throw new Error('Không thể hoàn thành workflow. Vui lòng thử lại.');
                }
            } else {
                throw new Error(response.message || 'Lỗi khi hoàn thành workflow');
            }
        } catch (err) {
            console.error('Error completing workflow:', err);

            // Xử lý các trường hợp lỗi cụ thể
            if (err.response?.status === 400) {
                if (err.response?.data?.message?.includes('completed')) {
                    navigate('/', {
                        state: {
                            completedWorkflow: true,
                            message: 'Gói tập đã được đăng ký thành công trước đó.'
                        }
                    });
                } else {
                    setError(err.response?.data?.message || 'Lỗi khi hoàn thành workflow. Vui lòng thử lại.');
                }
            } else {
                setError(err.message || 'Lỗi kết nối. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    }; const getStepTitle = (stepIndex, isOwner) => {
        const steps = isOwner
            ? ['Chọn chi nhánh', 'Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành']
            : ['Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành'];

        return steps[stepIndex] || '';
    };

    const renderStepContent = () => {
        if (!workflowData) return null;

        const { registration, isOwner, isPartner } = workflowData;

        // Check if workflow is already completed
        if (workflowData.currentStep === 'completed' || workflowData.workflowSteps?.completed?.status === 'completed') {
            return (
                <div className="completed-message text-center p-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-green-500 mb-4">Đăng ký gói tập đã hoàn tất!</h2>
                    <p className="text-gray-400 mb-6">
                        Gói tập của bạn đã được kích hoạt và sẵn sàng sử dụng.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary"
                    >
                        Về trang chủ
                    </button>
                </div>
            );
        }

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
            {/* Modal chọn giữ/thay đổi thông tin từ gói cũ */}
            {showInfoChoiceModal && previousPackageInfo && (
                <div className="info-choice-modal-overlay" onClick={() => { }}>
                    <div className="info-choice-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="info-choice-modal-header">
                            <h2>Chọn thông tin đăng ký</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => {
                                    setShowInfoChoiceModal(false);
                                    setKeepPreviousInfo(false);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="info-choice-modal-content">
                            <p className="info-choice-description">
                                Bạn đã có gói tập hoàn tất trước đó. Bạn muốn:
                            </p>
                            <div className="info-choice-options">
                                <div className="info-choice-option">
                                    <div className="previous-info-summary">
                                        <h4>Thông tin từ gói trước:</h4>
                                        <ul>
                                            <li><strong>Chi nhánh:</strong> {previousPackageInfo.branchName || 'N/A'}</li>
                                            {previousPackageInfo.ptName && (
                                                <li><strong>PT:</strong> {previousPackageInfo.ptName} {previousPackageInfo.ptSpecialty ? `(${previousPackageInfo.ptSpecialty})` : ''}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                <div className="info-choice-buttons">
                                    <button
                                        className="choice-btn keep-btn"
                                        onClick={handleKeepPreviousInfo}
                                        disabled={loading}
                                    >
                                        {loading ? 'Đang xử lý...' : '✓ Sử dụng thông tin cũ'}
                                    </button>
                                    <button
                                        className="choice-btn change-btn"
                                        onClick={() => {
                                            setKeepPreviousInfo(false);
                                            setShowInfoChoiceModal(false);
                                            setHasHandledInfoChoice(true);
                                        }}
                                        disabled={loading}
                                    >
                                        ✏️ Thay đổi thông tin
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
