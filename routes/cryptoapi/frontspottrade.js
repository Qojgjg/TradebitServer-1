const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const async = require("async");
const validateTradeInput = require('../../validation/frontend/trade');
const validatemobRegisterInput = require('../../validation/frontend/mobregister');
const validateLoginInput = require('../../validation/login');
const validatemobLoginInput = require('../../validation/moblogin');
const validateUpdateUserInput = require('../../validation/frontend/updateUser');
// const validateEmailtemplateInput = require('../../validation/emailtemplate');
const validateForgotInput = require('../../validation/forgot');
const validateCmsInput = require('../../validation/cms');
const validateFaqInput = require('../../validation/faq');
const validateUpdateSettingsInput = require('../../validation/settings');
const validateResetInput = require('../../validation/frontend/resetpassword');
const validatetfaInput = require('../../validation/frontend/tfainput');
const validateContactInput = require('../../validation/frontend/contact_us');
const spottradeTable = require('../../models/spottradeTable');
const charts = require('../../models/Chart');
const FeeTable = require('../../models/FeeTable');
const Bonus = require('../../models/Bonus');
const Assets = require('../../models/Assets');
const position_table = require('../../models/position_table');
const currency = require('../../models/currency');
const User = require('../../models/User');
const FundingHistory = require('../../models/FundingHistory');
const InterestHistory = require('../../models/InterestHistory');
const Emailtemplates = require('../../models/emailtemplate');
const exchangePrices = require('../../models/exchangePrices');
const spotPrices = require('../../models/spotPrices');
const spotpairs = require('../../models/spotpairs');
const multer = require('multer');
var node2fa = require('node-2fa');
var CryptoJS = require("crypto-js");
var moment = require("moment");
const perpetual = require('../../models/perpetual');
const cryptoRandomString = require('crypto-random-string');
const nodemailer = require('nodemailer');
var fs = require('fs');
const userinfo = [];
var moment = require('moment');
const { updateStopLimitOrder } = require('../helper/binanceHelper')

// const client                      = require('twilio')(
//   keys.TWILIO_ACCOUT_SID,
//   keys.TWILIO_AUTH_TOKEN
// );
const mongoose = require('mongoose');
const url = require('url');
const ObjectId = mongoose.Types.ObjectId;
var symbolsDatabase = require("../symbols_database"),
  RequestProcessor = require("../request-processor").RequestProcessor;
var requestProcessor = new RequestProcessor(symbolsDatabase);
var schedule = require('node-schedule');

var cron = require('node-cron');

var request = require('request');

var tradeinfo = [];
const rp = require('request-promise');
const WebSocket = require('ws');

// const Binance = require('node-binance-api');
//
// const binance = new Binance().options({
//   APIKEY: 'YrvGcDWxxFpgCIsES7W9QdwnTDyI16UDWTpkaXjCdw53MffLfcebq4Cs3HWzL1hH',
//   APISECRET: '0rL9dwtKN1W448hkWiKID5L0hgaVQX1BtyG7DLGTO1a4cX3WLlvK0iFArBseVeVi',
// });

const Binance = require('binance-api-node').default

// const client = Binance()

// Authenticated client, can make signed calls
//alwin test
// const client = Binance({
//   apiKey: 'PIyLADNuHFrwT7EE75lsl3ps2ZDs5sGjgMDFx7ylGAdNjOnmoWBVzAB1dHrBP93P',
//   apiSecret: 'CvvHdeAJNSe6AHbKbAgiDnmINe8mZwWVviH9HvlZK1SSpyokAf5ubFGakcFqzqtH',
// })

// // original apiii from the  client
const client = Binance(keys.binance.apiKey1)


const api = require('binance');
const binanceRest = new api.BinanceRest(keys.binance.apiKey2);



/// binance api key PIyLADNuHFrwT7EE75lsl3ps2ZDs5sGjgMDFx7ylGAdNjOnmoWBVzAB1dHrBP93P
/// biannce api secret  CvvHdeAJNSe6AHbKbAgiDnmINe8mZwWVviH9HvlZK1SSpyokAf5ubFGakcFqzqtH


const binanceWS = new api.BinanceWS(true); // Argument specifies whether the responses should be beautified, defaults to true
const streams = binanceWS.streams;



// binanceWS.onCombinedStream(
//     [
//         streams.depth('BTCUSDT'),
//     ],
//     streamEvent => {
//         switch (streamEvent.stream) {
//             case streams.depth('BTCUSDT'):
//                 console.log(
//                     'Depth event, update order book\n',
//                     streamEvent.data
//                 );
//                 break;
//
//
//
//         }
//     }
// );

// binanceWS.onDepthUpdate('BTCUSDT', data => {
//     console.log("BTCUSDT",data);
// });
//
// binanceWS.onAggTrade('BTCUSDT', data => {
//     console.log(data);
// });
//
// binanceWS.onKline('BNBBTC', '1m', data => {
//     console.log(data);
// });

var openWebSocket = function () {
  console.log("inside");
  const conn = new WebSocket(keys.binance.websocket.socketUrl + keys.binance.websocket.key);
  conn.onopen = function (evt) {
    conn.send(JSON.stringify({ method: "subscribe", topic: "orders", address: keys.binance.websocket.key }));

    // send Subscribe/Unsubscribe messages here (see below)
  }
  conn.onmessage = function (evt) {
    console.info('received data', evt.data);
  };
  conn.onerror = function (evt) {
    console.error('an error occurred', evt.data);
  };

}

// openWebSocket()

// cron.schedule('* * * * *', async (req,res) => {
//   console.log("ordechcek");
//   // var ordercheck = await client.orderOco({
//   //   symbol: 'XLMETH',
//   //   side: 'SELL',
//   //   quantity: 100,
//   //   price: 0.0002,
//   //   stopPrice: 0.0001,
//   //   stopLimitPrice: 0.0001,
//   // })
//   client.order({
//     symbol: 'XLMETH',
//     side: 'SELL',
//     quantity: 100,
//     price: 0.0002,
//   }),function(err,done){
//     if(err){
//       console.log("errror",err);
//     }
//     console.log("done",done);
//   }
//   // console.log("ordercheck",ordercheck);
// })

// cron.schedule('* * * * * *', (req, res) => {
//   // console.log("cron for the binance spot");
//   spotpairs.find().then(spotpairs => {
//     // console.log("spotpairs",spotpairs);
//     if (spotpairs.length > 0) {
//       var i = 0;
//       generatebinancetradetable(spotpairs[0], function () {
//         // console.log("first");
//         if (i === spotpairs.length - 1) {
//           callBackResponseImport();
//         } else {
//           i += 1;
//           if (spotpairs[i]) {
//             // console.log("next");
//             generatebinancetradetable(spotpairs[i]);

//           } else {
//             callBackResponseImport();
//           }
//         }
//       });
//     }
//   })
// });

router.get("/binancebalance", async (req, res) => {
  var balla = await client.accountInfo()
  // console.log(await client.accountInfo())
  var ethbal = balla.balances
  for (i = 0; i < ethbal.length; i++) {
    if (ethbal[i].asset == "ETH") {
      console.log("ETH", ethbal[i]);
    }
    if (ethbal[i].asset == "BTC") {
      console.log("BTC", ethbal[i]);
    }
    if (ethbal[i].asset == "USDT") {
      console.log("USDT", ethbal[i]);
    }

  }
})



async function generatebinancetradetable(spotpairs, callBackbinance) {
  // console.log("inside function");

  try {
    if (callBackbinance) {
      tradeinfo.callBackforthebinance = callBackbinance;
    }

    if (spotpairs.botstatus == 'Off') {
      return tradeinfo.callBackforthebinance()
    }

    // console.log("else");
    var pair = spotpairs.tiker_root

    // var
    // console.log("pairrrss",pair);
    var orders = await client.book({ symbol: pair, limit: 50 })
    // console.log("orderss",orders);
    var pairsellorders = orders.asks
    var pairbuyorders = orders.bids
    // console.log("pairsellorders",pairsellorders);
    // console.log("pairbuyorders",pairbuyorders);
    var concatedbuyandsell = pairsellorders.concat(pairbuyorders)
    var firstcurrency = spotpairs.first_currency
    var secondcurrency = spotpairs.second_currency
    var markuppercentage = spotpairs.markuppercentage
    // console.log("markuppercentage",markuppercentage);
    var pair = firstcurrency + secondcurrency;
    var result = {}

    async.parallel({
      buyOrder: function (cb) {
        var sort = { '_id': -1 };
        spottradeTable.aggregate([
          { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstcurrency, secondCurrency: secondcurrency, buyorsell: 'buy' } },
          {
            $group: {
              '_id': '$price',
              'quantity': { $sum: '$quantity' },
              'filledAmount': { $sum: '$filledAmount' }
            }
          },
          { $sort: sort },
          { $limit: 10 },
        ]).allowDiskUse(true).exec(cb)
      },
      sellOrder: function (cb) {
        var sort = { '_id': 1 };
        spottradeTable.aggregate([
          { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstcurrency, secondCurrency: secondcurrency, buyorsell: 'sell' } },
          {
            $group: {
              '_id': '$price',
              'quantity': { $sum: '$quantity' },
              'filledAmount': { $sum: '$filledAmount' }
            }
          },
          { $sort: sort },
          { $limit: 10 },
        ]).allowDiskUse(true).exec(cb)
      },

    }, (err, results) => {
      // console.log("resultss",results);

      if (err) {
        result.status = false;
        result.message = 'Error occured.';
        result.err = err;
        result.notify_show = 'no';
        // res.json(result);
      } else if (results) {

        console.log("resultlss of binancnsirds", results);
        var sellOrder = results.sellOrder;
        var buyOrder = results.buyOrder;
        // console.log("pairsellorders",pairsellorders);
        // console.log("result from db ",sellOrder);
        pairsellorders.map(function (binsell) {
          // console.log("binsell",binsell);
          var indexofsell = sellOrder.findIndex(x => (x._id) === parseFloat(binsell.price))
          // console.log("indexofsell",indexofsell)
          var withmarkuppricesell
          if (indexofsell = -1) {

            withmarkuppricesell = parseFloat(binsell.price) + parseFloat(binsell.price) * parseFloat(markuppercentage) / 100
            var newobsell = {
              _id: parseFloat(withmarkuppricesell),
              // _id:parseFloat(binsell.price),

              quantity: parseFloat(binsell.quantity),
              filledAmount: 0,
              // total:quantity,
            }
            sellOrder.push(newobsell)
          }

        })

        sellOrder = sellOrder.sort((a, b) => parseFloat(a._id) - parseFloat(b._id));


        // console.log("adfter the addition sell order",sellOrder);
        var withmarkuppricebuy


        pairbuyorders.map(function (binbuy) {
          // console.log("binbuy",binbuy);
          var indexofbuy = buyOrder.findIndex(x => (x._id) === parseFloat(binbuy.price))
          // console.log("indexofbuy",indexofbuy)
          if (indexofbuy = -1) {
            withmarkuppricebuy = parseFloat(binbuy.price) - parseFloat(binbuy.price) * parseFloat(markuppercentage) / 100

            var newobbuy = {
              _id: parseFloat(withmarkuppricebuy),
              // _id:parseFloat(binbuy.price),
              quantity: parseFloat(binbuy.quantity),
              filledAmount: 0,
              // total:quantity,
            }
            buyOrder.push(newobbuy)
          }

        })
        buyOrder = buyOrder.sort((a, b) => parseFloat(b._id) - parseFloat(a._id));

        // console.log("adfter the addition buy order",buyOrder);
        if (buyOrder.length > 0) {
          var sumamount = 0
          for (i = 0; i < buyOrder.length; i++) {
            var quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledAmount);
            var _id = buyOrder[i]._id;
            sumamount = parseFloat(sumamount) + parseFloat(quantity);
            buyOrder[i].total = sumamount;
            buyOrder[i].quantity = quantity;
          }
        }

        if (sellOrder.length > 0) {
          var sumamount = 0
          for (i = 0; i < sellOrder.length; i++) {

            var quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledAmount);
            var _id = sellOrder[i]._id;
            sumamount = parseFloat(sumamount) + parseFloat(quantity);
            sellOrder[i].total = sumamount;
            sellOrder[i].quantity = quantity;
          }
        }

        sellOrder = sellOrder.reverse();
        // console.log("pairnameee",pair);
        // console.log("resultsss",results.sellOrder);
        result.status = true;
        result.message = 'tradeTableAll';
        result.buyOrder = results.buyOrder;
        result.sellOrder = results.sellOrder;
        result.notify_show = 'no';
        result.firstCurrency = firstcurrency,
          result.secondCurrency = secondcurrency
        if (typeof socketio != 'undefined') {
          socketio.emit('TRADEBIN', result);
        }
        tradeinfo.callBackforthebinance()
      } else {
        tradeinfo.callBackforthebinance()
        result.status = false;
        result.message = 'Error occured.';
        result.err = '';
        result.notify_show = 'no';
        // res.json(result);
      }
    })
  } catch (err) {
    return tradeinfo.callBackforthebinance()
  }
}


