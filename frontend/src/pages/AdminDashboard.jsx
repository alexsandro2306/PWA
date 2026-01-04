import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, UserCheck, UserX, ClipboardList, Activity, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTrainers: 0,
        pendingTrainers: 0,
        pendingRequests: 0,
        totalClients: 0
    });
    const [loading, setLoading] = useState(true);

    // ✅ PAGINAÇÃO: Estados (fixo em 5 por página)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const [showUserModal, setShowUserModal] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [userTab, setUserTab] = useState('client');

    const fetchAllUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setAllUsers(res.data.data);
            setShowUserModal(true);
            setCurrentPage(1); // Reset to first page
        } catch (err) {
            console.error('Erro ao listar utilizadores:', err);
            alert('Erro ao carregar lista de utilizadores.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem a certeza que deseja apagar este utilizador? Esta ação é irreversível.')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchAllUsers();
            fetchStats();
        } catch (err) {
            alert('Erro ao apagar utilizador.');
        }
    };

    if (loading) return <div>Carregando dashboard...</div>;

    const statCards = [
        {
            icon: <Users size={24} />,
            label: 'Total Utilizadores',
            value: stats.totalUsers,
            color: 'var(--accent-primary)',
            onClick: fetchAllUsers,
            cursor: 'pointer'
        },
        {
            icon: <UserCheck size={24} />,
            label: 'Trainers Ativos',
            value: stats.activeTrainers,
            color: '#10b981',
            onClick: () => navigate('/admin/trainers'),
            cursor: 'pointer'
        },
        {
            icon: <UserX size={24} />,
            label: 'Trainers Pendentes',
            value: stats.pendingTrainers,
            color: '#f59e0b',
            alert: stats.pendingTrainers > 0,
            onClick: () => navigate('/admin/trainers'),
            cursor: 'pointer'
        },
        {
            icon: <ClipboardList size={24} />,
            label: 'Pedidos Pendentes',
            value: stats.pendingRequests,
            color: '#ef4444',
            alert: stats.pendingRequests > 0,
            onClick: () => navigate('/admin/requests'),
            cursor: 'pointer'
        },
    ];

    // ✅ NOVO: Lógica de paginação
    const filteredUsers = allUsers.filter(u => u.role === userTab);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // ✅ NOVO: Reset page when changing tabs
    const handleTabChange = (tab) => {
        setUserTab(tab);
        setCurrentPage(1);
    };

    return (
        <div className="admin-dashboard animate-fade">
            <header className="dashboard-header">
                <h2>Painel de Administração</h2>
                <p>Visão geral do sistema e tarefas pendentes.</p>
            </header>

            <div className="stats-grid">
                {statCards.map((stat, idx) => (
                    <div
                        key={idx}
                        className="glass stat-card"
                        onClick={stat.onClick}
                        style={{ cursor: stat.cursor || 'default' }}
                    >
                        <div className="stat-icon" style={{ background: stat.color, boxShadow: stat.alert ? `0 0 10px ${stat.color}` : 'none' }}>
                            {React.cloneElement(stat.icon, { color: 'white' })}
                        </div>
                        <div className="stat-content">
                            <h3>{stat.value}</h3>
                            <span>{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <section className="dashboard-section mt-4 glass">
                <div className="section-title">
                    <Activity size={20} />
                    <h3>Atividade Recente</h3>
                </div>
                <div className="activity-list">
                    <p className="empty-msg">Nenhuma atividade recente registada.</p>
                </div>
            </section>

            {/* ✅ ATUALIZADO: User List Modal with Pagination */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Todos os Utilizadores</h3>
                            <button className="close-btn" onClick={() => setShowUserModal(false)}>X</button>
                        </div>

                        <div className="tabs">
                            <button
                                className={`tab ${userTab === 'client' ? 'active' : ''}`}
                                onClick={() => handleTabChange('client')}
                            >
                                Clientes ({allUsers.filter(u => u.role === 'client').length})
                            </button>
                            <button
                                className={`tab ${userTab === 'trainer' ? 'active' : ''}`}
                                onClick={() => handleTabChange('trainer')}
                            >
                                Trainers ({allUsers.filter(u => u.role === 'trainer').length})
                            </button>
                        </div>

                        <div className="user-list">
                            {paginatedUsers.length > 0 ? (
                                <table className="user-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.map(user => (
                                            <tr key={user._id}>
                                                <td>{user.firstName} {user.lastName}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`status-badge ${user.isValidated ? 'success' : 'warning'}`}>
                                                        {user.isValidated ? 'Ativo' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-mini danger"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id); }}
                                                            title="Apagar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-msg">Nenhum utilizador encontrado.</p>
                            )}
                        </div>

                        {/* ✅ PAGINAÇÃO (sempre visível) */}
                        {filteredUsers.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredUsers.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .admin-dashboard { display: flex; flex-direction: column; gap: 2rem; }
                .action-buttons { display: flex; gap: 0.5rem; }
                .btn-mini { border: none; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: white; }
                .btn-mini.warn { background: #f59e0b; }
                .btn-mini.success { background: #10b981; }
                .btn-mini.danger { background: #ef4444; }
                .btn-mini:hover { opacity: 0.9; transform: scale(1.05); }

                .dashboard-header h2 { margin-bottom: 0.5rem; }
                .dashboard-header p { color: var(--text-secondary); }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
                .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; transition: transform 0.2s; }
                .stat-card:hover { transform: translateY(-5px); }
                
                .stat-icon { width: 56px; height: 56px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; }
                .stat-content h3 { font-size: 2rem; margin: 0; line-height: 1; }
                .stat-content span { color: var(--text-secondary); font-size: 0.9rem; }
                
                .dashboard-section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .section-title { display: flex; align-items: center; gap: 0.75rem; color: var(--accent-primary); }
                .section-title h3 { margin: 0; font-size: 1.2rem; }
                .empty-msg { color: var(--text-secondary); font-style: italic; text-align: center; padding: 2rem; }
                .mt-4 { margin-top: 2rem; }

                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
                .modal-content { width: 90%; max-width: 900px; max-height: 85vh; padding: 0; border-radius: 1rem; background: var(--bg-secondary); display: flex; flex-direction: column; overflow: hidden; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color); }
                .modal-header h3 { margin: 0; }
                .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-secondary); transition: color 0.2s; }
                .close-btn:hover { color: var(--text-primary); }
                
                .tabs { display: flex; gap: 0; padding: 0 2rem; border-bottom: 1px solid var(--border-color); }
                .tab { background: none; border: none; padding: 1rem 1.5rem; cursor: pointer; color: var(--text-secondary); border-bottom: 2px solid transparent; font-weight: 500; transition: all 0.2s; }
                .tab:hover { color: var(--text-primary); }
                .tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
                
                .user-list { overflow-y: auto; flex: 1; padding: 0 2rem; }
                .user-table { width: 100%; border-collapse: collapse; text-align: left; }
                .user-table th, .user-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); }
                .user-table th { color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; background: var(--bg-primary); position: sticky; top: 0; z-index: 1; }
                .user-table tbody tr { transition: background 0.2s; }
                .user-table tbody tr:hover { background: var(--bg-primary); }
                .status-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
                .status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;