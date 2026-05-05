const { User } = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getAllRoles, getAllRolesDetailed, isValidRole } = require("../config/roles");

// REGISTER
const register = async (req, res) => {
    try {
        const { username, password, phone, email, gender, role } = req.body;

        // Check if role is valid
        if (!role || !isValidRole(role)) {
            return res.status(400).json({ 
                message: `Invalid role. Allowed roles: ${getAllRoles().join(", ")}` 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }

        const newUser = new User({
            username,
            password,
            phone,
            email,
            gender,
            role
        });

        await newUser.save();

        res.status(201).json({
            message: `User registered with username ${username}`,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Find user by username OR email
        const user = await User.findOne({ 
            $or: [
                { username: username || "" }, 
                { email: email || username || "" } 
            ] 
        });

        if (!user) {
            return res.status(404).json({
                message: `User not found`
            });
        }

        // Compare plain text password
        if (password !== user.password) {
            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }

        // Restrict login to only authorized roles
        if (!isValidRole(user.role)) {
            return res.status(403).json({
                message: "Access denied. Only authorized roles can login."
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "3h" }
        );

        res.status(200).json({ 
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// UPDATE PASSWORD (Forgot Password Style)
const updatePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Validate input
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email not found" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({
            message: "Password updated successfully",
            updatedUser: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        // Save token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // In a real app, send email with reset link
        // For now, return the token (for testing)
        res.status(200).json({
            message: "Password reset token generated. Check your email.",
            resetToken: resetToken, // Remove this in production
            email: user.email
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({
            message: "Password reset successfully",
            email: user.email
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// GET ALL ROLES
const getRoles = async (req, res) => {
    try {
        const roles = getAllRolesDetailed();
        
        res.status(200).json({
            message: "Roles fetched successfully",
            roles: roles,
            count: roles.length
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    register,
    login,
    updatePassword,
    forgotPassword,
    resetPassword,
    getRoles
};