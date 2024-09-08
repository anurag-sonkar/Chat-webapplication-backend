const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const Cors = require("cors");
const PORT = process.env.PORT;
const data = require("./data/data");
const db = require("./config/db");
const colors = require('colors')
const userRoutes = require('./routes/user')

app.use(Cors());
app.use(express.json())

app.get("/api/chats", async (req, res) => {
  return res.send(data);
});

app.use("/", userRoutes);

app.listen(PORT, () =>
  console.log(`Server running at : http://localhost:${PORT}`.blue.bold)
);
