const express                     = require('express');
const router                      = express.Router();
const bcrypt                      = require('bcryptjs');
const jwt                         = require('jsonwebtoken');
const keys                        = require('../../config/keys');
const async                       = require("async");
const validateTradeInput          = require('../../validation/frontend/trade');
const validatemobRegisterInput    = require('../../validation/frontend/mobregister');
const validateLoginInput          = require('../../validation/login');
const validatemobLoginInput       = require('../../validation/moblogin');
const validateUpdateUserInput     = require('../../validation/frontend/updateUser');
// const validateEmailtemplateInput  = require('../../validation/emailtemplate');
const validateForgotInput         = require('../../validation/forgot');
const validateCmsInput            = require('../../validation/cms');
const validateFaqInput            = require('../../validation/faq');
const validateUpdateSettingsInput = require('../../validation/settings');
const validateResetInput          = require('../../validation/frontend/resetpassword');
const validatetfaInput            = require('../../validation/frontend/tfainput');
const validateContactInput        = require('../../validation/frontend/contact_us');
const tradeTable                  = require('../../models/tradeTable');
const spottradeTable              = require('../../models/spottradeTable');
const charts                      = require('../../models/Chart');
const Bonus                       = require('../../models/Bonus');
const Assets                      = require('../../models/Assets');
const position_table              = require('../../models/position_table');
const currency                    = require('../../models/currency');
const User                        = require('../../models/User');
const FundingHistory              = require('../../models/FundingHistory');
const InterestHistory             = require('../../models/InterestHistory');
const Emailtemplates              = require('../../models/emailtemplate');
const exchangePrices              = require('../../models/exchangePrices');
const spotPrices                  = require('../../models/spotPrices');
const spotpairs                  = require('../../models/spotpairs');
const FeeTable                   = require('../../models/FeeTable');
const Transaction = require("../../models/Transaction");
const multer                      = require('multer');
var node2fa                       = require('node-2fa');
var CryptoJS                      = require("crypto-js");
var moment                        = require("moment");
const perpetual                   = require('../../models/perpetual');
const cryptoRandomString          = require('crypto-random-string');
const nodemailer                  = require('nodemailer');
var fs               = require('fs');
const userinfo = [];

// const client                      = require('twilio')(
//   keys.TWILIO_ACCOUT_SID,
//   keys.TWILIO_AUTH_TOKEN
// );
const mongoose       = require('mongoose');
const url            = require('url');
const ObjectId       = mongoose.Types.ObjectId;
var symbolsDatabase  = require("../symbols_database"),
RequestProcessor     = require("../request-processor").RequestProcessor;
var requestProcessor = new RequestProcessor(symbolsDatabase);
var schedule         = require('node-schedule');
var moment = require('moment');
var cron             = require('node-cron');

var request          = require('request');


const rp             = require('request-promise')
const perf = require('execution-time')();
const getJSON = require("get-json");

var tradeinfo        = [];
const bybitclient = require('bybit')({
  baseURL: 'https://api.bybit.com',
  key: 'ekafOxVaCjgDfYqPDF',
  secret: 'rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D',
})

const WebSocket = require('ws');
var qs = require('qs');
const bybitcrypto = require('crypto')

var openWebSocket = function() {
const ws = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key='+keys.priceapikey);





ws.on('message', function incoming(data) {
    console.log(JSON.parse(data),'data');
    var result = JSON.parse(data);
    if(result.TYPE=='2')
    {
      var price = result.PRICE?result.PRICE:0;
      // console.log(price,'price')
      // console.log(result.MARKET,'MARKET')
      if(price!=0 && price!='')
      {

        var updatedata = {
              "last"         : price,
            };
            updatebalance={
              markprice: result.PRICE
            }

            var pairname = (result.FROMSYMBOL=='BTC')?'BTCUSD':(result.FROMSYMBOL=='LTC')?'LTCUSD':(result.FROMSYMBOL=='ETH')?'ETHUSD':(result.FROMSYMBOL=='BCH')?'BCHUSD':(result.FROMSYMBOL=='XRP')?'XRPUSD':'';
            if(result.TOSYMBOL=='BTC' && result.FROMSYMBOL=='ETH')
            {
              pairname = "ETHBTC"
            }
            if(result.TOSYMBOL=='BTC' && result.FROMSYMBOL=='XRP')
            {
              pairname = "XRPBTC"
            }
            // if(pairname=="XRPBTC" || pairname=="BTCUSDT"|| pairname=="ETHBTC" || pairname=="ETHUSDT"|| pairname=="XRPUSDT"){
            //   spotpairs.findOneAndUpdate(
            //     { tiker_root: pairname },
            //     { $set: updatebalance },
            //     {
            //       new: true,
            //     },
            //     function (pererr1, perdata1) {
            //       socketio.emit("PRICEDETAILS", perdata1);
            //       // console.log("perdata1",perdata1)
            //
            //             const newrecord = new spotPrices({
            //               price: result.PRICE,
            //               pair: ObjectId(perdata1._id),
            //               pairname: pairname,
            //               createdAt: new Date(),
            //             });
            //             newrecord.save().then((result) => {
            //             // console.log("Saveddsa", result);
            //           });
            //     })
            //
            // }

            updatebaldata = {"volume":(result.LASTVOLUME)?result.LASTVOLUME:0}
            exchangePrices
              .find({ pairname: pairname, exchangename: result.MARKET })
                .exec(function (err, findresult) {
                if (findresult) {
                  if(findresult.length==0){
                         const newexchange = new exchangePrices({
                    pairname: pairname,
                    exchangename: result.MARKET
                  });
                  newexchange.save().then((result) => {
                    console.log("Saveddsa", result);
                  });
                }else{
                  updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
                  exchangePrices.findOneAndUpdate(
                    { exchangename: result.MARKET, pairname: pairname },
                    { $set: updatedata, $inc: updatebaldata },
                    { new: true },
                    function (balerr, baldata) {

                    }
                  );
                }
                }

              });

          // exchangePrices.findOneAndUpdate({exchangename:result.MARKET,"pairname":pairname},{"$set": updatedata ,"$inc": updatebaldata } , {new:true,"fields": {exchangename:1} } ,function(balerr,baldata){
          //   // console.log(balancerr,'balerr');
          //   // console.log(baldata,'baldata');
          // });
      }
    }
});

//{"TYPE":"2","MARKET":"Coinbase","FROMSYMBOL":"ETH","TOSYMBOL":"USD","FLAGS":2,"PRICE":135.5,"LASTUPDATE":1585319036,"LASTVOLUME":0.25,"LASTVOLUMETO":33.875,"LASTTRADEID":"56375159","VOLUMEDAY":108638.17880246,"VOLUMEDAYTO":15053385.6079691,"VOLUME24HOUR":185993.1900849,"VOLUME24HOURTO":25627607.6662005,"VOLUMEHOUR":1889.45978192,"VOLUMEHOURTO":255674.653169188} data

// ["2~Bitstamp~BTC~USD","2~Bitstamp~ETH~USD","2~Bitstamp~LTC~USD","2~Bitstamp~BCH~USD","2~Bitstamp~XRP~USD","2~Bitstamp~ETH~BTC","2~Bitstamp~XRP~BTC","2~Kraken~BTC~USD","2~Kraken~ETH~USD","2~Kraken~LTC~USD","2~Kraken~BCH~USD","2~Kraken~XRP~USD","2~Kraken~ETH~BTC","2~Kraken~XRP~BTC","2~Coinbase~BTC~USD","2~Coinbase~ETH~USD","2~Coinbase~LTC~USD","2~Coinbase~BCH~USD","2~Coinbase~XRP~USD","2~Coinbase~ETH~BTC","2~Coinbase~XRP~BTC"]

ws.on('open', function open() {
  ws.send(JSON.stringify({
    "action": "SubAdd",
    "subs": ["2~Bitstamp~BTC~USD",
              "2~Bitstamp~ETH~USD",
              "2~Bitstamp~LTC~USD",
              "2~Bitstamp~BCH~USD",
              "2~Bitstamp~XRP~USD",
              // "2~Bitstamp~XRP~BTC",
              // "2~Bitstamp~ETH~BTC",
              "2~Kraken~BTC~USD",
              "2~Kraken~ETH~USD",
              "2~Kraken~LTC~USD",
              "2~Kraken~BCH~USD",
              "2~Kraken~XRP~USD",
              // "2~Kraken~XRP~BTC",
              // "2~Kraken~ETH~BTC",
              "2~Coinbase~BTC~USD",
              "2~Coinbase~ETH~USD",
              "2~Coinbase~LTC~USD",
              "2~Coinbase~BCH~USD",
              "2~Coinbase~XRP~USD",
              // "2~Coinbase~XRP~BTC",
              // "2~Coinbase~ETH~BTC",

              // "2~Binance~XRP~BTC",
              // "2~Binance~ETH~BTC",
              // "2~Binance~ETH~USDT",
              // "2~Binance~BTC~USDT",
              // "2~Binance~XRP~USDT",
            ]
}))
});
 ws.on('close', function() {
        // console.log('disconnected');
        // openWebSocket();
    });
}


var openWebSocketThree = function () {
  const wsthree = new WebSocket(
    "wss://streamer.cryptocompare.com/v2?api_key=e7b74f97181cb6b4da3ff8f398cde52b83cbcdcddb65f23051263fb8ed9a698d"
  );

  wsthree.on("message", function incoming(data) {
    // console.log(JSON.parse(data),'Thriidss ssdata');
    var result = JSON.parse(data);

    if (result.TYPE == "2") {
      var price = result.PRICE ? result.PRICE : 0;
      var pairname = "";
      var updatedata = {
        last: price,
      };

      if (price != 0 && price != "") {
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "ETH") {
          pairname = "ETHBTC";
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "ETH") {
          pairname = "ETHUSDT";
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "BTC") {
          pairname = "BTCUSDT";
          // console.log("result.PRICE",result.PRICE);
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPUSDT";
        }




        updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
        updatebalance={
          markprice: result.PRICE
        }
        spotpairs.findOneAndUpdate(
          { tiker_root: pairname },
          { $set: updatebalance },
          {
            new: true,
          },
          function (pererr1, perdata1) {
            if(perdata1)
            {
            socketio.emit("PRICEDETAILS", perdata1);
            // console.log("perdata1",perdata1)

                  const newrecord = new spotPrices({
                    price: result.PRICE,
                    pair: ObjectId(perdata1._id),
                    pairname: pairname,
                    createdAt: new Date(),
                  });
                  newrecord.save().then((result) => {
                  // console.log("Saveddsa", result);
                });

            }
          })

          exchangePrices
            .find({ pairname: pairname, exchangename: result.MARKET })
              .exec(function (err, findresult) {
              if (findresult) {
                if(findresult.length==0){
                       const newexchange = new exchangePrices({
                  pairname: pairname,
                  exchangename: result.MARKET
                });
                newexchange.save().then((result) => {
                  console.log("Saveddsa", result);
                });
              }else{
                updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
                exchangePrices.findOneAndUpdate(
                  { exchangename: result.MARKET, pairname: pairname },
                  { $set: updatedata, $inc: updatebaldata },
                  { new: true },
                  function (balerr, baldata) {

                  }
                );
              }
              }

            });

        // exchangePrices.findOneAndUpdate(
        //   { exchangename: result.MARKET, pairname: pairname },
        //   { $set: updatedata, $inc: updatebaldata },
        //   { new: true },
        //   function (balerr, baldata) {
        //          // console.log(balerr,'balerr');
        //     // console.log(baldata,'baldata');
        //   }
        // );

      }
    }
  });
  wsthree.on("open", function open() {
    wsthree.send(
      JSON.stringify({
        action: "SubAdd",
        subs: [
                "2~Binance~XRP~BTC",
                "2~Binance~ETH~BTC",
                "2~Binance~ETH~USDT",
                "2~Binance~BTC~USDT",
                "2~Binance~XRP~USDT",
        ],
      })
    );
  });
  wsthree.on("close", function () {
    // console.log("disconnected from wwebsocket 222");
    openWebSocketThree();
  });
};

// var bybitapiKey = "ekafOxVaCjgDfYqPDF";
// var bybitsecret = "rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D";
// var expires = time.now()+1000;
// var params={
//   "api_key":apiKey,
//   "symbol":pairname,
//   "order_id":orderid,
//   "timestamp":timestamp
// }
// var functionsign=await getSignature(params, secret)

var openbybitwebsocket = function () {
  const wsbybit = new WebSocket(
"wss://stream.bybit.com/realtime");

  wsbybit.on("message", function incoming(data) {
    // console.log(JSON.parse(data),'Thriidss ssdata');
    var result = JSON.parse(data);
    console.log("resultsss",result);
    if(result.type=="snapshot"){
console.log("inside snapshot",result.data);
    }
    else if (result.type=="delta") {
      console.log("inside deltaas",result.data.update);

    }else{
      console.log("no updates");
    }

  });
  wsbybit.on("open", function open() {
    wsbybit.send('{"op": "subscribe", "args": ["orderBookL2_25.BTCUSD"]}');

  });
  wsbybit.on("close", function () {
    // console.log("disconnected from wwebsocket 222");
    openbybitwebsocket();
  });
};


openWebSocket();
// openWebSocketThree();
// openbybitwebsocket()


cron.schedule('* * * * * *', (req,res) => {
 // console.log("cron for the binance spot");
 perpetual.find().then(perpetualdata=>{
   // console.log("spotpairs",spotpairs);
   if(perpetualdata.length>0){
     var i = 0;
     generatebybittradetable(perpetualdata[0], function () {
       // console.log("first");
       if (i === perpetualdata.length - 1) {
         callBackResponseImport();
       } else {
         i += 1;
         if (perpetualdata[i]) {
             // console.log("next");
             generatebybittradetable(perpetualdata[i]);
         } else {
           callBackResponseImport();
         }
       }
     });
   }
 })
});
async function generatebybittradetable(perpetualdata,callbackbybit){

  if (callbackbybit) {
    tradeinfo.callBackforthebybit= callbackbybit;
  }

  var pairname =perpetualdata.tiker_root
  getJSON(
    "https://api.bybit.com/v2/public/orderBook/L2?symbol="+pairname,
    function (errorBal, response) {
if(response){
  if(response.ret_msg=="OK"){
    var buyandsellorderss=response.result
    // console.log("buyandsellorderss",buyandsellorderss);
    var pairbuyorders = []
    var pairsellorders = []
    for(i=0;i<buyandsellorderss.length;i++){
      if(buyandsellorderss[i].side=="Buy"){
        var quantity = parseFloat(buyandsellorderss[i].size) / parseFloat(buyandsellorderss[i].price)
        var  newobsell={
          _id:parseFloat(buyandsellorderss[i].price),
            quantity:parseFloat(quantity.toFixed(4)),
            filledAmount:0,
           }
           pairbuyorders.push(newobsell)
         }
      if(buyandsellorderss[i].side=="Sell"){
        var quantity = parseFloat(buyandsellorderss[i].size) / parseFloat(buyandsellorderss[i].price)
        var  newobsell={
          _id:parseFloat(buyandsellorderss[i].price),
            quantity:parseFloat(quantity.toFixed(4)),
            filledAmount:0,
           }
           pairsellorders.push(newobsell)
         }
    }

    var firstcurrency = perpetualdata.first_currency
    var secondcurrency = perpetualdata.second_currency
    var pair = firstcurrency + secondcurrency;

    var result={}
    async.parallel({
      buyOrder : function(cb) {
        var sort = {'_id':-1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:firstcurrency,secondCurrency:secondcurrency,buyorsell:'buy'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      sellOrder : function(cb) {
       var sort = {'_id':1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:firstcurrency,secondCurrency:secondcurrency,buyorsell:'sell'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },

    },(err,results) => {
      // console.log("resultss",results);

        if(err){
            result.status      = false;
            result.message     = 'Error occured.';
            result.err         = err;
            result.notify_show = 'no';
            // res.json(result);
        } else if(results){

           var sellOrder = results.sellOrder;
           var buyOrder  = results.buyOrder;

          pairsellorders.map(function(binsell){
            // console.log("binsell",binsell);
            var indexofsell =sellOrder.findIndex(x => (x._id) === parseFloat(binsell._id))
            // console.log("indexofsell",indexofsell)
            if(indexofsell=-1){
              var  newobsell={
                _id:parseFloat(binsell._id),
                  quantity:parseFloat(binsell.quantity),
                  filledAmount:0,
                  // total:quantity,
                 }
                 sellOrder.push(newobsell)
            }

            })

            sellOrder=sellOrder.sort((a, b) => parseFloat(b._id) - parseFloat(a._id));


            // console.log("adfter the addition sell order",sellOrder);


            pairbuyorders.map(function(binbuy){
              // console.log("binbuy",binbuy);
              var indexofbuy =buyOrder.findIndex(x => (x._id) === parseFloat(binbuy._id))
              // console.log("indexofbuy",indexofbuy)
              if(indexofbuy=-1){
                var  newobbuy={
                  _id:parseFloat(binbuy._id),
                    quantity:parseFloat(binbuy.quantity),
                    filledAmount:0,
                    // total:quantity,
                   }
                   buyOrder.push(newobbuy)
              }

              })
              buyOrder=buyOrder.sort((a, b) => parseFloat(b._id) - parseFloat(a._id));

              // console.log("adfter the addition buy order",buyOrder);
    if(buyOrder.length>0)
    {
     var sumamount = 0
     for(i=0;i<buyOrder.length;i++)
     {
         var quantity      = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledAmount);
         var _id           = buyOrder[i]._id;
         sumamount         = parseFloat(sumamount) + parseFloat(quantity);
         buyOrder[i].total = sumamount;
         buyOrder[i].quantity = quantity;
     }
    }

    if(sellOrder.length>0)
    {
     var sumamount = 0
     for(i=0;i<sellOrder.length;i++)
     {
         var quantity       = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledAmount);
         var _id            = sellOrder[i]._id;
         sumamount          = parseFloat(sumamount) + parseFloat(quantity);
         sellOrder[i].total = sumamount;
         sellOrder[i].quantity = quantity;
     }
    }

             sellOrder = sellOrder.reverse();
             // console.log("pairnameee",pair);
             // console.log("resultsss",results);
             result.status       = true;
             result.message      = 'tradeTableAll';
             result.buyOrder     = results.buyOrder;
             result.sellOrder    = results.sellOrder;
             result.notify_show  = 'no';
             result.firstCurrency=firstcurrency,
             result.secondCurrency=secondcurrency
             // console.log("resullss",result);
             if(typeof socketio != 'undefined')
             {
                socketio.emit('TRADEORDERSS', result);
             }
              tradeinfo.callBackforthebybit()
        } else {
            tradeinfo.callBackforthebybit()
            result.status = false;
            result.message = 'Error occured.';
            result.err = '';
            result.notify_show = 'no';
        }
    })

      }
      else{
          tradeinfo.callBackforthebybit()
      }
      }
    })
}



router.post("/spot-data/", (req, res) => {
  spotpairs.find({}).then((result) => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "spot" });
    }
  });
});

router.get('/currencydetails', (req, res) => {
   currency.find({}, function(err, currencydetails) {
    if(currencydetails)
    {
      res.json({status:true,data:currencydetails})
    }
    else
    {
      res.json({status:false,message:"Something went wrong"})

    }
   });
});

router.post('/loadmoreRescentorder', (req, res) => {
  var pair = req.body.pair;
  var rescentcount = req.body.rescentcount;
  tradeTable.aggregate([
      {$match:{'pairName': pair,'status':'1'}},
      {$unwind:"$filled"},
      {$project:{"filled":1}},
      {$group:{_id:{"buyuserId":'$filled.buyuserId',"selluserId":'$filled.selluserId',"sellId":"$filled.sellId","buyId":"$filled.buyId"},"created_at":{ $first:"$filled.created_at" },"Type":{$first:"$filled.Type"},"filledAmount":{$first:"$filled.filledAmount"},"pairname":{$first:"$filled.pairname"},"Price":{$first:"$filled.Price"}}},
      {$sort: {'created_at':-1}},
     // {$skip: rescentcount},
     {$limit: rescentcount},
     ]).exec(function(err,result){
      res.json({status:true,data:result});
     });
});

router.get('/balance', (req, res) => {
  // res.json({statue:"success"});
   User.find({}, function(err, userdetails) {
      if (userdetails) {
        userdetails.forEach(function(res) {
          var userId = res._id;
          currency.find({}, function(err, currencydetails) {
            currencydetails.forEach(function(cur){
              var insertobj = {
                "balance":0,
                "currency":cur._id,
                "currencySymbol":cur.currencySymbol
              };

              const newContact = new Assets({
               "balance":0,
                "currency":cur._id,
                "currencySymbol":cur.currencySymbol,
                "userId":userId
            });
           newContact.save(function(err,data) {
            console.log("success");
           });

            });
          });
        });
        res.send('success');

      }
    })
});


