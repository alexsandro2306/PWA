import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit,
    Eye,
    Dumbbell,
    MessageCircle,
    Info,
    X,
    ExternalLink,
    Video
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ExerciseManagement = () => {
    const { addNotification } = useNotifications();
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Peito',
        description: '',
        videoLink: ''
    });

    const categories = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio', 'Flexibilidade'];

    useEffect(() => {
        fetchExercises();
    }, [searchTerm, categoryFilter]);

    const fetchExercises = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (categoryFilter) params.category = categoryFilter;

            const res = await api.get('/exercises', { params });
            setExercises(res.data.data);
        } catch (err) {
            addNotification('error', 'Erro ao carregar exercícios');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingExercise) {
                await api.patch(`/exercises/${editingExercise._id}`, formData);
                addNotification('success', 'Exercício atualizado!');
            } else {
                await api.post('/exercises', formData);
                addNotification('success', 'Exercício criado com sucesso!');
            }
            setShowModal(false);
            resetForm();
            fetchExercises();
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao salvar exercício.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja remover este exercício?')) return;
        try {
            await api.delete(`/exercises/${id}`);
            addNotification('success', 'Exercício removido!');
            fetchExercises();
        } catch (err) {
            addNotification('error', 'Erro ao remover exercício.');
        }
    };

    const handleEdit = (ex) => {
        setEditingExercise(ex);
        setFormData({
            name: ex.name,
            category: ex.category || 'Peito',
            description: ex.description || '',
            videoLink: ex.videoLink || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Peito',
            description: '',
            videoLink: ''
        });
        setEditingExercise(null);
    };

    if (loading && exercises.length === 0) return <div className="loading">Carregando biblioteca...</div>;

    return (
        <div className="exercise-mgmt animate-fade">
            <header className="page-header">
                <div>
                    <h1>Biblioteca de Exercícios</h1>
                    <p>Faça a gestão dos exercícios disponíveis no sistema.</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> Novo Exercício
                </button>
            </header>

            <div className="glass filters-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="select-filter">
                    <Filter size={18} />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">Todas as Categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="exercises-grid">
                {exercises.length === 0 ? (
                    <div className="glass empty-state">
                        <Dumbbell size={48} />
                        <p>Nenhum exercício encontrado na biblioteca.</p>
                    </div>
                ) : (
                    exercises.map(ex => (
                        <div key={ex._id} className="glass ex-card">
                            <div className="ex-badge">{ex.category}</div>
                            <h4>{ex.name}</h4>
                            <p className="description">{ex.description || 'Sem descrição.'}</p>
                            <div className="ex-footer">
                                {ex.videoLink ? (
                                    <a href={ex.videoLink} target="_blank" rel="noreferrer" className="btn-link">
                                        <ExternalLink size={16} /> Ver Vídeo
                                    </a>
                                ) : <span className="no-video">Sem vídeo</span>}
                                <div className="actions">
                                    <button className="btn-icon" onClick={() => handleEdit(ex)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(ex._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ✅ MODAL MELHORADO */}
            {showModal && (
                <>
                    <div className="overlay" onClick={() => setShowModal(false)} />
                    <div className="modal-ex">
                        <div className="modal-head">
                            <div className="modal-header-content">
                                <div className="modal-icon">
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3>{editingExercise ? 'Editar Exercício' : 'Registar Exercício'}</h3>
                                    <p>{editingExercise ? 'Atualizar informações' : 'Adicionar novo exercício'}</p>
                                </div>
                            </div>
                            <button className="btn-close-mod" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-content">
                                <div className="input-mod">
                                    <label>Nome do Exercício</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Supino Reto"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-mod">
                                    <label>Categoria</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="input-mod">
                                    <label>Descrição</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Descreva como executar o exercício..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="input-mod">
                                    <label>
                                        <Video size={16} />
                                        Link de Vídeo (YouTube/Vimeo)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://youtube.com/..."
                                        value={formData.videoLink}
                                        onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-save">
                                    <Dumbbell size={18} />
                                    {editingExercise ? 'Atualizar' : 'Salvar Exercício'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            <style>{`
                .exercise-mgmt { display: flex; flex-direction: column; gap: 2rem; }
                .filters-bar { padding: 1rem; display: flex; gap: 1rem; align-items: center; }
                .search-input { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); }
                .search-input input { border: none; background: transparent; width: 100%; color: var(--text-primary); outline: none; }
                .select-filter { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); }
                .select-filter select { border: none; background: transparent; color: var(--text-primary); cursor: pointer; }
                
                .exercises-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .ex-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
                .ex-badge { font-size: 0.65rem; background: var(--accent-primary); color: white; padding: 0.2rem 0.6rem; border-radius: 1rem; width: fit-content; font-weight: 700; text-transform: uppercase; }
                .description { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .ex-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
                .btn-link { font-size: 0.8rem; color: var(--accent-primary); text-decoration: none; display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
                
                .actions { display: flex; gap: 0.5rem; }
                .btn-icon { background: var(--bg-primary); border: 1px solid var(--border-color); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: 0.3s; }
                .btn-icon:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
                .btn-icon.delete:hover { border-color: #ef4444; color: #ef4444; }

                .empty-state { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary); }

                /* ✅ MODAL MELHORADO */
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                }

                .modal-ex {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 550px;
                    z-index: 1000;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 1rem;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, -45%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }

                .modal-head {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .modal-header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .modal-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }

                .modal-head h3 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.25rem;
                }

                .modal-head p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .btn-close-mod {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .btn-close-mod:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                }

                .form-content {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .input-mod {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-mod label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .input-mod input,
                .input-mod select,
                .input-mod textarea {
                    padding: 0.875rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-family: inherit;
                    font-size: 0.95rem;
                    transition: all 0.3s;
                }

                .input-mod textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .input-mod input:focus,
                .input-mod select:focus,
                .input-mod textarea:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .modal-btns {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .btn-cancel,
                .btn-save {
                    flex: 1;
                    padding: 0.875rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-cancel {
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }

                .btn-cancel:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }

                .btn-save {
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                }

                .btn-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }

                @media (max-width: 768px) {
                    .modal-ex {
                        width: 95%;
                        max-height: 90vh;
                    }

                    .modal-header-content {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .form-content {
                        max-height: 50vh;
                    }
                }
            `}</style>
        </div>
    );
};

export default ExerciseManagement;