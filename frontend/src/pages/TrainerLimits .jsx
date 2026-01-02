import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    Edit2,
    Save,
    X,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

// ✅ ESTE É O TRAINERSLIMITS.JSX - PÁGINA ADMIN PARA GERIR LIMITES
// 📍 Usar em: /admin/limits
// 🎯 Função: Admin define limite máximo de clientes por trainer

const TrainerLimits = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newLimit, setNewLimit] = useState('');

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            // Buscar todos os trainers validados
            const response = await api.get('/users/trainers');
            const trainersData = response.data.trainers || [];

            // Para cada trainer, buscar número de clientes
            const trainersWithCounts = await Promise.all(
                trainersData.map(async (trainer) => {
                    try {
                        const detailsRes = await api.get(`/admin/trainers/${trainer._id}`);
                        return {
                            ...trainer,
                            maxClients: detailsRes.data.data.maxClients,
                            currentClients: detailsRes.data.data.currentClients,
                            availableSlots: detailsRes.data.data.availableSlots
                        };
                    } catch (error) {
                        return {
                            ...trainer,
                            maxClients: 15,
                            currentClients: 0,
                            availableSlots: 15
                        };
                    }
                })
            );

            setTrainers(trainersWithCounts);
        } catch (error) {
            console.error('Erro ao carregar trainers:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (trainer) => {
        setEditingId(trainer._id);
        setNewLimit(trainer.maxClients);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewLimit('');
    };

    const saveLimit = async (trainerId) => {
        try {
            await api.patch(`/admin/trainers/${trainerId}/limit`, {
                maxClients: parseInt(newLimit)
            });

            alert('Limite atualizado com sucesso!');
            setEditingId(null);
            setNewLimit('');
            fetchTrainers(); // Recarregar
        } catch (error) {
            console.error('Erro ao atualizar limite:', error);
            alert('Erro ao atualizar limite: ' + (error.response?.data?.message || 'Erro desconhecido'));
        }
    };

    const getStatusColor = (trainer) => {
        const percentage = (trainer.currentClients / trainer.maxClients) * 100;
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        return 'success';
    };

    const getStatusIcon = (trainer) => {
        const percentage = (trainer.currentClients / trainer.maxClients) * 100;
        if (percentage >= 90) return <AlertTriangle size={18} />;
        return <CheckCircle size={18} />;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar trainers...</p>
            </div>
        );
    }

    return (
        <div className="trainer-limits">
            <header className="page-header">
                <h1>Limites de Clientes</h1>
                <p>Defina o número máximo de clientes por trainer</p>
            </header>

            {trainers.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} />
                    <h3>Nenhum trainer disponível</h3>
                    <p>Não há trainers validados no sistema.</p>
                </div>
            ) : (
                <div className="trainers-list">
                    {trainers.map((trainer) => (
                        <div key={trainer._id} className={`trainer-card glass ${getStatusColor(trainer)}-border`}>
                            <div className="trainer-header">
                                <img
                                    src={trainer.avatar || `https://ui-avatars.com/api/?name=${trainer.firstName}+${trainer.lastName}`}
                                    alt={trainer.firstName}
                                    className="trainer-avatar"
                                />
                                <div className="trainer-info">
                                    <h3>{trainer.firstName} {trainer.lastName}</h3>
                                    <p className="trainer-email">{trainer.email}</p>
                                </div>
                            </div>

                            <div className="stats-row">
                                <div className="stat">
                                    <span className="label">Clientes Atuais:</span>
                                    <span className="value">{trainer.currentClients}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Limite Máximo:</span>
                                    {editingId === trainer._id ? (
                                        <input
                                            type="number"
                                            value={newLimit}
                                            onChange={(e) => setNewLimit(e.target.value)}
                                            min="1"
                                            max="100"
                                            className="limit-input"
                                        />
                                    ) : (
                                        <span className="value">{trainer.maxClients}</span>
                                    )}
                                </div>
                                <div className="stat">
                                    <span className="label">Vagas Disponíveis:</span>
                                    <span className={`value ${trainer.availableSlots <= 0 ? 'text-danger' : ''}`}>
                                        {trainer.availableSlots}
                                    </span>
                                </div>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${getStatusColor(trainer)}`}
                                    style={{ width: `${(trainer.currentClients / trainer.maxClients) * 100}%` }}
                                ></div>
                            </div>

                            <div className="card-footer">
                                <div className={`status-badge ${getStatusColor(trainer)}`}>
                                    {getStatusIcon(trainer)}
                                    <span>
                                        {trainer.availableSlots <= 0 ? 'Limite Atingido' :
                                            trainer.currentClients / trainer.maxClients >= 0.9 ? 'Quase Cheio' :
                                                'Disponível'}
                                    </span>
                                </div>

                                <div className="actions">
                                    {editingId === trainer._id ? (
                                        <>
                                            <button className="btn-save" onClick={() => saveLimit(trainer._id)}>
                                                <Save size={16} />
                                                Guardar
                                            </button>
                                            <button className="btn-cancel" onClick={cancelEdit}>
                                                <X size={16} />
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <button className="btn-edit" onClick={() => startEdit(trainer)}>
                                            <Edit2 size={16} />
                                            Editar Limite
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .trainer-limits {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .page-header p {
                    color: var(--text-secondary);
                }

                .trainers-list {
                    display: grid;
                    gap: 1.5rem;
                }

                .trainer-card {
                    padding: 1.5rem;
                    border-radius: 1rem;
                    border-left: 4px solid transparent;
                }

                .trainer-card.success-border {
                    border-left-color: #10b981;
                }

                .trainer-card.warning-border {
                    border-left-color: #f59e0b;
                }

                .trainer-card.danger-border {
                    border-left-color: #ef4444;
                }

                .trainer-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .trainer-avatar {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .trainer-info h3 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .trainer-email {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin: 0.25rem 0 0 0;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .stat .label {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .stat .value {
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .text-danger {
                    color: #ef4444;
                }

                .limit-input {
                    width: 80px;
                    padding: 0.5rem;
                    border: 2px solid var(--accent-primary);
                    border-radius: 0.375rem;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 1.5rem;
                    font-weight: 600;
                    text-align: center;
                }

                .progress-bar {
                    height: 8px;
                    background: var(--border-color);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                }

                .progress-fill {
                    height: 100%;
                    transition: width 0.3s;
                }

                .progress-fill.success {
                    background: #10b981;
                }

                .progress-fill.warning {
                    background: #f59e0b;
                }

                .progress-fill.danger {
                    background: #ef4444;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .status-badge.success {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                }

                .status-badge.warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }

                .status-badge.danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-edit, .btn-save, .btn-cancel {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.3s;
                }

                .btn-edit {
                    background: var(--accent-primary);
                    color: white;
                }

                .btn-edit:hover {
                    background: var(--accent-hover);
                }

                .btn-save {
                    background: #10b981;
                    color: white;
                }

                .btn-save:hover {
                    background: #059669;
                }

                .btn-cancel {
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }

                .btn-cancel:hover {
                    background: var(--glass-bg);
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-secondary);
                }

                .empty-state svg {
                    color: var(--text-tertiary);
                    margin-bottom: 1rem;
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    gap: 1rem;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--border-color);
                    border-top-color: var(--accent-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .trainer-limits {
                        padding: 1rem;
                    }

                    .stats-row {
                        grid-template-columns: 1fr;
                    }

                    .card-footer {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: stretch;
                    }

                    .actions {
                        justify-content: stretch;
                    }

                    .actions button {
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default TrainerLimits;