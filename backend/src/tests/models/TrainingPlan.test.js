const TrainingPlan = require('../../models/TrainingPlan');
const { createTestTrainer, createTestClient, mockTrainingPlan } = require('../helpers/testHelpers');

describe('TrainingPlan Model', () => {
    let trainer, client;

    beforeEach(async () => {
        trainer = await createTestTrainer();
        client = await createTestClient(trainer._id);
    });

    describe('Criação de Plano', () => {
        test('Deve criar um plano de treino válido', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            const plan = await TrainingPlan.create(planData);

            expect(plan._id).toBeDefined();
            expect(plan.client.toString()).toBe(client._id.toString());
            expect(plan.trainer.toString()).toBe(trainer._id.toString());
            expect(plan.name).toBe('Plano de Teste');
            expect(plan.frequency).toBe(4);
            expect(plan.weeklyPlan).toHaveLength(4);
            expect(plan.isActive).toBe(true);
        });

        test('Deve criar plano com frequência 3', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 3,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            const plan = await TrainingPlan.create(planData);
            expect(plan.frequency).toBe(3);
            expect(plan.weeklyPlan).toHaveLength(3);
        });

        test('Deve criar plano com frequência 5', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 5,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 2, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 4, exercises: [{ name: 'Ex4', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex5', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            const plan = await TrainingPlan.create(planData);
            expect(plan.frequency).toBe(5);
            expect(plan.weeklyPlan).toHaveLength(5);
        });
    });

    describe('Validações de Campos Obrigatórios', () => {
        test('Deve falhar sem client', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.client;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar sem trainer', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.trainer;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar sem name', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.name;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar sem frequency', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.frequency;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar sem startDate', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.startDate;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar sem endDate', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            delete planData.endDate;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });
    });

    describe('Validações de Frequência', () => {
        test('Deve falhar com frequência inválida (2)', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 2,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com frequência inválida (6)', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 6,
                weeklyPlan: Array(6).fill().map((_, i) => ({
                    dayOfWeek: i,
                    exercises: [{ name: `Ex${i}`, sets: 3, reps: '10', order: 1 }]
                }))
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar quando weeklyPlan não corresponde à frequência', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 4,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] }
                    // Faltam 1 dia (deveria ter 4)
                ]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });
    });

    describe('Validações de Datas', () => {
        test('Deve falhar se startDate >= endDate', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: yesterday.toISOString().split('T')[0]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow(/anterior/);
        });

        test('Deve falhar se startDate = endDate', async () => {
            const today = new Date().toISOString().split('T')[0];

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today,
                endDate: today
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow(/anterior/);
        });

        test('Deve falhar se duração < 1 semana', async () => {
            const today = new Date();
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: threeDaysLater.toISOString().split('T')[0]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow(/1 semana/);
        });

        test('Deve falhar se endDate > 1 ano no futuro', async () => {
            const today = new Date();
            const twoYearsLater = new Date(today);
            twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: twoYearsLater.toISOString().split('T')[0]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow(/1 ano/);
        });
    });

    describe('Validações de Dias da Semana', () => {
        test('Deve falhar com dias duplicados', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 4,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 1, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] }, // Duplicado
                    { dayOfWeek: 3, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex4', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow(/duplicados/);
        });

        test('Deve falhar com dayOfWeek inválido (<0)', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 4,
                weeklyPlan: [
                    { dayOfWeek: -1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 1, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex4', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com dayOfWeek inválido (>6)', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 4,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 5, exercises: [{ name: 'Ex3', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 7, exercises: [{ name: 'Ex4', sets: 3, reps: '10', order: 1 }] }
                ]
            });

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });
    });

    describe('Validações de Exercícios', () => {
        test('Deve falhar com exercício sem nome', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            planData.weeklyPlan[0].exercises[0].name = undefined;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com exercício sem sets', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            planData.weeklyPlan[0].exercises[0].sets = undefined;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com sets < 1', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            planData.weeklyPlan[0].exercises[0].sets = 0;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com exercício sem reps', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            planData.weeklyPlan[0].exercises[0].reps = undefined;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });

        test('Deve falhar com exercício sem order', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            planData.weeklyPlan[0].exercises[0].order = undefined;

            await expect(TrainingPlan.create(planData)).rejects.toThrow();
        });
    });

    describe('Métodos Virtuais', () => {
        test('durationDays deve calcular corretamente', async () => {
            const today = new Date();
            const thirtyDaysLater = new Date(today);
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: thirtyDaysLater.toISOString().split('T')[0]
            });

            const plan = await TrainingPlan.create(planData);
            expect(plan.durationDays).toBe(30);
        });

        test('isCurrentlyActive deve retornar true para plano ativo no período', async () => {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                isActive: true
            });

            const plan = await TrainingPlan.create(planData);
            expect(plan.isCurrentlyActive).toBe(true);
        });

        test('isCurrentlyActive deve retornar false para plano inativo', async () => {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                isActive: false
            });

            const plan = await TrainingPlan.create(planData);
            expect(plan.isCurrentlyActive).toBe(false);
        });
    });

    describe('Método deactivate', () => {
        test('Deve desativar plano', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            const plan = await TrainingPlan.create(planData);

            expect(plan.isActive).toBe(true);

            await plan.deactivate();

            expect(plan.isActive).toBe(false);
        });
    });

    describe('Método estático findActiveByClient', () => {
        test('Deve encontrar plano ativo do cliente', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            await TrainingPlan.create(planData);

            const activePlan = await TrainingPlan.findActiveByClient(client._id);

            expect(activePlan).toBeDefined();
            expect(activePlan.client._id.toString()).toBe(client._id.toString());
            expect(activePlan.isActive).toBe(true);
        });

        test('Deve retornar null se não houver plano ativo', async () => {
            const activePlan = await TrainingPlan.findActiveByClient(client._id);
            expect(activePlan).toBeNull();
        });
    });

    describe('Timestamps', () => {
        test('Deve ter createdAt e updatedAt', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            const plan = await TrainingPlan.create(planData);

            expect(plan.createdAt).toBeDefined();
            expect(plan.updatedAt).toBeDefined();
            expect(plan.createdAt).toBeInstanceOf(Date);
            expect(plan.updatedAt).toBeInstanceOf(Date);
        });
    });
});
