import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PendingApproval = () => {
    const { logout } = useAuth();

    return (
        <div className="pending-container animate-fade">
            <div className="glass card">
                <div className="icon-wrapper">
                    <Clock size={48} />
                </div>
                <h2>Conta em Análise</h2>
                <p>
                    O seu registo de Personal Trainer foi criado com sucesso e está aguardar validação por parte de um administrador.
                </p>
                <p className="sub-text">
                    Não poderá realizar nenhuma ação na plataforma até que a sua conta seja aprovada. Por favor, aguarde ou contacte o suporte.
                </p>

                <button onClick={logout} className="btn-logout">
                    <LogOut size={18} /> Terminar Sessão
                </button>
            </div>

            <style>{`
                .pending-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-primary);
                    padding: 1rem;
                }
                .card {
                    padding: 3rem;
                    text-align: center;
                    max-width: 500px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }
                .icon-wrapper {
                    width: 80px;
                    height: 80px;
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                }
                h2 { margin: 0; color: var(--text-primary); }
                p { color: var(--text-secondary); line-height: 1.6; margin: 0; }
                .sub-text { font-size: 0.9rem; opacity: 0.8; }
                
                .btn-logout {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-danger, #ef4444);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: var(--transition);
                }
                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
};

export default PendingApproval;
