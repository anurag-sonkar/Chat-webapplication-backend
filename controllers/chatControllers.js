const Chat = require('../models/chat')
const User = require('../models/user')
const asyncHandler = require('express-async-handler');
const Message = require('../models/message');
const { response } = require('express');
const { deleteImage, uploadAttachmentsToCloudinary } = require('../middleware/upload');
const { getReceiverSocketId , io } = require('../socket/socket');

// 1.group chat create
const handleCreateGroupChat = asyncHandler(async (req, res, next) => {
  const { members, name } = req.body
  if (!members || !name) {
    return res.status(400).send({ message: "Please Add Atleast 2 Group Members and Set Group Name" });
  }

  // var users = JSON.parse(req.body.users);

  if (members.length < 2) {
    return res
      .status(400)
      .send("More than 2 members are required to form a group chat");
  }

  // users.push(req.user);

  try {
    const groupChat = await Chat.create({
      name: req.body.name,
      members: [...members, req.user._id],
      isGroupChat: true,
      groupAdmin: req.user._id,
      avatar: req.avatar || {  // If no avatar then set default avatar - change in future
        public_id: null,
        url: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
      }
    });

    // const fullGroupChat = await Chat.findOne({ _id: groupChat._id })


    res.status(200).json(groupChat);
  } catch (error) {
    next(error)

  }
});

//2. get my chats
const handleGetMyChats = async (req, res, next) => {
  try {
    // Fetch the chats where the user is a member
    const chats = await Chat.find({ members: req.user._id })
      .populate("groupAdmin")
      .populate("members"); // Populate members to access full user objects

    
    // Transform the chats to remove the current user's ID from members
    const transformedChats = chats.map(chat => {
      return {
        ...chat._doc, // Spread the original chat object
        members: chat.members.filter(member => member._id.toString() !== req.user._id.toString()) // Filter out the current user
      };
    });

    res.status(200).json(transformedChats);
  } catch (error) {
    next(error)

  }
};

//3. getMygroups
const handleGetMyGroups = async (req, res) => {
  const chats = await Chat.find({
    isGroupChat: true,
    groupAdmin: req.user._id
  }).populate(["groupAdmin", "members"])

  // Transform the chats to remove the current user's ID from members
  const transformedChats = chats.map(chat => {
    return {
      ...chat._doc, // Spread the original chat object
      members: chat.members.filter(member => member._id.toString() !== req.user._id.toString()) // Filter out the current user
    };
  });

  return res.status(200).json(transformedChats)
}

//4. add memebers in group

const handleAddGroupMembers = async (req, res, next) => {
  const { chatId, members } = req.body

  if (!chatId || !members || members.length <= 0) return res.status(400).json({ message: "chatId , members are required" })

  const chat = await Chat.findOne({ _id: chatId })

  if (!chat) return res.status(400).json({ message: "chat not found" })

  if (!chat.isGroupChat) return res.status(400).json({ message: "not a group chat" })

  try {
    if (chat.groupAdmin.toString() != req.user._id.toString()) return res.status(400).json({ message: "not a group admin" })


    // now adding add members - which is not already in chat.members
    const updatedMembers = await Chat.findByIdAndUpdate({ _id: chatId }, {
      $addToSet: { members: { $each: members } }
    }, { new: true }) // Add only unique members
    // console.log(updatedMembers)

    return res.status(201).json({ message: "members added successfully" })
  } catch (error) {
    next(error)


  }

}


//5. remove single gruop member
const handleRemoveGroupMember = async (req, res, next) => {
  const { userId, chatId } = req.body

  if (!userId || !chatId) return next(new Error("userid ,chatid required to remove user from group"))

  // find group
  const group = await Chat.findById(chatId)
  if (!group) return res.status(400).json({ message: "group not found" })

  // check group length , which must not be less than 3 
  if (group.members.length <= 3) return res.status(400).json({ message: "can't remove member , group required atleast 3 members" })

  // only admin operation
  if (group.groupAdmin.toString() != req.user._id.toString()) return res.status(400).json({ message: "not a group admin" })

  // find user
  const userToRemove = await User.findById(userId)

  // if going to remove admin ? , avoid to remove admin itself
  if (group.groupAdmin.toString() === userToRemove._id.toString()) {
    console.log(group.groupAdmin.toString(), userToRemove._id.toString())
    return res.status(400).json({ message: "first assign admin to other group member / admin can't leave the group / admin can delete the group" })
  }

  // Check if the member is in the members array
  if (!group.members.includes(userId)) {
    return res.status(404).json({ message: `${userToRemove.name} not found in the group` });
  }

  try {
    // If the member is found, remove it
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { members: userId } }, // Pull the member from the array
      { new: true } // Return the updated document
    );

    return res.status(200).json({ message: `${userToRemove.name} removed from group` })

    // console.log(updatedChat)
  } catch (error) {
    next(error)
  }
}

//6. leave the group - a. atleast gp member - 3 if less than delete the group , b. admin itself can't leave the group it will first need to make other as admin 

const handleLeaveFromGroup = async (req, res, next) => {
  const groupId = req.params.id // group/chat id as params

  const group = await Chat.findById(groupId)
  if (!group) return next(new Error("Group not found"))

  // check is admin want to leave the group
  if (group.groupAdmin.toString() === req.user._id.toString()) {
    console.log(group.groupAdmin.toString(), req.user._id.toString())
    return res.status(400).json({ message: "first assign admin to other group member / admin can't leave the group / admin can delete the group" })
  }

  // if not admin then remove the req.user._id fro the group chat using its given groupId
  try {
    // now check if group length is less than 3 then delete that 
    if (group.members.length <= 3) {
      const response = await Chat.findByIdAndDelete(groupId)
      console.log(response)
      return res.status(201).json({ message: `${req.user.name} leaved the group , group deleted because only 2 members are left` })
    } else {
      // If the member is found, remove it
      const updatedChat = await Chat.findByIdAndUpdate(
        groupId,
        { $pull: { members: req.user._id } }, // Pull the member from the array
        { new: true } // Return the updated document
      );
      console.log(updatedChat)
      return res.status(200).json({ message: `${req.user.name} leaved the group` })
    }
  } catch (error) {
    next(error)
  }

}