router.get('/currencydetails', (req, res) => {
  currency.find({}, function (err, currencydetails) {
    if (currencydetails) {
      res.json({ status: true, data: currencydetails })
    }
    else {
      res.json({ status: false, message: "Something went wrong" })

    }
  });
});
router.post('/spotloadmoreRescentorder', (req, res) => {
  var pair = req.body.pair;
  var rescentcount = req.body.rescentcount;
  spottradeTable.aggregate([
    { $match: { 'pairName': pair, 'status': '1' } },
    { $unwind: "$filled" },
    { $project: { "filled": 1 } },
    { $group: { _id: { "buyuserId": '$filled.buyuserId', "selluserId": '$filled.selluserId', "sellId": "$filled.sellId", "buyId": "$filled.buyId" }, "created_at": { $first: "$filled.created_at" }, "Type": { $first: "$filled.Type" }, "filledAmount": { $first: "$filled.filledAmount" }, "pairname": { $first: "$filled.pairname" }, "Price": { $first: "$filled.Price" } } },
    { $sort: { 'created_at': -1 } },
    // {$skip: rescentcount},
    { $limit: rescentcount },
  ]).exec(function (err, result) {
    res.json({ status: true, data: result });
  });
});
router.get('/balance', (req, res) => {
  // res.json({statue:"success"});
  User.find({}, function (err, userdetails) {
    if (userdetails) {
      userdetails.forEach(function (res) {
        var userId = res._id;
        currency.find({}, function (err, currencydetails) {
          currencydetails.forEach(function (cur) {
            var insertobj = {
              "balance": 0,
              "currency": cur._id,
              "currencySymbol": cur.currencySymbol
            };

            const newContact = new Assets({
              "balance": 0,
              "currency": cur._id,
              "currencySymbol": cur.currencySymbol,
              "userId": userId
            });
            newContact.save(function (err, data) {
              console.log("success");
            });

          });
        });
      });
      res.send('success');

    }
  })
});
function gettradedata(firstCurrency, secondCurrency, io) {
  var findObj = {
    firstCurrency: firstCurrency,
    secondCurrency: secondCurrency
  };
  var pair = firstCurrency + secondCurrency;
  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel({
    buyOrder: function (cb) {
      var sort = { '_id': -1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstCurrency, secondCurrency: secondCurrency, buyorsell: 'buy' } },
        {
          $group: {
            '_id': '$price',
            'quantity': { $sum: '$quantity' },
            'filledAmount': { $sum: '$filledAmount' }
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    sellOrder: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstCurrency, secondCurrency: secondCurrency, buyorsell: 'sell' } },
        {
          $group: {
            '_id': '$price',
            'quantity': { $sum: '$quantity' },
            'filledAmount': { $sum: '$filledAmount' }
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    sellsumvalue: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstCurrency, secondCurrency: secondCurrency, buyorsell: 'sell' } },
        {
          $group: {
            _id: null,
            'quantity': { $sum: '$quantity' },
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    buysumvalue: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: firstCurrency, secondCurrency: secondCurrency, buyorsell: 'buy' } },
        {
          $group: {
            _id: null,
            'orderValue': { $sum: '$orderValue' },
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    contractdetails: function (cb) {
      spotpairs.findOne({ first_currency: firstCurrency, second_currency: secondCurrency }, { tiker_root: 1, maint_margin: 1, first_currency: 1, second_currency: 1 }).exec(cb)
    },
    Rescentorder: function (cb) {
      spottradeTable.aggregate([
        { $match: { 'pairName': pair, 'status': '1' } },
        { $unwind: "$filled" },
        { $project: { "filled": 1 } },
        { $group: { _id: { "buyuserId": '$filled.buyuserId', "selluserId": '$filled.selluserId', "sellId": "$filled.sellId", "buyId": "$filled.buyId" }, "created_at": { $first: "$filled.created_at" }, "Type": { $first: "$filled.Type" }, "filledAmount": { $first: "$filled.filledAmount" }, "pairname": { $first: "$filled.pairname" }, "Price": { $first: "$filled.Price" } } },
        { $sort: { 'created_at': -1 } },
        { $limit: 20 },
      ]).exec(cb)
    },
  }, (err, results) => {
    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      // res.json(result);
    } else if (results) {
      var sellOrder = results.sellOrder;
      var buyOrder = results.buyOrder;

      if (buyOrder.length > 0) {
        var sumamount = 0
        for (i = 0; i < buyOrder.length; i++) {
          var quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledAmount);
          var _id = buyOrder[i]._id;
          sumamount = parseFloat(sumamount) + parseFloat(quantity);
          buyOrder[i].total = sumamount;
          buyOrder[i].quantity = quantity;
        }
      }

      if (sellOrder.length > 0) {
        var sumamount = 0
        for (i = 0; i < sellOrder.length; i++) {
          var quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledAmount);
          var _id = sellOrder[i]._id;
          sumamount = parseFloat(sumamount) + parseFloat(quantity);
          sellOrder[i].total = sumamount;
          sellOrder[i].quantity = quantity;
        }
      }

      sellOrder = sellOrder.reverse();

      result.status = true;
      result.message = 'tradeTableAll';
      result.buyOrder = results.buyOrder;
      result.sellOrder = results.sellOrder;
      result.sellsumvalue = results.sellsumvalue;
      result.buysumvalue = results.buysumvalue;
      result.contractdetails = results.contractdetails;
      result.notify_show = 'no';
      result.Rescentorder = results.Rescentorder;
      // res.json(result);
      // console.log(result);
      if (typeof socketio != 'undefined') {
        socketio.emit('TRADE', result);
      }
    } else {
      console.log('2 nd fun Errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr')
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      // res.json(result);
    }
  });
}
router.post('/getspotTradeData', (req, res) => {
  var findObj = {
    firstCurrency: req.body.firstCurrency,
    secondCurrency: req.body.secondCurrency
  };
  var pair = req.body.firstCurrency + req.body.secondCurrency;

  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel({
    buyOrder: function (cb) {
      var sort = { '_id': -1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency, buyorsell: 'buy' } },
        {
          $group: {
            '_id': '$price',
            // "tradeId": { "$push": "$_id" },
            'quantity': { $sum: '$quantity' },
            'filledAmount': { $sum: '$filledAmount' }
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    sellOrder: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency, buyorsell: 'sell' } },
        {
          $group: {
            '_id': '$price',
            'quantity': { $sum: '$quantity' },
            'filledAmount': { $sum: '$filledAmount' }
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    sellsumvalue: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency, buyorsell: 'sell' } },
        {
          $group: {
            _id: null,
            'quantity': { $sum: '$quantity' },
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    buysumvalue: function (cb) {
      var sort = { '_id': 1 };
      spottradeTable.aggregate([
        { $match: { '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency, buyorsell: 'buy' } },
        {
          $group: {
            _id: null,
            'orderValue': { $sum: '$orderValue' },
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    Assetdetails: function (cb) {
      Assets.find({ userId: ObjectId(req.body.userid) }).exec(cb)
    },
    contractdetails: function (cb) {
      spotpairs.findOne({ first_currency: req.body.firstCurrency, second_currency: req.body.secondCurrency }, { tiker_root: 1, first_currency: 1, second_currency: 1 }).exec(cb)
    },
    Rescentorder: function (cb) {
      spottradeTable.aggregate([
        { $match: { 'pairName': pair, 'status': '1' } },
        { $unwind: "$filled" },
        { $project: { "filled": 1 } },
        { $group: { _id: { "buyuserId": '$filled.buyuserId', "selluserId": '$filled.selluserId', "sellId": "$filled.sellId", "buyId": "$filled.buyId" }, "created_at": { $first: "$filled.created_at" }, "Type": { $first: "$filled.Type" }, "filledAmount": { $first: "$filled.filledAmount" }, "pairname": { $first: "$filled.pairname" }, "Price": { $first: "$filled.Price" } } },
        { $sort: { 'created_at': -1 } },
        { $limit: 20 },
      ]).exec(cb)
    },
  }, async (err, results) => {

    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      res.json(result);
    } else if (results) {
      var sellOrder = results.sellOrder;
      var buyOrder = results.buyOrder;
      // console.log("----buyOrder", buyOrder)
      if (buyOrder.length > 0) {
        var sumamount = 0
        for (i = 0; i < buyOrder.length; i++) {
          var quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledAmount);
          var _id = buyOrder[i]._id;
          sumamount = parseFloat(sumamount) + parseFloat(quantity);
          buyOrder[i].total = sumamount;
          buyOrder[i].quantity = quantity;
        }
      }

      if (sellOrder.length > 0) {
        var sumamount = 0
        for (i = 0; i < sellOrder.length; i++) {
          var quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledAmount);
          var _id = sellOrder[i]._id;
          sumamount = parseFloat(sumamount) + parseFloat(quantity);
          sellOrder[i].total = sumamount;
          sellOrder[i].quantity = quantity;
        }
      }


      sellOrder = sellOrder.reverse();
      // console.log("sell orderre",results.sellOrder);

      // console.log("buyOrder orderre", results.buyOrder);

      var spotPairs = await spotpairs.findOne({ tiker_root: pair });

      result.status = true;
      result.message = 'tradeTableAll';
      result.buyOrder = results.buyOrder;
      result.sellOrder = results.sellOrder;
      result.contractdetails = results.contractdetails;
      result.sellsumvalue = results.sellsumvalue;
      result.buysumvalue = results.buysumvalue;
      result.notify_show = 'no';
      result.assetdetails = results.Assetdetails;
      result.Rescentorder = results.Rescentorder;
      result.flaotDigits = spotPairs.floatingDigits;
      // console.log('resultresultresultresultresult',result)
      res.json(result);
    } else {
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      res.json(result);
    }
  });
});
function cancel_trade(tradeid, userid) {
  console.log("cancel_trade")
  update = { status: '3' }
  spottradeTable.aggregate([
    { $match: { '_id': ObjectId(tradeid), 'status': { $ne: '3' } } },
  ]).exec((tradeerr, tradedata) => {
    if (tradedata.length > 0) {
      var type = tradedata[0].buyorsell;
      var trade_ids = tradedata[0]._id;
      var userId = tradedata[0].userId;
      var filledAmt = tradedata[0].filledAmount;
      var status = tradedata[0].status;
      var quantity = tradedata[0].quantity;
      var price = tradedata[0].price;
      var t_firstcurrencyId = tradedata[0].firstCurrency;
      var t_secondcurrencyId = tradedata[0].secondCurrency;
      var beforeBalance = tradedata[0].beforeBalance;
      var afterBalance = tradedata[0].afterBalance;

      quantity = parseFloat(quantity) - parseFloat(filledAmt);

      var order_value = parseFloat(quantity * price).toFixed(8);

      async.parallel({
        // update balance
        data1: function (cb) {
          var updatebaldata = {};

          var currency = (type == 'buy') ? t_secondcurrencyId : t_firstcurrencyId
          updatebaldata["spotwallet"] = (type == 'buy') ? order_value : quantity;
          console.log(updatebaldata, 'updatebaldata')
          console.log(currency, 'currency')
          Assets.findOneAndUpdate({ currencySymbol: currency, userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
            console.log(balerr, 'balerriiiii')
            console.log(baldata, 'baldata')

          });
        },
        data2: function (cb) {
          var updatedata = { "status": '3' }
          spottradeTable.findOneAndUpdate({ _id: ObjectId(tradeid) }, { "$set": updatedata }, { new: true, "fields": { _id: 1 } }, function (upErr, upRes) {
            if (upRes) {
              //res.json({status:true,message:"Your Order cancelled successfully.",notify_show:'yes'});
              gettradedata(t_firstcurrencyId, t_secondcurrencyId, socketio)
            }
            else {
              res.json({ status: false, message: "Due to some error occurred,While Order cancelling" });
            }
          });
        }
      }, function (err, results) {

      });
    }
    else {
      console.log({ status: false, message: "Your Order already cancelled" });
    }
  });
}
router.post('/spotcancelTrade', (req, res) => {

  var tradeid = req.body.id;
  var userid = req.body.userid;
  update = { status: '3' }
  spottradeTable.findOne({ "_id": tradeid, 'status': { "$in": ["0", "2"] } }, (err, spotTradeData) => {
    if (err) {
      return res.json({ status: false, message: "Something wrong" });
    }
    if (spotTradeData) {
      spottradeTable.aggregate([
        { $match: { '_id': ObjectId(tradeid), 'status': { $ne: '3' } } },
      ]).exec((tradeerr, tradedata) => {
        if (tradedata.length > 0) {
          var type = tradedata[0].buyorsell;
          var trade_ids = tradedata[0]._id;
          var userId = tradedata[0].userId;
          var filledAmt = tradedata[0].filledAmount;
          var status = tradedata[0].status;
          var quantity = tradedata[0].quantity;
          var price = tradedata[0].price;
          var t_firstcurrencyId = tradedata[0].firstCurrency;
          var t_secondcurrencyId = tradedata[0].secondCurrency;
          var beforeBalance = tradedata[0].beforeBalance;
          var afterBalance = tradedata[0].afterBalance;

          quantity = parseFloat(quantity) - parseFloat(filledAmt);

          var order_value = parseFloat(quantity * price).toFixed(8);

          async.parallel({
            // update balance
            data1: function (cb) {
              var updatebaldata = {};

              var currency = (type == 'buy') ? t_secondcurrencyId : t_firstcurrencyId
              updatebaldata["spotwallet"] = (type == 'buy') ? order_value : quantity;

              Assets.findOneAndUpdate({ currencySymbol: currency, userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {

              });
            },
            data2: function (cb) {
              var updatedata = { "status": '3' }
              spottradeTable.findOneAndUpdate({ _id: ObjectId(tradeid) }, { "$set": updatedata }, { new: true }, function (upErr, upRes) {
                if (upRes) {
                  // cancelbinancetrade(upRes)
                  res.json({ status: true, message: "Your Order cancelled successfully.", notify_show: 'yes' });
                  gettradedata(t_firstcurrencyId, t_secondcurrencyId, socketio)
                }
                else {
                  res.json({ status: false, message: "Due to some error occurred,While Order cancelling" });
                }
              });
            }
          }, function (err, results) {
            console.log("trade data");


          });
        }
        else {
          return res.json({ status: false, message: "Your Order already cancelled" });
        }
      });
    } else {
      return res.json({ status: false, message: "Your Order already cancelled" });
    }
  })
});



async function cancelbinancetrade(upRes) {
  console.log("inside function", upRes);
  if (upRes.binorderid != " " || upRes.binorderid != null || upRes.binorderid != undefined) {
    var orderid = parseFloat(upRes.binorderid)
    var pairname = upRes.pairName
    console.log("type of pair", typeof pairname);
    var cancelorderinbin = await client.cancelOrder({
      symbol: pairname,
      orderId: orderid,
    })
    console.log("cancelorderinbin", cancelorderinbin);
  }
}

router.post('/getspotPricevalue', (req, res) => {
  var pair = req.body.firstCurrency + req.body.secondCurrency;
  var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC", "LTCUSDT"]
  var pairname = (curarray.includes(pair)) ? pair.replace("USDT", "USD") : pair;
  var ratePairName = pair;
  var result = {};
  async.parallel({
    volumedata: function (cb) {
      var sort = { 'orderDate': -1 };
      spottradeTable.aggregate([
        {
          $match:
          {
            "orderDate": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            status: '1',
          }
        },
        { $unwind: "$filled" },
        {
          $match:
          {
            'filled.pairname': pair
          }
        },
        {
          $group:
          {
            _id: "$item",
            low: { $min: "$filled.Price" },
            high: { $max: "$filled.Price" },
            volume: { $sum: { $abs: "$filled.filledAmount" } },
            secvolume: { $sum: "$filled.order_value" }
          }
        }

      ]).allowDiskUse(true).exec(cb)
    },
    rates: function (cb) {
      spotPrices.aggregate([
        {
          $match: {
            "createdAt": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            pairname: ratePairName
          }
        },
        {
          $sort: { 'createdAt': 1 }
        },
        {
          $limit: 86400
        },
        {
          $group: {
            _id: null,
            pairname: { $first: '$pairname' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            high: { $max: '$price' },
            low: { $min: '$price' },
          }
        },
        {
          $project: {
            _id: 1,
            pairname: 1,
            open: 1,
            close: 1,
            low: 1,
            high: 1,
            change: { $multiply: [{ $subtract: [1, { $divide: [{ $cond: [{ $eq: ["$open", null] }, 0, '$open'] }, { $cond: [{ $eq: ["$close", null] }, 0, '$close'] }] }] }, 100] }
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    rates1: function (cb) {
      spottradeTable.aggregate([
        {
          $match: {
            "orderDate": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            status: "1",
            pairName: req.body.firstCurrency + req.body.secondCurrency
          }
        },
        {
          $sort: { 'orderDate': 1 }
        },
        {
          $group: {
            _id: null,
            pairname: { $first: '$pairName' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            high: { $max: '$price' },
            low: { $min: '$price' },
          }
        },
        {
          $project: {
            _id: 1,
            pairname: 1,
            open: 1,
            close: 1,
            low: 1,
            high: 1,
            change: { $multiply: [{ $subtract: [1, { $divide: [{ $cond: [{ $eq: ["$open", null] }, 0, '$open'] }, { $cond: [{ $eq: ["$close", null] }, 0, '$close'] }] }] }, 100] }
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    recentTrade: function (cb) {
      spottradeTable.findOne({
        status: "1",
        pairName: req.body.firstCurrency + req.body.secondCurrency
      }).sort({ "orderDate": -1 }).exec(cb)
    },
  }, async (err, results) => {
    // console.log("resiults", results);
    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      res.json(result);
    } else if (results) {
      // console.log("RSSSSSSSSSSSSSS", results);
      let curarray = await spotpairs.find({ 'botstatus': 'On' }).distinct('tiker_root');
      // var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC", "LTCUSDT"]
      // console.log("currarray", curarray);
      // console.log("pair", pair);
      if (curarray.includes(pair)) {
        if (results.rates.length > 0) {
          results.rates[0].volume = results.volumedata.length > 0 ? results.volumedata[0].volume / 2 : 0;
          results.rates[0].secvolume = results.volumedata.length > 0 ? results.volumedata[0].secvolume / 2 : 0;
          var low = results.rates[0].low;
          var high = results.rates[0].high;
          var last = results.rates[0].close;
          var open = results.rates[0].open;
          var volume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].volume) / 2 : 0;
          var secvolume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].secvolume) / 2 : 0;
          // var total_volume = results.rates[0].volume;

        }
        var change = (results.rates.length > 0) ? results.rates[0].change : 0;
      }
      else {
        let closePrice = results.rates1[0] ? results.rates1[0].close : 0;

        console.log("----results.recentTrade", results.recentTrade)

        if (results.recentTrade) {
          let recentTradeData = results.recentTrade;
          if (recentTradeData.buyorsell == 'sell') {
            closePrice = recentTradeData.price
          } else if (recentTradeData.filled.length > 0) {
            console.log("---Math.max.apply(Math, recentTradeData.filled.map(function (o) { return o.order_value; }))", Math.max.apply(Math, recentTradeData.filled.map(function (o) { return o.Price; })))
            closePrice = Math.max.apply(Math, recentTradeData.filled.map(function (o) { return o.Price; }))
          }
        }
        var last = closePrice;
        // console.log(results.rates1,"RESULTTTTTTTTT")
        if (results.rates1.length > 0) {
          // console.log("Dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
          results.rates1[0].volume = results.volumedata.length > 0 ? results.volumedata[0].volume / 2 : 0;
          results.rates1[0].secvolume = results.volumedata.length > 0 ? results.volumedata[0].secvolume / 2 : 0;
          results.rates1[0].last = closePrice;
          var low = results.rates1[0].low;
          var high = results.rates1[0].high;
          // var last = closePrice;
          var open = results.rates1[0].open;
          var volume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].volume) / 2 : 0;
          var secvolume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].secvolume) / 2 : 0;
          // var total_volume = results.rates[0].volume;
          // console.log("sridhar",closePrice)

        }
        console.log(req.body.firstCurrency + req.body.secondCurrency, closePrice, 'closePriceclosePriceclosePrice')
        updateStopLimitOrder({ 'pairName': req.body.firstCurrency + req.body.secondCurrency, 'price': closePrice })
        var change = (results.rates1.length > 0) ? results.rates1[0].change : 0;
      }

      spotpairs.findOneAndUpdate(
        { "tiker_root": req.body.firstCurrency + req.body.secondCurrency },
        {
          "$set": {
            "low": low,
            "high": high,
            "last": last,
            "markprice": last,
            "volume": volume,
            "secvolume": secvolume,
            "change": change
          }
        }, { multi: true }).exec(function (err, resUpdate) {
          if (resUpdate) {
            // socketio.emit("PRICEDETAILS", resUpdate);
            // console.log(resUpdate,'price update');
          }
        });

      result.status = true;
      result.message = 'tradeTableAll';
      result.pricedet = (curarray.includes(pair)) ? [] : results.rates1;
      result.lastpricedet = last;
      // result.change       = results.change;
      result.notify_show = 'no';
      res.json(result);
    } else {
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      res.json(result);
    }
  });
});

function getSpotPriceValue({ firstCurrency, secondCurrency }) {
  var pair = firstCurrency + secondCurrency;
  var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC", "LTCUSDT"]
  var pairname = (curarray.includes(pair)) ? pair.replace("USDT", "USD") : pair;
  var result = {};
  async.parallel({
    volumedata: function (cb) {
      var sort = { 'orderDate': -1 };
      spottradeTable.aggregate([
        {
          $match:
          {
            "orderDate": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            status: '1',
          }
        },
        { $unwind: "$filled" },
        {
          $match:
          {
            'filled.pairname': pair
          }
        },
        {
          $group:
          {
            _id: "$item",
            low: { $min: "$filled.Price" },
            high: { $max: "$filled.Price" },
            volume: { $sum: { $abs: "$filled.filledAmount" } },
            secvolume: { $sum: "$filled.order_value" }
          }
        }

      ]).allowDiskUse(true).exec(cb)
    },
    rates: function (cb) {
      spotPrices.aggregate([
        {
          $match: {
            "createdAt": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            pairname: pair
          }
        },
        {
          $sort: { 'createdAt': 1 }
        },
        {
          $limit: 86400
        },
        {
          $group: {
            _id: null,
            pairname: { $first: '$pairname' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            high: { $max: '$price' },
            low: { $min: '$price' },
          }
        },
        {
          $project: {
            _id: 1,
            pairname: 1,
            open: 1,
            close: 1,
            low: 1,
            high: 1,
            change: { $multiply: [{ $subtract: [1, { $divide: [{ $cond: [{ $eq: ["$open", null] }, 0, '$open'] }, { $cond: [{ $eq: ["$close", null] }, 0, '$close'] }] }] }, 100] }
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    rates1: function (cb) {
      spottradeTable.aggregate([
        {
          $match: {
            "orderDate": {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              $lte: new Date()
            },
            status: "1",
            pairName: pair
          }
        },
        {
          $sort: { 'orderDate': 1 }
        },
        {
          $group: {
            _id: null,
            pairname: { $first: '$pairName' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            high: { $max: '$price' },
            low: { $min: '$price' },
          }
        },
        {
          $project: {
            _id: 1,
            pairname: 1,
            open: 1,
            close: 1,
            low: 1,
            high: 1,
            change: { $multiply: [{ $subtract: [1, { $divide: [{ $cond: [{ $eq: ["$open", null] }, 0, '$open'] }, { $cond: [{ $eq: ["$close", null] }, 0, '$close'] }] }] }, 100] }
          }
        },
      ]).allowDiskUse(true).exec(cb)
    },
    recentTrade: function (cb) {
      spottradeTable.findOne({
        status: "1",
        pairName: pair
      }).sort({ "orderDate": -1 }).exec(cb)
    },
  }, async (err, results) => {
    console.log("resiults", results.rates);
    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      res.json(result);
    } else if (results) {
      let curarray = await spotpairs.find({ 'botstatus': 'On' }).distinct('tiker_root');
      // var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC", "LTCUSDT"]
      console.log("currarray", curarray);
      console.log("pair", pair);
      if (curarray.includes(pair)) {
        if (results.rates.length > 0) {
          results.rates[0].volume = results.volumedata.length > 0 ? results.volumedata[0].volume / 2 : 0;
          results.rates[0].secvolume = results.volumedata.length > 0 ? results.volumedata[0].secvolume / 2 : 0;
          var low = results.rates[0].low;
          var high = results.rates[0].high;
          var last = results.rates[0].close;
          var open = results.rates[0].open;
          var volume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].volume) / 2 : 0;
          var secvolume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].secvolume) / 2 : 0;
          // var total_volume = results.rates[0].volume;

        }
        var change = (results.rates.length > 0) ? results.rates[0].change : 0;
      }
      else {
        let closePrice = results.rates1[0].close;

        if (results.recentTrade) {
          let recentTradeData = results.recentTrade;
          if (recentTradeData.buyorsell == 'sell') {
            closePrice = recentTradeData.price
          } else if (recentTradeData.filled.length > 0) {
            closePrice = Math.max.apply(Math, recentTradeData.filled.map(function (o) { return o.price; }))
          }
        }
        if (results.rates1.length > 0) {
          results.rates1[0].volume = results.volumedata.length > 0 ? results.volumedata[0].volume / 2 : 0;
          results.rates1[0].secvolume = results.volumedata.length > 0 ? results.volumedata[0].secvolume / 2 : 0;
          results.rates1[0].last = results.rates1[0].close;
          var low = results.rates1[0].low;
          var high = results.rates1[0].high;
          var last = closePrice;
          var open = results.rates1[0].open;
          var volume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].volume) / 2 : 0;
          var secvolume = results.volumedata.length > 0 ? parseFloat(results.volumedata[0].secvolume) / 2 : 0;
          // var total_volume = results.rates[0].volume;
          updateStopLimitOrder({ 'pairName': pair, 'price': closePrice })
        }
        var change = (results.rates1.length > 0) ? results.rates1[0].change : 0;
      }

      spotpairs.findOneAndUpdate(
        { "tiker_root": pair },
        {
          "$set": {
            "low": low,
            "high": high,
            "last": last,
            "markprice": last,
            "volume": volume,
            "secvolume": secvolume,
            "change": change
          }
        }, { multi: true }).exec(function (err, resUpdate) {
          if (resUpdate) {
            // socketio.emit("PRICEDETAILS", resUpdate);
            // console.log(resUpdate,'price update');
          }
        });

      result.status = true;
      result.message = 'tradeTableAll';
      result.pricedet = (curarray.includes(pair)) ? [] : results.rates1;
      // result.lastpricedet = results.lastpricedet;
      // result.change       = results.change;
      result.notify_show = 'no';
      // res.json(result);
    } else {
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      res.json(result);
    }
  });
}

function getusertradedata(userId, firstCurrency, secondCurrency) {
  console.log('2nd Function Allwoed')
  // console.log(userId,'getuserdra')
  var userId = userId;
  var result = {};
  async.parallel({
    orderHistory: function (cb) {
      var sort = { '_id': -1 };
      spottradeTable.aggregate([
        {
          $match: {
            '$or': [{ "status": '0' }, { "status": '2' }, { "status": '4' }],
            // firstCurrency: firstCurrency, secondCurrency: secondCurrency, 
            userId: ObjectId(userId)
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    orderHistoryCount: function (cb) {
      spottradeTable.find({
        '$or': [{ "status": '0' }, { "status": '2' }, { "status": '4' }],
        // firstCurrency: firstCurrency, secondCurrency: secondCurrency,
        userId: ObjectId(userId)
      }).countDocuments().exec(cb)
    },
    Histroydetails: function (cb) {
      spottradeTable.find({ userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(10).exec(cb)
    },
    Filleddetails: function (cb) {
      spottradeTable.find({ status: 1, userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(10).exec(cb)
    },
    Conditional_details: function (cb) {
      spottradeTable.find({ status: '4', userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(10).exec(cb)
    },

    // lastpricedet : function(cb) {
    //   var sort = {'orderDate':-1};
    //   tradeTable.findOne({'$or' : [{"status" : '1'},{"status" : '2'}],
    //         firstCurrency:firstCurrency,
    //         secondCurrency:secondCurrency},{price:1}).sort({'orderDate':-1}).exec(cb)
    //   // tradeTable.aggregate([
    //   //   {
    //   //     $match:
    //   //     {
    //   //       '$or' : [{"status" : '1'},{"status" : '2'}],
    //   //       firstCurrency:firstCurrency,
    //   //       secondCurrency:secondCurrency
    //   //     }
    //   //   },
    //   //   {$sort:sort},
    //   //   {$limit: 1},
    //   // ]).allowDiskUse(true).exec(cb)
    // },
    Assetdetails: function (cb) {
      Assets.find({ userId: ObjectId(userId) }).exec(cb)
    },
    contractdetails: function (cb) {
      spotpairs.findOne({ first_currency: firstCurrency, second_currency: secondCurrency }, { tiker_root: 1, maint_margin: 1, first_currency: 1, second_currency: 1 }).exec(cb)
    },

  }, (err, results) => {

    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      // res.json(result);
    } else if (results) {
      console.log('lllllllllllllllllllllllll')
      result.status = true;
      result.message = 'tradeTableAll';
      result.buyOrder = results.buyOrder;
      result.sellOrder = results.sellOrder;
      result.orderHistory = results.orderHistory;
      result.Histroydetails = results.Histroydetails;
      result.Conditional_details = results.Conditional_details;
      result.Filleddetails = results.Filleddetails;
      // result.lastpricedet         = results.lastpricedet;
      result.assetdetails = results.Assetdetails;
      result.contractdetails = results.contractdetails;
      result.orderHistoryCnt = results.orderHistoryCount

      result.notify_show = 'no';
      if (typeof socketio != 'undefined' && typeof userId != 'undefined') {
        socketio.sockets.in(userId.toString()).emit('USERTRADE', result);
      }
    } else {
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      // res.json(result);
    }
  });

}

router.post('/getOrderHistory', (req, res) => {
  var sort = { '_id': -1 };
  var userId = req.body.userId;
  var page = req.body.page;
  let skip = 0, limit = 10;
  if (page > 1) {
    skip = (page - 1) * limit
  }
  spottradeTable.aggregate([
    {
      $match: {
        '$or': [{ "status": '0' }, { "status": '2' }],
        // firstCurrency: req.body.firstCurrency,
        // secondCurrency: req.body.secondCurrency,
        userId: ObjectId(userId)
      }
    },
    { $sort: sort },
    { "$skip": skip },
    { $limit: limit },
  ], (err, data) => {
    if (err) { return res.send([]) }
    return res.send(data)
  })
})


router.post('/getspotuserTradeData', (req, res) => {
  var userId = req.body.userid;
  var status = req.body.status;
  var firstCurrency = req.body.firstCurrency;
  var secondCurrency = req.body.secondCurrency;
  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel({
    orderHistory: function (cb) {
      var sort = { '_id': -1 };
      spottradeTable.aggregate([
        {
          $match: {
            '$or': [{ "status": '0' }, { "status": '2' }, { "status": '4' }],
            // firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency,
            userId: ObjectId(userId)
          }
        },
        { $sort: sort },
        { $limit: 10 },
      ]).allowDiskUse(true).exec(cb)
    },
    orderHistoryCount: function (cb) {
      spottradeTable.find({
        '$or': [{ "status": '0' }, { "status": '2' }, { "status": '4' }],
        // firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency,
        userId: ObjectId(userId)
      }).countDocuments().exec(cb)
    },
    Histroydetails: function (cb) {
      spottradeTable.find({ userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(20).exec(cb)
    },
    Filleddetails: function (cb) {
      spottradeTable.find({ status: 1, userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(20).exec(cb)
    },
    Conditional_details: function (cb) {
      spottradeTable.find({ status: '4', userId: ObjectId(userId), firstCurrency: firstCurrency, secondCurrency: secondCurrency }).sort({ '_id': -1 }).limit(20).exec(cb)
    },

    lastpricedet: function (cb) {
      var sort = { 'orderDate': -1 };
      spottradeTable.aggregate([
        {
          $match:
          {
            status: '1',
            firstCurrency: req.body.firstCurrency,
            secondCurrency: req.body.secondCurrency
          }
        },
        { $sort: sort },
        { $limit: 1 },
      ]).allowDiskUse(true).exec(cb)
    },
    Assetdetails: function (cb) {
      Assets.find({ userId: ObjectId(req.body.userid) }).exec(cb)
    },
    contractdetails: function (cb) {
      spotpairs.findOne({ first_currency: req.body.firstCurrency, second_currency: req.body.secondCurrency }, { tiker_root: 1, maint_margin: 1, first_currency: 1, second_currency: 1 }).exec(cb)
    },

  }, (err, results) => {
    // console.log(results.position_details,'position_details');
    if (err) {
      result.status = false;
      result.message = 'Error occured.';
      result.err = err;
      result.notify_show = 'no';
      res.json(result);
    } else if (results) {
      result.status = true;
      result.message = 'tradeTableAll';
      result.buyOrder = results.buyOrder;
      result.sellOrder = results.sellOrder;
      result.orderHistory = results.orderHistory;
      result.Histroydetails = results.Histroydetails;
      result.Conditional_details = results.Conditional_details;
      result.Filleddetails = results.Filleddetails;
      result.lastpricedet = results.lastpricedet;
      result.assetdetails = results.Assetdetails;
      result.contractdetails = results.contractdetails;
      result.orderHistoryCnt = results.orderHistoryCount
      result.notify_show = 'no';
      res.json(result);
    } else {
      result.status = false;
      result.message = 'Error occured.';
      result.err = '';
      result.notify_show = 'no';
      res.json(result);
    }
  });
});
function order_placing(ordertype, buyorsell, price, quantity, pairname, userid, trigger_price = 0, trigger_type = null, id = 0, typeorder = 'Conditional', trailstopdistance = 0) {
  spotpairs.findOne({ tiker_root: pairname }, { tiker_root: 1, first_currency: 1, second_currency: 1, markprice: 1, maxquantity: 1, minquantity: 1 }, function (err, contractdetails) {
    var float = (pairname == 'BTCUSDT' || pairname == 'ETHUSDT') ? 2 : 8;
    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    var markprice = contractdetails.markprice;
    var btcprice = contractdetails.markprice;
    var taker_fees = contractdetails.taker_fees;
    var order_value = parseFloat(quantity) * parseFloat(price);
    var firstcurrency = contractdetails.first_currency;
    var secondcurrency = contractdetails.second_currency;
    var curcurrency = (buyorsell == 'buy') ? secondcurrency : firstcurrency;
    var curvalue = (buyorsell == 'buy') ? order_value : quantity;
    if (err) {
      res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });
    }
    else {
      Assets.findOne({ userId: ObjectId(userid), currencySymbol: curcurrency }, function (err, assetdetails) {
        if (err) {
          res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });
        } else if (assetdetails) {

          var curbalance = assetdetails.spotwallet;
          if (parseFloat(curbalance) < parseFloat(curvalue) && userid.toString() != "5e567694b912240c7f0e4299") {
            console.log({ status: false, message: "Due to insuffient balance order cannot be placed", notify_show: 'yes' })
          } else {

            var before_reduce_bal = curbalance;
            var after_reduce_bal = parseFloat(curbalance) - parseFloat(curvalue);

            var updateObj = { spotwallet: after_reduce_bal };

            Assets.findByIdAndUpdate(assetdetails._id, updateObj, { new: true }, function (err, changed) {
              if (err) {
                res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });

              } else if (changed) {
                // console.log(typeorder,'triggertyrp')
                if (typeorder == 'trailingstop') {
                  const newtradeTable = new spottradeTable({
                    quantity: parseFloat(quantity).toFixed(8),
                    price: parseFloat(price).toFixed(float),
                    trigger_price: trigger_price,
                    orderValue: order_value,
                    userId: userid,
                    pair: contractdetails._id,
                    pairName: pairname,
                    beforeBalance: before_reduce_bal,
                    afterBalance: after_reduce_bal,
                    firstCurrency: firstcurrency,
                    secondCurrency: secondcurrency,
                    orderType: ordertype,
                    trigger_type: trigger_type,
                    stopstatus: '0',
                    buyorsell: buyorsell,
                    pairid: id,
                    trigger_ordertype: typeorder,
                    trailstop: '1',
                    orderDate: new Date(),
                    trailstopdistance: trailstopdistance,
                    status: 4 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                  });
                  newtradeTable
                    .save()
                    .then(curorder => {
                      console.log(curorder, '::::::::::curorder::::::::::::')
                      if (typeof socketio != 'undefined') {
                        socketio.sockets.in(userid.toString()).emit('NOTIFICATION', "Trail stop order created successfully");
                      }
                      tradematching(curorder);
                    }).catch(err => { console.log(err, 'error'); res.json({ status: false, message: "Your order not placed.", notify_show: 'yes' }) }); ``
                }
                else {
                  const newtradeTable = new spottradeTable({
                    quantity: quantity,
                    price: (typeorder == 'stop' || typeorder == 'takeprofit') ? trigger_price : price,
                    trigger_price: trigger_price,
                    orderValue: order_value,
                    userId: userid,
                    pair: contractdetails._id,
                    pairName: pairname,
                    beforeBalance: before_reduce_bal,
                    afterBalance: after_reduce_bal,
                    firstCurrency: firstcurrency,
                    secondCurrency: secondcurrency,
                    orderType: ordertype,
                    trigger_type: trigger_type,
                    stopstatus: (typeorder != 'Conditional') ? '1' : '0',
                    buyorsell: buyorsell,
                    pairid: id,
                    trigger_ordertype: typeorder,
                    status: (trigger_type != null) ? 4 : 0 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                  });
                  newtradeTable
                    .save()
                    .then(curorder => {
                      console.log(curorder, '::::::::::elsecurorder::::::::::::')
                      tradematching(curorder);
                    }).catch(err => { console.log(err, 'error'); res.json({ status: false, message: "Your order not placed.", notify_show: 'yes' }) });
                }

              }
            })
            // insert trade tab
          }
        } else {

        }
      });
    }

  });
}


// router.post('/triggerstop', (req, res) => {
//   var takeprofitcheck = req.body.takeprofitcheck;
//   var stopcheck = req.body.stopcheck;
//   var quantity = req.body.quantity;
//   var takeprofit = req.body.takeprofit;
//   var ordertype = req.body.ordertype;
//   var buyorsell = req.body.buyorsell;
//   var price = req.body.price;
//   var leverage = req.body.leverage;
//   var trailingstopdistance = req.body.trailingstopdistance;

//   if (takeprofitcheck) {
//     var trigger_price = takeprofit;
//     var tptrigger_type = "Mark";
//     var newbuyorsell = (buyorsell == 'buy') ? 'sell' : 'buy';
//     order_placing(ordertype, newbuyorsell, price, quantity, leverage, req.body.pairname, req.body.userid, trigger_price, tptrigger_type, 0, 'takeprofit');
//     res.json({ status: true, message: "Your take profit order set successfully.", notify_show: 'yes' });
//   }
//   if (stopcheck) {
//     var stoptrigger_type = "Mark";
//     var trigger_price = stopprice;
//     var newbuyorsell = (buyorsell == 'buy') ? 'sell' : 'buy';
//     order_placing(ordertype, newbuyorsell, price, quantity, leverage, req.body.pairname, req.body.userid, trigger_price, stoptrigger_type, 0, 'stop');
//     res.json({ status: true, message: "Your stop order set successfully.", notify_show: 'yes' });
//   }
//   if (trailingstopdistance != '' && trailingstopdistance != 0) {

//     var trigger_price = (buyorsell == 'buy') ? parseFloat(price) + parseFloat(trailingstopdistance) : parseFloat(price) - parseFloat(trailingstopdistance);
//     // var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
//     order_placing(ordertype, buyorsell, price, quantity, leverage, req.body.pairname, req.body.userid, trigger_price, 'Last', 0, 'trailingstop', trailingstopdistance);
//     res.json({ status: true, message: "Your trail stop order set successfully.", notify_show: 'yes' });
//   }
// });
// function write_log(msg) {
//   var now = new Date();
//   var log_file = 'log/common_log_' + now.getFullYear() + now.getMonth() + now.getDay() + '.txt';
//   fs.appendFileSync(log_file, msg);
//   //console.log(msg);
//   return true;
// }
router.post('/spotorderPlacing', (req, res) => {

  var bytes = CryptoJS.AES.decrypt(req.body.token, keys.cryptoPass);
  req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  // console.log("after the decryption", req.body);
  var reqdate = req.body.newdate
  var data1 = new Date(reqdate);
  // console.log("datea1", data1);
  // console.log(req.body,"REQBOSY")
  var data2 = new Date()
  // console.log("Datate2", data2);
  var anotherdate = data2.getTime() + (1000 * 5)
  var indate = new Date(anotherdate)
  // console.log("anotherdate", indate);
  if (indate > data1) {
    const { errors, isValid } = validateTradeInput(req.body);
    // console.log(errors,"ERRRRRRRRRRRRRRRRRRRRR")
    if (!isValid) {
      res.json({
        status: false,
        message: "Error occured, please fill all required fields.",
        errors: errors,
        notify_show: 'yes'
      });
    } else {
      // console.log(req.body,"PPRRIICCEE")
      var post_only = req.body.post_only;
      var reduce_only = req.body.reduce_only;
      var ordertype = req.body.ordertype;
      var buyorsell = req.body.buyorsell;
      var price = req.body.price;
      var timeinforcetype = req.body.timeinforcetype;
      var trigger_price = req.body.trigger_price;
      var trigger_type = req.body.trigger_type;
      var quantity = req.body.quantity;
      var takeprofitcheck = req.body.takeprofitcheck;
      var stopcheck = req.body.stopcheck;
      var takeprofit = req.body.takeprofit;
      var stopprice = req.body.stopprice;
      // var tablename = (req.body.pairname=='BTCUSDT' || req.body.pairname=='ETHUSDT')?perpetual:spotpairs;
      // var pairnn = (req.body.pairname=='BTCUSDT' || req.body.pairname=='ETHUSDT')?req.body.pairname.replace("USDT","USD"):req.body.pairname;
      var tablename = spotpairs
      var pairnn = req.body.pairname
      // console.log(pairnn);
      // console.log(tablename);
      tablename.findOne({ tiker_root: pairnn }, { tiker_root: 1, first_currency: 1, second_currency: 1, markprice: 1, maxquantity: 1, minquantity: 1, taker_fees: 1, botstatus: 1 }, async function (err, contractdetails) {
        // console.log(err, 'contractdetails');
        // console.log(contractdetails, 'contractdetails');
        var firstcurrency = contractdetails.first_currency;
        var secondcurrency = contractdetails.second_currency;
        // if((req.body.pairname=='BTCUSDT' || req.body.pairname=='ETHUSDT'))
        // {
        //   var firstcurrency  = contractdetails.first_currency;
        //   var secondcurrency = contractdetails.second_currency.replace("USD","USDT");
        // }
        var markprice = parseFloat(contractdetails.markprice).toFixed(8);
        console.log("markpricemarkprice", markprice)
        var maxquantity = contractdetails.maxquantity;
        var minquantity = contractdetails.minquantity;
        // console.log("minquantity", minquantity);
        // console.log("quantity", quantity);
        var taker_fees = contractdetails.taker_fees;
        var order_value = parseFloat(quantity * price).toFixed(8);
        var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC"]
        if (req.body.price < 0.00000001) {
          return res.json({
            status: false,
            message: "Price of contract must not be lesser than 0.00000001",
            notify_show: 'yes'
          });
        }
        else if (parseFloat(quantity) < parseFloat(minquantity)) {
          return res.json({
            status: false,
            message: "Quantity of contract must not be lesser than " + minquantity,
            notify_show: 'yes'
          });
        }
        else if (parseFloat(quantity) > parseFloat(maxquantity)) {
          return res.json({
            status: false,
            message: "Quantity of contract must not be higher than " + maxquantity,
            notify_show: 'yes'
          });
        }
        // else if(ordertype=='Limit' && buyorsell=="buy" && parseFloat(req.body.price) > parseFloat(markprice) && curarray.includes(req.body.pairname))
        // {
        //     return res.json({
        //     status:false,
        //     message:"Entry price you set must be lower or equal to "+markprice,
        //     notify_show:'yes'
        //     });
        // }
        // else if(ordertype=='Limit' && buyorsell=="sell" && parseFloat(req.body.price) < parseFloat(markprice)  && curarray.includes(req.body.pairname))
        // {
        //     return res.json({
        //     status:false,
        //     message:"Entry price you set must be higher or equal to "+markprice,
        //     notify_show:'yes'
        //     });
        // }
        else {


          if (err) {
            res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });
          }
          else {

            // if (ordertype == "Stop Limit") {
            //   if (
            //     req.body.buyorsell == "buy" &&
            //     parseFloat(price) < parseFloat(trigger_price) &&
            //     parseFloat(trigger_price) < parseFloat(markprice)
            //   ) {
            //     return res.json({
            //       status: false,
            //       message:
            //         "Limit Price should be Greater than that of Spot Price and Stop Price",
            //       notify_show: "yes",
            //     });
            //   }
            //   if (
            //     req.body.buyorsell == "sell" &&
            //     parseFloat(markprice) < parseFloat(trigger_price) &&
            //     parseFloat(trigger_price) < parseFloat(price)
            //   ) {
            //     return res.json({
            //       status: false,
            //       message:
            //         "Market Price should be Greater than that of Limit Price and Stop Price",
            //       notify_show: "yes",
            //     });
            //   }
            // }

            if (ordertype == 'Market') {
              //stopped market orders
              return res.json({
                status: false,
                message: "Market orders currently suspended!",
                errors: 'no res 2',
                notify_show: 'yes'
              });

              try {
                var sportOrderBookSort = { '_id': req.body.buyorsell == 'buy' ? 1 : -1 };
                let sportOrderBook = await spottradeTable.aggregate([
                  {
                    "$match": {
                      'userId': { "$ne": ObjectId(req.body.userid) },
                      '$or': [
                        { "status": '0' },
                        { "status": '2' }
                      ],
                      "pairName": req.body.pairname,
                      'buyorsell': req.body.buyorsell == 'buy' ? "sell" : "buy"
                    }
                  },
                  {
                    "$group": {
                      '_id': '$price',
                      'quantity': { '$sum': '$quantity' },
                      'filledAmount': { '$sum': '$filledAmount' }
                    }
                  },
                  { "$sort": sportOrderBookSort },
                  { "$limit": 100 },
                ])
                // console.log(sportOrderBook, 'sportOrderBooksportOrderBook')
                if (sportOrderBook.length == 0 && contractdetails.botstatus == 'Off') {
                  return res.json({
                    status: false,
                    message: "There is no order in order book",
                    errors: 'no res 2',
                    notify_show: 'yes'
                  });
                }

                for (let i = 0; i < sportOrderBook.length; i++) {
                  let orderprice = sportOrderBook[i]._id;
                  let ordertotal = 0;

                  let orderquantity = parseFloat(Math.abs(sportOrderBook[i].quantity)) - parseFloat(Math.abs(sportOrderBook[i].filledAmount));

                  ordertotal = parseFloat(Math.abs(ordertotal)) + parseFloat(Math.abs(orderquantity));

                  if (parseFloat(ordertotal) >= parseFloat(Math.abs(quantity))) {
                    price = orderprice;
                    break;
                  } else if (i == sportOrderBook.length - 1) {
                    price = orderprice;
                  }
                }
              }
              catch (err) {
                return res.json({
                  status: false,
                  message: "Error occured..",
                  errors: err,
                  notify_show: 'yes'
                });
              }
            }


            var balcurrency = (req.body.buyorsell == 'buy') ? secondcurrency : firstcurrency;
            var order_value1 = (req.body.buyorsell == 'buy') ? order_value : quantity;
            Assets.findOne({ userId: ObjectId(req.body.userid), currencySymbol: balcurrency }, function (err, assetdetails) {
              // console.log(assetdetails, 'assetdetails')
              if (err) {
                res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });
              } else if (assetdetails) {

                var curbalance = parseFloat(assetdetails.spotwallet).toFixed(8);
                if (parseFloat(curbalance) < parseFloat(order_value1)) {
                  res.json({ status: false, message: "Due to insuffient balance order cannot be placed", notify_show: 'yes' })
                } else {

                  var before_reduce_bal = curbalance;
                  var after_reduce_bal = parseFloat(curbalance) - parseFloat(order_value1);
                  var updateObj = { spotwallet: after_reduce_bal };
                  var userid = req.body.userid;

                  Assets.findByIdAndUpdate(assetdetails._id, updateObj, { new: true }, function (err, changed) {
                    if (err) {
                      res.json({ status: false, message: "Error occured.", err: err, notify_show: 'yes' });
                    } else if (changed) {
                      // console.log(req.body,"req.bodyreq.bodyreq.bodyreq.body")
                      var float = (req.body.pairname == 'BTCUSDT' || req.body.pairname == 'ETHUSDT') ? 2 : 8;
                      var spotType = (parseFloat(markprice) < parseFloat(trigger_price)) ? 'greaterthan' : (parseFloat(markprice) > parseFloat(trigger_price)) ? 'lessthan' : (parseFloat(markprice) == parseFloat(trigger_price)) ? 'equal' : '';
                      // console.log('spotTypespotType',spotType)
                      // console.log('markprice',markprice)
                      // console.log('trigger_type',trigger_type)
                      const newtradeTable = new spottradeTable({
                        quantity: parseFloat(quantity).toFixed(8),
                        price: parseFloat(price).toFixed(float),
                        trigger_price: trigger_price,
                        orderValue: order_value,
                        userId: req.body.userid,
                        pair: contractdetails._id,
                        pairName: req.body.pairname,
                        postOnly: post_only,
                        reduceOnly: reduce_only,
                        beforeBalance: before_reduce_bal,
                        afterBalance: after_reduce_bal,
                        timeinforcetype: timeinforcetype,
                        firstCurrency: firstcurrency,
                        secondCurrency: secondcurrency,
                        orderType: ordertype,
                        trigger_type: trigger_type,
                        orderDate: new Date(),
                        buyorsell: buyorsell,
                        status: ordertype == "Stop Limit" ? 4 : 0,
                        spotType: ordertype == "Stop Limit" ? spotType : 'none',
                        //status: (trigger_type != null) ? 4 : 0 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                      });
                      newtradeTable
                        .save()
                        .then(curorder => {
                          // console.log(curorder,"curordercurordercurorder")
                          // write_log("\n"+JSON.stringify({date:new Date(),process:"orderplacing",result:curorder}));
                          var io = req.app.get('socket');
                          if (typeof io != 'undefined') {
                            socketio.sockets.in(req.body.userid.toString()).emit('TRADE', curorder);
                          }
                          res.json({ status: true, message: "Your order placed successfully.", notify_show: 'yes' });

                          console.log(takeprofitcheck, stopcheck, '-_-_-_-_-_-_-_-_-_-')
                          if (takeprofitcheck == false) {
                            var trigger_price = takeprofit;
                            var tptrigger_type = "Mark";
                            var newbuyorsell = (buyorsell == 'buy') ? 'sell' : 'buy';
                            // console.log('(((((((((((((((((((')
                            order_placing(ordertype, newbuyorsell, price, quantity, req.body.pairname, req.body.userid, trigger_price, tptrigger_type, curorder._id, 'takeprofit');
                          }
                          // console.log(profitnloss,'profitnloss')
                          // console.log(balance_check,'balance_check')
                          if (stopcheck == false) {
                            var stoptrigger_type = "Mark";
                            var trigger_price = stopprice;
                            var newbuyorsell = (buyorsell == 'buy') ? 'sell' : 'buy';
                            // console.log(')))))))))))))))))))))))')
                            order_placing(ordertype, newbuyorsell, price, quantity, req.body.pairname, req.body.userid, trigger_price, stoptrigger_type, curorder._id, 'stop');
                          }
                          // console.log(balance_check,'balance_check')
                          // console.log(profitnloss,'profitnloss')

                          tradematching(curorder, io);
                        }).catch(err => { console.log(err, 'error'); res.json({ status: false, message: "Your order not placed.", notify_show: 'yes' }) }); ``
                    }
                  })
                  // insert trade tab
                }
              } else {
                res.json({ status: false, message: "Error occured.", err: 'no res 2', notify_show: 'yes' });
              }
            });
          }
        }

      });
    }
  } else {
    res.json({
      status: false,
      message: "Error occured For the Interval",
      errors: errors,
      notify_show: 'yes'
    });
  }

});
function selldetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, buyprice, taker_fees, io, sellerforced_liquidation, sellleverage, buyOrder, callBackOne) {
  if (callBackOne) {
    tradeinfo.callBackOne = callBackOne;
  }

  var buyuserid = tempdata.user_id;
  async.waterfall([
    function (callback) {
      spottradeTable.findOneAndUpdate({ _id: ObjectId(buyorderid) }, { "$set": { "status": buyUpdate.status, "filled": tempdata }, "$inc": { "filledAmount": parseFloat(buyUpdate.filledAmt) } }, { new: true, "fields": { status: 1, filled: 1 } }, function (buytemp_err, buytempData1) {
        console.log(buytemp_err, 'buytemp_err')
        console.log(buytempData1, 'buytempData1buytempData1buytempData1buytempData1')
        if (buytempData1) {
          var updatebaldata = {};
          updatebaldata['spotwallet'] = parseFloat(tempdata.filledAmount) - parseFloat(tempdata.Fees);
          Assets.findOneAndUpdate({ currencySymbol: tempdata.firstCurrency, userId: ObjectId(tempdata.user_id) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
            // console.log(balerr,'buybalance error');
            // console.log(baldata,'buybaldata');
          });
          callback(null, buytempData1);
        }

      });
    },
    function (data, callback) {
      var order_value = parseFloat(sellUpdate.filledAmt * buyprice).toFixed(8);
      var fee = parseFloat(order_value) * parseFloat(taker_fees) / 100;
      tempdata.Type = "sell";
      tempdata.user_id = ObjectId(selluserid);
      tempdata.Fees = parseFloat(fee).toFixed(8);
      tempdata.Price = buyOrder.price;
      tempdata.filledAmount = +(sellUpdate.filledAmt).toFixed(8);
      tempdata.afterBalance = buyOrder.afterBalance;
      tempdata.beforeBalance = buyOrder.beforeBalance;
      tempdata.order_value = order_value;
      spottradeTable.findOneAndUpdate({ _id: ObjectId(sellorderid) }, { "$set": { "status": sellUpdate.status, "filled": tempdata }, "$inc": { "filledAmount": parseFloat(sellUpdate.filledAmt) } }, { new: true, "fields": { status: 1, filled: 1 } }, function (buytemp_err, selltempData) {
        console.log(buytemp_err, 'buytemp_errsell')
        if (selltempData) {
          var updatebaldata = {};
          updatebaldata['spotwallet'] = parseFloat(tempdata.order_value) - parseFloat(tempdata.Fees);
          Assets.findOneAndUpdate({ currencySymbol: tempdata.secondCurrency, userId: ObjectId(tempdata.user_id) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
            // console.log(balerr,'buybalance error');
            // console.log(baldata,'buybaldata');
          });

          callback(null, selltempData);
        }
      });
    },
  ], function (err, result) {
    console.log(result, 'selldetailsupdate')
    tradeinfo.callBackOne();
    //Bonus updation
    FeeTable.findOne({}).exec(function (err, bonusdetails) {
      console.log(bonusdetails, 'bonusdetails')
      if (bonusdetails) {

        var trade_bonus = bonusdetails.trade_bonus;
        var updatebonusdata = {};
        updatebonusdata["tempcurrency"] = trade_bonus;
        Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(selluserid) }, { "$inc": updatebonusdata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {
          console.log(balerr, 'bale')
          console.log(baldata, 'bale')
          const newBonus = new Bonus({
            userId: selluserid,
            bonus_amount: trade_bonus,
            type: '4',
          });
          newBonus.save(function (err, data) {
            // console.log(err,'err')
            // console.log(data,'data')
          });
        });

        Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(buyuserid) }, { "$inc": updatebonusdata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {
          console.log(balerr, 'bale')
          console.log(baldata, 'bale')
          const newBonus = new Bonus({
            userId: buyuserid,
            bonus_amount: trade_bonus,
            type: '4',
          });
          newBonus.save(function (err, data) {
            // console.log(err,'err')
            // console.log(data,'data')
          });
        });
      }
    });


    //socket call
    setTimeout(function () {
      gettradedata(result.filled[0].firstCurrency, result.filled[0].secondCurrency, socketio);
      getusertradedata(result.filled[0].selluserId, result.filled[0].firstCurrency, result.filled[0].secondCurrency);
      getusertradedata(result.filled[0].buyuserId, result.filled[0].firstCurrency, result.filled[0].secondCurrency);
      // getSpotPriceValue({ firstCurrency: result.filled[0].firstCurrency, secondCurrency: result.filled[0].secondCurrency })
    }, 3000);


    spottradeTable.findOneAndUpdate({ pairid: (buyorderid), status: '4', stopstatus: '1' }, { "$set": { "stopstatus": '2' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

    });

    spottradeTable.findOneAndUpdate({ pairid: (sellorderid), status: '4', stopstatus: '1' }, { "$set": { "stopstatus": '2' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

    });

    spottradeTable.find({ status: '4' }, function (buytemp_err, buytempData) {

      if (buytempData.length) {
        for (var i = 0; i < buytempData.length; i++) {
          var _id = buytempData[i]._id;
          var price = buytempData[i].price;
          var trigger_price = buytempData[i].trigger_price;
          var userId = buytempData[i].userId;
          var pairName = buytempData[i].pairName;
          var leverage = buytempData[i].leverage;
          var quantity = buytempData[i].quantity;
          var buyorsell = buytempData[i].buyorsell;
          var orderType = buytempData[i].orderType;
          var trailstop = buytempData[i].trailstop;
          var different = parseFloat(price) - parseFloat(trigger_price);

          if (parseFloat(trigger_price) == parseFloat(buyprice)) {
            // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
            spottradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              { $set: { status: "0" } },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // console.log(buytemp_err,'trigger error');
              }
            );
          }

          // console.log(trigger_price,'trigger_price');
          // console.log(buyprice,'buyprice');
          // if (different > 0) {
          //   if (trailstop == '0' && parseFloat(trigger_price) > parseFloat(buyprice)) {
          //     // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
          //     spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //       // console.log(buytemp_err,'trigger error');
          //     });
          //   }
          // }
          // else {
          //   if (trailstop == '0' && parseFloat(trigger_price) < parseFloat(buyprice)) {
          //     //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
          //     spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

          //       // console.log(buytemp_err,'trigger error');
          //     });
          //   }
          // }
          // //trailing stop trigger
          // if (trailstop == '1' && buyorsell == 'buy' && parseFloat(price) > parseFloat(buyprice)) {
          //   var addprice = (parseFloat(buyprice) - parseFloat(price))
          //   var newtriggerprice = parseFloat(trigger_price) + parseFloat(addprice);
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "price": newtriggerprice, "trigger_price": newtriggerprice } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'buy' && parseFloat(trigger_price) < parseFloat(buyprice)) {
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'sell' && parseFloat(price) < parseFloat(buyprice)) {
          //   var addprice = (parseFloat(price) - parseFloat(buyprice))
          //   var newtriggerprice = parseFloat(trigger_price) - parseFloat(addprice);
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "price": newtriggerprice, "trigger_price": newtriggerprice } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'sell' && parseFloat(trigger_price) > parseFloat(buyprice)) {
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
        }
      }
    });

  });
}
function buydetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, buyprice, maker_rebate, io, sellforced_liquidation, sellleverage, sellOrder, callBackOne) {
  if (callBackOne) {
    tradeinfo.callBackOne = callBackOne;
  }

  var buyuserid = tempdata.user_id;
  async.waterfall([
    function (callback) {
      spottradeTable.findOneAndUpdate({ _id: ObjectId(buyorderid) }, { "$set": { "filled": tempdata, "status": buyUpdate.status }, "$inc": { "filledAmount": buyUpdate.filledAmt } }, { new: true, "fields": { filled: 1 } }, function (buytemp_err, buytempData) {
        console.log(buytemp_err, 'buytemp_err')
        if (buytempData) {
          var updatebaldata = {};
          updatebaldata['spotwallet'] = parseFloat(tempdata.filledAmount) - parseFloat(tempdata.Fees);
          Assets.findOneAndUpdate({ currencySymbol: tempdata.firstCurrency, userId: ObjectId(tempdata.user_id) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
            // console.log(balerr,'buybalance error');
            // console.log(baldata,'buybaldata');
          });
          callback(null, buytempData);
        }
      });
    },
    function (data, callback) {

      var order_value = parseFloat(sellUpdate.filledAmt * buyprice).toFixed(8);
      var fee = parseFloat(order_value) * parseFloat(maker_rebate) / 100;

      tempdata.Type = "sell";
      tempdata.user_id = ObjectId(selluserid);
      tempdata.filledAmount = (sellUpdate.filledAmt) * -1;
      tempdata.Fees = parseFloat(fee).toFixed(8);
      tempdata.Price = sellOrder.price;
      tempdata.beforeBalance = sellOrder.beforeBalance;
      tempdata.afterBalance = sellOrder.afterBalance;
      tempdata.order_value = order_value;

      spottradeTable.findOneAndUpdate({ _id: ObjectId(sellorderid) }, { "$set": { "filled": tempdata, "status": sellUpdate.status }, "$inc": { "filledAmount": parseFloat(sellUpdate.filledAmt) } }, { new: true, "fields": { filled: 1 } }, function (selltemp_err, selltempData) {
        console.log(selltemp_err, 'selltemp_err')
        if (selltempData) {
          var updatebaldata = {};
          updatebaldata['spotwallet'] = parseFloat(tempdata.order_value) - parseFloat(fee);
          Assets.findOneAndUpdate({ currencySymbol: tempdata.secondCurrency, userId: ObjectId(tempdata.user_id) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
            // console.log(balerr,'buybalance error');
            // console.log(baldata,'buybaldata');
          });
          callback(null, selltempData);
        }
      });
    },
  ], function (err, result) {
    console.log(result, 'buydetailsupdate')
    tradeinfo.callBackOne()


    //Bonus updation
    FeeTable.findOne({}).exec(function (err, bonusdetails) {
      console.log(bonusdetails, 'bonusdetails')
      if (bonusdetails) {
        var trade_bonus = bonusdetails.trade_bonus;
        var updatebonusdata = {};
        updatebonusdata["tempcurrency"] = trade_bonus;
        Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(selluserid) }, { "$inc": updatebonusdata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {
          console.log(balerr, 'bale')
          console.log(baldata, 'bale')
          const newBonus = new Bonus({
            userId: selluserid,
            bonus_amount: trade_bonus,
            type: '4',
          });
          newBonus.save(function (err, data) {
            // console.log(err,'err')
            // console.log(data,'data')
          });
        });

        Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(buyuserid) }, { "$inc": updatebonusdata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {
          console.log(balerr, 'bale')
          console.log(baldata, 'bale')
          const newBonus = new Bonus({
            userId: buyuserid,
            bonus_amount: trade_bonus,
            type: '4',
          });
          newBonus.save(function (err, data) {
            // console.log(err,'err')
            // console.log(data,'data')
          });
        });
      }
    });

    //socket call
    setTimeout(function () {
      gettradedata(result.filled[0].firstCurrency, result.filled[0].secondCurrency, socketio);
      getusertradedata(result.filled[0].selluserId, result.filled[0].firstCurrency, result.filled[0].secondCurrency);
      getusertradedata(result.filled[0].buyuserId, result.filled[0].firstCurrency, result.filled[0].secondCurrency);
      // getSpotPriceValue({ firstCurrency: result.filled[0].firstCurrency, secondCurrency: result.filled[0].secondCurrency })
    }, 3000);

    spottradeTable.findOneAndUpdate(
      { pairid: (buyorderid), status: '4', stopstatus: '1' },
      { "$set": { "stopstatus": '2' } },
      { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

      });

    spottradeTable.findOneAndUpdate(
      { pairid: (sellorderid), status: '4', stopstatus: '1' },
      { "$set": { "stopstatus": '2' } },
      { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

      });

    spottradeTable.find({ status: '4', trigger_type: 'Last' }, function (buytemp_err, buytempData) {
      if (buytempData.length) {
        for (var i = 0; i < buytempData.length; i++) {
          var _id = buytempData[i]._id;
          var price = buytempData[i].price;
          var trigger_price = buytempData[i].trigger_price;
          var userId = buytempData[i].userId;
          var pairName = buytempData[i].pairName;
          var leverage = buytempData[i].leverage;
          var quantity = buytempData[i].quantity;
          var buyorsell = buytempData[i].buyorsell;
          var orderType = buytempData[i].orderType;
          var trailstop = buytempData[i].trailstop;
          var different = parseFloat(price) - parseFloat(trigger_price);

          if (parseFloat(trigger_price) == parseFloat(buyprice)) {
            // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
            spottradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              { $set: { status: "0" } },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // console.log(buytemp_err,'trigger error');
              }
            );
          }


          // console.log(trigger_price,'trigger_price');
          // console.log(buyprice,'buyprice');
          // if (different > 0) {
          //   if (trailstop == '0' && parseFloat(trigger_price) > parseFloat(buyprice)) {
          //     // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
          //     spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //       // console.log(buytemp_err,'trigger error');
          //     });
          //   }
          // }
          // else {
          //   if (spottradeTable == '0' && parseFloat(trigger_price) < parseFloat(buyprice)) {
          //     //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
          //     spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

          //       // console.log(buytemp_err,'trigger error');
          //     });
          //   }
          // }
          //trailing stop trigger
          // if (trailstop == '1' && buyorsell == 'buy' && parseFloat(price) > parseFloat(buyprice)) {
          //   var addprice = (parseFloat(buyprice) - parseFloat(price))
          //   var newtriggerprice = parseFloat(trigger_price) + parseFloat(addprice);
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "price": newtriggerprice, "trigger_price": newtriggerprice } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'buy' && parseFloat(trigger_price) < parseFloat(buyprice)) {
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'sell' && parseFloat(price) < parseFloat(buyprice)) {
          //   var addprice = (parseFloat(price) - parseFloat(buyprice))
          //   var newtriggerprice = parseFloat(trigger_price) - parseFloat(addprice);
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "price": newtriggerprice, "trigger_price": newtriggerprice } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
          // if (trailstop == '1' && buyorsell == 'sell' && parseFloat(trigger_price) > parseFloat(buyprice)) {
          //   spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: { $ne: '1' } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {
          //     // console.log(buytemp_err,'trigger error');
          //   });
          // }
        }
      }
    });

  });
}
async function buymatchingprocess(curorder, tradedata, pairData, io) {
  // console.log("buy");
  var buyOrder = curorder,
    buyAmt = rounds(buyOrder.quantity),
    buyorderid = buyOrder._id,
    buyuserid = buyOrder.userId,
    buyleverage = buyOrder.leverage,
    buyforced_liquidation = buyOrder.forced_liquidation,
    forceBreak = false,
    buyeramount = rounds(buyOrder.quantity),
    buyeramount1 = rounds(buyOrder.quantity),
    buytempamount = 0;
  buy_res_len = tradedata.length;
  console.log(buy_res_len, 'buy_res_len')
  // tradedata.forEach(function(data_loop){
  for (var i = 0; i < tradedata.length; i++) {
    var data_loop = tradedata[i];
    buyAmt = rounds(buyOrder.quantity - buytempamount);
    if (buyAmt == 0 || forceBreak == true) {
      // console.log("break");
      return;
    }
    else {
      var ii = i,
        sellOrder = data_loop,
        sellorderid = sellOrder._id,
        selluserid = sellOrder.userId,
        sellleverage = sellOrder.leverage,
        sellforced_liquidation = sellOrder.forced_liquidation,
        sellAmt = rounds(+sellOrder.quantity - +sellOrder.filledAmount),
        silentBreak = false,
        buyUpdate = {},
        sellUpdate = {},
        buyerBal = 0,
        sellerBal = 0,
        orderSocket = {}
      buyeramount = buyeramount - sellAmt;
      // console.log(buyAmt,"buyAmt");
      // console.log(Math.abs(sellAmt),"sellAmt");
      if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
        // console.log("amount eq");
        buyUpdate = {
          status: '1',
          filledAmt: Math.abs(sellAmt)
        }
        sellUpdate = {
          status: '1',
          filledAmt: buyAmt
        }
        forceBreak = true
      } else if (Math.abs(buyAmt) > Math.abs(sellAmt)) {
        // console.log("else buy gt");
        buyUpdate = {
          status: '2',
          filledAmt: Math.abs(sellAmt)
        }
        sellUpdate = {
          status: '1',
          filledAmt: Math.abs(sellAmt)
        }
        buyAmt = rounds(+buyAmt - +sellAmt)
      } else if (Math.abs(buyAmt) < Math.abs(sellAmt)) {
        // console.log("else sell gt");
        buyUpdate = {
          status: '1',
          filledAmt: buyAmt
        }
        sellUpdate = {
          status: '2',
          filledAmt: buyAmt
        }
        forceBreak = true
      } else {
        silentBreak = true
      }

      if (silentBreak == false) {

        var order_value = parseFloat(buyUpdate.filledAmt * buyOrder.price).toFixed(8);
        var fee = parseFloat(buyUpdate.filledAmt) * pairData.taker_fees / 100;

        var tempdata = {
          "pair": ObjectId(pairData._id),
          "firstCurrency": pairData.first_currency,
          "secondCurrency": pairData.second_currency,
          "buyuserId": ObjectId(buyuserid),
          "user_id": ObjectId(buyuserid),
          "selluserId": ObjectId(selluserid),
          "sellId": ObjectId(sellorderid),
          "buyId": ObjectId(buyorderid),
          "filledAmount": +(buyUpdate.filledAmt).toFixed(8),
          "Price": +buyOrder.price,
          "pairname": curorder.pairName,
          "Fees": parseFloat(fee).toFixed(8),
          "status": "filled",
          "Type": "buy",
          "created_at": new Date(),
          "beforeBalance": curorder.beforeBalance,
          "afterBalance": curorder.afterBalance,
          "order_value": order_value,
        }
        buytempamount += +buyUpdate.filledAmt

        await buydetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, sellOrder.price, pairData.maker_rebate, io, sellforced_liquidation, sellleverage, sellOrder);
        if (tradedata.length == i && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel') {
          cancel_trade(curorder._id, curorder.userId);
        }
        // positionmatching(data_loop);
        if (forceBreak == true) {
          // console.log('forceBreak')
          return true;
        }
      }
    }
  }

}

async function sellmatchingprocess(curorder, tradedata, pairData, io) {
  var sellOrder = curorder,
    sellorderid = sellOrder._id,
    selluserid = sellOrder.userId,
    sellleverage = sellOrder.leverage,
    sellAmt = rounds(Math.abs(sellOrder.quantity)),
    forceBreak = false,
    selleramount = rounds(sellOrder.quantity)
  selleramount1 = rounds(sellOrder.quantity)
  sellerforced_liquidation = '';
  selltempamount = 0;
  sell_res_len = tradedata.length;
  console.log(sell_res_len, 'sell_res_len')
  for (var i = 0; i < tradedata.length; i++) {
    var data_loop = tradedata[i];
    sellAmt = rounds(Math.abs(sellOrder.quantity) - selltempamount);
    // console.log('loop starting',i);
    if (sellAmt == 0 || forceBreak == true)
      return

    var ii = i,
      buyOrder = data_loop,
      buyorderid = buyOrder._id,
      buyuserid = buyOrder.userId,
      buyleverage = buyOrder.leverage,
      buyforced_liquidation = buyOrder.forced_liquidation,
      buyAmt = rounds(buyOrder.quantity - buyOrder.filledAmount),
      silentBreak = false,
      buyUpdate = {},
      sellUpdate = {},
      buyerBal = 0,
      sellerBal = 0,
      orderSocket = {}
    selleramount = selleramount - buyAmt;

    // console.log(Math.abs(sellAmt),'sellamount');
    // console.log(buyAmt,'buyamount');
    if (Math.abs(sellAmt) == Math.abs(buyAmt)) {
      buyUpdate = {
        status: 1,
        filledAmt: Math.abs(sellAmt)
      }
      sellUpdate = {
        status: 1,
        filledAmt: buyAmt
      }
      forceBreak = true
    } else if (Math.abs(sellAmt) > Math.abs(buyAmt)) {
      buyUpdate = {
        status: 1,
        filledAmt: buyAmt
      }
      sellUpdate = {
        status: 2,
        filledAmt: buyAmt
      }
      sellAmt = rounds(+sellAmt - +buyAmt)
    } else if (Math.abs(sellAmt) < Math.abs(buyAmt)) {
      buyUpdate = {
        status: 2,
        filledAmt: Math.abs(sellAmt)
      }
      sellUpdate = {
        status: 1,
        filledAmt: Math.abs(sellAmt)
      }
      forceBreak = true
    } else {
      silentBreak = true
    }
    var returnbalance = 0;
    if (+buyOrder.price > +sellOrder.price) {
      var return_price = +buyOrder.price - +sellOrder.price;
      returnbalance = +buyUpdate.filledAmt * +return_price;
      returnbalance = parseFloat(returnbalance).toFixed(8);
    }

    if (silentBreak == false) {

      var order_value = parseFloat(buyUpdate.filledAmt * sellOrder.price).toFixed(8);
      var fee = parseFloat(buyUpdate.filledAmt) * parseFloat(pairData.maker_rebate) / 100;

      var tempdata = {
        "pair": ObjectId(pairData._id),
        "firstCurrency": pairData.first_currency,
        "secondCurrency": pairData.second_currency,
        "buyuserId": ObjectId(buyuserid),
        "user_id": ObjectId(buyuserid),
        "selluserId": ObjectId(selluserid),
        "sellId": ObjectId(sellorderid),
        "buyId": ObjectId(buyorderid),
        "filledAmount": +(buyUpdate.filledAmt).toFixed(8),
        "Price": +buyOrder.price,
        "pairname": curorder.pairName,
        "status": "filled",
        "Type": "buy",
        "Fees": parseFloat(fee).toFixed(8),
        "created_at": new Date(),
        "beforeBalance": buyOrder.beforeBalance,
        "afterBalance": buyOrder.afterBalance,
        "order_value": order_value,
      }
      selltempamount += +sellUpdate.filledAmt;
      // console.log(tempdata,'before sell update');
      await selldetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, sellOrder.price, pairData.taker_fees, io, sellerforced_liquidation, sellleverage, curorder);
      if (tradedata.length == i && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel') {
        cancel_trade(curorder._id, curorder.userId);
      }
      if (forceBreak == true) {
        // console.log("true");
        // getrateandorders(curorder.pair,userid);
        return true
      }
    }
    if (forceBreak == true) {
      // getrateandorders(curorder.pair,userid);
      return true
    }
  }
}

cron.schedule('*/5 * * * * *', async (req, res) => {

  var pairdetails = await spotpairs.find({ "botstatus": "On" });
  if (pairdetails.length > 0) {
    for (var ia = 0; ia < pairdetails.length; ia++) {
      var markprice = pairdetails[ia].markprice;
      // console.log(pairdetails[ia]._id, 'markprice', markprice, pairdetails[ia].tiker_root);
      if (markprice != "") {

        // console.log("first if")
        var buytempData = await spottradeTable.find({
          pairName: pairdetails[ia].tiker_root,
          buyorsell: 'sell',
          userId: { $ne: ObjectId("5e567694b912240c7f0e4299") },
          price: { $lte: (parseFloat(markprice)) },
          '$or': [{ "status": '0' }, { "status": '2' }]
        }).limit(100).sort({ "price": 1 });
        
        if (pairdetails[ia].tiker_root == 'BTCUSDT') {
          console.log(buytempData, 'buytempData---BTCUSDT')
        }
        // console.log(buytempData, 'buytempData')
        if (buytempData.length > 0) {
          // console.log("here goingn-------------------------")
          for (var is = 0; is < buytempData.length; is++) {
            // console.log("next goingn")
            var _id = buytempData[is]._id;
            var userId = buytempData[is].userId;
            var buyorsell = buytempData[is].buyorsell;
            var pairName = buytempData[is].pairName;
            var quantity = buytempData[is].quantity - buytempData[is].filledAmount;
            var price = parseFloat(buytempData[is].price);
            var leverage = buytempData[is].leverage;
            var order_value = quantity * price;
            var firstcurrency = pairdetails[ia].first_currency;
            var secondcurrency = pairdetails[ia].second_currency;
            var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
            var float = (pairName == 'BTCUSDT' || pairName == 'ETHUSDT') ? 2 : 8;
            const newtradeTable = new spottradeTable({
              quantity: parseFloat(quantity).toFixed(8),
              price: parseFloat(price).toFixed(float),
              trigger_price: 0,
              orderValue: order_value,
              userId: oppuser_id,
              pair: pairdetails[ia]._id,
              pairName: pairName,
              beforeBalance: 0,
              afterBalance: 0,
              firstCurrency: firstcurrency,
              secondCurrency: secondcurrency,
              orderType: "Market",
              stopstatus: '0',
              buyorsell: "buy",
              pairid: _id,
              trailstop: '1',
              orderDate: new Date(),
              status: 1 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
            });
            var curorder = await newtradeTable.save();

            var buyfee = parseFloat(order_value) * parseFloat(pairdetails[ia].taker_fees) / 100;

            var buytempdata = {
              "pair": ObjectId(pairdetails[ia]._id),
              "firstCurrency": firstcurrency,
              "secondCurrency": secondcurrency,
              "buyuserId": oppuser_id,
              "user_id": oppuser_id,
              "selluserId": ObjectId(userId),
              "sellId": ObjectId(_id),
              "buyId": ObjectId(curorder._id),
              "filledAmount": +(quantity).toFixed(8),
              "Price": +price,
              "pairname": pairName,
              "status": "filled",
              "Type": "buy",
              "Fees": parseFloat(buyfee).toFixed(8),
              "created_at": new Date(),
              "beforeBalance": 0,
              "afterBalance": 0,
              "order_value": order_value,
            }

            var selltempdata = {
              "pair": ObjectId(pairdetails[ia]._id),
              "firstCurrency": firstcurrency,
              "secondCurrency": secondcurrency,
              "buyuserId": oppuser_id,
              "user_id": userId,
              "selluserId": ObjectId(userId),
              "sellId": ObjectId(_id),
              "buyId": ObjectId(curorder._id),
              "filledAmount": +(quantity).toFixed(8),
              "Price": +price,
              "pairname": pairName,
              "status": "filled",
              "Type": "sell",
              "Fees": parseFloat(buyfee).toFixed(8),
              "created_at": new Date(),
              "beforeBalance": 0,
              "afterBalance": 0,
              "order_value": order_value,
            }
            console.log("-----buytempData[is].orderValue", buytempData[is].orderValue)
            var totalVal = parseFloat(buytempData[is].orderValue);
            var taker_fees = parseFloat(pairdetails[ia].taker_fees);
            var feeVal = totalVal * taker_fees / 100;
            var fee = feeVal.toFixed(8);
            if (!isNaN(fee)) {
              var updatebaldata = {};
              updatebaldata['spotwallet'] = parseFloat(buytempData[is].orderValue) - parseFloat(fee);
              console.log("-------updatebaldata", updatebaldata)
              let updateBuyval = await Assets.findOneAndUpdate({
                currencySymbol: secondcurrency,
                userId: ObjectId(userId)
              }, {
                "$inc": updatebaldata
              }, {
                new: true,
                "fields": {
                  spotwallet: 1
                }
              });
              var balval = {
                Currency: secondcurrency,
                latestbalance: updateBuyval.spotwallet
              }
              socketio.emit('adminliquidity-' + userId.toString(), balval);
            }


            await spottradeTable.findOneAndUpdate({ _id: ObjectId(curorder._id) }, {
              "$set": {
                "status": "1",
                "filled": buytempdata
              },
              "$inc": {
                "filledAmount": parseFloat(quantity)
              }
            }, { new: true, "fields": { status: 1, filled: 1 } });

            await spottradeTable.findOneAndUpdate({ _id: ObjectId(_id) }, { "$set": { "status": "1", "filled": selltempdata }, "$inc": { "filledAmount": parseFloat(quantity) } }, { new: true, "fields": { status: 1, filled: 1 } });
            gettradedata(firstcurrency, secondcurrency, socketio)
            getusertradedata(userId, firstcurrency, secondcurrency)
            getSpotPriceValue({ firstCurrency: firstcurrency, secondCurrency: secondcurrency })
          }
        }

        var selltempData = await spottradeTable.find({
          pairName: pairdetails[ia].tiker_root, buyorsell: 'buy', userId: { $ne: ObjectId("5e567694b912240c7f0e4299") },
          price: { $gte: (parseFloat(markprice)) }, '$or': [{ "status": '0' }, { "status": '2' }]
        }).limit(100).sort({ "price": 1 });

        if (selltempData.length > 0) {
          // console.log("here goingn")
          for (var is = 0; is < selltempData.length; is++) {
            // console.log("next goingn")
            var _id = selltempData[is]._id;
            var userId = selltempData[is].userId;
            var buyorsell = selltempData[is].buyorsell;
            var pairName = selltempData[is].pairName;
            var quantity = selltempData[is].quantity - selltempData[is].filledAmount;
            var price = selltempData[is].price;
            var leverage = selltempData[is].leverage;
            var order_value = quantity * price;
            var firstcurrency = pairdetails[ia].first_currency;
            var secondcurrency = pairdetails[ia].second_currency;
            var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
            var float = (pairName == 'BTCUSDT' || pairName == 'ETHUSDT') ? 2 : 8;
            const newtradeTable = new spottradeTable({
              quantity: parseFloat(quantity).toFixed(8),
              price: parseFloat(price).toFixed(float),
              trigger_price: 0,
              orderValue: order_value,
              userId: oppuser_id,
              pair: pairdetails[ia]._id,
              pairName: pairName,
              beforeBalance: 0,
              afterBalance: 0,
              firstCurrency: firstcurrency,
              secondCurrency: secondcurrency,
              orderType: "Market",
              stopstatus: '0',
              buyorsell: "sell",
              pairid: _id,
              trailstop: '1',
              orderDate: new Date(),
              status: 1 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
            });
            var curorder = await newtradeTable.save();

            var buyfee = parseFloat(order_value) * parseFloat(pairdetails[ia].taker_fees) / 100;

            var buytempdata = {
              "pair": ObjectId(pairdetails[ia]._id),
              "firstCurrency": firstcurrency,
              "secondCurrency": secondcurrency,
              "buyuserId": userId,
              "user_id": userId,
              "selluserId": ObjectId(oppuser_id),
              "sellId": ObjectId(curorder._id),
              "buyId": ObjectId(_id),
              "filledAmount": +(quantity).toFixed(8),
              "Price": +price,
              "pairname": pairName,
              "status": "filled",
              "Type": "buy",
              "Fees": parseFloat(buyfee).toFixed(8),
              "created_at": new Date(),
              "beforeBalance": 0,
              "afterBalance": 0,
              "order_value": order_value,
            }

            var selltempdata = {
              "pair": ObjectId(pairdetails[ia]._id),
              "firstCurrency": firstcurrency,
              "secondCurrency": secondcurrency,
              "buyuserId": userId,
              "user_id": oppuser_id,
              "selluserId": ObjectId(oppuser_id),
              "sellId": ObjectId(curorder._id),
              "buyId": ObjectId(_id),
              "filledAmount": +(quantity).toFixed(8),
              "Price": +price,
              "pairname": pairName,
              "status": "filled",
              "Type": "sell",
              "Fees": parseFloat(buyfee).toFixed(8),
              "created_at": new Date(),
              "beforeBalance": 0,
              "afterBalance": 0,
              "order_value": order_value,
            }

            var qtyVal = parseFloat(quantity);
            var maker_rebate = parseFloat(pairdetails[ia].maker_rebate);
            var feeVal = qtyVal * maker_rebate / 100;
            var fee = feeVal.toFixed(8);

            if (!isNaN(fee)) {
              var updatebaldata = {};
              updatebaldata['spotwallet'] = parseFloat(qtyVal) - parseFloat(fee);
              var updateVal = await Assets.findOneAndUpdate({
                currencySymbol: firstcurrency,
                userId: ObjectId(userId)
              }, {
                "$inc": updatebaldata
              }, {
                new: true,
                "fields": {
                  spotwallet: 1
                }
              });
              var balval = {
                Currency: firstcurrency,
                latestbalance: updateVal.spotwallet
              }
              socketio.emit('adminliquidity-' + userId.toString(), balval);

            }

            await spottradeTable.findOneAndUpdate({ _id: ObjectId(curorder._id) }, { "$set": { "status": "1", "filled": buytempdata }, "$inc": { "filledAmount": parseFloat(quantity) } }, { new: true, "fields": { status: 1, filled: 1 } });

            await spottradeTable.findOneAndUpdate({ _id: ObjectId(_id) }, { "$set": { "status": "1", "filled": selltempdata }, "$inc": { "filledAmount": parseFloat(quantity) } }, { new: true, "fields": { status: 1, filled: 1 } });
            gettradedata(firstcurrency, secondcurrency, socketio)
            getusertradedata(userId, firstcurrency, secondcurrency)
            getSpotPriceValue({ firstCurrency: firstcurrency, secondCurrency: secondcurrency })
          }
        }

      }
    }
  }
});

function tradematching(curorder, io) {
  // console.log(curorder.timeinforcetype,"--------tradematching----------------")
  //Fill or kill order type
  if (curorder.timeinforcetype == "FillOrKill") {
    // console.log('filleorkill???????????????');
    var datas = {
      '$or': [{ "status": '2' }, { "status": '0' }, { "bintype": false }],
      'userId': { $ne: ObjectId(curorder.userId) },
      'pairName': (curorder.pairName)
    }, sort;

    if (curorder.buyorsell == 'buy') {
      datas['buyorsell'] = 'sell'
      datas['price'] = { $lte: curorder.price }

      sort = { "price": 1 }
    } else {
      datas['buyorsell'] = 'buy'
      datas['price'] = { $gte: curorder.price }
      sort = { "price": -1 }
    }

    spottradeTable.aggregate([
      { $match: datas },
      {
        $group: {
          "_id": null,
          'quantity': { $sum: '$quantity' },
          'filledAmount': { $sum: '$filledAmount' }
        }
      },
      { $sort: sort },
      { $limit: 10 },
    ]).exec((tradeerr, tradedata) => {
      // console.log(tradedata,'----------tradedata------------------')
      if (tradedata.length > 0) {
        var quantity = tradedata[0].quantity;
        var filledAmount = tradedata[0].filledAmount;
        var pendingamount = parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
        if (Math.abs(curorder.quantity) > pendingamount) {
          var quant = parseFloat(Math.abs(curorder.quantity)) - parseFloat(pendingamount);

          var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC"]
          if ((curarray.includes(curorder.pairName))) {
            var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
            var newbuyorsell = (curorder.buyorsell == 'buy') ? 'sell' : 'buy';
            var quant = (curorder.buyorsell == 'buy') ? quant : (quant);
            order_placing(curorder.orderType, newbuyorsell, curorder.price, Math.abs(quant), curorder.leverage, curorder.pairName, oppuser_id);
          }
          else {
            cancel_trade(curorder._id, curorder.userId);
          }
        }
      }
      else {
        cancel_trade(curorder._id, curorder.userId);

      }
    });
  }
  var datas = {
    '$or': [{ "status": '2' }, { "status": '0' }],
    'userId': { $ne: ObjectId(curorder.userId) },
    'pairName': (curorder.pairName)
  }, sort;

  if (curorder.buyorsell == 'buy') {
    datas['buyorsell'] = 'sell'
    datas['price'] = { $lte: curorder.price }
    sort = { "price": 1 }
  } else {
    datas['buyorsell'] = 'buy'
    datas['price'] = { $gte: curorder.price }
    sort = { "price": -1 }
  }
  if (curorder.userId.toString() == "5e567694b912240c7f0e4299") {
    datas['price'] = curorder.price
  }
  // console.log(datas, 'datas-----------------------');
  spottradeTable.aggregate([
    { $match: datas },
    { $sort: sort },
    { $limit: 50 },
  ]).exec((tradeerr, tradedata) => {
    spotpairs.findOne({ tiker_root: (curorder.pairName) }).exec(function (pairerr, pairData) {
      // console.log('perpetual');
      if (tradeerr)
        console.log({ status: false, message: tradeerr });
      else
        console.log(tradedata, 'tradedata')
      if (tradedata.length > 0) {
        if (curorder.postOnly) {
          cancel_trade(curorder._id, curorder.userId);
        }
        var i = 0;
        // console.log(curorder,'-------CURORDER---------')
        if (curorder.buyorsell == "buy" && curorder.status != "4") {
          // console.log('buy------------>')
          buyside(curorder, tradedata, pairData, io);
        } else if (curorder.buyorsell == "sell" && curorder.status != "4") {
          // console.log('curorder------------>', curorder)
          // console.log('sell------------>')
          sellside(curorder, tradedata, pairData, io);
        }
      }
      else {
        console.log("insdine the else function", curorder);
        ///binance api
        if (curorder.timeinforcetype == "ImmediateOrCancel") {
          cancel_trade(curorder._id, curorder.userId);
        }
        gettradedata(curorder.firstCurrency, curorder.secondCurrency, socketio);
        var oppuser_id = ObjectId("5e567694b912240c7f0e4299");

        // if (curorder.orderType == "Limit") {
        // binancebalancecheck(curorder,newbuyorsell)
        // }

        if (curorder.status == '0' && curorder.orderType == 'Market' && curorder.userId.toString() != oppuser_id.toString()) {
          var curarray = ["BTCUSDT", "ETHUSDT", "ETHBTC", "XRPUSDT", "XRPBTC"]
          // if ((curarray.includes(curorder.pairName))) {
          if (pairData.botstatus == "On") {

            // console.log('hereddd', curorder);
            // var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
            var newbuyorsell = curorder.buyorsell;
            order_placing(curorder.orderType, newbuyorsell, curorder.price, Math.abs(curorder.quantity), curorder.pairName, oppuser_id);
            //           binancebalancecheck(curorder,newbuyorsell)


          }
        }

      }
    });
  });
}

cron.schedule('* * * * *', (req, res) => {
  // console.log("cron workingg for the binance status");
  spottradeTable.find({ bintype: true }).then(binanceorders => {
    // console.log("binanceorders  length", binanceorders.length);
    if (binanceorders.length) {
      var i = 0;
      checkstatus(binanceorders[0], function () {
        // console.log("first");
        if (i === binanceorders.length - 1) {
          callBackResponseImport();
        } else {
          i += 1;
          if (binanceorders[i]) {
            // console.log("next");
            checkstatus(binanceorders[i]);
          } else {
            callBackResponseImport();
          }
        }
      });
    }
  })
});

async function checkstatus(binanceorders, callBackcheckorder) {
  if (callBackcheckorder) {
    userinfo.callBackofchecking = callBackcheckorder;
  }
  var orderid = parseFloat(binanceorders.binorderid)
  var pair = binanceorders.pairName
  var orderstatus = await client.getOrder({
    symbol: pair,
    orderId: orderid,
  })
  // console.log("orderstatus",orderstatus);
  if (orderstatus.orderId != undefined) {
    var statusfromresponse = orderstatus.status
    var statusfromdb = binanceorders.status
    var binstatus = orderstatus.status == "NEW" ? 0 : orderstatus.status == "FILLED" ? 1 : orderstatus.status == "PARTIALLY_FILLED" ? 2 : orderstatus.status == "CANCELED" ? 3 : 0
    if (binstatus == statusfromdb) {
      userinfo.callBackofchecking()
    } else {
      updatebaldata = { status: binstatus };
      spottradeTable.findOneAndUpdate(
        { binorderid: binanceorders.binorderid },
        { $set: updatebaldata },
        { new: true },
        function (balerr, baldata) {
          if (baldata) {
            console.log("status have been updated from the response");

            console.log("binance id updated in db");
            if (baldata.status == "1") {
              var newupbal = parseFloat(Math.abs(baldata.orderValue))
              var newquant = parseFloat(Math.abs(baldata.quantity))
              var updatebaldata = {};

              var currency = (baldata.buyorsell == 'sell') ? baldata.secondCurrency : baldata.firstCurrency
              var userId = baldata.userId
              updatebaldata["spotwallet"] = (baldata.buyorsell == 'sell') ? newupbal : newquant;

              console.log(updatebaldata, 'updatebaldata')
              console.log(currency, 'currency')
              Assets.findOneAndUpdate({ currencySymbol: currency, userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
                // console.log(balerr,'balerriiiii')
                console.log("status balance updatesdd");
                // console.log(baldata,'baldata')

              });
            }
            if (orderstatus.status == "FILLED") {
              console.log("orderstatus", orderstatus);
              if (orderstatus.fills) {
                var filledarray = orderstatus.fills
                var j = 0;
                filledarray[0].binanceorders = binanceorders;

                createfilledarray(filledarray[0], function () {
                  // console.log("first");
                  if (j === filledarray.length - 1) {
                    callBackResponseImport();
                  } else {
                    j += 1;
                    filledarray[j].binanceorders = binanceorders;
                    if (filledarray[j]) {
                      createfilledarray(filledarray[j]);
                    } else {
                      // callBackResponseImport();
                      userinfo.callBackofchecking()
                    }
                  }
                });
              } else {
                updatebaldata = { filledAmount: orderstatus.executedQty };
                spottradeTable.findOneAndUpdate(
                  { binorderid: binanceorders.binorderid },
                  { $set: updatebaldata },
                  { new: true },
                  function (balerr, baldata) {
                    console.log("binance PARTIALLY FILLEDS updated in db");
                    userinfo.callBackofchecking()

                  })
              }


            } else if (orderstatus.status == "PARTIALLY_FILLED") {
              updatebaldata = { filledAmount: orderstatus.executedQty };
              spottradeTable.findOneAndUpdate(
                { binorderid: binanceorders.binorderid },
                { $set: updatebaldata },
                { new: true },
                function (balerr, baldata) {
                  console.log("binance PARTIALLY FILLEDS updated in db");
                  userinfo.callBackofchecking()

                })

            }
            else {
              userinfo.callBackofchecking()
            }
          }
        })
    }
  }
}


function createfilledarray(filledarray, callBackfilledarray) {
  if (callBackfilledarray) {
    userinfo.callBackfilleddone = callBackfilledarray;
  }
  var typeoftrade = filledarray.binanceorders.side ? filledarray.binanceorders.side : "buy"
  var pirnamee = filledarray.binanceorders.symbol ? filledarray.binanceorders.symbol : ""
  var inlowertrade = typeoftrade.toLowerCase()
  var tempdata = {
    "filledAmount": filledarray.qty,
    "Price": filledarray.price,
    "uniqueid": Math.floor(Math.random() * 1000000000),
    "pairname": pirnamee,
    "status": "filled",
    "Type": inlowertrade,
    "created_at": new Date()
  }
  spottradeTable.findOneAndUpdate({ binorderid: filledarray.binanceorders.binorderid }, { "$set": { "filled": tempdata }, "$inc": { "filledAmount": filledarray.qty } }, { new: true, "fields": { filled: 1 } }, function (buytemp_err, buytempData) {
    if (buytempDat) {
      userinfo.callBackfilleddone()
    }
  })
}


async function binancebalancecheck(curorder, newbuyorsell) {
  var curorder = curorder
  var newbuyorsell = newbuyorsell
  var currency
  var userordervalue
  if (curorder.buyorsell == "buy") {
    currency = curorder.secondCurrency
    userordervalue = parseFloat(curorder.orderValue)
  }
  if (curorder.buyorsell == "sell") {
    currency = curorder.firstCurrency
    userordervalue = parseFloat(curorder.quantity)
  }
  var useraccountinfo = await client.accountInfo()
  // console.log(await client.accountInfo())
  console.log("currency", currency);
  console.log("userordervalue", userordervalue);
  var allbalances = useraccountinfo.balances
  var btcindex = allbalances.findIndex(x => (x.asset) === currency);
  console.log("btcindex", btcindex);
  if (btcindex != -1) {
    // console.log("allbalances",allbalances[btcindex]);
    console.log("indie btcscscin");

    var currencybalanceinbinance = parseFloat(allbalances[btcindex].free)
    console.log("currencybalanceinbinance", currencybalanceinbinance);
    if (parseFloat(currencybalanceinbinance) > parseFloat(userordervalue)) {
      console.log("inside the biannce order");
      binanceorderplacing(curorder, newbuyorsell)
    } else {
      if (curorder.orderType == "Market") {
        var type = curorder.buyorsell;
        var trade_ids = curorder._id;
        var userId = curorder.userId;
        var filledAmt = curorder.filledAmount;
        var status = curorder.status;
        var quantity = curorder.quantity;
        var price = curorder.price;
        var t_firstcurrencyId = curorder.firstCurrency;
        var t_secondcurrencyId = curorder.secondCurrency;
        var beforeBalance = curorder.beforeBalance;
        var afterBalance = curorder.afterBalance;

        quantity = parseFloat(quantity) - parseFloat(filledAmt);

        var order_value = parseFloat(quantity * price).toFixed(8);

        async.parallel({
          // update balance
          data1: function (cb) {
            var updatebaldata = {};

            var currency = (type == 'buy') ? t_secondcurrencyId : t_firstcurrencyId
            updatebaldata["spotwallet"] = (type == 'buy') ? order_value : quantity;
            console.log(updatebaldata, 'updatebaldata')
            console.log(currency, 'currency')
            Assets.findOneAndUpdate({ currencySymbol: currency, userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
              // console.log(balerr,'balerriiiii')
              // console.log(baldata,'baldata')

            });
          },
          data2: function (cb) {
            var updatedata = { "status": '3' }
            spottradeTable.findOneAndUpdate({ _id: ObjectId(trade_ids) }, { "$set": updatedata }, { new: true, "fields": { _id: 1 } }, function (upErr, upRes) {
              if (upRes) {
                //res.json({status:true,message:"Your Order cancelled successfully.",notify_show:'yes'});
                gettradedata(t_firstcurrencyId, t_secondcurrencyId, socketio)
              }
              else {
                res.json({ status: false, message: "Due to some error occurred,While Order cancelling" });
              }
            });
          }
        }, function (err, results) {

        });
      }
    }

  }
}



async function binanceorderplacing(curorder, newbuyorsell) {
  console.log("insdie the binance order placing", curorder);
  var withmarkupprice
  if (curorder.buyorsell == "buy") {
    // (currentprice+currentprice * markup/100)
    withmarkupprice = parseFloat(curorder.price) - parseFloat(curorder.price) * parseFloat(curorder.markuppercentage) / 100
  }
  if (curorder.buyorsell == "sell") {
    withmarkupprice = parseFloat(curorder.price) + parseFloat(curorder.price) * parseFloat(curorder.markuppercentage) / 100

  }

  var ordertype = curorder.orderType
  // var price =parseFloat(curorder.price)
  var price = parseFloat(withmarkupprice)

  // console.log("curorder.price in binance order" , curorder.price);
  console.log("withmarkupprice in binance order", withmarkupprice);
  var quantity = parseFloat(curorder.quantity)
  var pairname = curorder.pairName
  var buyorsell = curorder.buyorsell
  var buyorsellinupper = buyorsell.toUpperCase()
  var minnegot = parseFloat(quantity) * parseFloat(price)
  console.log("min negototminnegot", minnegot);
  var minvalue = curorder.pairName == "ETHBTC" ? 0.0001 : curorder.pairName == "XRPBTC" ? 0.0001 : 10
  console.log("minvalueee", minvalue);
  if (parseFloat(minnegot) >= minvalue) {

    if (curorder.orderType == "Limit") {
      var neworder = await client.order({
        symbol: pairname,
        side: buyorsellinupper,
        quantity: quantity,
        price: price,
      })
      console.log("bianceorder", neworder);
      if (neworder.orderId != undefined) {
        updatebaldata = { bintype: true, binorderid: neworder.orderId };
        spottradeTable.findOneAndUpdate(
          { _id: curorder._id },
          { $set: updatebaldata },
          { new: true },
          function (balerr, baldata) {
            if (baldata) {
              console.log("binance id updated in db");
            }
          })
      }
    }
    if (curorder.orderType == "Market") {
      var neworder = await client.order({
        symbol: pairname,
        side: buyorsellinupper,
        quantity: quantity,
        type: "MARKET"
      })
      console.log("bianceorder market ORDER */********", neworder);

      if (neworder.orderId != undefined) {
        var binstatusresu = neworder.status == "FILLED" ? "1" : "0"
        var filledfromresult = parseFloat(neworder.executedQty)
        updatebaldata = { bintype: true, binorderid: neworder.orderId, status: binstatusresu, filledAmount: filledfromresult };
        spottradeTable.findOneAndUpdate(
          { _id: curorder._id },
          { $set: updatebaldata },
          { new: true },
          function (balerr, baldata) {
            if (baldata) {
              console.log("binance id updated in db");
              if (baldata.status == "1") {
                // var newupbal = parseFloat(baldata.orderValue)
                var newupbal = parseFloat(Math.abs(baldata.orderValue))
                var newquant = parseFloat(Math.abs(baldata.quantity))
                var updatebaldata = {};

                var currency = (baldata.buyorsell == 'sell') ? baldata.secondCurrency : baldata.firstCurrency
                var userId = baldata.userId
                updatebaldata["spotwallet"] = (baldata.buyorsell == 'sell') ? newupbal : newquant;

                console.log(updatebaldata, 'updatebaldata')
                console.log(currency, 'currency')
                Assets.findOneAndUpdate({ currencySymbol: currency, userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { spotwallet: 1 } }, function (balerr, baldata) {
                  console.log(balerr, 'balerriiiii')
                  console.log("tarde done from binance");
                  console.log(baldata, 'baldata')

                });

              }
            }
          })

      }
    }
  }

}


router.get("/binanceorder", async (req, res) => {
  // var orderplaced=  await client.order({
  //    symbol: 'ETHUSDT',
  //    side: 'SELL',
  //    quantity: 0.025,
  //    price: 400,
  //  })
  //  console.log("orderplacedddsds",orderplaced);

  console.log(
    await client.getOrder({
      symbol: 'XRPUSDT',
      orderId: 884546984,
    }),
  )
})

//
// router.get("/binancebalance", (req,res)=>{
//   // binance.balance((error, balances) => {
//   //   if ( error ) return console.error(error);
//   //   console.info("balances()", balances);
//   //   console.info("ETH balance: ", balances.ETH.available);
//   // });
//   let quantity = 0.01, price =4 ;
// binance.sell("ETHUSDT", quantity, price, {type:'LIMIT'}, (error, response) => {
//   // console.log("errorrr",error);
//   console.info("Limit Buy response", response);
//   console.info("order id: " + response.orderId);
// });
// })

function buyside(curorder, tradedata, pairData, io) {
  console.log("-----tradedata", tradedata)
  var tradePos = 0;
  var curtradequan = parseFloat(Math.abs(curorder.quantity)) - parseFloat(Math.abs(curorder.filledAmount));
  var tradequan = parseFloat(Math.abs(tradedata[0].quantity)) - parseFloat(Math.abs(tradedata[0].filledAmount));
  var tradequan1 = parseFloat(Math.abs(tradedata[0].quantity)) - parseFloat(Math.abs(tradedata[0].filledAmount));
  tradeinfo.tradequan1 = tradequan;
  tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan)) ? Math.abs(tradequan) : (Math.abs(curtradequan) > Math.abs(tradequan)) ? Math.abs(tradequan) : (Math.abs(curtradequan) < Math.abs(tradequan)) ? Math.abs(tradequan) : 0;

  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails = tradedata[0];

  buymatchingtrade(tradetails, function () {
    if (tradePos === tradedata.length - 1 || parseFloat(tradeinfo.tradequan1) >= parseFloat(curtradequan)/* parseFloat(tradequan1) == parseFloat(curtradequan) */) {
      callBackResponseImport();
    } else {
      tradePos += 1;
      var tradequan1 = parseFloat(tradedata[tradePos].quantity) - parseFloat(tradedata[tradePos].filledAmount);
      curtradequan -= parseFloat(Math.abs(tradeinfo.filledamount));
      tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan1)) ? Math.abs(tradequan1) : (Math.abs(curtradequan) > Math.abs(tradequan1)) ? Math.abs(tradequan1) : (Math.abs(curtradequan) < Math.abs(tradequan1)) ? Math.abs(tradequan1) : 0;

      tradedata[tradePos].pairData = pairData;
      curorder.quantity = curtradequan
      tradedata[tradePos].curorder = curorder;
      tradedata[tradePos].quantity = tradequan1;
      var tradetails = tradedata[tradePos];

      if (tradedata[tradePos]) {
        buymatchingtrade(tradetails);
      } else {
        callBackResponseImport();
      }
    }

  });
}

