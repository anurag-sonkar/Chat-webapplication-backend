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

    socket.on('disconnect' , ()=>{
        // Remove the disconnected user from the userSocketMap
        userSocketMap.delete(userId)
        console.log(userSocketMap);

        // Emit the updated online users list after disconnection
        io.emit('onlineUsers', Object.keys(userSocketMap));

    })
})


module.exports =  { app, server, io, getReceiverSocketId }

