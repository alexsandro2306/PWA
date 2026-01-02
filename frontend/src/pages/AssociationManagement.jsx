import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    UserX,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import Pagination from '../components/Pagination';

const AssociationManagement = () => {
    const [associations, setAssociations] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    // ✅ NOVO: Paginação (2 por página para cada tab)
    const [currentPageActive, setCurrentPageActive] = useState(1);
    const [currentPageHistory, setCurrentPageHistory] = useState(1);
    const itemsPerPage = 2;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const assocResponse = await api.get('/admin/associations');
            setAssociations(assocResponse.data.associations || []);

            const reqResponse = await api.get('/admin/requests/history');
            setRequests(reqResponse.data.requests || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssociation = async (clientId, trainerName) => {
        if (!window.confirm(`Tem certeza que deseja remover a associação com ${trainerName}?`)) {
            return;
        }

        try {
            await api.delete(`/admin/associations/${clientId}`);
            alert('Associação removida com sucesso!');
            fetchData();
        } catch (error) {
            console.error('Erro ao remover associação:', error);
            alert('Erro ao remover associação: ' + (error.response?.data?.message || 'Erro desconhecido'));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            approved: { icon: <CheckCircle size={16} />, text: 'Aceite', class: 'badge-success' },
            rejected: { icon: <XCircle size={16} />, text: 'Rejeitado', class: 'badge-danger' },
            pending: { icon: <Clock size={16} />, text: 'Pendente', class: 'badge-warning' }
        };

        const badge = styles[status] || styles.pending;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.icon}
                {badge.text}
            </span>
        );
    };

    // ✅ NOVO: Reset page when changing tabs
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // ✅ NOVO: Paginação para Associações Ativas
    const totalPagesActive = Math.ceil(associations.length / itemsPerPage);
    const startIndexActive = (currentPageActive - 1) * itemsPerPage;
    const endIndexActive = startIndexActive + itemsPerPage;
    const paginatedAssociations = associations.slice(startIndexActive, endIndexActive);

    // ✅ NOVO: Paginação para Histórico
    const totalPagesHistory = Math.ceil(requests.length / itemsPerPage);
    const startIndexHistory = (currentPageHistory - 1) * itemsPerPage;
    const endIndexHistory = startIndexHistory + itemsPerPage;
    const paginatedRequests = requests.slice(startIndexHistory, endIndexHistory);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar dados...</p>
            </div>
        );
    }

    return (
        <div className="association-management">
            <header className="page-header">
                <h1>Gestão de Associações</h1>
                <p>Visualize e gerencie as associações trainer-cliente</p>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => handleTabChange('active')}
                >
                    <Users size={18} />
                    Associações Ativas ({associations.length})
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => handleTabChange('history')}
                >
                    <Clock size={18} />
                    Histórico de Pedidos ({requests.length})
                </button>
            </div>

            {/* Conteúdo */}
            <div className="tab-content">
                {activeTab === 'active' ? (
                    // Associações Ativas
                    <div className="associations-list">
                        {associations.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <h3>Nenhuma associação ativa</h3>
                                <p>Ainda não há clientes associados a trainers.</p>
                            </div>
                        ) : (
                            <>
                                <div className="cards-grid">
                                    {paginatedAssociations.map((assoc) => (
                                        <div key={assoc._id} className="association-card glass">
                                            <div className="card-header">
                                                <div className="client-info">
                                                    <img
                                                        src={assoc.client.avatar || `https://ui-avatars.com/api/?name=${assoc.client.firstName}+${assoc.client.lastName}`}
                                                        alt={assoc.client.firstName}
                                                        className="avatar"
                                                    />
                                                    <div>
                                                        <h3>{assoc.client.firstName} {assoc.client.lastName}</h3>
                                                        <p className="email">{assoc.client.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="association-arrow">→</div>

                                            <div className="trainer-info">
                                                <img
                                                    src={assoc.trainer.avatar || `https://ui-avatars.com/api/?name=${assoc.trainer.firstName}+${assoc.trainer.lastName}`}
                                                    alt={assoc.trainer.firstName}
                                                    className="avatar"
                                                />
                                                <div>
                                                    <h4>{assoc.trainer.firstName} {assoc.trainer.lastName}</h4>
                                                    <p className="email">{assoc.trainer.email}</p>
                                                    <p className="clients-count">
                                                        {assoc.trainer.clientCount || 0} clientes
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <span className="date">
                                                    Desde: {new Date(assoc.associatedAt).toLocaleDateString('pt-PT')}
                                                </span>
                                                <button
                                                    className="btn-remove"
                                                    onClick={() => handleRemoveAssociation(assoc.client._id, assoc.trainer.firstName)}
                                                >
                                                    <Trash2 size={16} />
                                                    Remover
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ✅ NOVO: Paginação Associações Ativas */}
                                {associations.length > 0 && (
                                    <div className="pagination-wrapper">
                                        <Pagination
                                            currentPage={currentPageActive}
                                            totalPages={totalPagesActive}
                                            onPageChange={setCurrentPageActive}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    // Histórico de Pedidos
                    <div className="requests-history">
                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={48} />
                                <h3>Nenhum pedido registado</h3>
                                <p>O histórico de pedidos aparecerá aqui.</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-container glass">
                                    <table className="requests-table">
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>Trainer</th>
                                                <th>Motivo</th>
                                                <th>Data</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedRequests.map((req) => (
                                                <tr key={req._id}>
                                                    <td>
                                                        <div className="user-cell">
                                                            <img
                                                                src={req.client?.avatar || `https://ui-avatars.com/api/?name=${req.client?.firstName}`}
                                                                alt={req.client?.firstName}
                                                                className="avatar-small"
                                                            />
                                                            <span>{req.client?.firstName} {req.client?.lastName}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="user-cell">
                                                            <img
                                                                src={req.trainer?.avatar || `https://ui-avatars.com/api/?name=${req.trainer?.firstName}`}
                                                                alt={req.trainer?.firstName}
                                                                className="avatar-small"
                                                            />
                                                            <span>{req.trainer?.firstName} {req.trainer?.lastName}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="reason" title={req.reason}>
                                                            {req.reason?.substring(0, 50)}{req.reason?.length > 50 ? '...' : ''}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(req.createdAt).toLocaleDateString('pt-PT')}</td>
                                                    <td>{getStatusBadge(req.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ✅ NOVO: Paginação Histórico */}
                                {requests.length > 0 && (
                                    <div className="pagination-wrapper">
                                        <Pagination
                                            currentPage={currentPageHistory}
                                            totalPages={totalPagesHistory}
                                            onPageChange={setCurrentPageHistory}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .association-management {
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

                .tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid var(--border-color);
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.5rem;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .tab:hover {
                    color: var(--text-primary);
                }

                .tab.active {
                    color: var(--accent-primary);
                    border-bottom-color: var(--accent-primary);
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                /* ✅ NOVO: Pagination wrapper */
                .pagination-wrapper {
                    margin-top: 2rem;
                }

                .association-card {
                    padding: 1.5rem;
                    border-radius: 1rem;
                }

                .card-header {
                    margin-bottom: 1rem;
                }

                .client-info, .trainer-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .trainer-info {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-radius: 0.5rem;
                }

                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .avatar-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .client-info h3, .trainer-info h4 {
                    margin: 0;
                    font-size: 1.1rem;
                }

                .email {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin: 0.25rem 0 0 0;
                }

                .clients-count {
                    color: var(--accent-primary);
                    font-size: 0.875rem;
                    margin: 0.25rem 0 0 0;
                }

                .association-arrow {
                    text-align: center;
                    font-size: 1.5rem;
                    color: var(--accent-primary);
                    margin: 0.5rem 0;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .date {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .btn-remove {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.875rem;
                }

                .btn-remove:hover {
                    background: #ef4444;
                    color: white;
                }

                .table-container {
                    overflow-x: auto;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    margin-bottom: 1rem;
                }

                .requests-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .requests-table th {
                    text-align: left;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    font-weight: 600;
                    border-bottom: 2px solid var(--border-color);
                }

                .requests-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .reason {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .badge-success {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                }

                .badge-danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .badge-warning {
                    background: rgba(251, 191, 36, 0.1);
                    color: #fbbf24;
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
                    .association-management {
                        padding: 1rem;
                    }

                    .cards-grid {
                        grid-template-columns: 1fr;
                    }

                    .tabs {
                        overflow-x: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default AssociationManagement;