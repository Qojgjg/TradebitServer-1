// import model
import mongoose from "mongoose";
import {
  
   
    SpotTrade,
    PerpetualOrder,
    Transaction
    
} from '../models'
import Notification from '../models/notification'
import P2PSpotpairs from '../models/P2PSpotpairs'
import P2POrderbook from '../models/P2POrderbook';
import P2PChat from '../models/P2PChat'
import P2PDispute from "../models/P2PDispute";
import P2PTradeTable from '../models/P2PTradeTable';
import Assets from '../models/Assets';
import Admin_Revenue from '../models/AdminRevenue';
import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers';
import config from '../config';
import { socketEmitOne, socketEmitChat } from "../config/socketIO";
import multer from "multer";
import path from "path";
const ObjectId = mongoose.Types.ObjectId;
const moment  = require('moment');


export const p2pchatdispute = async (req, res) => {
  try {
    var reqBody = req.body;
    console.log("REqbody---", req.body);
    // var orderbookId = reqBody.orderbookId);
    // console.log(orderbookId, "orderbookId");
    var orderbookdata = await P2POrderbook.findOne({
      _id: reqBody.orderbookId,
    });
    console.log("orderbookdata---", orderbookdata);
    var tradetable = await P2PTradeTable.findOne({
      _id: orderbookdata.trade_id,
    });

    P2PChat.aggregate([
      { $match: { orderbookId: orderbookdata._id } },
      {
        $lookup: {
          from: "users",
          localField: "Sender_userId",
          foreignField: "_id",
          as: "senderdetails",
        },
      },
      { $unwind: "$senderdetails" },
      {
        $lookup: {
          from: "users",
          localField: "Receiver_userId",
          foreignField: "_id",
          as: "receiverdetails",
        },
      },
      { $unwind: "$receiverdetails" },
      {
        $project: {
          message: 1,
          attachment: 1,
          Sender_userId: 1,
          Receiver_userId: 1,
          created_at: 1,
          receiverdetails: {
            _id: 1,
            email: 1,
          },
          senderdetails: {
            _id: 1,
            email: 1,
          },
        },
      },
    ])
      .sort({ _id: 1 })
      .exec(function (err, response) {
        console.log("response----", response);
        return res.status(200).json({
          status: true,
          data: response,
        });
      });
  } catch (err) {
    console.log("Err---", err);
  }
};

export const getP2PTradeComplete = async(req,res)=>{
    try{
      let result = await P2POrderbook.find({status:4});
      return res.status(200).json({ status: true, result : result.length });
    }catch(err){
        console.log("Err---",err)
    }
}

export const p2pchatHistory = async (req, res) => {
  console.log("p2pchatHistoryp2pchatHistory", req.params.orderId);
  try {
    P2PChat.aggregate([
      {
        $match: { orderbookId: ObjectId(req.params.orderId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "Sender_userId",
          foreignField: "_id",
          as: "senderdetails",
        },
      },
      {
        $unwind: {
          path: "$senderdetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "Receiver_userId",
          foreignField: "_id",
          as: "receiverdetails",
        },
      },
      {
        $unwind: {
          path: "$receiverdetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          message: 1,
          attachment: 1,
          Sender_userId: 1,
          Receiver_userId: 1,
          admin: 1,
          created_at: 1,
          receiverdetails: {
            _id: 1,
            email: "$receiverdetails.email",
          },
          senderdetails: {
            _id: 1,
            email: "$senderdetails.email",
          },
        },
      },
    ]).exec(function (err, response) {
      res.json({ status: true, data: response });
    });
  } catch (err) {
    console.log("errerrerrerr", err);
    return res.status(500).json({ status: false, message: "Error occured" });
  }
};


var chatStorage = multer.diskStorage({
  destination: "./public/images/chat/",
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

var chatUpload = multer({ storage: chatStorage }).single("proofImage");

export const uploadChatImage = async (req, res, next) => {
  chatUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, errors: "TOO_LARGE" });
    } else if (err) {
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }
    return next();
  });
};

export const p2pdisputelist = async (req, res) => {
  try {
    P2PDispute.find({})
      .sort({ _id: -1 })
      .populate({ path: "seller_id", select: "email" })
      .populate({ path: "buyer_id", select: "email" })

      .then((result) => {
        if (result) {
          var resData = [];
          for (var i = 0; i < result.length; i++) {
            var created_date = result[i].created_at
              ? moment(result[i].created_at).format("DD-MM-YYYY  k:mm:s")
              : "";
            var _id = result[i]._id ? result[i]._id : "";
            var raised_by = result[i].raised_by ? result[i].raised_by : "";
            var orderbookId = result[i].orderbookId
              ? result[i].orderbookId
              : "";
            var status =
              result[i].status == 0
                ? "Open"
                : result[i].status == 1
                ? "Resolved"
                : "";
            var buyerEmail = result[i].buyer_id ? result[i].buyer_id.email : "";
            var sellerEmail = result[i].seller_id
              ? result[i].seller_id.email
              : "";

            var resObj = {
              created_date: created_date,
              _id: _id,
              raised_by: raised_by,
              orderbookId: orderbookId,
              status: status,
              buyerEmail: buyerEmail,
              sellerEmail: sellerEmail,
            };

            resData.push(resObj);
          }

          return res.status(200).json({
            status: true,
            data: resData,
          });
        }
      });
  } catch (err) {
    console.log("Err---", err);
  }
};


