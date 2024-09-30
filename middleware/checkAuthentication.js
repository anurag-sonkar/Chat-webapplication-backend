const jwt = require('jsonwebtoken');
const User = require('../models/user');

const checkAuthentication = async (req, res, next) => {
  // console.log(req.headers.authorization)
  if(!req.headers.authorization) return res.status(400).json({error:"token not found" , message:"required login"})

    try {
  const token = req.headers.authorization.split(" ")[1]; 
    if (!token) {
      return res.status(401).json({ error: 'Authorization token not provided' , message:"required login" });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findOne({ _id: verifyToken._id });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // req.token = token;
    req.user = user
    next();

  } catch (error) {
    next(error)
  }
};

module.exports = checkAuthentication;
