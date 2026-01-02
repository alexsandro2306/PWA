import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email/username, 2: nova password, 3: sucesso
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Identificação
    const [identifier, setIdentifier] = useState('');

    // Step 2: Nova Password
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Verificar se utilizador existe
    const handleVerifyUser = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/verify-user', { identifier });

            if (res.data.success) {
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Utilizador não encontrado');
        } finally {
            setLoading(false);
        }
    };

    // Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('As passwords não coincidem');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('A password deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                identifier,
                newPassword: passwordData.newPassword
            });

            setStep(3);

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao redefinir password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container animate-fade">
            <div className="glass login-card">
                <h1>Fitness Platform</h1>
                <p className="subtitle">
                    {step === 1 && 'Recuperar Password'}
                    {step === 2 && 'Nova Password'}
                    {step === 3 && 'Password Redefinida!'}
                </p>

                {error && <div className="error-message">{error}</div>}

                {/* Step 1: Identificação */}
                {step === 1 && (
                    <form onSubmit={handleVerifyUser}>
                        <div className="input-group">
                            <label>Email ou Username</label>
                            <input
                                type="text"
                                placeholder="seu-email@exemplo.com ou username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary full-width"
                            disabled={loading}
                        >
                            <Mail size={20} />
                            {loading ? 'A verificar...' : 'Continuar'}
                        </button>
                    </form>
                )}

                {/* Step 2: Nova Password */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="input-group">
                            <label>Nova Password</label>
                            <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value
                                })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirmar Password</label>
                            <input
                                type="password"
                                placeholder="Repita a password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.target.value
                                })}
                                required
                            />
                        </div>

                        <div className="button-group">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setStep(1)}
                                disabled={loading}
                            >
                                <ArrowLeft size={18} />
                                Voltar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                <Lock size={18} />
                                {loading ? 'A redefinir...' : 'Redefinir'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Sucesso */}
                {step === 3 && (
                    <div className="success-state">
                        <div className="success-icon-wrapper">
                            <CheckCircle size={64} />
                        </div>
                        <h2>Sucesso!</h2>
                        <p>Password alterada com sucesso.</p>
                        <p className="redirect-text">A redirecionar para o login...</p>
                    </div>
                )}

                {/* Footer */}
                <p className="footer-text">
                    {step !== 3 && (
                        <Link to="/login">
                            <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Voltar ao Login
                        </Link>
                    )}
                </p>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 2rem;
                }
                
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    padding: 2.5rem;
                    text-align: center;
                }
                
                h1 { 
                    margin-bottom: 0.5rem; 
                }
                
                .subtitle { 
                    color: var(--text-secondary); 
                    margin-bottom: 2rem; 
                }
                
                .input-group { 
                    text-align: left; 
                    margin-bottom: 1.5rem; 
                }
                
                .input-group label { 
                    display: block; 
                    margin-bottom: 0.5rem; 
                    font-weight: 500; 
                }
                
                .input-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .input-group input:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                }
                
                .full-width { 
                    width: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 0.5rem; 
                    margin-top: 1rem; 
                }

                .button-group {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .btn-primary, .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-primary {
                    flex: 1;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                }

                .btn-secondary {
                    flex: 0 0 auto;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    padding: 0.75rem 1rem;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }

                .btn-secondary:hover:not(:disabled) {
                    background: var(--bg-primary);
                }

                .btn-primary:disabled, .btn-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .error-message { 
                    color: #ef4444; 
                    background: #fee2e2; 
                    padding: 0.75rem; 
                    border-radius: 0.5rem; 
                    margin-bottom: 1.5rem; 
                    font-size: 0.9rem; 
                }

                .success-state {
                    padding: 2rem 0;
                    text-align: center;
                }

                .success-icon-wrapper {
                    color: #10b981;
                    margin-bottom: 1.5rem;
                    animation: scaleIn 0.5s;
                    display: flex;
                    justify-content: center;
                }

                .success-state h2 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.5rem;
                }

                .success-state p {
                    color: var(--text-secondary);
                    margin: 0.5rem 0;
                }

                .redirect-text {
                    color: var(--accent-primary) !important;
                    font-weight: 600;
                    margin-top: 1.5rem !important;
                    animation: pulse 1.5s infinite;
                }
                
                .footer-text { 
                    margin-top: 2rem; 
                    font-size: 0.9rem; 
                    color: var(--text-secondary); 
                }
                
                .footer-text a { 
                    color: var(--accent-primary); 
                    text-decoration: none; 
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                }

                .footer-text a:hover {
                    text-decoration: underline;
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                @media (max-width: 480px) {
                    .login-card {
                        padding: 2rem 1.5rem;
                    }

                    .button-group {
                        flex-direction: column;
                    }

                    .btn-secondary {
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;