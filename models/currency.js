const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let currency = new Schema({
	currencyName: {
		type: String,
		default: ''
	},
	currencySymbol: {
		type: String,
		unique: true,
		required: true
	},
	type: {
		type: String,
		enum: ['crypto', 'token', 'fiat'],
		default: 'crypto' // crypto, token, fiat
	},
	withdrawFee: {
		type: Number,   //percentage
		default: 0
	},
	minimumWithdraw: {
		type: Number,
		default: 0
	},
	currencyImage: {
		type: String,
		default: ''
	},

	bankDetails: {   //fiat
		bankName: {
			type: String,
			default: ""
		},
		accountNo: {
			type: String,
			default: ""
		},
		holderName: {
			type: String,
			default: ""
		},
		bankcode: {
			type: String,
			default: ""
		},
		country: {
			type: String,
			default: ""
		}
	},
	tokenType: {   // token
		type: String,
		enum: ['', 'erc20', 'trc20', 'bep20'],
		default: ''
	},
	minABI: { // token
		type: String, default: ''
	},
	contractAddress: { // token
		type: String, default: ''
	},
	decimals: { // token
		type: Number,
		default: 0
	},
	isPrimary: {
		type: Boolean,
		default: false
	},
	status: {
		type: String,
		enum: ['active', 'deactive'],
		default: 'active'
	},


	/* ------------------------------------ */
	fee: {
		type: Number, default: 0
	},

	minimumDeposit: {
		type: Number, default: 0
	},
	block: {
		type: Number, default: 0
	},
}, {
	timestamps: true
});

const Currency = mongoose.model('currency', currency, 'currency');

export default Currency;