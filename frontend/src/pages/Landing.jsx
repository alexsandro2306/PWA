import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MessageCircle, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <Navbar />

            {/* Hero */}
            <section className="hero">
                <h1>Transforme os Seus Objetivos Fitness</h1>
                <p>Conecte-se com personal trainers e alcance os seus objetivos</p>
                <div className="hero-buttons">
                    <button onClick={() => navigate('/register')} className="btn-primary">
                        Começar Agora
                    </button>
                    <button onClick={() => navigate('/trainers-public')} className="btn-secondary">
                        Ver Personal Trainers
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="features">
                <h2>Como Funciona</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <Users size={40} />
                        <h3>Escolha o Seu Trainer</h3>
                        <p>Navegue pela lista de trainers certificados</p>
                    </div>
                    <div className="feature-card">
                        <Calendar size={40} />
                        <h3>Receba Planos</h3>
                        <p>Planos de treino personalizados</p>
                    </div>
                    <div className="feature-card">
                        <TrendingUp size={40} />
                        <h3>Acompanhe Progresso</h3>
                        <p>Veja estatísticas e evolução</p>
                    </div>
                    <div className="feature-card">
                        <MessageCircle size={40} />
                        <h3>Chat Direto</h3>
                        <p>Comunique com o seu trainer</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2025 FitTrainer - Plataforma de Personal Trainers</p>
                <div className="footer-links">
                    <button onClick={() => navigate('/trainers-public')}>Personal Trainers</button>
                    <button onClick={() => navigate('/login')}>Entrar</button>
                    <button onClick={() => navigate('/register')}>Registar</button>
                </div>
            </footer>

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .landing-page {
                    min-height: 100vh;
                    background: linear-gradient(to bottom, #1a2332 0%, #0f1419 100%);
                    color: white;
                }

                /* Hero Section */
                .hero {
                    text-align: center;
                    padding: 8rem 2rem 6rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .hero h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(to right, white, rgba(255, 255, 255, 0.8));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero p {
                    font-size: 1.35rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 3rem;
                    line-height: 1.6;
                }

                .hero-buttons {
                    display: flex;
                    gap: 1.5rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn-primary {
                    background: #60a5fa;
                    color: white;
                    border: none;
                    padding: 1rem 2.5rem;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-primary:hover {
                    background: #3b82f6;
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
                }

                .btn-secondary {
                    background: transparent;
                    color: #60a5fa;
                    border: 2px solid #60a5fa;
                    padding: 1rem 2.5rem;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-secondary:hover {
                    background: #60a5fa;
                    color: white;
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
                }

                /* Features Section */
                .features {
                    padding: 6rem 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .features h2 {
                    text-align: center;
                    font-size: 2.5rem;
                    margin-bottom: 4rem;
                    background: linear-gradient(to right, white, rgba(255, 255, 255, 0.8));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 2.5rem;
                }

                .feature-card {
                    background: rgba(26, 35, 50, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 2.5rem;
                    border-radius: 16px;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    transform: translateY(-8px);
                    background: rgba(26, 35, 50, 0.8);
                    border-color: rgba(96, 165, 250, 0.3);
                    box-shadow: 0 8px 32px rgba(96, 165, 250, 0.2);
                }

                .feature-card svg {
                    color: #60a5fa;
                    margin-bottom: 1.5rem;
                }

                .feature-card h3 {
                    font-size: 1.4rem;
                    margin-bottom: 1rem;
                    color: white;
                }

                .feature-card p {
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                }

                /* Footer */
                .footer {
                    padding: 3rem 2rem;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .footer p {
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 1.5rem;
                }

                .footer-links {
                    display: flex;
                    gap: 2rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .footer-links button {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.95rem;
                }

                .footer-links button:hover {
                    color: #60a5fa;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .hero {
                        padding: 5rem 1.5rem 4rem;
                    }

                    .hero h1 {
                        font-size: 2.5rem;
                    }

                    .hero p {
                        font-size: 1.1rem;
                    }

                    .hero-buttons {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .features h2 {
                        font-size: 2rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

        </div>
    );
};

export default Landing;