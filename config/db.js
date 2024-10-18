const mongoose = require("mongoose");
// const MONGODB_LOCAL_URL = process.env.MONGODB_LOCAL_URL
const MONGODB_URL = process.env.MONGODB_URL
// connection
// mongoose.connect(MONGODB_LOCAL_URL);
mongoose.connect(MONGODB_URL);

// setup listners
const db = mongoose.connection;

db.on("connected", () => console.log(`Connected To MongoDb Server`.green.bold.underline));
db.on("error", (error) => console.log(error.message));
db.on("disconnected", () => console.log("MongoDb disconnected"));

module.exports = db;