function sellside(curorder, tradedata, pairData, io) {
  console.log("-----tradedata-----sellside", tradedata)
  var tradePos = 0;
  var curtradequan = parseFloat(Math.abs(curorder.quantity)) - parseFloat(Math.abs(curorder.filledAmount));
  var tradequan = parseFloat(tradedata[0].quantity) - parseFloat(tradedata[0].filledAmount);
  tradeinfo.tradequan1 = tradequan;

  tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan)) ? Math.abs(tradequan) : (Math.abs(curtradequan) > Math.abs(tradequan)) ? Math.abs(tradequan) : (Math.abs(curtradequan) < Math.abs(tradequan)) ? Math.abs(tradequan) : 0;

  // console.log(tradequan, 'tradequan')
  // console.log(curtradequan, 'curtradequan')
  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails = tradedata[0];

  sellmatchingtrade(tradetails, function () {
    if (tradePos === tradedata.length - 1 || parseFloat(tradeinfo.tradequan1) >= parseFloat(curtradequan)/*  parseFloat(tradeinfo.tradequan1) == parseFloat(curtradequan) */) {
      console.log('in');
      callBackResponseImport();
    } else {
      tradePos += 1;

      var tradequan1 = parseFloat(tradedata[tradePos].quantity) - parseFloat(tradedata[tradePos].filledAmount);
      tradeinfo.tradequan1 = tradequan1;
      curtradequan -= parseFloat(Math.abs(tradeinfo.filledamount));

      tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan1)) ? Math.abs(tradequan1) : (Math.abs(curtradequan) > Math.abs(tradequan1)) ? Math.abs(tradequan1) : (Math.abs(curtradequan) < Math.abs(tradequan1)) ? Math.abs(tradequan1) : 0;
      // console.log(tradequan1, 'tradequan1')
      // console.log(curtradequan, 'curtradequan11')
      tradedata[tradePos].pairData = pairData;
      curorder.quantity = curtradequan
      tradedata[tradePos].curorder = curorder;
      tradedata[tradePos].quantity = tradequan1;
      var tradetails = tradedata[tradePos];

      if (tradedata[tradePos]) {
        sellmatchingtrade(tradetails);
      } else {
        callBackResponseImport();
      }
    }

  });
}
function buymatchingtrade(tradedata, callBackOne) {
  var curorder = tradedata.curorder;
  var buyOrder = curorder,
    buyAmt = rounds(buyOrder.quantity),
    buyorderid = buyOrder._id,
    buyuserid = buyOrder.userId,
    buyleverage = buyOrder.leverage,
    buyforced_liquidation = buyOrder.forced_liquidation,
    buyeramount = rounds(buyOrder.quantity),
    buyeramount1 = rounds(buyOrder.quantity),
    buytempamount = 0;

  var data_loop = tradedata;
  buyAmt = rounds(buyOrder.quantity);
  // var ii = i,
  sellOrder = data_loop,
    sellorderid = sellOrder._id,
    selluserid = sellOrder.userId,
    sellleverage = sellOrder.leverage,
    sellforced_liquidation = sellOrder.forced_liquidation,
    sellAmt = rounds(+sellOrder.quantity),
    buyUpdate = {},
    sellUpdate = {};
  if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
    // console.log("amount eq");
    buyUpdate = {
      status: '1',
      filledAmt: Math.abs(sellAmt)
    }
    sellUpdate = {
      status: '1',
      filledAmt: buyAmt
    }
  } else if (Math.abs(buyAmt) > Math.abs(sellAmt)) {
    // console.log("else buy gt");
    buyUpdate = {
      status: '2',
      filledAmt: Math.abs(sellAmt)
    }
    sellUpdate = {
      status: '1',
      filledAmt: Math.abs(sellAmt)
    }
    buyAmt = rounds(+buyAmt - +sellAmt)
  } else if (Math.abs(buyAmt) < Math.abs(sellAmt)) {
    // console.log("else sell gt");
    buyUpdate = {
      status: '1',
      filledAmt: buyAmt
    }
    sellUpdate = {
      status: '2',
      filledAmt: buyAmt
    }
  }
  var order_value = parseFloat(buyUpdate.filledAmt * sellOrder.price).toFixed(8);
  var fee = parseFloat(buyUpdate.filledAmt) * parseFloat(sellOrder.pairData.maker_rebate) / 100;

  var tempdata = {
    "pair": ObjectId(sellOrder.pairData._id),
    "firstCurrency": sellOrder.pairData.first_currency,
    "secondCurrency": sellOrder.pairData.second_currency,
    "buyuserId": ObjectId(buyuserid),
    "user_id": ObjectId(buyuserid),
    "selluserId": ObjectId(selluserid),
    "sellId": ObjectId(sellorderid),
    "buyId": ObjectId(buyorderid),
    "uniqueid": Math.floor(Math.random() * 1000000000),
    "filledAmount": +(buyUpdate.filledAmt).toFixed(8),
    // "Price": +buyOrder.price,
    "Price": +sellOrder.price,
    "pairname": curorder.pairName,
    "Fees": parseFloat(fee).toFixed(8),
    "status": "filled",
    "Type": "buy",
    "created_at": new Date(),
    "beforeBalance": curorder.beforeBalance,
    "afterBalance": curorder.afterBalance,
    "order_value": order_value,
  }
  buytempamount += +buyUpdate.filledAmt

  buydetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, sellOrder.price, sellOrder.pairData.maker_rebate, socketio, sellforced_liquidation, sellleverage, sellOrder, callBackOne);
  // if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
  // {
  //     cancel_trade(curorder._id,curorder.userId);
  // }
}

