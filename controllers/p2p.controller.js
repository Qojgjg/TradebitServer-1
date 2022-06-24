import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import node2fa from 'node-2fa';
import multer from 'multer';
import path from 'path';
import imageFilter from '../lib/imageFilter';
// import modal
import {
    User,
    
    
    P2PFeedback,
    P2PLike,
    
    Transaction,
    
} from '../models';
import { Notification } from '../models';
import P2PSpotpairs from '../models/P2PSpotpairs';
import P2POrderbook from "../models/P2POrderbook"
import P2PTradeTable from '../models/P2PTradeTable';
import P2PChat from '../models/P2PChat'
import Assets from '../models/Assets';
import P2PDispute from '../models/P2PDispute'
//import AdminRevenue from '../models/AdminRevenue'
const Admin_Revenue = require("../models/AdminRevenue");
//const Admin_Revenue = require("../models/AdminRevenue");
import { mailTemplateLang } from './emailTemplate.controller';

import config from '../config';

import { socketEmitOne, socketEmitChat } from '../config/socketIO';

// import package
var cron = require("node-cron");
var schedule = require("node-schedule");



var Bharatcoinpriceapi =
  "60c9395c-b31f-4698-8b8d-ce9ea6c04a02";
var tradeinfo = [];
const getJSON = require("get-json");




// Spot pair value changes.

cron.schedule("0 0 * * *", (req, res) => {
    console.log("sa***********************************************---------------")
    // cron.schedule('* * * * *', (req,res) => {
    P2PSpotpairs.find().then((perpetualdata) => {
      // console.log("P2PSpotpairs",P2PSpotpairs);
      if (perpetualdata.length > 0) {
        var i = 0;
        setpairapiprice(perpetualdata[0], function () {
          // console.log("first");
          if (i === perpetualdata.length - 1) {
            callBackResponseImport();
          } else {
            i += 1;
            if (perpetualdata[i]) {
              // console.log("next");
              setpairapiprice(perpetualdata[i]);
            } else {
              callBackResponseImport();
            }
          }
        });
      }
    });
});
function callBackResponseImport() {
    console.log("pricess");
}
async function setpairapiprice(perpetualdata, callbackforapiprice) {
  try {
    if (callbackforapiprice) {
        tradeinfo.callBackforprice = callbackforapiprice;
    }
    var pairname = perpetualdata.tiker_root;
    var firstcur = perpetualdata.first_currency;
    var secondcur = perpetualdata.second_currency;
    // getJSON(
    //   "https://min-api.cryptocompare.com/data/price?fsym=" +
    //     firstcur +
    //     "&tsyms=" +
    //     secondcur +
    //     "&api_key=" +
    //     Ayacoinpriceapi,

    getJSON("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol="+
    firstcur +
    "&convert="+
    secondcur +
    "&CMC_PRO_API_KEY=" +
    Bharatcoinpriceapi,
        function (errorBal, response) {
        if (response) {
            // console.log(response,"responseresponse")
            var indexprice = response.data[firstcur] && response.data[firstcur].quote[secondcur] && response.data[firstcur].quote[secondcur].price;
            var updateObj = {
            index_price: indexprice.toFixed(8),
            };
            console.log("updateObj----",updateObj)
            P2PSpotpairs.findByIdAndUpdate(
            perpetualdata._id,
            updateObj,
            {
                new: true,
            },
            function (err, user) {
                tradeinfo.callBackforprice();
            }
            );
        } else {
            console.log(errorBal,"errorBalerrorBalerrorBalerrorBalerrorBal");
            tradeinfo.callBackforprice();
        }
        }
    );
  } catch (err) {
    console.log(err,"errerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerrerr")
    // next(err);
  }
}