function gettradedata(firstCurrency,secondCurrency,io)
{
    var findObj = {
        firstCurrency:firstCurrency,
        secondCurrency:secondCurrency
    };
    var pair = firstCurrency + secondCurrency;
    var result = {};
    // tradeTable.find(findObj,function(err,tradeTableAll){
    async.parallel({
      buyOrder : function(cb) {
        var sort = {'_id':-1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:firstCurrency,secondCurrency:secondCurrency,buyorsell:'buy'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      sellOrder : function(cb) {
       var sort = {'_id':1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:firstCurrency,secondCurrency:secondCurrency,buyorsell:'sell'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      contractdetails : function(cb) {
         perpetual.findOne({first_currency:firstCurrency,second_currency:secondCurrency},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1}).exec(cb)
      },
      Rescentorder : function(cb) {
      tradeTable.aggregate([
      {$match:{'pairName': pair,'status':'1'}},
      {$unwind:"$filled"},
      {$project:{"filled":1}},
      {$group:{_id:{"buyuserId":'$filled.buyuserId',"selluserId":'$filled.selluserId',"sellId":"$filled.sellId","buyId":"$filled.buyId"},"created_at":{ $first:"$filled.created_at" },"Type":{$first:"$filled.Type"},"filledAmount":{$first:"$filled.filledAmount"},"pairname":{$first:"$filled.pairname"},"Price":{$first:"$filled.Price"}}},
      {$sort: {'created_at':-1}},
     {$limit: 50},
     ]).exec(cb)
   },
    },(err,results) => {
        if(err){
            result.status      = false;
            result.message     = 'Error occured.';
            result.err         = err;
            result.notify_show = 'no';
            // res.json(result);
        } else if(results){
           var sellOrder = results.sellOrder;
           var buyOrder  = results.buyOrder;

            if(buyOrder.length>0)
            {
              var sumamount = 0
              for(i=0;i<buyOrder.length;i++)
              {
                  var quantity      = parseFloat(buyOrder[i].quantity)-parseFloat(buyOrder[i].filledAmount);
                  var _id           = buyOrder[i]._id;
                  sumamount         = parseFloat(sumamount) + parseFloat(quantity);
                  buyOrder[i].total = sumamount;
                  buyOrder[i].quantity = quantity;
              }
            }

            if(sellOrder.length>0)
            {
              var sumamount = 0
              for(i=0;i<sellOrder.length;i++)
              {
                  var quantity       = parseFloat(Math.abs(sellOrder[i].quantity))-Math.abs(parseFloat(sellOrder[i].filledAmount));
                  var _id            = sellOrder[i]._id;
                  sumamount          = parseFloat(sumamount) + parseFloat(quantity);
                  sellOrder[i].total = sumamount;
                  sellOrder[i].quantity = quantity;
              }
            }

            sellOrder = sellOrder.reverse();

            result.status       = true;
            result.message      = 'tradeTableAll';
            result.buyOrder     = results.buyOrder;
            result.sellOrder    = results.sellOrder;
            result.contractdetails    = results.contractdetails;
            result.notify_show  = 'no';
            result.Rescentorder = results.Rescentorder;
             // res.json(result);
             // console.log(result);
             if(typeof socketio != 'undefined')
             {
                socketio.emit('TRADE', result);
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

router.post('/getTradeData', (req, res) => {
    var findObj = {
        firstCurrency:req.body.firstCurrency,
        secondCurrency:req.body.secondCurrency
    };
    var pair = req.body.firstCurrency + req.body.secondCurrency;
    var result = {};
    // tradeTable.find(findObj,function(err,tradeTableAll){
    async.parallel({
      buyOrder : function(cb) {
        var sort = {'_id':-1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:req.body.firstCurrency,secondCurrency:req.body.secondCurrency,buyorsell:'buy'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      sellOrder : function(cb) {
        var sort = {'_id':1};
        tradeTable.aggregate([
        {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:req.body.firstCurrency,secondCurrency:req.body.secondCurrency,buyorsell:'sell'}},
        {
          $group : {
            '_id' : '$price',
            'quantity' : { $sum : '$quantity' },
            'filledAmount' : { $sum : '$filledAmount' }
          }
        },
        {$sort:sort},
        {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },

      Assetdetails : function(cb) {
         Assets.find({userId:ObjectId(req.body.userid)}).exec(cb)
      },
      contractdetails : function(cb) {
         perpetual.findOne({first_currency:req.body.firstCurrency,second_currency:req.body.secondCurrency},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1}).exec(cb)
      },
      Rescentorder : function(cb) {
      tradeTable.aggregate([
      {$match:{'pairName': pair,'status':'1'}},
      {$unwind:"$filled"},
      {$project:{"filled":1}},
      {$group:{_id:{"buyuserId":'$filled.buyuserId',"selluserId":'$filled.selluserId',"sellId":"$filled.sellId","buyId":"$filled.buyId"},"created_at":{ $first:"$filled.created_at" },"Type":{$first:"$filled.Type"},"filledAmount":{$first:"$filled.filledAmount"},"pairname":{$first:"$filled.pairname"},"Price":{$first:"$filled.Price"}}},
       {$sort: {'created_at':-1}},
     {$limit: 20},
     ]).exec(cb)
   },
    },(err,results) => {
        if(err){
            result.status      = false;
            result.message     = 'Error occured.';
            result.err         = err;
            result.notify_show = 'no';
            res.json(result);
        } else if(results){
            var sellOrder = results.sellOrder;
            var buyOrder   = results.buyOrder;
            if(buyOrder.length>0)
            {
              var sumamount = 0
              for(i=0;i<buyOrder.length;i++)
              {
                  var quantity = buyOrder[i].quantity;
                  var _id = buyOrder[i]._id;
                  sumamount = parseFloat(sumamount) + parseFloat(quantity);
                  buyOrder[i].total = sumamount;
              }
            }

            if(sellOrder.length>0)
            {
              var sumamount = 0
              for(i=0;i<sellOrder.length;i++)
              {
                  var quantity = sellOrder[i].quantity;
                  var _id = sellOrder[i]._id;
                  sumamount = parseFloat(sumamount) + parseFloat(quantity);
                  sellOrder[i].total = sumamount;
              }
            }

            sellOrder = sellOrder.reverse();

            result.status          = true;
            result.message         = 'tradeTableAll';
            result.buyOrder        = results.buyOrder;
            result.sellOrder       = results.sellOrder;
            result.contractdetails = results.contractdetails;
            result.notify_show     = 'no';
            result.assetdetails    = results.Assetdetails;
            result.Rescentorder    = results.Rescentorder;
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
function cancel_trade(tradeid,userid)
{
  update      = { status : '3'}
  tradeTable.findOne(
    {$match:{'_id' : ObjectId(tradeid),'status':{ $ne: '3' }}},
  ).exec((tradeerr,tradedata) => {
    if(tradedata) {
      var type               = tradedata.buyorsell;
      var trade_ids          = tradedata._id;
      var userId             = tradedata.userId;
      var filledAmt          = tradedata.filledAmount;
      var status             = tradedata.status;
      var quantity           = tradedata.quantity;
      var price              = tradedata.price;
      var t_firstcurrencyId  = tradedata.firstCurrency;
      var t_secondcurrencyId = tradedata.secondCurrency;
      var beforeBalance      = tradedata.beforeBalance;
      var afterBalance       = tradedata.afterBalance;
      var leverage           = tradedata.leverage;
      var btcprice           = tradedata.btcprice;
      var taker_fees         = tradedata.taker_fees;

      quantity = parseFloat(quantity) - parseFloat(filledAmt);

      var order_value1      = parseFloat(quantity*price).toFixed(8);
      var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
      var required_margin   = parseFloat(order_value1)/leverage;
      var fee               = parseFloat(order_value1)*taker_fees/100;
      var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
      var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
      var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
      order_cost            = parseFloat(order_cost).toFixed(8);



      async.parallel({
      // update balance
      data1: function(cb){
        var updatedata = {"status": '3' }
        tradeTable.findOneAndUpdate({_id: ObjectId(tradeid)},{"$set":updatedata},{new:true,"fields": {status:1} },function(upErr,upRes){
            if(upRes) {
                gettradedata(t_firstcurrencyId,t_secondcurrencyId,socketio)
                getusertradedata(userId,t_firstcurrencyId,t_secondcurrencyId,socketio)
            }
            else {
            //res.json({status:false,message:"Due to some error occurred,While Order cancelling"});
            }
        });
      },
      data2: function(cb){
          var updatebaldata = {};
          updatebaldata["balance"] = order_cost;
          console.log(order_cost,'order cost');
          Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(userId)},{"$inc": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){

          });
      }
      },function(err, results){

      });
    }
    else  {
      console.log({status:false,message:"Your Order already cancelled"});
    }
  });
}

router.post('/cancelTrade', (req, res) => {
  var tradeid = req.body.id;
  var userid  = req.body.userid;
  update      = { status : '3'}
  // tradeTable.aggregate(
  //   {$match:{'_id' : ObjectId(tradeid),'status':{ $ne: '3' }}}).exec((tradeerr,tradedata) => {
  tradeTable
    .findOne({ _id: ObjectId(tradeid), status: { $ne: "3" } })
    .exec((tradeerr, tradedata) => {
    if(tradedata) {
      var type               = tradedata.buyorsell;
      var trade_ids          = tradedata._id;
      var userId             = tradedata.userId;
      var filledAmt          = tradedata.filledAmount;
      var status             = tradedata.status;
      var quantity           = tradedata.quantity;
      var price              = tradedata.price;
      var t_firstcurrencyId  = tradedata.firstCurrency;
      var t_secondcurrencyId = tradedata.secondCurrency;
      var beforeBalance      = tradedata.beforeBalance;
      var afterBalance       = tradedata.afterBalance;
      var leverage           = tradedata.leverage;
      var btcprice           = tradedata.btcprice;
      var taker_fees         = tradedata.taker_fees;

      quantity = parseFloat(quantity) - parseFloat(filledAmt);

      var order_value1      = parseFloat(quantity*price).toFixed(8);
      var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
      var required_margin   = parseFloat(order_value1)/leverage;
      var fee               = parseFloat(order_value1)*taker_fees/100;
      var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
      var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
      var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
      // order_cost            = parseFloat(order_cost).toFixed(8);
      order_cost = parseFloat( Math.abs(order_cost)).toFixed(8);


      async.parallel({
      // update balance
      data1: function(cb){
        var updatedata = {"status": '3' }
        tradeTable.findOneAndUpdate({_id: ObjectId(tradeid)},{"$set":updatedata},{new:true},function(upErr,upRes){
            if(upRes) {
              cancelbybittrade(upRes)

              res.json({status:true,message:"Your Order cancelled successfully.",notify_show:'yes'});
              gettradedata(t_firstcurrencyId,t_secondcurrencyId,socketio)
            }
            else {
              res.json({status:false,message:"Due to some error occurred,While Order cancelling"});
            }
        });
      },
      data2: function(cb){
          var updatebaldata = {};
          updatebaldata["balance"] = order_cost;
          Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(userId)},{"$inc": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
          });
      }
      },function(err, results){

      });
    }
    else  {
      res.json({status:false,message:"Your Order already cancelled"});
    }
  });

});

async function cancelbybittrade(upRes){
  // console.log("inside bybit cancel function",upRes);
  if(upRes.bybitorderid!=" " || upRes.bybitorderid!=null|| upRes.bybitorderid!=undefined){
    var orderid=upRes.bybitorderid
    var pairname=upRes.pairName
    var apiKey = "ekafOxVaCjgDfYqPDF";
   var secret = "rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D";
   var timestamp = Date.now();
    var params={
      "api_key":apiKey,
      "symbol":pairname,
      "order_id":orderid,
      "timestamp":timestamp
    }
    var functionsign=await getSignature(params, secret)
    var orderparams={
      "api_key":apiKey,
      "symbol":pairname,
      "order_id":orderid,
      "timestamp":timestamp,
      "sign":functionsign
    }
    // console.log("orderparamssssssss",orderparams);
       var header = {"Content-Type": "application/json"}
          const options = {
            url: "https://api.bybit.com/v2/private/order/cancel",
            method: 'POST',
            headers: header,
            body: JSON.stringify(orderparams)
          };
          rp(options).then(ordercancelled=>{
            var newcheck=JSON.parse(ordercancelled)
            console.log("/*/*/*/*/*bybit order succesfully cancelled",newcheck);
          })

  }
}

router.post('/allposition_details', (req, res) => {
  var userId = req.body.userId;
  tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},userId:ObjectId(userId) } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1,firstCurrency:1}},
          { "$group": { "_id": "$pairName","price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } ,"firstCurrency" :{ "$first": "$firstCurrency" } } }
          ]).exec(function(err,result){
            res.json({status:true,data:result,type:'allposition_details'});
          });
});

router.post('/getPricevalue', (req, res) => {
  var result = {};
  async.parallel({
      volumedata : function(cb) {
        var sort = {'orderDate':-1};
        tradeTable.aggregate([
           {
            $match:
            {
              "orderDate": {
                        $gte: new Date(Date.now() - 24*60*60 * 1000),
                        $lte: new Date()
                    },
              '$or' : [{"status" : '1'},{"status" : '2'}],
            }
          },
          {$unwind:"$filled"},
          {
            $match:
            {
              'filled.pairname': req.body.firstCurrency+req.body.secondCurrency
            }
          },
          {
            $group:
            {
              _id: "$item",
              low: { $min: "$filled.Price" },
              high: { $max: "$filled.Price" },
              volume :{ $sum: { $abs:"$filled.filledAmount"}}
            }
          }

        ]).allowDiskUse(true).exec(cb)
      },
      rates : function(cb) {
          spotPrices.aggregate([
              {
                  $match : {
                    "createdAt": {
                        $gte: new Date(Date.now() - 24*60*60 * 1000),
                        $lte: new Date()
                    },
                    pairname:req.body.firstCurrency+req.body.secondCurrency
                  }
              },
              {
                $sort : { 'createdAt' : 1 }
              },
                  { $limit: 86400 },
              {
                  $group : {
                      _id    : null,
                      pairname  : { $first : '$pairname'},
                      open  : { $first : '$price'},
                      close   : { $last : '$price'},
                      high   : { $max : '$price' },
                      low    : { $min : '$price' },
                  }
              },
              {
                  $project: {
                      _id      : 1,
                      pairname : 1,
                      open     : 1,
                      close    : 1,
                      low      : 1,
                      high     : 1,
                      change   : { $multiply: [{ $subtract: [ 1, { $divide: [ {$cond: [ { $eq: [ "$open", null ] }, 0, '$open' ]}, {$cond: [ { $eq: [ "$close", null ] }, 0, '$close' ]} ] } ] }, 100]}
                  }
              },
          ]).allowDiskUse(true).exec(cb)
      },
    },(err,results) => {

        if(err){
            result.status       = false;
            result.message      = 'Error occured.';
            result.err          = err;
            result.notify_show  = 'no';
            res.json(result);
        } else if(results){
            if(results.rates.length>0)
            {
                results.rates[0].volume = results.volumedata.length>0?results.volumedata[0].volume/2:0;
                var low          = results.rates[0].low;
                var high         = results.rates[0].high;
                var last         = results.rates[0].close;
                var open         = results.rates[0].open;
                var volume       = results.volumedata.length>0?parseFloat(results.volumedata[0].volume)/2:0;
                // var total_volume = results.rates[0].volume;

            }
            var change = (results.rates.length>0)?results.rates[0].change:0;
            perpetual.findOneAndUpdate({ "tiker_root":req.body.firstCurrency+req.body.secondCurrency },{ "$set": {"low": low,"high": high,"last": last,"volume": volume,"change":change}},{multi: true,"fields": {tiker_root:1}}).exec(function(err, resUpdate){
                if(resUpdate)
                {
                  // console.log(resUpdate,'price update');
                }
            });

            result.status       = true;
            result.message      = 'tradeTableAll';
            result.pricedet     = results.rates;
            // result.lastpricedet = results.lastpricedet;
            // result.change       = results.change;
            result.notify_show  = 'no';
            res.json(result);
        } else {
            result.status       = false;
            result.message      = 'Error occured.';
            result.err          = '';
            result.notify_show  = 'no';
            res.json(result);
        }
    });
});

function getusertradedata(userId,firstCurrency,secondCurrency)
{
  // console.log(userId,'getuserdra')
  var userId = userId;
    var result = {};
    async.parallel({
      orderHistory : function(cb) {
        var sort = {'_id':-1};
        tradeTable.aggregate([
          {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:firstCurrency,secondCurrency:secondCurrency,userId:ObjectId(userId)}},
          {$sort:sort},
          {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      Histroydetails : function(cb) {
        tradeTable.find({userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      Filleddetails : function(cb) {
        tradeTable.find({status:1,userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      Conditional_details : function(cb) {
        tradeTable.find({status:'4',userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      position_details : function(cb) {
        var pair = firstCurrency+secondCurrency;
          tradeTable.aggregate([
          { "$match": {filledAmount:{$ne:0},userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1}},
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },
      daily_details : function(cb) {
        var pair = firstCurrency+secondCurrency;
        var start = new Date();
        start.setHours(0,0,0,0);
        // console.log(start,'start');
        var end = new Date();
        end.setHours(23,59,59,999);
        // console.log(end,'start');
        tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},position_status:'1',userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          {$project:{"filled":1,leverage:1}},
          { "$match": {"filled.created_at": {$gte: new Date(start), $lt: new Date(end)}} },
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"Fees" :{ "$sum": "$filled.Fees" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
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
      Assetdetails : function(cb) {
         Assets.find({userId:ObjectId(userId)}).exec(cb)
      },
      contractdetails : function(cb) {
         perpetual.findOne({first_currency:firstCurrency,second_currency:secondCurrency},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1}).exec(cb)
      },
      closed_positions : function(cb) {
         position_table.find({userId:ObjectId(userId),pairname:firstCurrency+secondCurrency}).sort({'_id':-1}).exec(cb)
      },
      allposition_details : function(cb) {
         tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},userId:ObjectId(userId) } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1,firstCurrency:1}},
          { "$group": { "_id": "$pairName","price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } ,"firstCurrency" :{ "$first": "$firstCurrency" } } }
          ]).exec(cb)
      },
    },(err,results) => {

        if(err){
            result.status      = false;
            result.message     = 'Error occured.';
            result.err         = err;
            result.notify_show = 'no';
            // res.json(result);
        } else if(results){
            result.status               = true;
            result.message              = 'tradeTableAll';
            result.buyOrder             = results.buyOrder;
            result.sellOrder            = results.sellOrder;
            result.orderHistory         = results.orderHistory;
            result.Histroydetails       = results.Histroydetails;
            result.Conditional_details  = results.Conditional_details;
            result.Filleddetails        = results.Filleddetails;
            // result.lastpricedet         = results.lastpricedet;
            result.assetdetails         = results.Assetdetails;
            result.allposition_details  = results.allposition_details;
            result.contractdetails      = results.contractdetails;
            result.position_details     = results.position_details;
            result.closed_positions     = results.closed_positions;
            result.daily_details        = results.daily_details;
            result.notify_show          = 'no';
            if(typeof socketio != 'undefined' && typeof userId != 'undefined')
            {
                socketio.sockets.in(userId.toString()).emit('USERTRADE',result);
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
router.post('/changeopenpositions', (req, res) => {
  console.log('call here');
    tradeTable.findOneAndUpdate({'filled.user_id':ObjectId(req.body.user_id),'filled.position_status':1},{ "$set": {"leverage":req.body.leverage}},{new:true,"fields": {filled:1} },function(selltemp_err,selltempData){
        if(selltempData)
        {
            res.json({"status":true,"message":"Position updated successfully","notify_show":"yes"});
        }
        else
        {
            res.json({"status":true,"message":"Position updated successfully","notify_show":"yes"});
        }
    });
});

router.post('/getuserTradeData', (req, res) => {
   var userId = req.body.userid;
   var status = req.body.status;
   var firstCurrency = req.body.firstCurrency;
   var secondCurrency = req.body.secondCurrency;
    var result = {};
    // tradeTable.find(findObj,function(err,tradeTableAll){
    async.parallel({
      orderHistory : function(cb) {
        var sort = {'_id':-1};
        tradeTable.aggregate([
          {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],firstCurrency:req.body.firstCurrency,secondCurrency:req.body.secondCurrency,userId:ObjectId(userId)}},
          {$sort:sort},
          {$limit: 10},
        ]).allowDiskUse(true).exec(cb)
      },
      Histroydetails : function(cb) {
        tradeTable.find({userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      Filleddetails : function(cb) {
        tradeTable.find({status:1,userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      Conditional_details : function(cb) {
        tradeTable.find({status:'4',userId:ObjectId(userId),firstCurrency:firstCurrency,secondCurrency:secondCurrency}).sort({'_id':-1}).limit(20).exec(cb)
      },
      position_details : function(cb) {
        var pair = req.body.firstCurrency+req.body.secondCurrency;
          tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1}},
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },
      daily_details : function(cb) {
        var pair = req.body.firstCurrency+req.body.secondCurrency;
        var start = new Date();
        start.setHours(0,0,0,0);
        // console.log(start,'start');
        var end = new Date();
        end.setHours(23,59,59,999);
        // console.log(end,'start');
        tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},position_status:'1',userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          {$project:{"filled":1,leverage:1}},
          { "$match": {"filled.created_at": {$gte: new Date(start), $lt: new Date(end)}} },
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"Fees" :{ "$sum": "$filled.Fees" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },
      // lastpricedet : function(cb) {
      //   var sort = {'orderDate':-1};
      //   tradeTable.aggregate([
      //     {
      //       $match:
      //       {
      //         '$or' : [{"status" : '1'},{"status" : '2'}],
      //         firstCurrency:req.body.firstCurrency,
      //         secondCurrency:req.body.secondCurrency
      //       }
      //     },
      //     {$sort:sort},
      //     {$limit: 1},
      //   ]).allowDiskUse(true).exec(cb)
      // },
      Assetdetails : function(cb) {
         Assets.find({userId:ObjectId(req.body.userid)}).exec(cb)
      },
      contractdetails : function(cb) {
         perpetual.findOne({first_currency:req.body.firstCurrency,second_currency:req.body.secondCurrency},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1}).exec(cb)
      },
      closed_positions : function(cb) {
         position_table.find({userId:ObjectId(req.body.userid),pairname:req.body.firstCurrency+req.body.secondCurrency}).sort({'_id':-1}).limit(20)
         .exec(cb)
      },
      allposition_details : function(cb) {
         tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},userId:ObjectId(req.body.userid) } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1,firstCurrency:1}},
          { "$group": { "_id": "$pairName","price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } ,"firstCurrency" :{ "$first": "$firstCurrency" } } }
          ]).exec(cb)
      },
    },(err,results) => {
      // console.log(results.position_details,'position_details');
        if(err){
            result.status      = false;
            result.message     = 'Error occured.';
            result.err         = err;
            result.notify_show = 'no';
            res.json(result);
        } else if(results){
            result.status               = true;
            result.message              = 'tradeTableAll';
            result.buyOrder             = results.buyOrder;
            result.sellOrder            = results.sellOrder;
            result.orderHistory         = results.orderHistory;
            result.Histroydetails       = results.Histroydetails;
            result.Conditional_details  = results.Conditional_details;
            result.Filleddetails        = results.Filleddetails;
            // result.lastpricedet         = results.lastpricedet;
            result.assetdetails         = results.Assetdetails;
            result.contractdetails      = results.contractdetails;
            result.position_details     = results.position_details;
            result.allposition_details  = results.allposition_details;
            result.closed_positions     = results.closed_positions;
            result.daily_details        = results.daily_details;
            result.notify_show          = 'no';
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


function order_placing(ordertype,buyorsell,price,quantity,actleverage,pairname,userid,trigger_price=0,trigger_type=null,id=0,typeorder='Conditional',trailstopdistance=0,forced_liquidation=false)
{
    console.log(price,'trigger_type'+forced_liquidation);

       async.parallel({
      position_details : function(cb) {
          tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},position_status:'1',userId:ObjectId(userid),"pairName": pairname } },
          {$unwind:"$filled"},
          {$project:{"filled":1,leverage:1}},
          { "$group": { "_id": null,"quantity" :{ "$sum": "$filled.filledAmount" }} }
          ]).exec(cb)
      },

    },(err,results) => {
      var position_details = (results.position_details.length>0)?results.position_details[0].quantity:0;

          perpetual.find({$or: [{tiker_root:pairname },{tiker_root:'BTCUSD'}]},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1,markprice:1,maxquantity:1,minquantity:1,taker_fees:1},function(err,contractdetails){
            console.log(pairname,'pairname')
            var float = (pairname=='XRPUSD')?4:2;
            var index             = contractdetails.findIndex(x => (x.tiker_root) === pairname);
            var btcindex          = contractdetails.findIndex(x => (x.tiker_root) === 'BTCUSD');
            var markprice         = contractdetails[index].markprice;
            var btcprice          = contractdetails[btcindex].markprice;
            var taker_fees        = contractdetails[index].taker_fees;
            var leverage          = parseFloat(actleverage);
            var order_value1      = parseFloat(quantity)*parseFloat(price);
            var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
            var required_margin   = parseFloat(order_value1)/leverage;
            var fee               = parseFloat(order_value1)*taker_fees/100;
            var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
            var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
            var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
            order_cost            = parseFloat(order_cost).toFixed(8);


                var mainmargin = contractdetails[index].maint_margin/100;
                var balance_check = true;
            if(buyorsell=='buy')
            {
                if(position_details<0 && Math.abs(position_details)>=quantity)
                {
                  var balance_check = false;
                }
                var Liqprice = price*leverage/((leverage+1)-(mainmargin*leverage));
            }
            else
            {
               if(position_details>0 && Math.abs(position_details)>=quantity)
                {
                  var balance_check = false;
                }
                quantity = parseFloat(quantity)*-1;
                var Liqprice = price*leverage/((leverage-1)+(mainmargin*leverage));
            }
            if(err){
              res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
            }
            else
            {
              Assets.findOne({userId:ObjectId(userid),currencySymbol:'BTC'},function(err,assetdetails){
                if(err){
                  res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
                } else if(assetdetails){
                  var firstcurrency  = contractdetails[index].first_currency;
                  var secondcurrency = contractdetails[index].second_currency;
                  var curbalance     = assetdetails.balance;
                  // if(curbalance<order_cost && balance_check==true)
                  // {
                  //   console.log({status:false,message:"Due to insuffient balance order cannot be placed",notify_show:'yes'})
                  // } else {

                    var before_reduce_bal = curbalance;
                    var after_reduce_bal = curbalance-(balance_check)?order_cost:0;

                    var updateObj = {balance:after_reduce_bal};

                    // Assets.findByIdAndUpdate(assetdetails._id, updateObj, {new: true}, function(err, changed) {
                    //   if (err) {
                    //     res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
                    //   } else if(changed){
                      console.log(typeorder,'triggertyrp')
                      if(typeorder=='trailingstop')
                      {
                           const newtradeTable = new tradeTable({
                          quantity          : parseFloat(quantity).toFixed(8),
                          price             : parseFloat(price).toFixed(float),
                          trigger_price     : trigger_price,
                          orderCost         : order_cost,
                          orderValue        : order_value,
                          leverage          : actleverage,
                          userId            : userid,
                          pair              : contractdetails[index]._id,
                          pairName          : pairname,
                          beforeBalance     : before_reduce_bal,
                          afterBalance      : after_reduce_bal,
                          firstCurrency     : firstcurrency,
                          secondCurrency    : secondcurrency,
                          Liqprice          : Liqprice,
                          orderType         : ordertype,
                          trigger_type      : trigger_type,
                          stopstatus        : '0',
                          buyorsell         : buyorsell,
                          pairid            : id,
                          trigger_ordertype : typeorder,
                          btcprice          : btcprice,
                          taker_fees        : taker_fees,
                          trailstop         : '1',
                          trailstopdistance : trailstopdistance,
                          forced_liquidation : forced_liquidation,
                          status            : 4 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                        });
                           newtradeTable
                        .save()
                        .then(curorder => {
                          if(typeof socketio != 'undefined')
                          {
                              socketio.sockets.in(userid.toString()).emit('NOTIFICATION',"Trail stop order created successfully");
                          }
                          tradematching(curorder);
                        }).catch(err => { console.log(err,'error'); res.json({status:false,message:"Your order not placed.",notify_show:'yes'})});``
                      }
                      else
                      {
                         const newtradeTable = new tradeTable({
                          quantity          : quantity,
                          price             : (typeorder=='stop' || typeorder=='takeprofit')?trigger_price:price,
                          trigger_price     : trigger_price,
                          orderCost         : order_cost,
                          orderValue        : order_value,
                          leverage          : actleverage,
                          userId            : userid,
                          pair              : contractdetails[index]._id,
                          pairName          : pairname,
                          beforeBalance     : before_reduce_bal,
                          afterBalance      : after_reduce_bal,
                          firstCurrency     : firstcurrency,
                          secondCurrency    : secondcurrency,
                          Liqprice          : Liqprice,
                          orderType         : ordertype,
                          trigger_type      : trigger_type,
                          stopstatus        : (typeorder!='Conditional')?'1':'0',
                          buyorsell         : buyorsell,
                          pairid            : id,
                          trigger_ordertype : typeorder,
                          btcprice          : btcprice,
                          taker_fees        : taker_fees,
                          forced_liquidation : forced_liquidation,
                          status            : (trigger_type!=null)?4:0 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                        });
                         newtradeTable
                        .save()
                        .then(curorder => {

                          // if(forced_liquidation==false)
                          // {
                            tradematching(curorder);
                          // }
                        }).catch(err => { console.log(err,'error'); res.json({status:false,message:"Your order not placed.",notify_show:'yes'})});
                      }

                    //   }
                    // })
                    // insert trade tab
                  // }
                } else {

                }
              });
            }

          });
    });


}

router.post('/triggerstop', (req, res) => {
    var takeprofitcheck      = req.body.takeprofitcheck;
    var stopcheck            = req.body.stopcheck;
    var quantity             = req.body.quantity;
    var takeprofit           = req.body.takeprofit;
    var ordertype            = req.body.ordertype;
    var buyorsell            = req.body.buyorsell;
    var price                = req.body.price;
    var leverage             = req.body.leverage;
    var trailingstopdistance = req.body.trailingstopdistance;

    if(takeprofitcheck)
    {
        var trigger_price = takeprofit;
        var tptrigger_type = "Mark";
        var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
        order_placing(ordertype,newbuyorsell,price,quantity,leverage,req.body.pairname,req.body.userid,trigger_price,tptrigger_type,0,'takeprofit');
        res.json({status:true,message:"Your take profit order set successfully.",notify_show:'yes'});
    }
    if(stopcheck)
    {
        var stoptrigger_type = "Mark";
        var trigger_price = stopprice;
        var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
        order_placing(ordertype,newbuyorsell,price,quantity,leverage,req.body.pairname,req.body.userid,trigger_price,stoptrigger_type,0,'stop');
         res.json({status:true,message:"Your stop order set successfully.",notify_show:'yes'});
    }
    if(trailingstopdistance!='' && trailingstopdistance!= 0)
    {

        var trigger_price = (buyorsell=='buy')?parseFloat(price)+parseFloat(trailingstopdistance):parseFloat(price)-parseFloat(trailingstopdistance);
        // var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
        order_placing(ordertype,buyorsell,price,quantity,leverage,req.body.pairname,req.body.userid,trigger_price,'Last',0,'trailingstop',trailingstopdistance);
         res.json({status:true,message:"Your trail stop order set successfully.",notify_show:'yes'});
    }
});

function write_log(msg){
    var now = new Date();
    var log_file = 'log/common_log_' + now.getFullYear() + now.getMonth() + now.getDay() + '.txt';
    fs.appendFileSync(log_file,msg);
    //console.log(msg);
    return true;
  }
router.post('/orderPlacing', (req, res) => {



      var bytes  = CryptoJS.AES.decrypt(req.body.token, keys.cryptoPass);
    req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));



    // console.log("after the decryption",req.body);
    var reqdate=req.body.newdate


    var data1 = new Date(reqdate);
    console.log("datea1",data1);

    var data2 = new Date()
    console.log("Datate2",data2);
    var anotherdate=data2.getTime() + (1000 * 5)
    var indate=new Date(anotherdate)
    console.log("anotherdate",indate);
    if(indate>data1){
    const { errors, isValid } = validateTradeInput(req.body);
    if (!isValid) {
      res.json({
        status:false,
        message:"Error occured, please fill all required fields.",
        errors:errors,
        notify_show:'yes'
      });
    } else {

      var post_only       = req.body.post_only;
      var reduce_only     = req.body.reduce_only;
      var ordertype       = req.body.ordertype;
      var buyorsell       = req.body.buyorsell;
      var price           = req.body.price;
      var timeinforcetype = req.body.timeinforcetype;
      var trigger_price   = req.body.trigger_price;
      var trigger_type    = req.body.trigger_type;
      var quantity        = req.body.quantity;
      var takeprofitcheck = req.body.takeprofitcheck;
      var stopcheck       = req.body.stopcheck;
      var takeprofit      = req.body.takeprofit;
      var stopprice       = req.body.stopprice;


       async.parallel({
      position_details : function(cb) {
        var pair = req.body.pairname;
          tradeTable.aggregate([
          { "$match": { filledAmount:{$ne:0},position_status:'1',userId:ObjectId(req.body.userid),"pairName": pair } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1}},
         { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },
      // orderbook : function(cb) {
      //   var pair = req.body.pairname;
      //   var type = req.body.buyorsell=='buy'?"sell":"buy";
      //   var sort = {'_id':req.body.buyorsell=='buy'?1:-1};
      //   tradeTable.aggregate([
      //   {$match:{'$or' : [{"status" : '0'},{"status" : '2'}],"pairName": pair,buyorsell:type}},
      //   {
      //     $group : {
      //       '_id'          : '$price',
      //       'quantity'     : { $sum : '$quantity' },
      //       'filledAmount' : { $sum : '$filledAmount' }
      //     }
      //   },
      //   {$sort:sort},
      //   {$limit: 100},
      //   ]).allowDiskUse(true).exec(cb)
      // },

    },(err,results) => {
      var position_details = (results.position_details.length>0)?results.position_details[0].quantity:0;
      var position_price   = (results.position_details.length>0)?results.position_details[0].price:0;
      // var orderbook        = (results.orderbook.length>0)?results.orderbook:0;

      // if(results.orderbook.length>0 && req.body.ordertype=='Market')
      // {
      //   var orderdetails = results.orderbook;
      //   var ordertotal   = 0;
      //   for(var i=0;i<orderdetails.length;i++)
      //   {
      //     var orderprice    = orderdetails[i]._id;
      //     var orderquantity = parseFloat(Math.abs(orderdetails[i].quantity)) - parseFloat(Math.abs(orderdetails[i].filledAmount));
      //     ordertotal        = parseFloat(Math.abs(ordertotal)) + parseFloat(Math.abs(orderquantity));

      //     if(parseFloat(ordertotal)>=parseFloat(Math.abs(quantity)))
      //     {
      //       price = orderprice;
      //       break;
      //     }
      //   }
      // }

      console.log(price,'price');
          perpetual.find({$or: [{tiker_root:req.body.pairname },{tiker_root:'BTCUSD'}]},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1,markprice:1,maxquantity:1,minquantity:1,taker_fees:1},function(err,contractdetails){

            var index             = contractdetails.findIndex(x => (x.tiker_root) === req.body.pairname);
            var btcindex          = contractdetails.findIndex(x => (x.tiker_root) === 'BTCUSD');
            var markprice         = parseFloat(contractdetails[index].markprice).toFixed(4);
            var btcprice          = contractdetails[btcindex].markprice;
            var maxquantity       = contractdetails[index].maxquantity;
            var minquantity       = contractdetails[index].minquantity;
            var taker_fees        = contractdetails[index].taker_fees;
            var leverage          = parseFloat(req.body.leverage);
            var order_value1      = parseFloat(quantity*price).toFixed(8);
            var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
            var required_margin   = parseFloat(order_value1)/leverage;
            var fee               = parseFloat(order_value1)*taker_fees/100;
            var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
            var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
            var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
            order_cost            = parseFloat(order_cost).toFixed(8);
            var mainmargin        = contractdetails[index].maint_margin/100;
            var firstcurrency  = contractdetails[index].first_currency;
            if(req.body.buyorsell=='buy'){
                var Liqprice = price*req.body.leverage/((req.body.leverage+1)-(mainmargin*req.body.leverage));
            }
            else
            {
               var Liqprice = parseFloat(price)*parseFloat(req.body.leverage)/((parseFloat(req.body.leverage)-1)+(parseFloat(mainmargin)*parseFloat(req.body.leverage)));
            }

            if(req.body.price<0.001)
            {
                return res.json({
                status:false,
                message:"Price of contract must not be lesser than 0.001",
                notify_show:'yes'
                });
            }
            else if(parseFloat(quantity) < parseFloat(minquantity))
            {
                return res.json({
                status:false,
                message:"Quantity of contract must not be lesser than "+minquantity,
                notify_show:'yes'
                });
            }
            else if(parseFloat(quantity) > parseFloat(maxquantity))
            {
                return res.json({
                status:false,
                message:"Quantity of contract must not be higher than "+maxquantity,
                notify_show:'yes'
                });
            }
            else if(ordertype=='Limit' && buyorsell=="buy" && parseFloat(req.body.price) > parseFloat(markprice))
            {
                return res.json({
                status:false,
                message:"Entry price you set must be lower or equal to "+markprice,
                notify_show:'yes'
                });
            }
            else if(ordertype=='Limit' && buyorsell=="sell" && parseFloat(req.body.price) < parseFloat(markprice))
            {
                return res.json({
                status:false,
                message:"Entry price you set must be higher or equal to "+markprice,
                notify_show:'yes'
                });
            }
            else if(ordertype=='Limit' && buyorsell=="buy" && parseFloat(Liqprice) > parseFloat(price))
            {
              return res.json({
                status:false,
                message:"Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be above Mark Price if the order is fulfilled.",
                notify_show:'yes'
                });
            }
            else if(ordertype=='Limit' && buyorsell=="sell" && parseFloat(Liqprice) < parseFloat(price))
            {
                return res.json({
                status:false,
                message:"Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be beloww Mark Price if the order is fulfilled.",
                notify_show:'yes'
                });
            }
            else
            {

            var balance_check = true;
            var profitnloss   = 0;
            if(req.body.buyorsell=='buy')
            {
                if(position_details<0 && Math.abs(position_details)>=quantity)
                {
                  var balance_check = false;
                }

                if(position_details>0 && buyorsell=='sell' && Math.abs(position_details)>=parseFloat(quantity))
                {
                  var balance_check = false;
                  var profitnlossusd = (parseFloat(price)) - (parseFloat(position_price));
                  var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(position_details);

                  var profitnloss    = parseFloat(profitnlossusd)/parseFloat(position_price);
                }
                else if(position_details<0 && buyorsell=='buy' && Math.abs(position_details)>=parseFloat(quantity))
                {
                  console.log(position_price);
                  console.log(price);
                  var balance_check = false;
                  var profitnlossusd = (parseFloat(position_price)) - (parseFloat(price));
                  var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(Math.abs(position_details));

                  var profitnloss    = parseFloat(profitnlossusd)/parseFloat(position_price);
                }
            }
            else
            {
               if(position_details>0 && buyorsell=='sell' && Math.abs(position_details)>=parseFloat(quantity))
                {
                  var balance_check = false;
                  var profitnlossusd = (parseFloat(price)) - (parseFloat(position_price));
                  var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(position_details);

                  var profitnloss    = parseFloat(profitnlossusd)/parseFloat(position_price);
                }
                else if(position_details<0 && buyorsell=='buy' && Math.abs(position_details)>=parseFloat(quantity))
                {
                  var balance_check = false;
                  var profitnlossusd = (parseFloat(price)) - (parseFloat(position_price));
                  var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(position_details);

                  var profitnloss    = parseFloat(profitnlossusd)/parseFloat(position_price);
                }
                quantity = parseFloat(quantity)*-1;


            }
            if(err){
              res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
            }
            else
            {
              Assets.findOne({userId:ObjectId(req.body.userid),currencySymbol:'BTC'},function(err,assetdetails){
                if(err){
                  res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
                } else if(assetdetails){
                  var firstcurrency  = contractdetails[index].first_currency;
                  var secondcurrency = contractdetails[index].second_currency;
                  var curbalance     = parseFloat(assetdetails.balance);
                  if(curbalance<order_cost && balance_check==true)
                  {
                    res.json({status:false,message:"Due to insuffient balance order cannot be placed",notify_show:'yes'})
                  } else {

                    var before_reduce_bal = assetdetails.balance;
                    // if(firstcurrency=='BTC')
                    // {
                        if(order_cost<=assetdetails.balance)
                        {
                            var after_reduce_bal = parseFloat(assetdetails.balance)-parseFloat(order_cost);
                        }

                        if(balance_check)
                        {
                          var updateObj = {balance:after_reduce_bal};
                        }
                        else
                        {
                          var updateObj = {balance:before_reduce_bal};
                        }


                    var userid = req.body.userid;

                    Assets.findByIdAndUpdate(assetdetails._id, updateObj, {new: true}, function(err, changed) {
                      if (err) {
                        res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
                      } else if(changed){
                        var float = (req.body.pairname=='XRPUSD')?4:2;
                        const newtradeTable = new tradeTable({
                          quantity           : parseFloat(quantity).toFixed(8),
                          price              : parseFloat(price).toFixed(float),
                          trigger_price      : trigger_price,
                          orderCost          : order_cost,
                          orderValue         : order_value,
                          leverage           : req.body.leverage,
                          userId             : req.body.userid,
                          pair               : contractdetails[index]._id,
                          pairName           : req.body.pairname,
                          postOnly           : post_only,
                          reduceOnly         : reduce_only,
                          beforeBalance      : before_reduce_bal,
                          afterBalance       : after_reduce_bal,
                          timeinforcetype    : timeinforcetype,
                          firstCurrency      : firstcurrency,
                          secondCurrency     : secondcurrency,
                          Liqprice           : Liqprice,
                          orderType          : ordertype,
                          trigger_type       : trigger_type,
                          buyorsell          : buyorsell,
                          btcprice           : btcprice,
                          taker_fees         : taker_fees,
                          status             : (trigger_type!=null)?4:0 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                        });
                        newtradeTable
                        .save()
                        .then(curorder => {
                         // write_log("\n"+JSON.stringify({date:new Date(),process:"orderplacing",result:curorder}));
                          var io = req.app.get('socket');
                          if(typeof io != 'undefined')
                          {
                              socketio.sockets.in(req.body.userid.toString()).emit('TRADE', curorder);
                           }
                          res.json({status:true,message:"Your order placed successfully.",notify_show:'yes'});
                          if(takeprofitcheck==false)
                          {
                              var trigger_price = takeprofit;
                              var tptrigger_type = "Mark";
                              var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
                              order_placing(ordertype,newbuyorsell,price,quantity,leverage,req.body.pairname,req.body.userid,trigger_price,tptrigger_type,curorder._id,'takeprofit');
                          }
                          // console.log(profitnloss,'profitnloss')
                          // console.log(balance_check,'balance_check')
                          if(stopcheck==false)
                          {
                              var stoptrigger_type = "Mark";
                              var trigger_price = stopprice;
                              var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
                              order_placing(ordertype,newbuyorsell,price,quantity,leverage,req.body.pairname,req.body.userid,trigger_price,stoptrigger_type,curorder._id,'stop');
                          }
                          // console.log(balance_check,'balance_check')
                          // console.log(profitnloss,'profitnloss')

                          tradematching(curorder,io,balance_check,profitnloss);
                        }).catch(err => { console.log(err,'error'); res.json({status:false,message:"Your order not placed.",notify_show:'yes'})});``
                      }
                    })
                    // insert trade tab
                  }
                } else {
                  res.json({status:false,message:"Error occured.",err:'no res 2',notify_show:'yes'});
                }
              });
            }
            }

          });
    });
    }
  }else{
    res.json({
      status:false,
      message:"Error occured For the Interval.",
      errors:errors,
      notify_show:'yes'
    });
  }



  });

function selldetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,buyprice,maker_rebate,io,sellerforced_liquidation,sellleverage,buyOrder,callBackOne)
{
  // console.log(tempdata,'selltempdataprev')
  var buyuserid = tempdata.user_id;
  if (callBackOne) {
    tradeinfo.callBacksellTrade = callBackOne;
  }
  async.waterfall([
    function(callback){
     tradeTable.findOneAndUpdate({_id:ObjectId(buyorderid)},{"$set":{"status":buyUpdate.status},"$push":{"filled":tempdata},"$inc":{"filledAmount" : parseFloat(buyUpdate.filledAmt)}},{new:true,"fields": {status:1,filled:1}},function(buytemp_err,buytempData1){
            if(buytempData1)
            {
                 callback(null, buytempData1);
            }
      });
    },
    function(data,callback){
        var order_value1      = parseFloat(sellUpdate.filledAmt*buyprice).toFixed(8);
        var order_value       = parseFloat(order_value1/buyOrder.btcprice).toFixed(8);
        var required_margin   = parseFloat(order_value1)/sellleverage;
        var fee               = parseFloat(order_value1)*buyOrder.taker_fees/100;
        var margininbtc       = parseFloat(required_margin)/parseFloat(buyOrder.btcprice);
        var feeinbtc          = parseFloat(fee)/parseFloat(buyOrder.btcprice);
        var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
        order_cost            = parseFloat(order_cost).toFixed(8);

        var fee_amount              = feeinbtc;
        tempdata.Type               = "sell";
        tempdata.user_id            = ObjectId(selluserid);
        tempdata.order_cost         = parseFloat(order_cost).toFixed(8);
        tempdata.forced_liquidation = sellerforced_liquidation;
        tempdata.Fees               = parseFloat(fee_amount).toFixed(8);
        tempdata.filledAmount       = +(sellUpdate.filledAmt).toFixed(8)*-1;
        tempdata.afterBalance       = buyOrder.afterBalance;
        tempdata.beforeBalance      = buyOrder.beforeBalance;
        tempdata.uniqueid           = Math.floor(Math.random() * 1000000000);
       // console.log(tempdata,'selltempdatanext')
        tempdata.order_value        = order_value;
        console.log(sellUpdate.status,'sellUpdate.status');
        tradeTable.findOneAndUpdate({_id:ObjectId(sellorderid)},{"$set":{"status":sellUpdate.status},"$push":{"filled":tempdata},"$inc":{"filledAmount" : parseFloat(sellUpdate.filledAmt * -1)}},{new:true,"fields": {status:1,filled:1} },function(buytemp_err,selltempData){
                if(selltempData)
                {

                    positionmatching(data.filled[data.filled.length-1]);
                    positionmatching(selltempData.filled[selltempData.filled.length-1]);
                    callback(null, selltempData);
                }
        });
    },
], function (err,result) {
  tradeinfo.callBacksellTrade();
  //Bonus updation
    FeeTable.findOne({}).exec(function (err,bonusdetails) {
      // console.log(bonusdetails,'bonusdetails')
      if(bonusdetails)
      {
        var trade_bonus = bonusdetails.trade_bonus;
        var updatebonusdata = {};
        updatebonusdata["tempcurrency"] = trade_bonus;
        Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(selluserid)},{"$inc": updatebonusdata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
          console.log(balerr,'bale')
          console.log(baldata,'bale')
                  const newBonus = new Bonus({
                  userId       : selluserid,
                  bonus_amount : trade_bonus,
                  type         : '4',
                  });
                  newBonus.save(function(err,data){
                  // console.log(err,'err')
                  // console.log(data,'data')
                  });
              });

        Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(buyuserid)},{"$inc": updatebonusdata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
          console.log(balerr,'bale')
          console.log(baldata,'bale')
              const newBonus = new Bonus({
                  userId       : buyuserid,
                  bonus_amount : trade_bonus,
                  type         : '4',
                  });
                  newBonus.save(function(err,data){
                  // console.log(err,'err')
                  // console.log(data,'data')
                  });
              });
      }
    });
    //socket call
      setTimeout(function () {
        gettradedata(result.filled[0].firstCurrency,result.filled[0].secondCurrency,socketio);
        getusertradedata(result.filled[0].selluserId,result.filled[0].firstCurrency,result.filled[0].secondCurrency);
        getusertradedata(result.filled[0].buyuserId,result.filled[0].firstCurrency,result.filled[0].secondCurrency);
      }, 3000);


    tradeTable.findOneAndUpdate({pairid:(buyorderid),status:'4',stopstatus:'1'},{ "$set": {"stopstatus":'2'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

    });

    tradeTable.findOneAndUpdate({pairid:(sellorderid),status:'4',stopstatus:'1'},{ "$set": {"stopstatus":'2'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

    });

    tradeTable.find({status:'4',trigger_type:'Last'},function(buytemp_err,buytempData){
              if(buytempData.length)
              {
                  for (var i=0; i < buytempData.length; i++) {
                      var _id           = buytempData[i]._id;
                      var price         = buytempData[i].price;
                      var trigger_price = buytempData[i].trigger_price;
                      var userId        = buytempData[i].userId;
                      var pairName      = buytempData[i].pairName;
                      var leverage      = buytempData[i].leverage;
                      var quantity      = buytempData[i].quantity;
                      var buyorsell     = buytempData[i].buyorsell;
                      var orderType     = buytempData[i].orderType;
                      var trailstop     = buytempData[i].trailstop;
                      var different     = parseFloat(price)-parseFloat(trigger_price);
                      // console.log(trigger_price,'trigger_price');
                      // console.log(buyprice,'buyprice');
                      if(different>0)
                      {
                          if(trailstop=='0' && parseFloat(trigger_price)>parseFloat(buyprice))
                          {
                              // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                                tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                          }
                      }
                      else
                      {
                          if(trailstop=='0' && parseFloat(trigger_price)<parseFloat(buyprice))
                          {
                              //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                               tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

                                    // console.log(buytemp_err,'trigger error');
                                });
                          }
                      }
                      //trailing stop trigger
                      if(trailstop=='1' && buyorsell=='buy' && parseFloat(price)>parseFloat(buyprice))
                      {
                          var addprice = (parseFloat(buyprice)-parseFloat(price))
                          var newtriggerprice = parseFloat(trigger_price)+parseFloat(addprice);
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"price":newtriggerprice,"trigger_price":newtriggerprice}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                 // console.log(buytemp_err,'trigger error');
                          });
                      }
                      if(trailstop=='1' && buyorsell=='buy' && parseFloat(trigger_price)<parseFloat(buyprice))
                      {
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                      }
                      if(trailstop=='1' && buyorsell=='sell' && parseFloat(price)<parseFloat(buyprice))
                      {
                            var addprice = (parseFloat(price)-parseFloat(buyprice))
                            var newtriggerprice = parseFloat(trigger_price)-parseFloat(addprice);
                            tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"price":newtriggerprice,"trigger_price":newtriggerprice}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                 // console.log(buytemp_err,'trigger error');
                            });
                      }
                      if(trailstop=='1' && buyorsell=='sell' && parseFloat(trigger_price)>parseFloat(buyprice))
                      {
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                      }
                  }
              }
          });

});
}
function buydetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,buyprice,maker_rebate,io,sellforced_liquidation,sellleverage,sellOrder,callBackOne)
{
  var buyuserid = tempdata.user_id;
  // console.log(tempdata,'tempdataii')
if (callBackOne) {
    tradeinfo.callBackbuyTrade = callBackOne;
  }
  async.waterfall([
    function(callback){
      tradeTable.findOneAndUpdate({_id:ObjectId(buyorderid)},{ "$set": {"status":buyUpdate.status},"$push":{"filled":tempdata},"$inc":{"filledAmount":buyUpdate.filledAmt}},{new:true,"fields": {filled:1} },function(buytemp_err,buytempData){
            if(buytempData)
            {
                 callback(null, buytempData);
            }
      });
    },
    function(data,callback){

        var order_value1      = parseFloat(sellUpdate.filledAmt*buyprice).toFixed(8);
        var order_value       = parseFloat(order_value1/sellOrder.btcprice).toFixed(8);
        var required_margin   = parseFloat(order_value1)/sellleverage;
        var fee               = parseFloat(order_value1)*sellOrder.taker_fees/100;
        var margininbtc       = parseFloat(required_margin)/parseFloat(sellOrder.btcprice);
        var feeinbtc          = parseFloat(fee)/parseFloat(sellOrder.btcprice);
        var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
        order_cost            = parseFloat(order_cost).toFixed(8);


        var fee_amount              = feeinbtc;
        tempdata.Type               = "sell";
        tempdata.user_id            = ObjectId(selluserid);
        tempdata.order_cost         = order_cost;
        tempdata.forced_liquidation = sellforced_liquidation;
        tempdata.filledAmount       = (sellUpdate.filledAmt) * -1;
        tempdata.Fees               = parseFloat(fee_amount).toFixed(8);
        tempdata.beforeBalance      = sellOrder.beforeBalance;
        tempdata.afterBalance       = sellOrder.afterBalance;
        tempdata.order_value        = order_value;
        tempdata.uniqueid           = Math.floor(Math.random() * 1000000000);
        // console.log(tempdata,'tempdatanext')
        tradeTable.findOneAndUpdate({_id:ObjectId(sellorderid)},{ "$set": {"status":sellUpdate.status},"$push":{"filled":tempdata},"$inc":{"filledAmount":parseFloat(sellUpdate.filledAmt)*-1}},{new:true,"fields": {filled:1} },function(selltemp_err,selltempData){
            if(selltempData)
            {
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              positionmatching(data.filled[data.filled.length-1]);
              positionmatching(selltempData.filled[selltempData.filled.length-1]);
              callback(null, selltempData);
            }
        });
    },
], function (err,result) {
   tradeinfo.callBackbuyTrade();
   //Bonus updation
    FeeTable.findOne({}).exec(function (err,bonusdetails) {
       // console.log(bonusdetails,'bonusdetails')
      if(bonusdetails)
      {
        var trade_bonus = bonusdetails.trade_bonus;
        var updatebonusdata = {};
        updatebonusdata["tempcurrency"] = trade_bonus;
        Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(selluserid)},{"$inc": updatebonusdata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
          console.log(balerr,'bale')
          console.log(baldata,'bale')
                  const newBonus = new Bonus({
                  userId       : selluserid,
                  bonus_amount : trade_bonus,
                  type         : '4',
                  });
                  newBonus.save(function(err,data){
                  // console.log(err,'err')
                  // console.log(data,'data')
                  });
              });

        Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(buyuserid)},{"$inc": updatebonusdata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
          console.log(balerr,'bale')
          console.log(baldata,'bale')
              const newBonus = new Bonus({
                  userId       : buyuserid,
                  bonus_amount : trade_bonus,
                  type         : '4',
                  });
                  newBonus.save(function(err,data){
                  // console.log(err,'err')
                  // console.log(data,'data')
                  });
              });
      }
    });

    //socket call
      setTimeout(function () {
          gettradedata(result.filled[0].firstCurrency,result.filled[0].secondCurrency,socketio);
          getusertradedata(result.filled[0].selluserId,result.filled[0].firstCurrency,result.filled[0].secondCurrency);
          getusertradedata(result.filled[0].buyuserId,result.filled[0].firstCurrency,result.filled[0].secondCurrency);
      }, 3000);

    tradeTable.findOneAndUpdate({pairid:(buyorderid),status:'4',stopstatus:'1'},{ "$set": {"stopstatus":'2'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

    });

    tradeTable.findOneAndUpdate({pairid:(sellorderid),status:'4',stopstatus:'1'},{ "$set": {"stopstatus":'2'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

    });

    tradeTable.find({status:'4',trigger_type:'Last'},).limit(10,function(buytemp_err,buytempData){
              if(buytempData.length)
              {
                  for (var i=0; i < buytempData.length; i++) {
                      var _id           = buytempData[i]._id;
                      var price         = buytempData[i].price;
                      var trigger_price = buytempData[i].trigger_price;
                      var userId        = buytempData[i].userId;
                      var pairName      = buytempData[i].pairName;
                      var leverage      = buytempData[i].leverage;
                      var quantity      = buytempData[i].quantity;
                      var buyorsell     = buytempData[i].buyorsell;
                      var orderType     = buytempData[i].orderType;
                      var trailstop     = buytempData[i].trailstop;
                      var different     = parseFloat(price)-parseFloat(trigger_price);
                      // console.log(trigger_price,'trigger_price');
                      // console.log(buyprice,'buyprice');
                      if(different>0)
                      {
                          if(trailstop=='0' && parseFloat(trigger_price)>parseFloat(buyprice))
                          {
                              // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                                tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                          }
                      }
                      else
                      {
                          if(trailstop=='0' && parseFloat(trigger_price)<parseFloat(buyprice))
                          {
                              //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                               tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

                                    // console.log(buytemp_err,'trigger error');
                                });
                          }
                      }
                      //trailing stop trigger
                      if(trailstop=='1' && buyorsell=='buy' && parseFloat(price)>parseFloat(buyprice))
                      {
                          var addprice = (parseFloat(buyprice)-parseFloat(price))
                          var newtriggerprice = parseFloat(trigger_price)+parseFloat(addprice);
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"price":newtriggerprice,"trigger_price":newtriggerprice}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                 // console.log(buytemp_err,'trigger error');
                          });
                      }
                      if(trailstop=='1' && buyorsell=='buy' && parseFloat(trigger_price)<parseFloat(buyprice))
                      {
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                      }
                      if(trailstop=='1' && buyorsell=='sell' && parseFloat(price)<parseFloat(buyprice))
                      {
                            var addprice = (parseFloat(price)-parseFloat(buyprice))
                            var newtriggerprice = parseFloat(trigger_price)-parseFloat(addprice);
                            tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"price":newtriggerprice,"trigger_price":newtriggerprice}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                 // console.log(buytemp_err,'trigger error');
                            });
                      }
                      if(trailstop=='1' && buyorsell=='sell' && parseFloat(trigger_price)>parseFloat(buyprice))
                      {
                          tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:{$ne:'1'} },{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){
                                    // console.log(buytemp_err,'trigger error');
                                });
                      }
                  }
              }
          });

});
}
async function buymatchingprocess(curorder,tradedata,pairData,io)
{
    // console.log("buy");
    var buyOrder          = curorder,
    buyAmt                = rounds(buyOrder.quantity),
    buyorderid            = buyOrder._id,
    buyuserid             = buyOrder.userId,
    buyleverage           = buyOrder.leverage,
    buyforced_liquidation = buyOrder.forced_liquidation,
    forceBreak            = false,
    buyeramount           = rounds(buyOrder.quantity),
    buyeramount1          = rounds(buyOrder.quantity),
    buytempamount         = 0;
    buy_res_len           = tradedata.length;
    // tradedata.forEach(function(data_loop){
        // for (var i = 0; i < tradedata.length; i++) {
      await Promise.all(tradedata.map(async (file) => {
        var data_loop = file;
        buyAmt = rounds(buyOrder.quantity-buytempamount);
        if(buyAmt == 0 || forceBreak == true){
          // console.log("break");
          return;
        }
        else{
            var ii = i,
            sellOrder              = data_loop,
            sellorderid            = sellOrder._id,
            selluserid             = sellOrder.userId,
            sellleverage           = sellOrder.leverage,
            sellforced_liquidation = sellOrder.forced_liquidation,
            sellAmt                = rounds(+sellOrder.quantity - +sellOrder.filledAmount),
            silentBreak            = false,
            buyUpdate              = {},
            sellUpdate             = {},
            buyerBal               = 0,
            sellerBal              = 0,
            orderSocket            = {}
            buyeramount            = buyeramount-sellAmt;
            // console.log(buyAmt,"buyAmt");
            // console.log(Math.abs(sellAmt),"sellAmt");
            if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
                // console.log("amount eq");
                buyUpdate = {
                  status: '1',
                  filledAmt: Math.abs(sellAmt)
                }
                sellUpdate =  {
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

              var order_value1      = parseFloat(buyUpdate.filledAmt*buyOrder.price).toFixed(8);
              var order_value       = parseFloat(order_value1/buyOrder.btcprice).toFixed(8);
              var required_margin   = parseFloat(order_value1)/buyleverage;
              var fee               = parseFloat(order_value1)*pairData.taker_fees/100;
              var margininbtc       = parseFloat(required_margin)/parseFloat(buyOrder.btcprice);
              var feeinbtc          = parseFloat(fee)/parseFloat(buyOrder.btcprice);
              var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
              order_cost            = parseFloat(order_cost).toFixed(8);

                // console.log("si brk");
                var taker_fee = pairData.taker_fees;
                var fee_amount = feeinbtc;
                var tempdata = {
                    "pair"               : ObjectId(pairData._id),
                    "firstCurrency"      : pairData.first_currency,
                    "secondCurrency"     : pairData.second_currency,
                    "buyuserId"          : ObjectId(buyuserid),
                    "user_id"            : ObjectId(buyuserid),
                    "selluserId"         : ObjectId(selluserid),
                    "sellId"             : ObjectId(sellorderid),
                    "buyId"              : ObjectId(buyorderid),
                    "filledAmount"       : +(buyUpdate.filledAmt).toFixed(8),
                    "Price"              : +buyOrder.price,
                    "forced_liquidation" : buyforced_liquidation,
                    "pairname"           : curorder.pairName,
                    "order_cost"         : order_cost,
                    "Fees"               : parseFloat(fee_amount).toFixed(8),
                    "status"             : "filled",
                    "Type"               : "buy",
                    "created_at"         : new Date(),
                    "beforeBalance"      : curorder.beforeBalance,
                    "afterBalance"       : curorder.afterBalance,
                    "order_value"        : order_value,
                }
                buytempamount += +buyUpdate.filledAmt

                await buydetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,sellOrder.price,pairData.maker_rebate,io,sellforced_liquidation,sellleverage,sellOrder);
                if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
                {
                    cancel_trade(curorder._id,curorder.userId);
                }
                // positionmatching(data_loop);
                if(forceBreak == true) {
                    // console.log('forceBreak')
                    return true;
                }
            }
        }
    }));

}

