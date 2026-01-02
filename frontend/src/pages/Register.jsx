import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, Phone, UserCircle } from 'lucide-react';

const Register = () => {
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
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao criar conta. Verifique os dados.');
        }
    };

    return (
        <div className="register-container animate-fade">
            <div className="glass register-card">
                <h1>Criar Conta</h1>
                <p className="subtitle">Junte-se à nossa plataforma de fitness</p>

                {success ? (
                    <div className="success-message">
                        Conta criada com sucesso! Redirecionando para o login...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-grid">
                            <div className="input-group">
                                <label><User size={16} /> Nome</label>
                                <input
                                    type="text"
                                    placeholder="Nome"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Apelido</label>
                                <input
                                    type="text"
                                    placeholder="Apelido"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label><UserCircle size={16} /> Username</label>
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
                            <label><Lock size={16} /> Senha</label>
                            <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Tipo de Conta</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="client">Cliente</option>
                                <option value="trainer">Personal Trainer</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary full-width">
                            <UserPlus size={20} /> Registar-me
                        </button>
                    </form>
                )}

                <p className="footer-text">
                    Já tem uma conta? <Link to="/login">Entre aqui</Link>
                </p>
            </div>

            <style>{`
        .register-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .register-card {
          width: 100%;
          max-width: 500px;
          padding: 2.5rem;
          text-align: center;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        h1 { margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
        .input-group { text-align: left; margin-bottom: 1.25rem; }
        .input-group label { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          margin-bottom: 0.5rem; 
          font-weight: 500;
          font-size: 0.9rem;
        }
        .input-group input, .input-group select {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .full-width { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
        .error-message { color: #ef4444; background: #fee2e2; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
        .success-message { color: #10b981; background: #d1fae5; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
        .footer-text { margin-top: 2rem; font-size: 0.9rem; color: var(--text-secondary); }
        .footer-text a { color: var(--accent-primary); text-decoration: none; font-weight: 600; }
      `}</style>
        </div>
    );
};

export default Register;