/** 
 * Get Perpetual P2P Pair List
 * METHOD: GET
 * URL : /api/P2PtradePair
*/
export const p2pTradePair = async (req, res) => {
    try {
      
        await P2PSpotpairs.find({status:0}).then((result) => {
        
            if (result) {
              console.log("p2pTradePairnow----",result)
              return res.status(200).json({
                status: true,
                'result': result,
              });
            }
          });
    } catch (err) {
      console.log("Error---",err)
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}
export const p2pSpotPair = async (req, res) => {
  try {
    //console.log("Inside spot pair");
      P2PSpotpairs.find({first_currency:"BTC"}).then((result) => {
       
          if (result) {
            return res.status(200).json({
              status: true,
              'result': result,
            });
          }
        });
  } catch (err) {
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}

/**
 * P2P order place
 * URL : /api/p2pPostTrade
 * METHOD : POST
 * BODY : userId, fromcurrency, tocurrency,minlimit,maxlimit,posttradeprice,type,startDate,postprefcurrency,quantity,postcheckboxaccept;
*/

export const p2pPostTrade = async (req, res) => {
  try {
    console.log("UReq---",req.body)
    var userid = req.body.userId;
    var fromcurrency = req.body.fromcurrency;
    var tocurrency = req.body.tocurrency;
    var minlimit = req.body.minlimit;
    var maxlimit = req.body.maxlimit;
    var minlimit_initial = req.body.minlimit;
    var maxlimit_initial = req.body.maxlimit;
    var posttradeprice = req.body.posttradeprice;
    var tradetype = req.body.type;
    var postStartDate = req.body.startDate;
    var transferMode= req.body.postprefcurrency;
    var quantity = req.body.quantity;
    var postcheckboxaccept = req.body.postcheckboxaccept;
    var paymentDetail=req.body.paymentDetail;

    var preferredfiat = req.body.tocurrency;
      var userdata = await User.findOne({ _id: userid });
      var spotpairdata = await P2PSpotpairs.findOne({
        first_currency: fromcurrency,
        second_currency: tocurrency,
      });
     
      var crypto_amount_cal = maxlimit;
      var fee_amount = crypto_amount_cal * (spotpairdata.transactionfee / 100);
      var crypto_amount = parseFloat(crypto_amount_cal) + fee_amount;
       var equal_fiat_amount=crypto_amount/req.body.price;
     

      let checkUser = await User.findOne({ '_id': req.body.userId })
     
      console.log("checkUser---",checkUser)
      if (tradetype == "Sell") {
        var assetdata = await Assets.findOne({
          userId: userid,
          currencySymbol: fromcurrency,
        });
        console.log("User---",assetdata)

        var crypto_balance =
          parseFloat(assetdata.p2pbalance) - quantity //parseFloat(assetdata.p2pholdingbalance);
   
        if (crypto_balance < equal_fiat_amount) {
          return res.json({
            status: false,
            message: "Balance is Low to post a trade",
          });
        }
      }

      const newtrade = new P2PTradeTable({
        userId: userid,
        price: parseFloat(posttradeprice),
        quantity: quantity,
        firstCurrency: fromcurrency,
        secondCurrency: tocurrency,
        pair: fromcurrency + "-" + tocurrency,
        // prefcurrencytransfer: bank,
        // bankpaymentdetails: bankdata,
        BuyorSell: tradetype,
        orderDate: new Date(),
        marketprice: spotpairdata.index_price,
        fee_percentage: spotpairdata.transactionfee,
        fee_amount: fee_amount,
        minlimit: minlimit,
        maxlimit: maxlimit,
        minlimit_initial: minlimit_initial,
        maxlimit_initial: maxlimit_initial,
        beforeBalance: equal_fiat_amount,
        afterBalance: 0,
        pairName: fromcurrency + tocurrency,
        terms: postcheckboxaccept,
        transferMode:  transferMode,
        postStartDate: postStartDate,
        paymentDetail:paymentDetail,
      });
      // console.log(newtrade,"newtradenewtradenewtrade");
      // return false;
      var pairName = fromcurrency + tocurrency;
      newtrade.save().then(async (tradesaved) => {
        if (tradesaved) {
         
          if (tradetype == "Sell") {
              let holdingbalance =assetdata.p2pholdingbalance + equal_fiat_amount;
              let p2pcurrentbalance=assetdata.p2pbalance-holdingbalance;
          

            await Assets.findOneAndUpdate(
              {
                _id: ObjectId(assetdata._id),
              },
              {
                $set: {
                  p2pholdingbalance: holdingbalance,
                  p2pbalance:p2pcurrentbalance,
                },
              }
            );
          }
          let content = {
            'id': tradesaved._id,
          };
          mailTemplateLang({
            'userId': checkUser._id,
            'identifier': 'Post_ad',
            'toEmail': checkUser.email,
            content
        })
          // const newactivity = new Myactivity({
          //   userId: userid,
          //   Category: "Post Ad",
          //   created_date: new Date(),
          //   message:
          //     "Posted a " +
          //     tradetype +
          //     " order of " +
          //     posttradeprice +
          //     " limit " +
          //     minlimit +
          //     " - " +
          //     maxlimit +
          //     " for " +
          //     pairName,
          // });
    
          // newactivity.save();
          
          let description="New P2P Ad Posted Successfully";
    
          let newNotification = new Notification({
              'description': description,
              'userId': checkUser._id,
              'type':"Trade",
              'category': "P2P Post Ad",
              'created_date':new Date()
              
          });
         newNotification.save();

          return res.json({
            status: true,
            message: "Trade posted Succesfully",
          });
        } else {
          return res.json({
            status: false,
            message: "Unable to Post the Trade",
          });
        }
      });
} catch (err) {
  console.log(err,"errerrerrerrerrerrerrerrerrerrerrerrerrerr")
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}


/**
 * P2P order update
 * URL : /api/p2pPostTrade
 * METHOD : POST
 * BODY : userId, fromcurrency, tocurrency,minlimit,maxlimit,posttradeprice,type,startDate,postprefcurrency,quantity,postcheckboxaccept;
*/

export const p2pUpdateTrade = async (req, res) => {
  try {
    console.log("req.body-pppp-----------------",req.body);
    // return false;

    
    var transferMode= req.body.postprefcurrency;
    var userid = req.body.userId;
    var postadid = req.body.postId;
    var postminlimit = req.body.minlimit;
    var postmaxlimit = req.body.maxlimit;
    var quantity=req.body.quantity;
    var posttradeprice = Number(req.body.price);
    var userdata = await User.findOne({ _id: userid });
    var Tradedata = await P2PTradeTable.findOne({ _id: postadid,status:"0" });
    console.log("Tradedata----------------",Tradedata);
    var assetdata = await Assets.findOne({
      userId: req.body.userId,
      currencySymbol: Tradedata.firstCurrency,
    });
    console.log("assetdata----------------",assetdata);
    
    var current_cryptobalance = assetdata.p2pbalance;
    var current_holdingbalance=assetdata.p2pholdingbalance;
    console.log("current_cryptobalance---",current_cryptobalance)
    console.log("current_holdingbalance---",current_holdingbalance)

    // Old Holding balance removal

    var oldmaxlimit=Tradedata.maxlimit;
    var oldprice=Tradedata.price;
    var oldquantity=Tradedata.quantity;
    var oldfeeamount=Tradedata.maxlimit*(Tradedata.fee_percentage/100);
    var oldperprice=Tradedata.maxlimit/oldquantity;
    var oldholdingbalance=(oldmaxlimit+oldfeeamount)/oldperprice;
    var holdingbalance=current_holdingbalance-oldholdingbalance;
    var new_cryptobalance = current_cryptobalance + oldholdingbalance;
   
   
   
    console.log("oldfeeamount---",oldfeeamount);
    console.log("oldmaxlimit---",oldmaxlimit)
    console.log("oldperprice---",oldperprice);
    console.log("oldholdingbalance---",oldholdingbalance);
    console.log("holdingbalance---",holdingbalance);
    console.log("new_cryptobalance---",new_cryptobalance);
    var new_fee_amount = postmaxlimit * (Tradedata.fee_percentage / 100);
     var total_amount=postmaxlimit+new_fee_amount
     var hold_now=total_amount/posttradeprice;
   
     console.log("new_fee_amount---",new_fee_amount);
     console.log("total_amount---",total_amount);
     console.log("posttradeprice---",posttradeprice);

     console.log("hold_now---",hold_now);
     
     
    if(Tradedata.BuyorSell==='Sell'){
      assetdata.p2pbalance=new_cryptobalance;
      assetdata.p2pholdingbalance=holdingbalance;
      
      // var new_asset=await Assets.findOneAndUpdate({ _id: ObjectId(assetdata._id)},{
      //   $set: {
      //     p2pholdingbalance:holdingbalance,
      //     p2pbalance:new_cryptobalance
      //   }
      // })
        
    

     //New Updated values holding balance updation
      if(hold_now<new_cryptobalance){
        var new_asset=await assetdata.save();
      var new_holdingbalance=new_asset.p2pholdingbalance+hold_now;
      var current_p2pbalance=new_asset.p2pbalance-new_holdingbalance
            new_asset.p2pbalance=current_p2pbalance;
            new_asset.p2pholdingbalance=new_holdingbalance;
            var final_update=await new_asset.save();
            console.log("final_update----",final_update)
            let update = {
              quantity:quantity,
              minlimit: postminlimit,
              maxlimit: postmaxlimit,
              minlimit_initial: postminlimit,
              maxlimit_initial: postmaxlimit,
              price: postmaxlimit,
              fee_amount:new_fee_amount,
              // prefcurrencytransfer: bank,
              // bankpaymentdetails: bankselected,
              beforeBalance: hold_now,
              afterBalance: 0,
              // terms: terms,
              transferMode: transferMode,
            };
            P2PTradeTable.findOneAndUpdate(
              {
                _id: postadid,
              },
              {
                $set: update,
              },
              function (err, result) {
                if (result) {
                  var pairName = result.firstCurrency + result.secondCurrency;

                  return res.json({
                    status: true,
                    message: "Trade Updated Succesfully",
                  });
                } 
              }
            
            );
      }
      else {
        return res.status(400).json({
          status: false,
          message: "Balance is too low to Edit",
        });
      }
  }else{

    let update = {
      quantity:quantity,
      minlimit: postminlimit,
      maxlimit: postmaxlimit,
      minlimit_initial: postminlimit,
      maxlimit_initial: postmaxlimit,
      price: postmaxlimit,
      fee_amount:new_fee_amount,
      // prefcurrencytransfer: bank,
      // bankpaymentdetails: bankselected,
      beforeBalance: hold_now,
      afterBalance: 0,
      // terms: terms,
      transferMode: transferMode,
    };
    P2PTradeTable.findOneAndUpdate(
      {
        _id: postadid,
      },
      {
        $set: update,
      },
      function (err, result) {
        if (result) {
          var pairName = result.firstCurrency + result.secondCurrency;

           return res.json({
            status: true,
            message: "Trade Updated Succesfully",
          });
        } else {
          return res.json({
            status: false,
            message: "Unable to Update the Trade",
          });
        }
      }
    );
  }
  } catch (err) {
    console.log(err,"errerrerrerrerrerrerrerrerrerrerrerrerrerr")
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}
/** 
 * Get Particular user add
 * METHOD: GET
 * URL : /api/p2pMyadddetails
*/
export const p2pMyadddetails = async (req, res) => {
  try {
    // P2PSpotpairs.find({}).then((result) => {
    //     if (result) {
    //       return res.status(200).json({
    //         status: true,
    //         'result': result,
    //       });
    //     }
    //   });
    var reqBody = req.body;
    // return false;
var user_Id = mongoose.Types.ObjectId(reqBody.curUser);

var filter_by = {};
var filter_by1 = {};
if (user_Id) {
  filter_by["userId"] = user_Id;
}

if (reqBody.myaddate && reqBody.myaddate != "NaN-NaN-NaN") {
  var datenew = reqBody.myaddate + "T00:00:00.000Z";
//  filter_by["orderDate"] = { $gte: new Date(datenew) };
filter_by["postStartDate"] = { $lte: new Date(datenew) };
}

if (reqBody.myadname) {
  var search = reqBody.myadname;

  filter_by1 = {
    $or: [
      { firstCurrency: new RegExp(search, "i") },
      { secondCurrency: new RegExp(search, "i") },
      { pair: new RegExp(search, "i") },
      { BuyorSell: new RegExp(search, "i") },
      //{ _id: { '$regex': search } },
      // { price: new RegExp(search, "i") },
      // { secondCurrency: new RegExp(search, "i") },
    ],
  };

  // filter_by["_id"] = ObjectId(reqBody.myadname);
  //  filter_by["firstCurrency"] = reqBody.myadname;
  //  filter_by["secondCurrency"] = reqBody.myadname;
  // filter_by["BuyorSell"] = reqBody.myadname;
}

const object3 = { ...filter_by, ...filter_by1 };

console.log(object3, "fgfff");

var total_count = await P2PTradeTable.aggregate([{ $match: object3 }]);

await P2PTradeTable
  .aggregate([
    { $match: object3 },
    { $sort: { _id: -1 } },

    // { $skip: reqBody.offset },
    // { $limit: reqBody.limit },
  ])
  .then(async (tradedata) => {
    if (tradedata) {
      var items_arr = [];
      for (let items of tradedata) {
        var flag_cancel = 0;
        var flag_edit = 0;

        var orderbookcount = await P2POrderbook.find({
          trade_id: ObjectId(items._id),
          status: {
            $in: [0], // 0 - Open
          },
        }).countDocuments();

        if (orderbookcount > 0) {
          var flag_cancel = 1;
        }

        if (items.afterBalance == items.beforeBalance) {
          var flag_cancel = 1;
        }
        if (items.afterBalance > 0) {
          var flag_edit = 1;
        }

        items_arr.push({
          ...items,
          ...{ flag_cancel: flag_cancel, flag_edit: flag_edit },
        });
      }
      return res.status(200).json({
        status: true,
        'result': items_arr,
      });
      // res.json({
      //   status: true,
      //   tradedata: items_arr,
      //   total_count: total_count.length,
      //   limit: reqBody.limit,
      // });
    }
  });
} catch (err) {
  console.log("errerrerrerr",err);
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}


/** 
 * Get Particular user recent add
 * METHOD: GET
 * URL : /api/p2pMyrecentadddetails
*/
export const p2pMyrecentadddetails = async (req, res) => {
  try {
      // P2PSpotpairs.find({}).then((result) => {
      //     if (result) {
      //       return res.status(200).json({
      //         status: true,
      //         'result': result,
      //       });
      //     }
      //   });
   //   var reqBody = req.body;
      // return false;
  // var user_Id = mongoose.Types.ObjectId(reqBody.curUser);

  // var filter_by = {};
  // var filter_by1 = {};
  // if (user_Id) {
  //   filter_by["userId"] = user_Id;
  // }

  // if (reqBody.myaddate && reqBody.myaddate != "NaN-NaN-NaN") {
  //   var datenew = reqBody.myaddate + "T00:00:00.000Z";
  // //  filter_by["orderDate"] = { $gte: new Date(datenew) };
  // filter_by["orderDate"] = { $eq: new Date(datenew) };
  // }

  // if (reqBody.myadname) {
  //   var search = reqBody.myadname;

  //   filter_by1 = {
  //     $or: [
  //       { firstCurrency: new RegExp(search, "i") },
  //       { secondCurrency: new RegExp(search, "i") },
  //       { pair: new RegExp(search, "i") },
  //       { BuyorSell: new RegExp(search, "i") },
  //       //{ _id: { '$regex': search } },
  //       // { price: new RegExp(search, "i") },
  //       // { secondCurrency: new RegExp(search, "i") },
  //     ],
  //   };

  //   // filter_by["_id"] = ObjectId(reqBody.myadname);
  //   //  filter_by["firstCurrency"] = reqBody.myadname;
  //   //  filter_by["secondCurrency"] = reqBody.myadname;
  //   // filter_by["BuyorSell"] = reqBody.myadname;
  // }

  // const object3 = { ...filter_by, ...filter_by1 };

  // console.log(object3, "fgfff");

  // var total_count = await P2PTradeTable.aggregate([{ $match: object3 }]);

  // await P2PTradeTable
  //   .aggregate([
  //     { $match: object3 },
  //     { $sort: { _id: -1 } },

  //     // { $skip: reqBody.offset },
  //     // { $limit: reqBody.limit },
  //   ]).limit(1)
  //   .then(async (tradedata) => {
  //     if (tradedata) {
  //       var items_arr = [];
  //       for (let items of tradedata) {
  //         var flag_cancel = 0;
  //         var flag_edit = 0;

  //         var orderbookcount = await P2POrderbook.find({
  //           trade_id: ObjectId(items._id),
  //           status: {
  //             $in: [0], // 0 - Open
  //           },
  //         }).countDocuments();

  //         if (orderbookcount > 0) {
  //           var flag_cancel = 1;
  //         }

  //         if (items.afterBalance == items.beforeBalance) {
  //           var flag_cancel = 1;
  //         }
  //         if (items.afterBalance > 0) {
  //           var flag_edit = 1;
  //         }

  //         items_arr.push({
  //           ...items,
  //           ...{ flag_cancel: flag_cancel, flag_edit: flag_edit },
  //         });
  //       }
  //       return res.status(200).json({
  //         status: true,
  //         'result': items_arr,
  //       });
  //       // res.json({
  //       //   status: true,
  //       //   tradedata: items_arr,
  //       //   total_count: total_count.length,
  //       //   limit: reqBody.limit,
  //       // });
  //     }
  //   });
  // } catch (err) {
  //   console.log("errerrerrerr",err);
  //     return res.status(500).json({ 'status': false, 'message': "Error occured" });
  // }
  var userID = req.body.curUser;
  var trans = req.body.transactiontype;
  var curr=req.body.currencytype;
 // console.log("Reqqqqbody------",req.body);
  var filter_by = {};
  if (userID) {
    filter_by["userId"] = ObjectId(userID);
  }
  if(trans){
    filter_by["paymentType"] = trans;
  }
  if(curr){
    filter_by["currencySymbol"] = curr;
  }
  // var current_date=new Date()
  // filter_by["postStartDate"]={ $gte : new Date() } 
 
  P2PTradeTable.find(filter_by).sort({_id:-1}).exec(async (err,result) =>  {
  if(result){
    var items_arr = [];
      for (let items of result) {
        var flag_cancel = 0;
        var flag_edit = 0;

        var orderbookcount = await P2POrderbook.find({
          trade_id: ObjectId(items._id),
          status: {
            $in: [0], // 0 - Open
          },
        }).countDocuments();

        if (orderbookcount > 0) {
          var flag_cancel = 1;
        }

        if (items.afterBalance == items.beforeBalance) {
          var flag_cancel = 1;
        }
        if (items.afterBalance > 0) {
          var flag_edit = 1;
        }

        items_arr.push({
          ...items,
          ...{ flag_cancel: flag_cancel, flag_edit: flag_edit },
        });
      }
 
    return res.json({status: true,result: result,data:items_arr});
  }
  else{
   // console.log("errerrerr",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
  
})
}catch(err){
  console.log("errerrerr--------",err)
  return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}



/** 
 * Get BUY add
 * METHOD: POST
 * URL : /api/getBuyAdDetails
*/
export const getBuyAdDetails = async (req, res) => {
  try {
    console.log("Buy Ad body----",req.body);
    // return false;
    var reqBody = req.body;
  var filter_by = {};
  filter_by["status"] = { $nin: ["3", "5","1"] };
  filter_by["BuyorSell"] = "Sell";
  // filter_by["firstCurrency"] = reqBody.crypto;
   if (reqBody.userid) {
    filter_by["userId"] = { $ne: ObjectId(reqBody.userid) };
  }
  console.log("new Date()----",new Date())

  filter_by["postStartDate"]={ $gte : new Date() } 
  console.log("filter_by Buy----",filter_by)

  var total_count = await P2PTradeTable.aggregate([
    { $match: filter_by },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: "$user_info" },
  ]);
//console.log("total_count",total_count);
  P2PTradeTable
    .aggregate([
      { $match: filter_by },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
      { $skip: reqBody.offset },
      // { $limit: reqBody.limit },
    ])

    .exec(function (err, tradedata) {
    
      res.json({
        status: true,
        'result': tradedata,
        total_count: total_count.length,
       // limit: reqBody.limit,
      });
    });
  } catch (err) {
    console.log("errerrerrerr",err);
      return res.status(500).json({ 'status': false, 'message': "Error occured",'errors':err });
  }
}


/** 
 * Get SELL add
 * METHOD: POST
 * URL : /api/getSellAdDetails
*/
export const getSellAdDetails = async (req, res) => {
  try {
    var reqBody = req.body;
  
    var filter_by = {};
    filter_by["status"] = { $nin: ["3", "5","1"] };
   filter_by["BuyorSell"] = "Buy";
    // filter_by["firstCurrency"] = reqBody.crypto;
    // filter_by["secondCurrency"] = reqBody.fiat;
    if (reqBody.userid) {
      filter_by["userId"] = { $ne: ObjectId(reqBody.userid) };
    }
    console.log("new Date()----",new Date())
    filter_by["postStartDate"]={ $gte : new Date() } 

    console.log("filter_by sell---",filter_by)
    var total_count = await P2PTradeTable.aggregate([
      { $match: filter_by },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ]);
  
    P2PTradeTable
      .aggregate([
      { $match: filter_by },
        { $sort: { _id: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user_info",
          },
        },
        { $unwind: "$user_info" },
        { $skip: reqBody.offset },
     //   { $limit: reqBody.limit },
      ])
  
      .exec(function (err, tradedata) {
     console.log("Sellad Details----",tradedata.length);

        res.json({
          status: true,
          'result': tradedata,
          total_count: total_count.length,
        //  limit: reqBody.limit,
        });
      });
  } catch (err) {
    console.log("errerrerrerr",err);
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Get BUY add
 * METHOD: POST
 * URL : /api/getSarchBuyDetails
*/
export const getSarchBuyDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var filter_by = {};

  filter_by["status"] = { $nin: ["3", "5"] };
  filter_by["BuyorSell"] = "Sell";

  if (reqBody.fc) {
    filter_by["firstCurrency"] = reqBody.fc;
  }

  if (reqBody.sc) {
    filter_by["secondCurrency"] = reqBody.sc;
  }

  if (reqBody.sc_amount) {
    filter_by["maxlimit"] = { $gte: Number(reqBody.sc_amount) };
  }

  if (reqBody.transferMode) {
    filter_by["transferMode"] = reqBody.transferMode;
  }
  if (req.user.id) {
    filter_by["userId"] = {$ne:ObjectId(req.user.id)};
  }
  //var current_date=new Date()
 filter_by["postStartDate"]={ $gte : new Date() } 
  console.log("FilterbyBuy-----",filter_by)
  var total_count = await P2PTradeTable.aggregate([
    { $match: filter_by },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: "$user_info" },
  ]);

  await P2PTradeTable
    .aggregate([
      { $match: filter_by },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ])

    .exec(function (err, tradedata) {
      res.json({
        status: true,
        'result': tradedata,
        total_count: total_count.length,
      //  limit: reqBody.limit,
      });
    });
  } catch (err) {
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}


/** 
 * Get SELL add
 * METHOD: POST
 * URL : /api/getSarchSellDetails
*/
export const getSarchSellDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var filter_by = {};

  filter_by["status"] = { $nin: ["3", "5"] };
  filter_by["BuyorSell"] = "Buy";

  if (reqBody.fc) {
    filter_by["firstCurrency"] = reqBody.fc;
  }

  if (reqBody.sc) {
    filter_by["secondCurrency"] = reqBody.sc;
  }

  if (reqBody.sc_amount) {
    filter_by["maxlimit"] = { $gte: Number(reqBody.sc_amount) };
  }

  if (reqBody.transferMode) {
    filter_by["transferMode"] = (reqBody.transferMode).toString();
  }
  if (req.user.id) {
    filter_by["userId"] = {$ne:ObjectId(req.user.id)};
  }
  //var current_date=new Date()
  filter_by["postStartDate"]={ $gte : new Date() } 
  console.log("FilterbySell-----",filter_by)

  //console.log(reqBody.transferMode.toString(),"filter_byfilter_byfilter_by",filter_by);
  var total_count = await P2PTradeTable.aggregate([
    { $match: filter_by },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: "$user_info" },
  ]);

  await P2PTradeTable
    .aggregate([
      { $match: filter_by },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ])

    .exec(function (err, tradedata) {
      // console.log(tradedata,"tradedatatradedata");
      res.json({
        status: true,
        'result': tradedata,
        total_count: total_count.length,
      //  limit: reqBody.limit,
      });
    });
  } catch (err) {
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post BUY add
 * METHOD: POST
 * URL : /api/buyP2PTrade
*/
export const buyP2PTrade = async (req, res) => {
  try {
    var reqBody = req.body;
    //
    var Tradedata = await P2PTradeTable.findOne({ _id: ObjectId(reqBody._id) });

    if (reqBody.crypto_amount == "") {
      return res.json({
        status: false,
        message: "Please Enter the Buy Amount",
      });
    } else if (reqBody.fiat_amount == "") {
      return res.json({
        status: false,
        message: "Please Enter the Fiat Amount",
      });
    }

    // else if(Tradedata.minlimit>reqBody.crypto_amount  || Tradedata.maxlimit<reqBody.crypto_amount  )
    else if (Number(reqBody.fiat_amount) < Tradedata.minlimit)
      return res.json({
        status: false,
        message:
          "Please Enter Limit " + Tradedata.minlimit + "-" + Tradedata.maxlimit,
      });
    else if (Number(reqBody.fiat_amount) > Tradedata.maxlimit)
      return res.json({
        status: false,
        message:
          "Please Enter Limit " + Tradedata.minlimit + "-" + Tradedata.maxlimit,
      });
    else {
      return res.json({
        status: false,
        message: "",
      });
    }

  } catch (err) {
    console.log("errerrerr",err);
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post Confirm BUY add
 * METHOD: POST
 * URL : /api/buyConfirmP2PTrade
*/
export const buyConfirmP2PTrade = async (req, res) => {
  try {
    var reqBody = req.body;
    console.log("Bodybuyconfirm----",req.body)
    var Tradedata = await P2PTradeTable.findOne({ _id: ObjectId(reqBody._id) });
    var checkorderbook = await P2POrderbook.findOne({
      trade_id: ObjectId(Tradedata._id),
      to_userId: ObjectId(reqBody.userid),
    }).countDocuments();
    //console.log(checkorderbook, "countDocuments");
    // if (checkorderbook > 0) {
    //   return res.json({
    //     status: false,
    //     message: "Already Order Placed",
    //   });
    // }

    if (Tradedata) {
      try {

        if(Tradedata.status==3 || Tradedata.status==5 ){
          return res.json({
            status: false,
            message: "Sorry Trade Closed",
          });
        }
        var afterBalance =
          Number(Tradedata.afterBalance) + Number(reqBody.crypto_amount);

        if (
          Number(parseFloat(afterBalance).toFixed(8)) >
          Number(parseFloat(Tradedata.beforeBalance).toFixed(8))
        ) {
          return res.status(400).json({
            status: false,
            message: "currently There is no Limit , try some time",
          });
        }

        if (Tradedata.afterBalance == Tradedata.beforeBalance) {
          return res.json({
            status: false,
            message: "Sorry Trade Closed",
          });
        }
        if (reqBody.BuyorSell == "Sell") {
          var crypto_currency = Tradedata.firstCurrency;
          var assets = await Assets.findOne({
            userId: ObjectId(reqBody.userid),
            currencySymbol: crypto_currency,
          });
          var current_cryptobalance = assets.p2pbalance;
          var price=Number(reqBody.fiat_amount)/reqBody.crypto_amount;
          var crypto_amount = reqBody.crypto_amount;
          var fee_amount = Number(reqBody.fiat_amount)*(Tradedata.fee_percentage/100)
          var totalfiat=Number(reqBody.fiat_amount)+fee_amount;

          var crypto_amount_new = totalfiat/price;
        console.log("fee_amount---",fee_amount)
        console.log("fee_percentage---",Tradedata.fee_percentage)
        console.log("crypto_amount_new---",crypto_amount_new)
        console.log("price---",price)
        console.log("totalfiat---",totalfiat)

          if (totalfiat > current_cryptobalance) {
            return res.status(400).json({
              status: false,
              message:
                "Insufficient " + crypto_currency + " Balance for this Trade",
            });
          }
          var from_user_id = Tradedata.userId;
          var to_user_id = reqBody.userid;
        }
        if (Tradedata.BuyorSell == "Sell") {
          var crypto_currency = Tradedata.firstCurrency;
          var assets = await Assets.findOne({
            userId: ObjectId(Tradedata.userId),
            currencySymbol: crypto_currency,
          });
          var current_cryptobalance = assets.p2pbalance;
          var price=Number(reqBody.fiat_amount)/reqBody.crypto_amount;
          var crypto_amount = reqBody.crypto_amount;
          var fee_amount = Number(reqBody.fiat_amount)*(Tradedata.fee_percentage/100)
          var totalfiat=Number(reqBody.fiat_amount)+fee_amount;

          var crypto_amount_new = totalfiat/price;
        console.log("fee_amount---",fee_amount)
        console.log("fee_percentage---",Tradedata.fee_percentage)
        console.log("crypto_amount_new---",crypto_amount_new)
        console.log("price---",price)
        console.log("totalfiat---",totalfiat)

          if (totalfiat > current_cryptobalance) {
            return res.status(400).json({
              status: false,
              message:
                "Insufficient " + crypto_currency + " Balance for this Trader",
            });
          }
          var from_user_id = Tradedata.userId;
          var to_user_id = reqBody.userid;
        }

        if (Tradedata.BuyorSell == "Buy") {
          
          var crypto_currency = Tradedata.firstCurrency;
          var assets = await Assets.findOne({
            userId: ObjectId(reqBody.userid),
            currencySymbol: crypto_currency,
          });
          var current_cryptobalance = assets.p2pbalance;
          
          var crypto_amount = reqBody.crypto_amount;
          var fee_amount = crypto_amount*(Tradedata.fee_percentage/100)
           var crypto_amount_new = crypto_amount+fee_amount;

          // var fee_amount = Number(reqBody.fiat_amount)*(Tradedata.fee_percentage/100)
          // var totalfiat=Number(reqBody.fiat_amount)+fee_amount;
          // var crypto_amount_new = totalfiat/price;
          if (crypto_amount_new > current_cryptobalance) {
            return res.status(400).json({
              status: false,
              message:
                "Insufficient " + crypto_currency + " Balance for this Trade",
            });
          }

          var from_user_id = reqBody.userid;
          var to_user_id = Tradedata.userId;
        }

        var currentDate = new Date();
        var end_time = currentDate.setTime(
          currentDate.getTime() + 30 * 60 * 1000
        ); // 30 minutes

        const Orderbook = new P2POrderbook({
          from_userId: ObjectId(from_user_id),
          to_userId: ObjectId(to_user_id),
          trade_id: ObjectId(Tradedata._id),
          firstCurrency: Tradedata.firstCurrency,
          secondCurrency: Tradedata.secondCurrency,
          fiat_amount: reqBody.fiat_amount,
          crypto_amount: reqBody.crypto_amount,
          trade_fee_percentage: Tradedata.fee_percentage,
          trade_fee: fee_amount,       
          BuyorSell: reqBody.BuyorSell,
          price: Tradedata.price,
          status: 0, // 0-Open order
          dispute_status: 0, // 0- No Dispute 1- yes dispute
          created_date: new Date(),
          updated_date: new Date(),
          start_time: new Date(),
          end_time: end_time,
        });

        Orderbook.save().then(async (saved) => {
          if (saved) {
           //
           // console.log(saved,"saved*************");
            // Update trade balance
            var fee_amount = reqBody.crypto_amount*(Tradedata.fee_percentage/100)
            var afterBalance =
              Number(Tradedata.afterBalance) + Number(reqBody.crypto_amount)+fee_amount;

            // Trade Limit condition
            var minlimit = Tradedata.minlimit;
            var maxlimit = Tradedata.maxlimit;
            var currentmaxlimit = maxlimit - reqBody.fiat_amount;
            if (currentmaxlimit == 0) {
              var status = 5;
            } else {
              var status = 2;
            }
            if (minlimit > currentmaxlimit) {
              var currentminlimit = currentmaxlimit;
            } else {
              var currentminlimit = minlimit;
            }
            var currentmaxlimit = maxlimit - reqBody.fiat_amount;
            //  End Limit
            var quantity=Tradedata.quantity-reqBody.crypto_amount;
            await P2PTradeTable.findOneAndUpdate(
              {
                _id: ObjectId(Tradedata._id),
              },
              {
                $set: {
                  afterBalance: parseFloat(afterBalance).toFixed(8),
                  minlimit: currentminlimit,
                  maxlimit: currentmaxlimit,
                  status: status,
                  quantity:quantity
                },
              },
              function (err, result) {}
            );

            // End Update trade balance

            // const newactivity = new Myactivity({
            //   userId: reqBody.userid,
            //   Category: "Purchase",
            //   created_date: new Date(),
            //   message:
            //     reqBody.BuyorSell +
            //     " Order" +
            //     reqBody.fiat_amount +
            //     " " +
            //     Tradedata.secondCurrency +
            //     " For " +
            //     reqBody.crypto_amount +
            //     " " +
            //     Tradedata.firstCurrency,
            // });

            // newactivity.save();

            // Crypto Balance Update for trade posted

            // if (Tradedata.BuyorSell == "Sell") {
            //   var crypto_currency = Tradedata.firstCurrency;
            //   const assets = await Assets.findOne({
            //     userId: ObjectId(Tradedata.userId),
            //     currencySymbol: crypto_currency,
            //   });
            //   var current_cryptobalance = assets.p2pbalance;
            //   var crypto_amount = reqBody.crypto_amount;
            //   var fee_amount = crypto_amount * (Tradedata.fee_percentage / 100);
            //   var new_cryptobalance = current_cryptobalance - crypto_amount - fee_amount;

            //   // await Assets.findOneAndUpdate(
            //   //   {
            //   //     _id: ObjectId(assets._id),
            //   //   },
            //   //   {
            //   //     $set: { p2pbalance: new_cryptobalance },
            //   //   },
            //   //   function (err, result) {}
            //   // );
            // }

            // Crypto Balance Update for current logged in seller
            if (Tradedata.BuyorSell == "Buy") {
              var crypto_currency = Tradedata.firstCurrency;
              const assets = await Assets.findOne({
                userId: ObjectId(reqBody.userid),
                currencySymbol: crypto_currency,
              });
              var current_cryptobalance = assets.p2pbalance;
              var crypto_amount = reqBody.crypto_amount;
              var fee_amount = crypto_amount * (Tradedata.fee_percentage / 100);
              var deduction_amount=crypto_amount + fee_amount
              var new_cryptobalance = current_cryptobalance - deduction_amount;
              var holdingbalance=assets.p2pholdingbalance+deduction_amount;
              console.log("deduction_amount----",deduction_amount)
              console.log("new_cryptobalance----",new_cryptobalance)
              console.log("fee_amount----",fee_amount)
               console.log("Holding balance----",holdingbalance)
              await Assets.findOneAndUpdate(
                {
                  _id: ObjectId(assets._id),
                },
                {
                  $set: {
                    p2pholdingbalance:holdingbalance,
                     p2pbalance: new_cryptobalance },
                },
                function (err, result) {}
              );
            }

            // sendp2pemail(saved, reqBody.userid, "p2p_send_request");
            return res.status(200).json({
              status: true,
              'result': saved._id,
              message: "Order Placed Successfully",
            });
          }
        });
      } catch (err) {
         console.log(err,'ERRRRRRRRRRRRRRRR')
      }
    }

  } catch (err) {
         console.log(err,'ERRRRRRRRRRRRRRRR')

    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post Single BUY add
 * METHOD: POST
 * URL : /api/getSingleBuyAdDetails
*/

export const getSingleBuyAdDetails = async (req, res) => {
  //console.log(req.body.postId,"tsssssssssss**********************");
  try {
    var reqBody = req.body;
    // return false;

        var Tradedata = await P2PTradeTable
          .findOne({ _id: ObjectId(reqBody.postId) })
          .countDocuments();

      //console.log(Tradedata,'TradedataTradedataTradedataTradedata')
      // console.log('reqBody._id',Tradedata)
      if (Tradedata) {
        var filter_by = {};
        if (reqBody.postId) {
          filter_by["_id"] = ObjectId(reqBody.postId);
        }

        // if (reqBody.userid) {
        //   filter_by['userId']= reqBody.userid;
        // }

        //console.log(filter_by, "filter_by");
        P2PTradeTable
          .aggregate([
            { $match: filter_by },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user_info",
              },
            },
            { $unwind: "$user_info" },
          ])

          .sort({ _id: -1 })
          .exec(function (err, tradedata) {
           // console.log(tradedata,"tradedatatradedatatradedatatradedatatradedata");
            res.json({
              status: true,
              'result': tradedata,
            });
          });
      }

  }catch (err) {
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}


/** 
 * Post Single Order details
 * METHOD: POST
 * URL : /api/getSingleOrderDetails
*/
export const getSingleOrderDetails = async (req, res) => {
  try {
    var reqBody = req.body;
  reqBody = req.body;
  var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.orderId) });
  // console.log(orderbookdata,"orderbookdata");
  var tradetable = await P2PTradeTable.findOne({
    _id: ObjectId(orderbookdata.trade_id),
  });

  P2POrderbook.aggregate([
    { $match: { _id: ObjectId(reqBody.orderId) } },
    {
      $lookup: {
        from: "users",
        localField: "from_userId",
        foreignField: "_id",
        as: "sellerdetails",
      },
    },
    { $unwind: "$sellerdetails" },
    {
      $lookup: {
        from: "users",
        localField: "to_userId",
        foreignField: "_id",
        as: "buyerdetails",
      },
    },
    { $unwind: "$buyerdetails" },
    
    {
      $project: {
        start_time: 1,
        end_time: 1,
        from_userId: 1,
        to_userId: 1,
        _id: 1,
        status: 1,
        BuyorSell:1,
        crypto_amount:1,
        fiat_amount:1,
        firstCurrency:1,
        secondCurrency:1,
        buyerdetails: {
          _id: 1,
          username: 1,
        },
        sellerdetails: {
          _id: 1,
          username: 1,
        },
       
      },
    },
  ]).exec(function (err, response) {
    if (response) {
      console.log("responseresponse",response);
      res.json({
        status: true,
        result: response,
      });
    }
  });
}catch (err) {
  return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}



/** 
 * Post Single Order details
 * METHOD: POST
 * URL : /api/getOrderStatus
*/
export const getOrderStatus = async (req, res) => {
  try {
    var reqBody = req.body;
    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.orderId) });
    if (orderbookdata) {
      res.json({
        status: true,
        result: orderbookdata.status,
      });
    }
  }catch (err) {
    console.log(err,"errerrerrerrerrerrerrerrerr");
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}
/** 
 * Get Transaction History
 * METHOD: POST
 * URL : /api/getMyTransactions
*/
export const getMyTransactions=async(req,res)=>{
  try{
    var userID = req.body.curUser;
    var trans = req.body.transactiontype;
    var curr=req.body.currencytype;
    var filter_by = {};
    if (userID) {
      filter_by["userId"] = userID;
    }
    if(trans){
      if(trans!=='all')
      filter_by["paymentType"] = trans;
    }
    if(curr){
      if(curr!=='all')
      filter_by["currencySymbol"] = curr;
    }
    Transaction.find(filter_by).populate('currencyId').exec((err,result) => {
    if(result){
      return res.json({status: true,result: result});
    }
    else{
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
    
  })
  }catch{
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}


export const closeTrade = async (req, res) => {
  try {
       var reqBody = req.body;
       console.log("reqbody---",reqBody)
    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.orderId) });
    console.log("orderbookdataorderbookdata",orderbookdata);
  

    if(orderbookdata.status == 0 )
    {
      var tradetable = await P2PTradeTable.findOne({
        _id: ObjectId(orderbookdata.trade_id),
      });
    
      var Sender_userId = ObjectId(reqBody.userid);
      var Receiver_userId = ObjectId(tradetable.userId);
      var message = "Trade Closed due to Time Exceeded";
      var TradeId = orderbookdata.trade_id;
      var orderbookId = orderbookdata._id;
  
        const chatsave = new P2PChat({
          Sender_userId: Sender_userId,
          Receiver_userId: Receiver_userId,
          message: message,
          TradeId: TradeId,
          orderbookId: orderbookId,
        });
  
    chatsave.save().then(async (saved) => {
      console.log(tradetable,"tradetable")
      if (saved) {
        // Balance credited back to seller
        var crypto_currency = tradetable.firstCurrency;
  
        const assets = await Assets.findOne({
          userId: ObjectId(orderbookdata.from_userId),
          currencySymbol: crypto_currency,
        });
        var current_cryptobalance = assets.p2pbalance;
        var crypto_amount = orderbookdata.crypto_amount;
        var trade_fee = orderbookdata.trade_fee;
        var refund_amount=crypto_amount + trade_fee
        var new_cryptobalance = current_cryptobalance + refund_amount;
        var holdingbalance=assets.p2pholdingbalance-refund_amount;
        await Assets.findOneAndUpdate(
          {
            _id: ObjectId(assets._id),
          },
          {
            $set: { 
              p2pholdingbalance:holdingbalance,
              p2pbalance: new_cryptobalance },
          },
          function (err, result) {}
        );
        // End
  
        // Update trade balance
  
        var afterBalance =
          Number(tradetable.afterBalance) - Number(crypto_amount) - trade_fee;
  
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
            _id: ObjectId(tradetable._id),
          },
          {
            $set: {
              afterBalance: afterBalance,
              maxlimit: currentmaxlimit,
              minlimit: currentminlimit,
              status: status,
            },
          },
          function (err, result) {}
        );
  
        // End Update trade balance
  
        // Update trade Status
        await P2POrderbook.findOneAndUpdate(
          {
            _id: ObjectId(orderbookdata._id),
          },
          {
            $set: {
              status: 5,
            },
          }
        );
        // End
        let checkUser = await User.findOne({ '_id': orderbookdata.from_userId })
        let checkUser1 = await User.findOne({ '_id': orderbookdata.to_userId })

        var pair=orderbookdata.firstCurrency+"-"+orderbookdata.secondCurrency
        
        let description="Your Trade has been closed - Id :"+orderbookdata.trade_id+" for the Pair : "+pair+" | Reason : Time Exceeded";
      
        let newNotification = new Notification({
            'description': description,
            'userId': checkUser._id,
            'type':"Trade",
            'category': "P2P Close Trade",
            
        });
       newNotification.save();
       let newNotification1 = new Notification({
        'description': description,
        'userId': checkUser1._id,
        'type':"Trade",
        'category': "P2P Close Trade",
        
      });
    newNotification1.save();
          return res.json({
            status: true,
            message: "Trade Closed Successfully.",
          });
        }
      });
   }
  }catch (err) {
    console.log("Error---",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



export const getMyP2PHistory=async(req,res)=>{
  try{
    console.log("Inside P@P get My transactions");
    var userID = req.body.curUser;
    var trans = req.body.transactiontype;
    var curr=req.body.currencytype;
   console.log("Reqqqqbody------",req.body);
    var filter_by = {};
    if (userID) {
      filter_by["from_userId"] = req.user.id;
    }
    if(trans){
      if(trans!=='all')
      filter_by["BuyorSell"] = trans;
    }
    if(curr){
      if(curr!=='all')
      filter_by["secondCurrency"] = curr;
    }
   // console.log("filter_byfilter_byfilter_byfilter_by",filter_by);
    P2POrderbook.find(filter_by).exec((err,result) => {
    if(result){
     // console.log("P2P Result---",result);
      return res.json({status: true,result: result});
    }
    else{
     // console.log("errerrerr",err)
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
    
  })
  }catch{
    console.log("errerrerr",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}
/** 
 * Get Transaction History
 * METHOD: POST
 * URL : /api/getTransactions
*/

export const getTransactionhistory=async(req,res)=>{
  try{
    // console.log("Inside get My transactions history");
     var trans = req.body.transactiontype;
     var curr=req.body.currencytype;
     Transaction.find({ userId: ObjectId("612e02735ad93e73e7f79471") }).populate('currencyId').exec((err,result) => {
     if(result){
       console.log("Result---",result);
       return res.json({status: true,result: result});
     }
     else{
       console.log("errerrerr",err)
       return res.status(500).json({ 'status': false, 'message': "Error occured" });
     }
     
   })
   }catch{
     console.log("errerrerr",err)
     return res.status(500).json({ 'status': false, 'message': "Error occured" });
   }
}
/** 
 * Post chat history
 * METHOD: POST
 * URL : /api/getChatDetails
*/
export const getChatDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.orderId) });
    var tradetable = await P2PTradeTable.findOne({
      _id: ObjectId(orderbookdata.trade_id),
    });
   

    var chatdata = await P2PChat.find({
      orderbookId: ObjectId(orderbookdata._id),
    });

    P2PChat.aggregate([
      { $match: { orderbookId: ObjectId(orderbookdata._id) } },
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
      {
        $sort: { _id: -1 },
      },
    ]).exec(function (err, response) {
      res.json({
        status: true,
        result: response,
      });
    });
  }catch (err) {
    console.log(err,"errerrerrerrerrerrerrerrerr");
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post chat history
 * METHOD: POST
 * URL : /api/saveChatDetails
 * 
 * 
*/
export const saveChatDetails_notwork = async (req, res) => {

  console.log('ASSSDFD')
  var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.senderid) });
  var TradeId = orderbookdata.trade_id;
  var reqBody = req.body;
    var userid = reqBody.userid;
const chatsave = new P2PChat({
 
  message: '1231313131',
  
});

await chatsave.save()

}


export const saveChatDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var userid = reqBody.userid;
    console.log("-----reqBody",reqBody)

    if (!userid || userid == undefined) {
      return res.json({
        status: false,
        message: "Please Login to Post a trade",
      });
    }
    if ((reqBody.msg == "" || reqBody.msg==undefined)&&(!req.file || req.file=="undefined")) {
      return res.status(400).json({
      status: false,
      message: "Please Enter Message or attachment",
    });
  }
    // if (reqBody.msg == ""||reqBody.msg == "undefined") {
    //   var msg=""
    // }else{
    //   var msg=reqBody.msg
    // }
    console.log(req.file,'-----req.file')
    if (!req.file || req.file=="undefined") {
      var attachment = "";
    } else {
      var attachment = req.file.filename;
    }


    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.senderid) });
    

    if (orderbookdata.status == 4) {
      return res.status(400).json({
        status: false,
        message: "Trade already completed",
      });
    }
    
    if (orderbookdata.status == 2) {
      return res.status(400).json({
        status: false,
        message: "Trade Already Cancelled",
      });
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
    var Sender_userId = ObjectId(reqBody.userid);
    var Receiver_userId = ObjectId(tradetable.userId);
    var message = reqBody.msg;
    var TradeId = orderbookdata.trade_id;
    var orderbookId = orderbookdata._id;

    const chatsave = new P2PChat({
      Sender_userId: Sender_userId,
      Receiver_userId: Receiver_userId,
      message: message,
      TradeId: TradeId,
      orderbookId: orderbookId,
      attachment: attachment,
    });

    chatsave.save().then(async (saved) => {
      if (saved) {
        // console.log("------id", reqBody.id);

        P2PChat.aggregate([
          { $match: { _id: ObjectId(saved._id) } },
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
                firstName: 1,
                email:1
              },
              senderdetails: {
                _id: 1,
                firstName: 1,
                email:1
              },
            },
          },
        ])
          .sort({ _id: -1 })
          .exec(function (err, response_chat) {
            socketEmitChat("p2pchat-" + reqBody.senderid, response_chat);
            // socketEmitAllWithAck(
            //   "p2pchat-" + reqBody.id,
            //   response_chat,
            // );
          });

        return res.json({
          status: true,
          message: "Message Sent Successfully",
        });
      }
    });

  }catch (err) {
    console.log("Error----",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}




/** 
 * Post confirm pay
 * METHOD: POST
 * URL : /api/confirmPay
*/
export const confirmPay = async (req, res) => {
  try {
    var reqBody = req.body;
    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.id) });

    if (orderbookdata.status == 1) {
      return res.status(400).json({
        status: false,
        message: "Payment Already Confirmed",
      });
    }
    if (orderbookdata.status == 2) {
      return res.status(400).json({
        status: false,
        message: "Trade Already Cancelled",
      });
    }
    if (orderbookdata.status == 5) {
      return res.status(400).json({
        status: false,
        message: "Time Exceeded So Trade Closed Already",
      });
    }
    if (orderbookdata.status == 3) {
      return res.status(400).json({
        status: false,
        message: "Trade Already Disputed",
      });
    }

    if (orderbookdata.status == 4) {
      return res.status(400).json({
        status: false,
        message: "Trade Already Completed",
      });
    }

    var tradetable = await P2PTradeTable.findOne({
      _id: ObjectId(orderbookdata.trade_id),
    });

    var Sender_userId = ObjectId(reqBody.userid);
    var Receiver_userId = ObjectId(tradetable.userId);
    var message = "Payment Confirmed";
    var TradeId = orderbookdata.trade_id;
    var orderbookId = orderbookdata._id;

    const chatsave = new P2PChat({
      Sender_userId: Sender_userId,
      Receiver_userId: Receiver_userId,
      message: message,
      TradeId: TradeId,
      orderbookId: orderbookId,
    });

    chatsave.save().then(async (saved) => {
      if (saved) {
        await P2POrderbook.findOneAndUpdate(
          {
            _id: ObjectId(orderbookdata._id),
          },
          {
            $set: {
              status: 1,
            },
          }
        );

        // sendp2pemail(orderbookdata, reqBody.userid, "p2p_confirm_pay");
        P2PChat.aggregate([
          { $match: { _id: ObjectId(saved._id) } },
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
                firstName: 1,
                email:1
              },
              senderdetails: {
                _id: 1,
                firstName: 1,
                email:1
              },
            },
          },
        ])
          .sort({ _id: -1 })
          .exec(function (err, response_chat) {
            socketEmitChat("p2pchat-" + reqBody.id, response_chat);
            // socketEmitAllWithAck(
            //   "p2pchat-" + reqBody.id,
            //   response_chat,
            // );
          });
        return res.json({
          status: true,
          message: "Payment Confirmed Successfully.",
        });
      }
    });
  }catch (err) {
    console.log("ssssssssssssssssssss",err);
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post release cryptocurrency
 * METHOD: POST
 * URL : /api/releaseCryptocurrency
*/
export const releaseCryptocurrency = async (req, res) => {
  try {
    var reqBody = req.body;
   
    let userId= reqBody.userid;
    let checkUser = await User.findOne({ '_id': userId })
  
    if (checkUser) {
      
          let check2Fa = node2fa.verifyToken(checkUser.google2Fa.secret, reqBody.twoFACode)
        
          if (!(check2Fa && check2Fa.delta == 0)) {
            return res.status(400).json({
              status: false,
              message: "Invalid TwoFA Code",
            });
          
      }else{
        var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.id) });
       
        if (orderbookdata.status == 0) {
          return res.status(400).json({
            status: false,
            message: "Payment not yet confirmed",
          });
        }
        if (orderbookdata.status == 2) {
          return res.status(400).json({
            status: false,
            message: "Trade Already Cancelled",
          });
        }
        if (orderbookdata.status == 5) {
          return res.status(400).json({
            status: false,
            message: "Time Exceeded So Trade Closed Already",
          });
        }
        if (orderbookdata.status == 3) {
          return res.status(400).json({
            status: false,
            message: "Trade Already Disputed",
          });
        }
        if (orderbookdata.status == 4) {
          return res.status(400).json({
            status: false,
            message: "Trade Already Completed",
          });
        }
        var tradetable = await P2PTradeTable.findOne({
          _id: ObjectId(orderbookdata.trade_id),
        });
       
      
        var Sender_userId = ObjectId(reqBody.userid);
        var Receiver_userId = ObjectId(tradetable.userId);
        var message = "Crypto Released to your wallet";
        var TradeId = orderbookdata.trade_id;
        var orderbookId = orderbookdata._id;
      
        const chatsave = new P2PChat({
          Sender_userId: Sender_userId,
          Receiver_userId: Receiver_userId,
          message: message,
          TradeId: TradeId,
          orderbookId: orderbookId,
        });
      
        chatsave.save().then(async (saved) => {
          if (saved) {
            // payment released to buyer
              
            var crypto_currency = tradetable.firstCurrency;
            var assets = await Assets.findOne({
              userId: ObjectId(orderbookdata.to_userId),
              currencySymbol: crypto_currency,
            });
            
            var current_cryptobalance = assets.p2pbalance;
            var crypto_amount = orderbookdata.crypto_amount;
            var new_cryptobalance = current_cryptobalance + crypto_amount;
            console.log("new_cryptobalance----",new_cryptobalance)
           
            await Assets.findOneAndUpdate(
              {
                _id: ObjectId(assets._id),
              },
              {
                $set: { p2pbalance: new_cryptobalance },
              },
              function (err, result) {
                if(err){
                  console.log("Asset update err----",err)
                }
                else
                console.log("asset update result---",result)
              }
            );
      
            // End payment released to buyer
             // p2p trade fee
           var trade_fee=Number(orderbookdata.crypto_amount)*(Number(orderbookdata.trade_fee_percentage)/100)
             var holding_balance = Number(orderbookdata.crypto_amount)+Number(trade_fee);
                   console.log("releasetrade_fee--",trade_fee);
                   console.log("holding_balance--",holding_balance);
                   console.log(" releaseorderbookdata.crypto_amount--",orderbookdata.crypto_amount);
                   console.log(" releaseorderbookdata.trade_fee_percentage--",orderbookdata.trade_fee_percentage);
                       
             Assets.findOneAndUpdate(
               {
                 userId: orderbookdata.from_userId,
                 currencySymbol: orderbookdata.firstCurrency,
               },
              
               { $inc: { p2pholdingbalance: -holding_balance } },
               { new: true },
               function (err, updateData) {
                 if (!err) {
                   console.log("trade fee deducted");
                 }else{
                  console.log("trade fee deducted err-r-------",err);
                 }
               }
             );
       
             // End p2p trade fee
      
            // Update trade Status
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

            await P2PTradeTable.findByIdAndUpdate({
              _id:ObjectId(TradeId),
            },
            {
              $set:{
                status:0,
              }
            }) 
          // if(tradetable.maxlimit!=0 && tradeTable.maxlimit<maxlimit_initial){
          //     await P2PTradeTable.findByIdAndUpdate({
          //       _id:ObjectId(TradeId),
          //     },
          //     {
          //       $set:{
          //         status:2,
          //       }
          //     })   
          //  }  
            
            if(tradetable.maxlimit==0){
              await P2PTradeTable.findByIdAndUpdate({
                _id:ObjectId(TradeId),
              },
              {
                $set:{
                  status:1,
                }
              })   
            }
            await User.update({ _id:  Sender_userId  }, {$inc:{p2pCompletedSellOrder:1}});
            await User.update({ _id: Receiver_userId  }, {$inc:{p2pCompletedBuyOrder: 1}});
            AdminRevenue(orderbookdata.trade_fee,checkUser.email,orderbookdata.crypto_amount,TradeId,orderbookdata.firstCurrency,'Crypto','P2p');
            
            let content = {
              'id': TradeId,
              'Date':new Date(),
              'Price':orderbookdata.price,
              'Type':orderbookdata.BuyorSell
            };
            mailTemplateLang({
              'userId': Sender_userId,
              'identifier': 'Trade_completed',
              'toEmail': checkUser.email,
              content
          })
        let checkUser1 = await User.findOne({ '_id': Receiver_userId })
        mailTemplateLang({
          'userId': Receiver_userId,
          'identifier': 'Trade_completed',
          'toEmail': checkUser1.email,
          content
      })

      P2PChat.aggregate([
        { $match: { _id: ObjectId(saved._id) } },
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
              firstName: 1,
              email:1
            },
            senderdetails: {
              _id: 1,
              firstName: 1,
              email:1
            },
          },
        },
      ])
        .sort({ _id: -1 })
        .exec(function (err, response_chat) {
          socketEmitChat("p2pchat-" +reqBody.id, response_chat);
          // socketEmitAllWithAck(
          //   "p2pchat-" + reqBody.id,
          //   response_chat,
          // );
        });

            // End
            return res.json({
              status: true,
              message: "Payment Released Successfully.",
            });
          }
        });
      }
  }
   
  }catch (err) {
    console.log("Error---------0====",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}

async function AdminRevenue(fee,email,amount,tradeId,currency,currency_type,type) {

  const Admin_Revenue_obj = new Admin_Revenue({
    fee: fee,
    email:email,   
    amount: amount,  
    trade_id:tradeId,
    currency: currency,
    currency_type: currency_type,
    type: type
  });
  console.log("Admin_Revenue_obj)-----------------",Admin_Revenue_obj)
  await Admin_Revenue_obj.save().then(async (saved) => {
    return;
  });
}

export const closeDateCrossed=async(req,res)=>{
  try{
  var reqBody = req.body;
       console.log("reqbody---",reqBody)
       var tradeData = await P2PTradeTable.find({postStartDate:{"$lt": new Date()},status:"0",userId:reqBody.userId})
    console.log("orderbookdataorderbookdata",tradeData);
    if(tradeData){
      tradeData.map((item,key)=>{
        console.log("Itemnow--------",item)
        if(item.BuyorSell=='Buy'){
      P2PTradeTable.findOneAndUpdate({"_id":ObjectId(item._id)}, {$set:{status:"3"}}, {new: true}, (err, doc) => {
          if (err) {
              console.log("Something wrong when updating data!",err);
          }
      });
      
        }
        if(item.BuyorSell=='Sell'){
          var refundbalance =
          Number(item.beforeBalance) - Number(item.afterBalance);
    
        var assets =Assets.findOne({
          userId: ObjectId(item.userId),
          currencySymbol: item.firstCurrency,
        });
    
        var current_cryptobalance = assets.p2pbalance;
        var crypto_amount = item.crypto_amount;
        var trade_fee = item.trade_fee;
        var refund_amount=crypto_amount + trade_fee
        var new_cryptobalance = current_cryptobalance + refund_amount;
        var holdingbalance=assets.p2pholdingbalance-refund_amount;
        Assets.findOneAndUpdate(
          {
            _id: ObjectId(assets._id),
          },
          {
            $set: { 
              p2pholdingbalance:holdingbalance,
              p2pbalance: new_cryptobalance },
          },
          function (err, result) {}
        );
    
    
    
         P2PTradeTable.findOneAndUpdate({"_id":ObjectId(item._id)}, {$set:{status:"3"}}, {new: true}, (err, doc) => {
          if (err) {
              console.log("Something wrong when updating data!",err);
          }
      });
      
        }
      })
    }
  }catch(err){
    console.log("err---",err)
  }
}


/** 
 * Post cancel trade
 * METHOD: POST
 * URL : /api/cancelTrade
*/
export const cancelTrade = async (req, res) => {
  try {
    var reqBody = req.body;
    console.log("Bodyyy---",req.body)
 var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.id) });
 console.log("orderbookdataorderbookdata",orderbookdata);

 // if (orderbookdata.status == 0) {
 //   return res.json({
 //     status: false,
 //     message: "Payment not yet confirmed",
 //   });
 // }

 if (orderbookdata.status == 1) {
   return res.status(400).json({
     status: false,
     message: "Already paid. if not paid please raise dispute",
   });
 }
 if (orderbookdata.status == 2) {
   return res.status(400).json({
     status: false,
     message: "Trade Already Cancelled",
   });
 }
 if (orderbookdata.status == 3) {
   return res.status(400).json({
     status: false,
     message: "Trade Already Disputed",
   });
 }
 if (orderbookdata.status == 5) {
   return res.status(400).json({
     status: false,
     message: "Time Exceeded So Trade Closed Already",
   });
 }
 if (orderbookdata.status == 4) {
   return res.status(400).json({
     status: false,
     message: "Trade Already Completed",
   });
 }

 var tradetable = await P2PTradeTable.findOne({
   _id: ObjectId(orderbookdata.trade_id),
 });

 var Sender_userId = ObjectId(reqBody.userid);
 var Receiver_userId = ObjectId(tradetable.userId);
 var message = "Trade Cancelled";
 var TradeId = orderbookdata.trade_id;
 var orderbookId = orderbookdata._id;

 const chatsave = new P2PChat({
   Sender_userId: Sender_userId,
   Receiver_userId: Receiver_userId,
   message: message,
   TradeId: TradeId,
   orderbookId: orderbookId,
 });

 chatsave.save().then(async (saved) => {
   console.log(tradetable,"tradetable")
  if (saved) {
     // Balance credited back to seller
     var crypto_currency = tradetable.firstCurrency;

     const assets = await Assets.findOne({
       userId: ObjectId(orderbookdata.from_userId),
       currencySymbol: crypto_currency,
     });
     var current_cryptobalance = assets.p2pbalance;
     var price=Number(orderbookdata.fiat_amount)/Number(orderbookdata.crypto_amount)
     console.log("Price---",price)
     console.log("orderbookdata.fiat_amount---",orderbookdata.fiat_amount)
     console.log("orderbookdata.crypto_amount---",orderbookdata.crypto_amount)

     //var crypto_amount = orderbookdata.crypto_amount;
     var crypto_amount=(orderbookdata.trade_fee+orderbookdata.fiat_amount)/price
     console.log("crypto_amount---",crypto_amount)

   //  var trade_fee = orderbookdata.trade_fee;
     var refund_amount=crypto_amount.toFixed(8);
     console.log("refund_amount---",refund_amount)

     // var new_cryptobalance = current_cryptobalance + refund_amount;
     // var holdingbalance=assets.p2pholdingbalance-refund_amount;
     // await Assets.findOneAndUpdate(
     //   {
     //     _id: ObjectId(assets._id),
     //   },
     //   {
     //     $set: { 
     //       p2pholdingbalance:holdingbalance,
     //       p2pbalance: new_cryptobalance },
     //   },
     //   function (err, result) {}
     // );
     // End

     // Update trade balance
// var refund=Number(orderbookdata.crypto_amount).toFixed(8)+trade_fee;
     var afterBalance =
       Number(tradetable.afterBalance) - refund_amount;
     var quantity=tradetable.quantity+orderbookdata.crypto_amount
     console.log("tradetable.quantity----",tradetable.quantity)
     console.log("orderbookdata.quantity----",orderbookdata.quantity)
     console.log("quantity----",quantity)
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
         _id: ObjectId(tradetable._id),
       },
       {
         $set: {
           afterBalance: afterBalance,
           maxlimit: currentmaxlimit,
           minlimit: currentminlimit,
           status: status,
           quantity:quantity,
         },
       },
       function (err, result) {}
     );

     // End Update trade balance

     // Update trade Status
     await P2POrderbook.findOneAndUpdate(
       {
         _id: ObjectId(orderbookdata._id),
       },
       {
         $set: {
           status: 2,
         },
       }
     );
     // End
     let checkUser = await User.findOne({ '_id': orderbookdata.from_userId })
     var pair=orderbookdata.firstCurrency+"-"+orderbookdata.secondCurrency
     let content = {
       'id': orderbookdata.trade_id,
       'FiatAmount':orderbookdata.fiat_amount,
       'CryptoAmount':orderbookdata.crypto_amount,
       'Pair':pair
     };
         mailTemplateLang({
           'userId': checkUser._id,
           'identifier': 'Trade_cancelled',
           'toEmail': checkUser.email,
           content
       })
       let checkUser1 = await User.findOne({ '_id': orderbookdata.to_userId })
       mailTemplateLang({
         'userId': checkUser1._id,
         'identifier': 'Trade_cancelled',
         'toEmail': checkUser1.email,
         content
     })
     let description="Your Trade with the Id :"+orderbookdata.trade_id+" Cancelled";
   
     let newNotification = new Notification({
         'description': description,
         'userId': checkUser._id,
         'type':"Trade",
         'category': "P2P Cancel Trade",
         
     });
    newNotification.save();
    let newNotification1 = new Notification({
     'description': description,
     'userId': checkUser1._id,
     'type':"Trade",
     'category': "P2P Cancel Trade",
     
 });
 P2PChat.aggregate([
  { $match: { _id: ObjectId(saved._id) } },
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
        firstName: 1,
        email:1
      },
      senderdetails: {
        _id: 1,
        firstName: 1,
        email:1
      },
    },
  },
])
  .sort({ _id: -1 })
  .exec(function (err, response_chat) {
    socketEmitChat("p2pchat-" + reqBody.id, response_chat);
    });
