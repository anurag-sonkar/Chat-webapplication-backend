const generateToken = require('../config/generateToken');
const { uploadToCloudinary, deleteCloudinaryImage } = require('../middleware/upload');
const Request = require('../models/request');
const User = require('../models/user')
const Chat = require('../models/chat')
const bcrypt = require("bcryptjs");
const asyncHandler = require('express-async-handler');


const handleUserSignup = asyncHandler(async (req, res, next) => {
    const { name, email, password, avatar, gender } = req.body

    // check empty
    if (!name || !email || !password) {
        return res.status(400).json({ message: "name/email/password reuiqred to signup" });
    }

    try {
        // check already exists or not
        const response = await User.findOne({ email })

        if (!response) {

            let uploadAvatar;
            if (req.file) {
                uploadAvatar = await uploadToCloudinary(req.file.buffer)
            } else {
                const placeholderAvatar = gender === 'male' ? `https://avatar.iran.liara.run/public/boy?username=${email}` : `https://avatar.iran.liara.run/public/girl?username=${email}`

                uploadAvatar = {
                    public_id: null,
                    url: placeholderAvatar
                }

            }

            const user = await User.create({
                name, email, password, gender, avatar: uploadAvatar
            })

            if (user) {
                // create token 
                return res.status(201).json({
                    response: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        gender,
                        token: generateToken(user._id)
                    },
                    message: "registered successfully"

                })
            } else {
                return res.status(400).json({ message: "failed to signup Try again!" })
            }


        } else {
            return res.status(400).json({ message: "user already exists" })
        }

    } catch (error) {
        next(error)

    }

})


const handleAvatarUpdate = asyncHandler(async (req, res, next) => {
    const { public_id } = req.body
    try {
        if (public_id != null) {
            const response = deleteCloudinaryImage(public_id)
            console.log(response)
        }

        let uploadAvatar;
        if (req.file) {
            uploadAvatar = await uploadToCloudinary(req.file.buffer)
            console.log("uploadAvatar", uploadAvatar)

        }

        const response = await User.findByIdAndUpdate(req.user._id, {
            avatar: {
                public_id: uploadAvatar.public_id,
                url: uploadAvatar.secure_url,
            }

        }, { new: true })

        if (response) {
            return res.status(201).json({ response: response, message: "uploaded successfully" })
        }


    } catch (error) {
        next(error)


    }
})


const handleUserLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    console.log(req.body)

    if (!email || !password) {
        return res.status(400).json({ message: "email and password required to login" });
    }

    try {
        const user = await User.findOne({ email }).select('+password')
        console.log(user)

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({ message: "Password not matched" });
                // return next(new Error("Password not Matched"))
            } else {
                return res.status(200).json({
                    message: "login successfully",
                    response: {
                        _id: user._id,
                        name: user.name,
                        gender: User.gender,
                        email: user.email,
                        avatar: user.avatar,
                        token: generateToken(user._id)
                    }
                })
            }
        } else {
            return res.status(400).json({ message: "inValid email" });

        }

    } catch (error) {
        next(error)
    }
})

const handleGetMyProfile = asyncHandler(async (req, res, next) => {
    try {
        const { _id } = req.user
        const user = await User.findOne({ _id })
        return res.status(200).json(user)
    } catch (error) {

        next(error)
    }
})

const handleSearchQuery = asyncHandler(async (req, res) => {
    const search = req.query.search
    console.log(search)
    const user = req.user

    const searchKeyword = { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }

    const response = await User.find({
        ...searchKeyword,
        _id: { $ne: user._id }  // Combine both conditions in a single find query
    })

    console.log("search res : ", response)
    res.status(200).json(response)


})


// send friend request
const handleSendFriendRequest = async (req, res, next) => {
    const { userId } = req.body

    if (!userId) {
        next(new Error('userId required to send friend request'))
    }

    // agar request already hai to show krdo only ki already send , otherwise send the request
    const request = await Request.findOne({ $or: [{ sender: req.user._id, receiver: userId }, { sender: userId, receiver: req.user._id }] })
    if (request) return res.json({ message: "request already send" })


    await Request.create({
        sender: req.user._id,
        receiver: userId,
        status: "pending"
    })


    // emit event send - new Request

    return res.status(200).json({ message: "friend request send" })
}


//

const handleAcceptFriendRequest = async (req, res, next) => {
    const { requestId, accept } = req.body;

    if (!requestId) {
        next(new Error('requestId required to accept friend request'))
    }

    const request = await Request.findById(requestId).populate('sender', 'name').populate('receiver', 'name')

    if (!request) return next(new Error('request not found'))

    if (request.receiver._id.toString() !== req.user._id.toString())
        return next(
            new Error("You are not authorized to accept this request")
        );

    if (!accept) {
        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected",
        });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ]);

    // emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: "Friend Request Accepted",
        senderId: request.sender._id,
    });

}



const handleGetMyNotifications = async (req, res, next) => {
    const requests = await Request.find({ receiver: req.user._id }).populate(
        "sender",
        "name avatar"
    );
    console.log(requests)

    const allRequests = requests.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
        },
    }));

    return res.status(200).json({
        success: true,
        allRequests,
    });
}

module.exports = { handleUserSignup, handleAvatarUpdate, handleUserLogin, handleSearchQuery, handleGetMyProfile, handleSendFriendRequest, handleAcceptFriendRequest, handleGetMyNotifications };