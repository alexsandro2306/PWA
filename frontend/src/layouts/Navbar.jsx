import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { getAvatarUrl } from '../utils/imageUtils';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="navbar glass">
            <div className="search-placeholder"></div>
            <div className="nav-actions">
                <button className="icon-btn" onClick={toggleTheme} title="Alternar Tema">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <div className="user-profile">
                    <div className="avatar">
                        {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt="Avatar" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <div className="user-info">
                        <span className="name">{user?.firstName} {user?.lastName}</span>
                        <span className="role">{user?.role}</span>
                    </div>
                </div>
                <button className="icon-btn logout" onClick={logout} title="Sair">
                    <LogOut size={20} />
                </button>
            </div>

            <style>{`
        .navbar {
          height: 64px;
          margin: 1rem 1rem 1rem 300px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
        }
        .nav-actions { display: flex; align-items: center; gap: 1.5rem; }
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          padding: 0.5rem;
          border-radius: 0.5rem;
        }
        .icon-btn:hover { background: var(--bg-primary); }
        .icon-btn.logout:hover { color: #ef4444; }
        .user-profile { display: flex; align-items: center; gap: 0.75rem; }
        .avatar {
          width: 32px;
          height: 32px;
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Ensure image stays round */
        }
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .user-info { display: flex; flex-direction: column; line-height: 1.2; }
        .user-info .name { font-weight: 600; font-size: 0.9rem; }
        .user-info .role { font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; }
      `}</style>
        </header>
    );
};

export default Navbar;
