import React, { useState } from 'react';
import { api } from '../services/api';

const TestAPI = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const testWorkflowStatus = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Test với registrationId cụ thể
            const registrationId = '68ef7369b91aa6838dad1efa';
            console.log('Testing API with registrationId:', registrationId);
            console.log('Token in localStorage:', localStorage.getItem('token'));

            const response = await api.get(`/package-workflow/workflow-status/${registrationId}`);
            console.log('API Response:', response);
            setResult(response);
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testAuth = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.get('/user/profile');
            console.log('Auth Response:', response);
            setResult(response);
        } catch (err) {
            console.error('Auth Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
            <h2>API Test Component</h2>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={testAuth}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    Test Auth
                </button>

                <button
                    onClick={testWorkflowStatus}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    Test Workflow Status
                </button>
            </div>

            {loading && <p>Loading...</p>}

            {error && (
                <div style={{
                    background: '#dc3545',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{
                    background: '#28a745',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    <strong>Success:</strong>
                    <pre style={{ marginTop: '10px', fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <h3>Debug Info:</h3>
                <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                <p><strong>User:</strong> {localStorage.getItem('user') ? 'Present' : 'Missing'}</p>
            </div>
        </div>
    );
};

export default TestAPI;
