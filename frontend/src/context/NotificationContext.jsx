import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, MessageSquare, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    const addNotification = useCallback((type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useEffect(() => {
        if (user && user.id) {
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', user.id);
            });

            newSocket.on('new_message', (data) => {
                addNotification('message', `Nova mensagem de ${data.sender?.firstName || 'alguém'}`);
            });

            newSocket.on('new_training_plan', (data) => {
                addNotification('success', `Novo plano de treino: ${data.name}`);
            });

            newSocket.on('training_log_created', (data) => {
                addNotification('info', `O atleta ${data.clientName} registou um treino!`);
            });

            newSocket.on('trainer_validated', () => {
                addNotification('success', 'A sua conta foi validada pelo Administrador!');
            });

            newSocket.on('notification', (data) => {
                addNotification('info', data.message || 'Nova notificação recebida');
            });

            return () => newSocket.close();
        }
    }, [user, addNotification]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'message': return <MessageSquare size={20} />;
            case 'info': return <Bell size={20} />;
            default: return <Info size={20} />;
        }
    };

    return (
        <NotificationContext.Provider value={{ addNotification, socket }}>
            {children}
            <div className="notification-container">
                {notifications.map(n => (
                    <div key={n.id} className={`notification glass ${n.type} animate-slide-in-right`}>
                        {getIcon(n.type)}
                        <div className="notif-body">
                            <span>{n.message}</span>
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="close-btn">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
        .notification-container {
          position: fixed;
          top: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 9999;
          max-width: 400px;
        }
        .notification {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border-left: 5px solid var(--accent-primary);
          transition: 0.3s;
        }
        .notification.success { border-left-color: #10b981; color: #064e3b; }
        .notification.error { border-left-color: #ef4444; color: #7f1d1d; }
        .notification.message { border-left-color: var(--accent-secondary); color: var(--text-primary); }
        .notification.info { border-left-color: #3b82f6; color: #1e3a8a; }
        
        .notif-body { flex: 1; }
        .close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; padding: 0.25rem; }
        .notification span { font-size: 0.9rem; font-weight: 600; line-height: 1.4; }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
