const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let AdminRevenue= new Schema({

	fee:{
		type: Number,
		default: 0
	},
	amount:{
		type: Number,
		default: 0
	},
	email:{
		type: String,
		default: '',	
	},
	trade_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "P2PTradeTable",
	  },
	currency:{
		type: String,
		 default: '',		 
	},
    currency_type:{
		type: String,
		 default: '',		 
	},
    
	type:{
		type: String, 
        default: '',
	},
    created_date:{
		type:Date,
		default: Date.now
	},
});

module.exports = mongoose.model('AdminRevenue',AdminRevenue,'AdminRevenue');