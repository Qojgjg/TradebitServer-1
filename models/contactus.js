const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let contactus = new Schema({
	firstname:{
		type:String,
		required:true,
	},
	lastname:{
		type:String,
	},
	email:{
		type:String,
		required:true,
	},
	mobilenumber:{
		type:String,
	},
	message:{
		type:String,
		required:true,
	},
	replystatus:{
		type:String		
	},
	created_date:{
		type:Date,
		default: Date.now
	},
});
module.exports = mongoose.model('contactus',contactus,'contactus');
