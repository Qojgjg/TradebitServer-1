// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const TransactionSchema = new Schema({
	userId: {
		type: ObjectId,
		ref: 'users',
		index: true
	},
	currencyId: {
		type: ObjectId,
		ref: 'currency',
		index: true
	},
	currencySymbol: {
		type: String,
		default: ""
	},
	fromaddress: {
		type: String,
		default: ""
	},
	toaddress: {
		type: String,
		default: ""
	},
	amount: {
		type: Number,	// with commission fee
		default: 0
	},
	txid: {
		type: String,
	},
	status: {
		type: String, // new , pending, completed, rejected
	},
	paymentType: {
		type: String,
		enum: ['coin_deposit', 'coin_withdraw', 'fiat_deposit', 'fiat_withdraw'],
		default: 'coin_deposit'
	},
	bankDetail: {
		type: Object,
		default: null
	},
	actualAmount: {
		type: Number,
		default: 0			// without Commission Fee
	},
	commissionFee: {
		type: Number,
		default: 0
	},
	userAssetId: {
		type: ObjectId,
		ref: 'Assets',
	},
	image: {
		type: String,
		default: ""
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

const Transaction = mongoose.model("transaction", TransactionSchema, 'transaction');

export default Transaction;