export const p2pOrder = async (req, res) => {
  console.log("p2pOrderp2pOrder", req.params.orderId);
  try {
    P2POrderbook.findById(req.params.orderId)
      .populate("from_userId", "email")
      .populate("to_userId", "email")
      .then((result) => {
        if (result) {
          var resData = {};
          console.log(
            "resDataresDataresDataresDataresDataresDataresDataresData",
            result
          );
          resData.created_date = result.created_date ? result.created_date : "";
          resData._id = result._id ? result._id : "";
          resData.BuyorSell = result.BuyorSell ? result.BuyorSell : "";
          resData.firstCurrency = result.firstCurrency;
          resData.secondCurrency = result.secondCurrency;
          resData.currencyPair =
            result.firstCurrency + "/" + result.secondCurrency;
          resData.price = result.price
            ? result.price + " - " + result.secondCurrency
            : "";
          resData.crypto_amount = result.crypto_amount
            ? result.crypto_amount
            : "";
          resData.fiat_amount = result.fiat_amount ? result.fiat_amount : "";
          resData.status =
            result.status == 0
              ? "Open"
              : result.status == 1
              ? "Paid"
              : result.status == 2
              ? "Cancelled"
              : result.status == 3
              ? "Disputed"
              : result.status == 4
              ? "Completed"
              : result.status == 5
              ? "Closed"
              : "";
          resData.buyerName = result.from_userId.email;
          resData.sellerName = result.to_userId.email;

          if (result.status == 4) {
            resData.fee = result.trade_fee + "  " + result.firstCurrency;
          } else {
            resData.fee = "";
          }
          return res.status(200).json({ status: true, data: resData });
        }
      });
  } catch (err) {
    console.log("errerrerrerrerr", err);
    return res.status(500).json({ status: false });
  }
};


