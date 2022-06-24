// import package
import mongoose from 'mongoose';

// import models
import {
    SpotPair,
    SpotTrade,
    Assets,
    Admin
} from '../models';
import SiteSetting from '../models/sitesetting';
import SPotPair from '../models/spotpairs';
// import config
import config from '../config';
import { socketEmitOne, socketEmitAll } from '../config/socketIO';
// import controller
import * as binanceCtrl from './binance.controller'
// import lib
import isEmpty from '../lib/isEmpty';
import { encryptObject, decryptObject } from '../lib/cryptoJS';
import { paginationQuery } from '../lib/adminHelpers';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Trade Decrypt
 * BODY : token
*/
export const decryptTradeOrder = (req, res, next) => {
    try {
        let token = decryptObject(req.body.token)
        req.body = token;
        return next();
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "SOMETHING_WRONG" });
    }
}

export const getMarketTrend=async(req,res)=>{
try{
    let siteSettingData = await SiteSetting.findOne({}, { 'marketTrend': 1 })
     console.log("Site Data---",siteSettingData);
    let marketTrendData = await SPotPair.aggregate([
        { "$match": { "_id": { "$in": siteSettingData.marketTrend } } },
        {
            "$lookup": {
                "from": 'currency',
                "localField": "firstCurrencyId",
                "foreignField": "_id",
                "as": "firstCurrencyInfo"
            }
        },
        { "$unwind": "$firstCurrencyInfo" },
        {
            "$project": {
                "firstCurrencySymbol": 1,
                "secondCurrencySymbol": 1,
                'firstCurrencyName': "$firstCurrencyInfo.currencyName",
                "firstCurrencyImage": { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$firstCurrencyInfo.currencyImage"] },
                "markPrice": 1,
                "change": 1,
            }
        }
    ])
    console.log("Market Trend Data---",marketTrendData);
    return res.status(200).json({ 'success': true, 'messages': "success", 'result': marketTrendData })
}catch(err) {
    console.log("error----",err)
    return res.status(500).json({ 'status': false, 'message': "Error occured" });
}
}
/** 
 * Get Spot Trade Pair List
 * METHOD: GET
 * URL : /api/spot/tradePair
*/
export const getPairList = async (req, res) => {
    try {
      
       
        let spotPairData = await SpotPair.aggregate([
            { "$match": { "status": "active" } },
            {
                "$lookup":
                {
                    "from": 'currency',
                    "localField": "firstCurrencyId",
                    "foreignField": "_id",
                    "as": "firstCurrencyInfo"
                }
            },
            { "$unwind": "$firstCurrencyInfo" },

            {
                "$lookup":
                {
                    "from": 'currency',
                    "localField": "secondCurrencyId",
                    "foreignField": "_id",
                    "as": "secondCurrencyInfo"
                }
            },
            { "$unwind": "$secondCurrencyInfo" },

            {
                "$project": {
                    '_id': 1,
                    'firstCurrencyId': 1,
                    'firstCurrencySymbol': 1,
                    'firstCurrencyImage': {
                        "$cond": [
                            { "$eq": ['$firstCurrencyInfo.currencyimage', ''] },
                            "",
                            { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$firstCurrencyInfo.currencyimage"] }
                        ]
                    },
                    'secondCurrencyId': 1,
                    'secondCurrencySymbol': 1,
                    'secondCurrencyImage': {
                        "$cond": [
                            { "$eq": ['$secondCurrencyInfo.currencyimage', ''] },
                            "",
                            { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$secondCurrencyInfo.currencyimage"] }
                        ]
                    },
                    'firstFloatDigit': 1,
                    'secondFloatDigit': 1,
                    'botstatus': 1,

                    'last': 1,
                    'markPrice': 1,
                    'low': 1,
                    'high': 1,
                    'firstVolume': 1,
                    'secondVolume': 1,
                    'changePrice': 1,
                    'change': 1,
                }
            },

        ])
        return res.status(200).json({ 'success': true, 'messages': "success", 'result': spotPairData })
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}

/** 
 * Admin dashboard getTradevolume
 * METHOD: post
 * 
 * PARAMS: orderId
*/
export const getTradevolume=async(req,res)=>{
    console.log(req.body,'sdjkfhsdkfhskjdfhksjdhf')
    try{
    if(req.body.chartrange=='1w')
    {
        var _trGroup = {
            _id: {
                $week: '$orderDate'
                // year: {
                //     $year: "$orderDate",
                // },
                // month: {
                //     $month: "$orderDate",
                // },
                // day: {
                //     $add: [
                //         {
                //             $subtract: [
                //                 { $week: "$orderDate" },
                //                 { $mod: [{ $week: "$orderDate" }] },
                //             ],
                //         },
                //     ],
                //     // $dayOfMonth: "$orderDate",
                // },
                // hour: { $hour: "$orderDate" },
                // minute: {
                //     $add: [
                //         {
                //             $subtract: [
                //                 { $minute: "$orderDate" },
                //                 { $mod: [{ $minute: "$orderDate" }, +1440] },
                //             ],
                //         },
                //         +1440,
                //     ],
                // },
            },
            Date: { $first: "$orderDate" },
            pair: { $first: "$pairName" },
            buyvolume: { $sum: "$filledQuantity" },
            sellvolume: { $sum: "$orderValue" },
    
        };
    }
    
    if(req.body.chartrange=='1M')
    {
        var _trGroup = {
            _id: {
                $month: '$orderDate'
                // year: {
                //     $year: "$orderDate",
                // },
                // month: {
                //     $month: "$orderDate",
                // },
                // day: {
                //     $add: [
                //         {
                //             $subtract: [
                //                 { $week: "$orderDate" },
                //                 { $mod: [{ $week: "$orderDate" }] },
                //             ],
                //         },
                //     ],
                //     // $dayOfMonth: "$orderDate",
                // },
                // hour: { $hour: "$orderDate" },
                // minute: {
                //     $add: [
                //         {
                //             $subtract: [
                //                 { $minute: "$orderDate" },
                //                 { $mod: [{ $minute: "$orderDate" }, +1440] },
                //             ],
                //         },
                //         +1440,
                //     ],
                // },
            },
            Date: { $first: "$orderDate" },
            pair: { $first: "$pairName" },
            buyvolume: { $sum: "$filledQuantity" },
            sellvolume: { $sum: "$orderValue" },
    
        };
    }
    
    
    let chartDoc = await SpotTrade.aggregate([
        {
            "$match": {
                // "orderDate":{$lt: firstday,
                //     $gt: lastday},
                "pairName": req.body.chartpair,
                'status': 'completed',
            }
        },
        {
            $group: _trGroup,
        },
        {
            $sort: {
                Date: 1,
            },
        },
    ]);
    console.log(chartDoc,'chartDoc')
    if(chartDoc){
        return res.json({status: true,result: chartDoc});
    }
    else{
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
    }catch(e){
        console.log(e,'eroorlkjlkjfldskjflksjdf')
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
  }

/** 
 * Spot Trade History
 * METHOD: post
 * 
 * PARAMS: orderId
*/
export const getMySpotHistory=async(req,res)=>{
    try{
      var userID = req.body.curUser;
      var trans = req.body.transactiontype;
      var curr=req.body.currencytype;
     
      var filter_by = {};
      if (userID) {
        filter_by["userId"] = req.user.id;
      }
      
      if(curr){
          if(curr!='all')
        filter_by["pairName"] = curr;
      }
      SpotTrade.find(filter_by).sort({"orderDate":-1}).then((result,err) => {
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


  export const getFilledOrderHistory=async(req,res)=>{
    try{
      var userID = req.body.curUser;
      var trans = req.body.transactiontype;
      var curr=req.body.currencytype;
      console.log("ReqBody-----",req.body);
      var filter_by = {};
      if (userID) {
        filter_by["userId"] = req.user.id;
      }
      if(trans){
          if(trans!='all')
        filter_by["orderType"] = trans;
      }
      if(curr){
          if(curr!='all')
        filter_by["pairName"] = curr;
      }
      filter_by["status"] = "completed";
      console.log("filternow---",filter_by)
      SpotTrade.find(filter_by).sort({"orderDate":-1}).then((result,err) => {
      if(result){
          console.log("Result spothistory---",result);
        return res.json({status: true,result: result});
      }
      else{
          console.log("Error Spottrade History===",err);
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
      }
      
    })
    }catch{
      return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
  }
/** 
 * Cancel Order
 * METHOD: Delete
 * URL : /api/spot/cancelOrder/:{{orderId}}
 * PARAMS: orderId
*/
export const cancelOrder = async (req, res) => {
    try {
        let orderData = await SpotTrade.findOne({ '_id': req.params.orderId, 'userId': req.user.id });
        if (!orderData) {
            return res.status(400).json({ 'status': false, 'message': "NO_ORDER" });
        }

        if (['open', 'pending', 'conditional'].includes(orderData.status)) {
            let remainingQuantity = orderData.quantity - orderData.filledQuantity;
            let currencyId = orderData.buyorsell == 'buy' ? orderData.secondCurrencyId : orderData.firstCurrencyId;
            let orderValue = (orderData.buyorsell == 'buy') ? orderData.price * remainingQuantity : remainingQuantity;
            assetUpdate({
                currencyId,
                userId: orderData.userId,
                balance: orderValue
            })

            getOpenOrderSocket(orderData.userId, orderData.pairId)
            getOrderBookSocket(orderData.pairId)
            getTradeHistorySocket(orderData.userId, orderData.pairId)

            orderData.status = 'cancel';
            await orderData.save();

            return res.status(200).json({ 'status': true, 'message': "ORDER_CANCEL" });
        } else if (orderData.status == 'completed') {
            return res.status(400).json({ 'status': false, 'message': "ORDER_ALREADY_COMPLETED" });
        } else if (orderData.status == 'cancel') {
            return res.status(400).json({ 'status': false, 'message': "ORDER_ALREADY_CANCEL" });
        }
        return res.status(400).json({ 'status': false, 'message': "SOMETHING_WRONG" });
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}


/**
 * METHOD : POST
 * URL : /api/spotOrder
 * BODY : newdate, spotPairId, stopPrice, price, quantity, buyorsell, orderType(limit,market,stopLimit,oco), limitPrice
*/
export const orderPlace = async (req, res) => {
    console.log("test ***********************",req.body);
    try {
       
        let
            reqBody = req.body,
            currentDate = new Date(),
            reqdate = new Date(reqBody.newdate),
            anotherdate = currentDate.getTime() + (1000 * 5),
            indate = new Date(anotherdate);
            
        //      let minmark=markprice*25/100;
        
        if (indate > reqdate) {
            if (reqBody.orderType == 'limit') {
                limitOrderPlace(req, res)
            } else if (reqBody.orderType == 'market') {
                marketOrderPlace(req, res)
            } else if (reqBody.orderType == 'stop_limit') {
                stopLimitOrderPlace(req, res)
            } else if (reqBody.orderType == 'stop_market') {
                stopMarketOrderPlace(req, res)
            }
        } else {
            return res.status(400).json({ 'status': false, 'message': "Error occured For the Interval_orderPlace" });
        }
    } catch (err) {
        console.log("Err---",err)
        return res.status(400).json({ 'status': false, 'message': "Error occured For the Interval_orderPlace_err" });
    }
}

/**
 * Limit order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : newdate, spotPairId, stopPrice, price, quantity, buyorsell, orderType(limit,market,stopLimit,oco), limitPrice
*/
export const limitOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
       
        reqBody.price = parseFloat(reqBody.price)
        reqBody.quantity = parseFloat(reqBody.quantity)
        let  markprice =req.body.markPrice;
        // let pricepercent=(markprice*25)/100;
        // let minprice=markprice-pricepercent;
        // let maxprice=markprice+pricepercent;
        // console.log("--Min Price",minprice);
        // console.log("--Max Price",maxprice);
        
        let spotPairData = await SpotPair.findOne({ "_id": reqBody.spotPairId });
        console.log('spotPairData========',spotPairData)
        if (!spotPairData) {
            return res.status(400).json({ 'status': false, 'message': "Invalid Pair" });
        }

        // if (reqBody.price < 0.00000001) {
        //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
        // }
        else if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
            return res.json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + spotPairData.minQuantity });
        }
        else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
            return res.json({ 'status': false, 'message': "Quantity of contract must not be higher than " + spotPairData.maxQuantity, });
        }
        var minamount =
        parseFloat(spotPairData.markPrice) -
        (parseFloat(spotPairData.markPrice) *
          parseFloat(spotPairData.minPricePercentage)) /
        100;
  
      var maxamount =
        parseFloat(spotPairData.markPrice) +
        (parseFloat(spotPairData.markPrice) *
          parseFloat(spotPairData.maxPricePercentage)) /
        100;
  
      if (reqBody.price < minamount) {
        return res.json({
          status: false,
          message: "Price should be above " + minamount.toFixed(4),
        });
      }
  
      if (reqBody.price > maxamount) {
        return res.json({
          status: false,
          message: "Price should be below " + maxamount.toFixed(4),
        });
      }

        let currencyId = reqBody.buyorsell == 'buy' ? spotPairData.secondCurrencyId : spotPairData.firstCurrencyId;
        console.log("---currencyid:  ",currencyId)
        console.log("---userId:  ",req.user.id)

        let userAssetsData = await Assets.findOne({ "userId": req.user.id, 'currency': currencyId })
        if (!userAssetsData) {
            return res.status(500).json({ 'status': false, 'message': "Error occured" });
        }

        let
            balance = parseFloat(userAssetsData.spotwallet),
            orderValue = 
            (reqBody.buyorsell == 'buy') ? 
            reqBody.price * reqBody.quantity : reqBody.quantity;

        // if (balance < orderValue && reqBody.price>minprice && reqBody.price<maxprice) {
        //     console.log("tesesese---------")
        //     return res.status(400).json({ 'status': false, 'message': "Due to insuffient balance order cannot be placed" });
        // }
        // if ( reqBody.price <minprice ||  reqBody.price>maxprice) {
        //     var resultmsg="Price should be within the limit "+minprice+"-"+maxprice+"";
        //     return res.status(400).json({ 'status': false, 'message':resultmsg });
        // }

        if (balance < orderValue) {
            return res.status(400).json({
              status: false,
              message: "Due to insuffient balance order cannot be placed",
            });
          }
        userAssetsData.spotwallet = balance - orderValue;
        let updateUserAsset = await userAssetsData.save();

        socketEmitOne('updateTradeAsset', {
            '_id': updateUserAsset._id,
            'spotwallet': updateUserAsset.spotwallet,
            'derivativeWallet': updateUserAsset.derivativeWallet,
        }, req.user.id)

        const newSpotTrade = new SpotTrade({
            userId: req.user.id,
            pairId: spotPairData._id,
            firstCurrencyId: spotPairData.firstCurrencyId,
            firstCurrency: spotPairData.firstCurrencySymbol,
            secondCurrencyId: spotPairData.secondCurrencyId,
            secondCurrency: spotPairData.secondCurrencySymbol,
            quantity: reqBody.quantity,
            price: reqBody.price,
            orderValue: orderValue,
            pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
            beforeBalance: balance,
            afterBalance: updateUserAsset.spotwallet,
            orderType: reqBody.orderType,
            orderDate: new Date(),
            buyorsell: reqBody.buyorsell,
            status: 'open',
        });

        let newOrder = await newSpotTrade.save();
        getOpenOrderSocket(newOrder.userId, newOrder.pairId)
        if (spotPairData.botstatus == 'off') {
        getOrderBookSocket(newOrder.pairId)
        }
        tradeList(newOrder, spotPairData)
        return res.status(200).json({ 'status': true, 'message': "Your order placed successfully." });

    } catch (err) {
        console.log("Error report----",err);
        return res.status(400).json({ 'status': false, 'message': "Limit order match error" });
    }
}


/**
 * Market order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, quantity, buyorsell, orderType(market)
 */
export const marketOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.quantity = parseFloat(reqBody.quantity);

        let spotPairData = await SpotPair.findOne({ _id: reqBody.spotPairId });

        if (!spotPairData) {
            return res.status(400).json({status:false, message:"Invalid Pair" });
        }

        let currencyId = reqBody.buyorsell == "buy" ? spotPairData.secondCurrencyId:spotPairData.firstCurrencyId;

        let userAssetsData = await Assets.findOne({userId:req.user.id, currency:currencyId});
        if (!userAssetsData) {
            return res.status(400).json({ status: false, message: "Error occured" });
        }

        let spotOrder = await SpotTrade.aggregate([{
            $match: {
                pairId: ObjectId(reqBody.spotPairId),
                userId: { $ne: ObjectId(req.user.id) },
                status: { $in: ["open", "pending"] },
                buyorsell: reqBody.buyorsell == "buy" ? "sell" : "buy",
            },
        },
        {
            $facet: {
                orderList: [{
                    $sort: {price: reqBody.buyorsell == "buy" ? 1 : -1},
                },
                { 
                    $limit: 100 
                }],
                orderBook: [{
                    $group: {
                        _id: "$price",
                        quantity: { $sum: "$quantity" },
                        filledQuantity: { $sum: "$filledQuantity" },
                    },
                },
                { $sort: { _id: reqBody.buyorsell == "buy" ? 1 : -1 } },
                { $limit: 100 }],
            },
        }]);

        if ((spotOrder && spotOrder.length == 0) || (spotOrder[0].orderBook && spotOrder[0].orderBook.length == 0)) {
            return res.status(400).json({ status: false, message: "NO_ORDER" });
        }

        let orderBookQuantity = 0,
            orderBookPrice = 0;
        if (reqBody.buyorsell == "buy") {
            for (const key in spotOrder[0].orderBook) {
                let item = spotOrder[0].orderBook[key];
                orderBookQuantity = orderBookQuantity + (item.quantity - item.filledQuantity);

                if (orderBookQuantity >= reqBody.quantity) {
                    orderBookPrice = item._id;
                    break;
                } else if (key == spotOrder[0].orderBook.length - 1) {
                    orderBookPrice = item._id;
                }
            }
        }

        let balance = parseFloat(userAssetsData.spotwallet),
            orderValue = reqBody.buyorsell == "buy" ? orderBookPrice * reqBody.quantity:reqBody.quantity;

        if (balance < orderValue) {
            return res.status(400).json({ status: false, message: "INSUFFIENT_BALANCE" });
        }

        userAssetsData.spotwallet = balance - orderValue;
        let updateUserAsset = await userAssetsData.save();

        socketEmitOne("updateTradeAsset", {
            _id: updateUserAsset._id,
            spotwallet: updateUserAsset.spotwallet,
            derivativeWallet: updateUserAsset.derivativeWallet,
        },req.user.id);

        // let newOrder = await newSpotTrade.save();

        let newOrderData = {
            _id: ObjectId(),
            userId: req.user.id,
            pairId: spotPairData._id,
            firstCurrencyId: spotPairData.firstCurrencyId,
            firstCurrency: spotPairData.firstCurrencySymbol,
            secondCurrencyId: spotPairData.secondCurrencyId,
            secondCurrency: spotPairData.secondCurrencySymbol,
            // price: reqBody.price,
            // orderValue: orderValue,

            quantity: reqBody.quantity,
            filledQuantity: 0,
            pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
            beforeBalance: balance,
            afterBalance: updateUserAsset.spotwallet,
            orderType: reqBody.orderType,
            orderDate: new Date(),
            buyorsell: reqBody.buyorsell,
            status: "open",
        };

        let matchStatus = await marketTradeMatch(newOrderData,spotOrder[0].orderList,0,spotPairData);
        if (!matchStatus) {
            return res.status(400).json({ status: false, message: "Market order match error" });
        }

        return res.status(200).json({ status: true, message: "Your order placed successfully." });
        return;
    } catch (err) {
        return res.status(400).json({ status: false, message: "Market order match error" });
    }
};

export const marketTradeMatch = async (newOrder, orderData, count = 0, pairData) => {
    try {
        if (!["open", "pending"].includes(newOrder.status)) {
            return true;
        } else if (isEmpty(orderData[count])) {
            let updateNewOrder = {};
            if (newOrder.filledQuantity > 0) {
                updateNewOrder["status"] = "completed";
            }
            updateNewOrder["quantity"] = newOrder.filledQuantity;

            let newOrderUpdate = await SpotTrade.findOneAndUpdate({_id:newOrder._id},updateNewOrder,{new:true,upsert:true});

            // Balance Retrieve
            if(newOrder.buyorsell == "sell") {
                var retrieve = newOrder.quantity-newOrder.filledQuantity;
            } else {
                var retrieve = newOrder.price*(newOrder.quantity-newOrder.filledQuantity);
            }

            await assetUpdate({
                currencyId: newOrder.buyorsell == "sell" ? newOrder.firstCurrencyId:newOrder.secondCurrencyId,
                userId: newOrder.userId,
                balance: retrieve
            });

            // await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
            await getOpenOrderSocket(newOrder.userId,newOrder.pairId);
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId);
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId);
            await getOrderBookSocket(pairData._id);
            return true;
        }

        let uniqueId = Math.floor(Math.random() * 1000000000);

        let newOrderQuantity = newOrder.quantity - newOrder.filledQuantity;
        let orderDataQuantity = orderData[count].quantity - orderData[count].filledQuantity;

        if (newOrderQuantity == orderDataQuantity) {
            /* New Order */
            let updateNewOrder = {};
            if (count == 0) {
                updateNewOrder = newOrder;
                updateNewOrder["price"] = orderData[count].price;
                updateNewOrder["orderValue"] = orderData[count].price * newOrderQuantity;
            }

            updateNewOrder["status"] = "completed";
            updateNewOrder["filledQuantity"] = newOrder.filledQuantity + newOrderQuantity;
            updateNewOrder["$push"] = {
                filled: {
                    pairId: newOrder.pairId,
                    sellUserId: newOrder.buyorsell == "sell" ? newOrder.userId:orderData[count].userId,
                    buyUserId: newOrder.buyorsell == "buy" ? newOrder.userId:orderData[count].userId,
                    userId: newOrder.userId,
                    sellOrderId: newOrder.buyorsell == "sell" ? newOrder._id:orderData[count]._id,
                    buyOrderId: newOrder.buyorsell == "buy" ? newOrder._id:orderData[count]._id,
                    uniqueId: uniqueId,
                    price: orderData[count].price,
                    filledQuantity: newOrderQuantity,
                    Fees: (newOrderQuantity * pairData.taker_fees) / 100,
                    status: "filled",
                    Type: newOrder.buyorsell,
                    orderValue: orderData[count].price * newOrderQuantity,
                },
            };

            await SpotTrade.findOneAndUpdate({_id:newOrder._id},updateNewOrder,{new:true,upsert:true});

            await assetUpdate({
                currencyId: newOrder.buyorsell == "sell" ? newOrder.secondCurrencyId:newOrder.firstCurrencyId,
                userId: newOrder.userId,
                balance: withoutServiceFee({
                    price: newOrder.buyorsell == "sell" ? orderData[count].price * newOrderQuantity:newOrderQuantity,
                    serviceFee: pairData.taker_fees,
                }),
            });

            await getOpenOrderSocket(newOrder.userId,newOrder.pairId);
            // await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId);
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

            /* Order Book */
            await SpotTrade.findOneAndUpdate({
                _id: orderData[count]._id,
            },
            {
                status: "completed",
                filledQuantity: orderData[count].filledQuantity + orderDataQuantity,
                $push: {
                    filled: {
                        pairId: orderData[count].pairId,
                        sellUserId: orderData[count].buyorsell == "sell" ? orderData[count].userId:newOrder.userId,
                        buyUserId: orderData[count].buyorsell == "buy" ? orderData[count].userId:newOrder.userId,
                        userId: orderData[count].userId,
                        sellOrderId: orderData[count].buyorsell == "sell" ? orderData[count]._id:newOrder._id,
                        buyOrderId: orderData[count].buyorsell == "buy" ? orderData[count]._id:newOrder._id,
                        uniqueId: uniqueId,
                        price: orderData[count].price,
                        filledQuantity: orderDataQuantity,
                        Fees: (orderDataQuantity * pairData.maker_rebate) / 100,
                        status: "filled",
                        Type: orderData[count].buyorsell,
                        orderValue: orderData[count].price * orderDataQuantity,
                    },
                },
            });

            await assetUpdate({
                currencyId: orderData[count].buyorsell == "sell" ? orderData[count].secondCurrencyId:orderData[count].firstCurrencyId,
                userId: orderData[count].userId,
                balance: withoutServiceFee({
                    price: orderData[count].buyorsell == "sell" ? orderData[count].price * orderDataQuantity:orderDataQuantity,
                    serviceFee: pairData.maker_rebate,
                }),
            });

            await getOpenOrderSocket(orderData[count].userId,orderData[count].pairId);
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId);
            // await getOrderHistorySocket(orderData[count].userId,orderData[count].pairId);
            await getTradeHistorySocket(orderData[count].userId,orderData[count].pairId);

            await getOrderBookSocket(pairData._id);
            await marketPriceSocket(pairData._id);
            await recentTradeSocket(pairData._id);

            return true;
        } else if (newOrderQuantity < orderDataQuantity) {
            /* New Order */
            let updateNewOrder = {};
            if (count == 0) {
                updateNewOrder = newOrder;
                updateNewOrder["price"] = orderData[count].price;
                updateNewOrder["orderValue"] = orderData[count].price * newOrderQuantity;
            }

            updateNewOrder["status"] = "completed";
            updateNewOrder["filledQuantity"] = newOrder.filledQuantity + newOrderQuantity;
            updateNewOrder["$push"] = {
                filled: {
                    pairId: newOrder.pairId,
                    sellUserId: newOrder.buyorsell == "sell" ? newOrder.userId:orderData[count].userId,
                    buyUserId: newOrder.buyorsell == "buy" ? newOrder.userId:orderData[count].userId,
                    userId: newOrder.userId,
                    sellOrderId: newOrder.buyorsell == "sell" ? newOrder._id:orderData[count]._id,
                    buyOrderId: newOrder.buyorsell == "buy" ? newOrder._id:orderData[count]._id,
                    uniqueId: uniqueId,
                    price: orderData[count].price,
                    filledQuantity: newOrderQuantity,
                    Fees: (newOrderQuantity * pairData.taker_fees) / 100,
                    status: "filled",
                    Type: newOrder.buyorsell,
                    orderValue: orderData[count].price * newOrderQuantity,
                },
            };

            await SpotTrade.findOneAndUpdate({_id:newOrder._id},updateNewOrder,{new:true,upsert:true});

            await assetUpdate({
                currencyId: newOrder.buyorsell == "sell" ? newOrder.secondCurrencyId:newOrder.firstCurrencyId,
                userId: newOrder.userId,
                balance: withoutServiceFee({
                    price: newOrder.buyorsell == "sell" ? orderData[count].price * newOrderQuantity: newOrderQuantity,
                    serviceFee: pairData.taker_fees,
                }),
            });

            await getOpenOrderSocket(newOrder.userId,newOrder.pairId);
            // await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId);
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

            /* Order Book */
            await SpotTrade.findOneAndUpdate({
                _id: orderData[count]._id,
            },
            {
                status: "pending",
                    // 'status': 'completed',
                filledQuantity: orderData[count].filledQuantity + newOrderQuantity,
                $push: {
                    filled: {
                        pairId: orderData[count].pairId,
                        sellUserId: orderData[count].buyorsell == "sell" ? orderData[count].userId:newOrder.userId,
                        buyUserId: orderData[count].buyorsell == "buy" ? orderData[count].userId:newOrder.userId,
                        userId: orderData[count].userId,
                        sellOrderId: orderData[count].buyorsell == "sell" ? orderData[count]._id:newOrder._id,
                        buyOrderId: orderData[count].buyorsell == "buy" ? orderData[count]._id:newOrder._id,
                        uniqueId: uniqueId,
                        price: orderData[count].price,
                        filledQuantity: newOrderQuantity,
                        Fees: (newOrderQuantity * pairData.maker_rebate) / 100,
                        status: "filled",
                        Type: orderData[count].buyorsell,
                        orderValue: orderData[count].price * newOrderQuantity,
                    },
                },
            });

            await assetUpdate({
                currencyId: orderData[count].buyorsell == "sell" ? orderData[count].secondCurrencyId:orderData[count].firstCurrencyId,
                userId: orderData[count].userId,
                balance: withoutServiceFee({
                    price: orderData[count].buyorsell == "sell" ? orderData[count].price * newOrderQuantity:newOrderQuantity,
                    serviceFee: pairData.maker_rebate,
                }),
            });

            await getOpenOrderSocket(orderData[count].userId,orderData[count].pairId);
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId);
            // await getOrderHistorySocket(orderData[count].userId,orderData[count].pairId);
            await getTradeHistorySocket(orderData[count].userId,orderData[count].pairId);

            await getOrderBookSocket(pairData._id);
            await marketPriceSocket(pairData._id);
            await recentTradeSocket(pairData._id);

            return true;
        } else if (newOrderQuantity > orderDataQuantity) {
            /* New Order */
            let updateNewOrder = {};
            if (count == 0) {
                updateNewOrder = newOrder;
                updateNewOrder["price"] = orderData[count].price;
                updateNewOrder["orderValue"] = orderData[count].price * orderDataQuantity;
            }

            updateNewOrder["status"] = "pending";
            updateNewOrder["filledQuantity"] = newOrder.filledQuantity + orderDataQuantity;
            updateNewOrder["$push"] = {
                filled: {
                    pairId: newOrder.pairId,
                    sellUserId: newOrder.buyorsell == "sell" ? newOrder.userId:orderData[count].userId,
                    buyUserId: newOrder.buyorsell == "buy" ? newOrder.userId:orderData[count].userId,
                    userId: newOrder.userId,
                    sellOrderId: newOrder.buyorsell == "sell" ? newOrder._id:orderData[count]._id,
                    buyOrderId: newOrder.buyorsell == "buy" ? newOrder._id:orderData[count]._id,
                    uniqueId: uniqueId,
                    price: orderData[count].price,
                    filledQuantity: orderDataQuantity,
                    Fees: (orderDataQuantity * pairData.taker_fees) / 100,
                    status: "filled",
                    Type: newOrder.buyorsell,
                    orderValue: orderData[count].price * orderDataQuantity,
                }
            };

            let newOrderUpdate = await SpotTrade.findOneAndUpdate({_id:newOrder._id},updateNewOrder,{new:true, upsert:true});

            await assetUpdate({
                currencyId: newOrder.buyorsell == "sell" ? newOrder.secondCurrencyId:newOrder.firstCurrencyId,
                userId: newOrder.userId,
                balance: withoutServiceFee({
                    price: newOrder.buyorsell == "sell" ? orderData[count].price * orderDataQuantity: orderDataQuantity,
                    serviceFee: pairData.taker_fees,
                }),
            });

            await getOpenOrderSocket(newOrder.userId, newOrder.pairId);
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId);
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

            /* Order Book */
            await SpotTrade.findOneAndUpdate({
                _id:orderData[count]._id
            },
            {
                status: "completed",
                filledQuantity: orderData[count].filledQuantity + orderDataQuantity,
                $push: {
                    filled: {
                        pairId: orderData[count].pairId,
                        sellUserId: orderData[count].buyorsell == "sell" ? orderData[count].userId:newOrder.userId,
                        buyUserId: orderData[count].buyorsell == "buy" ? orderData[count].userId:newOrder.userId,
                        userId: orderData[count].userId,
                        sellOrderId: orderData[count].buyorsell == "sell" ? orderData[count]._id:newOrder._id,
                        buyOrderId: orderData[count].buyorsell == "buy" ? orderData[count]._id:newOrder._id,
                        uniqueId: uniqueId,
                        price: orderData[count].price,
                        filledQuantity: orderDataQuantity,
                        Fees: (orderDataQuantity * pairData.maker_rebate) / 100,
                        status: "filled",
                        Type: orderData[count].buyorsell,
                        orderValue: orderData[count].price * orderDataQuantity,
                    },
                },
            });

            await assetUpdate({
                currencyId: orderData[count].buyorsell == "sell" ? orderData[count].secondCurrencyId:orderData[count].firstCurrencyId,
                userId: orderData[count].userId,
                balance: withoutServiceFee({
                    price: orderData[count].buyorsell == "sell" ? orderData[count].price * orderDataQuantity:orderDataQuantity,
                    serviceFee: pairData.maker_rebate,
                }),
            });

            await getOpenOrderSocket(orderData[count].userId,orderData[count].pairId);
            // await getOrderHistorySocket(orderData[count].userId,orderData[count].pairId);
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId);
            await getTradeHistorySocket(orderData[count].userId,orderData[count].pairId);

            await getOrderBookSocket(pairData._id);
            await marketPriceSocket(pairData._id);
            await recentTradeSocket(pairData._id);

            return await marketTradeMatch(newOrderUpdate,orderData,(count = count + 1),pairData);
        }
    } catch (err) {
        console.log(err);
        return false;
    }
};

