const generateToken = require('../config/generateToken');
const User = require('../models/user')
const bcrypt = require("bcryptjs");
const asyncHandler = require('express-async-handler')


const handleUserSignup = asyncHandler( async (req,res)=>{
    const {name , email , password ,profile} = req.body

    // check empty
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name/email/password reuiqred to signup" });
    }

    // check already exists or not
    const response = await User.findOne({email})

    if(!response){

        const user = await User.create({
            name , email ,password, profile
        })

        if(user){
            // create token 
            return res.status(201).json({
                _id : user._id,
                name : user.name,
                email : user.email,
                profile : user.profile,
                token : generateToken(User._id)
            })
        }else{
            return res.status(400).json({message : "failed to signup Try again!"})
        }


    }else{
        return res.status(400).json({message : "user already exists"})
    }


})


const handleUserLogin = asyncHandler(async(req,res)=>{
    const {email , password} = req.body

    if (!email || !password) {
    return res.status(400).json({ message: "email and password required to login" });
  }

  const user = await User.findOne({email})

  if(user){
    const isMatch = await bcrypt.compare(password , user.password)
    console.log(isMatch)

    if(!isMatch){
        return res.status(400).json({ message: "Password not matched" });
    }else{
        const token  = generateToken(user._id)

        return res.status(200).json({message : "login succesfully" , token : token})
    }
  }else{
        return res.status(400).json({ message: "inValid email" });

  }

})

module.exports = { handleUserSignup,handleUserLogin };