const request = require('supertest');
const { app } = require('../../../server');
const User = require('../../models/User');
const { createTestUser, generateToken } = require('../helpers/testHelpers');

describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
        test('Deve registar novo cliente com sucesso', async () => {
            const userData = {
                username: 'novo_cliente',
                email: 'cliente@test.com',
                password: 'senha123',
                firstName: 'Novo',
                lastName: 'Cliente',
                role: 'client',
                phone: '+351912345678'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.username).toBe(userData.username);
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.role).toBe('client');
            expect(response.body.user.isValidated).toBe(true); // Clientes validados automaticamente
        });

        test('Deve registar novo trainer com sucesso', async () => {
            const userData = {
                username: 'novo_trainer',
                email: 'trainer@test.com',
                password: 'senha123',
                firstName: 'Novo',
                lastName: 'Trainer',
                role: 'trainer',
                phone: '+351912345678'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.user.role).toBe('trainer');
            expect(response.body.user.isValidated).toBe(false); // Trainers precisam validação
        });

        test('Deve falhar com username duplicado', async () => {
            const userData = {
                username: 'duplicado',
                email: 'test1@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User',
                role: 'client'
            };

            // Criar primeiro usuário
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Tentar criar com mesmo username
            const duplicateData = {
                ...userData,
                email: 'test2@test.com'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body.message).toMatch(/já existe/i);
        });

        test('Deve falhar com email duplicado', async () => {
            const userData = {
                username: 'user1',
                email: 'duplicado@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User',
                role: 'client'
            };

            // Criar primeiro usuário
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Tentar criar com mesmo email
            const duplicateData = {
                ...userData,
                username: 'user2'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body.message).toMatch(/já existe/i);
        });

        test('Deve falhar sem campos obrigatórios', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'test'
                    // Faltam campos obrigatórios
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await createTestUser({
                username: 'login_test',
                password: 'senha123'
            });
        });

        test('Deve fazer login com credenciais válidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'login_test',
                    password: 'senha123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.username).toBe('login_test');
            expect(response.body.user.theme).toBeDefined();
        });

        test('Deve falhar com username inválido', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'usuario_inexistente',
                    password: 'senha123'
                })
                .expect(401);

            expect(response.body.message).toMatch(/inválidas/i);
        });

        test('Deve falhar com password incorreta', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'login_test',
                    password: 'senha_errada'
                })
                .expect(401);

            expect(response.body.message).toMatch(/inválidas/i);
        });

        test('Deve falhar sem username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'senha123'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Deve falhar sem password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'login_test'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        let testUser, token;

        beforeEach(async () => {
            testUser = await createTestUser();
            token = generateToken(testUser._id);
        });

        test('Deve retornar dados do usuário autenticado', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toBeDefined();
            expect(response.body.user._id.toString()).toBe(testUser._id.toString());
            expect(response.body.user.username).toBe(testUser.username);
            expect(response.body.user.email).toBe(testUser.email);
        });

        test('Deve falhar sem token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/token/i);
        });

        test('Deve falhar com token inválido', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token_invalido')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/verify-user', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await createTestUser({
                username: 'verify_test',
                email: 'verify@test.com'
            });
        });

        test('Deve verificar usuário por email', async () => {
            const response = await request(app)
                .post('/api/auth/verify-user')
                .send({
                    identifier: 'verify@test.com'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/encontrado/i);
        });

        test('Deve verificar usuário por username', async () => {
            const response = await request(app)
                .post('/api/auth/verify-user')
                .send({
                    identifier: 'verify_test'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('Deve falhar com usuário inexistente', async () => {
            const response = await request(app)
                .post('/api/auth/verify-user')
                .send({
                    identifier: 'nao_existe@test.com'
                })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/não encontrado/i);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await createTestUser({
                username: 'reset_test',
                email: 'reset@test.com',
                password: 'senha_antiga'
            });
        });

        test('Deve resetar password com sucesso', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    identifier: 'reset@test.com',
                    newPassword: 'senha_nova123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/redefinida/i);

            // Verificar que pode fazer login com nova password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'reset_test',
                    password: 'senha_nova123'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
        });

        test('Deve falhar com password muito curta', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    identifier: 'reset@test.com',
                    newPassword: '12345' // Menos de 6 caracteres
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/6 caracteres/i);
        });

        test('Deve falhar com usuário inexistente', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    identifier: 'nao_existe@test.com',
                    newPassword: 'senha123'
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });
});