newNotification1.save();
     return res.json({
       status: true,
       message: "Trade Cancelled Successfully.",
     });
  }
 });
}catch (err) {
 return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}


/** 
 * Post cancel trade
 * METHOD: POST
 * URL : /api/disputeTrade
*/
export const disputeTrade = async (req, res) => {
  try {

    var reqBody = req.body;
    var orderbookdata = await P2POrderbook.findOne({ _id: ObjectId(reqBody.id) });

  if (orderbookdata.status == 0) {
    return res.status(400).json({
      status: false,
      message: "Payment not yet confirmed",
    });
  }

  if (orderbookdata.status == 2) {
    return res.status(400).json({
      status: false,
      message: "Trade Already Cancelled",
    });
  }
  if (orderbookdata.status == 3) {
    return res.status(400).json({
      status: false,
      message: "Trade Already Disputed",
    });
  }
  if (orderbookdata.status == 5) {
    return res.status(400).json({
      status: false,
      message: "Time Exceeded So Trade Closed Already",
    });
  }

  if (orderbookdata.status == 4) {
    return res.status(400).json({
      status: false,
      message: "Trade Already Completed",
    });
  }

  var tradetable = await P2PTradeTable.findOne({
    _id: ObjectId(orderbookdata.trade_id),
  });

  var Sender_userId = ObjectId(reqBody.userid);
  var Receiver_userId = ObjectId(tradetable.userId);
  var message = "Trade Disputed";
  var TradeId = orderbookdata.trade_id;
  var orderbookId = orderbookdata._id;

  const chatsave = new P2PChat({
    Sender_userId: Sender_userId,
    Receiver_userId: Receiver_userId,
    message: message,
    TradeId: TradeId,
    orderbookId: orderbookId,
  });

  if (orderbookdata.from_userId == reqBody.userid) {
    var raised_by = "Seller";
  } else {
    var raised_by = "Buyer";
  }
  const dispute = new P2PDispute({
    seller_id: orderbookdata.from_userId,
    buyer_id: orderbookdata.to_userId,
    raised_by: raised_by,
    TradeId: TradeId,
    orderbookId: orderbookId,
  });

  dispute.save().then(async (saved) => {

  });

  chatsave.save().then(async (saved) => {
    if (saved) {
      await P2POrderbook.findOneAndUpdate(
        {
          _id: ObjectId(orderbookdata._id),
        },
        {
          $set: {
            status: 3,
          },
        }
      );
      let checkUser = await User.findOne({ '_id': Sender_userId })
      var pair=orderbookdata.firstCurrency+"-"+orderbookdata.secondCurrency
      let content = {
        'id': orderbookdata.trade_id,
        'FiatAmount':orderbookdata.fiat_amount,
        'CryptoAmount':orderbookdata.crypto_amount,
        'Pair':pair
      };
      mailTemplateLang({
        'userId': Sender_userId,
        'identifier': 'Trade_disputed',
        'toEmail': checkUser.email,
        content
    })
    let checkUser1 = await User.findOne({ '_id': Receiver_userId })
    mailTemplateLang({
    'userId': Receiver_userId,
    'identifier': 'Trade_disputed',
    'toEmail': checkUser1.email,
    content
    })
        let description="Your Trade with the Id :"+orderbookdata.trade_id+" Disputed";

        let newNotification = new Notification({
          'description': description,
          'userId': Sender_userId,
          'type': "P2P Disputes",
          
      });
        newNotification.save();
        let newNotification1 = new Notification({
          'description': description,
          'userId': Receiver_userId,
          'type':"Trade",
          'category': "P2P Disputes",
          
        });
        newNotification1.save();
        P2PChat.aggregate([
          { $match: { _id: ObjectId(saved._id) } },
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
                firstName: 1,
                email:1
              },
              senderdetails: {
                _id: 1,
                firstName: 1,
                email:1
              },
            },
          },
        ])
          .sort({ _id: -1 })
          .exec(function (err, response_chat) {
            socketEmitChat("p2pchat-" + reqBody.id, response_chat);
            });
      return res.json({
        status: true,
        message: "Trade Disputed Successfully.",
      });
    }
  });
      

  }catch (err) {
    console.log(err,"errerrerrerrerrerr")
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}


