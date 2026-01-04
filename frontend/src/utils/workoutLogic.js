export const calculateCompletionRate = (completed, total) => {
    if (!total || total === 0) return '0%';
    const rate = Math.round((completed / total) * 100);
    return `${rate}%`;
};

export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

export const getWorkoutStatusColor = (status) => {
    const colors = {
        completed: '#10b981',
        missed: '#ef4444',
        scheduled: '#a855f7',
        today: '#3b82f6',
        rest: '#6b7280'
    };
    return colors[status] || colors.rest;
};

export const formatWorkoutDate = (date) => {
    return new Date(date).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    );
};