export const p2presolveBuyer = async (req, res) => {
  try {
    var reqBody = req.body;
    var id = reqBody._id;
    console.log("reqBody---", reqBody);
    var disputedata = await P2PDispute.findOne({ orderbookId: ObjectId(id) });
    console.log("disputedata---", disputedata);

    // P2PDispute.findOne({ _id: id }).then((disputedata) => {
    if (disputedata) {
      var update = {
        status: 1,
      };
      await P2PDispute.findOneAndUpdate(
        { _id: disputedata._id },
        { $set: update }
      );
    }

    var orderbookdata = await P2POrderbook.findOne({
      _id: disputedata.orderbookId,
    });
    console.log("orderbookdata---", orderbookdata);

    var userId = orderbookdata.to_userId;
    var assetdata = await Assets.findOne({
      userId: userId,
      currencySymbol: orderbookdata.firstCurrency,
    });
    console.log("assetdata---", assetdata.p2pbalance);

    var main_balance = assetdata.p2pbalance;
    var crypto_amount = orderbookdata.crypto_amount;
    console.log("main_balance---", main_balance, "---", crypto_amount);

    var new_mainbalance = main_balance + crypto_amount;
    console.log("newmain_balance---", new_mainbalance);

    var update_balance = await Assets.findOneAndUpdate(
      { _id: assetdata._id },
      { $set: { p2pbalance: new_mainbalance } }
    );
    console.log("update_balance---", update_balance);

    if (update_balance) {
      var spotpairdata = await P2PSpotpairs.findOne({
        first_currency: orderbookdata.firstCurrency,
        second_currency: orderbookdata.secondCurrency,
      });
      var crypto_amount_cal = orderbookdata.crypto_amount;
      var fee_amount = (crypto_amount_cal * spotpairdata.transactionfee) / 100;
      var crypto_amount = parseFloat(crypto_amount_cal) + fee_amount;
      // let holdingbalance=assetsrestoresell.p2pholdingbalance-crypto_amount;

      // var holding_balance =orderbookdata.crypto_amount + orderbookdata.trade_fee;
      //         var hold =orderbookdata.crypto_amount + (parseFloat(orderbookdata.trade_fee_percentage)/100);
      // var holding_balance=orderbookdata.crypto_amount+trade_fee
      //         console.log("deduct_holdingbalance_seller",holding_balance,orderbookdata.crypto_amount,orderbookdata.trade_fee)
      var deduct_holdingbalance_seller = await Assets.findOneAndUpdate(
        {
          userId: orderbookdata.from_userId,
          currencySymbol: orderbookdata.firstCurrency,
        },

        { $inc: { p2pholdingbalance: -parseFloat(crypto_amount) } },
        { new: true }
      );
      console.log(
        "deduct_holdingbalance_sellerdeduct_holdingbalance_seller",
        deduct_holdingbalance_seller
      );
      if (deduct_holdingbalance_seller) {
        var dispute_status = await P2POrderbook.findOneAndUpdate(
          {
            _id: orderbookdata._id,
          },
          {
            $set: { status: 4, dispute_status: 1 },
          }
        );
        if (dispute_status) {
          var TradeId = orderbookdata.trade_id;
          let description = "Dispute Resolved Successfully for Buyer Side.";
          let chatsave = new P2PChat({
            admin: 1,
            message: description,
            TradeId: orderbookdata.trade_id,
            orderbookId: orderbookdata._id,
          });
          await chatsave.save();
          let newNotification = new Notification({
            description: description,
            userId: userId,
            type: "Dispute Trade",
          });
          newNotification.save();
          // save admin revenue
          await new Admin_Revenue({
            fee: orderbookdata.trade_fee,
            email: orderbookdata.from_userId.email,
            amount: orderbookdata.crypto_amount,
            order_id: orderbookdata._id,
            trade_id: orderbookdata.trade_id,
            currency: orderbookdata.firstCurrency,
            currency_type: "Crypto",
            type: "P2p",
          }).save();
          await P2POrderbook.findOneAndUpdate(
            {
              _id: ObjectId(orderbookdata._id),
            },
            {
              $set: {
                status: 4,
              },
            }
          );

          await P2PTradeTable.findByIdAndUpdate(
            {
              _id: ObjectId(TradeId),
            },
            {
              $set: {
                status: 0,
              },
            }
          );
          //  if(tradetable.maxlimit!=0 && tradeTable.maxlimit<maxlimit_initial){
          // await P2PTradeTable.findByIdAndUpdate({
          //   _id:ObjectId(TradeId),
          // },
          // {
          //   $set:{
          //     status:2,
          //   }
          // })
          //   }
          var tradetable = await P2PTradeTable.findOne({
            _id: ObjectId(orderbookdata.trade_id),
          });

          if (tradetable.maxlimit == 0) {
            await P2PTradeTable.findByIdAndUpdate(
              {
                _id: ObjectId(TradeId),
              },
              {
                $set: {
                  status: 1,
                },
              }
            );
          }
          let description1 = "Dispute Resolved Successfully for Buyer Side.";

          let newNotification1 = new Notification({
            description: description1,
            userId: orderbookdata.from_userId,
            type: "Dispute Trade",
          });
          newNotification1.save();

          P2PChat.aggregate([
            {
              $match: { _id: chatsave._id },
            },
            {
              $lookup: {
                from: "users",
                localField: "Sender_userId",
                foreignField: "_id",
                as: "senderdetails",
              },
            },
            {
              $unwind: {
                path: "$senderdetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "Receiver_userId",
                foreignField: "_id",
                as: "receiverdetails",
              },
            },
            {
              $unwind: {
                path: "$receiverdetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                message: 1,
                attachment: 1,
                Sender_userId: 1,
                Receiver_userId: 1,
                admin: 1,
                created_at: 1,
                receiverdetails: {
                  _id: 1,
                  email: "$receiverdetails.email",
                },
                senderdetails: {
                  _id: 1,
                  email: "$senderdetails.email",
                },
              },
            },
          ])
            .sort({ _id: -1 })
            .exec(function (err, response_chat) {
              socketEmitChat("p2pchat-" + orderbookdata._id, response_chat);
            });

          return res.status(200).json({
            status: true,
            message: "Dispute Resolved for Buyer Successfully.",
          });
        } else {
          return res.status(400).json({
            status: false,
            message: "Dispute Status Not Updated",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: "Holding Balance Not Updated",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Buyer Asset Not Updated",
      });
    }
  } catch (err) {
    console.log("Error---", err);

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
};

export const adminRevenue=async(req,res)=>{
  try{
    var reqBody = req.body;
    console.log("Body---",reqBody)
    var filter_by = {};
    var filter_by1 = {};
    if (reqBody.fc!='off' && reqBody.fc!=undefined ) {
      filter_by["currency"] = reqBody.fc;
      console.log('aa')
    }
  
    if (reqBody.sc!='off' && reqBody.sc!=undefined) {
      filter_by["currency"] = reqBody.sc;
      console.log('BBB')
    }
  
    if (reqBody.date && reqBody.date != "NaN-NaN-NaN" && reqBody.date!='1970-01-01') {
      var datenew = reqBody.date + "T00:00:00.000Z";
  
      var year = moment(reqBody.date).format("YYYY");
  
      var month = moment(reqBody.date).format("MM");
  
      console.log(year + month, "datenew");
      filter_by1 = {
        $expr: {
          $and: [
            { $eq: [{ $year: "$created_date" }, Number(year)] },
            { $eq: [{ $month: "$created_date" }, Number(month)] },
          ],
        },
      };
    }
  
    const filterby_final = { ...filter_by, ...filter_by1 };
  
    console.log(filterby_final,'filterby_final')
  
    Admin_Revenue.find(filterby_final)
      .sort({ _id: -1 })
      .then((result) => {
        if (result) {
          var resData = [];
          var totalfee = 0;
          for (var i = 0; i < result.length; i++) {
            const created_date = moment(result[i].created_date).format(
              "DD-MMM-YYYY"
            );
  
            const created_month = moment(result[i].created_date).format(
              "MMM-YYYY"
            );
  
            var _id = result[i]._id ? result[i]._id : "";
            var currency = result[i].currency;
            var fee = result[i].fee;
            var amount = result[i].amount;
            var type = result[i].type;
            var totalfee=totalfee+fee;
            var email=result[i].email;
            var trade_id=result[i].trade_id;
            var resObj = {
              created_date: created_date,
              created_month: created_month,
              _id: _id,
              currency: currency,
              amount: amount,
              fee: fee,
              type: type,
              trade_id:trade_id,
              email:email
            };
            resData.push(resObj);
            console.log("resObj-----------",resObj)
          }
          return res.status(200).json({
            status: true,
            data: resData,
            totalfee:totalfee,
          });
        }
      });
  }
  catch(err){
    
  }
}

export const p2presolveSeller= async(req,res)=>{
  try {
    var reqBody = req.body;
    var id = reqBody._id;
    console.log("reqBody----", reqBody);
    var disputedata = await P2PDispute.findOne({ orderbookId: ObjectId(id) });

    console.log("disputedata---", disputedata);
    // P2PDispute.findOne({ _id: id }).then((disputedata) => {
    if (disputedata) {
      var update = {
        status: 1,
      };
      await P2PDispute.findOneAndUpdate(
        { _id: disputedata._id },
        { $set: update }
      );
    }
    var orderbookdata = await P2POrderbook.findOne({
      _id: disputedata.orderbookId,
    });
    var tradetable = await P2PTradeTable.findOne({ _id: disputedata.TradeId });
    console.log("TradeTable---", tradetable);
    var userId = orderbookdata.from_userId;
    var assetdata = await Assets.findOne({
      userId: userId,
      currencySymbol: orderbookdata.firstCurrency,
    });

    if (assetdata) {
      // var main_balance = assetdata.p2pbalance;
      // var crypto_amount = orderbookdata.crypto_amount;
      // var trade_fee = orderbookdata.trade_fee;
      // var refund_amount=crypto_amount + trade_fee
      // var afterBalance = Number(tradetable.afterBalance) - Number(crypto_amount) - trade_fee;
      //  var main_balance = assetdata.p2pbalance;
      //  var crypto_amount = orderbookdata.crypto_amount;
      //  var trade_fee = orderbookdata.trade_fee;
      //  var refund_amount = crypto_amount + trade_fee;

      if (tradetable.BuyorSell == "Buy") {
        var spotpairdata = await P2PSpotpairs.findOne({
          first_currency: orderbookdata.firstCurrency,
          second_currency: orderbookdata.secondCurrency,
        });

        var crypto_amount_cal = orderbookdata.crypto_amount;
        var fee_amount =
          (crypto_amount_cal * spotpairdata.transactionfee) / 100;
        var crypto_amount = parseFloat(crypto_amount_cal) + fee_amount;

        let current_cryptobalance = assetdata.p2pbalance;
        var new_cryptobalance = current_cryptobalance + crypto_amount;

        let holdingbalance = assetdata.p2pholdingbalance - crypto_amount;

        console.log("assetdataassetdataassetdata", assetdata);
        //  var current_cryptobalance =parseFloat(assetdata.p2pbalance);
        //  var new_cryptobalance = current_cryptobalance + parseFloat(refund_amount);
        //  var holdingbalance = assetdata.p2pholdingbalance - refund_amount;
        await Assets.findOneAndUpdate(
          { _id: assetdata._id },
          {
            $set: {
              p2pholdingbalance: parseFloat(holdingbalance),
              p2pbalance: parseFloat(new_cryptobalance),
            },
          }
        );
      }
      // Trade Limit condition
      var minlimit_initial = tradetable.minlimit_initial;
      var afterBalance = Number(tradetable.afterBalance) - crypto_amount;
      // Trade Limit condition

      var quantity = tradetable.quantity + orderbookdata.crypto_amount;
      var minlimit = tradetable.minlimit;
      var maxlimit = tradetable.maxlimit;
      var currentmaxlimit = maxlimit + orderbookdata.fiat_amount;
      if (currentmaxlimit > minlimit_initial) {
        var currentminlimit = minlimit_initial;
      } else {
        var currentminlimit = currentmaxlimit;
      }
      var status = 0;
      var minlimit_update = await P2PTradeTable.findOneAndUpdate(
        {
          _id: tradetable._id,
        },
        {
          $set: {
            afterBalance: afterBalance,
            maxlimit: currentmaxlimit,
            minlimit: currentminlimit,
            quantity: quantity,
            status: status,
          },
        }
      );
      if (currentminlimit == 0) {
        await P2PTradeTable.findByIdAndUpdate(
          { _id: ObjectId(tradetable._id) },
          { $set: { status: 1 } }
        );
      }
      if (minlimit_update) {
        var orderbook_update = await P2POrderbook.findOneAndUpdate(
          {
            _id: orderbookdata._id,
          },
          {
            $set: {
              status: 4,
            },
          }
        );
        if (orderbook_update) {
          let description = "Dispute Resolved Successfully for Your Side.";

          let message = "Dispute Resolved to Seller side";
          let chatsave = new P2PChat({
            admin: 1,
            message: message,
            TradeId: orderbookdata.trade_id,
            orderbookId: orderbookdata._id,
          });
          await chatsave.save();
          let newNotification = new Notification({
            description: description,
            userId: userId,
            type: "Dispute Trade",
          });
          newNotification.save();
          let description1 = "Dispute Resolved Successfully for Seller Side.";

          let newNotification1 = new Notification({
            description: description1,
            userId: orderbookdata.to_userId,
            type: "Dispute Trade",
          });
          newNotification1.save();
          P2PChat.aggregate([
            {
              $match: { _id: chatsave._id },
            },
            {
              $lookup: {
                from: "users",
                localField: "Sender_userId",
                foreignField: "_id",
                as: "senderdetails",
              },
            },
            {
              $unwind: {
                path: "$senderdetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "Receiver_userId",
                foreignField: "_id",
                as: "receiverdetails",
              },
            },
            {
              $unwind: {
                path: "$receiverdetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                message: 1,
                attachment: 1,
                Sender_userId: 1,
                Receiver_userId: 1,
                admin: 1,
                created_at: 1,
                receiverdetails: {
                  _id: 1,
                  email: "$receiverdetails.email",
                },
                senderdetails: {
                  _id: 1,
                  email: "$senderdetails.email",
                },
              },
            },
          ])
            .sort({ _id: -1 })
            .exec(function (err, response_chat) {
              socketEmitChat("p2pchat-" + orderbookdata._id, response_chat);
            });
          return res.status(200).json({
            status: true,
            message: "Dispute Resolved for Seller Successfully.",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: "Min-Max limit Not Updated.",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Seller Data Not Found.",
      });
    }
  } catch (err) {
    console.log("Error---", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
}


export const p2papprove_dispute=async(req,res)=>{
    try{
        var reqBody = req.body;
        var id = reqBody._id;
      console.log("disputebody---",reqBody)
        P2PDispute.findOne({ _id: id }).then((disputedata) => {
          if (disputedata) {
           var update = {
              status: 1,
            };
            P2PDispute.findOneAndUpdate(
              { _id: id },
              { $set: update },
              function (err, result) {
                var fromdispute,todispute;
                if (result) {
                  P2POrderbook.findOne({
                    _id: disputedata.orderbookId,
                  }).then(async (orderbookdata) => {
                    if (disputedata.raised_by == "Seller") {
                      var user_id = disputedata.seller_id; // balance back to seller
                    }
                    if (disputedata.raised_by == "Buyer") {
                      var user_id = disputedata.buyer_id; // balance added to buyer
                    }
                    // Update Balance buyer or seller
                    var crypto_currency = orderbookdata.firstCurrency;
      
                    const assets = await Assets.findOne({
                      userId:user_id,
                      currencySymbol: crypto_currency,
                    });
                    var current_cryptobalance = assets.p2pbalance;
                    var crypto_amount = orderbookdata.crypto_amount;
                    var fee_amount = orderbookdata.trade_fee;
                    var new_cryptobalance = current_cryptobalance + crypto_amount;
      
                    // Update orderbook status
                    await P2POrderbook.findOneAndUpdate(
                      {
                        _id: orderbookdata._id,
                      },
                      {
                        $set: { status: 4 , dispute_status:1},
                      }
                    );
      
                    var tradetable = await P2PTradeTable.findOne({
                      _id: orderbookdata.trade_id,
                    });
      
                    // Update trade balance
                    var afterBalance =
                      Number(tradetable.afterBalance) - Number(crypto_amount);
      
                    // Trade Limit condition
                    var minlimit_initial = tradetable.minlimit_initial;
      
                    var minlimit = tradetable.minlimit;
                    var maxlimit = tradetable.maxlimit;
                    var currentmaxlimit = maxlimit + orderbookdata.fiat_amount;
                    if (currentmaxlimit > minlimit_initial) {
                      var currentminlimit = minlimit_initial;
                    } else {
                      var currentminlimit = currentmaxlimit;
                    }
                    var status = 0;
      
                    //  End Limit
      
                    await P2PTradeTable.findOneAndUpdate(
                      {
                        _id: tradetable._id,
                      },
                      {
                        $set: {
                          // afterBalance: afterBalance,
                          maxlimit: currentmaxlimit,
                          minlimit: currentminlimit,
                          status: status,
                        },
                      },
                      function (err, result) {}
                    );
      
                    // End Update trade balance
      
                    if (disputedata.raised_by == "Seller") {
                      let description="Dispute Resolved Successfully.";
                     
                      let newNotification = new Notification({
                          'description': description,
                          'userId': user_id,
                          'type': "Dispute Trade",
                          
                      });
                     newNotification.save();
                     return res.status(200).json({
                                  status: true,
                                  message: "Dispute Resolved Successfully.",
                                });
                //       await Assets.findOneAndUpdate(
                //         {
                //           _id: assets._id,
                //         },
                //         {
                //           $set: { balance: new_cryptobalance + fee_amount },
                //         },
                //         function (err, result) {
                //           let description="Dispute Resolved Successfully.";
                     
                //           let newNotification = new Notification({
                //               'description': description,
                //               'userId': user_id,
                //               'type': "Dispute Trade",
                              
                //           });
                //  newNotification.save();
                //           return res.status(200).json({
                //             status: true,
                //             message: "Dispute Resolved Successfully.",
                //           });
                //         }
                //       );
                    } else {
                      // p2p trade fee and holding amount deducted to seller
                      var holding_balance =
                        orderbookdata.crypto_amount + orderbookdata.trade_fee;
      
                      Assets.findOneAndUpdate(
                        {
                          userId: orderbookdata.from_userId,
                          currencySymbol: orderbookdata.firstCurrency,
                        },
      
                        { $inc: { holdingbalance: -holding_balance } },
                        { new: true },
                        function (err, updateData) {
                          if (!err) {
                            console.log("trade fee deducted");
                          }
                        }
                      );
      
                      // End p2p trade fee
      
                      // Balance credited to buyer
                      await Assets.findOneAndUpdate(
                        {
                          _id: assets._id,
                        },
                        {
                          $set: { balance: new_cryptobalance },
                        },
                        function (err, result) {
                          return res.status(200).json({
                            status: true,
                            message: "Dispute Resolved Successfully.",
                          });
                        }
                      );
                      let description="Dispute Resolved Successfully.";
                     
                  let newNotification = new Notification({
                      'description': description,
                      'userId': user_id,
                      'type': "Dispute Trade",
                      
                  });
                 newNotification.save();
                    }
                    // End Update Balance
                  });
                }
              }
            );
          }
        });
    }catch(err){
        console.log("Err---",err)
    }
}



export const p2porderHistory=async(req,res)=>{
   try{
        console.log("Inside");
        P2POrderbook.find()
          .sort({ _id: -1 })
          .populate({ path: "from_userId", select: "email" })
          .populate({ path: "to_userId", select: "email" })
          .then((result) => {
            if (result) {
              var resData = [];
              for (var i = 0; i < result.length; i++) {
                var created_date = result[i].created_date
                  ? result[i].created_date
                  : "";
                var _id = result[i]._id ? result[i]._id : "";
                var BuyorSell = result[i].BuyorSell ? result[i].BuyorSell : "";
                var firstCurrency = result[i].firstCurrency;
                var secondCurrency = result[i].secondCurrency;
                var currencyPair = firstCurrency + "/" + secondCurrency;
                var price = result[i].price
                  ? result[i].price + " - " + result[i].secondCurrency
                  : "";
                var crypto_amount = result[i].crypto_amount
                  ? result[i].crypto_amount.toFixed(4) + " - " + result[i].firstCurrency
                  : "";
                var fiat_amount = result[i].fiat_amount ? result[i].fiat_amount : "";
                var status =
                  result[i].status == 0
                    ? "Open"
                    : result[i].status == 1
                    ? "Paid"
                    : result[i].status == 2
                    ? "Cancelled"
                    : result[i].status == 3
                    ? "Disputed"
                    : result[i].status == 4
                    ? "Completed"
                    : result[i].status == 5
                    ? "Closed"
                    : "";
                var buyerEmail = result[i].from_userId
                  ? result[i].from_userId.email
                  : "";
                var sellerEmail = result[i].to_userId
                  ? result[i].to_userId.email
                  : "";
      
                if (result[i].status == 4) {
                  var fee = result[i].trade_fee + " " + result[i].secondCurrency;
                } else {
                  var fee = "--";
                }
      
                var resObj = {
                  created_date: created_date,
                  _id: _id,
                  BuyorSell: BuyorSell,
                  currencyPair: currencyPair,
                  price: price,
                  crypto_amount: crypto_amount,
                  fiat_amount: fiat_amount,
                  status: status,
                  buyerEmail: buyerEmail,
                  sellerEmail: sellerEmail,
                  fee: fee,
                };
                resData.push(resObj);
              }
              
              return res.status(200).json({
                status: true,
                data: resData,
              });
            }
          });
      }catch(err){
          console.log("err===",err)
        return res.status(500).json({
            status: false
          });
      }
}
export const spotorderHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrency', 'secondCurrency', 'orderType', 'buyorsell', 'status']);

        let count = await SpotTrade.countDocuments(filter)
        let data = await SpotTrade.aggregate([

            { "$match": filter },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "averagePrice": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.price"] }
                            }
                        }
                    },
                    "price": 1,
                    "filledQuantity": 1,
                    "quantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1,
                    "status": 1,
                }
            }
        ])

        let result = {
            count: count,
            data
        }
        console.log("result--------",result)
        return res.status(200).json({ 'success': true, "messages": "success", result })

    } catch (err) {

        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}



export const spotTradeHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrency', 'secondCurrency', 'buyorsell','status']);
        filter['status'] = { "$in": ["pending", "completed", "cancel"] }

        let count = await SpotTrade.aggregate([
            { "$match": filter },
            { "$unwind": "$filled" },
        ])

        let data = await SpotTrade.aggregate([
            { "$match": filter },
            { "$unwind": "$filled" },
            { "$sort": { "createdAt": -1 } },
            {
                "$project": {
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "buyorsell": 1,
                    "price": "$filled.price",
                    "filledQuantity": "$filled.filledQuantity",
                    "orderValue": "$filled.orderValue",
                    "Fees": "$filled.Fees",
                    "status": 1,
                    "createdAt": {
                        "$dateToString": {
                            "date": '$filled.createdAt',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                }
            },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit }
        ])

        let result = {
            count: count.length,
            data
        }
        console.log(result)
        return res.status(200).json({ 'success': true, "messages": "success", result })

    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

export const perpetualOrderHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrency', 'secondCurrency', 'orderType', 'buyorsell', 'status']);

        let count = await PerpetualOrder.countDocuments(filter)
        let data = await PerpetualOrder.aggregate([

            { "$match": filter },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "averagePrice": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.price"] }
                            }
                        }
                    },
                    "price": 1,
                    "filledQuantity": 1,
                    "quantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1,
                    "status": 1,
                }
            }
        ])

        let result = {
            count: count,
            data
        }

        return res.status(200).json({ 'success': true, "messages": "success", result })

    } catch (err) {

        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}