async function sellmatchingprocess(curorder,tradedata,pairData,io)
{
  var sellOrder = curorder,
  sellorderid    = sellOrder._id,
  selluserid     = sellOrder.userId,
  sellleverage     = sellOrder.leverage,
  sellAmt        = rounds(Math.abs(sellOrder.quantity)),
  forceBreak     = false,
  selleramount   = rounds(sellOrder.quantity)
  selleramount1  = rounds(sellOrder.quantity)
  sellerforced_liquidation  = (sellOrder.forced_liquidation)
  selltempamount = 0;
  sell_res_len   = tradedata.length;
   console.log(sell_res_len,'sell_res_len')
  // for (var i = 0; i < tradedata.length; i++) {
    await Promise.all(tradedata.map(async (file) => {
    var data_loop = file;
    sellAmt        = rounds(Math.abs(sellOrder.quantity)-selltempamount);
    // console.log('loop starting',i);
    if(sellAmt == 0 || forceBreak == true)
    return

    var ii = i,
    buyOrder     = data_loop,
    buyorderid   = buyOrder._id,
    buyuserid    = buyOrder.userId,
    buyleverage    = buyOrder.leverage,
    buyforced_liquidation    = buyOrder.forced_liquidation,
    buyAmt       = rounds(buyOrder.quantity - buyOrder.filledAmount),
    silentBreak  = false,
    buyUpdate    = {},
    sellUpdate   = {},
    buyerBal     = 0,
    sellerBal    = 0,
    orderSocket  = {}
    selleramount = selleramount-buyAmt;

    console.log(Math.abs(sellAmt),'sellamount');
    console.log(buyAmt,'buyamount');
    if(Math.abs(sellAmt) == Math.abs(buyAmt)) {
      console.log('equal')
        buyUpdate = {
          status    : 1,
          filledAmt : Math.abs(sellAmt)
        }
        sellUpdate = {
          status    : 1,
          filledAmt : buyAmt
        }
        forceBreak = true
    } else if(Math.abs(sellAmt) > Math.abs(buyAmt)) {
      console.log('gr')
        buyUpdate = {
          status    : 1,
          filledAmt : buyAmt
        }
        sellUpdate = {
          status    : 2,
          filledAmt : buyAmt
        }
        sellAmt = rounds(+sellAmt - +buyAmt)
    } else if(Math.abs(sellAmt) < Math.abs(buyAmt)) {
      console.log('less')
        buyUpdate = {
          status    : 2,
          filledAmt : Math.abs(sellAmt)
        }
        sellUpdate = {
          status    : 1,
          filledAmt : Math.abs(sellAmt)
        }
        forceBreak = true
    } else {
      silentBreak = true
    }
    var returnbalance = 0;
    if(+buyOrder.price > +sellOrder.price)
    {
      var return_price = +buyOrder.price - +sellOrder.price;
      returnbalance    = +buyUpdate.filledAmt* +return_price;
      returnbalance    = parseFloat(returnbalance).toFixed(8);
    }

    if(silentBreak == false) {

      var order_value1      = parseFloat(buyUpdate.filledAmt*sellOrder.price).toFixed(8);
      var order_value       = parseFloat(order_value1/sellOrder.btcprice).toFixed(8);
      var required_margin   = parseFloat(order_value1)/buyleverage;
      var fee               = parseFloat(order_value1)*pairData.taker_fees/100;
      var margininbtc       = parseFloat(required_margin)/parseFloat(sellOrder.btcprice);
      var feeinbtc          = parseFloat(fee)/parseFloat(sellOrder.btcprice);
      var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
      order_cost            = parseFloat(order_cost).toFixed(8);

       console.log(curorder.afterBalance,'curorder.afterBalance');
        console.log(curorder.beforeBalance,'curorder.beforeBalance');
      var taker_fee = pairData.taker_fees;
      var fee_amount = feeinbtc;
        var tempdata = {
        "pair"               : ObjectId(pairData._id),
        "firstCurrency"      : pairData.first_currency,
        "secondCurrency"     : pairData.second_currency,
        "forced_liquidation" : buyforced_liquidation,
        "buyuserId"          : ObjectId(buyuserid),
        "user_id"            : ObjectId(buyuserid),
        "selluserId"         : ObjectId(selluserid),
        "sellId"             : ObjectId(sellorderid),
        "buyId"              : ObjectId(buyorderid),
        "filledAmount"       : +(buyUpdate.filledAmt).toFixed(8),
        "Price"              : +sellOrder.price,
        "pairname"           : curorder.pairName,
        "order_cost"         : order_cost,
        "status"             : "filled",
        "Type"               : "buy",
        "Fees"               : parseFloat(fee_amount).toFixed(8),
        "created_at"         : new Date(),
        "beforeBalance"      : buyOrder.beforeBalance,
        "afterBalance"       : buyOrder.afterBalance,
        "order_value"        : order_value,
        }
        selltempamount += +sellUpdate.filledAmt;
        // console.log(tempdata,'before sell update');

        selldetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,sellOrder.price,pairData.maker_rebate,io,sellerforced_liquidation,sellleverage,curorder);
        if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
        {
            cancel_trade(curorder._id,curorder.userId);
        }
        if(forceBreak == true) {
            // console.log("true");
            // getrateandorders(curorder.pair,userid);
            return true
        }
    }
    if(forceBreak == true) {
        // getrateandorders(curorder.pair,userid);
        return true
    }
  }));
}
function tradematching(curorder,io,balance_check=true,profitnloss=0)
{
  //Fill or kill order type
  if(curorder.timeinforcetype=="FillOrKill" || curorder.forced_liquidation==true)
  {
    // console.log('filleorkill');
      var datas = {
        '$or' : [{"status" : '2'},{"status" : '0'},{"bybittype":false}],
        'userId' : { $ne : ObjectId(curorder.userId) },
        'pairName': (curorder.pairName)
      },sort;

      if(curorder.buyorsell == 'buy') {
        datas['buyorsell'] = 'sell'
        datas['price'] = { $lte : curorder.price }
        sort = { "price" : 1 }
      } else {
        datas['buyorsell'] = 'buy'
        datas['price'] = { $gte : curorder.price }
        sort = { "price" : -1 }
      }
        tradeTable.aggregate([
            {$match:datas},
            {
                $group : {
                    "_id"          : null,
                    'quantity'     : { $sum : '$quantity' },
                    'filledAmount' : { $sum : '$filledAmount' }
                }
            },
            {$sort:sort},
            {$limit: 10},
        ]).exec((tradeerr,tradedata) => {
          if(tradedata.length>0)
          {
              var quantity      = tradedata[0].quantity;
              var filledAmount  = tradedata[0].filledAmount;
              var pendingamount = parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
              if(Math.abs(curorder.quantity)>pendingamount)
              {
                var quant = parseFloat(Math.abs(curorder.quantity))-parseFloat(pendingamount);
                if(curorder.forced_liquidation==true)
                {
                  var oppuser_id   = ObjectId("5e567694b912240c7f0e4299");
                  var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
                  var quant        = (curorder.buyorsell=='buy')?quant:(quant*-1);
                  order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(quant),curorder.leverage,curorder.pairName,oppuser_id);
                }
                else
                {
                  cancel_trade(curorder._id,curorder.userId);
                }
              }
          }
          else if(curorder.forced_liquidation==false)
          {
            cancel_trade(curorder._id,curorder.userId);

          }
        });
  }
  var datas = {
      '$or' : [{"status" : '2'},{"status" : '0'}],
      'userId' : { $ne : ObjectId(curorder.userId) },
      'pairName': (curorder.pairName)
    },sort;

    if(curorder.buyorsell == 'buy') {
      datas['buyorsell'] = 'sell'
      datas['price'] = { $lte : curorder.price }
      sort = { "price" : 1 }
    } else {
      datas['buyorsell'] = 'buy'
      datas['price'] = { $gte : curorder.price }
      sort = { "price" : -1 }
    }

    tradeTable.aggregate([
      {$match:datas},
      {$sort:sort},
      {$limit: 50},
    ]).exec((tradeerr,tradedata) => {
    perpetual.findOne({_id:ObjectId(curorder.pair)}).exec(function(pairerr,pairData){
        // console.log('perpetual');
        if(tradeerr)
            console.log({status:false,message:tradeerr});
        else
            if(tradedata.length>0){
                if(curorder.postOnly)
                {
                  cancel_trade(curorder._id,curorder.userId);
                }
                var i=0;
                if (curorder.buyorsell == 'buy') {
                   buyside(curorder,tradedata,pairData,io);
                } else if (curorder.buyorsell == 'sell') {
                    sellside(curorder,tradedata,pairData,io);
                }
            }
            else
            {

              // console.log("inside the else condiiton",curorder);

              // bybit integration to be done
              if(curorder.timeinforcetype=="ImmediateOrCancel")
              {
                  cancel_trade(curorder._id,curorder.userId);
              }
              gettradedata(curorder.firstCurrency,curorder.secondCurrency,socketio);
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              if(curorder.status =='0' && parseFloat(curorder.leverage)<=20 && curorder.userId.toString()!=oppuser_id.toString())
              {
                console.log('inside the first iff');
                bybitorderplacing(curorder)

                  // var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
                  // order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(curorder.quantity),curorder.leverage,curorder.pairName,oppuser_id);
              }
              else if(curorder.status =='0' && curorder.orderType=='Market' && balance_check==false && curorder.userId.toString()!=oppuser_id.toString())
              {
                console.log('here');
                  // var newbuyorsell = (curorder.buyorsell=='buy')?'Sell':'Buy';
                  // order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(curorder.quantity),curorder.leverage,curorder.pairName,oppuser_id);
                  bybitorderplacing(curorder)

                }
            }
    });
  });

}
async function bybitorderplacing(curorder){
  console.log("inside the bybit orderplaicng");
  // GoodTillCancelled ,,,,, ,    ImmediateOrCancel   ,,,,FillOrKill
  var ordertype=curorder.orderType
  var price =parseFloat(curorder.price)
  // var quantity=parseFloat(curorder.quantity)
  var quantity=parseFloat(curorder.quantity)* parseFloat(curorder.price)
  var pairname=curorder.pairName
  var buyorsell=(curorder.buyorsell=='buy')?'Buy':'Sell';
  var apiKey = "ekafOxVaCjgDfYqPDF";
 var secret = "rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D";
 var timestamp = Date.now();
 var timeinforcefromdb=curorder.timeinforcetype
 var bybitinforce= timeinforcefromdb=="GoodTillCancelled"?"GoodTillCancel":timeinforcefromdb=="ImmediateOrCancel"?"ImmediateOrCancel":"FillOrKill"
 var newquantity
 newquantity = Math.abs(quantity);
  if(curorder.orderType=="Limit"){
    console.log("in bybit this is a limit order");
    var params={
      "api_key":apiKey,
      "side":buyorsell,
      "symbol":pairname,
      "order_type":ordertype,
      "price":price,
      "qty":newquantity,
      "time_in_force":bybitinforce,
      "timestamp":timestamp
    }

    var functionsign=await getSignature(params, secret)

    var orderparams={
      "api_key":apiKey,
      "side":buyorsell,
      "symbol":pairname,
      "order_type":ordertype,
      "price":price,
      "qty":newquantity,
    "time_in_force":bybitinforce,
      "timestamp":timestamp,
      "sign":functionsign
    }

      var stringedconcate=JSON.stringify(orderparams)
       var header = {"Content-Type": "application/json"}
          const options = {
            url: "https://api.bybit.com/v2/private/order/create",
            method: 'POST',
            headers: header,
            body: JSON.stringify(orderparams)
          };
          rp(options).then(orderplaced=>{
            // console.log("orderplaced in bybit*/*/*/*/*/*/*",orderplaced);
            // console.log("typeoddd",typeof orderplaced);
            var newcheck=JSON.parse(orderplaced)
            console.log("newcheccsss",newcheck);
            // console.log("typeodddd newcheck  orderid",newcheck.result.order_id);
            if(newcheck.ret_msg=="OK"){
              console.log("inside the ok condiirion");
                updatebaldata = { bybittype: true,bybitorderid:newcheck.result.order_id};
                tradeTable.findOneAndUpdate(
                  { _id:curorder._id },
                  { $set: updatebaldata },
                  { new: true },
                  function (balerr, baldata) {
                    if(baldata){
                      console.log("Bybit id updated in db");
                    }
                  })
            }
          })
  }

  if(curorder.orderType=="Market"){
    console.log("in bybit this is a Market order");
    var params={
      "api_key":apiKey,
      "side":buyorsell,
      "symbol":pairname,
      "order_type":ordertype,
      "qty":newquantity,
      "time_in_force":bybitinforce,
      "timestamp":timestamp
    }
    var functionsign=await getSignature(params, secret)
    var orderparams={
      "api_key":apiKey,
      "side":buyorsell,
      "symbol":pairname,
      "order_type":ordertype,
      "qty":newquantity,
    "time_in_force":bybitinforce,
      "timestamp":timestamp,
      "sign":functionsign
    }

      var stringedconcate=JSON.stringify(orderparams)
       var header = {"Content-Type": "application/json"}
          const options = {
            url: "https://api.bybit.com/v2/private/order/create",
            method: 'POST',
            headers: header,
            body: JSON.stringify(orderparams)
          };
          rp(options).then(orderplaced=>{
            // console.log("orderplaced in bybit*/*/*/*/*/*/*",orderplaced);
            var newcheck=JSON.parse(orderplaced)
            console.log("newcheccsss",newcheck);
            if(newcheck.ret_msg=="OK"){
              updatebaldata = { bybittype: true,bybitorderid:newcheck.result.order_id};
              tradeTable.findOneAndUpdate(
                { _id:curorder._id },
                { $set: updatebaldata },
                { new: true },
                function (balerr, baldata) {
                  if(baldata){
                    console.log("Bybit id updated in db");
                  }
                })
            }
          })
  }
}


cron.schedule('* * * * * *', (req,res) => {
  // console.log("cron workingg for the bybit status");
  tradeTable.find({bybittype:true}).then(bybitorders=>{
    // console.log("bybitorders  length",bybitorders.length);
    if(bybitorders.length){
      var i = 0;
      checkstatus(bybitorders[0], function () {
        // console.log("first");
        if (i === bybitorders.length - 1) {
          callBackResponseImport();
        } else {
          i += 1;
          if (bybitorders[i]) {
            // console.log("next");
            checkstatus(bybitorders[i]);
          } else {
            callBackResponseImport();
          }
        }
      });
    }
  })
});

async function checkstatus(bybitorders, callBackcheckorder) {
  if (callBackcheckorder) {
    userinfo.callBackofchecking = callBackcheckorder;
  }
  var orderid=bybitorders.bybitorderid
  var pair=bybitorders.pairName
  var apiKey = "ekafOxVaCjgDfYqPDF";
 var secret = "rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D";
 var timestamp = Date.now();

  var params={
    "api_key":apiKey,
    "symbol":pair,
    "timestamp":timestamp,
    "order_id":orderid
  }
  var functionsign=await getSignature(params, secret)

           getJSON(
             "https://api.bybit.com/v2/private/order?api_key="+apiKey+"&symbol="+pair+"&timestamp="+ timestamp +"&order_id="+orderid+"&sign="+functionsign,
             function (errorBal, response) {
               // console.log("responsess",response);
               if(response){
               if(response.ret_msg=="OK"){
                 var statusfromresponse=response.result.order_status
                 var leavesqty=response.result.leaves_qty
                 var statusfromdb=bybitorders.status
                 var bybitstatus=statusfromresponse=="New"?0:statusfromresponse=="Filled"?1:statusfromresponse=="PartiallyFilled"?2:statusfromresponse=="Cancelled"?3:0
                 if(bybitstatus==statusfromdb){
                   userinfo.callBackofchecking()
                 }else{
                   updatebaldata = { status:bybitstatus };
                   tradeTable.findOneAndUpdate(
                     { bybitorderid: orderid },
                     { $set: updatebaldata },
                     { new: true },
                     function (balerr, baldata) {
                       if(baldata){
                         console.log("status have been updated from the response");
                         if(baldata.status=="1"){
                           var newupbal = parseFloat(Math.abs(baldata.orderValue))
                           var newquant =parseFloat(Math.abs(baldata.quantity))
                           var updatebaldata = {};

                           var currency =  (baldata.buyorsell=='sell')?baldata.secondCurrency:baldata.firstCurrency
                           var userId= baldata.userId
                           updatebaldata["spotwallet"] = (baldata.buyorsell=='sell')?newupbal:newquant;
                           console.log(updatebaldata,'updatebaldata')
                           console.log(currency,'currency')
                           Assets.findOneAndUpdate({currencySymbol:currency,userId:ObjectId(userId)},{"$inc": updatebaldata } , {new:true } ,function(balerr,assetdata){
                             console.log("status balance updatesdd");
                             var quantity=  parseFloat(Math.abs(baldata.quantity))
                             updatebaldata = { filledAmount:quantity };
                             tradeTable.findOneAndUpdate(
                               { bybitorderid: orderid },
                               { $set: updatebaldata },
                               { new: true },
                               function (balerr, tableupdated) {
                                 console.log("filled updatedd in table");
                                 if(tableupdated){
                                   var tempdata = {
                                   "filledAmount"       : tableupdated.quantity,
                                   "firstCurrency"      : tableupdated.firstCurrency,
                                   "secondCurrency"     :tableupdated.secondCurrency,
                                   "order_value"        :tableupdated.orderCost,
                                   "Price"              : tableupdated.price,
                                   "uniqueid"           : Math.floor(Math.random() * 1000000000),
                                   "pairname"           : tableupdated.pairName,
                                   "status"             : "filled",
                                   "Type"               :tableupdated.buyorsell ,
                                   "created_at"         : new Date()
                                   }
                                   tradeTable.findOneAndUpdate({bybitorderid:tableupdated.bybitorderid},{ "$set": {"filled":tempdata}},{new:true },function(buytemp_err,buytempData){
                                     console.log("innertbalee updated");
                                     positionmatching(buytempData)
                                   })
                                 }
                               })
                           });
                         }
                         if(baldata.status=="2"){
                           var quantity=  parseFloat(Math.abs(baldata.quantity))
                           var filledquantity=parseFloat(quantity)-parseFloat(leavesqty)
                           updatebaldata = { filledAmount:filledquantity };
                           tradeTable.findOneAndUpdate(
                             { bybitorderid: orderid },
                             { $set: updatebaldata },
                             { new: true },
                             function (balerr, tableupdated) {
                               console.log("Partially filled updatedd in table");

                             })

                         }
                         if(baldata.status=="3"){
                           var type               = baldata.buyorsell;
                           var trade_ids          = baldata._id;
                           var userId             = baldata.userId;
                           var filledAmt          = baldata.filledAmount;
                           var status             = baldata.status;
                           var quantity           = baldata.quantity;
                           var price              = baldata.price;
                           var t_firstcurrencyId  = baldata.firstCurrency;
                           var t_secondcurrencyId = baldata.secondCurrency;
                           var beforeBalance      = baldata.beforeBalance;
                           var afterBalance       = baldata.afterBalance;
                           var leverage           = baldata.leverage;
                           var btcprice           = baldata.btcprice;
                           var taker_fees         = baldata.taker_fees;

                           quantity = parseFloat(quantity) - parseFloat(filledAmt);

                           var order_value1      = parseFloat(quantity*price).toFixed(8);
                           var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
                           var required_margin   = parseFloat(order_value1)/leverage;
                           var fee               = parseFloat(order_value1)*taker_fees/100;
                           var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
                           var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
                           var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
                           // order_cost            = parseFloat(order_cost).toFixed(8);
                           order_cost = parseFloat( Math.abs(order_cost)).toFixed(8);


                           async.parallel({
                           // update balance
                           data1: function(cb){
                               var updatebaldata = {};
                               updatebaldata["balance"] = order_cost;
                               Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(userId)},{"$inc": updatebaldata } , {new:true} ,function(balerr,baldata){
                                 // console.log("balance after canecl status updatedd",baldata);
                               });
                           }
                           },function(err, results){

                           });
                         }
                       }
                     })
                 }
               }
             }
             })
}



//
//  cron.schedule('* * * * * *', (req,res) => {
//    console.log("bybit tradessss");
//
//  var apiKey = "ekafOxVaCjgDfYqPDF";
// var secret = "rO1DvrseWgjqv1T0fGSVmACGaE8UbSvIt31D";
// var timestamp = Date.now();
// var pair="XRP"
// var params = {
// 	"api_key" : apiKey,
//   "coin":pair,
//   "timestamp":timestamp,
// };
//
// var functionsign= getSignature(params, secret)
//    getJSON(
//      "https://api.bybit.com/v2/private/wallet/balance?api_key="+apiKey+"&coin="+pair+"&timestamp="+ timestamp+"&sign="+functionsign,
//
//      function (errorBal, response) {
//        console.log("responsess",response);
//        // console.log("errerer",errorBal);
//      })
//  })


 async function getSignature(params, secret) {
 	var orderedParams = "";
 	Object.keys(params).sort().forEach(function(key) {
 	  orderedParams += key + "=" + params[key] + "&";
 	});
 	orderedParams = orderedParams.substring(0, orderedParams.length - 1);

 	return bybitcrypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
 }





function buyside(curorder,tradedata,pairData,io) {

  var tradePos          = 0;
  var curtradequan      = parseFloat(Math.abs(curorder.quantity)) - parseFloat(Math.abs(curorder.filledAmount));
  var tradequan         = parseFloat(Math.abs(tradedata[0].quantity))-parseFloat(Math.abs(tradedata[0].filledAmount));
  var tradequan1         = parseFloat(Math.abs(tradedata[0].quantity))-parseFloat(Math.abs(tradedata[0].filledAmount));

  tradeinfo.filledamount      = (Math.abs(curtradequan) == Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) > Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) < Math.abs(tradequan))?Math.abs(tradequan):0;

  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity     = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails        = tradedata[0];

  buymatchingtrade(tradetails, function() {
    if (tradePos === tradedata.length-1 || parseFloat(tradequan1)==parseFloat(curtradequan)) {
      callBackResponseImport();
    } else {
      tradePos               += 1;
      var tradequan1         = parseFloat(tradedata[tradePos].quantity)-parseFloat(tradedata[tradePos].filledAmount);
      curtradequan          -= parseFloat(Math.abs(tradeinfo.filledamount));
      tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) > Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) < Math.abs(tradequan1))?Math.abs(tradequan1):0;

      tradedata[tradePos].pairData = pairData;
      curorder.quantity            = curtradequan
      tradedata[tradePos].curorder = curorder;
      tradedata[tradePos].quantity = tradequan1;
      var tradetails               = tradedata[tradePos];

      if (tradedata[tradePos]) {
        buymatchingtrade(tradetails);
      } else {
        callBackResponseImport();
      }
    }

  });
}

function sellside(curorder,tradedata,pairData,io) {
  var tradePos          = 0;
  var curtradequan      = parseFloat(Math.abs(curorder.quantity)) - parseFloat(Math.abs(curorder.filledAmount));
  var tradequan         = parseFloat(tradedata[0].quantity)-parseFloat(tradedata[0].filledAmount);
  tradeinfo.tradequan1         = tradequan;

  tradeinfo.filledamount= (Math.abs(curtradequan) == Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) > Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) < Math.abs(tradequan))?Math.abs(tradequan):0;

   console.log(tradequan,'tradequan')
   console.log(curtradequan,'curtradequan')
  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity     = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails        = tradedata[0];

  sellmatchingtrade(tradetails, function() {
    if (tradePos === tradedata.length-1 || parseFloat(tradeinfo.tradequan1)==parseFloat(curtradequan)) {
      console.log('in');
      callBackResponseImport();
    } else {
      tradePos                    += 1;

      var tradequan1          = parseFloat(tradedata[tradePos].quantity)-parseFloat(tradedata[tradePos].filledAmount);
      tradeinfo.tradequan1          = tradequan1;
      curtradequan           -= parseFloat(Math.abs(tradeinfo.filledamount));

      tradeinfo.filledamount  = (Math.abs(curtradequan) == Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) > Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) < Math.abs(tradequan1))?Math.abs(tradequan1):0;
      console.log(tradequan1,'tradequan1')
   console.log(curtradequan,'curtradequan11')
      tradedata[tradePos].pairData = pairData;
      curorder.quantity            = curtradequan
      tradedata[tradePos].curorder = curorder;
      tradedata[tradePos].quantity = tradequan1;
      var tradetails               = tradedata[tradePos];

      if (tradedata[tradePos]) {
        sellmatchingtrade(tradetails);
      } else {
        callBackResponseImport();
      }
    }

  });
}
function callBackResponseImport() {
  tradeinfo.filledamount = 0;
  // console.log('fskdmflskmdflskdmflksmdf');
}
function buymatchingtrade(tradedata,callBackOne)
{
    var curorder          = tradedata.curorder;
    var buyOrder          = curorder,
    buyAmt                = rounds(buyOrder.quantity),
    buyorderid            = buyOrder._id,
    buyuserid             = buyOrder.userId,
    buyleverage           = buyOrder.leverage,
    buyforced_liquidation = buyOrder.forced_liquidation,
    buyeramount           = rounds(buyOrder.quantity),
    buyeramount1          = rounds(buyOrder.quantity),
    buytempamount         = 0;

    var data_loop = tradedata;
    buyAmt = rounds(buyOrder.quantity);
    var ii = i,
    sellOrder              = data_loop,
    sellorderid            = sellOrder._id,
    selluserid             = sellOrder.userId,
    sellleverage           = sellOrder.leverage,
    sellforced_liquidation = sellOrder.forced_liquidation,
    sellAmt                = rounds(+sellOrder.quantity),
    buyUpdate              = {},
    sellUpdate             = {};
    if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
        // console.log("amount eq");
        buyUpdate = {
          status: '1',
          filledAmt: Math.abs(sellAmt)
        }
        sellUpdate =  {
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
      var order_value1      = parseFloat(buyUpdate.filledAmt*buyOrder.price).toFixed(8);
      var order_value       = parseFloat(order_value1/buyOrder.btcprice).toFixed(8);
      var required_margin   = parseFloat(order_value1)/buyleverage;
      var fee               = parseFloat(order_value1)*sellOrder.pairData.taker_fees/100;
      var margininbtc       = parseFloat(required_margin)/parseFloat(buyOrder.btcprice);
      var feeinbtc          = parseFloat(fee)/parseFloat(buyOrder.btcprice);
      var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
      order_cost            = parseFloat(order_cost).toFixed(8);

        // console.log("si brk");
        var taker_fee = sellOrder.pairData.taker_fees;
        var fee_amount = feeinbtc;
        var tempdata = {
            "pair"               : ObjectId(sellOrder.pairData._id),
            "firstCurrency"      : sellOrder.pairData.first_currency,
            "secondCurrency"     : sellOrder.pairData.second_currency,
            "buyuserId"          : ObjectId(buyuserid),
            "user_id"            : ObjectId(buyuserid),
            "selluserId"         : ObjectId(selluserid),
            "sellId"             : ObjectId(sellorderid),
            "buyId"              : ObjectId(buyorderid),
            "uniqueid"           : Math.floor(Math.random() * 1000000000),
            "filledAmount"       : +(buyUpdate.filledAmt).toFixed(8),
            "Price"              : +buyOrder.price,
            "forced_liquidation" : buyforced_liquidation,
            "pairname"           : curorder.pairName,
            "order_cost"         : order_cost,
            "Fees"               : parseFloat(fee_amount).toFixed(8),
            "status"             : "filled",
            "Type"               : "buy",
            "created_at"         : new Date(),
            "beforeBalance"      : curorder.beforeBalance,
            "afterBalance"       : curorder.afterBalance,
            "order_value"        : order_value,
        }
        buytempamount += +buyUpdate.filledAmt

         buydetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,sellOrder.price,sellOrder.pairData.maker_rebate,socketio,sellforced_liquidation,sellleverage,sellOrder,callBackOne);
        if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
        {
            cancel_trade(curorder._id,curorder.userId);
        }
}

function sellmatchingtrade(tradedata,callBackOne)
{
  var curorder             = tradedata.curorder;
  var sellOrder            = curorder,
  sellorderid              = sellOrder._id,
  selluserid               = sellOrder.userId,
  sellleverage             = sellOrder.leverage,
  sellAmt                  = rounds(Math.abs(sellOrder.quantity)),
  selleramount             = rounds(sellOrder.quantity)
  selleramount1            = rounds(sellOrder.quantity)
  sellerforced_liquidation = (sellOrder.forced_liquidation)
  selltempamount           = 0;
  sell_res_len             = tradedata.length;
  var data_loop            = tradedata;
  sellAmt                  = rounds(Math.abs(sellOrder.quantity)-selltempamount);

  var ii                   = i,
  buyOrder                 = data_loop,
  buyorderid               = buyOrder._id,
  buyuserid                = buyOrder.userId,
  buyleverage              = buyOrder.leverage,
  buyforced_liquidation    = buyOrder.forced_liquidation,
  buyAmt                   = rounds(buyOrder.quantity),
  buyUpdate                = {},
  sellUpdate               = {},

  selleramount             = selleramount-buyAmt;
  console.log(sellAmt,'sellAmt')
  console.log(buyAmt,'buyAmt')
    if(Math.abs(sellAmt) == Math.abs(buyAmt)) {
        buyUpdate = {
          status    : 1,
          filledAmt : Math.abs(sellAmt)
        }
        sellUpdate = {
          status    : 1,
          filledAmt : buyAmt
        }
        forceBreak = true
    } else if(Math.abs(sellAmt) > Math.abs(buyAmt)) {
        buyUpdate = {
          status    : 1,
          filledAmt : buyAmt
        }
        sellUpdate = {
          status    : 2,
          filledAmt : buyAmt
        }
        sellAmt = rounds(+sellAmt - +buyAmt)
    } else if(Math.abs(sellAmt) < Math.abs(buyAmt)) {
        buyUpdate = {
          status    : 2,
          filledAmt : Math.abs(sellAmt)
        }
        sellUpdate = {
          status    : 1,
          filledAmt : Math.abs(sellAmt)
        }
    }

      var order_value1      = parseFloat(buyUpdate.filledAmt*sellOrder.price).toFixed(8);
      var order_value       = parseFloat(order_value1/sellOrder.btcprice).toFixed(8);
      var required_margin   = parseFloat(order_value1)/buyleverage;
      var fee               = parseFloat(order_value1)*buyOrder.pairData.taker_fees/100;
      var margininbtc       = parseFloat(required_margin)/parseFloat(sellOrder.btcprice);
      var feeinbtc          = parseFloat(fee)/parseFloat(sellOrder.btcprice);
      var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
      order_cost            = parseFloat(order_cost).toFixed(8);

       // console.log(curorder.afterBalance,'curorder.afterBalance');
       //  console.log(curorder.beforeBalance,'curorder.beforeBalance');
      var taker_fee = buyOrder.pairData.taker_fees;
      var fee_amount = feeinbtc;
        var tempdata = {
        "pair"               : ObjectId(buyOrder.pairData._id),
        "firstCurrency"      : buyOrder.pairData.first_currency,
        "secondCurrency"     : buyOrder.pairData.second_currency,
        "forced_liquidation" : buyforced_liquidation,
        "buyuserId"          : ObjectId(buyuserid),
        "user_id"            : ObjectId(buyuserid),
        "selluserId"         : ObjectId(selluserid),
        "sellId"             : ObjectId(sellorderid),
        "buyId"              : ObjectId(buyorderid),
        "filledAmount"       : +(buyUpdate.filledAmt).toFixed(8),
        "Price"              : +sellOrder.price,
        "uniqueid"           : Math.floor(Math.random() * 1000000000),
        "pairname"           : curorder.pairName,
        "order_cost"         : order_cost,
        "status"             : "filled",
        "Type"               : "buy",
        "Fees"               : parseFloat(fee_amount).toFixed(8),
        "created_at"         : new Date(),
        "beforeBalance"      : buyOrder.beforeBalance,
        "afterBalance"       : buyOrder.afterBalance,
        "order_value"        : order_value,
        }
        selltempamount += +sellUpdate.filledAmt;

        selldetailsupdate(tempdata,buyorderid,buyUpdate,sellorderid,sellUpdate,selluserid,sellOrder.price,buyOrder.pairData.maker_rebate,socketio,sellerforced_liquidation,sellleverage,curorder,callBackOne);
        if(tradedata.length==i && forceBreak!=true && curorder.timeinforcetype=='ImmediateOrCancel')
        {
            cancel_trade(curorder._id,curorder.userId);
        }
}

