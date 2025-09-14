import { useState } from 'react';
import { api, auth } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import './login.css';

interface LoginForm {
    identifier: string; // email or phone number
    matKhau: string;
}

const LoginPage = () => {
    const [form, setForm] = useState<LoginForm>({ identifier: '', matKhau: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Determine if identifier is email or phone number
            const isEmail = form.identifier.includes('@');
            const credentials = isEmail 
                ? { email: form.identifier, matKhau: form.matKhau }
                : { sdt: form.identifier, matKhau: form.matKhau };

            const response = await api.login(credentials);
            
            if (response.token) {
                // Redirect to admin dashboard
                window.location.href = '#/admin';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    // Redirect if already authenticated
    if (auth.isAuthenticated()) {
        window.location.href = '#/admin';
        return null;
    }

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <Card className="login-card">
                    <div className="login-header">
                        <h1>Billions Gym</h1>
                        <p>Đăng nhập vào hệ thống quản lý</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="identifier">Email hoặc Số điện thoại</label>
                            <input
                                id="identifier"
                                type="text"
                                value={form.identifier}
                                onChange={handleInputChange('identifier')}
                                placeholder="Nhập email hoặc số điện thoại"
                                required
                                disabled={isLoading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="matKhau">Mật khẩu</label>
                            <input
                                id="matKhau"
                                type="password"
                                value={form.matKhau}
                                onChange={handleInputChange('matKhau')}
                                placeholder="Nhập mật khẩu"
                                required
                                disabled={isLoading}
                                className="form-input"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            disabled={isLoading}
                            className="login-button"
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </form>

                    <div className="login-footer">
                        <p>Hệ thống quản lý Billions Fitness & Yoga</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;