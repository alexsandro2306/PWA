const User = require('../../models/User');
const { createTestUser } = require('../helpers/testHelpers');

describe('User Model', () => {
    describe('Criação de Usuário', () => {
        test('Deve criar um usuário válido', async () => {
            const userData = {
                username: 'joao_teste',
                email: 'joao@test.com',
                password: 'senha123',
                firstName: 'João',
                lastName: 'Silva',
                role: 'client'
            };

            const user = await User.create(userData);

            expect(user._id).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.firstName).toBe(userData.firstName);
            expect(user.lastName).toBe(userData.lastName);
            expect(user.role).toBe('client');
            expect(user.isValidated).toBe(false);
            expect(user.password).not.toBe(userData.password); // Password deve estar hasheada
        });

        test('Deve criar um trainer', async () => {
            const user = await createTestUser({
                role: 'trainer',
                username: 'trainer_test'
            });

            expect(user.role).toBe('trainer');
            expect(user.maxClients).toBe(15); // Valor padrão
        });

        test('Deve criar um cliente com trainer associado', async () => {
            const trainer = await createTestUser({ role: 'trainer' });
            const client = await createTestUser({
                role: 'client',
                trainer: trainer._id
            });

            expect(client.trainer).toEqual(trainer._id);
        });
    });

    describe('Validações', () => {
        test('Deve falhar sem username', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User'
            };

            await expect(User.create(userData)).rejects.toThrow();
        });

        test('Deve falhar sem email', async () => {
            const userData = {
                username: 'testuser',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User'
            };

            await expect(User.create(userData)).rejects.toThrow();
        });

        test('Deve falhar sem password', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                firstName: 'Test',
                lastName: 'User'
            };

            await expect(User.create(userData)).rejects.toThrow();
        });

        test('Deve falhar com password muito curta', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: '12345', // Menos de 6 caracteres
                firstName: 'Test',
                lastName: 'User'
            };

            await expect(User.create(userData)).rejects.toThrow();
        });

        test('Deve falhar com username duplicado', async () => {
            const userData = {
                username: 'duplicate_user',
                email: 'test1@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User'
            };

            await User.create(userData);

            // Tentar criar outro usuário com mesmo username
            const duplicateUser = {
                ...userData,
                email: 'test2@test.com' // Email diferente
            };

            await expect(User.create(duplicateUser)).rejects.toThrow();
        });

        test('Deve falhar com email duplicado', async () => {
            const userData = {
                username: 'user1',
                email: 'duplicate@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User'
            };

            await User.create(userData);

            // Tentar criar outro usuário com mesmo email
            const duplicateUser = {
                ...userData,
                username: 'user2' // Username diferente
            };

            await expect(User.create(duplicateUser)).rejects.toThrow();
        });

        test('Deve validar role enum', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: 'senha123',
                firstName: 'Test',
                lastName: 'User',
                role: 'invalid_role'
            };

            await expect(User.create(userData)).rejects.toThrow();
        });

        test('Deve validar theme enum', async () => {
            const user = await createTestUser();
            user.theme = 'invalid_theme';

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Hash de Password', () => {
        test('Deve fazer hash da password ao criar usuário', async () => {
            const plainPassword = 'senha123';
            const user = await createTestUser({ password: plainPassword });

            expect(user.password).not.toBe(plainPassword);
            expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // Formato bcrypt
        });

        test('Não deve fazer hash novamente se password não foi modificada', async () => {
            const user = await createTestUser();
            const hashedPassword = user.password;

            user.firstName = 'Novo Nome';
            await user.save();

            expect(user.password).toBe(hashedPassword);
        });
    });

    describe('Método matchPassword', () => {
        test('Deve retornar true para password correta', async () => {
            const plainPassword = 'senha123';
            const user = await createTestUser({ password: plainPassword });

            const isMatch = await user.matchPassword(plainPassword);
            expect(isMatch).toBe(true);
        });

        test('Deve retornar false para password incorreta', async () => {
            const user = await createTestUser({ password: 'senha123' });

            const isMatch = await user.matchPassword('senha_errada');
            expect(isMatch).toBe(false);
        });
    });

    describe('Valores Padrão', () => {
        test('Deve ter role padrão "client"', async () => {
            const user = await createTestUser({ role: undefined });
            expect(user.role).toBe('client');
        });

        test('Deve ter isValidated padrão false', async () => {
            const user = await createTestUser({ isValidated: undefined });
            expect(user.isValidated).toBe(false);
        });

        test('Deve ter theme padrão "light"', async () => {
            const user = await createTestUser();
            expect(user.theme).toBe('light');
        });

        test('Deve ter maxClients padrão 15', async () => {
            const user = await createTestUser({ role: 'trainer' });
            expect(user.maxClients).toBe(15);
        });

        test('Deve ter qrCodeEnabled padrão false', async () => {
            const user = await createTestUser();
            expect(user.qrCodeEnabled).toBe(false);
        });
    });

    describe('Timestamps', () => {
        test('Deve ter createdAt e updatedAt', async () => {
            const user = await createTestUser();

            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        test('Deve atualizar updatedAt ao modificar', async () => {
            const user = await createTestUser();
            const originalUpdatedAt = user.updatedAt;

            // Aguardar um pouco para garantir diferença de timestamp
            await new Promise(resolve => setTimeout(resolve, 10));

            user.firstName = 'Novo Nome';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
});
