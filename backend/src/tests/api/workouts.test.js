const request = require('supertest');
const { app } = require('../../../server');
const TrainingPlan = require('../../models/TrainingPlan');
const { createTestTrainer, createTestClient, generateToken, mockTrainingPlan } = require('../helpers/testHelpers');

describe('Workouts API', () => {
    let trainer, client, trainerToken, clientToken;

    beforeEach(async () => {
        trainer = await createTestTrainer();
        client = await createTestClient(trainer._id);
        trainerToken = generateToken(trainer._id);
        clientToken = generateToken(client._id);
    });

    describe('POST /api/workouts', () => {
        test('Trainer deve criar plano para cliente com sucesso', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.workout).toBeDefined();
            expect(response.body.workout.client.toString()).toBe(client._id.toString());
            expect(response.body.workout.trainer.toString()).toBe(trainer._id.toString());
            expect(response.body.workout.frequency).toBe(4);
            expect(response.body.workout.weeklyPlan).toHaveLength(4);
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

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(201);

            expect(response.body.workout.frequency).toBe(3);
            expect(response.body.workout.weeklyPlan).toHaveLength(3);
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

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(201);

            expect(response.body.workout.frequency).toBe(5);
        });

        test('Deve falhar com frequência inválida', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 6,
                weeklyPlan: Array(6).fill().map((_, i) => ({
                    dayOfWeek: i,
                    exercises: [{ name: `Ex${i}`, sets: 3, reps: '10', order: 1 }]
                }))
            });

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar quando weeklyPlan não corresponde à frequência', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id, {
                frequency: 4,
                weeklyPlan: [
                    { dayOfWeek: 1, exercises: [{ name: 'Ex1', sets: 3, reps: '10', order: 1 }] },
                    { dayOfWeek: 3, exercises: [{ name: 'Ex2', sets: 3, reps: '10', order: 1 }] }
                    // Faltam 2 dias
                ]
            });

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar com datas inválidas (início >= fim)', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: yesterday.toISOString().split('T')[0]
            });

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar com duração menor que 1 semana', async () => {
            const today = new Date();
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            const planData = mockTrainingPlan(client._id, trainer._id, {
                startDate: today.toISOString().split('T')[0],
                endDate: threeDaysLater.toISOString().split('T')[0]
            });

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(planData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Cliente não deve poder criar plano', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${clientToken}`)
                .send(planData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar sem autenticação', async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);

            const response = await request(app)
                .post('/api/workouts')
                .send(planData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/workouts/active', () => {
        beforeEach(async () => {
            // Criar plano ativo para o cliente
            const planData = mockTrainingPlan(client._id, trainer._id);
            await TrainingPlan.create(planData);
        });

        test('Cliente deve ver seu plano ativo', async () => {
            const response = await request(app)
                .get('/api/workouts/active')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workout).toBeDefined();
            expect(response.body.workout.client.toString()).toBe(client._id.toString());
            expect(response.body.workout.isActive).toBe(true);
        });

        test('Deve retornar null se não houver plano ativo', async () => {
            // Criar novo cliente sem plano
            const newClient = await createTestClient(trainer._id);
            const newClientToken = generateToken(newClient._id);

            const response = await request(app)
                .get('/api/workouts/active')
                .set('Authorization', `Bearer ${newClientToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workout).toBeNull();
        });

        test('Trainer não deve poder acessar este endpoint', async () => {
            const response = await request(app)
                .get('/api/workouts/active')
                .set('Authorization', `Bearer ${trainerToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar sem autenticação', async () => {
            const response = await request(app)
                .get('/api/workouts/active')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/workouts', () => {
        beforeEach(async () => {
            // Criar alguns planos
            await TrainingPlan.create(mockTrainingPlan(client._id, trainer._id));
        });

        test('Trainer deve ver planos dos seus clientes', async () => {
            const response = await request(app)
                .get('/api/workouts')
                .set('Authorization', `Bearer ${trainerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workouts).toBeDefined();
            expect(Array.isArray(response.body.workouts)).toBe(true);
            expect(response.body.workouts.length).toBeGreaterThan(0);
        });

        test('Cliente deve ver apenas seus planos', async () => {
            const response = await request(app)
                .get('/api/workouts')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workouts).toBeDefined();

            // Todos os planos devem ser do cliente
            response.body.workouts.forEach(workout => {
                expect(workout.client.toString()).toBe(client._id.toString());
            });
        });

        test('Deve filtrar por clientId (trainer)', async () => {
            const response = await request(app)
                .get(`/api/workouts?clientId=${client._id}`)
                .set('Authorization', `Bearer ${trainerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workouts).toBeDefined();
        });

        test('Deve falhar sem autenticação', async () => {
            const response = await request(app)
                .get('/api/workouts')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/workouts/client/active', () => {
        beforeEach(async () => {
            const planData = mockTrainingPlan(client._id, trainer._id);
            await TrainingPlan.create(planData);
        });

        test('Cliente deve ver detalhes do plano ativo', async () => {
            const response = await request(app)
                .get('/api/workouts/client/active')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.workout).toBeDefined();
            expect(response.body.workout.weeklyPlan).toBeDefined();
            expect(response.body.workout.trainer).toBeDefined();
        });

        test('Trainer não deve acessar este endpoint', async () => {
            const response = await request(app)
                .get('/api/workouts/client/active')
                .set('Authorization', `Bearer ${trainerToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
