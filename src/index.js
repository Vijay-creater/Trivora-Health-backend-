// import the express
const express = require("express");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv").config();
const dbConnect = require("./config/dbConnect");
const authRoutes = require("./routes/authroutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { swaggerUi, specs } = require("./config/swagger");
const { initializeSocket } = require("./services/socketService");

dbConnect();

const app = express();
const server = http.createServer(app);

const cors = require('cors');

// Add this BEFORE your routes
app.use(cors({
  origin: '*',  // your frontend URL
  credentials: true
}));

//Middleware
app.use(express.json());

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Initialize Socket.IO
initializeSocket(server);

//start the server 
const PORT = process.env.PORT  || 7002;
server.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
    console.log(`WebSocket server initialized`);
});
