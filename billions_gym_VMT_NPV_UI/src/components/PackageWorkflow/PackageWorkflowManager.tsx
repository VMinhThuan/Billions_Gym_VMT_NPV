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
    initialStep?: 'trainer-selection' | 'schedule-generation' | 'schedule-view';
    onComplete?: () => void;
}

type WorkflowStep = 'trainer-selection' | 'schedule-generation' | 'schedule-view' | 'completed';

const PackageWorkflowManager: React.FC<PackageWorkflowManagerProps> = ({
    chiTietGoiTapId,
    initialStep = 'trainer-selection',
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
        return steps.findIndex(step => step.key === currentStep);
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
                    <div key={step.key} className="step-container">
                        <div className={`step-indicator ${index <= currentIndex ? 'completed' : 'pending'} ${index === currentIndex ? 'active' : ''}`}>
                            <span className="step-icon">{step.icon}</span>
                            <span className="step-number">{index + 1}</span>
                        </div>
                        <div className="step-label">{step.label}</div>
                        {index < steps.length - 2 && (
                            <div className={`step-connector ${index < currentIndex ? 'completed' : 'pending'}`}></div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'trainer-selection':
                return (
                    <TrainerSelection
                        chiTietGoiTapId={chiTietGoiTapId}
                        onTrainerSelected={handleTrainerSelected}
                        onBack={() => {
                            if (onComplete) onComplete();
                        }}
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
        <div className="package-workflow-manager">
            <div className="workflow-header">
                <h1>Thiết lập gói tập</h1>
                <p>Hoàn thành các bước sau để bắt đầu hành trình tập luyện của bạn</p>
            </div>

            {currentStep !== 'completed' && renderStepIndicator()}

            <div className="workflow-content">
                {renderCurrentStep()}
            </div>
        </div>
    );
};

export default PackageWorkflowManager;
