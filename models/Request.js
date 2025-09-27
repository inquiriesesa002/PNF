const mongoose=require('mongoose');

const requestSchema=new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  status:{
    type:String,
    enum:['pending','rejected','accepted'],
    default:'pending'

  }

},{timestamps:true})

const Request=mongoose.model('Request',requestSchema)
module.exports = Request;