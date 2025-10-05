import React, { useState, useEffect } from 'react';
import TrainerSelection from './TrainerSelection';
import ScheduleGeneration from './ScheduleGeneration';
import WorkoutScheduleView from './WorkoutScheduleView';
import Card from '../Card';
import Button from '../Button';
import { useCrudNotifications } from '../../hooks/useNotification';
import { api } from '../../services/api';
import './PackageWorkflow.css';

interface PackageWorkflowManagerProps {
    chiTietGoiTapId: string;
    initialStep?: 'overview' | 'trainer-selection' | 'schedule-generation' | 'schedule-view';
    onComplete?: () => void;
}

type WorkflowStep = 'overview' | 'trainer-selection' | 'schedule-generation' | 'schedule-view' | 'completed';

const PackageWorkflowManager: React.FC<PackageWorkflowManagerProps> = ({
    chiTietGoiTapId,
    initialStep = 'overview',
    onComplete
}) => {
    // Khôi phục selectedPTId từ localStorage khi component mount
    const [selectedPTId, setSelectedPTId] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(`workflow-selected-pt-${chiTietGoiTapId}`);
            return saved || '';
        } catch {
            return '';
        }
    });

    // Khôi phục completedSteps từ localStorage khi component mount
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(`workflow-completed-steps-${chiTietGoiTapId}`);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Xác định currentStep dựa trên completedSteps
    const [currentStep, setCurrentStep] = useState<WorkflowStep>(() => {
        // Khôi phục completedSteps từ localStorage để xác định bước hiện tại
        try {
            const saved = localStorage.getItem(`workflow-completed-steps-${chiTietGoiTapId}`);
            const savedSteps = saved ? new Set(JSON.parse(saved)) : new Set();

            // Nếu có completedSteps, xác định bước tiếp theo
            if (savedSteps.has('trainer-selection') && savedSteps.has('schedule-generation') && savedSteps.has('schedule-view')) {
                return 'completed';
            } else if (savedSteps.has('trainer-selection') && savedSteps.has('schedule-generation')) {
                return 'schedule-view';
            } else if (savedSteps.has('trainer-selection')) {
                return 'schedule-generation';
            } else {
                return 'trainer-selection';
            }
        } catch {
            return 'trainer-selection';
        }
    });

    const notifications = useCrudNotifications();

    // Lưu completedSteps vào localStorage mỗi khi nó thay đổi
    useEffect(() => {
        try {
            localStorage.setItem(`workflow-completed-steps-${chiTietGoiTapId}`, JSON.stringify([...completedSteps]));
        } catch (error) {
            console.error('Error saving completed steps to localStorage:', error);
        }
    }, [completedSteps, chiTietGoiTapId]);

    // Lưu selectedPTId vào localStorage mỗi khi nó thay đổi
    useEffect(() => {
        try {
            if (selectedPTId) {
                localStorage.setItem(`workflow-selected-pt-${chiTietGoiTapId}`, selectedPTId);
            } else {
                localStorage.removeItem(`workflow-selected-pt-${chiTietGoiTapId}`);
            }
        } catch (error) {
            console.error('Error saving selected PT to localStorage:', error);
        }
    }, [selectedPTId, chiTietGoiTapId]);

    // Cập nhật currentStep khi completedSteps thay đổi
    useEffect(() => {
        if (completedSteps.has('trainer-selection') && completedSteps.has('schedule-generation') && completedSteps.has('schedule-view')) {
            setCurrentStep('completed');
        } else if (completedSteps.has('trainer-selection') && completedSteps.has('schedule-generation')) {
            setCurrentStep('schedule-view');
        } else if (completedSteps.has('trainer-selection')) {
            setCurrentStep('schedule-generation');
        } else {
            setCurrentStep('trainer-selection');
        }
    }, [completedSteps]);

    // Debug log để kiểm tra trạng thái
    useEffect(() => {
        console.log('🔍 PackageWorkflowManager mounted:', {
            chiTietGoiTapId,
            selectedPTId,
            completedSteps: [...completedSteps],
            currentStep
        });
    }, [chiTietGoiTapId, selectedPTId, completedSteps, currentStep]);

    const steps = [
        { key: 'trainer-selection', label: 'Chọn PT', icon: '👨‍💼' },
        { key: 'schedule-generation', label: 'Tạo lịch tập', icon: '📅' },
        { key: 'schedule-view', label: 'Xem lịch tập', icon: '📋' },
        { key: 'completed', label: 'Hoàn thành', icon: '✅' }
    ];

    const getCurrentStepIndex = () => {
        if (currentStep === 'overview') return -1;
        return steps.findIndex(step => step.key === currentStep);
    };

    const handleStepClick = (stepKey: string) => {
        if (stepKey === 'trainer-selection') {
            setCurrentStep('trainer-selection');
        }
    };

    const handleTrainerSelected = (ptId: string) => {
        setSelectedPTId(ptId);
        setCompletedSteps(prev => new Set([...prev, 'trainer-selection']));
        setCurrentStep('schedule-generation');
        notifications.generic.success('Bước 1 hoàn thành: Đã chọn PT!');
    };

    const handleScheduleGenerated = () => {
        setCompletedSteps(prev => new Set([...prev, 'schedule-generation']));
        setCurrentStep('schedule-view');
        notifications.generic.success('Bước 2 hoàn thành: Đã tạo lịch tập!');
    };

    const handleWorkflowComplete = async () => {
        // Đảm bảo bước 3 được đánh dấu hoàn thành nếu chưa có
        let updatedCompletedSteps = completedSteps;
        if (!completedSteps.has('schedule-view')) {
            updatedCompletedSteps = new Set([...completedSteps, 'schedule-view']);
            setCompletedSteps(updatedCompletedSteps);
        }

        // Kiểm tra xem đã hoàn thành đủ 3 bước chưa
        const requiredSteps = ['trainer-selection', 'schedule-generation', 'schedule-view'];
        const hasAllSteps = requiredSteps.every(step => updatedCompletedSteps.has(step));

        if (!hasAllSteps) {
            const missingSteps = requiredSteps.filter(step => !updatedCompletedSteps.has(step));
            notifications.generic.error(`Vui lòng hoàn thành đầy đủ cả 3 bước trước khi lưu! Còn thiếu: ${missingSteps.map(step => {
                switch (step) {
                    case 'trainer-selection': return 'Chọn PT';
                    case 'schedule-generation': return 'Tạo lịch tập';
                    case 'schedule-view': return 'Xem lịch tập';
                    default: return step;
                }
            }).join(', ')}`);
            return;
        }

        try {
            // Gọi API để cập nhật trạng thái thành HOAN_THANH
            const response = await api.post(`/api/package-workflow/complete-workflow/${chiTietGoiTapId}`);

            if (response.success) {
                // Xóa dữ liệu khỏi localStorage khi hoàn thành
                try {
                    localStorage.removeItem(`workflow-completed-steps-${chiTietGoiTapId}`);
                    localStorage.removeItem(`workflow-selected-pt-${chiTietGoiTapId}`);
                } catch (error) {
                    console.error('Error removing workflow data from localStorage:', error);
                }

                // Đánh dấu hoàn thành workflow
                setCurrentStep('completed');
                notifications.generic.success('Đã hoàn thành thiết lập gói tập! Tất cả 3 bước đã được lưu.');
                if (onComplete) {
                    onComplete();
                }
            } else {
                throw new Error(response.message || 'Không thể hoàn thành workflow');
            }
        } catch (error) {
            console.error('Error completing workflow:', error);
            notifications.generic.error('Không thể hoàn thành workflow: ' + (error as any)?.message);
        }
    };

    const handleBackToOverview = () => {
        setCurrentStep('overview');
        setSelectedPTId('');
        setCompletedSteps(new Set());
        // Xóa dữ liệu khỏi localStorage khi reset
        try {
            localStorage.removeItem(`workflow-completed-steps-${chiTietGoiTapId}`);
            localStorage.removeItem(`workflow-selected-pt-${chiTietGoiTapId}`);
        } catch (error) {
            console.error('Error removing workflow data from localStorage:', error);
        }
    };

    const handleBackToTrainerSelection = () => {
        setCurrentStep('trainer-selection');
        setSelectedPTId('');
        setCompletedSteps(new Set());
        // Xóa dữ liệu khỏi localStorage khi reset
        try {
            localStorage.removeItem(`workflow-completed-steps-${chiTietGoiTapId}`);
            localStorage.removeItem(`workflow-selected-pt-${chiTietGoiTapId}`);
        } catch (error) {
            console.error('Error removing workflow data from localStorage:', error);
        }
    };

    const handleBackToScheduleGeneration = () => {
        setCurrentStep('schedule-generation');
        // Không reset completedSteps vì bước 1 đã hoàn thành
    };

    const handleStepCompleted = (step: string) => {
        setCompletedSteps(prev => new Set([...prev, step]));
        notifications.generic.success(`Bước ${step === 'trainer-selection' ? '1' : step === 'schedule-generation' ? '2' : '3'} hoàn thành!`);
    };

    const renderStepIndicator = () => {
        const currentIndex = getCurrentStepIndex();

        return (
            <div className="workflow-steps">
                {steps.slice(0, -1).map((step, index) => {
                    const isCompleted = completedSteps.has(step.key);
                    const isActive = index === currentIndex;
                    const isAccessible = index === 0 || completedSteps.has(steps[index - 1].key);

                    return (
                        <div
                            key={step.key}
                            className="step-container"
                            onClick={() => handleStepClick(step.key)}
                            style={{
                                cursor: isAccessible ? 'pointer' : 'not-allowed',
                                opacity: isAccessible ? 1 : 0.5
                            }}
                        >
                            <div className={`step-indicator ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                                <span className="step-icon">{step.icon}</span>
                                <span className="step-number">{index + 1}</span>
                            </div>
                            <div className="step-label">
                                {step.label}
                                {isCompleted && <span className="completed-check"> ✓</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderOverview = () => {
        const requiredSteps = ['trainer-selection', 'schedule-generation', 'schedule-view'];
        const hasAllSteps = requiredSteps.every(step => completedSteps.has(step));
        const completedCount = completedSteps.size;

        return (
            <div className="workflow-overview">
                <div className="overview-instructions">
                    <p className="instruction-text">
                        💡 <strong>Hướng dẫn:</strong> Bấm vào icon "Chọn PT" để bắt đầu thiết lập gói tập
                    </p>
                    <div className="progress-info">
                        <p>Tiến độ: {completedCount}/3 bước đã hoàn thành</p>
                        {hasAllSteps && (
                            <div className="completion-ready">
                                <p className="ready-text">✅ Tất cả 3 bước đã hoàn thành! Bạn có thể lưu gói tập.</p>
                                <Button
                                    variant="primary"
                                    onClick={handleWorkflowComplete}
                                    className="save-button"
                                >
                                    Lưu gói tập
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'overview':
                return renderOverview();

            case 'trainer-selection':
                return (
                    <TrainerSelection
                        chiTietGoiTapId={chiTietGoiTapId}
                        onTrainerSelected={handleTrainerSelected}
                        onBack={handleBackToOverview}
                    />
                );

            case 'schedule-generation':
                return (
                    <ScheduleGeneration
                        chiTietGoiTapId={chiTietGoiTapId}
                        selectedPTId={selectedPTId}
                        onScheduleGenerated={handleScheduleGenerated}
                        onBack={handleBackToTrainerSelection}
                    />
                );

            case 'schedule-view':
                return (
                    <WorkoutScheduleView
                        chiTietGoiTapId={chiTietGoiTapId}
                        onComplete={handleWorkflowComplete}
                        onBack={handleBackToScheduleGeneration}
                        onStepCompleted={handleStepCompleted}
                    />
                );

            case 'completed':
                return (
                    <Card className="workflow-completed-card">
                        <div className="completion-content">
                            <div className="completion-icon">🎉</div>
                            <h2>Thiết lập hoàn tất!</h2>
                            <p>Bạn đã hoàn thành việc thiết lập gói tập. Lịch tập của bạn đã được tạo và sẵn sàng để bắt đầu.</p>
                            <div className="completion-actions">
                                <Button variant="primary" onClick={() => setCurrentStep('schedule-view')}>
                                    Xem lịch tập
                                </Button>
                                <Button variant="secondary" onClick={onComplete}>
                                    Về trang chủ
                                </Button>
                            </div>
                        </div>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`package-workflow-manager ${currentStep === 'overview' ? 'overview-mode' : ''}`}>
            {currentStep === 'overview' && (
                <div className="workflow-header">
                    <h1>Thiết lập gói tập</h1>
                    <p>Hoàn thành các bước sau để bắt đầu hành trình tập luyện của bạn</p>
                </div>
            )}

            {currentStep === 'overview' && renderStepIndicator()}

            <div className="workflow-content">
                {renderCurrentStep()}
            </div>
        </div>
    );
};

export default PackageWorkflowManager;
