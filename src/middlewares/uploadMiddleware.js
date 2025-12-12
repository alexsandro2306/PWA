const multer = require('multer');
const path = require('path');

// 1. Configuração do Armazenamento (Storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 
        // Define o diretório de destino (relativo ao root do projeto)
        // O diretório 'uploads' deve existir
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Gera um nome único para evitar colisões
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Filtro de Ficheiros (File Filter)
const fileFilter = (req, file, cb) => {
    // Verifica o tipo MIME
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Aceita
    } else {
        cb(null, false); // Rejeita
        // Pode anexar um erro à requisição, se necessário
    }
};

// 3. Inicialização do Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    }
});

// Middleware de upload (para ser usado nas rotas)
exports.uploadProofImage = upload.single('proofImage'); // 'proofImage' é o nome do campo no formulário