export const perpetualTradeHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrency', 'secondCurrency', 'buyorsell']);
        filter['status'] = { "$in": ["pending", "completed", "cancel"] }

        let count = await PerpetualOrder.aggregate([
            { "$match": filter },
            { "$unwind": "$filled" },
        ])

        let data = await PerpetualOrder.aggregate([
            { "$match": filter },
            { "$unwind": "$filled" },
            { "$sort": { "createdAt": -1 } },
            {
                "$project": {
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "buyorsell": 1,
                    "price": "$filled.price",
                    "filledQuantity": "$filled.filledQuantity",
                    "orderValue": "$filled.orderValue",
                    "Fees": "$filled.Fees",
                    "createdAt": {
                        "$dateToString": {
                            "date": '$filled.createdAt',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                }
            },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit }
        ])

        let result = {
            count: count.length,
            data
        }
        return res.status(200).json({ 'success': true, "messages": "success", result })

    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}


/** 
 * Get Withdraw List
 * URL: /adminapi/getWithdraw
 * METHOD : GET
*/
export const getWithdrawList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let count = await Transaction.aggregate([
            {
                "$match": {
                    "paymentType": {
                        "$in": [2, 4]
                    },
                    "status": {
                        "$in": [3, 4, 5]
                    }
                }
            },

            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },

            {
                "$lookup": {
                    "from": 'currency',
                    "localField": "currencyId",
                    "foreignField": "_id",
                    "as": "currencyInfo"
                }
            },
            { "$unwind": "$currencyInfo" },
        ])

        let data = await Transaction.aggregate([
            {
                "$match": {
                    "paymentType": {
                        "$in": [2, 4]
                    },
                    "status": {
                        "$in": [3, 4, 5]
                    }
                }
            },

            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },

            {
                "$lookup": {
                    "from": 'currency',
                    "localField": "currencyId",
                    "foreignField": "_id",
                    "as": "currencyInfo"
                }
            },
            { "$unwind": "$currencyInfo" },

            {
                "$project": {
                    "toaddress": 1,
                    "amount": 1,
                    "createdAt": 1,
                    "currencySymbol": "$currencyInfo.currencySymbol",
                    "email": "$userInfo.email",
                    "status": 1,
                    "bankDetail": 1,
                    'paymentType': 1
                }
            },

            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
        ])

        let repData = {
            count: count.length,
            data
        }
        return res.status(200).json({ "success": true, 'messages': 'Success', 'result': repData })
    } catch (err) {
        return res.status(500).json({ "success": false, 'messages': 'Error on server' })
    }
}

