import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Star,
  Users,
  Award,
  MessageCircle,
  Send,
  AlertCircle,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const TrainersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'clients', 'recent'
  const [showFilters, setShowFilters] = useState(false);

  const isAuthenticated = !!user;
  const isClient = user?.role === 'client';

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    filterAndSortTrainers();
  }, [trainers, searchTerm, sortBy]);

  const fetchTrainers = async () => {
    try {
      const response = await api.get('/trainers/public');
      setTrainers(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar trainers:', error);
      addNotification('error', 'Erro ao carregar lista de trainers');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrainers = () => {
    let result = [...trainers];

    // Filtrar por pesquisa
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(trainer =>
        `${trainer.firstName} ${trainer.lastName}`.toLowerCase().includes(search) ||
        trainer.email.toLowerCase().includes(search) ||
        trainer.username?.toLowerCase().includes(search)
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'name':
        result.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        break;
      case 'clients':
        result.sort((a, b) => (b.clientCount || 0) - (a.clientCount || 0));
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredTrainers(result);
  };

  const handleSendRequest = async (trainerId) => {
    if (!isAuthenticated) {
      addNotification('info', 'Precisa de criar conta para enviar um pedido');
      navigate('/register');
      return;
    }

    if (!isClient) {
      addNotification('warning', 'Apenas clientes podem enviar pedidos');
      return;
    }

    if (user?.trainer) {
      addNotification('warning', 'Já tens um Personal Trainer associado. Para mudares, contacta o administrador.');
      setShowModal(false);
      return;
    }

    if (!reason.trim()) {
      addNotification('warning', 'Por favor, indica o motivo do pedido');
      return;
    }

    try {
      await api.post('/requests', {
        trainer: trainerId,
        reason
      });

      addNotification('success', 'Pedido enviado com sucesso!');
      setShowModal(false);
      setReason('');
      setSelectedTrainer(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erro ao enviar pedido';
      addNotification('error', errorMsg);
    }
  };

  const openRequestModal = (trainer) => {
    if (!isAuthenticated) {
      addNotification('info', 'Crie uma conta para enviar um pedido');
      navigate('/register');
      return;
    }

    if (!isClient) {
      addNotification('warning', 'Apenas clientes podem enviar pedidos');
      return;
    }

    if (user?.trainer) {
      addNotification('warning', 'Já tens um Personal Trainer associado!');
      return;
    }

    setSelectedTrainer(trainer);
    setShowModal(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
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
    <div className="trainers-search-page">
      <div className="trainers-container">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1>Procurar Personal Trainer</h1>
            <p>{trainers.length} trainer{trainers.length !== 1 ? 's' : ''} validado{trainers.length !== 1 ? 's' : ''}</p>
          </div>
        </header>

        {/* Aviso se não autenticado */}
        {!isAuthenticated && (
          <div className="info-banner">
            <AlertCircle size={20} />
            <div>
              <strong>Quer enviar um pedido?</strong>
              <p>Faça <span onClick={() => navigate('/login')}>login</span> ou <span onClick={() => navigate('/register')}>registe-se</span> para contactar um trainer.</p>
            </div>
          </div>
        )}

        {/* Aviso se já tiver trainer */}
        {isClient && user?.trainer && (
          <div className="info-banner warning">
            <AlertCircle size={20} />
            <div>
              <strong>Já tens um trainer associado!</strong>
              <p>Para mudar de trainer, contacta o administrador.</p>
            </div>
          </div>
        )}

        {/* Barra de Pesquisa e Filtros */}
        <div className="search-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={clearSearch}>
                <X size={18} />
              </button>
            )}
          </div>

          <div className="filters-section">
            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              Filtros
            </button>

            {showFilters && (
              <div className="filters-dropdown">
                <div className="filter-group">
                  <label>
                    <ArrowUpDown size={16} />
                    Ordenar por:
                  </label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Nome (A-Z)</option>
                    <option value="clients">Mais Clientes</option>
                    <option value="recent">Mais Recentes</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="results-info">
          <p>
            {filteredTrainers.length === trainers.length
              ? `${trainers.length} trainer${trainers.length !== 1 ? 's' : ''} encontrado${trainers.length !== 1 ? 's' : ''}`
              : `${filteredTrainers.length} de ${trainers.length} trainer${trainers.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Grid de Trainers */}
        {filteredTrainers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Nenhum trainer encontrado</h3>
            <p>Tente ajustar os filtros ou a pesquisa.</p>
            {searchTerm && (
              <button className="btn-clear" onClick={clearSearch}>
                Limpar Pesquisa
              </button>
            )}
          </div>
        ) : (
          <div className="trainers-grid">
            {filteredTrainers.map((trainer) => (
              <div key={trainer._id} className="trainer-card glass">
                <div className="trainer-header">
                  <img
                    src={trainer.avatar || `https://ui-avatars.com/api/?name=${trainer.firstName}+${trainer.lastName}&background=3b82f6&color=fff&size=128`}
                    alt={`${trainer.firstName} ${trainer.lastName}`}
                    className="trainer-avatar"
                  />
                  <div className="trainer-info">
                    <h3>{trainer.firstName} {trainer.lastName}</h3>
                    <p className="trainer-email">{trainer.email}</p>
                  </div>
                </div>

                <div className="trainer-stats">
                  <div className="stat">
                    <Users size={18} />
                    <span>{trainer.clientCount || 0} cliente{trainer.clientCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="stat">
                    <Award size={18} />
                    <span>Certificado</span>
                  </div>
                  <div className="stat">
                    <Star size={18} />
                    <span>Validado</span>
                  </div>
                </div>

                {trainer.bio && (
                  <p className="trainer-bio">{trainer.bio}</p>
                )}

                <div className="trainer-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => window.location.href = `mailto:${trainer.email}`}
                  >
                    <MessageCircle size={18} />
                    Contactar
                  </button>
                  <button
                    className={`btn-primary ${(isClient && user?.trainer) ? 'disabled' : ''}`}
                    onClick={() => openRequestModal(trainer)}
                    disabled={isClient && user?.trainer}
                  >
                    <Send size={18} />
                    {!isAuthenticated ? 'Enviar Pedido' :
                      (isClient && user?.trainer) ? 'Já tens Trainer' : 'Enviar Pedido'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Pedido */}
        {showModal && selectedTrainer && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Pedido de Associação</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="trainer-preview">
                  <img
                    src={selectedTrainer.avatar || `https://ui-avatars.com/api/?name=${selectedTrainer.firstName}+${selectedTrainer.lastName}`}
                    alt={selectedTrainer.firstName}
                  />
                  <div>
                    <h3>{selectedTrainer.firstName} {selectedTrainer.lastName}</h3>
                    <p>{selectedTrainer.email}</p>
                  </div>
                </div>

                <div className="input-group">
                  <label>Motivo do Pedido</label>
                  <textarea
                    placeholder="Ex: Gostaria de treinar força e hipertrofia..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleSendRequest(selectedTrainer._id)}
                >
                  <Send size={18} />
                  Enviar Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .trainers-search-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 2rem;
        }

        .trainers-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.75rem;
          margin-bottom: 2rem;
        }

        .info-banner.warning {
          background: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
        }

        .info-banner svg {
          color: var(--accent-primary);
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        .info-banner.warning svg {
          color: #fbbf24;
        }

        .info-banner strong {
          display: block;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .info-banner p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .info-banner span {
          color: var(--accent-primary);
          cursor: pointer;
          text-decoration: underline;
        }

        .info-banner span:hover {
          color: var(--accent-hover);
        }

        /* Seção de Pesquisa */
        .search-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 0 1rem;
          transition: all 0.3s;
        }

        .search-bar:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-bar svg:first-child {
          color: var(--text-secondary);
          margin-right: 0.75rem;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 0;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .search-bar input::placeholder {
          color: var(--text-secondary);
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        /* Filtros */
        .filters-section {
          position: relative;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          color: var(--text-primary);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .filter-toggle:hover, .filter-toggle.active {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .filters-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1rem;
          min-width: 280px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 100;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .filter-group select {
          padding: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.95rem;
        }

        .filter-group select:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        /* Resultados */
        .results-info {
          margin-bottom: 1.5rem;
        }

        .results-info p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Grid */
        .trainers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .trainer-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          border-radius: 1rem;
          transition: all 0.3s;
        }

        .trainer-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .trainer-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .trainer-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-primary);
        }

        .trainer-info h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .trainer-email {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }

        .trainer-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat svg {
          color: var(--accent-primary);
        }

        .trainer-bio {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .trainer-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }

        .btn-primary.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          color: var(--accent-primary);
          border: 2px solid var(--accent-primary);
        }

        .btn-secondary:hover {
          background: var(--accent-primary);
          color: white;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .btn-clear {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-clear:hover {
          background: var(--accent-hover);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }

        .modal-content {
          background: var(--bg-secondary);
          border-radius: 1rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-color);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .trainer-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .trainer-preview img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
        }

        .trainer-preview h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .trainer-preview p {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .input-group textarea {
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          resize: vertical;
          font-family: inherit;
        }

        .input-group textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .modal-footer button {
          flex: 1;
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
          .trainers-search-page {
            padding: 1rem;
          }

          .search-section {
            flex-direction: column;
          }

          .search-bar {
            min-width: 100%;
          }

          .trainers-grid {
            grid-template-columns: 1fr;
          }

          .filters-dropdown {
            left: 0;
            right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainersList;