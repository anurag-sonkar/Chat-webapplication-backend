const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    name : {type:String , trim : true},
    isGroupChat: {type:Boolean, default:false},
    groupAdmin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,

        }
    },
    // latestMessage : {
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref : "Message"
        
    // },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
} , {timestamps : true})

const Chat = mongoose.model('Chat' , chatSchema)

module.exports = Chat