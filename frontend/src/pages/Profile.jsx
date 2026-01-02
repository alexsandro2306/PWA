import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Camera, Save, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import QRCodeSection from '../components/QRCodeSection';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { addNotification } = useNotifications();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Change Trainer States
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [trainers, setTrainers] = useState([]);
    const [changeRequest, setChangeRequest] = useState({ newTrainerId: '', reason: '' });
    const [requestLoading, setRequestLoading] = useState(false);

    // Change Password States
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                const data = res.data.user;
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    avatar: data.avatar || ''
                });
            } catch (err) {
                addNotification('error', 'Erro ao carregar perfil');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch('/users/me', formData);
            updateUser(res.data.user);
            addNotification('success', 'Perfil atualizado com sucesso');
        } catch (err) {
            addNotification('error', 'Erro ao atualizar perfil');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('avatar', file);

        setUploading(true);
        try {
            const res = await api.post('/upload/avatar', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAvatarUrl = res.data.avatarUrl;
            setFormData({ ...formData, avatar: newAvatarUrl });
            updateUser({ avatar: newAvatarUrl });
            addNotification('success', 'Avatar atualizado!');
        } catch (err) {
            addNotification('error', 'Erro no upload do avatar');
        } finally {
            setUploading(false);
        }
    };

    const loadTrainersForChange = async () => {
        try {
            const res = await api.get('/users/trainers');
            setTrainers(res.data.data);
            setShowChangeModal(true);
        } catch (err) {
            addNotification('error', 'Erro ao carregar lista de trainers.');
        }
    };

    const handleSubmitChangeRequest = async (e) => {
        e.preventDefault();
        if (!changeRequest.newTrainerId || !changeRequest.reason) {
            addNotification('warning', 'Preencha todos os campos.');
            return;
        }

        setRequestLoading(true);
        try {
            await api.post('/users/request-trainer-change', changeRequest);
            addNotification('success', 'Pedido enviado com sucesso! Aguarde aprovação.');
            setShowChangeModal(false);
            setChangeRequest({ newTrainerId: '', reason: '' });
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao enviar pedido.');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addNotification('error', 'As passwords não coincidem');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            addNotification('error', 'A nova password deve ter pelo menos 6 caracteres');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.patch('/users/me/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            addNotification('success', 'Password alterada com sucesso!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordSection(false);
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao alterar password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (loading) return <div>Carregando perfil...</div>;

    return (
        <div className="profile-container animate-fade">
            <header className="page-header">
                <h1>Meu Perfil</h1>
                <p>Gira as tuas informações pessoais.</p>
            </header>

            <div className="profile-content">
                <section className="glass profile-info">
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            {formData.avatar ? (
                                <img src={`http://localhost:5000${formData.avatar}`} alt="Avatar" />
                            ) : (
                                <div className="avatar-placeholder"><User size={48} /></div>
                            )}
                            <label className="upload-label">
                                <Camera size={20} />
                                <input type="file" onChange={handleAvatarUpload} disabled={uploading} />
                            </label>
                        </div>
                        <h3>{user.username}</h3>
                        <span className="role-badge">{user.role}</span>

                        {/* Botão Mudar Trainer */}
                        {user.role === 'client' && (
                            <button
                                className="btn-change-trainer-new"
                                onClick={loadTrainersForChange}
                            >
                                <RefreshCw size={16} />
                                <span>Mudar de Trainer</span>
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Primeiro Nome</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Apelido</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Telemóvel</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn-primary full-width">
                            <Save size={20} /> Salvar Alterações
                        </button>
                    </form>

                    {/* Password Change Section */}
                    <div className="password-section">
                        <button
                            className="btn-text-expand"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            <Lock size={18} />
                            Alterar Password
                            <span className={`arrow ${showPasswordSection ? 'up' : 'down'}`}>▼</span>
                        </button>

                        {showPasswordSection && (
                            <form onSubmit={handleChangePassword} className="password-form">
                                <div className="input-group">
                                    <label>Password Atual</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => togglePasswordVisibility('current')}
                                        >
                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Nova Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <small>Mínimo de 6 caracteres</small>
                                </div>

                                <div className="input-group">
                                    <label>Confirmar Nova Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary full-width"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? 'A alterar...' : 'Alterar Password'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* QR Code Section */}
                    <QRCodeSection user={user} addNotification={addNotification} />
                </section>
            </div>

            {/* Modal Mudar Trainer */}
            {showChangeModal && (
                <div className="modal-overlay">
                    <div className="glass modal-content animate-slide-up">
                        <h3>Solicitar Mudança de Trainer</h3>
                        <p className="modal-desc">Escolha o novo profissional e justifique o pedido. A alteração requer aprovação do administrador.</p>

                        <form onSubmit={handleSubmitChangeRequest}>
                            <div className="input-group">
                                <label>Novo Personal Trainer</label>
                                <select
                                    value={changeRequest.newTrainerId}
                                    onChange={(e) => setChangeRequest({ ...changeRequest, newTrainerId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um trainer...</option>
                                    {trainers.map(trainer => (
                                        <option key={trainer._id} value={trainer._id}>
                                            {trainer.firstName} {trainer.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Motivo da Troca</label>
                                <textarea
                                    placeholder="Ex: Horários incompatíveis..."
                                    value={changeRequest.reason}
                                    onChange={(e) => setChangeRequest({ ...changeRequest, reason: e.target.value })}
                                    required
                                    rows="3"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowChangeModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={requestLoading}>
                                    {requestLoading ? 'A enviar...' : 'Enviar Pedido'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .profile-container { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 2rem; 
                }
                
                .profile-content { 
                    display: flex; 
                    justify-content: center; 
                }
                
                .profile-info { 
                    padding: 2.5rem; 
                    max-width: 600px; 
                    width: 100%; 
                }
                
                .avatar-section { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 1rem; 
                    margin-bottom: 2.5rem; 
                }
                
                .avatar-wrapper { 
                    position: relative; 
                    width: 120px; 
                    height: 120px; 
                    border-radius: 50%; 
                    background: var(--bg-primary); 
                    border: 3px solid var(--accent-primary); 
                    overflow: hidden; 
                }
                
                .avatar-wrapper img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                }
                
                .avatar-placeholder { 
                    width: 100%; 
                    height: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: var(--text-secondary); 
                }
                
                .upload-label { 
                    position: absolute; 
                    bottom: 0; 
                    left: 0; 
                    right: 0; 
                    height: 40px; 
                    background: rgba(0,0,0,0.5); 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    transition: 0.3s; 
                }
                
                .upload-label:hover { 
                    background: rgba(0,0,0,0.7); 
                }
                
                .upload-label input { 
                    display: none; 
                }
                
                .role-badge { 
                    background: var(--accent-primary); 
                    color: white; 
                    padding: 0.2rem 0.8rem; 
                    border-radius: 1rem; 
                    font-size: 0.75rem; 
                    text-transform: uppercase; 
                    font-weight: 700; 
                }
                
                /* Botão Mudar Trainer - Simples */
                .btn-change-trainer-new {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: 1.5px solid var(--accent-primary);
                    border-radius: 0.5rem;
                    color: var(--accent-primary);
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-change-trainer-new:hover {
                    background: var(--accent-primary);
                    color: white;
                    transform: translateY(-1px);
                }

                .btn-change-trainer-new:active {
                    transform: translateY(0);
                }
                
                .form-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1rem; 
                }
                
                .input-group { 
                    margin-bottom: 1.5rem; 
                    text-align: left; 
                }
                
                .input-group label { 
                    display: block; 
                    margin-bottom: 0.5rem; 
                    font-weight: 600; 
                    font-size: 0.9rem; 
                }
                
                .input-group input, 
                .input-group select, 
                .input-group textarea { 
                    width: 100%; 
                    padding: 0.75rem; 
                    border-radius: 0.5rem; 
                    border: 1px solid var(--border-color); 
                    background: var(--bg-primary); 
                    color: var(--text-primary); 
                    resize: vertical;
                }
                
                .input-group small {
                    display: block;
                    margin-top: 0.25rem;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                }

                /* Password Section */
                .password-section {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border-color);
                }

                .btn-text-expand {
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1rem;
                    font-weight: 600;
                    padding: 0.75rem;
                    width: 100%;
                    justify-content: space-between;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }

                .btn-text-expand:hover {
                    background: var(--bg-primary);
                }

                .arrow {
                    font-size: 0.75rem;
                    transition: transform 0.2s;
                }

                .arrow.up {
                    transform: rotate(180deg);
                }

                .password-form {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: var(--bg-primary);
                    border-radius: 0.75rem;
                    animation: slideDown 0.3s;
                }

                .password-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .toggle-password {
                    position: absolute;
                    right: 0.75rem;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                }

                .toggle-password:hover {
                    color: var(--text-primary);
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        max-height: 500px;
                    }
                }

                .modal-overlay { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    right: 0; 
                    bottom: 0; 
                    background: rgba(0,0,0,0.6); 
                    backdrop-filter: blur(4px); 
                    z-index: 999; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                }
                
                .modal-content { 
                    background: var(--bg-secondary); 
                    padding: 2rem; 
                    border-radius: 1rem; 
                    width: 90%; 
                    max-width: 500px; 
                    border: 1px solid var(--border-color); 
                }
                
                .modal-desc { 
                    margin-bottom: 1.5rem; 
                    font-size: 0.9rem; 
                    color: var(--text-secondary); 
                }
                
                .modal-actions { 
                    display: flex; 
                    justify-content: flex-end; 
                    gap: 1rem; 
                    margin-top: 1rem; 
                }

                /* ✅ Botão Cancelar Vermelho */
                .btn-cancel {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #ef4444;
                    color: white;
                    border: none;
                    font-size: 0.95rem;
                }

                .btn-cancel:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .btn-cancel:active {
                    transform: translateY(0);
                }
                
                @media (max-width: 768px) {
                    .form-grid { 
                        grid-template-columns: 1fr; 
                    }
                }
            `}</style>
        </div>
    );
};

export default Profile;