/** 
 * Post trade details
 * METHOD: POST
 * URL : /api/getTradeDetails
*/
export const getTradeDetails = async (req, res) => {
  try {
    var reqBody = req.body;
    var user_Id = mongoose.Types.ObjectId(reqBody.userid);
    var status_ids = JSON.parse("[" + reqBody.type + "]");
    P2POrderbook.aggregate([
      {
        $match: {
          status: {
            $in: status_ids,
          },
          $or: [
            {
              from_userId: user_Id,
            },
            {
              to_userId: user_Id,
            },
          ],
        },
      },
  
      {
        $lookup: {
          from: "p2pfeedbacks",
          let: {
            id: "$_id",
            userId: { $literal: user_Id },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$orderbookId", "$$id"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "feedbacks",
        },
      },
  
      // {
      //   $lookup: {
      //     from: "p2pfeedbacks",
      //     localField: "_id",
      //     foreignField: "orderbookId",
      //     as: "feedbacks",
      //   },
      // },
  
      {
        $lookup: {
          from: "P2PTradeTable",
          localField: "trade_id",
          foreignField: "_id",
          as: "tradedata",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "from_userId",
          foreignField: "_id",
          as: "senderdetails",
        },
      },
      { $unwind: "$senderdetails" },
      {
        $lookup: {
          from: "users",
          localField: "to_userId",
          foreignField: "_id",
          as: "receiverdetails",
        },
      },
      { $unwind: "$receiverdetails" },
    
    ])
      .sort({ _id: -1 })
      .exec(function (err, response) {
        res.json({
          status: true,
          result: response,
        });
      });
  }catch (err) {
    console.log("errerrerrerrerr",err);
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}



/** 
 * Post Chat list history
 * METHOD: POST
 * URL : /api/getChatlisthistory
*/
export const getChatlisthistory = async (req, res) => {
  try {
    var reqBody = req.body;
    var user_Id = mongoose.Types.ObjectId(reqBody.userid);
    P2PChat.find({Receiver_userId:user_Id,readstatus:false}).then(chatdata=>{
      if(chatdata){
      //  console.log(chatdata,"chatdatachatdatachatdata");
        res.json({
          status: true,
          result: chatdata,
        });
      }else{
        res.json({
          status: false,
        });
      }
    })
  }catch (err) {
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
  }
}


/** 
 * Post cancel My ad
 * METHOD: POST
 * URL : /api/cancelMyad
*/
export const cancelMyad = async (req, res) => {
  try {
    console.log("Inside-------------",req.body);
     var userid = req.body.userId;
   var postadid = req.body.postId;
   var Tradedata = await P2PTradeTable.findOne({ _id: postadid});
   console.log("Tradedata----",Tradedata)
     
   // cancel ads remaining amount credited to seller wallet
   if (Tradedata.BuyorSell == "Sell") {
    
 
     var assets = await Assets.findOne({
       userId: req.body.userId,
       currencySymbol: Tradedata.firstCurrency,
     });
     var perprice=Tradedata.price/Tradedata.quantity;
     var current_cryptobalance = assets.p2pbalance;
     var crypto_amount = Tradedata.maxlimit_initial;
     var trade_fee = Tradedata.fee_amount;
     var refund_amount=(crypto_amount + trade_fee)/perprice
     var new_cryptobalance = current_cryptobalance + refund_amount;
     console.log("current_cryptobalance----",current_cryptobalance)
     console.log("crypto_amount----",crypto_amount)
     console.log("assets.p2pholdingbalance----",assets.p2pholdingbalance)
 
     var holdingbalance=assets.p2pholdingbalance-refund_amount;
     console.log("new_cryptobalance----",new_cryptobalance)
     console.log("holdingbalance----",holdingbalance)
     console.log("refund_amount----",refund_amount)
     console.log("crypto_amount----",crypto_amount)
     console.log("trade_fee----",trade_fee)
 
     await Assets.findOneAndUpdate(
       {
         _id: ObjectId(assets._id),
       },
       {
         $set: { 
           p2pholdingbalance:holdingbalance,
           p2pbalance: new_cryptobalance },
       },
       function (err, result) {}
     );
 
 
 
     // var new_cryptobalance = assets.p2pbalance + refundbalance;
     // var holdingbalance = assets.holdingbalance - refundbalance;
 
     // await Assets.findOneAndUpdate(
     //   {
     //     _id: ObjectId(assets._id),
     //   },
     //   {
     //     $set: {
     //       p2pbalance: new_cryptobalance,
     //       holdingbalance: holdingbalance,
     //     },
     //   }
     // );
   }
   // End cancel ads
 
   let update = {
     status: "3",
   };
   P2PTradeTable.findOneAndUpdate(
     {
       _id: postadid,
     },
     {
       $set: update,
     },
     function (err, result) {
       if (result) {
         var pairName = result.firstCurrency + result.secondCurrency;
         // const newactivity = new Myactivity({
         //   userId: req.body.userId,
         //   Category: "Cancel Ad",
         //   created_date: new Date(),
         //   message:
         //     "Cancelled " +
         //     pairName +
         //     " " +
         //     result.tradetype +
         //     "  Ad" +
         //     " Ad ID " +
         //     postadid,
         // });
 
         // newactivity.save();
 
 
 
 
 
         return res.json({
           status: true,
           message: "Trade Cancelled Succesfully",
         });
       } else {
         return res.json({
           status: false,
           message: "Unable to Cancel the Trade",
         });
       }
     }
   );
   }catch (err) {
     console.log("errerrerr",err);
     return res.status(500).json({ 'status': false, 'message': "Error occured" });
   }
}

let chatUpload = multer({
  storage: chatStorage,
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.DEFAULT_SIZE }
}).fields([
   { name: 'proofImage', maxCount: 1 },
 ])

 const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(file,'----file')
      cb(null, config.IMAGE.KYC_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    console.log(file,'----file1111')
      cb(null, 'file-' + Date.now() + path.extname(file.originalname));
  }
});

export const uploadChat = (req, res, next) => {
  console.log(req.files,'----file22222')
 chatUpload(req, res, function (err) {
  
      if (err instanceof multer.MulterError) {
          return res.status(400).json({ "success": false, 'errors':  "TOO_LARGE"  })
      }
      else if (err) {
          return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
      }
      return next();
  })
}


