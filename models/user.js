const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    token:String,
    tokenExpire : Date,
    cart:{
        items:[{
            productId:{
                type:Schema.Types.ObjectId,
                ref:'Product'
            },
            quantity:{
                type:Number
            }
        }]
    }
})

module.exports = mongoose.model('User',userSchema);