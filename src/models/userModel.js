const mongoose = require("mongoose");
const { getAllRoles } = require("../config/roles");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: getAllRoles(),
        default: "ADMIN"
    },
    phone: {
        type: Number,
        required: false,
    },
    gender: {
        type: String,
        required: false,
    },
    resetToken: {
        type: String,
        required: false,
    },
    resetTokenExpiry: {
        type: Date,
        required: false,
    }
}, {
    timestamps: true,
    collection: "users" // Unified collection (standard lowercase)
});

const User = mongoose.model("User", userSchema);
const Admin = User;
const Receptionist = User;
const ChiefDoctor = User;
const LabAdmin = User;

module.exports = { User, Admin, Receptionist, ChiefDoctor, LabAdmin };