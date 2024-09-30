const mongoose = require("mongoose"); 
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: { type: String, required: true , select : false },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],  
      required: true, 
    },
    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
        
      }
    },
    bio:{
      type:String
    }
  },
  { timestamps: true }
);

// {
//   type: String,
//       default:
//   "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//     }


// hash pasword , middleware which runs before save operation is performed
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
