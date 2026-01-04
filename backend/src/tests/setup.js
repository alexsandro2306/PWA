const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup antes de todos os testes
beforeAll(async () => {
    try {
        // Fechar conexão existente se houver
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Criar instância do MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Conectar ao MongoDB em memória (sem opções deprecated)
        await mongoose.connect(mongoUri);

        console.log('✅ MongoDB Memory Server conectado');
    } catch (error) {
        console.error('❌ Erro ao conectar MongoDB Memory Server:', error);
        throw error;
    }
});

// Limpar dados entre testes
afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

// Cleanup após todos os testes
afterAll(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('✅ MongoDB Memory Server desconectado');
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
    }
});

// Aumentar timeout global para testes
jest.setTimeout(10000);
