const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const { unreadOnly } = req.query;

        let filter = { recipient: req.user._id };

        if (unreadOnly === 'true') {
            filter.isRead = false;
        }

        const notifications = await Notification.find(filter)
            .populate('sender', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter notificações',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await notification.markAsRead();

        res.json({
            success: true,
            data: notification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificação',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'Todas as notificações marcadas como lidas'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificações',
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notificação eliminada'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar notificação',
            error: error.message
        });
    }
};

// @desc    Create notification (internal use)
exports.createNotification = async (data) => {
    try {
        return await Notification.createNotification(data);
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        return null;
    }
};