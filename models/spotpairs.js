// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let spotPairsSchema = new Schema({
	firstCurrencyId: {   //a
		type: ObjectId,
		required: true,
		ref: 'currency'
	},
	firstCurrencySymbol: {
		type: String,   //a
		required: true,
		default: '',
	},
	firstFloatDigit: {
		type: Number, //a
		default: 8
	},
	secondCurrencyId: {
		type: ObjectId,  //a
		required: true,
		ref: 'currency'
	},
	secondCurrencySymbol: {
		type: String,  //a
		required: true,
		default: '',
	},
	secondFloatDigit: {
		type: Number,  //a
		default: 8
	},
	minPricePercentage: {
		type: Number,  //a
		default: 0
	},
	maxPricePercentage: {
		type: Number,  //a
		default: 0
	},
	maxQuantity: {
		type: Number,   //a
		default: 0
	},
	minQuantity: {
		type: Number,   //a
		default: 0
	},
	maker_rebate: {
		type: Number,  //a
		default: 0
	},
	taker_fees: {
		type: Number,   //a
		default: 0
	},
	last: {
		type: Number,
		default: 0
	},
	markPrice: {
		type: Number,
		default: 0
	},
	low: {
		type: Number,
		default: 0
	},
	high: {
		type: Number,
		default: 0
	},
	firstVolume: {
		type: Number,
		default: 0
	},
	secondVolume: {
		type: Number,
		default: 0
	},
	changePrice: {
		type: Number,
		default: 0
	},
	change: {
		type: Number,
		default: 0
	},
	markupPercentage: {   //a
		type: Number,
		default: 0
	},
	botstatus: {   //a
		type: String,
		enum: ['off', 'binance'],
		default: "off"	// off, binance
	},
	status: {  //a
		type: String,
		enum: ['active', 'deactive'],
		default: "active",  //active, deactive
	},


/* ---------------------------------------------- */


	tiker_root: {
		type: String
		/*required:true,
		index: true */
	},




	index_price: {
		type: String,
		default: ''   //index price
	},
	mark_price: {
		type: String,
		default: '' //market price
	},

	turnover: {
		type: String,
		default: ''
	},
	total_volume: {
		type: String,
		default: ''
	},


	priority: {
		type: Number,
		default: 1
	},
	total_volume: {
		type: String,
		default: '0'
	},
	binance_volume: {
		type: String,
		default: '0'
	},


}, {
	timestamps: true
});


const SpotPairs = mongoose.model("spotpairs", spotPairsSchema,'spotpairs');

export default SpotPairs;