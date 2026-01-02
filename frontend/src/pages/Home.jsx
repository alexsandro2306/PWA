import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Activity,
    Calendar,
    TrendingUp,
    AlertCircle,
    MessageCircle,
    Users,
    UserCheck,
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Bell,
    UserPlus,
    Search,
    X
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAvatarUrl } from '../utils/imageUtils';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <div className={`glass stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="stat-icon" style={{ backgroundColor: color }}>
            <Icon size={24} color="white" />
        </div>
        <div className="stat-info">
            <h3>{value}</h3>
            <p>{label}</p>
        </div>
        <style>{`
      .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 250px; transition: var(--transition); }
      .stat-card.clickable:hover { transform: translateY(-5px); border-color: var(--accent-primary); cursor: pointer; }
      .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .stat-info h3 { font-size: 1.5rem; margin: 0; }
      .stat-info p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
    `}</style>
    </div>
);

// ✅ Modal Combinado de Alertas de Hoje (Trainer)
const CombinedAlertsModal = ({ isOpen, onClose, requests, workoutAlerts, onAccept, onReject, loading, navigate, onDeleteAll }) => {
    if (!isOpen) return null;

    const { completed, missed, notLogged } = workoutAlerts;
    const totalWorkoutAlerts = completed.length + missed.length + notLogged.length;
    const totalAlerts = requests.length + totalWorkoutAlerts;

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-container combined-alerts-modal">
                <div className="modal-header">
                    <div>
                        <h2>🔔 Alertas de Treinos</h2>
                        <p>{totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''} no total ({requests.length} pedido{requests.length !== 1 ? 's' : ''} + {totalWorkoutAlerts} treino{totalWorkoutAlerts !== 1 ? 's' : ''})</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {totalWorkoutAlerts > 0 && (
                            <button
                                className="btn-delete-all"
                                onClick={onDeleteAll}
                                disabled={loading}
                            >
                                Eliminar Todos
                            </button>
                        )}
                        <button className="btn-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    {totalAlerts === 0 ? (
                        <div className="empty-state">
                            <Bell size={48} color="#64748b" />
                            <p>Sem alertas</p>
                        </div>
                    ) : (
                        <div className="alerts-sections">
                            {/* Pedidos de Clientes Section */}
                            {requests.length > 0 && (
                                <div className="alert-section requests-section">
                                    <div className="section-header">
                                        <h3><UserPlus size={20} /> Novos Pedidos de Clientes ({requests.length})</h3>
                                    </div>
                                    <div className="requests-list">
                                        {requests.map(request => (
                                            <div key={request._id} className="request-card">
                                                <div className="request-header">
                                                    <div className="client-info">
                                                        <div className="user-avatar large">
                                                            {request.client?.avatar ? (
                                                                <img src={getAvatarUrl(request.client.avatar)} alt={request.client.name} />
                                                            ) : (
                                                                request.client?.name?.[0] || '?'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4>{request.client?.name} {request.client?.surname}</h4>
                                                            <span className="client-email">{request.client?.email}</span>
                                                        </div>
                                                    </div>
                                                    <span className="badge badge-pending">Pendente</span>
                                                </div>

                                                <div className="request-reason">
                                                    <strong>Motivo:</strong>
                                                    <p>{request.reason}</p>
                                                </div>

                                                <div className="request-actions">
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => onReject(request._id)}
                                                        disabled={loading}
                                                    >
                                                        <XCircle size={18} />
                                                        Rejeitar
                                                    </button>
                                                    <button
                                                        className="btn-accept"
                                                        onClick={() => onAccept(request._id)}
                                                        disabled={loading}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                        Aceitar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Section */}
                            {completed.length > 0 && (
                                <div className="alert-section completed-section">
                                    <div className="section-header">
                                        <h3><CheckCircle2 size={20} /> Treinos Concluídos ({completed.length})</h3>
                                    </div>
                                    <div className="alerts-list">
                                        {completed.map((alert, idx) => (
                                            <div
                                                key={idx}
                                                className="alert-card"
                                                onClick={() => {
                                                    navigate(`/trainer/dashboard/${alert.clientId}`);
                                                    onClose();
                                                }}
                                            >
                                                <div className="user-avatar">
                                                    {alert.clientAvatar ? (
                                                        <img src={getAvatarUrl(alert.clientAvatar)} alt={alert.clientName} />
                                                    ) : (
                                                        alert.clientName[0]
                                                    )}
                                                </div>
                                                <div className="alert-info">
                                                    <h4>{alert.clientName}</h4>
                                                    <p>{alert.workoutName}</p>
                                                    <span className="time-info">
                                                        Concluído às {new Date(alert.completedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <CheckCircle2 size={24} className="status-icon success" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missed Section */}
                            {missed.length > 0 && (
                                <div className="alert-section missed-section">
                                    <div className="section-header">
                                        <h3><AlertCircle size={20} /> Treinos Não Concluídos ({missed.length})</h3>
                                    </div>
                                    <div className="alerts-list">
                                        {missed.map((alert, idx) => (
                                            <div
                                                key={idx}
                                                className="alert-card"
                                                onClick={() => {
                                                    navigate(`/trainer/dashboard/${alert.clientId}`);
                                                    onClose();
                                                }}
                                            >
                                                <div className="user-avatar">
                                                    {alert.clientAvatar ? (
                                                        <img src={getAvatarUrl(alert.clientAvatar)} alt={alert.clientName} />
                                                    ) : (
                                                        alert.clientName[0]
                                                    )}
                                                </div>
                                                <div className="alert-info">
                                                    <h4>{alert.clientName}</h4>
                                                    <p>{alert.workoutName}</p>
                                                    <div className="reason-box">
                                                        <strong>Justificação:</strong>
                                                        <span>{alert.reason}</span>
                                                    </div>
                                                </div>
                                                <AlertCircle size={24} className="status-icon warning" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Not Logged Section */}
                            {notLogged.length > 0 && (
                                <div className="alert-section notlogged-section">
                                    <div className="section-header">
                                        <h3><XCircle size={20} /> Não Registaram Treino ({notLogged.length})</h3>
                                    </div>
                                    <div className="alerts-list">
                                        {notLogged.map((alert, idx) => (
                                            <div
                                                key={idx}
                                                className="alert-card"
                                                onClick={() => {
                                                    navigate(`/trainer/dashboard/${alert.clientId}`);
                                                    onClose();
                                                }}
                                            >
                                                <div className="user-avatar">
                                                    {alert.clientAvatar ? (
                                                        <img src={getAvatarUrl(alert.clientAvatar)} alt={alert.clientName} />
                                                    ) : (
                                                        alert.clientName[0]
                                                    )}
                                                </div>
                                                <div className="alert-info">
                                                    <h4>{alert.clientName}</h4>
                                                    <p>{alert.scheduledWorkout}</p>
                                                    <span className="pending-text">Ainda não registou o treino</span>
                                                </div>
                                                <XCircle size={24} className="status-icon danger" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                    animation: fadeIn 0.2s ease;
                }

                .modal-container {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    animation: slideUp 0.3s ease;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .combined-alerts-modal {
                    width: 90%;
                    max-width: 900px;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .modal-header h2 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.5rem;
                }

                .modal-header p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .btn-close {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }

                .btn-close:hover {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .btn-delete-all {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.875rem;
                }

                .btn-delete-all:hover:not(:disabled) {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .btn-delete-all:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    text-align: center;
                }

                .empty-state p {
                    margin-top: 1rem;
                    color: var(--text-secondary);
                }

                .alerts-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .alert-section {
                    border-radius: 0.75rem;
                    overflow: hidden;
                    background: var(--bg-primary);
                }

                .section-header {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .requests-section .section-header {
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 4px solid #3b82f6;
                }

                .requests-section .section-header h3 {
                    color: #3b82f6;
                }

                .completed-section .section-header {
                    background: rgba(16, 185, 129, 0.1);
                    border-left: 4px solid #10b981;
                }

                .completed-section .section-header h3 {
                    color: #10b981;
                }

                .missed-section .section-header {
                    background: rgba(245, 158, 11, 0.1);
                    border-left: 4px solid #f59e0b;
                }

                .missed-section .section-header h3 {
                    color: #f59e0b;
                }

                .notlogged-section .section-header {
                    background: rgba(239, 68, 68, 0.1);
                    border-left: 4px solid #ef4444;
                }

                .notlogged-section .section-header h3 {
                    color: #ef4444;
                }

                .requests-list, .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem;
                }

                .request-card {
                    padding: 1.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    transition: all 0.3s ease;
                }

                .request-card:hover {
                    border-color: var(--accent-primary);
                    transform: translateY(-2px);
                }

                .request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .client-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-avatar.large {
                    width: 56px;
                    height: 56px;
                    font-size: 1.5rem;
                }

                .client-info h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.1rem;
                }

                .client-email {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .badge {
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .badge-pending {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .request-reason {
                    background: var(--bg-primary);
                    padding: 1rem;
                    border-radius: 0.75rem;
                    margin-bottom: 1rem;
                }

                .request-reason strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .request-reason p {
                    margin: 0;
                    color: var(--text-primary);
                    line-height: 1.5;
                }

                .request-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-reject, .btn-accept {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    font-size: 0.95rem;
                }

                .btn-reject {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .btn-reject:hover:not(:disabled) {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .btn-accept {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .btn-accept:hover:not(:disabled) {
                    background: #10b981;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }

                .btn-reject:disabled, .btn-accept:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .alert-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .alert-card:hover {
                    border-color: var(--accent-primary);
                    transform: translateX(4px);
                }

                .alert-info {
                    flex: 1;
                }

                .alert-info h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                    color: var(--text-primary);
                }

                .alert-info p {
                    margin: 0;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .time-info {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }

                .reason-box {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: var(--bg-primary);
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                }

                .reason-box strong {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: var(--text-secondary);
                    font-size: 0.75rem;
                }

                .reason-box span {
                    color: var(--text-primary);
                }

                .pending-text {
                    font-size: 0.75rem;
                    color: #ef4444;
                    font-style: italic;
                }

                .status-icon {
                    flex-shrink: 0;
                }

                .status-icon.success {
                    color: #10b981;
                }

                .status-icon.warning {
                    color: #f59e0b;
                }

                .status-icon.danger {
                    color: #ef4444;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translate(-50%, -45%);
                    }
                    to { 
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }

                @media (max-width: 768px) {
                    .combined-alerts-modal {
                        width: 95%;
                        max-height: 95vh;
                    }

                    .request-actions {
                        flex-direction: column;
                    }

                    .client-info {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .alert-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .status-icon {
                        align-self: flex-end;
                    }
                }
            `}</style>
        </>
    );
};

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [trainerInsights, setTrainerInsights] = useState({
        recentLogs: [],
        expiringPlans: [],
        upcomingBirthdays: [],
        activeCount: 0,
        unreadMsgs: 0,
        pendingRequests: 0
    });
    const [adminStats, setAdminStats] = useState({ pendingTrainers: 0, pendingRequests: 0, totalTrainers: 0 });
    const [loading, setLoading] = useState(true);

    // ✅ Estado para pedidos e alertas combinados (Trainer)
    const [requests, setRequests] = useState([]);
    const [workoutAlerts, setWorkoutAlerts] = useState({
        completed: [],
        missed: [],
        notLogged: []
    });
    const [showCombinedAlertsModal, setShowCombinedAlertsModal] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    // ✅ Estado para contagem de notificações (Cliente)
    const [unreadCount, setUnreadCount] = useState(0);

    // ✅ REDIRECIONAR ADMIN AUTOMATICAMENTE
    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    // ✅ Buscar pedidos do trainer
    const fetchTrainerRequests = async () => {
        try {
            const res = await api.get('/requests/trainer');
            setRequests(res.data.data || []);
            setTrainerInsights(prev => ({
                ...prev,
                pendingRequests: res.data.count || 0
            }));
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
        }
    };

    // ✅ Buscar alertas de treinos de hoje
    const fetchWorkoutAlerts = async () => {
        try {
            const res = await api.get('/trainers/today-alerts');
            setWorkoutAlerts(res.data.data || { completed: [], missed: [], notLogged: [] });
            setTrainerInsights(prev => ({
                ...prev,
                todayAlerts: res.data.count?.total || 0
            }));
        } catch (err) {
            console.error('Erro ao buscar alertas:', err);
        }
    };

    // ✅ Buscar contagem de notificações do cliente
    const fetchClientNotificationsCount = async () => {
        try {
            const res = await api.get('/notifications'); // ✅ CORRIGIDO
            const unread = res.data.data?.filter(n => !n.isRead).length || 0;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Erro ao buscar notificações:', err);
        }
    };

    // ✅ Aceitar pedido
    const handleAcceptRequest = async (requestId) => {
        setRequestLoading(true);
        try {
            await api.patch(`/requests/${requestId}/accept`);

            setRequests(prev => prev.filter(req => req._id !== requestId));
            setTrainerInsights(prev => ({
                ...prev,
                pendingRequests: prev.pendingRequests - 1,
                activeCount: prev.activeCount + 1
            }));

            alert('✅ Pedido aceite! Cliente adicionado à sua lista.');
        } catch (err) {
            console.error('Erro ao aceitar pedido:', err);
            alert('❌ Erro ao aceitar pedido. Tente novamente.');
        } finally {
            setRequestLoading(false);
        }
    };

    // ✅ Rejeitar pedido
    const handleRejectRequest = async (requestId) => {
        if (!confirm('Tem certeza que deseja rejeitar este pedido?')) return;

        setRequestLoading(true);
        try {
            await api.delete(`/requests/${requestId}/reject`);

            setRequests(prev => prev.filter(req => req._id !== requestId));
            setTrainerInsights(prev => ({
                ...prev,
                pendingRequests: prev.pendingRequests - 1
            }));

            alert('Pedido rejeitado.');
        } catch (err) {
            console.error('Erro ao rejeitar pedido:', err);
            alert('❌ Erro ao rejeitar pedido. Tente novamente.');
        } finally {
            setRequestLoading(false);
        }
    };

    // ✅ Eliminar todos os alertas
    const handleDeleteAllAlerts = async () => {
        if (!confirm('Tem certeza que deseja eliminar todos os alertas de treinos?')) return;

        setRequestLoading(true);
        try {
            await api.delete('/trainers/today-alerts');

            // Clear all workout alerts
            setWorkoutAlerts({
                completed: [],
                missed: [],
                notLogged: []
            });

            setTrainerInsights(prev => ({
                ...prev,
                todayAlerts: 0
            }));

            alert('✅ Todos os alertas foram eliminados.');
        } catch (err) {
            console.error('Erro ao eliminar alertas:', err);
            alert('❌ Erro ao eliminar alertas. Tente novamente.');
        } finally {
            setRequestLoading(false);
        }
    };

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                if (user.role === 'client') {
                    const res = await api.get('/users/dashboard/me');
                    setData(res.data.data);

                    // ✅ Buscar contagem de notificações
                    await fetchClientNotificationsCount();
                } else if (user.role === 'trainer') {
                    const [clientsRes, unreadRes] = await Promise.all([
                        api.get('/users/my-clients'),
                        api.get('/messages/unread')
                    ]);

                    const clients = clientsRes.data.data;

                    setTrainerInsights({
                        activeCount: clients.length,
                        unreadMsgs: unreadRes.data.data?.length || 0,
                        recentLogs: [],
                        expiringPlans: [],
                        pendingRequests: 0
                    });

                    setData({ clients });

                    await fetchTrainerRequests();
                    await fetchWorkoutAlerts();
                } else if (user.role === 'admin') {
                    const [pendingTrainers, pendingRequests, trainers] = await Promise.all([
                        api.get('/admin/trainers/pending'),
                        api.get('/admin/requests/pending'),
                        api.get('/admin/users')
                    ]);
                    setAdminStats({
                        pendingTrainers: pendingTrainers.data.results || 0,
                        pendingRequests: pendingRequests.data.results || 0,
                        totalTrainers: trainers.data.data.filter(u => u.role === 'trainer').length
                    });
                }
            } catch (err) {
                console.error('Erro ao carregar dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role !== 'admin') {
            fetchHomeData();
        }
    }, [user?.role]);

    if (loading) return <div>Carregando dashboard...</div>;

    const clientStats = data?.statsByMonth || [];

    const isClientWithoutTrainer = user.role === 'client' && !user.trainer;

    return (
        <div className="home-container animate-fade">
            <header className="page-header">
                <div className="header-main">
                    <h1>Olá, {user.firstName}!</h1>
                    <p>
                        {user.role === 'admin'
                            ? 'Painel de Controlo da Plataforma.'
                            : user.role === 'trainer'
                                ? 'Gestão de atletas e planeamento.'
                                : 'O seu centro de treino personalizado.'}
                    </p>
                </div>
                {user.role === 'trainer' && !user.isValidated && (
                    <div className="glass validation-alert">
                        <AlertCircle size={20} color="#f59e0b" />
                        <span>A sua conta aguarda validação do Administrador.</span>
                    </div>
                )}
            </header>

            {isClientWithoutTrainer && (
                <div className="glass cta-banner">
                    <div className="banner-content">
                        <div className="banner-icon">
                            <UserPlus size={40} />
                        </div>
                        <div className="banner-text">
                            <h2>Ainda não tem um Personal Trainer?</h2>
                            <p>Escolha o seu trainer ideal e comece a sua transformação hoje!</p>
                        </div>
                        <button className="btn-banner" onClick={() => navigate('/dashboard/trainers')}>
                            <Search size={20} />
                            Ver Personal Trainers
                        </button>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                {user.role === 'client' ? (
                    <>
                        <StatCard
                            icon={Activity}
                            label="Treinos Concluídos"
                            value={data?.totalWorkouts || 0}
                            color="#3b82f6"
                        />
                        <StatCard
                            icon={Bell}
                            label="Notificações"
                            value={unreadCount}
                            color="#f59e0b"
                            onClick={() => navigate('/notifications')}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Taxa Cumprimento"
                            value={data?.completionRate || '0%'}
                            color="#854dff"
                            onClick={() => navigate('/client/statistics')}
                        />
                    </>
                ) : user.role === 'trainer' ? (
                    <>
                        <StatCard icon={Users} label="Clientes Ativos" value={trainerInsights.activeCount} color="#3b82f6" onClick={() => navigate('/trainer/clients')} />
                        <StatCard
                            icon={Bell}
                            label="Alertas de Treinos"
                            value={(trainerInsights.pendingRequests || 0) + (trainerInsights.todayAlerts || 0)}
                            color="#ef4444"
                            onClick={() => setShowCombinedAlertsModal(true)}
                        />
                        <StatCard icon={MessageCircle} label="Novas Mensagens" value={trainerInsights.unreadMsgs} color="#f59e0b" onClick={() => navigate('/chat')} />
                    </>
                ) : (
                    <>
                        <StatCard icon={UserCheck} label="Trainers Pendentes" value={adminStats.pendingTrainers} color="#f59e0b" onClick={() => navigate('/admin/trainers')} />
                        <StatCard icon={ClipboardList} label="Pedidos de Mudança" value={adminStats.pendingRequests} color="#3b82f6" onClick={() => navigate('/admin/requests')} />
                        <StatCard icon={Users} label="Total Trainers" value={adminStats.totalTrainers} color="#10b981" onClick={() => navigate('/admin/trainers')} />
                    </>
                )}
            </div>

            {/* ✅ Modal Combinado de Alertas de Hoje (Trainer) */}
            <CombinedAlertsModal
                isOpen={showCombinedAlertsModal}
                onClose={() => setShowCombinedAlertsModal(false)}
                requests={requests}
                workoutAlerts={workoutAlerts}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onDeleteAll={handleDeleteAllAlerts}
                loading={requestLoading}
                navigate={navigate}
            />

            {user.role === 'trainer' && (
                <div className="trainer-dashboard-grid">
                    <div className="glass section-card">
                        <div className="card-header">
                            <h3><Clock size={20} /> Atividade Recente</h3>
                            <button className="btn-text" onClick={() => navigate('/trainer/clients')}>Ver Todos</button>
                        </div>
                        <div className="activity-list">
                            {data.clients?.length > 0 ? data.clients.slice(0, 4).map(client => (
                                <div key={client._id} className="activity-item" onClick={() => navigate(`/trainer/dashboard/${client._id}`)}>
                                    <div className="user-avatar">
                                        {client.avatar ? <img src={getAvatarUrl(client.avatar)} alt={client.firstName} /> : client.firstName[0]}
                                    </div>
                                    <div className="item-info">
                                        <h4>{client.firstName} {client.lastName}</h4>
                                        <span>Último treino: Há 2 horas</span>
                                    </div>
                                    <div className="item-status success">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <ChevronRight size={16} className="arrow" />
                                </div>
                            )) : <p className="empty-info">Sem clientes atribuídos.</p>}
                        </div>
                    </div>

                    <div className="glass section-card">
                        <div className="card-header">
                            <h3><Calendar size={20} /> Planos a Expirar</h3>
                        </div>
                        <div className="expiring-list">
                            {trainerInsights.expiringPlans.length > 0 ? (
                                trainerInsights.expiringPlans.map(plan => (
                                    <div key={plan._id} className="activity-item danger">
                                        <div className="user-avatar">
                                            {plan.clientAvatar ? <img src={getAvatarUrl(plan.clientAvatar)} alt={plan.clientName} /> : plan.clientName[0]}
                                        </div>
                                        <div className="item-info">
                                            <h4>{plan.clientName}</h4>
                                            <span>Expira em {plan.daysLeft} dias</span>
                                        </div>
                                        <button className="btn-action" onClick={() => navigate(`/trainer/plans/${plan.clientId}`)}>Renovar</button>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-info">Nenhum plano a expirar em breve.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {user.role === 'client' && (
                <div className="charts-grid">
                    <div className="glass chart-card">
                        <h3>Evolução dos Treinos</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={clientStats.length > 0 ? clientStats : [{ name: 'Jan', treinos: 0 }]}>
                                    <defs>
                                        <linearGradient id="colorTreinosCyan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#22d3ee' }}
                                        cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="treinos"
                                        stroke="#06b6d4"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTreinosCyan)"
                                        activeDot={{ r: 8, strokeWidth: 0, fill: '#22d3ee', boxShadow: '0 0 15px #22d3ee' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .home-container { display: flex; flex-direction: column; gap: 2rem; }
                .page-header { display: flex; justify-content: space-between; align-items: center; }
                .validation-alert { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; border: 1px solid #f59e0b; font-size: 0.85rem; color: #f59e0b; font-weight: 500; }
                .stats-grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
                
                .cta-banner {
                    padding: 2rem;
                    border: 2px solid var(--accent-primary);
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
                    margin-bottom: 1rem;
                }
                
                .banner-content {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                
                .banner-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                
                .banner-text {
                    flex: 1;
                }
                
                .banner-text h2 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.5rem;
                    color: var(--text-primary);
                }
                
                .banner-text p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 1rem;
                }
                
                .btn-banner {
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                
                .btn-banner:hover {
                    background: var(--accent-secondary);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }
                
                .trainer-dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                @media (max-width: 1000px) { 
                    .trainer-dashboard-grid { grid-template-columns: 1fr; }
                    .banner-content { flex-direction: column; text-align: center; }
                    .btn-banner { width: 100%; justify-content: center; }
                }
                
                .section-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .card-header { display: flex; justify-content: space-between; align-items: center; }
                .card-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.1rem; }
                .btn-text { background: transparent; border: none; color: var(--accent-primary); cursor: pointer; font-weight: 600; font-size: 0.85rem; }
                
                .activity-list, .expiring-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .activity-item { background: var(--bg-primary); padding: 1rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: 0.3s; border: 1px solid var(--border-color); }
                .activity-item:hover { transform: translateX(5px); border-color: var(--accent-primary); }
                .activity-item.danger { border-color: #fee2e2; }
                .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--accent-primary); overflow: hidden; }
                .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .item-info { flex: 1; }
                .item-info h4 { margin: 0; font-size: 0.95rem; }
                .item-info span { font-size: 0.75rem; color: var(--text-secondary); }
                .item-status.success { color: #10b981; }
                .arrow { color: var(--text-secondary); opacity: 0.5; }
                
                .btn-action { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
                .empty-info { text-align: center; color: var(--text-secondary); opacity: 0.5; font-size: 0.85rem; padding: 1rem; }
                
                .charts-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
                .chart-card { padding: 1.5rem; }
                .chart-wrapper { width: 100%; height: 300px; }
            `}</style>
        </div>
    );
};

export default Home;