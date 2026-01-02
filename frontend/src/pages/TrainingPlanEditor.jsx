import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Plus, Trash2, Save, ArrowLeft, Video, Search, BookOpen, X, Copy } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TrainingPlanEditor = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [client, setClient] = useState(null);
    const [planName, setPlanName] = useState('');
    const [frequency, setFrequency] = useState(3);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [weeklyPlan, setWeeklyPlan] = useState([
        { dayOfWeek: 1, exercises: [] },
        { dayOfWeek: 3, exercises: [] },
        { dayOfWeek: 5, exercises: [] }
    ]);
    const [loading, setLoading] = useState(true);
    const [showLibrary, setShowLibrary] = useState(false);
    const [exercisesLib, setExercisesLib] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscle, setFilterMuscle] = useState('');
    const [currentDayTarget, setCurrentDayTarget] = useState(0);
    const [showImportModal, setShowImportModal] = useState(false);
    const [otherClients, setOtherClients] = useState([]);
    const [selectedClientToCopy, setSelectedClientToCopy] = useState('');

    useEffect(() => {
        api.get(`/users/${clientId}`).then(res => setClient(res.data.data)).finally(() => setLoading(false));
    }, [clientId]);

    useEffect(() => {
        if (showLibrary) {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (filterMuscle) params.category = filterMuscle;
            api.get('/exercises', { params }).then(res => setExercisesLib(res.data.data));
        }
    }, [showLibrary, searchQuery, filterMuscle]);

    const handleImportFromAthlete = async () => {
        if (!selectedClientToCopy) return;
        try {
            const res = await api.get('/workouts', { params: { clientId: selectedClientToCopy } });
            if (res.data.data.length === 0) return addNotification('info', 'Sem planos anteriores.');
            const plan = res.data.data[0];
            setPlanName(`${plan.name} (Cópia)`);
            setFrequency(plan.frequency);
            setWeeklyPlan(plan.weeklyPlan.map(d => ({ dayOfWeek: d.dayOfWeek, exercises: d.exercises.map(e => ({ ...e })) })));
            setShowImportModal(false);
            addNotification('success', 'Plano importado!');
        } catch (err) {
            addNotification('error', 'Erro ao importar.');
        }
    };

    const fetchOtherClients = async () => {
        const res = await api.get('/users/my-clients');
        setOtherClients(res.data.data.filter(c => c._id !== clientId));
        setShowImportModal(true);
    };

    useEffect(() => {
        const diff = frequency - weeklyPlan.length;
        if (diff > 0) {
            const newDays = [...weeklyPlan];
            for (let i = 0; i < diff; i++) {
                const used = new Set(newDays.map(d => d.dayOfWeek));
                let day = -1;
                for (let d = 1; d <= 6; d++) if (!used.has(d)) { day = d; break; }
                if (day === -1) day = 0;
                newDays.push({ dayOfWeek: day, exercises: [] });
            }
            setWeeklyPlan(newDays);
        } else if (diff < 0) {
            setWeeklyPlan(weeklyPlan.slice(0, frequency));
        }
    }, [frequency]);

    const addExercise = (idx) => {
        if (weeklyPlan[idx].exercises.length >= 10) return addNotification('warning', 'Máximo 10 exercícios.');
        const plan = [...weeklyPlan];
        plan[idx].exercises.push({ name: '', sets: 3, reps: '12', instructions: '', videoUrl: '', order: plan[idx].exercises.length + 1 });
        setWeeklyPlan(plan);
    };

    const addFromLibrary = (ex) => {
        if (weeklyPlan[currentDayTarget].exercises.length >= 10) return addNotification('warning', 'Limite atingido.');
        const plan = [...weeklyPlan];
        plan[currentDayTarget].exercises.push({
            name: ex.name, sets: 3, reps: '12', instructions: ex.description || '',
            videoUrl: ex.videoLink || '', order: plan[currentDayTarget].exercises.length + 1
        });
        setWeeklyPlan(plan);
        setShowLibrary(false);
        addNotification('success', `${ex.name} adicionado!`);
    };

    const removeExercise = (dIdx, eIdx) => {
        const plan = [...weeklyPlan];
        plan[dIdx].exercises.splice(eIdx, 1);
        plan[dIdx].exercises.forEach((e, i) => e.order = i + 1);
        setWeeklyPlan(plan);
    };

    const updateExercise = (dIdx, eIdx, field, val) => {
        const plan = [...weeklyPlan];
        plan[dIdx].exercises[eIdx][field] = field === 'sets' ? parseInt(val) || 0 : val;
        setWeeklyPlan(plan);
    };

    const updateDay = (idx, day) => {
        const plan = [...weeklyPlan];
        plan[idx].dayOfWeek = parseInt(day);
        setWeeklyPlan(plan);
    };

    const handleSave = async () => {
        if (!planName || !startDate || !endDate) return addNotification('warning', 'Preencha todos os campos.');
        try {
            await api.post('/workouts', { client: clientId, name: planName, frequency, startDate, endDate, weeklyPlan });
            addNotification('success', 'Plano criado!');
            navigate('/trainer/clients');
        } catch (err) {
            addNotification('error', 'Erro ao guardar.');
        }
    };

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayOptions = [
        { val: 1, label: 'Segunda' }, { val: 2, label: 'Terça' }, { val: 3, label: 'Quarta' },
        { val: 4, label: 'Quinta' }, { val: 5, label: 'Sexta' }, { val: 6, label: 'Sábado' }, { val: 0, label: 'Domingo' }
    ];

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="plan-editor">
            <header className="header">
                <button className="btn-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <div>
                    <h1>Plano: {client?.firstName}</h1>
                    <p>Frequência: {frequency}x/semana</p>
                </div>
                <div className="actions">
                    <button className="btn-sec" onClick={fetchOtherClients}><Copy size={16} /> Importar</button>
                    <button className="btn-pri" onClick={handleSave}><Save size={16} /> Guardar</button>
                </div>
            </header>

            <div className="glass config">
                <input className="inp" placeholder="Nome do Plano" value={planName} onChange={e => setPlanName(e.target.value)} />
                <div className="row">
                    <select className="inp" value={frequency} onChange={e => setFrequency(parseInt(e.target.value))}>
                        <option value={3}>3x/semana</option>
                        <option value={4}>4x/semana</option>
                        <option value={5}>5x/semana</option>
                    </select>
                    <input className="inp" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <input className="inp" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="grid">
                {weeklyPlan.map((day, dIdx) => (
                    <div key={dIdx} className="glass day">
                        <div className="day-head">
                            <select className="day-sel" value={day.dayOfWeek} onChange={e => updateDay(dIdx, e.target.value)}>
                                {dayOptions.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                            </select>
                            <button className="btn-icon" onClick={() => { setCurrentDayTarget(dIdx); setShowLibrary(true); }}>
                                <BookOpen size={16} />
                            </button>
                        </div>

                        {day.exercises.map((ex, eIdx) => (
                            <div key={eIdx} className="ex">
                                <div className="ex-top">
                                    <span className="num">{ex.order}</span>
                                    <input className="ex-name" placeholder="Exercício" value={ex.name} onChange={e => updateExercise(dIdx, eIdx, 'name', e.target.value)} />
                                    <button className="btn-del" onClick={() => removeExercise(dIdx, eIdx)}><Trash2 size={14} /></button>
                                </div>
                                <div className="ex-bot">
                                    <div>
                                        <label>Séries</label>
                                        <input type="number" value={ex.sets} onChange={e => updateExercise(dIdx, eIdx, 'sets', e.target.value)} />
                                    </div>
                                    <div>
                                        <label>Reps</label>
                                        <input type="text" value={ex.reps} onChange={e => updateExercise(dIdx, eIdx, 'reps', e.target.value)} />
                                    </div>
                                </div>
                                {ex.videoUrl && <div className="vid"><Video size={12} /> Vídeo</div>}
                            </div>
                        ))}

                        {day.exercises.length === 0 && <p className="empty">Sem exercícios</p>}
                        <button className="btn-add" onClick={() => addExercise(dIdx)}><Plus size={16} /> Adicionar</button>
                    </div>
                ))}
            </div>

            {showLibrary && (
                <>
                    <div className="overlay" onClick={() => setShowLibrary(false)} />
                    <div className="modal glass">
                        <div className="modal-head">
                            <h3><BookOpen size={18} /> Biblioteca</h3>
                            <button onClick={() => setShowLibrary(false)}><X size={20} /></button>
                        </div>
                        <div className="filters">
                            <div className="search">
                                <Search size={16} />
                                <input placeholder="Pesquisar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}>
                                <option value="">Todos</option>
                                <option value="Peito">Peito</option>
                                <option value="Costas">Costas</option>
                                <option value="Pernas">Pernas</option>
                                <option value="Ombros">Ombros</option>
                                <option value="Braços">Braços</option>
                                <option value="Core">Core</option>
                            </select>
                        </div>
                        <div className="lib-grid">
                            {exercisesLib.map(ex => (
                                <div key={ex._id} className="lib-card" onClick={() => addFromLibrary(ex)}>
                                    <div>
                                        <h4>{ex.name}</h4>
                                        <span className="badge">{ex.category}</span>
                                    </div>
                                    <Plus size={18} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {showImportModal && (
                <>
                    <div className="overlay" onClick={() => setShowImportModal(false)} />
                    <div className="modal glass small">
                        <div className="modal-head">
                            <h3><Copy size={18} /> Importar</h3>
                            <button onClick={() => setShowImportModal(false)}><X size={20} /></button>
                        </div>
                        <select className="inp" value={selectedClientToCopy} onChange={e => setSelectedClientToCopy(e.target.value)}>
                            <option value="">Escolher atleta...</option>
                            {otherClients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                        </select>
                        <div className="modal-actions">
                            <button className="btn-sec" onClick={() => setShowImportModal(false)}>Cancelar</button>
                            <button className="btn-pri" onClick={handleImportFromAthlete} disabled={!selectedClientToCopy}>Importar</button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .plan-editor { display: flex; flex-direction: column; gap: 1.5rem; }
                .header { display: flex; align-items: center; gap: 1rem; }
                .header h1 { margin: 0; font-size: 1.5rem; }
                .header p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
                .actions { margin-left: auto; display: flex; gap: 0.75rem; }
                .btn-back, .btn-icon, .btn-del { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; color: var(--text-primary); }
                .btn-back:hover { background: var(--accent-primary); color: white; }
                .btn-sec, .btn-pri { padding: 0.625rem 1rem; border-radius: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; border: none; }
                .btn-sec { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
                .btn-pri { background: var(--accent-primary); color: white; }
                .btn-pri:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .config { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
                .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .inp { padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); width: 100%; }
                
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }
                .day { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
                .day-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); }
                .day-sel { background: transparent; border: none; font-weight: 700; color: var(--text-primary); font-size: 1rem; cursor: pointer; }
                
                .ex { background: var(--bg-primary); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; }
                .ex-top { display: flex; gap: 0.5rem; align-items: center; }
                .num { width: 24px; height: 24px; border-radius: 0.375rem; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; }
                .ex-name { flex: 1; background: transparent; border: none; border-bottom: 1px solid transparent; font-weight: 600; color: var(--text-primary); padding: 0.25rem 0; }
                .ex-name:focus { outline: none; border-bottom-color: var(--accent-primary); }
                .btn-del { color: #ef4444; padding: 0.375rem; }
                .ex-bot { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                .ex-bot div { display: flex; flex-direction: column; gap: 0.25rem; }
                .ex-bot label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
                .ex-bot input { padding: 0.5rem; border-radius: 0.375rem; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); }
                .vid { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--accent-primary); }
                
                .empty { text-align: center; color: var(--text-secondary); opacity: 0.5; font-size: 0.875rem; margin: 1rem 0; }
                .btn-add { background: transparent; border: 1px dashed var(--border-color); padding: 0.75rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer; font-weight: 600; }
                .btn-add:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
                
                .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; }
                .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 600px; max-height: 85vh; z-index: 1000; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
                .modal.small { max-width: 450px; }
                .modal-head { display: flex; justify-content: space-between; align-items: center; }
                .modal-head h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
                .modal-head button { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); }
                .filters { display: flex; gap: 1rem; }
                .search { flex: 1; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0 0.75rem; background: var(--bg-primary); }
                .search input { flex: 1; border: none; background: transparent; padding: 0.75rem 0; color: var(--text-primary); }
                .filters select { padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); color: var(--text-primary); }
                
                .lib-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; overflow-y: auto; }
                .lib-card { padding: 1rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
                .lib-card:hover { border-color: var(--accent-primary); }
                .lib-card h4 { margin: 0 0 0.25rem 0; font-size: 0.95rem; }
                .badge { font-size: 0.7rem; background: var(--accent-primary); color: white; padding: 0.125rem 0.5rem; border-radius: 0.375rem; font-weight: 700; }
                
                .modal-actions { display: flex; gap: 0.75rem; }
                .modal-actions button { flex: 1; }
                
                @media (max-width: 768px) {
                    .header { flex-wrap: wrap; }
                    .actions { width: 100%; justify-content: stretch; }
                    .row { grid-template-columns: 1fr; }
                    .grid { grid-template-columns: 1fr; }
                    .lib-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default TrainingPlanEditor;