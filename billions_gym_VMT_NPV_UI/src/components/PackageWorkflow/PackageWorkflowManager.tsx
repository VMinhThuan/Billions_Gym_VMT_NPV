import React, { useState, useEffect } from 'react';
import TrainerSelection from './TrainerSelection';
import ScheduleGeneration from './ScheduleGeneration';
import WorkoutScheduleView from './WorkoutScheduleView';
import Card from '../Card';
import Button from '../Button';
import { useCrudNotifications } from '../../hooks/useNotification';
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
    const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
    const [selectedPTId, setSelectedPTId] = useState<string>('');
    const notifications = useCrudNotifications();

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
        setCurrentStep('schedule-generation');
    };

    const handleScheduleGenerated = () => {
        setCurrentStep('schedule-view');
    };

    const handleWorkflowComplete = () => {
        setCurrentStep('completed');
        notifications.generic.success('Đã hoàn thành thiết lập gói tập!');
        if (onComplete) {
            onComplete();
        }
    };

    const handleBackToOverview = () => {
        setCurrentStep('overview');
        setSelectedPTId('');
    };

    const handleBackToTrainerSelection = () => {
        setCurrentStep('trainer-selection');
        setSelectedPTId('');
    };

    const handleBackToScheduleGeneration = () => {
        setCurrentStep('schedule-generation');
    };

    const renderStepIndicator = () => {
        const currentIndex = getCurrentStepIndex();

        return (
            <div className="workflow-steps">
                {steps.slice(0, -1).map((step, index) => (
                    <div
                        key={step.key}
                        className="step-container"
                        onClick={() => handleStepClick(step.key)}
                        style={{ cursor: step.key === 'trainer-selection' ? 'pointer' : 'default' }}
                    >
                        <div className={`step-indicator ${index <= currentIndex ? 'completed' : 'pending'} ${index === currentIndex ? 'active' : ''}`}>
                            <span className="step-icon">{step.icon}</span>
                            <span className="step-number">{index + 1}</span>
                        </div>
                        <div className="step-label">{step.label}</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderOverview = () => {
        return (
            <div className="workflow-overview">
                <div className="overview-instructions">
                    <p className="instruction-text">
                        💡 <strong>Hướng dẫn:</strong> Bấm vào icon "Chọn PT" để bắt đầu thiết lập gói tập
                    </p>
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
