// import package
// import mongoose from 'mongoose';

// const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;

// const NotificationSchema = new Schema({
//     userId: {
//         type: ObjectId,
//         ref: 'users',
//     },
//     currencyId: {
//         type: ObjectId,
//         ref: 'currency',
//     },
//     transactionId: {
//         type: ObjectId,
//         ref: 'transaction',
//     },
//     trxId: {
//         type: String,
//         default: '',
//     },
//     currencySymbol: {
//         type: String,
//         default: ""
//     },
//     amount: {
//         type: Number,
//         default: 0
//     },
//     paymentType: {
//         type: String,
//         enum: ['coin_deposit', 'coin_withdraw', 'fiat_deposit', 'fiat_withdraw'],
//         default: 'coin_deposit'
//     },
//     status: {
//         type: String,
//         enum: ['new', 'pending', 'completed', 'rejected', 'cancel'],
//         default: 'new'
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },

// })

// const Notification = mongoose.model("notification", NotificationSchema, 'notification');

// export default Notification;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
let notification = new Schema({
	description:{
       type:String,
	},
	userId:{
		type:ObjectId,
		ref:'users'
	},
	type:{
       type:String,
	},
	category:{
		type:String,
	 },
	admin_read:{
		type:Boolean,
		default:false
	},
	created_date:{
		type:Date,
		default:new Date()
	},
});
module.exports = mongoose.model('notification',notification,'notification');