/** 
 * Get Fund Transfer History List
 * URL: /adminapi/fundTransferHistory
 * METHOD : GET
*/
export const fundTransferHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'toaddress', 'paymentType','currencySymbol', 'amount', 'txid', 'status']);

        let count = await Transaction.aggregate([
            {
                "$match": {
                    "paymentType": { "$in": ["coin_deposit", "fiat_deposit"] },
                }
            },
            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },
            {
                "$project": {
                    "email": "$userInfo.email",
                    "currencySymbol": 1,
                    "userAssetId": 1,
                    "actualAmount": 1,
                    "amount": 1,
                    "txid": 1,
                    "toaddress": 1,
                    "status": 1,
                    "paymentType": 1,
                    "createdAt": {
                        "$dateToString": {
                            "date": '$createdAt',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    }
                }
            },
            { "$match": filter },
        ])

        let data = await Transaction.aggregate([
            {
                "$match": {
                    "paymentType": { "$in": ["coin_deposit", "fiat_deposit"] },
                }
            },
            { "$sort": { "createdAt": -1 } },

            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },
            {
                "$project": {
                    "email": "$userInfo.email",
                    "currencySymbol": 1,
                    "userAssetId": 1,
                    "image": {
                        '$concat': [config.SERVER_URL, config.IMAGE.DEPOSIT_URL_PATH, "$image"]
                    },
                    "actualAmount": 1,
                    "amount": 1,
                    "txid": 1,
                    "toaddress": 1,
                    "status": 1,
                    "paymentType": 1,
                    "createdAt": {
                        "$dateToString": {
                            "date": '$createdAt',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    }
                }
            },
            { "$match": filter },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
        ])
        let alldata=await Transaction.find({});
        // console.log("Deposit data----",data)
        let result = {
            data,
            count: count.length,
            alldata
        }
        return res.status(200).json({ "success": true, result })
    } catch (err) {
        console.log("Error---",err)
        return res.status(500).json({ "success": false, 'messages': 'Error on server' })
    }
}

