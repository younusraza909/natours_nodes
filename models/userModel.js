const mongoose=require('mongoose');
const validator=require('validator')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please provide name field!']
    },
    email:{
        type:String,
        lowercase:true,
        required:[true,'Please provide email field!'],
        unique:true,
        validate:[validator.isEmail,'please provide a valid email']
    },
    photo:String,
    password:{
        type:String,
        minLength:8,
        required:[true,'Please provide password']
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please provide confirm password'],
        validate:{
            validator:function(el){
                return el===this.password
            },
            message:"Password does not match"
        }
    }
})

const User=mongoose.model('User',userSchema)

module.exports=User