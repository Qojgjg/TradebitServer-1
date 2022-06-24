const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var filledSchema = new Schema({
  buyuserId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  selluserId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  sellId: { type: mongoose.Schema.Types.ObjectId, ref: "P2PTradeTable" },
  buyId: { type: mongoose.Schema.Types.ObjectId, ref: "P2PTradeTable" },
  filledAmount: Number,
  Price: Number,
  firstCurrency: { type: String, default: "", index: true },
  secondCurrency: { type: String, default: "", index: true },
  pairname: { type: String, index: true },
  Fees: Number,
  Type: { type: String, index: true },
  created_at: { type: Date, default: Date.now },
  status: { type: String, index: true },
  beforeBalance: { type: String, default: 0 },
  afterBalance: { type: String, default: 0 },
  beforebonusBalance: { type: String, default: 0 },
  afterbonusBalance: { type: String, default: 0 },
});

let P2PTradeTable = new Schema({
  quantity: {
    type: Number,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  Margin: {
    type: Number,
    default: 0,
  },
  beforeBalance: {
    type: String,
    default: 0,
  },
  afterBalance: {
    type: String,
    default: 0,
  },
  beforebonusBalance: {
    type: String,
    default: 0,
  },
  afterbonusBalance: {
    type: String,
    default: 0,
  },
  firstCurrency: {
    type: String,
    default: "",
    index: true,
  },
  secondCurrency: {
    type: String,
    default: "",
    index: true,
  },

  pair: {
    type: String,
    default: "",
    index: true,
  },


  prefcurrencytransfer: [
    {
      bank: {
        type: String,
        default: "",
      },
    },
  ],

  BuyorSell: {
    type: String,
    default: "", //Buy or Sell
  },
  orderDate: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: String,
    default: "0", //0-new, 1-completed, 2-partial, 3- Cancel, 4- Conditional
    index: true,
  },
  marketprice: {
    type: String,
    default: "0",
  },
  minlimit: {
    type: Number,
    default: "0",
  },
  maxlimit: {
    type: Number,
    default: "0",
  },
  minlimit: {
    type: Number,
    default: "0",
  },
  maxlimit: {
    type: Number,
    default: "0",
  },
  minlimit: {
    type: Number,
    default: "0",
  },
  maxlimit: {
    type: Number,
    default: "0",
  },
  minlimit_initial: {
    type: Number,
    default: "0",
  },
  maxlimit_initial: {
    type: Number,
    default: "0",
  },
  terms: {
    type: String,
  },
  title: {
    type: String,
  },
  sundayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  mondayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  tuesdayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  wednesdayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  thursdayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  fridayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  saturdayHours:[
    {
     open: {type: String, default:""}, 
     close:  {type: String, default:""} 
    },
  ],
  tradeWith: {
    type: String,
    default: "",
  },
  bankpaymentdetails: {
    type: String,
    default: "",
  },
  taker_fees: {
    type: String,
    default: 0, //percentage fee
  },
  fee_percentage: {
    type: Number,
    default: "0",
  },
  fee_amount: {
    type: Number,
    default: "0",
  },
  filled: [filledSchema],
  country: {
    type: String,
    default: '', 
  },
  postStartDate:{
    type:Date,
		default: Date.now
  },
  transferMode:{
    type: String,
    default: '',
  }
});

module.exports = mongoose.model("P2PTradeTable", P2PTradeTable, "P2PTradeTable");
