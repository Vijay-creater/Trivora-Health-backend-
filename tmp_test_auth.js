const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const { User } = require("./src/models/userModel");
const { register, login, updatePassword, forgotPassword, resetPassword } = require("./src/controller/usercontroller");
const bcrypt = require("bcryptjs");

async function test() {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING || "mongodb://localhost:27017/Vsq_Hospital_db");
        console.log("Connected to MongoDB");

        // Clear test users if any
        await User.deleteMany({ email: /test/ });

        const mockRes = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.data = data;
                return this;
            }
        };

        // 1. Test Registration
        console.log("\n--- Testing Admin Registration ---");
        const adminRegReq = {
            body: {
                username: "testadmin",
                email: "admin@hospital.com",
                password: "admin123",
                role: "ADMIN"
            }
        };
        await register(adminRegReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);

        console.log("\n--- Testing Receptionist Registration ---");
        const recepRegReq = {
            body: {
                username: "testrecep",
                email: "receptionist@hospital.com",
                password: "recep123",
                role: "V_SQ_RECEPTIONIST"
            }
        };
        await register(recepRegReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);

        console.log("\n--- Testing Chief Doctor Registration ---");
        const chiefRegReq = {
            body: {
                username: "testchief",
                email: "chiefdoctor@hospital.com",
                password: "doctor123",
                role: "CHIEF_DOCTOR"
            }
        };
        await register(chiefRegReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);

        console.log("\n--- Testing Lab Admin Registration ---");
        const labadminRegReq = {
            body: {
                username: "testlabadmin",
                email: "labadmin@hospital.com",
                password: "lab123",
                role: "LAB_ADMIN"
            }
        };
        await register(labadminRegReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);

        // 2. Test Login
        console.log("\n--- Testing Admin Login (by email) ---");
        const adminLoginReq = {
            body: {
                email: "admin@hospital.com",
                password: "admin123"
            }
        };
        await login(adminLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        console.log("\n--- Testing Receptionist Login (by username) ---");
        const recepLoginReq = {
            body: {
                username: "receptionist",
                password: "recep123"
            }
        };
        await login(recepLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        console.log("\n--- Testing Chief Doctor Login (by email) ---");
        const chiefLoginReq = {
            body: {
                email: "chiefdoctor@hospital.com",
                password: "doctor123"
            }
        };
        await login(chiefLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        // 3. Test Password Update by Email (Forgot Password Style)
        console.log("\n--- Testing Password Update for Chief Doctor by Email ---");
        const updateChiefPasswordReq = {
            body: {
                email: "chiefdoctor@hospital.com",
                newPassword: "newchiefpassword456"
            }
        };
        await updatePassword(updateChiefPasswordReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);
        console.log("Updated User Email:", mockRes.data.updatedUser?.email);

        console.log("\n--- Testing Login with Updated Chief Doctor Password ---");
        const updatedChiefLoginReq = {
            body: {
                email: "chiefdoctor@hospital.com",
                password: "newchiefpassword456"
            }
        };
        await login(updatedChiefLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        console.log("\n--- Testing Password Update for Receptionist by Email ---");
        const updateRecepPasswordReq = {
            body: {
                email: "receptionist@hospital.com",
                newPassword: "newrecepcpassword789"
            }
        };
        await updatePassword(updateRecepPasswordReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);
        console.log("Updated User Email:", mockRes.data.updatedUser?.email);

        console.log("\n--- Testing Login with Updated Receptionist Password ---");
        const updatedRecepLoginReq = {
            body: {
                email: "receptionist@hospital.com",
                password: "newrecepcpassword789"
            }
        };
        await login(updatedRecepLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        // 4. Test Forgot Password
        console.log("\n--- Testing Forgot Password for Receptionist ---");
        const forgotPasswordReq = {
            body: {
                email: "receptionist@hospital.com"
            }
        };
        await forgotPassword(forgotPasswordReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);
        console.log("Reset Token:", mockRes.data.resetToken);
        console.log("Email:", mockRes.data.email);
        const resetToken = mockRes.data.resetToken; // Store token for reset

        console.log("\n--- Testing Reset Password ---");
        const resetPasswordReq = {
            body: {
                token: resetToken,
                newPassword: "resetpassword123"
            }
        };
        await resetPassword(resetPasswordReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);
        console.log("Email:", mockRes.data.email);

        console.log("\n--- Testing Login with Reset Password ---");
        const resetLoginReq = {
            body: {
                email: "receptionist@hospital.com",
                password: "resetpassword123"
            }
        };
        await login(resetLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Role in response:", mockRes.data.user?.role);
        console.log("Token exists:", !!mockRes.data.token);

        // 5. Test Invalid Login
        console.log("\n--- Testing Invalid Login ---");
        const invalidLoginReq = {
            body: {
                email: "admin@hospital.com",
                password: "wrongpassword"
            }
        };
        await login(invalidLoginReq, mockRes);
        console.log("Status:", mockRes.statusCode);
        console.log("Response:", mockRes.data.message);

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("\nDisconnected from MongoDB");
    }
}

test();
