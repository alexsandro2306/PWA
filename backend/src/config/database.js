const mongoose = require('mongoose');

// Função para estabelecer a conexão com o MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
           
            useNewUrlParser: true, // Garante que a string de conexão é analisada corretamente
            useUnifiedTopology: true, // Novo motor de descoberta e monitoramento de servidores
            // useCreateIndex: true, // Já não é necessário na versão 6+
            // useFindAndModify: false // Já não é necessário na versão 6+
        });

        console.log(`MongoDB Conectado: ${conn.connection.host}`.cyan.underline.bold);
        
    } catch (error) {
        console.error(`Erro: ${error.message}`.red.underline.bold);
        // Termina o processo com falha
        process.exit(1); 
    }
};

module.exports = connectDB;

