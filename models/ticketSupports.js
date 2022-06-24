// import package
import mongoose from 'mongoose';
//import { User } from '.';
import User from '../models/User'
// import lib

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let replySchema = new Schema({
    senderId: {
        type: ObjectId,
    },
    receiverId: {
        type: ObjectId,
    },
    messageBy:{
        type:String
    },
    message: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const TicketSupportSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
        ref:User
    },
    adminId: {
        type: ObjectId,
        required: true,
    },
    categoryId: {
        type: ObjectId,
        required: false,
    },
    categorySubject:{
        type:String
    },
    reply: [replySchema],
    status:{
        type: String,
        default:'open'    //open, closed
    },
   
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const TicketSupport = mongoose.model("ticketsupports", TicketSupportSchema);

export default TicketSupport;