/**
 * Stop Limit order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, stopPrice, price, quantity, buyorsell, orderType(stop_limit)
 */
export const stopLimitOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.stopPrice = parseFloat(reqBody.stopPrice);
        reqBody.price = parseFloat(reqBody.price);
        reqBody.quantity = parseFloat(reqBody.quantity);

        let spotPairData = await SpotPair.findOne({ _id: reqBody.spotPairId });

        if (!spotPairData) {
            return res
                .status(400)
                .json({ status: false, message: "Invalid Pair" });
        }

        // if (reqBody.price < 0.00000001) {
        //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
        // }
        // else if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
        //     return res.json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + spotPairData.minQuantity });
        // }
        // else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
        //     return res.json({ 'status': false, 'message': "Quantity of contract must not be higher than " + spotPairData.maxQuantity, });
        // }

        let currencyId =
            reqBody.buyorsell == "buy"
                ? spotPairData.secondCurrencyId
                : spotPairData.firstCurrencyId;

        let userAssetsData = await Assets.findOne({
            userId: req.user.id,
            currency: currencyId,
        });
        if (!userAssetsData) {
            return res
                .status(500)
                .json({ status: false, message: "Error occured" });
        }

        let balance = parseFloat(userAssetsData.spotwallet),
            orderValue =
                reqBody.buyorsell == "buy"
                    ? reqBody.price * reqBody.quantity
                    : reqBody.quantity;

        if (balance < orderValue) {
            return res
                .status(400)
                .json({
                    status: false,
                    message: "Due to insuffient balance order cannot be placed",
                });
        }

        userAssetsData.spotwallet = balance - orderValue;
        let updateUserAsset = await userAssetsData.save();
        socketEmitOne(
            "updateTradeAsset",
            {
                _id: updateUserAsset._id,
                spotwallet: updateUserAsset.spotwallet,
                derivativeWallet: updateUserAsset.derivativeWallet,
            },
            req.user.id
        );

        let conditionalType = "equal";
        if (spotPairData.markPrice < reqBody.stopPrice) {
            conditionalType = "greater_than";
        } else if (spotPairData.markPrice > reqBody.stopPrice) {
            conditionalType = "lesser_than";
        }

        const newSpotTrade = new SpotTrade({
            userId: req.user.id,
            pairId: spotPairData._id,
            firstCurrencyId: spotPairData.firstCurrencyId,
            firstCurrency: spotPairData.firstCurrencySymbol,
            secondCurrencyId: spotPairData.secondCurrencyId,
            secondCurrency: spotPairData.secondCurrencySymbol,

            stopPrice: reqBody.stopPrice,
            price: reqBody.price,
            quantity: reqBody.quantity,

            orderValue: orderValue,

            pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
            beforeBalance: balance,
            afterBalance: updateUserAsset.spotwallet,

            orderType: reqBody.orderType,
            orderDate: new Date(),
            buyorsell: reqBody.buyorsell,
            conditionalType,
            status: "conditional",
        });

        let newOrder = await newSpotTrade.save();
        getOpenOrderSocket(newOrder.userId, newOrder.pairId);
        return res
            .status(200)
            .json({ status: true, message: "Your order placed successfully." });
    } catch (err) {
        return res
            .status(400)
            .json({ status: false, message: "Limit order match error" });
    }
};

