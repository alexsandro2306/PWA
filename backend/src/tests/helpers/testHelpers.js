const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Gerar token JWT para testes
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', {
        expiresIn: '1d'
    });
};

/**
 * Criar usuário de teste
 */
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        isValidated: true
    };

    const userData = { ...defaultUser, ...overrides };
    const user = await User.create(userData);

    return user;
};

/**
 * Criar trainer de teste
 */
const createTestTrainer = async (overrides = {}) => {
    return createTestUser({
        role: 'trainer',
        isValidated: true,
        ...overrides
    });
};

/**
 * Criar cliente de teste
 */
const createTestClient = async (trainerId = null, overrides = {}) => {
    return createTestUser({
        role: 'client',
        trainer: trainerId,
        ...overrides
    });
};

/**
 * Dados mock para plano de treino
 */
const mockTrainingPlan = (clientId, trainerId, overrides = {}) => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
        client: clientId,
        trainer: trainerId,
        name: 'Plano de Teste',
        frequency: 4,
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
        weeklyPlan: [
            {
                dayOfWeek: 1,
                exercises: [
                    {
                        name: 'Supino',
                        sets: 4,
                        reps: '10',
                        instructions: 'Controlar descida',
                        order: 1
                    }
                ]
            },
            {
                dayOfWeek: 3,
                exercises: [
                    {
                        name: 'Agachamento',
                        sets: 4,
                        reps: '12',
                        instructions: 'Manter costas retas',
                        order: 1
                    }
                ]
            },
            {
                dayOfWeek: 5,
                exercises: [
                    {
                        name: 'Levantamento Terra',
                        sets: 3,
                        reps: '8',
                        instructions: 'Pegada firme',
                        order: 1
                    }
                ]
            },
            {
                dayOfWeek: 6,
                exercises: [
                    {
                        name: 'Desenvolvimento',
                        sets: 4,
                        reps: '10',
                        instructions: 'Não arquear costas',
                        order: 1
                    }
                ]
            }
        ],
        ...overrides
    };
};

module.exports = {
    generateToken,
    createTestUser,
    createTestTrainer,
    createTestClient,
    mockTrainingPlan
};
