const jwt = require('jsonwebtoken')


const generateToken = (_id) => {
    return jwt.sign({_id} , process.env.JWT_SECRET_KEY , {
        expiresIn : "15d"
    })

    
}

module.exports = generateToken