function tradematching111(curorder,io,balance_check=true,profitnloss=0)
{
  //Fill or kill order type
  if(curorder.timeinforcetype=="FillOrKill" || curorder.forced_liquidation==true)
  {
    // console.log('filleorkill');
      var datas = {
        '$or' : [{"status" : '2'},{"status" : '0'}],
        'userId' : { $ne : ObjectId(curorder.userId) },
        'pairName': (curorder.pairName)
      },sort;

      if(curorder.buyorsell == 'buy') {
        datas['buyorsell'] = 'sell'
        datas['price'] = { $lte : curorder.price }
        sort = { "price" : 1 }
      } else {
        datas['buyorsell'] = 'buy'
        datas['price'] = { $gte : curorder.price }
        sort = { "price" : -1 }
      }
        tradeTable.aggregate([
            {$match:datas},
            {
                $group : {
                    "_id"          : null,
                    'quantity'     : { $sum : '$quantity' },
                    'filledAmount' : { $sum : '$filledAmount' }
                }
            },
            {$sort:sort},
            {$limit: 10},
        ]).exec((tradeerr,tradedata) => {
          if(tradedata.length>0)
          {
              var quantity      = tradedata[0].quantity;
              var filledAmount  = tradedata[0].filledAmount;
              var pendingamount = parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
              if(Math.abs(curorder.quantity)>pendingamount)
              {
                var quant = parseFloat(Math.abs(curorder.quantity))-parseFloat(pendingamount);
                if(curorder.forced_liquidation==true)
                {
                  var oppuser_id   = ObjectId("5e567694b912240c7f0e4299");
                  var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
                  var quant        = (curorder.buyorsell=='buy')?quant:(quant*-1);
                  order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(quant),curorder.leverage,curorder.pairName,oppuser_id);
                }
                else
                {
                  cancel_trade(curorder._id,curorder.userId);
                }
              }
          }
          else if(curorder.forced_liquidation==false)
          {
            cancel_trade(curorder._id,curorder.userId);

          }
        });
  }
  var datas = {
      '$or' : [{"status" : '2'},{"status" : '0'}],
      'userId' : { $ne : ObjectId(curorder.userId) },
      'pairName': (curorder.pairName)
    },sort;

    if(curorder.buyorsell == 'buy') {
      datas['buyorsell'] = 'sell'
      datas['price'] = { $lte : curorder.price }
      sort = { "price" : 1 }
    } else {
      datas['buyorsell'] = 'buy'
      datas['price'] = { $gte : curorder.price }
      sort = { "price" : -1 }
    }
      // console.log(datas,'datas');
    tradeTable.aggregate([
      {$match:datas},
      {$sort:sort},
    ]).exec((tradeerr,tradedata) => {
    perpetual.findOne({_id:ObjectId(curorder.pair)}).exec(function(pairerr,pairData){
        // console.log('perpetual');
        if(tradeerr)
            console.log({status:false,message:tradeerr});
        else
          console.log(tradedata,'tradedata')
            if(tradedata.length>0){
                if(curorder.postOnly)
                {
                  cancel_trade(curorder._id,curorder.userId);
                }
                var i=0;
                if (curorder.buyorsell == 'buy') {
                   buymatchingprocess(curorder,tradedata,pairData,io);
                } else if (curorder.buyorsell == 'sell') {
                    sellmatchingprocess(curorder,tradedata,pairData,io);
                }
            }
            else
            {
              if(curorder.timeinforcetype=="ImmediateOrCancel")
              {
                  cancel_trade(curorder._id,curorder.userId);
              }
              gettradedata(curorder.firstCurrency,curorder.secondCurrency,socketio);
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              // if(curorder.status =='0' && curorder.orderType=='Market' && balance_check==true && curorder.userId.toString()!=oppuser_id.toString())
              // {
              //     var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
              //     order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(curorder.quantity),curorder.leverage,curorder.pairName,oppuser_id);
              // }
              // else if(curorder.status =='0' && curorder.orderType=='Market' && balance_check==false  && curorder.userId.toString()!=oppuser_id.toString())
              // {
              //     var newbuyorsell = (curorder.buyorsell=='buy')?'sell':'buy';
              //     order_placing(curorder.orderType,newbuyorsell,curorder.price,Math.abs(curorder.quantity),curorder.leverage,curorder.pairName,oppuser_id);
              // }
            }
    });
  });
}
async function buypositionupdate(tradedata,callBackOne)
{
  console.log(tradedata.filled,'buypostradedata166');
      if (callBackOne) {
        tradeinfo.callBackbuyposTrade = callBackOne;
      }
      var curorder           = tradedata.curorder;
      var perdata            = tradedata.perdata;
      var sellupdate         = tradedata.sellupdate;
      var buyupdate          = tradedata.buyupdate;
      var index              = perdata.findIndex(x => (x.tiker_root) === curorder.pairname);
      var btcindex           = perdata.findIndex(x => (x.tiker_root) === 'BTCUSD');
      var btcprice           = perdata[btcindex].markprice;
      var markprice          = perdata[index].markprice;

      var sellorderid        = tradedata.filled.sellId;
      var firstCurrency      = curorder.firstCurrency;
      var secondCurrency     = curorder.secondCurrency;
      var forced_liquidation = curorder.forced_liquidation;
      var buyorder_value     = curorder.order_value;
      var buyorderid         = curorder.buyId;
      var user_id            = curorder.user_id;
      var buyFees            = curorder.Fees;
      var sellFees           = tradedata.filled.Fees;
      var beforeBalance      = tradedata.filled.beforeBalance;
      var afterBalance       = tradedata.filled.afterBalance;
      var sellorder_value    = tradedata.filled.order_value;
      var buypairName        = curorder.pairname;
      var buyuserId          = curorder.buyuserId;
      var buypair            = curorder.pair;
      var sellquantity       = Math.abs(tradedata.filled.filledAmount);
      var buyprice           = curorder.Price;
      var sellprice          = tradedata.filled.Price;
      var orderCost          = tradedata.filled.order_cost;

      console.log(curorder.uniqueid,'buycurorder.uniqueid');
                  console.log(buyupdate.position_status,'buyupdate.position_status');
      tradeTable.findOneAndUpdate({'filled.uniqueid':(curorder.uniqueid)},{ "$set": {'filled.$.position_status':buyupdate.position_status}},{multi:true,"fields": {filled:1} },function(selltemp_err,selltempData){
                   // console.log(selltempData,'selltempData')
                   // console.log(selltemp_err,'selltemp_err')
                        if(selltempData)
                        {
                        Assets.findOne({currencySymbol:'BTC',userId:ObjectId(user_id)},function(balanceerr,balancedata){
                            var totalfees      = parseFloat(buyFees);

                            var profitnlossusd = (parseFloat(sellprice)) - (parseFloat(buyprice));
                            var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(sellupdate.positionFilled);

                            var profitnloss    = parseFloat(profitnlossusd)/parseFloat(btcprice);
                            // var profitnloss    = parseFloat(sellorder_value)-parseFloat(buyorder_value);

                            var fprofitnloss   = parseFloat(profitnloss)-parseFloat(totalfees);
                            var updatebal      = parseFloat(orderCost)+parseFloat(fprofitnloss);
                            if(forced_liquidation)
                              {
                                updatebal  = orderCost*-1;
                              }

                          var reducebalance = parseFloat(beforeBalance) - parseFloat(afterBalance);

                            var updatebaldata = {};
                            updatebaldata["balance"] = updatebal;
                            var afterBalance1 = parseFloat(balancedata.balance)+parseFloat(updatebal);

                               const newposition = new position_table({
                              "pairname"           : buypairName,
                              "pair"               : buypair,
                              "userId"             : user_id,
                              "closing_direction"  : "Closed short",
                              "quantity"           : sellupdate.positionFilled,
                              "exit_price"         : buyprice,
                              "entry_price"        : sellprice,
                              "profitnloss"        : (forced_liquidation)?updatebal:profitnloss,
                              "exit_type"          : (forced_liquidation)?'Liquidated':'Trade',
                              "beforeBalance"      : balancedata.balance,
                              "afterBalance"       : afterBalance1,
                              "orderCost"          : orderCost,
                            });


                                newposition.save(function(err,data) {
                                // var updatebaldata = {};
                                if(forced_liquidation==false)
                                {
                                  // console.log(updatebaldata,'updatebaldata')
                                    Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(user_id)},{"$inc": updatebaldata} , {new:true,"fields": {balance:1} } ,function(balerr,baldata){

                                    });
                                }

                                });

                          });
                        }
                  });
      // console.log('buyside')
                  tradedata.filled.position_status = sellupdate.position_status;
                  console.log(tradedata.filled.uniqueid,'tradedata.filled.uniqueid');
                  console.log(sellupdate.position_status,'sellupdate.position_status');
                  tradeTable.findOneAndUpdate({'filled.uniqueid':(tradedata.filled.uniqueid)},{ "$set": {'filled.$.position_status':sellupdate.position_status}},{multi:true,"fields": {filled:1} },function(selltemp_err,selltempData){
                    // console.log(selltemp_err,'selltemp_erruuuuu')
                    // console.log(selltempData,'selltempDataiiiii')
                        if(selltempData)
                        {
                          tradeinfo.callBackbuyposTrade();
                           User.findOneAndUpdate({_id:ObjectId(buyuserId),moderator:{$ne:'2'}},{"$set": {"liq_lock":false} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){

                              });

                            setTimeout(function () {
                                getusertradedata(buyuserId,firstCurrency,secondCurrency)
                                getusertradedata(user_id,firstCurrency,secondCurrency)
                                gettradedata(firstCurrency,secondCurrency,socketio);
                            }, 5000);



                        }
                  });
}
async function sellpositionupdate(tradedata,callBackOne)
{
  console.log(tradedata,'sellpostradedata166');
      if (callBackOne) {
        tradeinfo.callBacksellposTrade = callBackOne;
      }
      var curorder           = tradedata.curorder;
      var perdata            = tradedata.perdata;
      var buyupdate          = tradedata.buyupdate;
      var sellupdate         = tradedata.sellupdate;
      var index              = perdata.findIndex(x => (x.tiker_root) === curorder.pairname);
      var btcindex           = perdata.findIndex(x => (x.tiker_root) === 'BTCUSD');
      var btcprice           = perdata[btcindex].markprice;
      var markprice          = perdata[index].markprice;
      var buyorderid         = tradedata.filled.buyId;
      var buyprice           = tradedata.filled.Price;
      var sellorderid        = curorder.sellId;
      var forced_liquidation = curorder.forced_liquidation;
      var sellorder_value    = curorder.order_value;
      var firstCurrency      = curorder.firstCurrency;
      var secondCurrency     = curorder.secondCurrency;
      var selluserId         = curorder.buyuserId;
      var user_id            = curorder.user_id;
      var sellpair           = curorder.pair;
      var sellprice          = curorder.Price;
      var buyFees            = curorder.Fees;
      var sellFees           = tradedata.filled.Fees;
      var buyorder_value     = tradedata.filled.order_value;
      var orderCost          = tradedata.filled.order_cost;
      var beforeBalance      = tradedata.filled.beforeBalance;
      var afterBalance       = tradedata.filled.afterBalance;
      var sellpairName       = curorder.pairname;
      var buyqauntity        = Math.abs(tradedata.filled.filledAmount);

    console.log(tradedata.filled.uniqueid,'tradedata.filled.uniqueid');
    console.log(buyupdate.position_status,'buyupdate.position_status');
    tradeTable.findOneAndUpdate({'filled.uniqueid':(tradedata.filled.uniqueid)},{ "$set": {'filled.$.position_status':buyupdate.position_status}},{multi:true,"fields": {filled:1} },function(buytemp_err,buytempData){
      if(buytempData)
      {
         Assets.findOne({currencySymbol:'BTC',userId:ObjectId(user_id)},function(balanceerr,balancedata){
          var totalfees      = parseFloat(buyFees)+parseFloat(sellFees);
          var profitnloss    = [ (1/parseFloat(buyprice))  - (1/parseFloat(sellprice)) ] * parseFloat(buyupdate.positionFilled);
          var profitnlossusd = (parseFloat(sellprice)) - (parseFloat(buyprice));
          var profitnlossusd = parseFloat(profitnlossusd)*parseFloat(buyupdate.positionFilled);

          var profitnloss    = parseFloat(profitnlossusd)/parseFloat(btcprice);

          var fprofitnloss   = parseFloat(profitnloss)-parseFloat(totalfees);
          var updatebal      = parseFloat(orderCost)+parseFloat(fprofitnloss);
          if(forced_liquidation)
          {
              updatebal  = orderCost*-1;
          }


          var updatebaldata = {};
          var reducebalance = parseFloat(beforeBalance) - parseFloat(afterBalance);

          updatebaldata["balance"] = updatebal;
          var afterBalance1 = parseFloat(balancedata.balance)+parseFloat(updatebal);

           const newposition = new position_table({
          "pairname"           : sellpairName,
          "pair"               : sellpair,
          "userId"             : user_id,
          "closing_direction"  : "Closed long",
          "quantity"           : buyupdate.positionFilled,
          "exit_price"         : sellprice,
          "entry_price"        : buyprice,
          "profitnloss"        : (forced_liquidation)?updatebal:profitnloss,
          "exit_type"          : (forced_liquidation)?'Liquidated':'Trade',
          "beforeBalance"      : balancedata.balance,
          "afterBalance"       : afterBalance1,
          "orderCost"          : orderCost,
          });


          newposition.save(function(err,data) {
            // console.log(err,'err')
            // console.log(data,'edatarr')
          if(forced_liquidation==false)
          {
              Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(user_id)},{"$inc": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){

              });
          }
          });

      });
      }

});
 console.log(curorder.uniqueid,'sellcurorder.uniqueid');
    console.log(sellupdate.position_status,'sellupdate.position_status');
tradeTable.findOneAndUpdate({'filled.uniqueid':(curorder.uniqueid)},{ "$set": {'filled.$.position_status':sellupdate.position_status}},{multi:true,"fields": {filled:1} },function(selltemp_err,selltempData){
          // console.log(selltemp_err,'possell');
          // console.log(selltempData,'possell');
      if(selltempData)
      {
         User.findOneAndUpdate({_id:ObjectId(user_id),moderator:{$ne:'2'}},{"$set": {"liq_lock":false} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){
           tradeinfo.callBacksellposTrade();
          });
         setTimeout(function () {

              getusertradedata(selluserId,firstCurrency,secondCurrency)
              getusertradedata(user_id,firstCurrency,secondCurrency)
              gettradedata(firstCurrency,secondCurrency,socketio);
          }, 5000);
      }
});


}


function buysideposition(curorder,tradedata,pairData) {
  tradeinfo.filledamount = 0
 // console.log(curorder,'curorder')
  var buytradePos          = 0;
  var curtradequan      = parseFloat(Math.abs(curorder.filledAmount)).toFixed(8);
  var tradequan         = parseFloat(Math.abs(tradedata[0].filled.filledAmount)).toFixed(8);

  tradeinfo.filledamount      = (Math.abs(curtradequan) == Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) > Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) < Math.abs(tradequan))?Math.abs(tradequan):0;

  var buyupdate = {};
  var sellupdate = {};

  if(curtradequan==tradequan)
  {
    buyupdate['position_status']  = 0;
    buyupdate['positionFilled']   = tradequan;

    sellupdate['position_status'] = 0;
    sellupdate['positionFilled']  = tradequan;
  }
  else if(curtradequan<tradequan)
  {
    buyupdate['position_status']  = 0;
    buyupdate['positionFilled']   = curtradequan;

    sellupdate['position_status'] = 2;
    sellupdate['positionFilled']  = curtradequan;
  }
  else{
    buyupdate['position_status']  = 2;
    buyupdate['positionFilled']   = tradequan;

    sellupdate['position_status'] = 0;
    sellupdate['positionFilled']  = tradequan;
  }

  tradedata[0].perdata    = pairData;
  tradedata[0].filled.filledAmount   = tradequan;
  curorder.filledAmount   = curtradequan;
  tradedata[0].curorder   = curorder;
  tradedata[0].sellupdate = sellupdate;
  tradedata[0].buyupdate  = buyupdate;
  var tradetails          = tradedata[0];


  buypositionupdate(tradetails, function() {
    if (buytradePos === tradedata.length-1  || parseFloat(curtradequan)==parseFloat(tradeinfo.filledamount)) {
      callBackResponseImport();
    } else {
      buytradePos                    += 1;
      var tradequan1         = parseFloat(tradedata[buytradePos].filled.filledAmount).toFixed(8);
      curtradequan          -= parseFloat(Math.abs(tradeinfo.filledamount)).toFixed(8);
      tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) > Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) < Math.abs(tradequan1))?Math.abs(tradequan1):0;

          var buyupdate = {};
          var sellupdate = {};

          if(curtradequan==tradequan1)
          {
            buyupdate['position_status']  = 0;
            buyupdate['positionFilled']   = tradequan1;

            sellupdate['position_status'] = 0;
            sellupdate['positionFilled']  = tradequan1;
          }
          else if(curtradequan<tradequan1)
          {
            buyupdate['position_status']  = 0;
            buyupdate['positionFilled']   = curtradequan;

            sellupdate['position_status'] = 2;
            sellupdate['positionFilled']  = curtradequan;
          }
          else{
            buyupdate['position_status']  = 2;
            buyupdate['positionFilled']   = tradequan1;

            sellupdate['position_status'] = 0;
            sellupdate['positionFilled']  = tradequan1;
          }

      // console.log(buytradePos,'buytradePos')
          tradedata[buytradePos].perdata    = pairData;
          tradedata[buytradePos].filled.filledAmount   = tradequan1;
          curorder.filledAmount          = curtradequan;
          tradedata[buytradePos].curorder   = curorder;
          tradedata[buytradePos].sellupdate = sellupdate;
          tradedata[buytradePos].buyupdate  = buyupdate;
          var tradetails                 = tradedata[buytradePos];

          if (tradedata[buytradePos]) {
            buypositionupdate(tradetails);
          } else {
            callBackResponseImport();
          }
    }

  });
}

function sellsideposition(curorder,tradedata,pairData) {
  // console.log(curorder,'curorder')
  tradeinfo.filledamount = 0;
  var tradePos          = 0;
  var curtradequan      = parseFloat(Math.abs(curorder.filledAmount)).toFixed(8);
  var tradequan         = parseFloat(Math.abs(tradedata[0].filled.filledAmount)).toFixed(8);

  tradeinfo.filledamount      = (Math.abs(curtradequan) == Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) > Math.abs(tradequan))?Math.abs(tradequan):(Math.abs(curtradequan) < Math.abs(tradequan))?Math.abs(tradequan):0;

  var buyupdate = {};
  var sellupdate = {};

  if(curtradequan==tradequan)
  {
    buyupdate['position_status']  = 0;
    buyupdate['positionFilled']   = tradequan;

    sellupdate['position_status'] = 0;
    sellupdate['positionFilled']  = tradequan;
  }
  else if(curtradequan<tradequan)
  {
    buyupdate['position_status']  = 2;
    buyupdate['positionFilled']   = curtradequan;

    sellupdate['position_status'] = 0;
    sellupdate['positionFilled']  = curtradequan;
  }
  else{
    buyupdate['position_status']  = 0;
    buyupdate['positionFilled']   = tradequan;

    sellupdate['position_status'] = 2;
    sellupdate['positionFilled']  = tradequan;
  }

  tradedata[0].perdata    = pairData;
  tradedata[0].filled.filledAmount   = tradequan;
  curorder.filledAmount   = curtradequan;
  tradedata[0].curorder   = curorder;
  tradedata[0].sellupdate = sellupdate;
  tradedata[0].buyupdate  = buyupdate;
  var tradetails          = tradedata[0];


  sellpositionupdate(tradetails, function() {
    // console.log(tradePos,'tradePos')
    if (tradePos === tradedata.length-1 || parseFloat(curtradequan)==parseFloat(tradeinfo.filledamount)) {
      callBackResponseImport();
    } else {
      tradePos                    += 1;
      var tradequan1         = parseFloat(tradedata[tradePos].filled.filledAmount).toFixed(8);
      curtradequan          -= parseFloat(Math.abs(tradeinfo.filledamount)).toFixed(8);
      tradeinfo.filledamount = (Math.abs(curtradequan) == Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) > Math.abs(tradequan1))?Math.abs(tradequan1):(Math.abs(curtradequan) < Math.abs(tradequan1))?Math.abs(tradequan1):0;

          var buyupdate = {};
          var sellupdate = {};

          if(curtradequan==tradequan1)
          {
            buyupdate['position_status']  = 0;
            buyupdate['positionFilled']   = tradequan1;

            sellupdate['position_status'] = 0;
            sellupdate['positionFilled']  = tradequan1;
          }
          else if(curtradequan<tradequan1)
          {
            buyupdate['position_status']  = 2;
            buyupdate['positionFilled']   = curtradequan;

            sellupdate['position_status'] = 0;
            sellupdate['positionFilled']  = curtradequan;
          }
          else{
            buyupdate['position_status']  = 0;
            buyupdate['positionFilled']   = tradequan1;

            sellupdate['position_status'] = 2;
            sellupdate['positionFilled']  = tradequan1;
          }

          tradedata[tradePos].perdata         = pairData;
          tradedata[tradePos].filled.filledAmount = tradequan1;
          curorder.filledAmount               = curtradequan;
          tradedata[tradePos].curorder        = curorder;
          tradedata[tradePos].sellupdate      = sellupdate;
          tradedata[tradePos].buyupdate       = buyupdate;
          var tradetails                      = tradedata[tradePos];

          if (tradedata[tradePos]) {
            sellpositionupdate(tradetails);
          } else {
            callBackResponseImport();
          }
    }

  });
}



function positionmatching(curorder)
{
  // console.log('positionmatching',curorder);
    var datas = {
        'filled.user_id'         : ObjectId(curorder.user_id) ,
        'filled.pairname'        : (curorder.pairname),
        "filled.position_status" : '1',
        "filled.status"          : 'filled'
    },sort;
    if(curorder.Type=='buy')
    {
      datas['filled.Type'] = 'sell';
    }
    else
    {
      datas['filled.Type'] = 'buy';
    }
    tradeTable.aggregate([
        {$unwind:"$filled"},
        {$project:{"filled":1,forced_liquidation:1}},
        {$match:datas},
    ]).exec((tradeerr,tradedata) => {
      // console.log(tradedata,'positiontradedata')
       perpetual.find({$or: [{tiker_root:curorder.pairname },{tiker_root:'BTCUSD'}]},function(pererr,perdata){
        if(tradedata.length>0)
        {
              if(curorder.Type=='buy')
              {
                buysideposition(curorder,tradedata,perdata);
              }
              else
              {
                sellsideposition(curorder,tradedata,perdata);
              }
        }
    });
    });
}

function rounds(n) {
  var roundValue = (+n).toFixed(8)
  return parseFloat(roundValue)
}

router.post('/user-activate', (req, res) => {
    var userid = req.body.userid;
    var updateObj = {active:"Activated"}
    User.findByIdAndUpdate(userid, updateObj, {new: true}, function(err, user) {
      if (user) {
          return res.status(200).json({ message: 'Your Account activated successfully' });
      }
    })
});

router.post('/perpetual-data/', (req, res) => {
  console.log('perpetual-data')
    perpetual.find({}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:'perpetual'});
        }
    });
});

router.post('/pair-data/', (req, res) => {
  var tablename = (req.body.exchangetype=='Spot')?spotpairs:perpetual;
    tablename.find({}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:'perpetual'});
        }
    });
});

router.post('/order-history/', (req, res) => {
  var tablename = req.body.exchangetype=="Spot"?spottradeTable:tradeTable;
   tablename.find({userId:ObjectId(req.body.userid)}).sort({'_id':-1}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:"orderhistory"});
        }
    });
});

router.post('/assethistory/', (req, res) => {
   Transaction.find({user_id:ObjectId(req.body.userid),transferType:{$ne:'TOADMIN'}}).sort({'_id':-1}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:"assethistory"});
        }
    });
});

router.post('/bonus-history/', (req, res) => {
   Bonus.find({userId:ObjectId(req.body.userid)}).populate({path:'referId',select:'email'}).sort({'_id':-1}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:"bonushistory"});
        }
    });
});

//
// router.post('/searchorder-history/', (req, res) => {
//   var userid    = req.body.userid;
//   var contract  = req.body.contract;
//   var type      = req.body.type;
//   var startDate = req.body.startDate;
//   var endDate   = req.body.endDate;
//   var match = {};
//   match['userId'] = userid;
//   if(contract!='All')
//   {
//     match['pairName'] = contract;
//   }
//   if(type!='All')
//   {
//     match['buyorsell'] = type.toLowerCase();
//   }
//   if(startDate!='' && endDate!='')
//   {
//     match['orderDate'] = {$gte:startDate,$lte:endDate};
//   }
//   else if(startDate!='')
//   {
//     match['orderDate'] = {$gte:startDate};
//   }
//   else if(endDate!='')
//   {
//     match['orderDate'] = {$lte:endDate};
//   }
//   var tablename = req.body.exchangetype=="Spot"?spottradeTable:tradeTable;
//    tablename.find(match).sort({'_id':-1}).then(result => {
//         if (result) {
//             return res.status(200).json({status:true,data:result,type:"orderhistory"});
//         }
//     });
// });
//
//
// router.post('/searchtrade-history/', (req, res) => {
//   var userid    = req.body.userid;
//   var contract  = req.body.contract;
//   var type      = req.body.type;
//   var startDate = req.body.startDate;
//   var endDate   = req.body.endDate;
//   var match = {};
//   match['userId'] = userid;
//   match['status'] = '1';
//   if(contract!='All')
//   {
//     match['pairName'] = contract;
//   }
//   if(type!='All')
//   {
//     match['buyorsell'] = type.toLowerCase();
//   }
//   if(startDate!='' && endDate!='')
//   {
//     match['orderDate'] = {$gte:startDate,$lte:endDate};
//   }
//   else if(startDate!='')
//   {
//     match['orderDate'] = {$gte:startDate};
//   }
//   else if(endDate!='')
//   {
//     match['orderDate'] = {$lte:endDate};
//   }
//    var tablename = req.body.exchangetype=="Spot"?spottradeTable:tradeTable;
//    tablename.find(match).sort({'_id':-1}).then(result => {
//         if (result) {
//             return res.status(200).json({status:true,data:result,type:"orderhistory"});
//         }
//     });
// });

