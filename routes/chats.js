const express = require('express')
const router = express.Router()
const { handleCreateGroupChat, handleGetMyChats, handleGetMyGroups, handleAddGroupMembers, handleRemoveGroupMember, handleLeaveFromGroup, handleSendAttachments, handleGetChatDetails, handleRenameGroup, handleDeleteChat, handleGetMessages ,} = require('../controllers/chatControllers');
// const { avatarUpload, attachmentsMulter } = require('../middleware/upload');

// router.post('/group', avatarUpload, handleCreateGroupChat)
router.post('/group', handleCreateGroupChat)
router.get('/mychats', handleGetMyChats)
router.get('/mygroups', handleGetMyGroups)
router.put('/addgroupmember', handleAddGroupMembers)
router.put('/removegroupmember', handleRemoveGroupMember)
router.put('/leave/:id', handleLeaveFromGroup)

// Send Attachments - messages
router.post(
    "/message",
    // attachmentsMulter,
    handleSendAttachments
);

// get messages
router.get('/message/:id' , handleGetMessages)

router.get('/getchatdetails/:id'  , handleGetChatDetails)

router.put('/renamegroup' , handleRenameGroup)
router.delete('/deletechat/:id', handleDeleteChat)




module.exports = router