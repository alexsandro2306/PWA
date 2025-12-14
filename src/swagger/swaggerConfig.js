const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fitness Platform API',
            version: '1.0.0',
            description: 'API para Plataforma de Personal Trainers - Gestão de treinos, clientes e comunicação',
            contact: {
                name: 'Fitness Platform Team',
                email: 'support@fitnessplatform.com'
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Servidor de Desenvolvimento'
            },
            {
                url: 'https://api.fitnessplatform.com',
                description: 'Servidor de Produção'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido após login'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        username: { type: 'string', example: 'joaosilva' },
                        email: { type: 'string', example: 'joao@email.com' },
                        firstName: { type: 'string', example: 'João' },
                        lastName: { type: 'string', example: 'Silva' },
                        role: { type: 'string', enum: ['client', 'trainer', 'admin'], example: 'client' },
                        phone: { type: 'string', example: '+351912345678' },
                        theme: { type: 'string', enum: ['light', 'dark'], example: 'dark' },
                        isValidated: { type: 'boolean', example: true },
                        trainer: { type: 'string', example: '507f1f77bcf86cd799439012' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                TrainingPlan: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        client: { type: 'string' },
                        trainer: { type: 'string' },
                        name: { type: 'string', example: 'Plano de Hipertrofia' },
                        frequency: { type: 'string', enum: ['2x', '3x', '4x', '5x', '6x'], example: '4x' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        isActive: { type: 'boolean', example: true },
                        weeklyPlan: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, example: 1 },
                                    exercises: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string', example: 'Supino Reto' },
                                                sets: { type: 'integer', example: 4 },
                                                reps: { type: 'string', example: '8-12' },
                                                rest: { type: 'string', example: '90s' },
                                                notes: { type: 'string', example: 'Foco na técnica' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                Exercise: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string', example: 'Agachamento' },
                        description: { type: 'string', example: 'Exercício composto para pernas' },
                        category: { type: 'string', enum: ['strength', 'cardio', 'flexibility'], example: 'strength' },
                        muscleGroup: { type: 'string', example: 'Pernas' },
                        videoURL: { type: 'string', example: 'https://youtube.com/watch?v=...' },
                        imageURL: { type: 'string', example: 'https://example.com/agachamento.jpg' },
                        instructions: { type: 'array', items: { type: 'string' } }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        sender: { type: 'string' },
                        receiver: { type: 'string' },
                        content: { type: 'string', example: 'Olá! Como estão os treinos?' },
                        type: { type: 'string', enum: ['message', 'alert'], example: 'message' },
                        read: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                TrainingLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        client: { type: 'string' },
                        trainer: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        isCompleted: { type: 'boolean', example: true },
                        reasonNotCompleted: { type: 'string', example: 'Lesão no joelho' },
                        proofImageURL: { type: 'string' },
                        dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Erro ao processar pedido' },
                        error: { type: 'string' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            { name: 'Auth', description: 'Autenticação e registo' },
            { name: 'Users', description: 'Gestão de utilizadores e perfis' },
            { name: 'Admin', description: 'Funcionalidades administrativas' },
            { name: 'Workouts', description: 'Planos de treino' },
            { name: 'Exercises', description: 'Biblioteca de exercícios' },
            { name: 'Messages', description: 'Sistema de mensagens e alertas' },
            { name: 'Notifications', description: 'Notificações em tempo real' }
        ]
    },
    apis: ['./src/routes/*.js'], // Ficheiros onde estão as anotações
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec
};
