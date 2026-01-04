const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

// GET /api/notifications - Get user notifications
router.get('/', protect, getNotifications);

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', protect, markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', protect, markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;