//7.
// const handleSendAttachments = async (req, res, next) => {
//   const { chatId } = req.body;
//   const files = req.files || [];

//   if (files.length === 0)
//     return next(new Error("Please Upload Attachments"));

//   if (files.length > 5)
//     return next(new Error("Files Can't be more than 5"));

//   const chat = await Chat.findById(chatId);
//   if (!chat) return next(new Error("Chat not found"));

//   // Upload files to cloudinary
//   const attachments = await uploadFilesToCloudinary(files);
//   console.log(attachments)

//   // Prepare message for DB and real-time events
//   const messageForDB = {
//     sender: req.user._id,
//     content: "",
//     chat: chatId,
//     attachments,
//   };

//   const message = await Message.create(messageForDB);

//   const messageForRealTime = {
//     ...messageForDB,
//     sender: { _id: req.user._id, name: req.user.name },
//   };

//   // Emit real-time events
//   // emitEvent(req, NEW_MESSAGE, chat.members, { message: messageForRealTime, chatId });
//   // emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });


//   return res.status(200).json({ success: true, message });
// }

const handleSendMessage = async (req, res, next) => {
  try {
    const { content, chatId } = req.body;
    const files = req.files || [];
    console.log(req.body)

    // Check if more than 5 files are uploaded
    if (files.length > 5) {
      return next(new Error("Files can't be more than 5"));
    }

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) return next(new Error("Chat not found"));

    // Upload attachments to Cloudinary if there are any
    let attachments = [];
    if (files.length > 0) {
      attachments = await uploadAttachmentsToCloudinary(files);
      console.log("Uploaded Attachments:", attachments); // Attachments will have public_id and URL
    }

    // Prepare message object for saving in DB
    const messageForDB = {
      sender: req.user._id,
      content: content,
      chat: chatId,
      attachments, // Add the uploaded attachments to the message
    };

    // Save the message to the database
    const message = await Message.create(messageForDB);

    // Populate sender and chat details after creation
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('chat')
      .exec();

    // Emit the new message to all members of the chat
    const members = chat.members;
    members.forEach(memberId => {
      if (memberId.toString() !== req.user._id.toString()) {
        const memberSocketId = getReceiverSocketId(memberId.toString()); // Retrieve socket ID from your mapping
        if (memberSocketId) {
          io.to(memberSocketId).emit('new-message', populatedMessage);
        }
      }
    });

    
    // Respond with the newly created message
    return res.status(200).json({
      message: populatedMessage,
    });
  } catch (error) {
    return next(error);
  }
};





// 8.
const handleGetChatDetails = async (req, res, next) => {
  const chatId = req.params.id
  if (!chatId) return next(new Error("chat id is required"))

  try {
    const chat = await Chat.findById(chatId).populate('members', 'name avatar').lean()

    if (!chat) {
      return next(new Error("chat not  found"))
    }

    // to change use : lean() while getting from db
    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url
    }))
    return res.status(200).json(chat)

  } catch (error) {
    next(error)
  }
}

//9.
const handleRenameGroup = asyncHandler(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  // must be groupchat and admin is allowed
  const chat = await Chat.findById(chatId)
  if (!chat.isGroupChat) return next(new Error('group chat name can only be changed'))
  if (chat.groupAdmin.toString() !== req.user._id.toString()) return next(new Error('only admin can changed the group name'))

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      name: chatName,
    },
    {
      new: true,
    }
  )

  if (!updatedChat) {
    next(new Error("Chat Not Found"))

  } else {
    res.json(updatedChat);
  }
});

//10. delete chats
const handleDeleteChat = async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new Error("Chat not found"));

  const members = chat.members;

  if (chat.isGroupChat && chat.groupAdmin.toString() !== req.user._id.toString())
    return next(
      new Error("You are not allowed to delete the group")
    );

  if (!chat.isGroupChat && !chat.members.includes(req.user._id.toString())) {
    return next(
      new Error("You are not allowed to delete the chat")
    );
  }

  //   Here we have to dete All Messages as well as attachments or files from cloudinary

  const messagesWithAttachments = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const public_ids = [];

  messagesWithAttachments.forEach(({ attachments }) =>
    attachments.forEach(({ public_id }) => public_ids.push(public_id))
  );

  await Promise.all([
    deleteImage(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  // emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
}

//11. get messages
const handleGetMessages = async (req, res, next) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;

  const resultPerPage = 20; // limit
  const skip = (page - 1) * resultPerPage;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new Error("Chat not found"));

  if (!chat.members.includes(req.user._id.toString()))
    return next(
      new Error("You are not allowed to access this chat")
    );

  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender" ,'name avatar')
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  return res.status(200).json({
    messages: messages.reverse(),
    totalPages,
  });
}




module.exports = { handleCreateGroupChat, handleRenameGroup, handleGetMyChats, handleGetMyGroups, handleAddGroupMembers, handleRemoveGroupMember, handleLeaveFromGroup, handleGetChatDetails, handleDeleteChat, handleGetMessages, handleSendMessage }

