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

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', protect, markAsRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', protect, markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;