const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const Exercise = require('../models/Exercise');

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Listar exercícios
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: muscleGroup
 *         schema:
 *           type: string
 *         description: Filtrar por grupo muscular
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de exercícios
 */
router.get('/', protect, async (req, res) => {
    try {
        const { muscleGroup, difficulty, search, page = 1, limit = 10 } = req.query;

        let query = {};
        if (muscleGroup) query.muscleGroup = muscleGroup;
        if (difficulty) query.difficulty = difficulty;
        if (search) query.name = { $regex: search, $options: 'i' };

        const exercises = await Exercise.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 });

        const count = await Exercise.countDocuments(query);

        res.json({
            success: true,
            results: exercises.length,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: exercises
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/exercises/{id}:
 *   get:
 *     summary: Ver detalhes de exercício
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do exercício
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ success: false, message: 'Exercício não encontrado' });
        }
        res.json({ success: true, data: exercise });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/exercises:
 *   post:
 *     summary: Criar novo exercício (Trainer/Admin)
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - muscleGroup
 *               - difficulty
 *             properties:
 *               name:
 *                 type: string
 *                 example: Supino Reto
 *               muscleGroup:
 *                 type: string
 *                 example: Peito
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: intermediate
 *               description:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exercício criado
 *       403:
 *         description: Apenas trainers/admins
 */
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
    try {
        const exercise = await Exercise.create(req.body);
        res.status(201).json({ success: true, data: exercise });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