/**
 * Stop Market order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, stopPrice, quantity, buyorsell, orderType(stop_limit)
 */
export const stopMarketOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.stopPrice = parseFloat(reqBody.stopPrice);
        reqBody.price = parseFloat(reqBody.price);
        reqBody.quantity = parseFloat(reqBody.quantity);

        let spotPairData = await SpotPair.findOne({ _id: reqBody.spotPairId });

        if (!spotPairData) {
            return res
                .status(400)
                .json({ status: false, message: "Invalid Pair" });
        }

        // if (reqBody.price < 0.00000001) {
        //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
        // }
        // else if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
        //     return res.json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + spotPairData.minQuantity });
        // }
        // else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
        //     return res.json({ 'status': false, 'message': "Quantity of contract must not be higher than " + spotPairData.maxQuantity, });
        // }

        let currencyId =
            reqBody.buyorsell == "buy"
                ? spotPairData.secondCurrencyId
                : spotPairData.firstCurrencyId;

        let userAssetsData = await Assets.findOne({
            userId: req.user.id,
            currency: currencyId,
        });
        if (!userAssetsData) {
            return res
                .status(500)
                .json({ status: false, message: "Error occured" });
        }

        let balance = parseFloat(userAssetsData.spotwallet),
            orderValue =
                reqBody.buyorsell == "buy"
                    ? reqBody.price * reqBody.quantity
                    : reqBody.quantity;

        if (balance < orderValue) {
            return res
                .status(400)
                .json({
                    status: false,
                    message: "Due to insuffient balance order cannot be placed",
                });
        }

        userAssetsData.spotwallet = balance - orderValue;
        let updateUserAsset = await userAssetsData.save();

        socketEmitOne(
            "updateTradeAsset",
            {
                _id: updateUserAsset._id,
                spotwallet: updateUserAsset.spotwallet,
                derivativeWallet: updateUserAsset.derivativeWallet,
            },
            req.user.id
        );

        let conditionalType = "equal";
        if (spotPairData.markPrice < reqBody.stopPrice) {
            conditionalType = "greater_than";
        } else if (spotPairData.markPrice > reqBody.stopPrice) {
            conditionalType = "lesser_than";
        }

        const newSpotTrade = new SpotTrade({
            userId: req.user.id,
            pairId: spotPairData._id,
            firstCurrencyId: spotPairData.firstCurrencyId,
            firstCurrency: spotPairData.firstCurrencySymbol,
            secondCurrencyId: spotPairData.secondCurrencyId,
            secondCurrency: spotPairData.secondCurrencySymbol,

            stopPrice: reqBody.stopPrice,
            price: reqBody.price,
            quantity: reqBody.quantity,

            orderValue: orderValue,

            pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
            beforeBalance: balance,
            afterBalance: updateUserAsset.spotwallet,

            orderType: reqBody.orderType,
            orderDate: new Date(),
            buyorsell: reqBody.buyorsell,
            conditionalType,
            status: "conditional",
        });

        let newOrder = await newSpotTrade.save();
        getOpenOrderSocket(newOrder.userId, newOrder.pairId);
        return res
            .status(200)
            .json({ status: true, message: "Your order placed successfully." });
    } catch (err) {
        return res
            .status(400)
            .json({ status: false, message: "Limit order match error" });
    }
};

