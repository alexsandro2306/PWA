import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, X, ClipboardList, User, MoveRight } from 'lucide-react';

const RequestManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/requests/pending');
            setRequests(res.data.data || []);
        } catch (err) {
            setError('Falha ao carregar pedidos de alteração.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.patch(`/admin/requests/${id}`, { action });
            fetchRequests();
        } catch (err) {
            alert(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} pedido.`);
        }
    };

    if (loading) return <div>Carregando pedidos...</div>;

    return (
        <div className="request-mgmt animate-fade">
            <header className="section-header">
                <h2>Pedidos de Alteração</h2>
                <p>Analise os pedidos dos clientes para mudar de Personal Trainer.</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="request-list">
                {requests.length === 0 ? (
                    <div className="glass empty-card">
                        <ClipboardList size={48} color="var(--text-secondary)" />
                        <p>Nenhum pedido pendente.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req._id} className="glass request-card">
                            <div className="client-info">
                                <div className="avatar"><User size={24} /></div>
                                <div>
                                    <h4>{req.client?.firstName} {req.client?.lastName}</h4>
                                    <span>Solicitou mudança</span>
                                </div>
                            </div>

                            <div className="trainer-change">
                                <div className="trainer-box from">
                                    <span className="label">Atual</span>
                                    <p>{req.currentTrainer?.firstName || 'Nenhum'}</p>
                                </div>
                                <MoveRight size={20} color="var(--accent-primary)" />
                                <div className="trainer-box to">
                                    <span className="label">Novo</span>
                                    <p>{req.newTrainer?.firstName || 'A definir'}</p>
                                </div>
                            </div>

                            <div className="request-reason">
                                <strong>Motivo:</strong>
                                <p>{req.reason}</p>
                            </div>

                            <div className="actions">
                                <button
                                    onClick={() => handleAction(req._id, 'approve')}
                                    className="btn-icon approve"
                                    title="Aprovar Mudança"
                                >
                                    <Check size={20} /> Aprovar
                                </button>
                                <button
                                    onClick={() => handleAction(req._id, 'reject')}
                                    className="btn-icon reject"
                                    title="Rejeitar Mudança"
                                >
                                    <X size={20} /> Rejeitar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
        .request-mgmt { display: flex; flex-direction: column; gap: 2rem; }
        .section-header h2 { margin-bottom: 0.25rem; }
        .section-header p { color: var(--text-secondary); }
        .request-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .request-card { padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
        .empty-card { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary); }
        .client-info { display: flex; align-items: center; gap: 1.25rem; min-width: 200px; }
        .avatar { width: 48px; height: 48px; background: var(--bg-primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); }
        .client-info h4 { margin: 0; font-size: 1.1rem; }
        .client-info span { font-size: 0.85rem; color: var(--text-secondary); }
        .trainer-change { display: flex; align-items: center; gap: 2rem; flex: 1; justify-content: center; }
        .trainer-box { display: flex; flex-direction: column; align-items: center; }
        .trainer-box .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 0.25rem; }
        .trainer-box p { font-weight: 600; margin: 0; }
        .request-reason { padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; border-left: 4px solid var(--accent-primary); font-size: 0.9rem; }
        .request-reason strong { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.25rem; }
        .request-reason p { margin: 0; color: var(--text-primary); font-style: italic; }
        .actions { display: flex; gap: 1rem; }
        .btn-icon { background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0.6rem 1.2rem; border-radius: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition); color: var(--text-primary); font-weight: 500; font-size: 0.9rem; }
        .btn-icon.approve:hover { background: #10b981; color: white; border-color: #10b981; }
        .btn-icon.reject:hover { background: #ef4444; color: white; border-color: #ef4444; }
      `}</style>
        </div>
    );
};

export default RequestManagement;