export const saveChatDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var userid = reqBody.userid;

    if (
      (reqBody.msg == "" || reqBody.msg == undefined) &&
      (!req.file || req.file == "undefined")
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Please Enter Message or attachment" });
    }

    if (!req.file || req.file == "undefined") {
      var attachment = "";
    } else {
      var attachment = req.file.filename;
    }

    var orderbookdata = await P2POrderbook.findOne({
      _id: ObjectId(reqBody.orderId),
    });

    // if (orderbookdata.status == 4) {
    //   return res.status(400).json({status:false, message:"Trade already completed"});
    // }

    if (orderbookdata.status == 2) {
      return res
        .status(400)
        .json({ status: false, message: "Trade Already Cancelled" });
    }
    if (orderbookdata.status == 5) {
      return res.status(400).json({
        status: false,
        message: "Time Exceeded So Trade Closed Already",
      });
    }

    var tradetable = await P2PTradeTable.findOne({
      _id: ObjectId(orderbookdata.trade_id),
    });
    var message = reqBody.msg;
    var TradeId = orderbookdata.trade_id;
    var orderbookId = orderbookdata._id;

    const chatsave = new P2PChat({
      message: message,
      TradeId: TradeId,
      admin: true,
      orderbookId: orderbookId,
      attachment: attachment,
    });

    chatsave.save().then(async (saved) => {
      if (saved) {
        P2PChat.aggregate([
          {
            $match: { _id: ObjectId(saved._id) },
          },
          {
            $lookup: {
              from: "users",
              localField: "Sender_userId",
              foreignField: "_id",
              as: "senderdetails",
            },
          },
          {
            $unwind: {
              path: "$senderdetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "Receiver_userId",
              foreignField: "_id",
              as: "receiverdetails",
            },
          },
          {
            $unwind: {
              path: "$receiverdetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              message: 1,
              attachment: 1,
              Sender_userId: 1,
              Receiver_userId: 1,
              admin: 1,
              created_at: 1,
              receiverdetails: {
                _id: 1,
                name: "$receiverdetails.email",
              },
              senderdetails: {
                _id: 1,
                name: "$senderdetails.email",
              },
            },
          },
        ])
          .sort({ _id: -1 })
          .exec(function (err, response_chat) {
            socketEmitChat("p2pchat-" + reqBody.orderId, response_chat);
          });

        return res.json({ status: true, message: "Message Sent Successfully" });
      }
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: false, message: "Error occured" });
  }
};
