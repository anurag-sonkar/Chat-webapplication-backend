const express = require("express");
const app = express();
const {createServer} = require('http')
const {Server} = require('socket.io')
const server = createServer(app)
const io = new Server(server)

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
const { NEW_MESSAGE } = require("./constants/events");

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended : false}))


app.use("/", userRoutes);
app.use('/chat' , checkAuthentication ,chatsRoutes)


/* socket.io */
io.on('connect' , (socket)=>{
  console.log("User connected" , socket.id)

  socket.on(NEW_MESSAGE , async(data)=>{
    console.log(data)

  })


  socket.on('disconnect' , ()=>{
    console.log("User Disconnected" , socket.id)
  })

})



app.use(errorMiddleware)

server.listen(PORT, () =>
  console.log(`Server running at : http://localhost:${PORT}`.blue.bold)
);