export const tradeList = async (newOrder, pairData) => {
    try {
        let matchQuery = {
            $or: [{ status: "open" }, { status: "pending" }],
            userId: { $ne: ObjectId(newOrder.userId) },
            pairId: ObjectId(newOrder.pairId),
        };

        let sortQuery = { price: 1 };

        if (newOrder.buyorsell == "buy") {
            matchQuery["buyorsell"] = "sell";
            matchQuery["price"] = { $lte: newOrder.price };
        } else if (newOrder.buyorsell == "sell") {
            matchQuery["buyorsell"] = "buy";
            matchQuery["price"] = { $gte: newOrder.price };
            sortQuery = { price: -1 };
        }

        let orderList = await SpotTrade.aggregate([
            { $match: matchQuery },
            { $sort: sortQuery },
            { $limit: 50 },
        ]);

        if (orderList && orderList.length > 0) {
            return await tradeMatching(newOrder, orderList, 0, pairData);
        } else {
            console.log("No trade record");
            return false;
        }

        return true;
    } catch (err) {
        console.log("Error on Trade match ", err);
        return false;
    }
};

export const tradeMatching = async (newOrder, orderData, count = 0, pairData) => {
    try {
        if (!["open", "pending"].includes(newOrder.status)) {
            return true;
        } else if (isEmpty(orderData[count])) {
            if (pairData.botStatus == "off") {
                // updateTickerPrice({
                //     'pairId': newOrder.pairId,
                // })
            }
            return true;
        }
        let sellOrderData,
            buyOrderData,
            sellAdminFee = 0,
            buyAdminFee = 0,
            uniqueId = Math.floor(Math.random() * 1000000000);

        if (newOrder.buyorsell == "buy") {
            buyOrderData = newOrder;
            sellOrderData = orderData[count];
            buyAdminFee = pairData.taker_fees;
            sellAdminFee = pairData.maker_rebate;
        } else if (newOrder.buyorsell == "sell") {
            sellOrderData = newOrder;
            buyOrderData = orderData[count];
            sellAdminFee = pairData.taker_fees;
            buyAdminFee = pairData.maker_rebate;
        }

        let sellQuantity = sellOrderData.quantity - sellOrderData.filledQuantity;
        let buyQuantity = buyOrderData.quantity - buyOrderData.filledQuantity;

        if (sellQuantity == buyQuantity) {
            // sell update
            let updateSellOrder = await SpotTrade.findOneAndUpdate(
                {
                    _id: sellOrderData._id,
                },
                {
                    status: "completed",
                    filledQuantity: sellOrderData.filledQuantity + sellQuantity,
                    $push: {
                        filled: {
                            pairId: sellOrderData.pairId,
                            sellUserId: sellOrderData.userId,
                            buyUserId: buyOrderData.userId,
                            userId: sellOrderData.userId,
                            sellOrderId: sellOrderData._id,
                            buyOrderId: buyOrderData._id,
                            uniqueId: uniqueId,
                            price: sellOrderData.price,
                            filledQuantity: sellQuantity,
                            Fees: (sellQuantity * sellAdminFee) / 100,
                            status: "filled",
                            Type: "buy",
                            createdAt: new Date(),
                            orderValue: sellQuantity * sellOrderData.price,
                        },
                    },
                },
                { new: true }
            );

            await assetUpdate({
                currencyId: sellOrderData.secondCurrencyId,
                userId: sellOrderData.userId,
                balance: withoutServiceFee({
                    price: sellQuantity * sellOrderData.price,
                    serviceFee: sellAdminFee,
                }),
            });

            await getOpenOrderSocket(sellOrderData.userId,sellOrderData.pairId);
            await getFilledOrderSocket(sellOrderData.userId, sellOrderData.pairId);
            // await getOrderHistorySocket(sellOrderData.userId,sellOrderData.pairId);
            await getTradeHistorySocket(sellOrderData.userId,sellOrderData.pairId);

            // Buy update
            let updateBuyOrde = await SpotTrade.findOneAndUpdate({
                _id: buyOrderData._id,
            },
            {
                status: "completed",
                filledQuantity: buyOrderData.filledQuantity + buyQuantity,

                $push: {
                    filled: {
                        pairId: buyOrderData.pairId,
                        sellUserId: sellOrderData.userId,
                        buyUserId: buyOrderData.userId,
                        userId: buyOrderData.userId,
                        sellOrderId: sellOrderData._id,
                        buyOrderId: buyOrderData._id,
                        uniqueId: uniqueId,
                        price: sellOrderData.price,
                        filledQuantity: buyQuantity,
                        Fees: (buyQuantity * buyAdminFee) / 100,
                        status: "filled",
                        Type: "buy",
                        createdAt: new Date(),
                        orderValue: buyQuantity * sellOrderData.price,
                    },
                },
            },
            { new: true });

            await assetUpdate({
                currencyId: buyOrderData.firstCurrencyId,
                userId: buyOrderData.userId,
                balance: withoutServiceFee({
                    price: buyQuantity,
                    serviceFee: buyAdminFee,
                }),
            });

            // Balance Retrieve
            if (sellOrderData.price < buyOrderData.price) {
                await assetUpdate({
                    currencyId: buyOrderData.secondCurrencyId,
                    userId: buyOrderData.userId,
                    balance: buyOrderData.price * buyQuantity - sellOrderData.price * buyQuantity,
                });
            }
            await getOpenOrderSocket(buyOrderData.userId,buyOrderData.pairId);
            // await getOrderHistorySocket(buyOrderData.userId,buyOrderData.pairId);
            await getFilledOrderSocket(buyOrderData.userId, buyOrderData.pairId);
            await getTradeHistorySocket(buyOrderData.userId,buyOrderData.pairId);
            if (pairData.botstatus == "Off") {
                await getOrderBookSocket(buyOrderData.pairId);
                await marketPriceSocket(buyOrderData.pairId);
            }
            await recentTradeSocket(buyOrderData.pairId);
            return true;
        } else if (sellQuantity < buyQuantity) {
            let updateSellOrder = await SpotTrade.findOneAndUpdate(
                {
                    _id: sellOrderData._id,
                },
                {
                    $set: {
                        status: "completed",
                        filledQuantity: sellOrderData.filledQuantity + sellQuantity,
                    },
                    $push: {
                        filled: {
                            pairId: sellOrderData.pairId,
                            sellUserId: sellOrderData.userId,
                            buyUserId: buyOrderData.userId,
                            userId: sellOrderData.userId,
                            sellOrderId: sellOrderData._id,
                            buyOrderId: buyOrderData._id,
                            uniqueId: uniqueId,
                            price: sellOrderData.price,
                            filledQuantity: sellQuantity,
                            Fees: (sellQuantity * sellAdminFee) / 100,
                            status: "filled",
                            Type: "sell",
                            createdAt: new Date(),
                            orderValue: sellQuantity * sellOrderData.price,
                        },
                    },
                },
                { new: true }
            );

            await assetUpdate({
                currencyId: sellOrderData.secondCurrencyId,
                userId: sellOrderData.userId,
                balance: withoutServiceFee({
                    price: sellQuantity * sellOrderData.price,
                    serviceFee: sellAdminFee,
                }),
            });

            await getOpenOrderSocket(sellOrderData.userId,sellOrderData.pairId);
            // await getOrderHistorySocket(sellOrderData.userId,sellOrderData.pairId);
            await getFilledOrderSocket(sellOrderData.userId, sellOrderData.pairId);
            await getTradeHistorySocket(sellOrderData.userId,sellOrderData.pairId);

            // Buy update
            let updateBuyOrder = await SpotTrade.findOneAndUpdate(
                {
                    _id: buyOrderData._id,
                },
                {
                    $set: {
                        status: "pending",
                        filledQuantity: buyOrderData.filledQuantity + sellQuantity,
                    },
                    $push: {
                        filled: {
                            pairId: buyOrderData.pairId,
                            sellUserId: sellOrderData.userId,
                            buyUserId: buyOrderData.userId,
                            userId: buyOrderData.userId,
                            sellOrderId: sellOrderData._id,
                            buyOrderId: buyOrderData._id,
                            uniqueId: uniqueId,
                            price: buyOrderData.price,
                            filledQuantity: sellQuantity,
                            Fees: (sellQuantity * buyAdminFee) / 100,
                            status: "filled",
                            Type: "buy",
                            createdAt: new Date(),
                            orderValue: sellQuantity * buyOrderData.price,
                        },
                    },
                },
                { new: true }
            );

            await assetUpdate({
                currencyId: buyOrderData.firstCurrencyId,
                userId: buyOrderData.userId,
                balance: withoutServiceFee({
                    price: sellQuantity,
                    serviceFee: buyAdminFee,
                }),
            });

            // Balance Retrieve
            if (sellOrderData.price < buyOrderData.price) {
                await assetUpdate({
                    currencyId: buyOrderData.secondCurrencyId,
                    userId: buyOrderData.userId,
                    balance: buyOrderData.price * sellQuantity - sellOrderData.price * sellQuantity,
                });
            }
            await getOpenOrderSocket(buyOrderData.userId,buyOrderData.pairId);
            await getFilledOrderSocket(buyOrderData.userId, buyOrderData.pairId);
            await getTradeHistorySocket(buyOrderData.userId,buyOrderData.pairId);
            if (pairData.botstatus == "Off") {
                await getOrderBookSocket(buyOrderData.pairId);
                await marketPriceSocket(buyOrderData.pairId);
            }
            await recentTradeSocket(buyOrderData.pairId);

            if (newOrder.buyorsell == "sell") {
                return true;
            } else if (newOrder.buyorsell == "buy") {
                return await tradeMatching(updateBuyOrder,orderData,(count = count + 1),pairData);
            }
        } else if (sellQuantity > buyQuantity) {
            let updateSellOrder = await SpotTrade.findOneAndUpdate(
                {
                    _id: sellOrderData._id,
                },
                {
                    $set: {
                        status: "pending",
                        filledQuantity:
                            sellOrderData.filledQuantity + buyQuantity,
                    },
                    $push: {
                        filled: {
                            pairId: sellOrderData.pairId,
                            sellUserId: sellOrderData.userId,
                            buyUserId: buyOrderData.userId,
                            userId: sellOrderData.userId,
                            sellOrderId: sellOrderData._id,
                            buyOrderId: buyOrderData._id,
                            uniqueId: uniqueId,
                            price: sellOrderData.price,
                            filledQuantity: buyQuantity,
                            Fees: (buyQuantity * sellAdminFee) / 100,
                            status: "filled",
                            Type: "sell",
                            createdAt: new Date(),
                            orderValue: buyQuantity * sellOrderData.price,
                        },
                    },
                },
                { new: true }
            );

            await assetUpdate({
                currencyId: sellOrderData.secondCurrencyId,
                userId: sellOrderData.userId,
                balance: withoutServiceFee({
                    price: buyQuantity * sellOrderData.price,
                    serviceFee: sellAdminFee,
                }),
            });

            await getOpenOrderSocket(sellOrderData.userId,sellOrderData.pairId);
            await getFilledOrderSocket(sellOrderData.userId, sellOrderData.pairId);
            await getTradeHistorySocket(sellOrderData.userId,sellOrderData.pairId);

            // Buy update
            let updateBuyOrder = await SpotTrade.findOneAndUpdate(
                {
                    _id: buyOrderData._id,
                },
                {
                    $set: {
                        status: "completed",
                        filledQuantity:
                            buyOrderData.filledQuantity + buyQuantity,
                    },
                    $push: {
                        filled: {
                            pairId: buyOrderData.pairId,
                            sellUserId: sellOrderData.userId,
                            buyUserId: buyOrderData.userId,
                            userId: buyOrderData.userId,
                            sellOrderId: sellOrderData._id,
                            buyOrderId: buyOrderData._id,
                            uniqueId: uniqueId,
                            price: buyOrderData.price,
                            filledQuantity: buyQuantity,
                            Fees: (buyQuantity * buyAdminFee) / 100,
                            status: "filled",
                            Type: "buy",
                            createdAt: new Date(),
                            orderValue: buyQuantity * buyOrderData.price,
                        },
                    },
                },
                { new: true }
            );

            await assetUpdate({
                currencyId: buyOrderData.firstCurrencyId,
                userId: buyOrderData.userId,
                balance: withoutServiceFee({
                    price: buyQuantity,
                    serviceFee: buyAdminFee,
                }),
            });

            // Balance Retrieve
            if (sellOrderData.price < buyOrderData.price) {
                await assetUpdate({
                    currencyId: buyOrderData.secondCurrencyId,
                    userId: buyOrderData.userId,
                    balance: buyOrderData.price * buyQuantity - sellOrderData.price * buyQuantity,
                });
            }
            await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId);
            // await getOrderHistorySocket(buyOrderData.userId,buyOrderData.pairId);
            await getFilledOrderSocket(buyOrderData.userId, buyOrderData.pairId);
            await getTradeHistorySocket(buyOrderData.userId,buyOrderData.pairId);
            if (pairData.botstatus == "Off") {
                await getOrderBookSocket(buyOrderData.pairId);
                await marketPriceSocket(buyOrderData.pairId);
            }
            await recentTradeSocket(buyOrderData.pairId);

            if (newOrder.buyorsell == "buy") {
                return true;
            } else if (newOrder.buyorsell == "sell") {
                return await tradeMatching(
                    updateSellOrder,
                    orderData,
                    (count = count + 1),
                    pairData
                );
            }
        }
    } catch (err) {
        console.log("Error on buy side trade matching", err.toString());
    }
};
/**
 * Admin Liquidity
*/
export const adminLiquidityPair = async () => {
    try {
        let pairList = await SpotPair.find({ "botstatus": "binance" });
        if (pairList.length > 0) {
            let adminData = await Admin.findOne({ "role": "superadmin" })
            for (let pairData of pairList) {
                if (pairData.markPrice > 0) {
                    adminLiquiditySellOrder(pairData, adminData)
                    adminLiquidityBuyOrder(pairData, adminData)
                }
            }
        }
    } catch (err) {
        console.log("Error on admin liquidity pair ", err)
    }
}

