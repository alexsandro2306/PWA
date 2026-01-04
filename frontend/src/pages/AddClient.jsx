import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, Phone, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const AddClient = () => {
    const { user } = useAuth(); // ← IMPORTANTE: Pegar ID do trainer logado
    const { addNotification } = useNotifications();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'client',
        phone: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // ✅ INCLUIR O ID DO TRAINER NA CRIAÇÃO
            const clientData = {
                ...formData,
                trainer: user.id || user._id // ← ASSOCIAÇÃO AUTOMÁTICA
            };

            const response = await api.post('/auth/register', clientData);

            console.log('✅ Cliente criado e associado:', response.data);

            setSuccess(true);
            addNotification('success', `Cliente ${formData.firstName} registado e associado a ti!`);

            setTimeout(() => navigate('/trainer/clients'), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Erro ao registar cliente.';
            setError(errorMsg);
            addNotification('error', errorMsg);
        }
    };

    return (
        <div className="add-client-container animate-fade">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-text">
                    <h1>Registar Novo Cliente</h1>
                    <p>Crie uma conta para o seu novo atleta. Ele ficará automaticamente associado a ti.</p>
                </div>
            </header>

            <div className="glass form-card">
                {success ? (
                    <div className="success-message">
                        ✅ Cliente registado com sucesso e já associado à tua lista!
                        <br />
                        Redirecionando...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="info-box">
                            <Shield size={20} />
                            <p>
                                <strong>Nota:</strong> Este cliente será automaticamente associado a ti e
                                receberá as credenciais de acesso. Ele poderá alterar a senha no primeiro login.
                            </p>
                        </div>

                        <div className="form-grid">
                            <div className="input-group">
                                <label><User size={16} /> Nome</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Apelido</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Silva"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label><Shield size={16} /> Username</label>
                            <input
                                type="text"
                                placeholder="Ex: joao_silva"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><Mail size={16} /> E-mail</label>
                            <input
                                type="email"
                                placeholder="Ex: joao@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><Phone size={16} /> Telemóvel (Opcional)</label>
                            <input
                                type="tel"
                                placeholder="+351 9xx xxx xxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label><Lock size={16} /> Senha Temporária</label>
                            <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                            <small className="helper-text">
                                💡 O cliente poderá alterar esta senha após o primeiro login.
                            </small>
                        </div>

                        <button type="submit" className="btn-primary full-width">
                            <UserPlus size={20} /> Registar e Associar Cliente
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                .add-client-container { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 2rem; 
                    max-width: 600px; 
                    margin: 0 auto; 
                }
                
                .page-header { 
                    display: flex; 
                    align-items: center; 
                    gap: 1.5rem; 
                }
                
                .btn-back { 
                    background: var(--glass-bg); 
                    border: 1px solid var(--border-color); 
                    padding: 0.5rem; 
                    border-radius: 0.5rem; 
                    cursor: pointer; 
                    color: var(--text-primary); 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition);
                }
                
                .btn-back:hover {
                    background: var(--accent-primary);
                    color: white;
                }
                
                .header-text p {
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                }
                
                .form-card { 
                    padding: 2.5rem; 
                }
                
                .info-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 1rem;
                    border-radius: 0.75rem;
                    margin-bottom: 2rem;
                }
                
                .info-box svg {
                    color: var(--accent-primary);
                    flex-shrink: 0;
                    margin-top: 0.2rem;
                }
                
                .info-box p {
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: var(--text-primary);
                }
                
                .form-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1rem; 
                }
                
                .input-group { 
                    text-align: left; 
                    margin-bottom: 1.25rem; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.5rem; 
                }
                
                .input-group label { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    font-weight: 600; 
                    font-size: 0.9rem; 
                }
                
                .input-group input { 
                    padding: 0.75rem; 
                    border-radius: 0.5rem; 
                    border: 1px solid var(--border-color); 
                    background: var(--bg-primary); 
                    color: var(--text-primary);
                    transition: var(--transition);
                }
                
                .input-group input:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .helper-text {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }
                
                .full-width { 
                    width: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 0.5rem; 
                    margin-top: 1rem; 
                }
                
                .error-message { 
                    color: #ef4444; 
                    background: #fee2e2; 
                    padding: 0.75rem; 
                    border-radius: 0.5rem; 
                    margin-bottom: 1.5rem; 
                    font-size: 0.9rem; 
                }
                
                .success-message { 
                    color: #10b981; 
                    background: #d1fae5; 
                    padding: 1.5rem; 
                    border-radius: 0.5rem; 
                    text-align: center;
                    line-height: 1.6;
                    font-weight: 500;
                }

                @media (max-width: 600px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddClient;