import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Calendar, User, Edit, Trash2, Plus, Eye, Filter } from 'lucide-react';

const TrainerPlansManagement = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [plans, setPlans] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterClient, setFilterClient] = useState('');
    const [filterActive, setFilterActive] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansRes, clientsRes] = await Promise.all([
                api.get('/workouts'),
                api.get('/users/my-clients')
            ]);
            setPlans(plansRes.data.data);
            setClients(clientsRes.data.data);
        } catch (err) {
            addNotification('error', 'Erro ao carregar planos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja eliminar este plano?')) return;
        try {
            await api.delete(`/workouts/${id}`);
            addNotification('success', 'Plano eliminado!');
            setPlans(plans.filter(p => p._id !== id));
        } catch (err) {
            addNotification('error', 'Erro ao eliminar plano');
        }
    };

    const filteredPlans = plans.filter(plan => {
        if (filterClient && plan.client._id !== filterClient) return false;
        if (filterActive === 'active' && !plan.isActive) return false;
        if (filterActive === 'inactive' && plan.isActive) return false;
        return true;
    });

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="plans-mgmt animate-fade">
            <header className="page-header">
                <div>
                    <h1>Gestão de Planos de Treino</h1>
                    <p>Visualiza e gere todos os planos criados para os teus atletas</p>
                </div>
            </header>

            <div className="glass filters-bar">
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                        <option value="">Todos os clientes</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.firstName} {c.lastName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
                        <option value="all">Todos os planos</option>
                        <option value="active">Apenas ativos</option>
                        <option value="inactive">Apenas inativos</option>
                    </select>
                </div>
                <div className="stats-badge">
                    Total: {filteredPlans.length} planos
                </div>
            </div>

            <div className="plans-grid">
                {filteredPlans.length === 0 ? (
                    <div className="glass empty-state">
                        <Calendar size={48} />
                        <p>Nenhum plano encontrado</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/trainer/clients')}
                        >
                            <Plus size={18} /> Criar Primeiro Plano
                        </button>
                    </div>
                ) : (
                    filteredPlans.map(plan => (
                        <div key={plan._id} className={`glass plan-card ${plan.isActive ? 'active' : 'inactive'}`}>
                            <div className="plan-header">
                                <div className="plan-title">
                                    <h3>{plan.name}</h3>
                                    <span className={`status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
                                        {plan.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="plan-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => navigate(`/trainer/plans/${plan.client._id}`)}
                                        title="Ver Plano"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        onClick={() => handleDelete(plan._id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="plan-client">
                                <User size={16} />
                                <span>{plan.client.firstName} {plan.client.lastName}</span>
                            </div>

                            <div className="plan-details">
                                <div className="detail-item">
                                    <span className="label">Frequência</span>
                                    <span className="value">{plan.frequency}x/semana</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Duração</span>
                                    <span className="value">
                                        {new Date(plan.startDate).toLocaleDateString('pt-PT')} - {new Date(plan.endDate).toLocaleDateString('pt-PT')}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Exercícios</span>
                                    <span className="value">
                                        {plan.weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)} total
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .plans-mgmt { display: flex; flex-direction: column; gap: 2rem; }
                
                .filters-bar { 
                    padding: 1rem 1.5rem; 
                    display: flex; 
                    align-items: center; 
                    gap: 1rem; 
                    flex-wrap: wrap;
                }
                
                .filter-group { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                }
                
                .filter-group select { 
                    padding: 0.5rem 1rem; 
                    border-radius: 0.5rem; 
                    border: 1px solid var(--border-color); 
                    background: var(--bg-primary); 
                    color: var(--text-primary); 
                    cursor: pointer;
                }
                
                .stats-badge {
                    margin-left: auto;
                    background: var(--accent-primary);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
                
                .plans-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
                    gap: 1.5rem; 
                }
                
                .plan-card { 
                    padding: 1.5rem; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1rem;
                    border-left: 4px solid transparent;
                    transition: all 0.3s;
                }
                
                .plan-card.active {
                    border-left-color: var(--accent-primary);
                }
                
                .plan-card.inactive {
                    opacity: 0.7;
                    border-left-color: var(--text-secondary);
                }
                
                .plan-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .plan-title h3 { 
                    margin: 0 0 0.5rem 0; 
                    font-size: 1.125rem; 
                }
                
                .status-badge {
                    font-size: 0.7rem;
                    padding: 0.25rem 0.625rem;
                    border-radius: 1rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                
                .status-badge.active {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .status-badge.inactive {
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                }
                
                .plan-actions { 
                    display: flex; 
                    gap: 0.5rem; 
                }
                
                .btn-icon { 
                    background: var(--bg-primary); 
                    border: 1px solid var(--border-color); 
                    width: 32px; 
                    height: 32px; 
                    border-radius: 0.5rem; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    color: var(--text-secondary); 
                    transition: all 0.3s;
                }
                
                .btn-icon:hover { 
                    border-color: var(--accent-primary); 
                    color: var(--accent-primary); 
                }
                
                .btn-icon.delete:hover { 
                    border-color: #ef4444; 
                    color: #ef4444; 
                }
                
                .plan-client {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                
                .plan-details { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.75rem; 
                }
                
                .detail-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    font-size: 0.875rem;
                }
                
                .detail-item .label { 
                    color: var(--text-secondary); 
                    font-weight: 500;
                }
                
                .detail-item .value { 
                    color: var(--text-primary); 
                    font-weight: 600;
                }
                
                .empty-state { 
                    grid-column: 1 / -1;
                    padding: 4rem; 
                    text-align: center; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 1.5rem; 
                    color: var(--text-secondary); 
                }
                
                @media (max-width: 768px) {
                    .plans-grid { 
                        grid-template-columns: 1fr; 
                    }
                    
                    .filters-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .stats-badge {
                        margin-left: 0;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default TrainerPlansManagement;