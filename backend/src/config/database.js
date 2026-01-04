const mongoose = require("mongoose");

// Função para estabelecer a conexão com o MongoDB
const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log(
			`MongoDB Conectado: ${conn.connection.host}`.cyan.underline.bold
		);
	} catch (error) {
		console.error(`Erro: ${error.message}`.red.underline.bold);
		// Termina o processo com falha
		process.exit(1);
	}
};

module.exports = connectDB;