router.post("/searchorder-history/", (req, res) => {
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match["userId"] = userid;
  if (contract != "All") {
    match["pairName"] = contract;
  }
  if (type != "All") {
    match["buyorsell"] = type.toLowerCase();
  }
  if (startDate != "" && endDate != "") {
    match["orderDate"] = { $gte: startDate, $lte: endDate };
  } else if (startDate != "") {
    match["orderDate"] = { $gte: startDate };
  } else if (endDate != "") {
    match["orderDate"] = { $lte: endDate };
  }
  var tablename = req.body.exchangetype == "Spot" ? spottradeTable : tradeTable;
  tablename
    .find(match)
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "orderhistory" });
      }
    });
});


router.post("/Depositsearchdata-history/", (req, res) => {
  console.log("req,body",req.body);
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match["user_id"] = userid;
  if (contract != "All") {
    match["currency"] = contract;
  }
  match["transferType"]="TOUSER"

  if (startDate != "" && endDate != "") {
    match["created_date"] = { $gte: startDate, $lte: endDate };
  } else if (startDate != "") {
    match["created_date"] = { $gte: startDate };
  } else if (endDate != "") {
    match["created_date"] = { $lte: endDate };
  }
  // var tablename = req.body.exchangetype == "Spot" ? spottradeTable : tradeTable;
  Transaction
    .find(match)
    .sort({ _id: -1 })
    .then((result) => {
      console.log("result",result);
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "assethistory" });
      }
    });
});

router.post("/searchtrade-history/", (req, res) => {
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match["userId"] = userid;
  match["status"] = "1";
  if (contract != "All") {
    match["pairName"] = contract;
  }
  if (type != "All") {
    match["buyorsell"] = type.toLowerCase();
  }
  if (startDate != "" && endDate != "") {
    match["orderDate"] = { $gte: startDate, $lte: endDate };
  } else if (startDate != "") {
    match["orderDate"] = { $gte: startDate };
  } else if (endDate != "") {
    match["orderDate"] = { $lte: endDate };
  }
  var tablename = req.body.exchangetype == "Spot" ? spottradeTable : tradeTable;
  tablename
    .find(match)
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "orderhistory" });
      }
    });
});


router.post('/trade-history/', (req, res) => {
  var tablename = req.body.exchangetype=="Spot"?spottradeTable:tradeTable;
   tablename.find({status:1,userId:ObjectId(req.body.userid)}).sort({'_id':-1}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:"tradehistory"});
        }
    });
});


router.post('/closedposhistory/', (req, res) => {
    position_table.find({userId:ObjectId(req.body.userid),pairname:req.body.pair}).sort({'_id':-1}).then(result => {
        if (result) {
            return res.status(200).json({status:true,data:result,type:"closedposhistory"});
        }
    });
});

