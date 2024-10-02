const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: false,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  attachments: [
    {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ]
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
