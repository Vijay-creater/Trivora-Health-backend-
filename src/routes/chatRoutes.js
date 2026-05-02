const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
    getUserGroups,
    createGroup,
    addMember,
    removeMember,
    getMessages,
    sendMessage,
    markDelivered,
    markSeen,
    togglePinMessage,
    deleteMessage,
    searchMessages,
    searchUsers
} = require("../controller/chatController");

// All routes require authentication
router.use(verifyToken);

// Group routes
router.get('/groups', getUserGroups);
router.post('/groups', createGroup);
router.post('/groups/:groupId/members', addMember);
router.delete('/groups/:groupId/members/:userId', removeMember);

// Message routes
router.get('/messages/:groupId', getMessages);
router.post('/messages', sendMessage);
router.post('/messages/:messageId/delivered', markDelivered);
router.post('/messages/:messageId/seen', markSeen);
router.get('/messages/:groupId/search', searchMessages);

// Message actions
router.post('/messages/:messageId/pin', togglePinMessage);
router.delete('/messages/:messageId', deleteMessage);

// File upload
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;
        
        res.status(200).json({
            success: true,
            data: {
                url: fileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
});

// User search
router.get('/users/search', searchUsers);

module.exports = router;
