import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Activity,
    Calendar,
    TrendingUp,
    ArrowLeft,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Image as ImageIcon,
    Clock,
    Eye
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

const ClientStatsDashboard = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isMe = !clientId;

    const [client, setClient] = useState(null);
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchData();
    }, [clientId, location.pathname]); // ✅ Refresh when navigating to this page

    // ✅ Auto-refresh when page becomes visible (user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('📊 Página visível - Atualizando dados...');
                fetchData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [clientId]);

    const fetchData = async () => {
        try {
            let clientData, statsData, logsData, plansData;

            if (isMe) {
                // ✅ CORRIGIDO: Fetching my own data
                const [uRes, sRes, lRes, pRes] = await Promise.all([
                    api.get('/users/me'),
                    api.get('/users/dashboard/me'),
                    api.get('/workouts/client/logs'),
                    api.get('/workouts') // ✅ Backend auto-filters for authenticated user
                ]);
                clientData = uRes.data.user;
                statsData = sRes.data.data;
                logsData = lRes.data.data;
                plansData = pRes.data.data || [];
            } else {
                // Trainer viewing client
                const [cRes, sRes, lRes, pRes] = await Promise.all([
                    api.get(`/users/${clientId}`),
                    api.get(`/users/dashboard/${clientId}`),
                    api.get(`/users/logs/${clientId}`),
                    api.get('/workouts', { params: { clientId } })
                ]);
                clientData = cRes.data.data;
                statsData = sRes.data.data;
                logsData = lRes.data.data;
                plansData = pRes.data.data || [];
            }

            setClient(clientData);
            setStats(statsData);
            setLogs(logsData ? logsData.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
            setPlans(plansData ? (Array.isArray(plansData) ? plansData : plansData.plans || []) : []);
        } catch (err) {
            console.error('Erro ao buscar dados do cliente', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Carregando estatísticas do cliente...</div>;

    const chartData = stats?.statsByMonth || [];

    return (
        <div className="client-dashboard animate-fade">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-text">
                    <h1>{isMe ? 'Meu Progresso' : `Dashboard de ${client?.firstName}`}</h1>
                    <p>{isMe ? 'Acompanha a tua evolução e regularidade.' : 'Acompanhe o desempenho e a regularidade do atleta.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        className="btn-refresh"
                        onClick={() => {
                            setLoading(true);
                            fetchData();
                        }}
                        title="Atualizar dados"
                    >
                        <TrendingUp size={20} />
                        Atualizar
                    </button>
                    {!isMe && (
                        <button className="btn-primary" onClick={() => navigate(`/trainer/plans/${clientId}`)}>
                            Novo Plano de Treino
                        </button>
                    )}
                </div>
            </header>

            <div className="stats-grid">
                <div className="glass stat-card">
                    <Activity size={32} color="var(--accent-primary)" />
                    <div>
                        <h3>{stats?.totalWorkouts || 0}</h3>
                        <p>Treinos Concluídos</p>
                    </div>
                </div>
                <div className="glass stat-card">
                    <TrendingUp size={32} color="#10b981" />
                    <div>
                        <h3>{stats?.completionRate || '0%'}</h3>
                        <p>Taxa de Cumprimento</p>
                    </div>
                </div>
                <div className="glass stat-card">
                    <AlertCircle size={32} color="#ef4444" />
                    <div>
                        <h3>{stats?.missedWorkouts || 0}</h3>
                        <p>Treinos Falhados</p>
                    </div>
                </div>
            </div>

            <div className="main-content-grid">
                <div className="left-panel">
                    <div className="glass chart-card">
                        <h3>Evolução Mensal</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.length > 0 ? chartData : [{ name: 'Jan', treinos: 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="treinos" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass logs-section">
                        <h3>Histórico de Registos</h3>
                        <div className="logs-list">
                            {logs.length === 0 ? (
                                <p className="empty">Nenhum registo encontrado.</p>
                            ) : (
                                logs.map(log => (
                                    <div key={log._id} className="log-item">
                                        <div className="log-status">
                                            {log.isCompleted ? (
                                                <CheckCircle2 size={24} color="#10b981" />
                                            ) : (
                                                <XCircle size={24} color="#ef4444" />
                                            )}
                                        </div>
                                        <div className="log-info">
                                            <div className="log-header">
                                                <span className="log-date">{new Date(log.date).toLocaleDateString('pt-PT')}</span>
                                                <span className={`log-badge ${log.isCompleted ? 'success' : 'danger'}`}>
                                                    {log.isCompleted ? 'Concluído' : 'Falhado'}
                                                </span>
                                            </div>
                                            {!log.isCompleted && log.reasonNotCompleted && (
                                                <p className="log-reason">Motivo: {log.reasonNotCompleted}</p>
                                            )}
                                        </div>
                                        {log.proofImageURL && (
                                            <button className="btn-view-proof" onClick={() => setSelectedImage(log.proofImageURL)}>
                                                <ImageIcon size={18} /> Prova
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="glass info-card client-header-card">
                        <div className="avatar-large">
                            {client?.avatar ? (
                                <img src={`http://localhost:5000${client.avatar}`} alt="Avatar" />
                            ) : (
                                <User size={40} />
                            )}
                        </div>
                        <h3>{client?.firstName} {client?.lastName}</h3>
                        <p>{client?.email}</p>
                        <div className="client-meta">
                            <span className="meta-item"><Clock size={14} /> Membro desde {new Date(client?.createdAt).getFullYear()}</span>
                        </div>
                    </div>

                    <div className="glass logs-section plans-history">
                        <h3>Planos de Treino</h3>
                        <div className="plans-list">
                            {plans.length === 0 ? (
                                <p className="empty">Nenhum plano registado.</p>
                            ) : (
                                plans.map(plan => (
                                    <div key={plan._id} className={`plan-mini-card ${plan.isActive ? 'active' : ''}`}>
                                        <div className="plan-info">
                                            <h4>{plan.name}</h4>
                                            <span>{plan.frequency}x / semana</span>
                                        </div>
                                        {plan.isActive && <span className="active-tag">ATIVO</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="glass modal-img-container">
                        <img src={`http://localhost:5000${selectedImage}`} alt="Prova de Treino" />
                        <button className="btn-close" onClick={() => setSelectedImage(null)}><XCircle size={30} /></button>
                    </div>
                </div>
            )}

            <style>{`
                .client-dashboard { display: flex; flex-direction: column; gap: 2rem; }
                .page-header { display: flex; align-items: center; gap: 1.5rem; }
                .btn-back { background: var(--glass-bg); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; color: var(--text-primary); }
                .btn-refresh { 
                    background: var(--glass-bg); 
                    border: 1px solid var(--border-color); 
                    padding: 0.5rem 1rem; 
                    border-radius: 0.5rem; 
                    cursor: pointer; 
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .btn-refresh:hover {
                    background: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: white;
                    transform: translateY(-2px);
                }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
                .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
                .stat-card h3 { font-size: 1.75rem; margin: 0; }
                .stat-card p { color: var(--text-secondary); margin: 0; font-size: 0.85rem; }
                
                .main-content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
                @media (max-width: 900px) { .main-content-grid { grid-template-columns: 1fr; } }
                
                .left-panel { display: flex; flex-direction: column; gap: 1.5rem; }
                .chart-card { padding: 1.5rem; }
                .chart-wrapper { height: 250px; }
                
                .logs-section { padding: 1.5rem; }
                .logs-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; max-height: 500px; overflow-y: auto; }
                .log-item { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; background: var(--bg-primary); border-radius: 0.75rem; border: 1px solid var(--border-color); }
                .log-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
                .log-header { display: flex; align-items: center; gap: 1rem; }
                .log-date { font-weight: 600; font-size: 0.95rem; }
                .log-badge { font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 1rem; font-weight: 700; text-transform: uppercase; }
                .log-badge.success { background: #dcfce7; color: #166534; }
                .log-badge.danger { background: #fee2e2; color: #991b1b; }
                .log-reason { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
                .btn-view-proof { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-primary); font-size: 0.85rem; transition: 0.3s; }
                .btn-view-proof:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
                
                .client-header-card { padding: 2.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
                .avatar-large { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; color: white; border: 4px solid var(--bg-secondary); overflow: hidden; }
                .avatar-large img { width: 100%; height: 100%; object-fit: cover; }
                .client-header-card h3 { margin: 0; font-size: 1.25rem; }
                .client-header-card p { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }
                .client-meta { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; width: 100%; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-secondary); }
                .meta-item { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

                .plans-history { padding: 1.25rem; }
                .plans-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
                .plan-mini-card { background: var(--bg-primary); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
                .plan-mini-card.active { border-color: var(--accent-primary); background: rgba(133, 77, 255, 0.05); }
                .plan-info h4 { margin: 0; font-size: 0.9rem; }
                .plan-info span { font-size: 0.75rem; color: var(--text-secondary); }
                .active-tag { font-size: 0.6rem; font-weight: 800; background: var(--accent-primary); color: white; padding: 0.2rem 0.5rem; border-radius: 0.4rem; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .modal-img-container { position: relative; max-width: 90%; max-height: 90%; }
                .modal-img-container img { max-width: 100%; max-height: 80vh; border-radius: 1rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .btn-close { position: absolute; top: -40px; right: -40px; background: transparent; border: none; color: white; cursor: pointer; }
                .empty { text-align: center; color: var(--text-secondary); opacity: 0.6; padding: 2rem; }
            `}</style>
        </div>
    );
};

export default ClientStatsDashboard;