function sellmatchingtrade(tradedata, callBackOne) {
  var curorder = tradedata.curorder;
  var sellOrder = curorder,
    sellorderid = sellOrder._id,
    selluserid = sellOrder.userId,
    sellleverage = sellOrder.leverage,
    sellAmt = rounds(Math.abs(sellOrder.quantity)),
    selleramount = rounds(sellOrder.quantity)
  selleramount1 = rounds(sellOrder.quantity)
  sellerforced_liquidation = (sellOrder.forced_liquidation)
  selltempamount = 0;
  sell_res_len = tradedata.length;
  var data_loop = tradedata;
  sellAmt = rounds(Math.abs(sellOrder.quantity) - selltempamount);

  // var ii                   = i,
  buyOrder = data_loop,
    buyorderid = buyOrder._id,
    buyuserid = buyOrder.userId,
    buyleverage = buyOrder.leverage,
    buyforced_liquidation = buyOrder.forced_liquidation,
    buyAmt = rounds(buyOrder.quantity),
    buyUpdate = {},
    sellUpdate = {},

    selleramount = selleramount - buyAmt;
  console.log(sellAmt, 'sellAmt')
  console.log(buyAmt, 'buyAmt')
  if (Math.abs(sellAmt) == Math.abs(buyAmt)) {
    buyUpdate = {
      status: 1,
      filledAmt: Math.abs(sellAmt)
    }
    sellUpdate = {
      status: 1,
      filledAmt: buyAmt
    }
    forceBreak = true
  } else if (Math.abs(sellAmt) > Math.abs(buyAmt)) {
    buyUpdate = {
      status: 1,
      filledAmt: buyAmt
    }
    sellUpdate = {
      status: 2,
      filledAmt: buyAmt
    }
    sellAmt = rounds(+sellAmt - +buyAmt)
  } else if (Math.abs(sellAmt) < Math.abs(buyAmt)) {
    buyUpdate = {
      status: 2,
      filledAmt: Math.abs(sellAmt)
    }
    sellUpdate = {
      status: 1,
      filledAmt: Math.abs(sellAmt)
    }
  }

  var order_value = parseFloat(buyUpdate.filledAmt * sellOrder.price).toFixed(8);
  var fee = parseFloat(buyUpdate.filledAmt) * parseFloat(buyOrder.pairData.maker_rebate) / 100;


  var tempdata = {
    "pair": ObjectId(buyOrder.pairData._id),
    "firstCurrency": buyOrder.pairData.first_currency,
    "secondCurrency": buyOrder.pairData.second_currency,
    "buyuserId": ObjectId(buyuserid),
    "user_id": ObjectId(buyuserid),
    "selluserId": ObjectId(selluserid),
    "sellId": ObjectId(sellorderid),
    "buyId": ObjectId(buyorderid),
    "filledAmount": +(buyUpdate.filledAmt).toFixed(8),
    "Price": +sellOrder.price,
    "uniqueid": Math.floor(Math.random() * 1000000000),
    "pairname": curorder.pairName,
    "status": "filled",
    "Type": "buy",
    "Fees": parseFloat(fee).toFixed(8),
    "created_at": new Date(),
    "beforeBalance": buyOrder.beforeBalance,
    "afterBalance": buyOrder.afterBalance,
    "order_value": order_value,
  }
  selltempamount += +sellUpdate.filledAmt;

  selldetailsupdate(tempdata, buyorderid, buyUpdate, sellorderid, sellUpdate, selluserid, sellOrder.price, buyOrder.pairData.maker_rebate, socketio, sellerforced_liquidation, sellleverage, curorder, callBackOne);
  // if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
  // {
  //     cancel_trade(curorder._id,curorder.userId);
  // }
}

