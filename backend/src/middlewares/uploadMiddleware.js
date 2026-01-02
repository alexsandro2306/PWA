const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que os diretórios de upload existem
const uploadDirs = ['uploads/avatars', 'uploads/proofs', 'uploads/exercises'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuração do Armazenamento (Storage) por categoria
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';

        // Determinar diretório baseado no campo
        if (file.fieldname === 'avatar') {
            uploadPath = 'uploads/avatars/';
        } else if (file.fieldname === 'proofImage') {
            uploadPath = 'uploads/proofs/';
        } else if (file.fieldname === 'exerciseImage' || file.fieldname === 'exerciseVideo') {
            uploadPath = 'uploads/exercises/';
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Gera um nome único: userId ou timestamp + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const fieldname = file.fieldname;

        cb(null, `${fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Filtro de Ficheiros (File Filter)
const fileFilter = (req, file, cb) => {
    // Permitir imagens e vídeos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|ogg/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // Verificar se é imagem
    if (mimetype.startsWith('image/') && allowedImageTypes.test(extname.slice(1))) {
        return cb(null, true);
    }

    // Verificar se é vídeo (apenas para exercícios)
    if (file.fieldname === 'exerciseVideo' && mimetype.startsWith('video/') && allowedVideoTypes.test(extname.slice(1))) {
        return cb(null, true);
    }

    cb(new Error('Tipo de ficheiro não permitido. Apenas imagens (JPEG, PNG, GIF, WebP) ou vídeos (MP4, WebM, OGG) para exercícios.'));
};

// Inicialização do Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

// Middlewares de upload específicos
exports.uploadAvatar = upload.single('avatar');
exports.uploadProofImage = upload.single('proofImage');
exports.uploadExerciseImage = upload.single('exerciseImage');
exports.uploadExerciseVideo = upload.single('exerciseVideo');
exports.uploadMultipleImages = upload.array('images', 5); // Até 5 imagens

// Função auxiliar para apagar ficheiro
exports.deleteFile = (filepath) => {
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
};