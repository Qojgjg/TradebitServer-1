const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Launchpad = new Schema({
	userid:{
      type : Schema.Types.ObjectId
	},
	tokenname:{
		type:String,
		// required:true,
	},
	lauchpadid:{
       type:Number,
		// required:true,
	},
	symbol:{
		type:String,
		// required:true,
	},
	availablecurrency:{
		type:String,
	},
	price:{
        type:Number,
		// required:true,
	},
	minAmt:{
        type:Number,
		
	},
	discount:{
        type:Number,
		// required:true,
	},
	availablesale:{
        type:Number,
		
	},
	maxsupply:{
        type:Number,
		// required:true,
	},
	industry:{
        type:String,
		// required:true,
	},
	website:{
        type:String,
		// required:true,
	},
	content:{
        type:String,
		
	},
	curimage:{
        type:String,
		
	},
	status:{
      type:String,
  
	},
	startdate:{
      type:String,
		
	},
	enddate:{
       type:String,
		
	},
	created_date:{
		type:Date,
		default: Date.now
	},
});
module.exports = mongoose.model('Launchpad',Launchpad,'Launchpad');