function callBackResponseImport() {
  tradeinfo.filledamount = 0;
  // console.log('fskdmflskmdflskdmflksmdf');
}

function rounds(n) {
  var roundValue = (+n).toFixed(8)
  return parseFloat(roundValue)
}

router.post('/user-activate', (req, res) => {
  var userid = req.body.userid;
  var updateObj = { active: "Activated" }
  User.findByIdAndUpdate(userid, updateObj, { new: true }, function (err, user) {
    if (user) {
      return res.status(200).json({ message: 'Your Account activated successfully' });
    }
  })
});

router.post('/spotpair-data/', (req, res) => {
  spotpairs.find({}).sort({ priority: -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: 'perpetual' });
    }
  });
});

router.post('/spotorder-history/', (req, res) => {
  spottradeTable.find({ userId: ObjectId(req.body.userid) }).sort({ '_id': -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "orderhistory" });
    }
  });
});




router.post('/spotsearchorder-history/', (req, res) => {
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match['userId'] = userid;
  if (contract != 'All') {
    match['pairName'] = contract;
  }
  if (type != 'All') {
    match['buyorsell'] = type.toLowerCase();
  }
  if (startDate != '' && endDate != '') {
    match['orderDate'] = { $gte: startDate, $lte: endDate };
  }
  else if (startDate != '') {
    match['orderDate'] = { $gte: startDate };
  }
  else if (endDate != '') {
    match['orderDate'] = { $lte: endDate };
  }
  spottradeTable.find(match).sort({ '_id': -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "orderhistory" });
    }
  });
});


