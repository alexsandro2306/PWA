const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { uploadAvatar, uploadProofImage } = require('../middlewares/uploadMiddleware');
const User = require('../models/User');

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload de avatar do utilizador
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Imagem do avatar (JPEG, PNG, GIF, WebP)
 *     responses:
 *       200:
 *         description: Avatar carregado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                   example: /uploads/avatars/avatar-1234567890.jpg
 *       400:
 *         description: Ficheiro inválido ou não fornecido
 *       401:
 *         description: Não autorizado
 */
router.post('/avatar', protect, uploadAvatar, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum ficheiro foi enviado'
            });
        }

        // Atualizar URL do avatar no utilizador
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        await User.findByIdAndUpdate(req.user._id, {
            avatar: avatarUrl
        });

        res.json({
            success: true,
            message: 'Avatar carregado com sucesso',
            avatarUrl: avatarUrl
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload do avatar',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/upload/training-proof:
 *   post:
 *     summary: Upload de comprovativo de treino
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - proofImage
 *             properties:
 *               proofImage:
 *                 type: string
 *                 format: binary
 *                 description: Imagem de comprovativo (JPEG, PNG, GIF, WebP)
 *     responses:
 *       200:
 *         description: Comprovativo carregado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 proofUrl:
 *                   type: string
 *                   example: /uploads/proofs/proofImage-1234567890.jpg
 *       400:
 *         description: Ficheiro inválido
 *       401:
 *         description: Não autorizado
 */
router.post('/training-proof', protect, uploadProofImage, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum ficheiro foi enviado'
            });
        }

        const proofUrl = `/uploads/proofs/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Comprovativo de treino carregado com sucesso',
            proofUrl: proofUrl,
            filename: req.file.filename,
            size: req.file.size
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload do comprovativo',
            error: error.message
        });
    }
});

module.exports = router;
