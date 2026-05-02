const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const { User } = require("../models/userModel");

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Access denied
 */
router.get("/all", verifyToken, async (req, res) => {
    try {
        const users = await User.find().select('-password -resetToken -resetTokenExpiry');
        
        // Transform users to include fullName
        const transformedUsers = users.map(user => ({
            id: user._id.toString(),
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone,
            gender: user.gender,
            fullName: user.username, // Use username as fullName for now
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: transformedUsers,
            count: transformedUsers.length
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Admin only endpoint
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message for admin
 *       403:
 *         description: Access denied
 */
router.get("/admin", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
    res.json({ message: "welcome Admin" });
})

/**
 * @swagger
 * /api/users/receptionist:
 *   get:
 *     summary: Admin and Receptionist endpoint
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message for receptionist
 *       403:
 *         description: Access denied
 */
router.get("/receptionist", verifyToken, authorizeRoles("ADMIN", "V_SQ_RECEPTIONIST"), (req, res) => {
    res.json({ message: "Welcome Receptionist" });
});

/**
 * @swagger
 * /api/users/chief-doctor:
 *   get:
 *     summary: Chief Doctor only endpoint
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message for chief doctor
 *       403:
 *         description: Access denied
 */
router.get("/chief-doctor", verifyToken, authorizeRoles("CHIEF_DOCTOR"), (req, res) => {
    res.json({ message: "Welcome Chief Doctor" });
});

/**
 * @swagger
 * /api/users/lab-admin:
 *   get:
 *     summary: Admin and Lab Admin endpoint
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message for lab admin
 *       403:
 *         description: Access denied
 */
router.get("/lab-admin", verifyToken, authorizeRoles("ADMIN", "LAB_ADMIN"), (req, res) => {
    res.json({ message: "Welcome Lab Admin" });
});

module.exports = router;