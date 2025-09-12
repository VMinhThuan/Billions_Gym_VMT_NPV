import { useState } from 'react';
import Button from './Button';
import Card from './Card';

interface Field {
    name: string;
    label: string;
    type?: string;
}

interface EntityFormProps {
    title: string;
    fields: Field[];
    onClose: () => void;
    onSave: (data: Record<string, any>) => void;
}

const EntityForm = ({ title, fields, onClose, onSave }: EntityFormProps) => {
    const [formData, setFormData] = useState<Record<string, any>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <Card className="modal-content" onClick={(e) => e?.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <Button variant="ghost" size="small" onClick={onClose}>×</Button>
                </div>
                
                <form onSubmit={handleSubmit} className="entity-form">
                    {fields.map(field => (
                        <div key={field.name} className="form-group">
                            <label>{field.label}</label>
                            <input
                                type={field.type || 'text'}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="form-input"
                            />
                        </div>
                    ))}
                    
                    <div className="form-actions">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="primary">
                            Lưu
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EntityForm;