router.post('/spotsearchtrade-history/', (req, res) => {
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match['userId'] = userid;
  match['status'] = '1';
  if (contract != 'All') {
    match['pairName'] = contract;
  }
  if (type != 'All') {
    match['buyorsell'] = type.toLowerCase();
  }
  if (startDate != '' && endDate != '') {
    match['orderDate'] = { $gte: startDate, $lte: endDate };
  }
  else if (startDate != '') {
    match['orderDate'] = { $gte: startDate };
  }
  else if (endDate != '') {
    match['orderDate'] = { $lte: endDate };
  }
  spottradeTable.find(match).sort({ '_id': -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "orderhistory" });
    }
  });
});

router.post('/spottrade-history/', (req, res) => {
  spottradeTable.find({ status: 1, userId: ObjectId(req.body.userid) }).sort({ '_id': -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "tradehistory" });
    }
  });
});

router.post('/pending-order/', (req, res) => {
  spottradeTable.find({
    '$or': [{ "status": '0' }, { "status": '2' }],
    userId: ObjectId(req.body.userid)
  }).sort({ '_id': -1 }).then(result => {
    if (result) {
      return res.status(200).json({ status: true, data: result, });
    }
  }).catch((err) => {
    return res.status(200).json({ status: true, data: [] });
  });
});