export const adminLiquiditySellOrder = async (pairData, adminData) => {
    try {
        let sellOrderList = await SpotTrade.find({
            'pairId': pairData._id,
            'buyorsell': 'sell',
            'price': {
                "$lte": pairData.markPrice
            },
            'status': { "$in": ['open', 'pending'] }
        }).limit(100).sort({ "price": 1 })

        if (sellOrderList && sellOrderList.length > 0) {
            for (let sellOrderData of sellOrderList) {

                let remainingQuantity = sellOrderData.quantity - sellOrderData.filledQuantity;
                let buyOrderId = ObjectId();
                let uniqueId = Math.floor(Math.random() * 1000000000);

                const buyOrder = new SpotTrade({
                    '_id': buyOrderId,
                    'userId': adminData._id,
                    'pairId': sellOrderData.pairId,
                    'firstCurrencyId': sellOrderData.firstCurrencyId,
                    'firstCurrency': sellOrderData.firstCurrencySymbol,
                    'secondCurrencyId': sellOrderData.secondCurrencyId,
                    'secondCurrency': sellOrderData.secondCurrencySymbol,

                    'quantity': remainingQuantity,
                    'price': sellOrderData.price,
                    'orderValue': (sellOrderData.price * remainingQuantity),

                    'pairName': `${sellOrderData.firstCurrencySymbol}${sellOrderData.secondCurrencySymbol}`,

                    'orderType': 'market',
                    'orderDate': new Date(),
                    'buyorsell': 'buy',
                    'status': 'completed',

                    'filled': [{
                        "pairId": sellOrderData.pairId,
                        "sellUserId": sellOrderData.userId,
                        "buyUserId": adminData._id,
                        "userId": adminData._id,
                        "sellOrderId": sellOrderData._id,
                        "buyOrderId": buyOrderId,
                        "uniqueId": uniqueId,
                        "price": sellOrderData.price,
                        "filledQuantity": remainingQuantity,
                        "Fees": calculateServiceFee({
                            'price': remainingQuantity,
                            'serviceFee': pairData.maker_rebate
                        }),
                        "status": "filled",
                        "Type": "buy",
                        "createdAt": new Date(),
                        "orderValue": sellOrderData.price * remainingQuantity,
                    }]

                });

                await buyOrder.save();

                await SpotTrade.findOneAndUpdate({
                    '_id': sellOrderData._id
                }, {
                    "$set": {
                        'status': 'completed',
                        'filledQuantity': sellOrderData.filledQuantity + remainingQuantity
                    },
                    "$push": {
                        "filled": {
                            "pairId": sellOrderData.pairId,
                            "sellUserId": sellOrderData.userId,
                            "buyUserId": adminData._id,
                            "userId": sellOrderData.userId,
                            "sellOrderId": sellOrderData._id,
                            "buyOrderId": buyOrderId,
                            "uniqueId": uniqueId,
                            "price": sellOrderData.price,
                            "filledQuantity": remainingQuantity,
                            "Fees": calculateServiceFee({
                                'price': sellOrderData.price * remainingQuantity,
                                'serviceFee': pairData.taker_fees
                            }),
                            "status": "filled",
                            "Type": "sell",
                            "createdAt": new Date(),
                            "orderValue": sellOrderData.price * remainingQuantity,
                        }
                    }
                }, { "new": true });

                await assetUpdate({
                    'currencyId': sellOrderData.secondCurrencyId,
                    'userId': sellOrderData.userId,
                    'balance': withoutServiceFee({
                        'price': sellOrderData.price * remainingQuantity,
                        'serviceFee': pairData.taker_fees
                    }),
                })


                await getOpenOrderSocket(sellOrderData.userId, sellOrderData.pairId)
                await getOrderHistorySocket(sellOrderData.userId, sellOrderData.pairId)
                await getTradeHistorySocket(sellOrderData.userId, sellOrderData.pairId)

                if (pairData.botstatus == 'off') {
                    await getOrderBookSocket(sellOrderData.pairId)
                    await marketPriceSocket(sellOrderData.pairId)
                }
                await recentTradeSocket(sellOrderData.pairId)
            }

        }
        return true

    } catch (err) {
        return false
    }
}

