const express = require("express");
const {app,server ,io} = require('./socket/socket')

const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const PORT = process.env.PORT;
const db = require("./config/db");
const colors = require('colors')
const userRoutes = require('./routes/user')
const chatsRoutes = require('./routes/chats');
const {errorMiddleware} = require("./middleware/error");
const checkAuthentication = require("./middleware/checkAuthentication");

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended : false}))


app.use("/", userRoutes);
app.use('/chat' , checkAuthentication ,chatsRoutes)

app.use(errorMiddleware)

server.listen(PORT, () =>
  console.log(`Server running at : http://localhost:${PORT}`.blue.bold)
);
