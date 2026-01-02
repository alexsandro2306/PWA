import { useState, useEffect } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Dumbbell,
    TrendingUp,
    Clock,
    Target
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ClientWorkouts = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [trainingLogs, setTrainingLogs] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const plansRes = await api.get('/workouts');
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const logsRes = await api.get(`/workouts/client/logs?year=${year}&month=${month}`);

            setTrainingPlans(plansRes.data.data || []);
            setTrainingLogs(logsRes.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            addNotification('error', 'Erro ao carregar treinos');
        } finally {
            setLoading(false);
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const firstDayOfWeek = firstDay.getDay();

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getWorkoutForDay = (date) => {
        if (!date) return null;
        const dayOfWeek = date.getDay();

        for (const plan of trainingPlans) {
            if (!plan.isActive) continue;

            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);

            if (date >= startDate && date <= endDate) {
                const workout = plan.workouts.find(w => {
                    const dayMap = {
                        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
                        'friday': 5, 'saturday': 6, 'sunday': 0
                    };
                    return dayMap[w.day.toLowerCase()] === dayOfWeek;
                });

                if (workout) return { plan, workout };
            }
        }
        return null;
    };

    const getLogForDay = (date) => {
        if (!date) return null;
        const dateStr = date.toISOString().split('T')[0];
        return trainingLogs.find(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === dateStr;
        });
    };

    const getDayStatus = (date) => {
        if (!date) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();

        const workout = getWorkoutForDay(date);
        const log = getLogForDay(date);

        if (!workout) return { type: 'rest', label: 'Descanso' };

        if (log) {
            return log.isCompleted
                ? { type: 'completed', label: 'Concluído' }
                : { type: 'missed', label: 'Faltou', reason: log.reason };
        }

        if (isPast && workout) return { type: 'missed', label: 'Faltou' };
        if (isToday && workout) return { type: 'today', label: 'Hoje' };
        return { type: 'scheduled', label: 'Agendado' };
    };

    const markWorkout = async (date, isCompleted, reason = '') => {
        try {
            const workout = getWorkoutForDay(date);
            if (!workout) return;

            await api.post('/workouts/client/logs', {
                planId: workout.plan._id,
                workoutId: workout.workout._id,
                date: date.toISOString(),
                isCompleted,
                reason: isCompleted ? '' : reason
            });

            addNotification('success', isCompleted ? '✅ Treino marcado como concluído!' : 'Treino registado');
            fetchData();
            setSelectedDay(null);
        } catch (error) {
            console.error('Erro ao marcar treino:', error);
            addNotification('error', 'Erro ao marcar treino');
        }
    };

    const days = getDaysInMonth();
    const monthName = currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    // Estatísticas do mês
    const monthStats = {
        total: days.filter(d => d && getWorkoutForDay(d)).length,
        completed: days.filter(d => {
            if (!d) return false;
            const log = getLogForDay(d);
            return log?.isCompleted;
        }).length,
        missed: days.filter(d => {
            if (!d) return false;
            const status = getDayStatus(d);
            return status?.type === 'missed';
        }).length
    };

    const completionRate = monthStats.total > 0
        ? Math.round((monthStats.completed / monthStats.total) * 100)
        : 0;

    return (
        <div className="workouts-page">
            <div className="workouts-container">

                {/* Header */}
                <div className="page-header">
                    <h1>Meus Treinos</h1>
                    <p>Acompanha o teu progresso e marca os treinos realizados</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Total de Treinos</p>
                            <p className="stat-value">{monthStats.total}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon completed">
                            <Check size={24} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Concluídos</p>
                            <p className="stat-value">{monthStats.completed}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon missed">
                            <X size={24} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Faltou</p>
                            <p className="stat-value">{monthStats.missed}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon rate">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Taxa de Conclusão</p>
                            <p className="stat-value">{completionRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Calendar Navigation */}
                <div className="calendar-header">
                    <button onClick={previousMonth} className="nav-btn">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="month-title">{monthName}</h2>
                    <button onClick={nextMonth} className="nav-btn">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Legend */}
                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color completed"></div>
                        <span>Concluído</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color missed"></div>
                        <span>Faltou</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color today"></div>
                        <span>Hoje</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color scheduled"></div>
                        <span>Agendado</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color rest"></div>
                        <span>Descanso</span>
                    </div>
                </div>

                {/* Calendar */}
                <div className="calendar-wrapper">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>A carregar treinos...</p>
                        </div>
                    ) : (
                        <>
                            {/* Week Days */}
                            <div className="calendar-weekdays">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="calendar-days">
                                {days.map((date, index) => {
                                    if (!date) {
                                        return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                                    }

                                    const status = getDayStatus(date);
                                    const workout = getWorkoutForDay(date);
                                    const isToday = new Date().toDateString() === date.toDateString();

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => workout && setSelectedDay(date)}
                                            className={`calendar-day ${status?.type || ''} ${isToday ? 'is-today' : ''} ${workout ? 'has-workout' : ''}`}
                                            disabled={!workout}
                                        >
                                            <span className="day-number">{date.getDate()}</span>
                                            {workout && <Dumbbell size={14} className="day-icon" />}
                                            {status?.type === 'completed' && <Check size={14} className="status-icon" />}
                                            {status?.type === 'missed' && <X size={14} className="status-icon" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal */}
                {selectedDay && (
                    <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>
                                    {selectedDay.toLocaleDateString('pt-PT', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </h3>
                                <button className="close-btn" onClick={() => setSelectedDay(null)}>
                                    <X size={24} />
                                </button>
                            </div>

                            {(() => {
                                const workout = getWorkoutForDay(selectedDay);
                                const log = getLogForDay(selectedDay);

                                if (!workout) {
                                    return (
                                        <div className="modal-body">
                                            <p className="no-workout">Sem treino agendado para este dia.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="modal-body">
                                        <h4 className="workout-title">Treino do Dia</h4>

                                        {/* Exercises */}
                                        <div className="exercises-list">
                                            {workout.workout.exercises.map((exercise, idx) => (
                                                <div key={idx} className="exercise-card">
                                                    <div className="exercise-header">
                                                        <span className="exercise-number">{idx + 1}</span>
                                                        <h5>{exercise.name}</h5>
                                                    </div>
                                                    <div className="exercise-details">
                                                        <div className="exercise-stat">
                                                            <Target size={16} />
                                                            <span>{exercise.sets} séries</span>
                                                        </div>
                                                        <div className="exercise-stat">
                                                            <Clock size={16} />
                                                            <span>{exercise.reps} repetições</span>
                                                        </div>
                                                    </div>
                                                    {exercise.instructions && (
                                                        <p className="exercise-instructions">{exercise.instructions}</p>
                                                    )}
                                                    {exercise.videoUrl && (
                                                        <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                                                            Ver demonstração
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Status */}
                                        {log && (
                                            <div className={`status-banner ${log.isCompleted ? 'success' : 'error'}`}>
                                                <p>
                                                    {log.isCompleted ? '✅ Treino Concluído' : '❌ Treino Não Realizado'}
                                                </p>
                                                {!log.isCompleted && log.reason && (
                                                    <p className="status-reason">Motivo: {log.reason}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {!log && (
                                            <div className="modal-actions">
                                                <button
                                                    onClick={() => markWorkout(selectedDay, true)}
                                                    className="btn-primary"
                                                >
                                                    <Check size={18} />
                                                    Marcar como Concluído
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Motivo para não realizar o treino:');
                                                        if (reason) markWorkout(selectedDay, false, reason);
                                                    }}
                                                    className="btn-secondary"
                                                >
                                                    <X size={18} />
                                                    Não Realizei
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .workouts-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 2rem;
        }

        .workouts-container {
          max-width: 1200px;
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

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.total {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .stat-icon.completed {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .stat-icon.missed {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .stat-icon.rate {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Calendar Header */
        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
        }

        .month-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .nav-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s;
        }

        .nav-btn:hover {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        /* Legend */
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: center;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 0.25rem;
        }

        .legend-color.completed { background: #22c55e; }
        .legend-color.missed { background: #ef4444; }
        .legend-color.today { background: #3b82f6; }
        .legend-color.scheduled { background: #a855f7; }
        .legend-color.rest { background: #6b7280; }

        /* Calendar */
        .calendar-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .weekday {
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 0.5rem;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .calendar-day.empty {
          background: transparent;
          border: none;
          cursor: default;
        }

        .calendar-day:not(.empty):not(:disabled):hover {
          transform: scale(1.05);
          border-color: var(--accent-primary);
        }

        .calendar-day:disabled {
          cursor: default;
          opacity: 0.6;
        }

        .calendar-day.is-today {
          border: 2px solid var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .calendar-day.completed {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
        }

        .calendar-day.missed {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .calendar-day.today:not(.completed):not(.missed) {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
        }

        .calendar-day.scheduled {
          background: rgba(168, 85, 247, 0.1);
          border-color: #a855f7;
        }

        .day-number {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .day-icon {
          color: var(--text-secondary);
        }

        .status-icon {
          position: absolute;
          bottom: 4px;
          right: 4px;
        }

        .calendar-day.completed .status-icon {
          color: #22c55e;
        }

        .calendar-day.missed .status-icon {
          color: #ef4444;
        }

        /* Loading */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
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
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .workout-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .no-workout {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
        }

        .exercises-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .exercise-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .exercise-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .exercise-number {
          width: 28px;
          height: 28px;
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .exercise-header h5 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .exercise-details {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .exercise-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .exercise-stat svg {
          color: var(--accent-primary);
        }

        .exercise-instructions {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .video-link {
          display: inline-block;
          color: var(--accent-primary);
          font-size: 0.875rem;
          text-decoration: none;
          font-weight: 600;
        }

        .video-link:hover {
          text-decoration: underline;
        }

        .status-banner {
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .status-banner.success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid #22c55e;
        }

        .status-banner.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
        }

        .status-banner p {
          font-weight: 600;
          color: var(--text-primary);
        }

        .status-reason {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.875rem;
          border-radius: 0.5rem;
          font-weight: 600;
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

        .btn-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          color: #ef4444;
          border: 2px solid #ef4444;
        }

        .btn-secondary:hover {
          background: #ef4444;
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .workouts-page {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .calendar-header {
            padding: 0.75rem 1rem;
          }

          .month-title {
            font-size: 1.125rem;
          }

          .weekday {
            font-size: 0.75rem;
          }

          .day-number {
            font-size: 0.875rem;
          }

          .modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default ClientWorkouts;