export const adminLiquidityBuyOrder = async (pairData, adminData) => {
    try {
        let buyOrderList = await SpotTrade.find({
            'pairId': pairData._id,
            'buyorsell': 'buy',
            'price': {
                "$gte": pairData.markPrice
            },
            'status': { "$in": ['open', 'pending'] }
        }).limit(100).sort({ "price": 1 })

        if (buyOrderList && buyOrderList.length > 0) {
            for (let buyOrderData of buyOrderList) {

                let remainingQuantity = buyOrderData.quantity - buyOrderData.filledQuantity;
                let sellOrderId = ObjectId();
                let uniqueId = Math.floor(Math.random() * 1000000000);

                const sellOrder = new SpotTrade({
                    '_id': buyOrderId,
                    'userId': adminData._id,
                    'pairId': buyOrderData.pairId,
                    'firstCurrencyId': buyOrderData.firstCurrencyId,
                    'firstCurrency': buyOrderData.firstCurrencySymbol,
                    'secondCurrencyId': buyOrderData.secondCurrencyId,
                    'secondCurrency': buyOrderData.secondCurrencySymbol,

                    'quantity': remainingQuantity,
                    'price': buyOrderData.price,
                    'orderValue': (buyOrderData.price * remainingQuantity),

                    'pairName': `${buyOrderData.firstCurrencySymbol}${buyOrderData.secondCurrencySymbol}`,

                    'orderType': 'market',
                    'orderDate': new Date(),
                    'buyorsell': 'sell',
                    'status': 'completed',

                    'filled': [{
                        "pairId": buyOrderData.pairId,
                        "sellUserId": adminData._id,
                        "buyUserId": buyOrderData.userId,
                        "userId": adminData._id,
                        "sellOrderId": sellOrderId,
                        "buyOrderId": buyOrderData._id,
                        "uniqueId": uniqueId,
                        "price": buyOrderData.price,
                        "filledQuantity": remainingQuantity,
                        "Fees": calculateServiceFee({
                            'price': buyOrderData.price * remainingQuantity,
                            'serviceFee': pairData.maker_rebate
                        }),
                        "status": "filled",
                        "Type": "sell",
                        "createdAt": new Date(),
                        "orderValue": buyOrderData.price * remainingQuantity,
                    }]

                });

                await sellOrder.save();

                await SpotTrade.findOneAndUpdate({
                    '_id': buyOrderData._id
                }, {
                    "$set": {
                        'status': 'completed',
                        'filledQuantity': buyOrderData.filledQuantity + remainingQuantity
                    },
                    "$push": {
                        "filled": {
                            "pairId": buyOrderData.pairId,
                            "sellUserId": adminData._id,
                            "buyUserId": buyOrderData.userId,
                            "userId": buyOrderData.userId,
                            "sellOrderId": sellOrderId,
                            "buyOrderId": buyOrderData._id,
                            "uniqueId": uniqueId,
                            "price": buyOrderData.price,
                            "filledQuantity": remainingQuantity,
                            "Fees": calculateServiceFee({
                                'price': remainingQuantity,
                                'serviceFee': pairData.taker_fees
                            }),
                            "status": "filled",
                            "Type": "buy",
                            "createdAt": new Date(),
                            "orderValue": buyOrderData.price * remainingQuantity,
                        }
                    }
                }, { "new": true });

                await assetUpdate({
                    'currencyId': buyOrderData.firstCurrencyId,
                    'userId': buyOrderData.userId,
                    'balance': withoutServiceFee({
                        'price': buyOrderData.price * remainingQuantity,
                        'serviceFee': pairData.taker_fees
                    }),
                })


                await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId)
                await getOrderHistorySocket(buyOrderData.userId, buyOrderData.pairId)
                await getTradeHistorySocket(buyOrderData.userId, buyOrderData.pairId)

                if (pairData.botstatus == 'off') {
                    await getOrderBookSocket(buyOrderData.pairId)
                    await marketPriceSocket(buyOrderData.pairId)
                }
                await recentTradeSocket(buyOrderData.pairId)
            }

        }
        return true
    } catch (err) {
        return false
    }
}