// function stopordertrigger(pair) {
//   // console.log('stopordertrigger')
//   var tablename = (pair == 'ETHBTC') ? spotpairs : perpetual;
//   var pairn = (pair == 'ETHBTC') ? pair : pair.replace("USDT", "USD");

//   tablename.findOne({ tiker_root: pairn }, { tiker_root: 1, first_currency: 1, second_currency: 1, markprice: 1, maxquantity: 1, minquantity: 1 }, function (err, contractdetails) {
//     if (contractdetails) {
//       var markprice = contractdetails.markprice;
//       if (markprice != '' && !isNaN(markprice)) {
//         //stop order
//         spottradeTable.find({ trigger_ordertype: 'stop', pairName: pair, status: '4', stopstatus: '2', trigger_type: 'Mark', buyorsell: 'sell', trigger_price: { $gte: markprice }, userId: { $ne: ObjectId("5e567694b912240c7f0e4299") } }, function (buytemp_err, buytempData) {
//           // console.log(markprice,'markprice');
//           // console.log(buytempData,'buytempData');
//           if (buytempData) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var price = buytempData[i].price;
//               var trigger_price = buytempData[i].trigger_price;
//               var userId = buytempData[i].userId;
//               var pairName = buytempData[i].pairName;
//               var leverage = buytempData[i].leverage;
//               var quantity = buytempData[i].quantity;
//               var buyorsell = buytempData[i].buyorsell;
//               var orderType = buytempData[i].orderType;
//               var trailstop = buytempData[i].trailstop;
//               var pos_leverage = buytempData[i].leverage;
//               var pos_liqprice = buytempData[i].Liqprice;
//               var curorder = buytempData[i];
//               curorder.status = '0';
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: '2' }, { "$set": { "status": '0', price: trigger_price } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempDat) {
//                 // order_placing('Market','buy',parseFloat(trigger_price).toFixed(2),Math.abs(quantity),pos_leverage,pairName,oppuser_id,trigger_price=0,trigger_type=null,id=0,'',trailstopdistance=0);
//                 tradematching(curorder);
//               });
//             }
//           }
//         });

//         spottradeTable.find({ trigger_ordertype: 'stop', pairName: pair, status: '4', stopstatus: '2', trigger_type: 'Mark', buyorsell: 'buy', trigger_price: { $lte: markprice }, userId: { $ne: ObjectId("5e567694b912240c7f0e4299") } }, function (buytemp_err, buytempData) {
//           if (buytempData) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var price = buytempData[i].price;
//               var trigger_price = buytempData[i].trigger_price;
//               var userId = buytempData[i].userId;
//               var pairName = buytempData[i].pairName;
//               var leverage = buytempData[i].leverage;
//               var quantity = buytempData[i].quantity;
//               var buyorsell = buytempData[i].buyorsell;
//               var orderType = buytempData[i].orderType;
//               var trailstop = buytempData[i].trailstop;
//               var pos_leverage = buytempData[i].leverage;
//               var pos_liqprice = buytempData[i].Liqprice;
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               var curorder = buytempData[i];
//               curorder.status = '0';
//               spottradeTable.findOneAndUpdate({ _id: ObjectId(_id), status: '4', stopstatus: '2' }, { "$set": { "status": '0', price: trigger_price } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempDat) {
//                 //order_placing('Market','sell',parseFloat(trigger_price).toFixed(2),Math.abs(quantity),pos_leverage,pairName,oppuser_id,trigger_price=0,trigger_type=null,id=0,'',trailstopdistance=0);
//                 console.log(curorder, 'tempdata')
//                 tradematching(curorder);
//               });
//             }
//           }
//         });
//         //take profit
//         spottradeTable.findOneAndUpdate({ trigger_ordertype: 'takeprofit', pairName: pair, status: '4', stopstatus: '2', trigger_type: 'Mark', buyorsell: 'sell', trigger_price: { $lte: markprice } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

//         });
//         spottradeTable.findOneAndUpdate({ trigger_ordertype: 'takeprofit', pairName: pair, status: '4', stopstatus: '2', trigger_type: 'Mark', buyorsell: 'buy', trigger_price: { $gte: markprice } }, { "$set": { "status": '0' } }, { new: true, "fields": { status: 1 } }, function (buytemp_err, buytempData) {

//         });


//         spottradeTable.find({ pairName: pair, buyorsell: 'sell', price: { $lt: (parseFloat(markprice - 1)) }, '$or': [{ "status": '0' }, { "status": '2' }] }, function (buytemp_err, buytempData) {
//           if (buytempData) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var userId = buytempData[i].userId;
//               console.log(_id, 'dfsdkfsldkfslkdjflskdjflskdjf');
//               cancel_trade(_id, userId)
//             }
//           }
//         });

//         // spottradeTable.find({pairName:pair,buyorsell:'buy',price:{$gt:(parseFloat(markprice+1))},'$or' : [{"status" : '0'},{"status" : '2'}]},function(buytemp_err,buytempData){
//         //   if(buytempData)
//         //   {
//         //       for (var i=0; i < buytempData.length; i++) {
//         //           var _id           = buytempData[i]._id;
//         //           var userId        = buytempData[i].userId;
//         //           order_placing('Market','buy',parseFloat(price).toFixed(float),Math.abs(quantity),leverage,pairName,oppuser_id,trigger_price=0,trigger_type=null,id=0,'',trailstopdistance=0);
//         //         }
//         //     }
//         //   });


//         spottradeTable.find({ pairName: pair, buyorsell: 'sell', userId: { $ne: ObjectId("5e567694b912240c7f0e4299") }, price: { $lte: (parseFloat(markprice)) }, '$or': [{ "status": '0' }, { "status": '2' }] }).limit(100).sort({ "price": 1 }).exec(function (buytemp_err, buytempData) {

//           if (!buytemp_err && buytempData.length > 0) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var userId = buytempData[i].userId;
//               var buyorsell = buytempData[i].buyorsell;
//               var pairName = buytempData[i].pairName;
//               var quantity = buytempData[i].quantity - buytempData[i].filledAmount;
//               var price = buytempData[i].price;
//               var leverage = buytempData[i].leverage;
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               var float = (pairName == 'BTCUSDT' || pairName == 'ETHUSDT') ? 2 : 8;
//               order_placing('Market', 'buy', parseFloat(price).toFixed(float), Math.abs(quantity), pairName, oppuser_id, trigger_price = 0, trigger_type = null, id = 0, '', trailstopdistance = 0);

//             }
//           }

//         });

//         spottradeTable.find({ pairName: pair, buyorsell: 'sell', userId: ObjectId("5e567694b912240c7f0e4299"), price: { $lte: (parseFloat(markprice)) }, '$or': [{ "status": '0' }, { "status": '2' }] }).limit(100).sort({ "price": 1 }).exec(function (buytemp_err, buytempData) {

//           if (buytempData.length > 0) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var userId = buytempData[i].userId;
//               var buyorsell = buytempData[i].buyorsell;
//               var pairName = buytempData[i].pairName;
//               var quantity = buytempData[i].quantity - buytempData[i].filledAmount;
//               var price = buytempData[i].price;
//               var leverage = buytempData[i].leverage;
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               cancel_trade(_id, userId);

//             }
//           }

//         });

//         spottradeTable.find({ pairName: pair, buyorsell: 'buy', userId: { $ne: ObjectId("5e567694b912240c7f0e4299") }, price: { $gte: (parseFloat(markprice)) }, '$or': [{ "status": '0' }, { "status": '2' }] }).limit(100).sort({ "price": -1 }).exec(function (buytemp_err, buytempData) {
//           if (buytempData) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var userId = buytempData[i].userId;
//               var buyorsell = buytempData[i].buyorsell;
//               var pairName = buytempData[i].pairName;
//               var quantity = buytempData[i].quantity - buytempData[i].filledAmount;
//               var price = buytempData[i].price;
//               var leverage = buytempData[i].leverage;
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               //var index         = position_details.findIndex(x => (x._id) === userId);
//               //console.log(index,'index')
//               var float = (pairName == 'BTCUSDT' || pairName == 'ETHUSDT') ? 2 : 8;
//               order_placing('Market', 'sell', parseFloat(price).toFixed(float), Math.abs(quantity), pairName, oppuser_id, trigger_price = 0, trigger_type = null, id = 0, '', trailstopdistance = 0);

//             }
//           }

//         });

//         spottradeTable.find({ pairName: pair, buyorsell: 'buy', userId: ObjectId("5e567694b912240c7f0e4299"), price: { $gte: (parseFloat(markprice)) }, '$or': [{ "status": '0' }, { "status": '2' }] }).limit(100).sort({ "price": -1 }).exec(function (buytemp_err, buytempData) {
//           if (buytempData) {
//             for (var i = 0; i < buytempData.length; i++) {
//               var _id = buytempData[i]._id;
//               var userId = buytempData[i].userId;
//               var buyorsell = buytempData[i].buyorsell;
//               var pairName = buytempData[i].pairName;
//               var quantity = buytempData[i].quantity - buytempData[i].filledAmount;
//               var price = buytempData[i].price;
//               var leverage = buytempData[i].leverage;
//               var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
//               //var index         = position_details.findIndex(x => (x._id) === userId);
//               //console.log(index,'index')
//               cancel_trade(_id, userId);

//             }
//           }

//         });


//       }
//     }
//   });


// }

router.get('/markets', (req, res) => {
  perpetual.aggregate([
    {
      $project: {
        _id: 0,
        name: "$tiker_root",
        type: "crypto",
        exchange: "Alwin",
      }
    }
  ]).exec(function (err, pairdata) {
    res.json(pairdata);
  });
});

router.get('/chart/:config', (request, response) => {
  // console.log("----SpotTRade")
  var uri = url.parse(request.url, true);
  // console.log(uri.query,'querydfjsldjflsdjflsdkfjldfs');
  var action = uri.pathname;
  // console.log(action,'action');
  switch (action) {
    case '/chart/config':
      action = '/config';
      break;
    case '/chart/time':
      action = '/time';
      break;
    case '/chart/symbols':
      symbolsDatabase.initGetAllMarketsdata();
      action = '/symbols';
      break;
    case '/chart/history':
      action = '/history';
      break;
  }
  return requestProcessor.processRequest(action, uri.query, response);
});

router.get('/chartData', (req, res) => {
  // console.log('callhere chart');
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;


  var pair = req.query.market;
  var start_date = req.query.start_date;
  var end_date = req.query.end_date;
  var resol = req.query.resolution;
  var spl = pair.split("_");
  var first = spl[0];
  var second = spl[1];
  var pattern = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
  var _trProject;
  var _trGroup;
  var _exProject;
  var _exGroup;
  if (start_date) {
    if (!pattern.test(start_date)) {
      res.json({ "message": "Start date is not a valid format" });
      return false;
    }
  }
  else {
    res.json({ "message": "Start date parameter not found" });
    return false;
  }
  if (end_date) {
    if (!pattern.test(end_date)) {
      res.json({ "message": "End date is not a valid format" });
      return false;
    }
  }
  else {
    res.json({ "message": "End date parameter not found" });
    return false;
  }
  charts.findOne({ type: resol, pairname: pair }).exec(function (err, result) {
    if (result) {
      res.json(result.data);
    }
    else {
      res.json([]);
    }
  });

});

router.get('/chartspotupdate', (req, res) => {
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  var pair = req.query.market;
  var resol = req.query.resolution;
  chartspotupdate(resol, pair);
});
router.get('/chartData1', (req, res) => {
  // console.log('callhere chart');
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  var pair = req.query.market;
  var start_date = req.query.start_date;
  var end_date = req.query.end_date;
  var resol = req.query.resolution;
  var spl = pair.split("_");
  var first = spl[0];
  var second = spl[1];
  var pattern = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
  var _trProject;
  var _trGroup;
  var _exProject;
  var _exGroup;
  if (start_date) {
    if (!pattern.test(start_date)) {
      res.json({ "message": "Start date is not a valid format" });
      return false;
    }
  }
  else {
    res.json({ "message": "Start date parameter not found" });
    return false;
  }
  if (end_date) {
    if (!pattern.test(end_date)) {
      res.json({ "message": "End date is not a valid format" });
      return false;
    }
  }
  else {
    res.json({ "message": "End date parameter not found" });
    return false;
  }
  var sDate = start_date + ' 00:00:0.000Z';
  var eDate = end_date + ' 00:00:0.000Z';

  // console.log(start_date,'start_date');
  // console.log(end_date,'end_date');

  // console.log(sDate,'start_date');
  // console.log(eDate,'end_date');
  if (sDate > eDate) {
    res.json({ "message": "Please ensure that the End Date is greater than or equal to the Start Date" });
  }
  // perpetual.find({tiker_root:pair}).select("_id").select("tiker_root").exec(function(err,pairdata){
  try {
    // if(pairdata.length > 0)
    // {
    //   var pairId   = pairdata[0]._id;
    //   var pairname = pairdata[0].tiker_root;
    // console.log(pairname);
    var limits;
    var project = { Date: "$Date", pair: "$pair", low: "$low", high: "$high", open: "$open", close: "$close", volume: "$volume", exchange: "Trading" };


    if (resol) {
      if (resol != 1 && resol != 5 && resol != 15 && resol != 30 && resol != 60 && resol != '1d' && resol != '2d' && resol != '3d' && resol != 'd' && resol != '1w' && resol != '3w' && resol != 'm' && resol != '6m') {
        res.json({ "message": "Resolution value is not valid" });
        return false;
      }
      else {
        if (resol == '1d') {
          console.log('1d');
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },
                    +resol
                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
        else if (resol == 'd') {
          _trProject = {
            "week": { "$week": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: '$pairname',
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "week": "$week",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 10080;
        }
        else if (resol == '1m') {

          _trProject = {
            "month": { "$month": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "month": "$month",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pairname' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 43200;
        }
        else if (resol == 1) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": "$minute"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 5) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 5] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 30) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 30] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 60) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 15) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 15] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": {
              "$hour": "$createdAt"
            },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },

                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
      }
    }
    // console.log(end_date,'eDate');
    console.log(moment(end_date).add(1, 'days'), 'eDate');
    // console.log(moment(start_date).format(),'sDate');
    spotPrices.aggregate([
      {
        $match: {
          "pairname": pair,
          "createdAt": {
            "$lt": new Date(moment(end_date).add('1 days')),
            "$gte": new Date(moment(start_date).format())
          },
        }
      },
      // {$limit: 500000},
      {
        $project: _trProject
      },
      {
        "$group": _trGroup
      },
      {
        $project: project,
      },
      {
        $sort: {
          "Date": 1,

        }
      },
      // {
      //                      allowDiskUse: true
      //                    },
    ]).exec(function (err, result) {
      // console.log(err,'err');
      //console.log(result,'result');
      res.json(result);
    });

    // }
    // else
    // {
    //     // console.log("no pair data");
    //     res.json({"message" : "No Pair Found"});
    // }
  }
  catch (e) {
    console.log("no pair", e);
  }
  // console.log(pairdata);
});

// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('BTCUSDT');
// });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('XRPUSDT');
// });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('ETHUSDT');
// });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('ETHBTC');
// });

// });

// cron.schedule('*/5 * * * * *', (req, res) => {
//   stopordertrigger('BTCUSDT');
// });
// cron.schedule('*/5 * * * * *', (req, res) => {
//   stopordertrigger('XRPUSDT');
// });
// cron.schedule('*/5 * * * * *', (req, res) => {
//   stopordertrigger('ETHUSDT');
// });
// cron.schedule('*/5 * * * * *', (req, res) => {
//   stopordertrigger('ETHBTC');
// });

// cron.schedule('*/5 * * * *', (req,res) => {
//   chartupdate('5','BTCUSD');
//   chartupdate('5','ETHUSD');
//   chartupdate('5','LTCUSD');
//   chartupdate('5','BCHUSD');
//   chartupdate('5','XRPUSD');

// //   tradeTable.remove({userId:ObjectId("5e567694b912240c7f0e4299"),'$or' : [{"status" : '0'},{"status" : '2'}]}, function(err) {
// //     if (!err) {
// //             console.log("success");
// //     }
// //     else {

// //             console.log(err);
// //     }
// // });
// });

// cron.schedule('* * * * *', (req,res) => {
//   chartupdate('1','BTCUSD');
//   chartupdate('1','ETHUSD');
//   chartupdate('1','BCHUSD');
//   chartupdate('1','LTCUSD');
//   chartupdate('1','XRPUSD');
// });

// cron.schedule('*/15 * * * *', (req,res) => {
//   chartupdate('15','BTCUSD');
//   chartupdate('15','ETHUSD');
//   chartupdate('15','BCHUSD');
//   chartupdate('15','LTCUSD');
//   chartupdate('15','XRPUSD');
// });

// cron.schedule('0 * * * *', (req,res) => {
//   chartupdate('60','BTCUSD');
//   chartupdate('60','ETHUSD');
//   chartupdate('60','BCHUSD');
//   chartupdate('60','LTCUSD');
//   chartupdate('60','XRPUSD');
// });

// cron.schedule('0 * * * *', (req,res) => {
//   chartupdate('60','BTCUSD');
//   chartupdate('60','ETHUSD');
//   chartupdate('60','BCHUSD');
//   chartupdate('60','LTCUSD');
//   chartupdate('60','XRPUSD');
// });

// cron.schedule('0 0 * * *', (req,res) => {
//   chartupdate('1d','BTCUSD');
//   chartupdate('1d','ETHUSD');
//   chartupdate('1d','BCHUSD');
//   chartupdate('1d','LTCUSD');
//   chartupdate('1d','XRPUSD');
// });

function chartupdate(resol, pair) {

  try {

    var limits;
    var project = { Date: "$Date", pair: "$pair", low: "$low", high: "$high", open: "$open", close: "$close", volume: "$volume", exchange: "Trading" };


    if (resol) {
      var restype = resol;
      if (resol != 1 && resol != 5 && resol != 15 && resol != 30 && resol != 60 && resol != '1d' && resol != '2d' && resol != '3d' && resol != 'd' && resol != '1w' && resol != '3w' && resol != 'm' && resol != '6m') {
        res.json({ "message": "Resolution value is not valid" });
        return false;
      }
      else {
        if (resol == '1d') {
          console.log('1d');
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },
                    +resol
                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
        else if (resol == 'd') {
          _trProject = {
            "week": { "$week": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: '$pairname',
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "week": "$week",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 10080;
        }
        else if (resol == 'm') {

          _trProject = {
            "month": { "$month": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "month": "$month",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pairname' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 43200;
        }
        else if (resol == 1) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": "$minute"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 5) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 5] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 30) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 30] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 60) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 15) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": { "$hour": "$createdAt" },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 15] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$createdAt"
            },
            "mn": {
              "$month": "$createdAt"
            },
            "dt": {
              "$dayOfMonth": "$createdAt"
            },
            "hour": {
              "$hour": "$createdAt"
            },
            "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairname",
            modifiedDate: '$createdAt',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },

                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
      }
    }
    // console.log(end_date,'eDate');
    // console.log(moment(end_date).add(1, 'days'),'eDate');

    var d1 = new Date();
    var d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() - parseFloat(restype));
    // console.log(d2)
    // console.log(d1)
    // console.log(moment(start_date).format(),'sDate');
    spotPrices.aggregate([
      {
        $match: {
          "pairname": pair,
          "createdAt": {
            "$lt": new Date(),
            "$gte": d2
          },
        }
      },
      // {$limit: 500000},
      {
        $project: _trProject
      },
      {
        "$group": _trGroup
      },
      {
        $project: project,
      },
      {
        $sort: {
          "Date": 1,

        }
      },

    ]).exec(function (err, result) {

      charts.update(
        { type: restype, pairname: pair },
        { $addToSet: { data: result } }, function (err, ress) {
          // console.log(err)
          // console.log(ress)
        });
    });


  }
  catch (e) {
    console.log("no pair", e);
  }

}


function chartspotupdate(resol, pair) {

  try {

    var limits;
    var project = { Date: "$Date", pair: "$pair", low: "$low", high: "$high", open: "$open", close: "$close", volume: "$volume", exchange: "Trading" };


    if (resol) {
      var restype = resol;
      if (resol != 1 && resol != 5 && resol != 15 && resol != 30 && resol != 60 && resol != '1d' && resol != '2d' && resol != '3d' && resol != 'd' && resol != '1w' && resol != '3w' && resol != 'm' && resol != '6m') {
        res.json({ "message": "Resolution value is not valid" });
        return false;
      }
      else {
        if (resol == '1d') {
          console.log('1d');
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },
                    +resol
                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
        else if (resol == 'd') {
          _trProject = {
            "week": { "$week": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: '$pairName',
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "week": "$week",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 10080;
        }
        else if (resol == 'm') {

          _trProject = {
            "month": { "$month": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "month": "$month",
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pairName' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }
          }

          resol = 43200;
        }
        else if (resol == 1) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": { "$hour": "$orderDate" },
            "minute": { "$minute": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": "$minute"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 5) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": { "$hour": "$orderDate" },
            "minute": { "$minute": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 5] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 30) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": { "$hour": "$orderDate" },
            "minute": { "$minute": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 30] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 60) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": { "$hour": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour"
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else if (resol == 15) {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": { "$hour": "$orderDate" },
            "minute": { "$minute": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                "$subtract": [
                  { "$minute": "$modifiedDate" },
                  { "$mod": [{ "$minute": "$modifiedDate" }, 15] }
                ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }
        }
        else {
          resol = 1440;
          _trProject = {
            "yr": {
              "$year": "$orderDate"
            },
            "mn": {
              "$month": "$orderDate"
            },
            "dt": {
              "$dayOfMonth": "$orderDate"
            },
            "hour": {
              "$hour": "$orderDate"
            },
            "minute": { "$minute": "$orderDate" },
            "filledAmount": 1,
            "price": 1,
            pair: "$pairName",
            modifiedDate: '$orderDate',
          }
          _trGroup = {
            "_id": {
              "year": "$yr",
              "month": "$mn",
              "day": "$dt",
              "hour": "$hour",
              "minute": {
                $add:
                  [
                    {
                      $subtract:
                        [
                          { $minute: "$modifiedDate" },
                          { $mod: [{ $minute: "$modifiedDate" }, +resol] }
                        ]
                    },

                  ]
              }
            },
            count: {
              "$sum": 1
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: '$pair' },
            low: { $min: '$price' },
            high: { $max: '$price' },
            open: { $first: '$price' },
            close: { $last: '$price' },
            volume: { $sum: '$filledAmount' }

          }

        }
      }
    }
    // console.log(end_date,'eDate');
    // console.log(moment(end_date).add(1, 'days'),'eDate');

    var d1 = new Date();
    var d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() - parseFloat(restype));
    // console.log(d2)
    // console.log(d1)
    // console.log(moment(start_date).format(),'sDate');
    spottradeTable.aggregate([
      {
        $match: {
          "pairName": pair,
          "orderDate": {
            "$lt": new Date(),
            "$gte": d2
          },
        }
      },
      // {$limit: 500000},
      {
        $project: _trProject
      },
      {
        "$group": _trGroup
      },
      {
        $project: project,
      },
      {
        $sort: {
          "Date": 1,

        }
      },

    ]).exec(function (err, result) {
      console.log(err, 'err')
      console.log(result, 'chartresut')
      // charts.update(
      // { type: restype,pairname: pair },
      // { $addToSet: { data: result } },function(err,ress){
      //   // console.log(err)
      //   // console.log(ress)
      // });
    });


  }
  catch (e) {
    console.log("no pair", e);
  }

}


module.exports = router;
