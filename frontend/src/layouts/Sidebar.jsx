import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    Users,
    Calendar,
    MessageSquare,
    ShieldCheck,
    UserCircle,
    ClipboardList,
    Dumbbell,
    Search,
    Bell
} from 'lucide-react';

import api from '../services/api';

const Sidebar = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);

    React.useEffect(() => {
        if (!user || user.role === 'admin') return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get('/messages/unread');
                setUnreadCount(res.data.data?.length || 0);
            } catch (err) {
                console.error("Silent poll error", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [user]);

    // ✅ Buscar notificações não lidas
    React.useEffect(() => {
        if (!user || user.role !== 'client') return;

        const fetchUnreadNotifications = async () => {
            try {
                const res = await api.get('/notifications'); // ✅ CORRIGIDO
                const unread = res.data.data?.filter(n => !n.isRead).length || 0;
                setUnreadNotifications(unread);
            } catch (err) {
                console.error("Erro ao buscar notificações", err);
            }
        };

        fetchUnreadNotifications();
        const interval = setInterval(fetchUnreadNotifications, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const menuItems = [
        // Admin Menu
        { icon: <Home size={20} />, label: 'Dashboard', path: '/admin', roles: ['admin'], end: true },
        { icon: <ShieldCheck size={20} />, label: 'Gestão Trainers', path: '/admin/trainers', roles: ['admin'], end: true },
        { icon: <ClipboardList size={20} />, label: 'Pedidos Mudança', path: '/admin/requests', roles: ['admin'], end: true },
        { icon: <Users size={20} />, label: 'Associações', path: '/admin/associations', roles: ['admin'], end: true },

        // Trainer Menu
        { icon: <Home size={20} />, label: 'Início', path: '/', roles: ['trainer'], end: true },
        { icon: <Users size={20} />, label: 'Meus Clientes', path: '/trainer/clients', roles: ['trainer'], end: true },
        { icon: <Dumbbell size={20} />, label: 'Exercícios', path: '/trainer/exercises', roles: ['trainer'], end: true },

        // Client Menu
        { icon: <Home size={20} />, label: 'Início', path: '/', roles: ['client'], end: true },
        { icon: <Calendar size={20} />, label: 'Meus Treinos', path: '/client', roles: ['client'], end: true },

        // ✅ Notificações (só para clientes)
        {
            icon: (
                <div style={{ position: 'relative' }}>
                    <Bell size={20} />
                    {unreadNotifications > 0 && <span className="nav-badge"></span>}
                </div>
            ),
            label: 'Notificações',
            path: '/notifications',
            roles: ['client'],
            end: true
        },

        // ✅ Link para ver trainers na dashboard (só aparece se NÃO tiver trainer)
        {
            icon: <Search size={20} />,
            label: 'Procurar Trainer',
            path: '/dashboard/trainers',
            roles: ['client'],
            end: true,
            condition: (u) => !u.trainer
        },

        // Shared (Trainer + Client only)
        {
            icon: (
                <div style={{ position: 'relative' }}>
                    <MessageSquare size={20} />
                    {unreadCount > 0 && <span className="nav-badge"></span>}
                </div>
            ),
            label: 'Chat',
            path: '/chat',
            roles: ['trainer', 'client'],
            end: false
        },

        // Shared (All)
        { icon: <UserCircle size={20} />, label: 'Perfil', path: '/profile', roles: ['admin', 'trainer', 'client'], end: true },
    ];

    const filteredMenu = menuItems.filter(item => {
        // Verificar role
        if (!item.roles.includes(user?.role)) return false;

        // Verificar condição adicional (se existir)
        if (item.condition && !item.condition(user)) return false;

        // Hide specific trainer links if not validated
        if (user?.role === 'trainer' && !user.isValidated) {
            if (['/trainer/clients', '/trainer/exercises', '/chat', '/'].includes(item.path)) return false;
        }
        return true;
    });

    return (
        <aside className="sidebar glass">
            <div className="logo">
                <h2>Fitness+</h2>
            </div>
            <nav>
                {filteredMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <style>{`
        .sidebar {
          width: 260px;
          height: calc(100vh - 2rem);
          margin: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
        }
        .logo { margin-bottom: 3rem; text-align: center; color: var(--accent-primary); }
        nav { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          text-decoration: none;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          transition: var(--transition);
        }
        .nav-item:hover { background: var(--glass-bg); color: var(--text-primary); }
        .nav-item.active { background: var(--accent-primary); color: white; }
        .nav-badge { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 1px solid var(--bg-secondary); }
      `}</style>
        </aside>
    );
};

export default Sidebar;