export const assetUpdate = async ({ currencyId, userId, balance }) => {
    try {
        let walletData = await Assets.findOne({
            'userId': userId,
            'currency': currencyId
        })
        if (walletData) {
            walletData.spotwallet = walletData.spotwallet + parseFloat(balance);
            let updateData = await walletData.save();
            socketEmitOne('updateTradeAsset', {
                '_id': updateData._id,
                'spotwallet': updateData.spotwallet,
                'derivativeWallet': updateData.derivativeWallet,
            }, userId)
            // walletUpdatePub(updateData)
        }
    } catch (err) {
    }
}

/** 
 * Get Order Book
 * URL : /api/spot/ordeBook/:{{pairId}}
 * METHOD : GET
 * PARAMS : pairId
*/
export const getOrderBook = async (req, res) => {
    try {
        let result = await orderBookData({
            'pairId': req.params.pairId
        })
        console.log("req.params.pairId---",req.params.pairId)
console.log("Result spot---",result)
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/** 
 * Get Order Book Socket
 * PARAMS : pairId
*/
export const getOrderBookSocket = async (pairId) => {
    try {
        let result = await orderBookData({
            'pairId': pairId
        })

        result['pairId'] = pairId;
        socketEmitAll('orderBook', result)
        return true
    } catch (err) {
        return false
    }
}

export const orderBookData = async ({ pairId }) => {
    try {
        let buyOrder = await SpotTrade.aggregate([
            {
                "$match": {
                    "pairId": ObjectId(pairId),
                    "$or": [
                        { "status": "open" },
                        { "status": "pending" },
                    ],
                    'buyorsell': 'buy'
                }
            },
            {
                "$group": {
                    '_id': "$price",
                    'quantity': { "$sum": "$quantity" },
                    'filledQuantity': { "$sum": "$filledQuantity" },
                }
            },
            { "$sort": { "_id": -1 } },
            { "$limit": 10 }
        ])

        let sellOrder = await SpotTrade.aggregate([
            {
                "$match": {
                    "pairId": ObjectId(pairId),
                    "$or": [
                        { "status": "open" },
                        { "status": "pending" },
                    ],
                    'buyorsell': 'sell'
                }
            },
            {
                "$group": {
                    '_id': "$price",
                    'quantity': { "$sum": "$quantity" },
                    'filledQuantity': { "$sum": "$filledQuantity" },
                }
            },
            { "$sort": { "_id": 1 } },
            { "$limit": 10 }
        ])

        if (buyOrder.length > 0) {
            let sumamount = 0
            for (let i = 0; i < buyOrder.length; i++) {
                let quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledQuantity);
                sumamount = parseFloat(sumamount) + parseFloat(quantity);
                buyOrder[i].total = sumamount;
                buyOrder[i].quantity = quantity;
            }
        }

        if (sellOrder.length > 0) {
            let sumamount = 0
            for (let i = 0; i < sellOrder.length; i++) {
                let quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledQuantity);
                sumamount = parseFloat(sumamount) + parseFloat(quantity);
                sellOrder[i].total = sumamount;
                sellOrder[i].quantity = quantity;
            }
        }
        sellOrder = sellOrder.reverse();

        return {
            buyOrder,
            sellOrder
        }

    } catch (err) {
        return {
            buyOrder: [],
            sellOrder: []
        }

    }
}

