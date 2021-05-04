const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:false
    },
    price:{
        type:Number,
        required:true
    },
    imageUrl: {
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Product',productSchema);
