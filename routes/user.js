const express = require('express')
const router = express.Router()
const { handleUserSignup, handleAvatarUpdate,handleUserLogin, handleSearchQuery, handleGetMyProfile, handleSendFriendRequest, handleAcceptFriendRequest, handleGetMyNotifications } = require('../controllers/userControllers');
const checkAuthentication = require('../middleware/checkAuthentication');
const { upload } = require('../middleware/upload');

router.post("/signup", upload.single('avatar'), handleUserSignup);
router.put("/update-avatar", upload.single('avatar'), checkAuthentication,handleAvatarUpdate);
router.post("/login", handleUserLogin);
router.get('/', checkAuthentication, handleSearchQuery)
router.get('/getMyProfile', checkAuthentication, handleGetMyProfile)
router.put('/sendrequest', checkAuthentication, handleSendFriendRequest)
router.put('/acceptrequest', checkAuthentication, handleAcceptFriendRequest)
router.get('/getmynotifications', checkAuthentication, handleGetMyNotifications)



module.exports = router