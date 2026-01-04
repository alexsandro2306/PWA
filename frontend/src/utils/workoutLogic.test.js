import { describe, it, expect } from 'vitest';
import {
    calculateCompletionRate,
    getDaysInMonth,
    getWorkoutStatusColor,
    formatWorkoutDate,
    isToday
} from './workoutLogic';

describe('Workout Logic', () => {
    describe('calculateCompletionRate', () => {
        it('deve calcular percentagem corretamente', () => {
            expect(calculateCompletionRate(7, 10)).toBe('70%');
            expect(calculateCompletionRate(1, 3)).toBe('33%');
            expect(calculateCompletionRate(10, 10)).toBe('100%');
            expect(calculateCompletionRate(0, 10)).toBe('0%');
        });

        it('deve retornar 0% se total for zero ou inválido', () => {
            expect(calculateCompletionRate(5, 0)).toBe('0%');
            expect(calculateCompletionRate(5, null)).toBe('0%');
            expect(calculateCompletionRate(5, undefined)).toBe('0%');
        });
    });

    describe('getDaysInMonth', () => {
        it('deve retornar número correto de dias', () => {
            expect(getDaysInMonth(2024, 0)).toBe(31); // Janeiro
            expect(getDaysInMonth(2024, 1)).toBe(29); // Fevereiro (bissexto)
            expect(getDaysInMonth(2023, 1)).toBe(28); // Fevereiro (normal)
            expect(getDaysInMonth(2024, 3)).toBe(30); // Abril
        });
    });

    describe('getWorkoutStatusColor', () => {
        it('deve retornar cores corretas para cada status', () => {
            expect(getWorkoutStatusColor('completed')).toBe('#10b981');
            expect(getWorkoutStatusColor('missed')).toBe('#ef4444');
            expect(getWorkoutStatusColor('scheduled')).toBe('#a855f7');
            expect(getWorkoutStatusColor('today')).toBe('#3b82f6');
            expect(getWorkoutStatusColor('rest')).toBe('#6b7280');
        });

        it('deve retornar cor padrão para status desconhecido', () => {
            expect(getWorkoutStatusColor('unknown')).toBe('#6b7280');
            expect(getWorkoutStatusColor('')).toBe('#6b7280');
        });
    });

    describe('formatWorkoutDate', () => {
        it('deve formatar data corretamente', () => {
            const date = new Date('2024-01-15');
            expect(formatWorkoutDate(date)).toBe('15/01/2024');
        });
    });

    describe('isToday', () => {
        it('deve identificar data de hoje', () => {
            const today = new Date();
            expect(isToday(today)).toBe(true);
        });

        it('deve rejeitar datas diferentes', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(isToday(yesterday)).toBe(false);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(isToday(tomorrow)).toBe(false);
        });
    });
});
