import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, Trash2, Calendar } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ClientNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications'); // ✅ CORRIGIDO
            setNotifications(res.data.data || []);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            addNotification('error', 'Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            addNotification('error', 'Erro ao marcar como lida');
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm('Apagar esta notificação?')) return;

        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            addNotification('success', 'Notificação apagada');
        } catch (error) {
            addNotification('error', 'Erro ao apagar notificação');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all'); // ✅ CORRIGIDO
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            addNotification('success', 'Todas marcadas como lidas');
        } catch (error) {
            addNotification('error', 'Erro ao marcar todas como lidas');
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) return <div>Carregando notificações...</div>;

    return (
        <div className="notifications-page animate-fade">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Notificações</h1>
                        <p>Fique a par de todas as suas atualizações</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            className="btn-mark-all"
                            onClick={markAllAsRead}
                        >
                            <Check size={18} />
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
                {unreadCount > 0 && (
                    <div className="unread-badge">
                        {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                    </div>
                )}
            </header>

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="glass empty-state">
                        <Bell size={64} color="var(--text-secondary)" />
                        <h3>Nenhuma notificação</h3>
                        <p>Quando tiver novidades, elas aparecerão aqui</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif._id}
                            className={`glass notification-card ${notif.isRead ? 'read' : 'unread'}`}
                        >
                            <div className="notif-indicator">
                                {!notif.isRead && <div className="unread-dot" />}
                            </div>

                            <div className="notif-icon">
                                <Bell size={20} />
                            </div>

                            <div className="notif-content">
                                <h4>{notif.title}</h4>
                                <p>{notif.message}</p>
                                <div className="notif-meta">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(notif.createdAt).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="notif-actions">
                                {!notif.isRead && (
                                    <button
                                        className="btn-icon-small"
                                        onClick={() => markAsRead(notif._id)}
                                        title="Marcar como lida"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                <button
                                    className="btn-icon-small delete"
                                    onClick={() => deleteNotification(notif._id)}
                                    title="Apagar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .notifications-page {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .page-header {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 2rem;
                }

                .header-content h1 {
                    margin: 0 0 0.5rem 0;
                }

                .header-content p {
                    margin: 0;
                    color: var(--text-secondary);
                }

                .btn-mark-all {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-mark-all:hover {
                    background: var(--accent-hover);
                    transform: translateY(-2px);
                }

                .unread-badge {
                    display: inline-flex;
                    padding: 0.5rem 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 2rem;
                    color: var(--accent-primary);
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .notifications-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .empty-state h3 {
                    margin: 0;
                    color: var(--text-primary);
                }

                .empty-state p {
                    margin: 0;
                    color: var(--text-secondary);
                }

                .notification-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.5rem;
                    transition: all 0.2s;
                    position: relative;
                }

                .notification-card.unread {
                    background: rgba(59, 130, 246, 0.05);
                    border-left: 3px solid var(--accent-primary);
                }

                .notification-card.read {
                    opacity: 0.7;
                }

                .notif-indicator {
                    width: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                }

                .notif-icon {
                    width: 40px;
                    height: 40px;
                    background: var(--bg-primary);
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--accent-primary);
                    flex-shrink: 0;
                }

                .notif-content {
                    flex: 1;
                }

                .notif-content h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1rem;
                    color: var(--text-primary);
                }

                .notif-content p {
                    margin: 0 0 0.75rem 0;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                .notif-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                }

                .notif-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }

                .btn-icon-small {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-icon-small:hover {
                    background: var(--bg-primary);
                    color: var(--accent-primary);
                    border-color: var(--accent-primary);
                }

                .btn-icon-small.delete:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: #ef4444;
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .btn-mark-all {
                        width: 100%;
                        justify-content: center;
                    }

                    .notification-card {
                        padding: 1rem;
                    }

                    .notif-icon {
                        width: 36px;
                        height: 36px;
                    }

                    .notif-content h4 {
                        font-size: 0.95rem;
                    }

                    .notif-content p {
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClientNotifications;