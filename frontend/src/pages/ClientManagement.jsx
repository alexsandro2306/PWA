import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Calendar, MessageCircle, BarChart2, Plus, Bell, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/imageUtils';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [alertContent, setAlertContent] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/users/my-clients');
                setClients(res.data.data);
            } catch (err) {
                setError('Erro ao carregar seus clientes.');
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const handleSendAlert = async (e) => {
        e.preventDefault();
        try {
            await api.post('/messages/alert', {
                receiverId: selectedClient._id,
                content: alertContent
            });
            addNotification('success', `Alerta enviado para ${selectedClient.firstName}`);
            setShowAlertModal(false);
            setAlertContent('');
        } catch (err) {
            addNotification('error', 'Erro ao enviar alerta.');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const handleUnlinkClient = async (id) => {
        if (!window.confirm('Tem a certeza que deseja remover este cliente da sua lista?')) return;
        try {
            await api.patch(`/users/unlink-client/${id}`);
            addNotification('success', 'Cliente removido da sua lista.');
            setClients(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            addNotification('error', 'Erro ao desvincular cliente.');
        }
    };

    const filteredClients = clients.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Carregando clientes...</div>;

    return (
        <div className="client-mgmt animate-fade">
            <header className="page-header">
                <div className="header-content">
                    <h1>Meus Clientes</h1>
                    <p>Gira os planos e acompanhe o progresso dos seus atletas.</p>
                </div>
                <div className="header-actions">
                    <div className="glass search-bar-mini">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Procurar atleta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/trainer/clients/add')}>
                        <Plus size={20} /> Registar Recruta
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="client-grid">
                {filteredClients.length === 0 ? (
                    <p className="empty-msg glass">Nenhum atleta encontrado.</p>
                ) : (
                    filteredClients.map(client => (
                        <div key={client._id} className="glass client-card">
                            <div className="client-avatar">
                                {client.avatar ? (
                                    <img
                                        src={getAvatarUrl(client.avatar)}
                                        alt={client.firstName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={32} />
                                )}
                            </div>
                            <div className="client-details">
                                <h3>{client.firstName} {client.lastName}</h3>
                                <p>@{client.username}</p>
                            </div>
                            <div className="client-actions">
                                <button
                                    onClick={() => navigate(`/trainer/plans/${client._id}`)}
                                    className="action-btn"
                                    title="Plano de Treino"
                                >
                                    <Calendar size={20} />
                                </button>
                                <button
                                    onClick={() => navigate(`/chat/${client._id}`)}
                                    className="action-btn"
                                    title="Mensagens"
                                >
                                    <MessageCircle size={20} />
                                </button>
                                <button
                                    onClick={() => { setSelectedClient(client); setShowAlertModal(true); }}
                                    className="action-btn"
                                    title="Enviar Alerta"
                                >
                                    <Bell size={20} />
                                </button>
                                <button
                                    onClick={() => navigate(`/trainer/dashboard/${client._id}`)}
                                    className="action-btn"
                                    title="Estatísticas/Dashboard"
                                >
                                    <BarChart2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleUnlinkClient(client._id)}
                                    className="action-btn delete"
                                    title="Remover Atleta"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ✅ MODAL MELHORADO */}
            {showAlertModal && (
                <>
                    <div className="overlay" onClick={() => setShowAlertModal(false)} />
                    <div className="glass modal-alert">
                        <div className="modal-head">
                            <div className="alert-header-content">
                                <div className="modal-icon">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3>Enviar Alerta</h3>
                                    <p>Para {selectedClient?.firstName} {selectedClient?.lastName}</p>
                                </div>
                            </div>
                            <button className="btn-close-modal" onClick={() => setShowAlertModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendAlert}>
                            <div className="input-mod">
                                <label>Mensagem</label>
                                <textarea
                                    placeholder="Ex: Não registou o treino de hoje. Tudo bem?"
                                    value={alertContent}
                                    onChange={(e) => setAlertContent(e.target.value)}
                                    required
                                    rows="5"
                                />
                            </div>
                            <div className="modal-btns">
                                <button type="button" onClick={() => setShowAlertModal(false)} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-send">
                                    <Bell size={18} />
                                    Enviar Alerta
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            <style>{`
                .client-mgmt { display: flex; flex-direction: column; gap: 2rem; }
                .page-header { display: flex; justify-content: space-between; align-items: center; }
                .client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .client-card { padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
                .client-avatar { width: 64px; height: 64px; background: var(--bg-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); border: 2px solid var(--border-color); overflow: hidden; }
                .client-details h3 { margin: 0; font-size: 1.25rem; }
                .client-details p { color: var(--text-secondary); margin: 0; }
                .client-actions { display: flex; gap: 0.75rem; width: 100%; border-top: 1px solid var(--border-color); padding-top: 1rem; justify-content: center; }
                .action-btn { background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; color: var(--text-secondary); transition: var(--transition); }
                .action-btn:hover { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
                .empty-msg { padding: 3rem; text-align: center; color: var(--text-secondary); grid-column: 1 / -1; }
                
                .header-actions { display: flex; align-items: center; gap: 1rem; }
                .search-bar-mini { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid var(--border-color); width: 250px; }
                .search-bar-mini input { background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 0.9rem; width: 100%; }
                .action-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

                /* ✅ MODAL MELHORADO */
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                }

                .modal-alert {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 500px;
                    z-index: 1000;
                    padding: 0;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, -45%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }

                .modal-head {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .alert-header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .modal-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }

                .modal-head h3 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.25rem;
                }

                .modal-head p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .btn-close-modal {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .btn-close-modal:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                }

                .modal-alert form {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .input-mod {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-mod label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .input-mod textarea {
                    padding: 0.875rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-family: inherit;
                    font-size: 0.95rem;
                    resize: vertical;
                    min-height: 100px;
                    transition: all 0.3s;
                }

                .input-mod textarea:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .modal-btns {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-cancel, .btn-send {
                    flex: 1;
                    padding: 0.875rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-cancel {
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }

                .btn-cancel:hover {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .btn-send {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                }

                .btn-send:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
                }

                @media (max-width: 768px) {
                    .modal-alert {
                        width: 95%;
                    }
                    
                    .alert-header-content {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClientManagement;