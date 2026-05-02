const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(
      `Database connected: ${connect.connection.host}, ${connect.connection.name}`
    );
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = dbConnect;