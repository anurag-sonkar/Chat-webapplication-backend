const express  = require('express')
const {Server} = require('socket.io')
const {createServer} = require('http')

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*", // frontend's origin - allowing all    
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
})



const userSocketMap = new Map() // {userId -> socketId}

const getReceiverSocketId = (id) => userSocketMap.get(id)

io.on('connection' , (socket)=>{

    const userId = socket.handshake.query.userId
    if(userId !== undefined){
        // userSocketMap[userId] = socket.id
        userSocketMap.set(userId , socket.id)

        console.log(userSocketMap)
    }

    io.emit('onlineUsers', Array.from(userSocketMap.keys()))

    // Listen for typing events
    socket.on("typing", (data) => {
        // const receiverId = getReceiverSocketId(data.userId)
        // console.log(data.userId)
        socket.broadcast.emit("displayTyping", data.userId);
        // io.to(receiverId).emit("displayTyping", data);
    });
    
    // Listen for stop typing events
    socket.on("stopTyping", (data) => {
        // const receiverId = getReceiverSocketId(data.userId)
        socket.broadcast.emit("removeTyping", data.userId);
        // io.to(receiverId).emit("removeTyping", data);
    });

    socket.on('disconnect', () => {
        userSocketMap.delete(userId);
        console.log(userSocketMap);

        // Emit the updated online users list after disconnection
        io.emit('onlineUsers', Array.from(userSocketMap.keys())); // Corrected from Object.keys to Array.from
    });

})


module.exports =  { app, server, io, getReceiverSocketId }

