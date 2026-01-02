import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Star,
  Send,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Phone
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/imageUtils';

const TrainersListDashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    filterAndSortTrainers();
  }, [trainers, searchTerm, sortBy]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/trainers?validated=true');
      setTrainers(response.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar trainers:', error);
      addNotification('error', 'Erro ao carregar trainers');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrainers = () => {
    let result = [...trainers];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(trainer =>
        trainer.name?.toLowerCase().includes(search) ||
        trainer.firstName?.toLowerCase().includes(search) ||
        trainer.lastName?.toLowerCase().includes(search) ||
        trainer.email?.toLowerCase().includes(search) ||
        trainer.specialization?.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
          const nameB = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
          return nameA.localeCompare(nameB);
        case 'clients':
          return (b.clientCount || 0) - (a.clientCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredTrainers(result);
    setCurrentPage(1);
  };

  const handleSendRequest = async (trainerId) => {
    try {
      setSendingRequest(trainerId);
      await api.post('/requests', {
        trainerId,
        type: 'association'
      });
      addNotification('success', '✅ Pedido enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      addNotification('error', error.response?.data?.message || 'Erro ao enviar pedido');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleContact = async (trainerId) => {
    try {
      // Criar ou obter conversa existente
      await api.post('/messages/conversations', { recipientId: trainerId });

      // Redirecionar para o chat
      window.location.href = '/dashboard/chat';
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);

      // Mesmo com erro, tenta abrir o chat
      // (a conversa pode já existir)
      window.location.href = '/dashboard/chat';
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTrainers = filteredTrainers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="trainers-page">
      <div className="trainers-container">

        {/* Header */}
        <div className="page-header">
          <h1>Procurar Personal Trainer</h1>
          <p>{trainers.length} trainer{trainers.length !== 1 ? 's' : ''} disponíve{trainers.length !== 1 ? 'is' : 'l'}</p>
        </div>

        {/* Search & Filters */}
        <div className="search-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou especialização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={clearSearch}>
                <X size={18} />
              </button>
            )}
          </div>

          <div className="filters-wrapper">
            <button
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              Filtros
            </button>

            {showFilters && (
              <div className="filters-dropdown">
                <label>Ordenar por:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="name">Nome (A-Z)</option>
                  <option value="clients">Mais Clientes</option>
                  <option value="rating">Melhor Avaliação</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="results-count">
          <p>
            {filteredTrainers.length === trainers.length
              ? `${trainers.length} resultado${trainers.length !== 1 ? 's' : ''}`
              : `${filteredTrainers.length} de ${trainers.length} resultado${trainers.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>A carregar trainers...</p>
          </div>
        ) : currentTrainers.length === 0 ? (
          /* Empty */
          <div className="empty-state">
            <Users size={64} />
            <h3>Nenhum trainer encontrado</h3>
            <p>Tenta ajustar a tua pesquisa</p>
            {searchTerm && (
              <button className="btn-clear" onClick={clearSearch}>
                Limpar Pesquisa
              </button>
            )}
          </div>
        ) : (
          /* Grid */
          <div className="trainers-grid">
            {currentTrainers.map((trainer) => (
              <div key={trainer._id} className="trainer-card">

                {/* Avatar */}
                <div className="card-avatar">
                  {trainer.avatar ? (
                    <img
                      src={getAvatarUrl(trainer.avatar)}
                      alt={trainer.name}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {(trainer.name || trainer.firstName || 'T').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="verified-badge">
                    <CheckCircle2 size={14} />
                  </div>
                </div>

                {/* Nome e Telefone */}
                <div className="trainer-name-section">
                  <h3>{trainer.name || `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Trainer'}</h3>
                  {trainer.email && (
                    <p className="trainer-contact">
                      📧 {trainer.email}
                    </p>
                  )}
                  {trainer.phone && (
                    <p className="trainer-contact">
                      📱 {trainer.phone}
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="card-content">
                  {trainer.specialization && (
                    <p className="specialization">
                      <Star size={14} />
                      {trainer.specialization}
                    </p>
                  )}

                  {trainer.bio && (
                    <p className="bio">{trainer.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="stats">
                    <div className="stat">
                      <Users size={16} />
                      <span>{trainer.clientCount || 0} cliente{trainer.clientCount !== 1 ? 's' : ''}</span>
                    </div>

                    {trainer.rating && (
                      <div className="stat">
                        <Star size={16} className="star-icon" />
                        <span>{trainer.rating.toFixed(1)} / 5.0</span>
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  {trainer.certifications && trainer.certifications.length > 0 && (
                    <div className="certifications">
                      {trainer.certifications.slice(0, 2).map((cert, idx) => (
                        <span key={idx} className="cert-badge">
                          <Award size={12} />
                          {cert}
                        </span>
                      ))}
                      {trainer.certifications.length > 2 && (
                        <span className="cert-badge">+{trainer.certifications.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button
                    onClick={() => handleContact(trainer._id)}
                    className="btn-secondary"
                  >
                    <MessageCircle size={18} />
                    Contactar
                  </button>

                  <button
                    onClick={() => handleSendRequest(trainer._id)}
                    disabled={sendingRequest === trainer._id || user?.trainerId === trainer._id}
                    className={`btn-primary ${user?.trainerId === trainer._id ? 'disabled' : ''}`}
                  >
                    {sendingRequest === trainer._id ? (
                      <>
                        <div className="btn-spinner"></div>
                        Enviando...
                      </>
                    ) : user?.trainerId === trainer._id ? (
                      'Teu Trainer'
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-num ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .trainers-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 2rem;
        }

        .trainers-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header */
        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Search */
        .search-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 300px;
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

        .search-bar svg {
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
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .filters-wrapper {
          position: relative;
        }

        .filter-btn {
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

        .filter-btn:hover,
        .filter-btn.active {
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
          min-width: 250px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 100;
        }

        .filters-dropdown label {
          display: block;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .filters-dropdown select {
          width: 100%;
          padding: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .filters-dropdown select:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .results-count {
          margin-bottom: 1.5rem;
        }

        .results-count p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Loading */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
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

        .loading-state p {
          color: var(--text-secondary);
        }

        /* Empty */
        .empty-state {
          text-align: center;
          padding: 6rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          margin-bottom: 2rem;
        }

        .btn-clear {
          padding: 0.75rem 1.5rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-clear:hover {
          background: var(--accent-hover);
        }

        /* Grid */
        .trainers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        /* Card */
        .trainer-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .trainer-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .card-avatar {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          position: relative;
        }

        .card-avatar img,
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-primary);
        }

        .avatar-placeholder {
          background: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
        }

        .verified-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 2px solid var(--bg-secondary);
        }

        /* Nome e Telefone */
        .trainer-name-section {
          text-align: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .trainer-name-section h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .trainer-contact {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0.25rem 0;
        }

        .card-content {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .specialization {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          color: var(--accent-primary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .bio {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .stat svg {
          color: var(--accent-primary);
        }

        .stat .star-icon {
          color: #fbbf24;
        }

        .certifications {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cert-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-primary);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
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

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 3rem;
        }

        .pagination-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        .pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 0.5rem;
        }

        .pagination-num {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .pagination-num:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--accent-primary);
        }

        .pagination-num.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .trainers-page {
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

export default TrainersListDashboard;