/**
 * Get User Open Order
 * URL : /api/spot/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getOpenOrder = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);

        let count = await SpotTrade.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
            "status": { "$in": ['open', 'pending', 'conditional'] }
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": { "$in": ['open', 'pending', 'conditional'] }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    // "orderDate": {
                    //     "$dateToString": {
                    //         "date": '$orderDate',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "orderDate":1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            'nextPage': pagination.page + 1,
            // 'nextPage': count > data.length,
            'limit': pagination.limit,
            data
        }
        console.log("Open order ---- ",result);
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Open Order Socket
 * userId, pairId
*/
export const getOpenOrderSocket = async (userId, pairId) => {
    try {
        let count = await SpotTrade.countDocuments({
            "userId": userId,
            'pairId': pairId,
            "status": { "$in": ['open', 'pending', 'conditional'] }
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": { "$in": ['open', 'pending', 'conditional'] }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
            {
                "$project": {
                    // "orderDate": {
                    //     "$dateToString": {
                    //         "date": '$orderDate',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "orderDate": 1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1,
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            'nextPage': 2,
            // 'nextPage': count > data.length,
            'limit': 10,
            data
        }

        socketEmitOne('openOrder', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/**
 * Get User Filled Order
 * URL : /api/spot/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getFilledOrder = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);

        let count = await SpotTrade.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
            "status": 'completed'
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": 'completed'
                }
            },
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
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            'nextPage': pagination.page + 1,
            // 'nextPage': count > data.length,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Filled Order Socket
 * userId, pairId
*/
export const getFilledOrderSocket = async (userId, pairId) => {
    try {
        let count = await SpotTrade.countDocuments({
            "userId": userId,
            'pairId': pairId,
            "status": 'completed'
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": 'completed'
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
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
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            // 'nextPage': 2,
            'nextPage': count > data.length,
            'limit': 10,
            data
        }
        socketEmitOne('filledOrder', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/**
 * Get User Trade History
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
// export const getTradeHistory = async (req, res) => {
export const getOrderHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);

        let count = await SpotTrade.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
            "status": {
                "$in": ['pending', 'completed', 'cancel']
            }
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    // "orderDate": {
                    //     "$dateToString": {
                    //         "date": '$orderDate',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "orderDate": 1,
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
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1,
                    "status":1,
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            // 'nextPage': pagination.page + 1,
            'nextPage': count > data.length,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Trade History Socket
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getOrderHistorySocket = async (userId, pairId) => {
// export const getTradeHistorySocket = async (userId, pairId) => {
    try {
        let count = await SpotTrade.countDocuments({
            "userId": userId,
            'pairId': pairId,
            "status": {
                "$in": ['pending', 'completed', 'cancel']
            }
        });
        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
            {
                "$project": {
                    // "orderDate": {
                    //     "$dateToString": {
                    //         "date": '$orderDate',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "orderDate": 1,
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
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "conditionalType": 1,
                    "status": 1
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            // 'nextPage': 2,
            'nextPage': count > data.length,
            'limit': 10,
            data
        }
        socketEmitOne('orderHistory', result, userId)
        return true
    } catch (err) {
        console.log("-----err", err)
        return false
    }
}

/**
 * Get User Trade History
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getTradeHistory = async (req, res) => {
    try {
        console.log("inside getTradehistory---")
        let pagination = paginationQuery(req.query);

        let count = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId("61a0ccaeea35110a0a3a97a9"),//ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$unwind": "$filled" }
        ])

        console.log("inside getTradehistory count---",count)

        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$unwind": "$filled" },
            { "$sort": { 'createdAt': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },

            {
                "$project": {
                    // "createdAt": {
                    //     "$dateToString": {
                    //         "date": '$filled.created_at',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "createdAt":1,
                    "status":1,
                    "quantity":1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "buyorsell": 1,
                    "price": "$filled.price",
                    "filledQuantity": "$filled.filledQuantity",
                    "Fees": "$filled.Fees",
                    "orderValue":1,
                    "orderType":1,
                }
            }
        ])
        console.log("tradehistory----",data)
        let result = {
            count: count.length,
            'currentPage': pagination.page,
            'nextPage': count > data.length,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Trade History Socket
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getTradeHistorySocket = async (userId, pairId) => {
    try {
        let count = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$unwind": "$filled" }
        ])
        console.log("inside getTradehistory count---",count)

        let data = await SpotTrade.aggregate([
            {
                "$match": {
                    "userId": ObjectId("61a0ccaeea35110a0a3a97a9"),// ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": {
                        "$in": ['pending', 'completed', 'cancel']
                    }
                }
            },
            { "$unwind": "$filled" },
            { "$sort": { 'createdAt': -1 } },
            { "$limit": 10 },

            {
                "$project": {
                    // "createdAt": {
                    //     "$dateToString": {
                    //         "date": '$filled.created_at',
                    //         "format": "%Y-%m-%d %H:%M"
                    //     }
                    // },
                    "createdAt":1,
                    "status":1,
                    "quantity":1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "buyorsell": 1,
                    "price": "$filled.price",
                    "filledQuantity": "$filled.filledQuantity",
                    "Fees": "$filled.Fees",
                    "orderValue":1,
                    "orderType":1,
                }
            }
        ])
        console.log("tradehistory----",data)

        let result = {
            pairId,
            count: count.length,
            'currentPage': 1,
            'nextPage': count > data.length,
            'limit': 10,
            data
        }
        socketEmitOne('tradeHistory', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/**
 * Get market price
 * URL : /api/spot/marketPrice/{{pairId}}
 * METHOD : GET
*/
export const getMarketPrice = async (req, res) => {
    try {
        let tickerPrice = await marketPrice(req.params.pairId)
        if (tickerPrice.status) {
            return res.status(200).json({ 'success': true, 'result': tickerPrice.result })
        }
        return res.status(409).json({ 'success': false })

    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get market price socket
 * pairId
*/
export const marketPriceSocket = async (pairId) => {
    try {
        let tickerPrice = await marketPrice(pairId)
        if (tickerPrice.status) {
            socketEmitAll('marketPrice', {
                pairId,
                'data': tickerPrice.result
            })
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export const marketPrice = async (pairId) => {
    try {
        let spotPairData = await SpotPair.findOne({ "_id": pairId });
        if (spotPairData) {
            if (spotPairData.botstatus == 'off') {

                let ticker24hrs = await SpotTrade.aggregate([
                    {
                        "$match": {
                            "pairId": ObjectId(pairId),
                            "buyorsell": "sell",
                            "status": { "$in": ['pending', 'completed'] },
                        }
                    },
                    { "$unwind": "$filled" },
                    {
                        "$match": {
                            "filled.createdAt": {
                            // "filled.created_at": {
                                "$gte": new Date(Date.now() - 24 * 60 * 60 * 1000),
                                "$lte": new Date()
                            },
                        }
                    },
                    {
                        // "$sort": { 'filled.created_at': 1 }
                        "$sort": { 'filled.createdAt': 1 }
                    },
                    {
                        "$group": {
                            "_id": null,
                            'open': { "$first": '$filled.price' },
                            'close': { "$last": '$filled.price' },
                            'high': { "$max": '$filled.price' },
                            'low': { "$min": '$filled.price' },
                            'firstVolume': { "$sum": "$filled.filledQuantity" },
                            // 'secondVolume': { "$sum": "$filled.order_value" }
                            'secondVolume': { "$sum": "$filled.orderValue" }
                        }
                    },
                    {
                        "$project": {
                            "low": 1,
                            "high": 1,
                            "firstVolume": 1,
                            "secondVolume": 1,
                            "changePrice": {
                                "$subtract": [
                                    { "$cond": [{ "$eq": ["$close", null] }, 0, '$close'] },
                                    { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                ]
                            },
                            "changePercentage": {
                                "$multiply": [
                                    {
                                        "$divide": [
                                            {
                                                "$subtract": [
                                                    { "$cond": [{ "$eq": ["$close", null] }, 0, '$close'] },
                                                    { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                                ]
                                            },
                                            { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                        ]
                                    },
                                    100
                                ]

                            }
                        }
                    },
                ])

                if (ticker24hrs.length > 0) {
                    spotPairData.low = ticker24hrs[0].low;
                    spotPairData.high = ticker24hrs[0].high;
                    spotPairData.changePrice = ticker24hrs[0].changePrice;
                    spotPairData.change = ticker24hrs[0].changePercentage;
                    spotPairData.firstVolume = ticker24hrs[0].firstVolume;
                    spotPairData.secondVolume = ticker24hrs[0].secondVolume;
                } else {
                    spotPairData.low = 0;
                    spotPairData.high = 0;
                    spotPairData.changePrice = 0;
                    spotPairData.change = 0;
                    spotPairData.firstVolume = 0;
                    spotPairData.secondVolume = 0;
                }

                let recentTrade = await SpotTrade.aggregate([
                    {
                        "$match": {
                            "pairId": ObjectId(pairId),
                            "buyorsell": "sell",
                            "status": { "$in": ['pending', 'completed'] },
                        }
                    },
                    { "$unwind": "$filled" },
                    {
                        // "$sort": { 'filled.created_at': -1 }
                        "$sort": { 'filled.createdAt': -1 }
                    },
                    { "$limit": 1 },
                    {
                        "$project": {
                            'price': '$filled.price'
                        }
                    }
                ])

                if (recentTrade.length > 0) {
                    spotPairData.last = recentTrade[0].price;
                    spotPairData.markPrice = recentTrade[0].price;
                }

                let updateSpotPair = await spotPairData.save();
                let result = {
                    'last': updateSpotPair.last,
                    'markPrice': updateSpotPair.markPrice,
                    'low': updateSpotPair.low,
                    'high': updateSpotPair.high,
                    'firstVolume': updateSpotPair.firstVolume,
                    'secondVolume': updateSpotPair.secondVolume,
                    'changePrice': updateSpotPair.changePrice,
                    'change': updateSpotPair.change,
                    'botstatus': updateSpotPair.botstatus,
                }

                triggerStopLimitOrder(updateSpotPair)
                return {
                    'status': true,
                    'result': result
                }
            }
        }
        return {
            'status': false
        }
    } catch (err) {
        return {
            'status': false
        }
    }
}

/** 
 * Trigger Stop Limit Order
 * price
*/
export const triggerStopLimitOrder = async (spotPairData) => {
    try {

        if (!isEmpty(spotPairData) && !isEmpty(spotPairData.markPrice)) {
            let takeProfitOrder = await SpotTrade.find({
                'pairId': ObjectId(spotPairData._id),
                'status': 'conditional',
                'orderType': 'stop_limit',
                'conditionalType': 'greater_than',
                'stopPrice': { "$lte": spotPairData.markPrice }
            })

            if (takeProfitOrder && takeProfitOrder.length > 0) {
                for (let profitOrder of takeProfitOrder) {

                    let newOrder = await SpotTrade.findOneAndUpdate({ "_id": profitOrder._id }, { "status": "open" }, { "new": true })
                    getOpenOrderSocket(newOrder.userId, newOrder.pairId)
                    getOrderBookSocket(newOrder.pairId)
                    await tradeList(newOrder, spotPairData)
                }
            }

            let stopLossOrder = await SpotTrade.find({
                'pairId': ObjectId(spotPairData._id),
                'status': 'conditional',
                'orderType': 'stop_limit',
                'conditionalType': 'lesser_than',
                'stopPrice': { "$gte": spotPairData.markPrice }
            })

            if (stopLossOrder && stopLossOrder.length > 0) {
                for (let lossOrder of stopLossOrder) {
                    let newOrder = await SpotTrade.findOneAndUpdate({ "_id": lossOrder._id }, { "status": "open" }, { "new": true })
                    getOpenOrderSocket(newOrder.userId, newOrder.pairId)
                    getOrderBookSocket(newOrder.pairId)
                    await tradeList(newOrder, spotPairData)
                }
            }


        }
    } catch (err) {
        console.log("----triggerStopLimitOrder", err)
    }
}

/**
 * Get Recent Trade
 * URL : /api/spot/recentTrade/{{pairId}}
 * METHOD : GET
*/
export const getRecentTrade = async (req, res) => {
    try {
        let pairData = await SpotPair.findOne(
            { "_id": req.params.pairId },
            {
                "firstCurrencySymbol": 1,
                "secondCurrencySymbol": 1,
                "botstatus": 1
            }
        );
        if (!pairData) {
            return res.status(400).json({ 'success': false })
        }

        if (pairData.botstatus == 'binance') {
            let recentTradeData = await binanceCtrl.recentTrade({
                'firstCurrencySymbol': pairData.firstCurrencySymbol,
                'secondCurrencySymbol': pairData.secondCurrencySymbol
            })
            if (recentTradeData && recentTradeData.length > 0) {
                return res.status(200).json({ 'success': true, 'result': recentTradeData })
            }
        } else {
            let recentTradeData = await recentTrade(req.params.pairId);
            if (recentTradeData.status) {
                return res.status(200).json({ 'success': true, 'result': recentTradeData.result })
            }
        }
        // let recentTradeData = await recentTrade(req.params.pairId);
        // if (recentTradeData.status) {
        //     return res.status(200).json({ 'success': true, 'result': recentTradeData.result })
        // }
        return res.status(409).json({ 'success': false })
    } catch (err) {
        console.log("Error---",err)
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get Recent Trade Socket
 * pairId
*/
export const recentTradeSocket = async (pairId) => {
    try {
        let recentTradeData = await recentTrade(pairId);
        if (recentTradeData.status) {
            socketEmitAll('recentTrade', {
                pairId,
                'data': recentTradeData.result
            })
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export const recentTrade = async (pairId) => {
    try {
        let recentTrade = await SpotTrade.aggregate([
            {
                "$match": {
                    'pairId': ObjectId(pairId),
                    "status": { "$in": ['pending', 'completed'] }
                }
            },
            { "$unwind": "$filled" },
            // { "$sort": { 'filled.created_at': -1 } },
            { "$sort": { 'filled.createdAt': -1 } },
            { "$limit": 20 },
            {
                "$group": {
                    "_id": {
                        "buyUserId": '$filled.buyUserId',
                        "sellUserId": '$filled.sellUserId',
                        "sellOrderId": "$filled.sellOrderId",
                        "buyOrderId": "$filled.buyOrderId"
                    },
                    "createdAt": { "$first": "$filled.createdAt" },
                    // "created_at": { "$first": "$filled.created_at" },
                    "Type": { "$first": "$filled.Type" },
                    "price": { "$first": "$filled.price" },
                    "filledQuantity": { "$first": "$filled.filledQuantity" },
                }
            },
            {
                "$project": {
                    "_id": 0
                }
            }
        ])

        if (recentTrade.length > 0) {
            return {
                status: true,
                result: recentTrade
            }
        }
        return {
            status: false
        }

    } catch (err) {
        return {
            status: false
        }
    }
}
/** 
 * Calculate Without Service Fee
*/
export const withoutServiceFee = ({
    price,
    serviceFee
}) => {
    price = parseFloat(price)
    serviceFee = parseFloat(serviceFee)
    return price - (price * (serviceFee / 100))
}

/** 
 * Calculate Service Fee
*/
export const calculateServiceFee = ({
    price,
    serviceFee
}) => {
    price = parseFloat(price)
    serviceFee = parseFloat(serviceFee)
    return (price * (serviceFee / 100))
}


//Added Limit to Stop limit functionalities 