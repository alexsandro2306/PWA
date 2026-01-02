import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const TrainerRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/requests/trainer');
            setRequests(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        if (!window.confirm('Aceitar este cliente?')) return;

        try {
            setProcessing(requestId);
            await api.patch(`/requests/${requestId}/accept`);

            // Remover da lista
            setRequests(requests.filter(r => r._id !== requestId));

            alert('✅ Cliente aceite com sucesso!');
        } catch (error) {
            console.error('Erro ao aceitar:', error);
            alert('❌ Erro ao aceitar pedido: ' + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Rejeitar este pedido?')) return;

        try {
            setProcessing(requestId);
            await api.delete(`/requests/${requestId}/reject`);

            // Remover da lista
            setRequests(requests.filter(r => r._id !== requestId));

            alert('Pedido rejeitado');
        } catch (error) {
            console.error('Erro ao rejeitar:', error);
            alert('❌ Erro ao rejeitar pedido: ' + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="trainer-requests-page">
            <div className="page-header">
                <div className="header-content">
                    <AlertCircle size={32} />
                    <div>
                        <h1>Pedidos de Clientes</h1>
                        <p>Gere os pedidos de novos clientes que querem ser treinados por ti</p>
                    </div>
                </div>
                {requests.length > 0 && (
                    <div className="badge-count">
                        {requests.length} {requests.length === 1 ? 'pedido' : 'pedidos'}
                    </div>
                )}
            </div>

            <div className="requests-container">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>A carregar pedidos...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <Users size={64} />
                        <h3>Nenhum pedido pendente</h3>
                        <p>Quando clientes enviarem pedidos para seres o trainer deles, aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map((request) => (
                            <div key={request._id} className="request-card">
                                <div className="card-header">
                                    <div className="client-avatar">
                                        <Users size={32} />
                                    </div>
                                    <div className="client-info">
                                        <h3>{request.client.name} {request.client.surname}</h3>
                                        <p className="username">@{request.client.username}</p>
                                    </div>
                                    <div className="status-badge pending">
                                        Pendente
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="info-section">
                                        <h4>Informações de Contacto</h4>
                                        <div className="contact-info">
                                            <div className="info-item">
                                                <Mail size={16} />
                                                <span>{request.client.email}</span>
                                            </div>
                                            {request.client.phone && (
                                                <div className="info-item">
                                                    <Phone size={16} />
                                                    <span>{request.client.phone}</span>
                                                </div>
                                            )}
                                            <div className="info-item">
                                                <Calendar size={16} />
                                                <span>Pedido em: {formatDate(request.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {request.reason && (
                                        <div className="info-section">
                                            <h4>Motivo do Pedido</h4>
                                            <p className="reason">{request.reason}</p>
                                        </div>
                                    )}

                                    {request.currentTrainer && (
                                        <div className="info-section warning">
                                            <h4>⚠️ Atenção</h4>
                                            <p>
                                                Este cliente já tem um trainer: <strong>{request.currentTrainer.name} {request.currentTrainer.surname}</strong>
                                                <br />
                                                <small>Se aceitares, o cliente será transferido para ti.</small>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleReject(request._id)}
                                        disabled={processing === request._id}
                                    >
                                        <XCircle size={18} />
                                        {processing === request._id ? 'A processar...' : 'Rejeitar'}
                                    </button>
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleAccept(request._id)}
                                        disabled={processing === request._id}
                                    >
                                        <CheckCircle size={18} />
                                        {processing === request._id ? 'A processar...' : 'Aceitar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .trainer-requests-page {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .header-content svg {
                    color: var(--accent-primary);
                }

                .page-header h1 {
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                    font-size: 2rem;
                }

                .page-header p {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }

                .badge-count {
                    background: var(--accent-primary);
                    color: white;
                    padding: 0.5rem 1.5rem;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .requests-container {
                    min-height: 400px;
                }

                /* Loading */
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    color: var(--text-secondary);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--glass-bg);
                    border-top-color: var(--accent-primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-secondary);
                }

                .empty-state svg {
                    margin-bottom: 1.5rem;
                    opacity: 0.5;
                }

                .empty-state h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }

                /* Requests Grid */
                .requests-grid {
                    display: grid;
                    gap: 1.5rem;
                }

                .request-card {
                    background: var(--glass-bg);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }

                .request-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .client-avatar {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .client-info {
                    flex: 1;
                }

                .client-info h3 {
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                    font-size: 1.2rem;
                }

                .username {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .status-badge {
                    padding: 0.4rem 1rem;
                    border-radius: 50px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .status-badge.pending {
                    background: rgba(251, 191, 36, 0.2);
                    color: #fbbf24;
                    border: 1px solid rgba(251, 191, 36, 0.3);
                }

                .card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    margin-bottom: 1.5rem;
                }

                .info-section h4 {
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .contact-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }

                .info-item svg {
                    color: var(--accent-primary);
                }

                .reason {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-style: italic;
                }

                .info-section.warning {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 1rem;
                    border-radius: 0.5rem;
                }

                .info-section.warning h4 {
                    color: #ef4444;
                    margin-bottom: 0.5rem;
                }

                .info-section.warning p {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .info-section.warning small {
                    font-size: 0.85rem;
                    opacity: 0.8;
                }

                .card-actions {
                    display: flex;
                    gap: 1rem;
                }

                .card-actions button {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.85rem 1.5rem;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.95rem;
                }

                .btn-reject {
                    background: transparent;
                    color: #ef4444;
                    border: 2px solid #ef4444;
                }

                .btn-reject:hover:not(:disabled) {
                    background: #ef4444;
                    color: white;
                }

                .btn-accept {
                    background: var(--accent-primary);
                    color: white;
                }

                .btn-accept:hover:not(:disabled) {
                    background: var(--accent-secondary);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
                }

                .card-actions button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .trainer-requests-page {
                        padding: 1rem;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .card-header {
                        flex-wrap: wrap;
                    }

                    .card-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default TrainerRequests;