router.post('/position_details/', (req, res) => {
  var userId = req.body.userId;
  var pair = req.body.pair;
    async.parallel({
      position_details : function(cb) {
          tradeTable.aggregate([
          { "$match": { '$or' : [{"status" : '1'},{"status" : '2'}],userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          { "$match": { "filled.position_status":'1'} },
          {$project:{"filled":1,leverage:1}},
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },
      daily_details : function(cb) {
        var start = new Date();
        start.setHours(0,0,0,0);
        // console.log(start,'start');
        var end = new Date();
        end.setHours(23,59,59,999);
        // console.log(end,'start');
        tradeTable.aggregate([
          { "$match": { '$or' : [{"status" : '1'},{"status" : '2'}],position_status:'1',userId:ObjectId(userId),"pairName": pair } },
          {$unwind:"$filled"},
          {$project:{"filled":1,leverage:1}},
          { "$match": {"filled.created_at": {$gte: new Date(start), $lt: new Date(end)}} },
          { "$group": { "_id": null,"price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"Fees" :{ "$sum": "$filled.Fees" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
          ]).exec(cb)
      },

    },(err,results) => {
      return res.status(200).json({status:true,data:results,type:"position_details"});
    });
});
//
// router.post('/pnlSearchdata/', (req, res) => {
//   var userid    = req.body.userid;
//   var contract  = req.body.contract;
//   var startDate = req.body.startDate;
//   var endDate   = req.body.endDate;
//   var match = {};
//   match['userId'] = userid;
//   if(contract!='All')
//   {
//     match['pairname'] = contract;
//   }
//   if(startDate!='' && endDate!='')
//   {
//     match['createdDate'] = {$gte:startDate,$lte:endDate};
//   }
//   else if(startDate!='')
//   {
//     match['createdDate'] = {$gte:startDate};
//   }
//   else if(endDate!='')
//   {
//     match['createdDate'] = {$lte:endDate};
//   }
//   // console.log(match,'search data');
//     position_table.find(match).then(result => {
//         if (result) {
//             return res.status(200).json({status:true,data:result,type:"closedposhistory"});
//         }
//     });
// });


router.post("/pnlSearchdata/", (req, res) => {
  var userid = req.body.userid;
  var contract = req.body.contract;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match["userId"] = userid;
  if (contract != "All") {
    match["pairname"] = contract;
  }
  if (startDate != "" && endDate != "") {
    match["createdDate"] = { $gte: startDate, $lte: endDate };
  } else if (startDate != "") {
    match["createdDate"] = { $gte: startDate };
  } else if (endDate != "") {
    match["createdDate"] = { $lte: endDate };
  }
  // console.log(match,'search data');
  position_table.find(match).then((result) => {
    if (result) {
      return res
        .status(200)
        .json({ status: true, data: result, type: "closedposhistory" });
    }
  });
});

cron.schedule("0 0 * * *", (req, res) => {
  spotPrices.remove(
    { createdAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
    function (err, result) {
      if (!err) {
        // res.send("success");
        console.log("succes on spotremoveal");
      } else {
        res.send(err);
      }
    }
  );
});

cron.schedule('*/4 * * * * *', (req,res) => {
  indexprice_calculation('LTCUSD',socketio);
});

// cron.schedule('*/4 * * * * *', (req,res) => {
// indexprice_calculation('ETHBTC',socketio);
// })
cron.schedule('*/2 * * * * *', (req,res) => {
indexprice_calculation('BTCUSD',socketio);
});

cron.schedule('*/2 * * * * *', (req,res) => {
indexprice_calculation('ETHUSD',socketio);
});

cron.schedule('*/3 * * * * *', (req,res) => {
indexprice_calculation('BCHUSD',socketio);
});

cron.schedule('*/3 * * * * *', (req,res) => {
indexprice_calculation('XRPUSD',socketio);
});

// cron.schedule("*/8 * * * * *", (req, res) => {
//   indexprice_calculation("XRPBTC", socketio);
// });



// cron.schedule('*/5 * * * * *', (req,res) => {
//     forced_liquidation('BTCUSD');
//   });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   forced_liquidation('ETHUSD');
// });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   forced_liquidation('LTCUSD');
// });
// cron.schedule('*/5 * * * * *', (req,res) => {
//   forced_liquidation('BCHUSD');
// });

// cron.schedule('*/5 * * * * *', (req,res) => {
//   forced_liquidation('XRPUSD');
// });


// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('BTCUSD')
// });

// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('LTCUSD')
// });

// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('BCHUSD')
// });

// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('ECHUSD')
// });

// cron.schedule('*/5 * * * * *', (req,res) => {
//   stopordertrigger('XRPUSD')
// });



// cron.schedule('* * * * * *', (req,res) => {
//   // console.log('3SECCRON');
//   exchangePrices.find({})
//             .skip(10000)
//             .sort({createdAt: 'desc'})
//             .exec(function(err, result) {
//             if (err) {
//               next(err);
//               console.log(err,'error');
//             }
//             if (result) {
//               // console.log(result);
//               result.forEach( function (doc) {
//                  doc.remove();
//                });
//             }
//           });
// });

// cron.schedule('0 */8 * * *', () => {
//   // fundingAmount();
// });

// cron.schedule('0 22 * * *', () => {
//   // interestfeefunction();
// });

// cron.schedule('0 22 * * *', () => {
//   perpetual.find({},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1},function(err,contractdetails){

//  }).then((contractdetails)=> {

// // processUsers(contractdetails,'Bitstamp');
// // processUsers(contractdetails,'Kraken');
// // processUsers(contractdetails,'Coinbasepro');
// // processUsers(contractdetails,'Gemini');
//   });
// });

function stopordertrigger(pair)
{
  perpetual.findOne({tiker_root:pair},{tiker_root:1,first_currency:1,second_currency:1,markprice:1,maxquantity:1,minquantity:1},function(err,contractdetails){
  if(contractdetails){
    var markprice = contractdetails.markprice;
  if(!isNaN(markprice))
  {
    async.parallel({
      stopbuyOrder : function(cb) {
        tradeTable.find({trigger_ordertype:'stop',pairName:pair,status:'4',stopstatus:'2',trigger_type:'Mark',buyorsell:'sell',trigger_price:{$gte:markprice},userId:{$ne:ObjectId("5e567694b912240c7f0e4299")}}).exec(cb)
      },
      stopsellOrder : function(cb) {
        tradeTable.find({trigger_ordertype:'stop',pairName:pair,status:'4',stopstatus:'2',trigger_type:'Mark',buyorsell:'buy',trigger_price:{$lte:markprice},userId:{$ne:ObjectId("5e567694b912240c7f0e4299")}}).exec(cb)
      },
      limitbuyorder : function(cb) {
        tradeTable.find({pairName:pair,orderType:'Limit',buyorsell:'sell',price:{$lte:(parseFloat(markprice))},'$or' : [{"status" : '0'},{"status" : '2'}]}).limit(100).sort({"price":1}).exec(cb)
      },
      limitsellorder : function(cb) {
         tradeTable.find({pairName:pair,orderType:'Limit',buyorsell:'buy',price:{$gte:(parseFloat(markprice))},'$or' : [{"status" : '0'},{"status" : '2'}]}).limit(100).sort({"price":-1}).exec(cb)
   },
    },(err,results) => {

      var stopbuyOrder   = results.stopbuyOrder;
      var stopsellOrder  = results.stopsellOrder;
      var limitbuyorder  = results.limitbuyorder;
      var limitsellorder = results.limitsellorder;
        if(stopbuyOrder.length)
          {
              for (var i=0; i < stopbuyOrder.length; i++) {
                  var _id           = stopbuyOrder[i]._id;
                  var price         = stopbuyOrder[i].price;
                  var trigger_price = stopbuyOrder[i].trigger_price;
                  var userId        = stopbuyOrder[i].userId;
                  var pairName      = stopbuyOrder[i].pairName;
                  var leverage      = stopbuyOrder[i].leverage;
                  var quantity      = stopbuyOrder[i].quantity;
                  var buyorsell     = stopbuyOrder[i].buyorsell;
                  var orderType     = stopbuyOrder[i].orderType;
                  var trailstop     = stopbuyOrder[i].trailstop;
                  var pos_leverage  = stopbuyOrder[i].leverage;
                  var pos_liqprice  = stopbuyOrder[i].Liqprice;
                  var curorder      = stopbuyOrder[i];
                  curorder.status   = '0';
                  var oppuser_id    = ObjectId("5e567694b912240c7f0e4299");
                  tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:'2'},{ "$set": {"status":'0',price:trigger_price}},{new:true,"fields": {status:1} },function(buytemp_err,buytempDat){
                      tradematching(curorder);
                  });
                }
            }

             if(stopsellOrder.length)
            {
                for (var i=0; i < stopsellOrder.length; i++) {
                    var _id           = stopsellOrder[i]._id;
                    var price         = stopsellOrder[i].price;
                    var trigger_price = stopsellOrder[i].trigger_price;
                    var userId        = stopsellOrder[i].userId;
                    var pairName      = stopsellOrder[i].pairName;
                    var leverage      = stopsellOrder[i].leverage;
                    var quantity      = stopsellOrder[i].quantity;
                    var buyorsell     = stopsellOrder[i].buyorsell;
                    var orderType     = stopsellOrder[i].orderType;
                    var trailstop     = stopsellOrder[i].trailstop;
                    var pos_leverage  = stopsellOrder[i].leverage;
                    var pos_liqprice  = stopsellOrder[i].Liqprice;
                    var oppuser_id    = ObjectId("5e567694b912240c7f0e4299");
                    var curorder      = stopsellOrder[i];
                    curorder.status   = '0';
                    tradeTable.findOneAndUpdate({_id:ObjectId(_id),status:'4',stopstatus:'2'},{ "$set": {"status":'0',price:trigger_price}},{new:true,"fields": {status:1} },function(buytemp_err,buytempDat){
                        tradematching(curorder);
                    });
                  }
              }

              //take profit
              tradeTable.findOneAndUpdate({trigger_ordertype:'takeprofit',pairName:pair,status:'4',stopstatus:'2',trigger_type:'Mark',buyorsell:'sell',trigger_price:{$lte:markprice}},{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

              });
               tradeTable.findOneAndUpdate({trigger_ordertype:'takeprofit',pairName:pair,status:'4',stopstatus:'2',trigger_type:'Mark',buyorsell:'buy',trigger_price:{$gte:markprice}},{ "$set": {"status":'0'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

              });

              tradeTable.findOneAndUpdate({pairName:pair,orderType:'Market',buyorsell:'sell',price:{$lt:(parseFloat(markprice-1))},'$or' : [{"status" : '0'},{"status" : '2'}]},{ "$set": {"status":'3'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

              });

               tradeTable.findOneAndUpdate({pairName:pair,orderType:'Market',buyorsell:'buy',price:{$gt:(parseFloat(markprice+1))},'$or' : [{"status" : '0'},{"status" : '2'}]},{ "$set": {"status":'3'}},{new:true,"fields": {status:1} },function(buytemp_err,buytempData){

              });
               if(limitbuyorder.length)
                {
                    for (var i=0; i < limitbuyorder.length; i++) {
                        var _id           = limitbuyorder[i]._id;
                        var userId        = limitbuyorder[i].userId;
                        var buyorsell     = limitbuyorder[i].buyorsell;
                        var pairName      = limitbuyorder[i].pairName;
                        var quantity      = limitbuyorder[i].quantity - limitbuyorder[i].filledAmount;
                        var price         = limitbuyorder[i].price;
                        var leverage      = limitbuyorder[i].leverage;
                        var oppuser_id    = ObjectId("5e567694b912240c7f0e4299");
                            var float = (pairName=='XRPUSD')?4:2;
                            cancel_trade(_id,userId);
                    }
                }

                 if(limitsellorder.length)
                  {
                      for (var i=0; i < limitsellorder.length; i++) {
                          var _id           = limitsellorder[i]._id;
                          var userId        = limitsellorder[i].userId;
                          var buyorsell     = limitsellorder[i].buyorsell;
                          var pairName      = limitsellorder[i].pairName;
                          var quantity      = limitsellorder[i].quantity - limitsellorder[i].filledAmount;
                          var price         = limitsellorder[i].price;
                          var leverage      = limitsellorder[i].leverage;
                          var oppuser_id    = ObjectId("5e567694b912240c7f0e4299");
                              var float = (pairName=='XRPUSD')?4:2;
                              cancel_trade(_id,userId);

                      }
                  }
    });
   }
   }
   });
}

function forced_liquidation(pair)
{
   perf.start();

// console.log("forced liq",pair);
      perpetual.find({'liq_users':'0'},{tiker_root:1,markprice:1,maint_margin:1,taker_fees:1,first_currency:1,second_currency:1},function(pererr,perdata){
         var index             = perdata.findIndex(x => (x.tiker_root) === pair);
        if(index!=-1)
        {
          perpetual.findOneAndUpdate({tiker_root:pair,liq_users:'0'},{"$set": {"liq_users":'1'} } , {new:true,"fields": {_id:1,liq_users:1} } ,function(userer,userdat){
            var lastprice = perdata[index].markprice;
            var mainmargin = perdata[index].maint_margin/100;
              tradeTable.aggregate([
              { "$match": { '$or' : [{"status" : '1'},{"status" : '2'}],forced_liquidation:false,"pairName": pair,userId:{$ne:ObjectId("5e567694b912240c7f0e4299")} } },
              {$unwind:"$filled"},
              { "$match": { "filled.position_status":'1',"filled.forced_liquidation":false} },
              {$project:{"filled":1,leverage:1}},
              { "$group": { "_id": "$filled.user_id","price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
              ]).exec(function(err,result){
                console.log(result,'result');
                  if(result.length>0)
                  {
                      var tradePos = 0;
                      var tradetails = result[0];
                      tradetails['lastprice'] = lastprice;
                      tradetails['perdata'] = perdata;
                      tradetails['mainmargin'] = mainmargin;
                      tradetails['index'] = index;
                      tradetails['pair'] = pair;
                      force_updation(tradetails, function() {
                          if (tradePos === result.length-1 ) {
                             perpetual.findOneAndUpdate({tiker_root:pair,liq_users:'1'},{"$set": {"liq_users":'0'} } , {new:true,"fields": {_id:1,liq_users:1} } ,function(usererr1,userdat1a){
                                tradeinfo.callBackforceTrade();
                              });
                            callBackResponseImport();
                          } else {
                            console.log('another call')
                              tradePos               += 1;
                              var tradeDetails = result[tradePos];
                              tradetails['lastprice'] = lastprice;
                              tradetails['mainmargin'] = mainmargin;
                              tradetails['perdata'] = perdata;
                              tradetails['index'] = index;
                              tradetails['pair'] = pair;
                              if (tradeDetails) {
                                  force_updation(tradetails);
                              } else {
                              callBackResponseImport();
                              }
                          }

                      });
                }
                else
                {
                   perpetual.findOneAndUpdate({tiker_root:pair,liq_users:'1'},{"$set": {"liq_users":'0'} } , {new:true,"fields": {_id:1,liq_users:1} } ,function(usererr1,userdat1a){
                              });
                }

              });
          });
        }
      });
      const results1 = perf.stop();
console.log(results1.time,'results1.time'+pair);

}
function force_updation(result,callBackOne)
{
  var lastprice  = result.lastprice;
  var mainmargin = result.mainmargin;
  var index      = result.index;
  var pair       = result.pair;
  var perdata    = result.perdata;
  if (callBackOne) {
    tradeinfo.callBackforceTrade = callBackOne;
  }
  condition_check = false;
                    // console.log(i,'i')
                    var pos_pairName           = (result.pairName)?result.pairName:0;
                    var user_id                = (result._id)?result._id:0;
                    var pos_quantity           = (result.quantity)?result.quantity:0;
                    var pos_price              = (result.price)?result.price:0;
                    var pos_leverage           = (result.leverage)?result.leverage:0;

                    //calculate the initial margin

                    var order_value1           = parseFloat(pos_quantity*pos_price).toFixed(8);
                    var order_value            = parseFloat(order_value1/pos_price).toFixed(8);
                    var required_margin        = parseFloat(order_value1)/pos_leverage;
                    var margininbtc            = parseFloat(required_margin)/parseFloat(pos_price);

                    var profitnlossusd         = (parseFloat(pos_price)) - (parseFloat(lastprice));
                    var profitnlossusd         = parseFloat(profitnlossusd)*parseFloat(pos_quantity);

                    var profitnloss            = parseFloat(profitnlossusd)/parseFloat(pos_price);
                    var mainmarginwithleverage = parseFloat(mainmargin)*parseFloat(pos_leverage);

                      if(pos_quantity>0)
                      {
                          var pos_liqprice       = (parseFloat(pos_price)*parseFloat(pos_leverage))/((parseFloat(pos_leverage)+1)-parseFloat(mainmarginwithleverage));
                      }
                      else
                      {
                          var pos_liqprice       = (parseFloat(pos_price)*parseFloat(pos_leverage))/((parseFloat(pos_leverage)-1)+parseFloat(mainmarginwithleverage));
                      }
                      console.log(pos_liqprice,'pos_liqprice')
                      console.log(lastprice,'lastprice')
                      console.log(pos_quantity,'pos_quantity')
                      console.log(user_id,'user_id')
                      if(pos_quantity>0 && pos_liqprice>lastprice)
                      {
                          var condition_check = true;
                      console.log('long',pos_quantity);
                          var bankruptcy    = +pos_price * (+pos_leverage/(+pos_leverage+1))
                          var orderType = "Market";
                          var oppuser_id = ObjectId("5e567694b912240c7f0e4299");

                          var jsonfilter = {
                          identifier: "liquidation_notification"
                          };
                          var logo = keys.baseUrl + "Logo-small.png";

                      async.waterfall([
                         function (done) {
                            User.findOne({'_id':ObjectId(user_id)},{email:1,liq_lock:1}, function(err, userdet) {
                                if(userdet)
                                {
                                    userdetails = userdet
                                    done()
                                }
                            });

                        },
                          function (done) {
                              tradeTable.findOneAndUpdate({"filled.position_status":'1',"filled.forced_liquidation":false,"filled.pairname":pair,"filled.user_id":ObjectId(user_id)},{"$set": {"filled.$.position_status":'0',forced_liquidation:true} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){
                                console.log(usererr1,'usererr1')
                                console.log(userdat1a,'userdat1a')
                                  var buyorsell   = 'sell';
                                  var selluserid  = ObjectId(user_id);
                                  var buyuserid   = ObjectId(oppuser_id);
                                  var sellorderid = ObjectId();
                                  var buyorderid  = ObjectId();
                                  var btcindex          = perdata.findIndex(x => (x.tiker_root) === 'BTCUSD');
                                  var markprice         = perdata[index].markprice;
                                  var btcprice          = perdata[btcindex].markprice;
                                  var taker_fees        = perdata[index].taker_fees;
                                  var leverage          = parseFloat(pos_leverage);
                                  var order_value1      = parseFloat(pos_quantity)*parseFloat(pos_liqprice);
                                  var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
                                  var required_margin   = parseFloat(order_value1)/leverage;
                                  var fee               = parseFloat(order_value1)*taker_fees/100;
                                  var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
                                  var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
                                  var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
                                  order_cost            = parseFloat(order_cost).toFixed(8);
                                  var quantity          = pos_quantity;


                                  var mainmargin = perdata[index].maint_margin/100;
                                  var balance_check = true;

                                    var buyLiqprice = parseFloat(pos_liqprice)*parseFloat(leverage)/((leverage+1)-(parseFloat(mainmargin)*parseFloat(leverage)));


                                    sellquantity = parseFloat(quantity)*-1;
                                    var sellLiqprice = parseFloat(pos_liqprice)*parseFloat(leverage)/((leverage-1)+(parseFloat(mainmargin)*parseFloat(leverage)));

                                  var float = (pair=='XRPUSD')?4:2;
                                  var tempdata = {
                                  "pair"               : ObjectId(perdata[index]._id),
                                  "firstCurrency"      : perdata[index].first_currency,
                                  "secondCurrency"     : perdata[index].second_currency,
                                  "forced_liquidation" : true,
                                  "buyuserId"          : ObjectId(buyuserid),
                                  "user_id"            : ObjectId(selluserid),
                                  "selluserId"         : ObjectId(selluserid),
                                  "sellId"             : ObjectId(sellorderid),
                                  "buyId"              : ObjectId(buyorderid),
                                  "filledAmount"       : +(sellquantity).toFixed(8),
                                  "Price"              : +parseFloat(pos_liqprice).toFixed(float),
                                  "pairname"           : pair,
                                  "order_cost"         : order_cost,
                                  "status"             : "filled",
                                  "Type"               : "sell",
                                  position_status      : '0',
                                  "Fees"               : parseFloat(feeinbtc).toFixed(8),
                                  "created_at"         : new Date(),
                                  "order_value"        : order_value,
                                  }

                                  const newtradeTable = new tradeTable({
                                  _id               : sellorderid,
                                  quantity          : sellquantity,
                                  price             : parseFloat(pos_liqprice).toFixed(float),
                                  orderCost         : order_cost,
                                  orderValue        : order_value,
                                  leverage          : leverage,
                                  userId            : user_id,
                                  pair              : perdata[index]._id,
                                  pairName          : pair,
                                  beforeBalance     : 0,
                                  afterBalance      : 0,
                                  firstCurrency     : perdata[index].first_currency,
                                  secondCurrency    : perdata[index].second_currency,
                                  Liqprice          : sellLiqprice,
                                  orderType         : "Market",
                                  buyorsell         : buyorsell,
                                  btcprice          : btcprice,
                                  taker_fees        : taker_fees,
                                  trigger_price      : 0,
                                  forced_liquidation : true,
                                  filled             : tempdata,
                                  position_status : '1',
                                  status            : '1' // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                                  });

                                  newtradeTable
                                  .save()
                                  .then(curorder => {
                                    console.log("sellorder created")
                                  }).catch(err => { console.log(err,'error'); res.json({status:false,message:"Your order not placed.",notify_show:'yes'})});

                                  tempdata.user_id = oppuser_id;
                                  tempdata.Type = "buy";

                                   const newtradeTable1 = new tradeTable({
                                  _id               : buyorderid,
                                  quantity          : quantity,
                                  price             : parseFloat(pos_liqprice).toFixed(float),
                                  orderCost         : order_cost,
                                  orderValue        : order_value,
                                  leverage          : leverage,
                                  userId            : oppuser_id,
                                  pair              : perdata[index]._id,
                                  pairName          : pair,
                                  beforeBalance     : 0,
                                  afterBalance      : 0,
                                  firstCurrency     : perdata[index].first_currency,
                                  secondCurrency    : perdata[index].second_currency,
                                  Liqprice          : buyLiqprice,
                                  orderType         : "Market",
                                  buyorsell         : "buy",
                                  btcprice          : btcprice,
                                  taker_fees        : taker_fees,
                                  forced_liquidation : true,
                                  filled             : tempdata,
                                  trigger_price      : 0,
                                  position_status : '1',
                                  status            : '1' // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                                  });

                                  newtradeTable1
                                  .save()
                                  .then(curorder => {
                                     console.log("buyorder created")
                                  }).catch(err => { console.log(err,'error'); });

                                  const newposition = new position_table({
                                  "pairname"           : pair,
                                  "pair"               : perdata[index]._id,
                                  "userId"             : user_id,
                                  "closing_direction"  : "Closed long",
                                  "quantity"           : quantity,
                                  "exit_price"         : pos_liqprice,
                                  "entry_price"        : pos_price,
                                  "profitnloss"        : (Math.abs(order_cost)*-1),
                                  "exit_type"          : 'Liquidated',
                                  "orderCost"          : order_cost,
                                  });

                                   newposition
                                  .save()
                                  .then(curorder => {
                                     console.log("buyorder created")
                                  }).catch(err => { console.log(err,'error'); });


                                  console.log('order triggering')
                                  Emailtemplates.findOne(jsonfilter, {
                                    _id: 0
                                  }, function (err, templates) {
                                    if(templates)
                                    {
                                        template = templates
                                        if (templates.content) {
                                          templateData = templates;
                                          templateData.content = templateData.content.replace(/##templateInfo_name##/g, userdetails.email);
                                          templateData.content = templateData.content.replace(/##templateInfo_appName##/g, keys.siteName);
                                          templateData.content = templateData.content.replace(/##templateInfo_logo##/g, logo);

                                          templateData.content = templateData.content.replace(/##PAIR##/g, pos_pairName);
                                          templateData.content = templateData.content.replace(/##SIDE##/g, "Buy");
                                          templateData.content = templateData.content.replace(/##QUANTITY##/g, pos_quantity);
                                          templateData.content = templateData.content.replace(/##LEVERAGE##/g, pos_leverage);
                                          templateData.content = templateData.content.replace(/##POSITIONMARGIN##/g, parseFloat(margininbtc).toFixed(8));
                                          templateData.content = templateData.content.replace(/##LIQPRICE##/g, parseFloat(pos_liqprice).toFixed(8));
                                          templateData.content = templateData.content.replace(/##MAINTMARGIN##/g, mainmargin);
                                          templateData.content = templateData.content.replace(/##LIQDATE##/g, new Date());
                                          templateData.content = templateData.content.replace(/##MARKPRICE##/g, parseFloat(pos_liqprice).toFixed(float));
                                          templateData.content = templateData.content.replace(/##BANKRUPTSY##/g, bankruptcy);
                                        done()
                                    }
                                  }
                                  });

                              });

                          },
                          function(done){
                            var smtpConfig = {
                              // service: keys.serverName,
                              host: keys.host, // Amazon email SMTP hostname
                              auth: {
                                user: keys.email,
                                pass: keys.password
                              }
                            };
                            var transporter = nodemailer.createTransport(smtpConfig);

                            var mailOptions = {
                              from: keys.fromName + '<' + keys.fromemail + '>', // sender address
                              to: userdetails.email, // list of receivers
                              subject: templateData.subject, // Subject line
                              html: templateData.content // html body
                            };
                            // transporter.sendMail(mailOptions, function (error, info) {
                              // if (error) {
                              //   return console.log(error);
                              // }

                            // });
                          }
                        ],
                        function (err) {
                            getusertradedata(user_id,perdata[index].first_currency,perdata[index].second_currency)
                            gettradedata(perdata[index].first_currency,perdata[index].second_currency,socketio);
                        });

                      }
                      else if(pos_quantity<0 && pos_liqprice<lastprice)
                      {
                        var condition_check = true;
                        var bankruptcy    = +pos_price * (+pos_leverage/(+pos_leverage-1))
                        var orderType = "Market";
                        var oppuser_id = ObjectId("5e567694b912240c7f0e4299");

                        var jsonfilter = {
                        identifier: "liquidation_notification"
                        };
                        var logo = keys.baseUrl + "Logo-small.png";

                    async.waterfall([
                      function (done) {
                            User.findOne({'_id':ObjectId(user_id)},{email:1,liq_lock:1}, function(err, userdet) {
                                if(userdet)
                                {
                                    userdetails = userdet
                                    done()
                                }
                            });

                        },
                        function (done) {
                            tradeTable.findOneAndUpdate({"filled.position_status":'1',"filled.forced_liquidation":false,"filled.pairname":pair,"filled.user_id":ObjectId(user_id)},{"$set": {"forced_liquidation":true,"filled.$.position_status":'0'} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){
                                console.log(userdat1a,'userdat1a');
                                console.log(usererr1,'usererr1');

                                  var buyorsell = 'buy';
                                  var selluserid = ObjectId(oppuser_id);
                                  var buyuserid = ObjectId(user_id);
                                  var sellorderid = ObjectId();
                                  var buyorderid = ObjectId();
                                  var btcindex          = perdata.findIndex(x => (x.tiker_root) === 'BTCUSD');
                                  var markprice         = perdata[index].markprice;
                                  var btcprice          = perdata[btcindex].markprice;
                                  var taker_fees        = perdata[index].taker_fees;
                                  var leverage          = parseFloat(pos_leverage);
                                  var order_value1      = parseFloat(pos_quantity)*parseFloat(pos_liqprice);
                                  var order_value       = parseFloat(order_value1/btcprice).toFixed(8);
                                  var required_margin   = parseFloat(order_value1)/leverage;
                                  var fee               = parseFloat(order_value1)*taker_fees/100;
                                  var margininbtc       = parseFloat(required_margin)/parseFloat(btcprice);
                                  var feeinbtc          = parseFloat(fee)/parseFloat(btcprice);
                                  var order_cost        = parseFloat(margininbtc)+parseFloat(feeinbtc);
                                  order_cost            = parseFloat(order_cost).toFixed(8);
                                  var quantity          = pos_quantity;


                                  var mainmargin = perdata[index].maint_margin/100;
                                  var balance_check = true;

                                  var buyLiqprice = parseFloat(pos_liqprice)*parseFloat(leverage)/((leverage+1)-(parseFloat(mainmargin)*parseFloat(leverage)));


                                  sellquantity = parseFloat(quantity)*-1;
                                  var sellLiqprice = parseFloat(pos_liqprice)*parseFloat(leverage)/((leverage-1)+(parseFloat(mainmargin)*parseFloat(leverage)));

                                  var float = (pair=='XRPUSD')?4:2;
                                  var tempdata = {
                                  "pair"               : ObjectId(perdata[index]._id),
                                  "firstCurrency"      : perdata[index].first_currency,
                                  "secondCurrency"     : perdata[index].second_currency,
                                  "forced_liquidation" : true,
                                  "buyuserId"          : ObjectId(buyuserid),
                                  "user_id"            : ObjectId(buyuserid),
                                  "selluserId"         : ObjectId(selluserid),
                                  "sellId"             : ObjectId(sellorderid),
                                  "buyId"              : ObjectId(buyorderid),
                                  "filledAmount"       : +(quantity).toFixed(8),
                                  "Price"              : +parseFloat(pos_liqprice).toFixed(float),
                                  "pairname"           : pair,
                                  "order_cost"         : order_cost,
                                  position_status      : '0',
                                  "status"             : "filled",
                                  "Type"               : "buy",
                                  "Fees"               : parseFloat(feeinbtc).toFixed(8),
                                  "created_at"         : new Date(),
                                  "order_value"        : order_value,
                                  }

                                  const newtradeTable = new tradeTable({
                                  _id                : sellorderid,
                                  quantity           : sellquantity,
                                  price              : parseFloat(pos_liqprice).toFixed(float),
                                  orderCost          : order_cost,
                                  orderValue         : order_value,
                                  leverage           : leverage,
                                  userId             : oppuser_id,
                                  pair               : perdata[index]._id,
                                  pairName           : pair,
                                  beforeBalance      : 0,
                                  afterBalance       : 0,
                                  trigger_price       : 0,
                                  firstCurrency      : perdata[index].first_currency,
                                  secondCurrency     : perdata[index].second_currency,
                                  Liqprice           : sellLiqprice,
                                  orderType          : "Market",
                                  buyorsell          : "sell",
                                  btcprice           : btcprice,
                                  taker_fees         : taker_fees,
                                  forced_liquidation : true,
                                  filled             : tempdata,
                                  position_status    : '1',
                                  status             : '1' // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                                  });
                                  newtradeTable
                                  .save()
                                  .then(curorder => {
                                    console.log("sellorder created")
                                  }).catch(err => { console.log(err,'error'); });

                                  tempdata.user_id = user_id;
                                  tempdata.Type = "buy";

                                   const newtradeTable1 = new tradeTable({
                                  _id                : buyorderid,
                                  quantity           : quantity,
                                  price              : parseFloat(pos_liqprice).toFixed(float),
                                  orderCost          : order_cost,
                                  orderValue         : order_value,
                                  leverage           : leverage,
                                  userId             : user_id,
                                  pair               : perdata[index]._id,
                                  pairName           : pair,
                                  beforeBalance      : 0,
                                  afterBalance       : 0,
                                  trigger_price       : 0,
                                  firstCurrency      : perdata[index].first_currency,
                                  secondCurrency     : perdata[index].second_currency,
                                  Liqprice           : buyLiqprice,
                                  orderType          : "Market",
                                  buyorsell          : "buy",
                                  btcprice           : btcprice,
                                  taker_fees         : taker_fees,
                                  forced_liquidation : true,
                                  filled             : tempdata,
                                  position_status    : '1',
                                  status             : '1' // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                                  });
                                  newtradeTable1
                                  .save()
                                  .then(curorder => {
                                     console.log("buyorder created")
                                  }).catch(err => { console.log(err,'error'); });

                                  const newposition = new position_table({
                                  "pairname"           : pair,
                                  "pair"               : perdata[index]._id,
                                  "userId"             : user_id,
                                  "closing_direction"  : "Closed short",
                                  "quantity"           : quantity,
                                  "exit_price"         : pos_liqprice,
                                  "entry_price"        : pos_price,
                                  "profitnloss"        : (Math.abs(order_cost)*-1),
                                  "exit_type"          : 'Liquidated',
                                  "orderCost"          : order_cost,
                                  });

                                   newposition
                                  .save()
                                  .then(curorder => {
                                     console.log("buyorder created")
                                  }).catch(err => { console.log(err,'error'); });

                                  Emailtemplates.findOne(jsonfilter, {
                                  _id: 0
                                  }, function (err, template) {
                                      if(template)
                                      {
                                      templates = template
                                          if (templates.content) {
                                          templateData = templates;
                                          templateData.content = templateData.content.replace(/##templateInfo_name##/g, userdetails.email);
                                          templateData.content = templateData.content.replace(/##templateInfo_appName##/g, keys.siteName);
                                          templateData.content = templateData.content.replace(/##templateInfo_logo##/g, logo);

                                          templateData.content = templateData.content.replace(/##PAIR##/g, pos_pairName);
                                          templateData.content = templateData.content.replace(/##SIDE##/g, "Sell");
                                          templateData.content = templateData.content.replace(/##QUANTITY##/g, pos_quantity);
                                          templateData.content = templateData.content.replace(/##LEVERAGE##/g, pos_leverage);
                                          templateData.content = templateData.content.replace(/##POSITIONMARGIN##/g, parseFloat(margininbtc).toFixed(8));
                                          templateData.content = templateData.content.replace(/##LIQPRICE##/g, parseFloat(pos_liqprice).toFixed(8));
                                          templateData.content = templateData.content.replace(/##MAINTMARGIN##/g, mainmargin);
                                          templateData.content = templateData.content.replace(/##LIQDATE##/g, new Date());
                                          templateData.content = templateData.content.replace(/##MARKPRICE##/g, parseFloat(pos_liqprice).toFixed(float));
                                          templateData.content = templateData.content.replace(/##BANKRUPTSY##/g, bankruptcy);
                                          done()
                                          }
                                      }
                                  });

                              });
                        },
                        function(done){
                          var smtpConfig = {
                            // service: keys.serverName,
                            host: keys.host, // Amazon email SMTP hostname
                            auth: {
                              user: keys.email,
                              pass: keys.password
                            }
                          };
                          var transporter = nodemailer.createTransport(smtpConfig);

                          var mailOptions = {
                            from: keys.fromName + '<' + keys.fromemail + '>', // sender address
                            to: userdetails.email, // list of receivers
                            subject: templateData.subject, // Subject line
                            html: templateData.content // html body
                          };
                          // transporter.sendMail(mailOptions, function (error, info) {
                          //   if (error) {
                          //     return console.log(error);
                          //   }
                            // perpetual.findOneAndUpdate({tiker_root:pair,liq_users:'1'},{"$set": {"liq_users":'0'} } , {new:true,"fields": {_id:1,liq_users:1} } ,function(usererr1,userdat1a){
                            // tradeinfo.callBackforceTrade();
                            // });
                          // });
                        }
                      ],
                      function (err) {
                          getusertradedata(user_id,perdata[index].first_currency,perdata[index].second_currency)
                          gettradedata(perdata[index].first_currency,perdata[index].second_currency,socketio);
                      });
                      }
                      else
                      {
                        tradeinfo.callBackforceTrade();
                      }
}


function interestfeefunction()
{
      var datas = {
        "filled.position_status" : '1',
        "filled.status"          : 'filled'
    },sort;
    perpetual.find({},{tiker_root:1,funding_rate:1,markprice:1,dailyinterest:1}).
    exec(function (pairerr, pairDetails) {
          // console.log(perdata);
          tradeTable.aggregate([
          {$unwind:"$filled"},
          {$project:{"filled":1}},
          {$match:datas},
          ]).exec((tradeerr,tradedata) => {
                if(tradedata.length>0)
                {
                  for(i=0;i<tradedata.length;i++)
                  {
                    var quantity      = tradedata[i].filled.filledAmount;
                    var Price         = tradedata[i].filled.Price;
                    var order_cost    = tradedata[i].filled.order_cost;
                    var pairname      = tradedata[i].filled.pairname;
                    var firstCurrency = tradedata[i].filled.firstCurrency;
                    var user_id       = tradedata[i].filled.user_id;
                    var index         = pairDetails.findIndex(x => (x.tiker_root) === pairname);
                    var btcindex         = pairDetails.findIndex(x => (x.tiker_root) === 'BTCUSD');
                    if(index!=-1)
                    {
                        var dailyinterest = pairDetails[index].dailyinterest;
                        var markprice = pairDetails[index].markprice;
                        var btcprice = pairDetails[btcindex].markprice;

                        var intrestinfirstcur = (order_cost*dailyinterest)/100;
                        var interestusd = parseFloat(intrestinfirstcur)*parseFloat(markprice);
                        var interest = parseFloat(interestusd)/parseFloat(btcprice);
                        var updatebaldata = {};
                        updatebaldata["balance"] = interest;

                        Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(user_id),balance:{$gte:interest}},{"$dec": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
                          if(baldata)
                          {
                            const newTransaction = new Transaction({
                                user_id      : user_id,
                                currency     : 'BTC',
                                transferType : "Realized P&L",
                                amount       : interest,
                            });
                             newTransaction.save(function(err,data) {


                             });
                           }
                        });
                    }

                  }

                }
          });
    });
}

router.get('/indexprice_calculation/', (req, res) => {
   // var io = req.app.get('socket');
  // funding_rate();
  // forced_liquidation();
  // forced_liquidation("BTCUSD");
  // indexprice_calculation('BTCUSD',io);
  // indexprice_calculation('ETHUSD',io);
  // indexprice_calculation('BCHUSD');
  fundingAmount();
  // interestfeefunction();
});
function getimpactbidprice(type,pair)
{
  // console.log(pair,'fsdfsdfsdfsdfsdfsdf')

  return tradeTable.aggregate([
    // { "$match": { "orderDate": { $gt:new Date(Date.now() - 8*60*60 * 1000) },"status":'1',"buyorsell":type,"pairname": pair} },
    { "$match": { "status":'1',"buyorsell":type,"pairName": pair } },
    { "$group": { "_id": null,"price" :{ "$avg": "$price" } } }
]);
}

function getavgtradevolume(type,pair)
{
  return exchangePrices.aggregate([
    { "$match":
    // { "createdAt":{
    //     $gte: (new Date((new Date()).getTime() - (10 * 24 * 60 * 60 * 1000)))
    // },
  {  "pairname":pair,"exchangename":type } },
    // { "$match": { "status":'1',"buyorsell":type } },
    { "$group": { "_id": null,"volume" :{ "$avg": "$volume" } } }
]);
}

function getspotprice(exchange,pair)
{
  return exchangePrices.findOne({pairname:pair,exchangename:exchange}).sort({'createdAt':-1}).select('last').select('createdAt').select('volume');
}

async function getlastspot(pair)
{
  return spotPrices.findOne({pairname:pair}).sort({'createdAt':-1}).select('createdAt').select('pairname').select('price');
}

async function indexprice_calculation(pair,io=null)
{

    var exc_A_avgtradevolumefor_month = await getspotprice('Bitstamp',pair);
    var exc_B_avgtradevolumefor_month = await getspotprice('Kraken',pair);
    var exc_C_avgtradevolumefor_month = await getspotprice('Coinbase',pair);
     var exchange_A_spotprice = (exc_A_avgtradevolumefor_month)?exc_A_avgtradevolumefor_month.last:0;
    var exchange_B_spotprice = (exc_B_avgtradevolumefor_month)?exc_B_avgtradevolumefor_month.last:0;
    var exchange_C_spotprice = (exc_C_avgtradevolumefor_month)?exc_C_avgtradevolumefor_month.last:0;

    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    exc_A_avgtradevolumefor_month = (exc_A_avgtradevolumefor_month)?exc_A_avgtradevolumefor_month.volume:0;
    exc_B_avgtradevolumefor_month = (exc_B_avgtradevolumefor_month)?exc_B_avgtradevolumefor_month.volume:0;
    exc_C_avgtradevolumefor_month = (exc_C_avgtradevolumefor_month)?exc_C_avgtradevolumefor_month.volume:0;

    // console.log(exc_A_avgtradevolumefor_month);
    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    // return false;

    // var exc_A_avgtradevolumefor_month =  2722988075;
    // var exc_B_avgtradevolumefor_month =  6031867375;
    // var exc_C_avgtradevolumefor_month =  3951095106;

    Totalexcvol = exc_A_avgtradevolumefor_month + exc_B_avgtradevolumefor_month + exc_C_avgtradevolumefor_month;
    //Weightage calculation

    var Wt_A = parseFloat(exc_A_avgtradevolumefor_month) / parseFloat(Totalexcvol);
    var Wt_B = parseFloat(exc_B_avgtradevolumefor_month) / parseFloat(Totalexcvol);
    var Wt_C = parseFloat(exc_C_avgtradevolumefor_month) / parseFloat(Totalexcvol);




    // console.log(exchange_A_ticker,'indexprice_calculation');
    // return false;
    // console.log(exchange_B_ticker,'ticker details');


    // console.log(exchange_A_spotprice,'A price');
    // console.log(exchange_B_spotprice,'B price');
    // console.log(exchange_C_spotprice,'C price');

    var total = Wt_A+Wt_B+Wt_C;
    var awei = (Wt_A/total)*100;
    var bwei = (Wt_B/total)*100;
    var cwei = (Wt_C/total)*100;

    var EBTC  =  parseFloat(awei/100) * parseFloat(exchange_A_spotprice) + parseFloat(bwei/100) * parseFloat(exchange_B_spotprice) + parseFloat(cwei/100) * parseFloat(exchange_C_spotprice);
    var pricespreadofA = Math.abs(parseFloat(exchange_A_spotprice) - parseFloat(EBTC));
    var pricespreadofB = Math.abs(parseFloat(exchange_B_spotprice) - parseFloat(EBTC));
    var pricespreadofC = Math.abs(parseFloat(exchange_C_spotprice) - parseFloat(EBTC));

    var asquare = 1/(parseFloat(pricespreadofA) * parseFloat(pricespreadofA));
    var bsquare = 1/(parseFloat(pricespreadofB) * parseFloat(pricespreadofB));
    var csquare = 1/(parseFloat(pricespreadofC) * parseFloat(pricespreadofC));
    var totalsquar = parseFloat(asquare) + parseFloat(bsquare) + parseFloat(csquare);
    var weight_A   =   parseFloat(asquare) / parseFloat(totalsquar);
    var weight_B   =   parseFloat(bsquare) / parseFloat(totalsquar);
    var weight_C   =   parseFloat(csquare) / parseFloat(totalsquar);

    var index_price  =  (parseFloat(weight_A) * parseFloat(exchange_A_spotprice)) + (parseFloat(weight_B) * parseFloat(exchange_B_spotprice)) + (parseFloat(weight_C) * parseFloat(exchange_C_spotprice))

      // console.log(index_price,'indexprice');
    var Interest_Quote_Index = 1/100;
    var Interest_Base_Index  = 0.25/100;
    var fundingrate          = (Interest_Quote_Index*Interest_Base_Index)/3;

    var timeuntillfunding    = 5;  //need to calculate
    var fundinbasis          = fundingrate * (timeuntillfunding/3);
    var mark_price           = index_price * (1 + fundinbasis);

    // console.log(mark_price,'mark price');
    var lastspot = await getlastspot(pair);

    if(typeof index_price != 'undefined' && typeof mark_price != 'undefined')
    {
      // console.log(mark_price,'mark_price'+ pair)
      var tablename = (pair=='ETHBTC')?spotpairs:perpetual;
        perpetual.findOneAndUpdate({tiker_root:pair},{"$set": {"markprice":mark_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1,_id:1,change:1} } ,function(pererr,perdata){
          var pricedata = perdata;
          var spotpairname = pair.replace("USD","USDT");
           // spotpairs.findOneAndUpdate({tiker_root:spotpairname},{"$set": {"markprice":mark_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1,_id:1,change:1} } ,function(pererr1,perdata1){
           //var perdata = {"markprice":Math.floor(1000 + Math.random() * 9000),"last":1234,"tiker_root":"BTCUSD"};
           // console.log("perdata "+" pair"+spotpairname,perdata);
          io.emit('PRICEDETAILS', (pair=='ETHBTC')?perdata1:pricedata);
          var perdata = (pair=='ETHBTC')?perdata1:pricedata;
          if(perdata)
          {
              var markprice = (mark_price)?mark_price:0;
              const newrecord = new spotPrices({
              "price"        : (mark_price)?mark_price:0,
              "pair"         : ObjectId(perdata._id),
              "pairname"     : pair,
              "createdAt"    : new Date(),
              });
              // console.log(lastspot.price,'lastspot')
              // console.log(markprice,'markprice')
              if(lastspot)
              {
                  var difference = Math.abs(parseFloat(lastspot.price)-parseFloat(markprice));
                  var percent = (parseFloat(difference)/parseFloat(lastspot.price))*100
              }

              if(markprice!=0 && markprice!='')
              {
                // console.log('insert')
                newrecord.save(function(err,data) {
                  // console.log(err,'err');
                  // console.log(data,'data');
                  // setTimeout(function () {
                  //  stopordertrigger(mark_price,pair);
                  // }, 5000);
                });
              }

          }
            // });
            });
    }
    //here
    var Interest_Quote_Index = 1/100;
    var Interest_Base_Index  = 0.25/100;
    // var mark_price        = 9260

    var Interest_Rate        = ((Interest_Quote_Index-Interest_Base_Index)/3) * 100;

    // var imapactbidprice      = await getimpactbidprice('buy',pair);
    // var imapactaskprice      = await getimpactbidprice('sell',pair);

     var imapactbidprice      = await getspotprice(pair,'Coinbase');
    var imapactaskprice      = await getspotprice(pair,'Kraken');
    // console.log(imapactbidprice,'imapactbidprice'+pair);

    var exchange_A_ticker    = await getspotprice(pair,'Bitstamp');
    var exchange_A_spotprice = exchange_A_ticker?exchange_A_ticker.last:0;

    if(typeof imapactbidprice!='undefined')
    {
        imapactbidprice          = (imapactbidprice)?imapactbidprice.last:0;
        imapactaskprice          = (imapactaskprice)?imapactaskprice.last:0;

        // console.log(imapactbidprice,'imapactbidprice');
        // console.log(imapactaskprice,'imapactaskprice');

        var midprice          = Math.round((imapactbidprice+imapactaskprice)/2);

        // console.log(mark_price,'mark_price');
        // console.log(Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price)),'first');
        // console.log(Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice)),'second');
        // console.log(exchange_A_spotprice,'second');
        var first = Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price));
        var second = Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice));
        var premium_index     = (first -  second)/parseFloat(exchange_A_spotprice);

        // console.log(premium_index,'premium_index');

        var date              = new Date();
        var curhour           = date.getHours();
        var timeuntillfunding = (curhour>0 && curhour<8)?(8-curhour):(curhour>8 && curhour<16)?(16-curhour):(curhour>16 && curhour<24)?(24-curhour):0;

        // var fairbasis      = (parseFloat(midprice)/parseFloat(index_price)-1)/(30/365);
        var fairbasis         = fundingrate * (timeuntillfunding/3)
        // console.log(fairbasis,'fairbasis');
        premium_index         = (parseFloat(premium_index) + fundingrate);

        // console.log(parseFloat(premium_index),'premium_index');
        // console.log(Interest_Rate,'Interest_Rate');

        const clamp           = (min, max) => (value) =>
          value < min ? min : value > max ? max : value;
        // var Interest_Rate = 0.01;
        var cl = (Interest_Rate) - premium_index;
        var minusval = Math.min(Math.max(parseFloat(cl), -0.05), 0.05);
        // console.log(parseFloat(minusval),'minusval');
        var Funding_Rate      = parseFloat(premium_index) + parseFloat(minusval);
        // console.log(Funding_Rate,'Funding_Rate');
        if(typeof Funding_Rate != 'undefined' && typeof mark_price != 'undefined')
        {
            perpetual.findOneAndUpdate({tiker_root:pair},{"$set": {"funding_rate":Funding_Rate,"markprice":mark_price,"index_price":index_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1} } ,function(pererr,perdata){
                // console.log(perdata);
            });
        }
    }
}
async function indexprice_calculation1(pair,io=null)
{
    var exc_A_avgtradevolumefor_month = await getavgtradevolume('Bitstamp',pair);
    var exc_B_avgtradevolumefor_month = await getavgtradevolume('Kraken',pair);
    var exc_C_avgtradevolumefor_month = await getavgtradevolume('Coinbase',pair);

    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    exc_A_avgtradevolumefor_month = (exc_A_avgtradevolumefor_month.length > 0)?exc_A_avgtradevolumefor_month[0].volume:0;
    exc_B_avgtradevolumefor_month = (exc_B_avgtradevolumefor_month.length > 0)?exc_B_avgtradevolumefor_month[0].volume:0;
    exc_C_avgtradevolumefor_month = (exc_C_avgtradevolumefor_month.length > 0)?exc_C_avgtradevolumefor_month[0].volume:0;

    // console.log(exc_A_avgtradevolumefor_month);
    // console.log(exc_B_avgtradevolumefor_month);
    // console.log(exc_C_avgtradevolumefor_month);
    // return false;

    // var exc_A_avgtradevolumefor_month =  2722988075;
    // var exc_B_avgtradevolumefor_month =  6031867375;
    // var exc_C_avgtradevolumefor_month =  3951095106;

    Totalexcvol = exc_A_avgtradevolumefor_month + exc_B_avgtradevolumefor_month + exc_C_avgtradevolumefor_month;
    //Weightage calculation

    var Wt_A = parseFloat(exc_A_avgtradevolumefor_month) / parseFloat(Totalexcvol);
    var Wt_B = parseFloat(exc_B_avgtradevolumefor_month) / parseFloat(Totalexcvol);
    var Wt_C = parseFloat(exc_C_avgtradevolumefor_month) / parseFloat(Totalexcvol);

    var exchange_A_ticker = await getspotprice(pair,'Bitstamp');
    var exchange_B_ticker = await getspotprice(pair,'Kraken');
    var exchange_C_ticker = await getspotprice(pair,'Coinbase');


    // console.log(exchange_A_ticker,'indexprice_calculation');
    // return false;
    // console.log(exchange_B_ticker,'ticker details');
    var exchange_A_spotprice = exchange_A_ticker?exchange_A_ticker.last:0;
    var exchange_B_spotprice = exchange_B_ticker?exchange_B_ticker.last:0;
    var exchange_C_spotprice = exchange_C_ticker?exchange_C_ticker.last:0;

    // console.log(exchange_A_spotprice,'A price');
    // console.log(exchange_B_spotprice,'B price');
    // console.log(exchange_C_spotprice,'C price');

    var total = Wt_A+Wt_B+Wt_C;
    var awei = (Wt_A/total)*100;
    var bwei = (Wt_B/total)*100;
    var cwei = (Wt_C/total)*100;

    var EBTC  =  parseFloat(awei/100) * parseFloat(exchange_A_spotprice) + parseFloat(bwei/100) * parseFloat(exchange_B_spotprice) + parseFloat(cwei/100) * parseFloat(exchange_C_spotprice);
    var pricespreadofA = Math.abs(parseFloat(exchange_A_spotprice) - parseFloat(EBTC));
    var pricespreadofB = Math.abs(parseFloat(exchange_B_spotprice) - parseFloat(EBTC));
    var pricespreadofC = Math.abs(parseFloat(exchange_C_spotprice) - parseFloat(EBTC));

    var asquare = 1/(parseFloat(pricespreadofA) * parseFloat(pricespreadofA));
    var bsquare = 1/(parseFloat(pricespreadofB) * parseFloat(pricespreadofB));
    var csquare = 1/(parseFloat(pricespreadofC) * parseFloat(pricespreadofC));
    var totalsquar = parseFloat(asquare) + parseFloat(bsquare) + parseFloat(csquare);
    var weight_A   =   parseFloat(asquare) / parseFloat(totalsquar);
    var weight_B   =   parseFloat(bsquare) / parseFloat(totalsquar);
    var weight_C   =   parseFloat(csquare) / parseFloat(totalsquar);

    var index_price  =  (parseFloat(weight_A) * parseFloat(exchange_A_spotprice)) + (parseFloat(weight_B) * parseFloat(exchange_B_spotprice)) + (parseFloat(weight_C) * parseFloat(exchange_C_spotprice))

      // console.log(index_price,'indexprice');
    var Interest_Quote_Index = 1/100;
    var Interest_Base_Index  = 0.25/100;
    var fundingrate          = (Interest_Quote_Index*Interest_Base_Index)/3;

    var timeuntillfunding    = 5;  //need to calculate
    var fundinbasis          = fundingrate * (timeuntillfunding/3);
    var mark_price           = index_price * (1 + fundinbasis);

    // console.log(mark_price,'mark price');
    var lastspot = await getlastspot(pair);

    if(typeof index_price != 'undefined' && typeof mark_price != 'undefined')
    {
      // console.log(mark_price,'mark_price')

        perpetual.findOneAndUpdate({tiker_root:pair},{"$set": {"markprice":mark_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1,_id:1,change:1} } ,function(pererr,perdata){
          var pricedata = perdata;
          var spotpairname = pair.replace("USD","USDT");
           spotpairs.findOneAndUpdate({tiker_root:spotpairname},{"$set": {"markprice":mark_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1,_id:1,change:1} } ,function(pererr1,perdata1){
           //var perdata = {"markprice":Math.floor(1000 + Math.random() * 9000),"last":1234,"tiker_root":"BTCUSD"};
          io.emit('PRICEDETAILS', (pair=='ETHBTC')?perdata1:pricedata);
          var perdata = (pair=='ETHBTC')?perdata1:pricedata;
          if(perdata)
          {
              var markprice = (mark_price)?mark_price:0;
              const newrecord = new spotPrices({
              "price"        : (mark_price)?mark_price:0,
              "pair"         : ObjectId(perdata._id),
              "pairname"     : pair,
              "createdAt"    : new Date(),
              });
              // console.log(lastspot.price,'lastspot')
              // console.log(markprice,'markprice')
              if(lastspot)
              {
                  var difference = Math.abs(parseFloat(lastspot.price)-parseFloat(markprice));
                  var percent = (parseFloat(difference)/parseFloat(lastspot.price))*100
              }

              if(markprice!=0 && markprice!='')
              {
                // console.log('insert')
                newrecord.save(function(err,data) {
                  // console.log(err,'err');
                  // console.log(data,'data');
                  setTimeout(function () {
                  stopordertrigger(mark_price,pair);
                  }, 5000);
                });
              }

          }
            });
            });
    }
    //here
    var Interest_Quote_Index = 1/100;
    var Interest_Base_Index  = 0.25/100;
    // var mark_price        = 9260

    var Interest_Rate        = ((Interest_Quote_Index-Interest_Base_Index)/3) * 100;

    // var imapactbidprice      = await getimpactbidprice('buy',pair);
    // var imapactaskprice      = await getimpactbidprice('sell',pair);

     var imapactbidprice      = await getspotprice(pair,'Coinbase');
    var imapactaskprice      = await getspotprice(pair,'Kraken');
    // console.log(imapactbidprice,'imapactbidprice'+pair);

    var exchange_A_ticker    = await getspotprice(pair,'Bitstamp');
    var exchange_A_spotprice = exchange_A_ticker?exchange_A_ticker.last:0;

    if(typeof imapactbidprice!='undefined')
    {
        imapactbidprice          = (imapactbidprice)?imapactbidprice.last:0;
        imapactaskprice          = (imapactaskprice)?imapactaskprice.last:0;

        // console.log(imapactbidprice,'imapactbidprice');
        // console.log(imapactaskprice,'imapactaskprice');

        var midprice          = Math.round((imapactbidprice+imapactaskprice)/2);

        // console.log(mark_price,'mark_price');
        // console.log(Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price)),'first');
        // console.log(Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice)),'second');
        // console.log(exchange_A_spotprice,'second');
        var first = Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price));
        var second = Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice));
        var premium_index     = (first -  second)/parseFloat(exchange_A_spotprice);

        // console.log(premium_index,'premium_index');

        var date              = new Date();
        var curhour           = date.getHours();
        var timeuntillfunding = (curhour>0 && curhour<8)?(8-curhour):(curhour>8 && curhour<16)?(16-curhour):(curhour>16 && curhour<24)?(24-curhour):0;

        // var fairbasis      = (parseFloat(midprice)/parseFloat(index_price)-1)/(30/365);
        var fairbasis         = fundingrate * (timeuntillfunding/3)
        // console.log(fairbasis,'fairbasis');
        premium_index         = (parseFloat(premium_index) + fundingrate);

        // console.log(parseFloat(premium_index),'premium_index');
        // console.log(Interest_Rate,'Interest_Rate');

        const clamp           = (min, max) => (value) =>
          value < min ? min : value > max ? max : value;
        // var Interest_Rate = 0.01;
        var cl = (Interest_Rate) - premium_index;
        var minusval = Math.min(Math.max(parseFloat(cl), -0.05), 0.05);
        // console.log(parseFloat(minusval),'minusval');
        var Funding_Rate      = parseFloat(premium_index) + parseFloat(minusval);
        // console.log(Funding_Rate,'Funding_Rate');
        if(typeof Funding_Rate != 'undefined' && typeof mark_price != 'undefined')
        {
            perpetual.findOneAndUpdate({tiker_root:pair},{"$set": {"funding_rate":Funding_Rate,"markprice":mark_price,"index_price":index_price} } , {new:true,"fields": {tiker_root:1,last:1,markprice:1} } ,function(pererr,perdata){
                // console.log(perdata);
            });
        }
    }


}
function updatefunction(payerid,receiverid,amount,firstCurrency,markprice,quantity,funding_rate,pairid,pairname)
{
  console.log('updatefunction')
  updatebaldata["balance"] = amount;
  console.log(amount);
  var order_value = parseFloat(quantity)/parseFloat(markprice);
    Assets.findOneAndUpdate({currencySymbol:firstCurrency,userId:ObjectId(receiverid)},{"$inc": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
      if(baldata)
      {
        const newrecord = new FundingHistory({
              "userId"      : receiverid,
              "pair"        : ObjectId(pairid),
              "pairname"    : pairname,
              "createdDate" : new Date(),
              "quantity"    : quantity,
              "price"       : markprice,
              "order_value" : order_value,
              "feerate"     : funding_rate/100,
              "feepaid"     : amount,
              "type"        : "received",
              });
          newrecord.save(function(err,data) {
            console.log(err,'err')
            console.log(data,'data')
          });
      }
    });

    Assets.findOneAndUpdate({currencySymbol:firstCurrency,userId:ObjectId(payerid),balance:{$gte:amount}},{"$dec": updatebaldata } , {new:true,"fields": {balance:1} } ,function(balerr,baldata){
      if(baldata){
         const newrecord = new FundingHistory({
              "userId"      : payerid,
              "pair"        : ObjectId(pairid),
              "pairname"    : pairname,
              "createdDate" : new Date(),
              "quantity"    : quantity,
              "price"       : markprice,
              "order_value" : order_value,
              "feerate"     : funding_rate/100,
              "feepaid"     : amount,
              "type"        : "paid",
              });
          newrecord.save(function(err,data) {
          });

      }
    });
}
async function calculatingfun(tradeDetails,pairDetails)
{
  console.log('calculatingfun')
    if(tradeDetails.length>0)
    {
      var buyuserIdarr  = [];
      var selluserIdarr = [];
      var sellIdarr     = [];
      var buyIdarr      = [];
      var pairarr       = [];
      for(var i=0; i<tradeDetails.length; i++)
      {
        var quantity      = tradeDetails[i].quantity;
        var price         = tradeDetails[i].price;
        var filled        = tradeDetails[i].filled;
        var leverage      = tradeDetails[i].leverage;
        var firstCurrency = tradeDetails[i].firstCurrency;
        if(filled)
        {
          for(var j=0; j<filled.length; j++)
          {
              var buyuserId          = filled[j].buyuserId;
              var selluserId         = filled[j].selluserId;
              var sellId             = filled[j].sellId;
              var buyId              = filled[j].buyId;
              var pair               = filled[j].pair;
              var pairname           = filled[j].pairname;
              var filledAmount       = filled[j].filledAmount;
              var Price              = filled[j].Price;
              var beforeBalance      = filled[j].beforeBalance;
              var afterBalance       = filled[j].afterBalance;

              if(sellIdarr.includes(sellId) && buyIdarr.includes(buyId) && pairarr.includes(pair) && buyuserIdarr.includes(buyuserId) && selluserIdarr.includes(selluserId))
              {
                continue;
              }
              else
              {
                  sellIdarr.push(sellId);
                  buyIdarr.push(buyId);
                  pairarr.push(pair);
                  buyuserIdarr.push(buyuserId);
                  selluserIdarr.push(selluserId);
                  var index = pairDetails.findIndex(x => (x.tiker_root) === pairname);
                  var btcindex = pairDetails.findIndex(x => (x.tiker_root) === 'BTCUSD');
                  if(index!=-1)
                  {
                    var markprice      = pairDetails[index].markprice;
                    var funding_rate   = pairDetails[index].funding_rate;
                    var position_value = quantity / markprice;
                    var fundingamount  = position_value * (funding_rate/100);
                    if(funding_rate>=0)
                    {
                        await updatefunction(buyuserId,selluserId,fundingamount,firstCurrency,markprice,quantity,funding_rate,pairDetails._id,pairname);
                    }
                    else
                    {
                        await updatefunction(selluserId,buyuserId,fundingamount,firstCurrency,markprice,quantity,funding_rate,pairDetails._id,pairname);
                    }
                  }

              }


          }

        }
      }
    }
}
async function fundingAmount()
{
    console.log('funding amourn');
    perpetual.find({},{tiker_root:1,funding_rate:1,markprice:1}).
    exec(function (pairerr, pairDetails) {
        if(pairDetails)
        {
            tradeTable.find({'$or' : [{"status" : '1'},{"status" : '2'}],'filled.position_status':'1'}).exec(function (err, tradeDetails) {
              console.log(tradeDetails,'tradeDetails')
                calculatingfun(tradeDetails,pairDetails);
            });
        }
    });
}

router.get('/counttest', (req, res) => {
  exchangePrices.find().count(function(err,data) {
            if (err) {
                console.log(err)
            } else {
                res.end('success'+data);
            }
        }
    );
});
router.get('/apitest', (req, res) => {

   // tradeTable.findOneAndUpdate({"filled.position_status":'1',"filled.forced_liquidation":false,"filled.user_id":ObjectId("5e9a9d84daf0990cc5e26096")},{"$set": {"filled.$.position_status":'0',forced_liquidation:true} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){
   //  console.log(userdat1a,'userdat1a');
   // });

// Assets.updateMany({currencySymbol:"BTC"},{"$set": {tempcurrency:25} } , {new:true,"fields": {exchangename:1} } ,function(balerr,baldata){
//   res.json({status:true})
//             // console.log(balancerr,'balerr');
//             // console.log(baldata,'baldata');
//           });
  // var json = {'filled.$.position_status':'5'};
  //   tradeTable.findOneAndUpdate({'filled.uniqueid':'335659933'},{ "$set": json},{new:true,"fields": {filled:1} },function(selltemp_err,selltempData){
  //     console.log(selltemp_err,'selltemp_err')
  //     console.log(selltempData,'sellteselltempDatamp_err')
  //   });

  // console.log(ObjectId(),'id');
  // forced_liquidation('BTCUSD');
//  var  userId = ObjectId("5e8487ed116cb20dec7466fd");
//  var firstCurrency = 'BTC';
//  var secondCurrency = 'USD';
// getusertradedata(userId,firstCurrency,secondCurrency)
  // socketio.sockets.in("5e8487ed116cb20dec7466fd").emit('TRADE',{"test":"test"});
   // async.parallel({
   //    position_details : function(cb) {
   //      var pair = 'BTCUSD';
   //        tradeTable.aggregate([
   //        { "$match": { status:'1',position_status:'1',"pairName": pair,userId:{$ne:ObjectId("5e567694b912240c7f0e4299")} } },
   //        {$unwind:"$filled"},
   //        { "$match": { 'filled.position_status':'1'} },
   //        {$project:{"filled":1,leverage:1,userId:1}},
   //       { "$group": { "_id": "$userId","price" :{ "$avg": "$filled.Price" },"quantity" :{ "$sum": "$filled.filledAmount" },"pairName" :{ "$first": "$filled.pairname" },"leverage" :{ "$first": "$leverage" } } }
   //        ]).exec(cb)
   //    },

   //  },(err,results) => {
   //    console.log(results)
   //  })

  // forced_liquidation('BTCUSD');
//    spotPrices.remove({createdAt:{$lte:Date("2020-05-18 08:18:09.059Z")}}, function(err,result) {
//     if (!err) {
//             res.send("success");
//     }
//     else {
//
//             res.send(err);
//     }
// });
spotPrices.remove(
  { createdAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
  function (err, result) {
    if (!err) {
      // res.send("success");
      console.log("succes on spotremoveal");
    } else {
      res.send(err);
    }
  }
);
  // exchangePrices.find({})
  //           .skip(10000)
  //           .sort({createdAt: 'desc'})
  //           .exec(function(err, result) {
  //           if (err) {
  //             next(err);
  //             console.log(err,'error');
  //           }
  //           if (result) {
  //             // console.log(result);
  //             result.forEach( function (doc) {
  //                doc.remove();
  //              });
  //           }
  //         });
  // exchangePrices.find().count(function(err,data) {
  //           if (err) {
  //               console.log(err)
  //           } else {
  //               res.end('success'+data);
  //           }
  //       }
  //   );
// console.log('sdjfsjdflsjdf');
//   var sDate =  "1970-01-01 00:00:0.000Z";
//   var eDate = "2020-03-09 05:21:16.843Z";
//   tradeTable.aggregate([
//       {
//         $unwind : '$filled'
//       },
//       {
//       $match : {
//           "filled.created_at": {
//           // "$gte": new Date(sDate),
//            "$lt": new Date(eDate)
//          },
//           }
//       },
//   ]).exec(function(err,result){
//   console.log(err);
//   console.log(result);
//   });
//   perpetual.find({},{tiker_root:1,maint_margin:1,first_currency:1,second_currency:1},function(err,contractdetails){
//
//  }).then((contractdetails)=> {
//
// // processUsers(contractdetails,'Bitstamp');
// processUsers(contractdetails,'Kraken');
// // processUsers(contractdetails,'Coinbasepro');
// // processUsers(contractdetails,'Gemini');
//   });

});

router.get('/markets', (req,res) => {
  perpetual.aggregate([
     {
      $project : {
        _id : 0,
        name : "$tiker_root",
        type : "crypto",
        exchange : "Alwin",
      }
    }
    ]).exec(function(err,pairdata){
    res.json(pairdata);
  });
});

router.get('/chart/:config', (request,response) => {
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

router.get('/chartData', (req,res) =>{
// console.log('callhere chart');
  var url              = require('url');
  var url_parts        = url.parse(req.url, true);
  var query            = url_parts.query;


  var pair       = req.query.market;
  var start_date = req.query.start_date;
  var end_date   = req.query.end_date;
  var resol      = req.query.resolution;
  var spl        = pair.split("_");
  var first      = spl[0];
  var second     = spl[1];
  var pattern    = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
  var _trProject;
  var _trGroup;
  var _exProject;
  var _exGroup;
  if(start_date)
  {
    if(!pattern.test(start_date))
    {
        res.json({"message" : "Start date is not a valid format"});
        return false;
    }
  }
  else
  {
        res.json({"message" : "Start date parameter not found"});
        return false;
  }
  if(end_date)
  {
    if(!pattern.test(end_date))
    {
        res.json({"message" : "End date is not a valid format"});
        return false;
    }
  }
  else
  {
        res.json({"message" : "End date parameter not found"});
        return false;
  }
    charts.findOne({type:resol,pairname:pair}).exec(function(err,result){
      if(result)
      {
       res.json(result.data);
      }
      else
      {
       res.json([]);
      }
    });

});

router.get('/chartData1', (req,res) =>{
// console.log('callhere chart');
  var url              = require('url');
  var url_parts        = url.parse(req.url, true);
  var query            = url_parts.query;

  var pair       = req.query.market;
  var start_date = req.query.start_date;
  var end_date   = req.query.end_date;
  var resol      = req.query.resolution;
  var spl        = pair.split("_");
  var first      = spl[0];
  var second     = spl[1];
  var pattern    = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
  var _trProject;
  var _trGroup;
  var _exProject;
  var _exGroup;
  if(start_date)
  {
    if(!pattern.test(start_date))
    {
        res.json({"message" : "Start date is not a valid format"});
        return false;
    }
  }
  else
  {
        res.json({"message" : "Start date parameter not found"});
        return false;
  }
  if(end_date)
  {
    if(!pattern.test(end_date))
    {
        res.json({"message" : "End date is not a valid format"});
        return false;
    }
  }
  else
  {
        res.json({"message" : "End date parameter not found"});
        return false;
  }
    var sDate = start_date+' 00:00:0.000Z';
    var eDate = end_date+' 00:00:0.000Z';

    // console.log(start_date,'start_date');
    // console.log(end_date,'end_date');

    // console.log(sDate,'start_date');
    // console.log(eDate,'end_date');
    if(sDate > eDate){
      res.json({"message" : "Please ensure that the End Date is greater than or equal to the Start Date"});
     }
    // perpetual.find({tiker_root:pair}).select("_id").select("tiker_root").exec(function(err,pairdata){
      try
      {
        // if(pairdata.length > 0)
        // {
        //   var pairId   = pairdata[0]._id;
        //   var pairname = pairdata[0].tiker_root;
          // console.log(pairname);
          var limits ;
                  var project = {Date : "$Date",pair : "$pair",low : "$low",high : "$high",open : "$open",close : "$close",volume : "$volume",exchange : "Trading"};


              if(resol)
              {
                if(resol!=1 && resol!=5 && resol!=15 && resol!=30 && resol!=60 && resol!='1d' && resol!='2d' && resol!='3d' && resol!='d' && resol!='1w' && resol!='3w' && resol!='m' && resol!='6m')
                {
                  res.json({"message" : "Resolution value is not valid"});
                  return false;
                }
                else
                {
                 if(resol == '1d'){
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
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairname",
                      modifiedDate : '$createdAt',
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
                                         {$subtract:
                                         [
                                            {$minute: "$modifiedDate"},
                                            {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                         ]},
                                         +resol
                                      ]
                            }
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }

                    }

                  }
                  else if(resol == 'd')
                  {
                    _trProject = {
                         "week": { "$week": "$createdAt" },
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : '$pairname',
                        modifiedDate : '$createdAt',
                    }
                    _trGroup = {
                      "_id": {
                          "week": "$week",
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }
                    }

                    resol = 10080;
                  }
                  else if(resol == '1m')
                  {

                      _trProject = {
                      "month": { "$month": "$createdAt" },
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairname",
                      modifiedDate : '$createdAt',
                      }
                      _trGroup = {
                        "_id": {
                            "month": "$month",
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pairname' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }
                      }

                      resol = 43200;
                  }
                  else if(resol == 1)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 5)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 5] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 30)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 30] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 60)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 15)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 15] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                           {$subtract:
                                           [
                                              {$minute: "$modifiedDate"},
                                              {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                           ]},

                                        ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }

                  }
                }
              }
              // console.log(end_date,'eDate');
              console.log(moment(end_date).add(1, 'days'),'eDate');
              // console.log(moment(start_date).format(),'sDate');
               spotPrices.aggregate([
                {
                  $match : {
                    "pairname": pair,
                    "createdAt": {
                       "$lt": new Date(moment(end_date).add('1 days')),
                      "$gte": new Date(moment(start_date).format())
                     },
                  }
                },
                // {$limit: 500000},
                {
                  $project : _trProject
                },
                {
                  "$group": _trGroup
              },
               {
                  $project : project,
                },
                {
                  $sort: {
                    "Date": 1,

                  }
                },
                // {
                //                      allowDiskUse: true
                //                    },
              ]).exec(function(err,result){
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
      catch (e)
      {
        console.log("no pair",e);
      }
      // console.log(pairdata);
    // });

});


cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','BTCUSD');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','ETHUSD');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','LTCUSD');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','BCHUSD');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','XRPUSD');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartupdate('5','ETHBTC');
});
cron.schedule("*/5 * * * *", (req, res) => {
  chartupdate("5", "XRPBTC");
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartspotupdate('5','💲PCUSDT');
});
cron.schedule('*/5 * * * *', (req,res) => {
  chartspotupdate('5','💲PCBTC');
});

cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','BTCUSD');
});
cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','ETHUSD');
});
cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','BCHUSD');
});
cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','LTCUSD');
});
cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','XRPUSD');
});
cron.schedule('* * * * *', (req,res) => {
  chartupdate('1','ETHBTC');
});

cron.schedule('* * * * *', (req,res) => {
  chartspotupdate('1','💲PCUSDT');
});

cron.schedule('* * * * *', (req,res) => {
  chartspotupdate('1','💲PCBTC');
});

cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','BTCUSD');
});
cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','ETHUSD');
});
cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','BCHUSD');
});
cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','LTCUSD');
});
cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','XRPUSD');
});
cron.schedule('*/15 * * * *', (req,res) => {
  chartupdate('15','ETHBTC');
});

cron.schedule('*/15 * * * *', (req,res) => {
  chartspotupdate('15','💲PCUSDT');
});

cron.schedule('*/15 * * * *', (req,res) => {
  chartspotupdate('15','💲PCBTC');
});

cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','BTCUSD');
});
cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','ETHUSD');
});
cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','BCHUSD');
});
cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','LTCUSD');
  });
cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','XRPUSD');
});
cron.schedule('0 * * * *', (req,res) => {
  chartupdate('60','ETHBTC');
});

cron.schedule('0 * * * *', (req,res) => {
  chartspotupdate('60','💲PCBTC');
});

cron.schedule('0 * * * *', (req,res) => {
  chartspotupdate('60','💲PCUSDT');
});


cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','BTCUSD');
});
cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','ETHUSD');
});
cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','BCHUSD');
})
cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','LTCUSD');
});
cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','XRPUSD');
});
cron.schedule('0 0 * * *', (req,res) => {
  chartupdate('1d','ETHBTC');
});

cron.schedule('0 0 * * *', (req,res) => {
  chartspotupdate('1d','💲PCUSDT');
});

cron.schedule('0 0 * * *', (req,res) => {
  chartspotupdate('1d','💲PCBTC');
});

cron.schedule('0 0 * * *', (req,res) => {
  chartspotupdate('1d','XRPBTC');
});

function chartspotupdate(resol,pair)
{

      try
      {

          var limits ;
                  var project = {Date : "$Date",pair : "$pair",low : "$low",high : "$high",open : "$open",close : "$close",volume : "$volume",exchange : "Trading"};


              if(resol)
              {
                var restype = resol;
                if(resol!=1 && resol!=5 && resol!=15 && resol!=30 && resol!=60 && resol!='1d' && resol!='2d' && resol!='3d' && resol!='d' && resol!='1w' && resol!='3w' && resol!='m' && resol!='6m')
                {
                  res.json({"message" : "Resolution value is not valid"});
                  return false;
                }
                else
                {
                 if(resol == '1d'){
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
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairName",
                      modifiedDate : '$orderDate',
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
                                         {$subtract:
                                         [
                                            {$minute: "$modifiedDate"},
                                            {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                         ]},
                                         +resol
                                      ]
                            }
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }

                    }

                  }
                  else if(resol == 'd')
                  {
                    _trProject = {
                         "week": { "$week": "$orderDate" },
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : '$pairName',
                        modifiedDate : '$orderDate',
                    }
                    _trGroup = {
                      "_id": {
                          "week": "$week",
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }
                    }

                    resol = 10080;
                  }
                  else if(resol == 'm')
                  {

                      _trProject = {
                      "month": { "$month": "$orderDate" },
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairName",
                      modifiedDate : '$orderDate',
                      }
                      _trGroup = {
                        "_id": {
                            "month": "$month",
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pairName' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }
                      }

                      resol = 43200;
                  }
                  else if(resol == 1)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairName",
                        modifiedDate : '$orderDate',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 5)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "pairName",
                        modifiedDate : '$orderDate',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 5] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 30)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairName",
                        modifiedDate : '$orderDate',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 30] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 60)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairName",
                        modifiedDate : '$orderDate',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 15)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairName",
                        modifiedDate : '$orderDate',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 15] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairName",
                        modifiedDate : '$orderDate',
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
                                           {$subtract:
                                           [
                                              {$minute: "$modifiedDate"},
                                              {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                           ]},

                                        ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }

                  }
                }
              }
              // console.log(end_date,'eDate');
              // console.log(moment(end_date).add(1, 'days'),'eDate');

            var d1 = new Date ();
            var d2 = new Date ( d1 );
            d2.setMinutes ( d1.getMinutes() - parseFloat(restype) );
            // console.log(d2)
            // console.log(d1)
              // console.log(moment(start_date).format(),'sDate');
               spottradeTable.aggregate([
                {
                  $match : {
                    "pairName": pair,
                    "orderDate": {
                       "$lt": new Date(),
                      "$gte": d2
                     },
                  }
                },
                // {$limit: 500000},
                {
                  $project : _trProject
                },
                {
                  "$group": _trGroup
              },
               {
                  $project : project,
                },
                {
                  $sort: {
                    "Date": 1,

                  }
                },

              ]).exec(function(err,result){
                // console.log(err,'err')
                // console.log(result,'chartresut')
                charts.update(
                { type: restype,pairname: pair },
                { $addToSet: { data: result } },function(err,ress){
                  // console.log(err)
                  // console.log(ress)
                });
              });


      }
      catch (e)
      {
        console.log("no pair",e);
      }

}

function chartupdate(resol,pair)
{

      try
      {

          var limits ;
                  var project = {Date : "$Date",pair : "$pair",low : "$low",high : "$high",open : "$open",close : "$close",volume : "$volume",exchange : "Trading"};


              if(resol)
              {
                var restype = resol;
                if(resol!=1 && resol!=5 && resol!=15 && resol!=30 && resol!=60 && resol!='1d' && resol!='2d' && resol!='3d' && resol!='d' && resol!='1w' && resol!='3w' && resol!='m' && resol!='6m')
                {
                  res.json({"message" : "Resolution value is not valid"});
                  return false;
                }
                else
                {
                 if(resol == '1d'){
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
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairname",
                      modifiedDate : '$createdAt',
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
                                         {$subtract:
                                         [
                                            {$minute: "$modifiedDate"},
                                            {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                         ]},
                                         +resol
                                      ]
                            }
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }

                    }

                  }
                  else if(resol == 'd')
                  {
                    _trProject = {
                         "week": { "$week": "$createdAt" },
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : '$pairname',
                        modifiedDate : '$createdAt',
                    }
                    _trGroup = {
                      "_id": {
                          "week": "$week",
                          },
                        count: {
                          "$sum": 1
                      },
                      Date : { $last : "$modifiedDate" },
                      pair : { $first : '$pair' },
                      low : { $min : '$price' },
                      high : { $max : '$price' },
                      open : { $first : '$price' },
                      close : { $last : '$price' } ,
                      volume : { $sum : '$filledAmount' }
                    }

                    resol = 10080;
                  }
                  else if(resol == 'm')
                  {

                      _trProject = {
                      "month": { "$month": "$createdAt" },
                      "filledAmount" : 1,
                      "price" : 1,
                      pair : "$pairname",
                      modifiedDate : '$createdAt',
                      }
                      _trGroup = {
                        "_id": {
                            "month": "$month",
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pairname' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }
                      }

                      resol = 43200;
                  }
                  else if(resol == 1)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 5)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 5] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 30)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 30] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 60)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else if(resol == 15)
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                  { "$mod": [{ "$minute": "$modifiedDate"}, 15] }
                                ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }
                  }
                  else
                  {
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
                        "filledAmount" : 1,
                        "price" : 1,
                        pair : "$pairname",
                        modifiedDate : '$createdAt',
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
                                           {$subtract:
                                           [
                                              {$minute: "$modifiedDate"},
                                              {$mod: [{$minute: "$modifiedDate"}, +resol]}
                                           ]},

                                        ]
                              }
                            },
                          count: {
                            "$sum": 1
                        },
                        Date : { $last : "$modifiedDate" },
                        pair : { $first : '$pair' },
                        low : { $min : '$price' },
                        high : { $max : '$price' },
                        open : { $first : '$price' },
                        close : { $last : '$price' } ,
                        volume : { $sum : '$filledAmount' }

                      }

                  }
                }
              }
              // console.log(end_date,'eDate');
              // console.log(moment(end_date).add(1, 'days'),'eDate');

            var d1 = new Date ();
            var d2 = new Date ( d1 );
            d2.setMinutes ( d1.getMinutes() - parseFloat(restype) );
            // console.log(d2)
            // console.log(d1)
              // console.log(moment(start_date).format(),'sDate');
               spotPrices.aggregate([
                {
                  $match : {
                    "pairname": pair,
                    "createdAt": {
                       "$lt": new Date(),
                      "$gte": d2
                     },
                  }
                },
                // {$limit: 500000},
                {
                  $project : _trProject
                },
                {
                  "$group": _trGroup
              },
               {
                  $project : project,
                },
                {
                  $sort: {
                    "Date": 1,

                  }
                },

              ]).exec(function(err,result){

                charts.update(
                { type: restype,pairname: pair },
                { $addToSet: { data: result } },function(err,ress){
                  // console.log(err)
                  // console.log(ress)
                });
              });


      }
      catch (e)
      {
        console.log("no pair",e);
      }

}


module.exports = router;
