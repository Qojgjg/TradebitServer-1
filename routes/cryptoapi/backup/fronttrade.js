const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const async = require("async");
const validateTradeInput = require("../../validation/frontend/trade");
const validatemobRegisterInput = require("../../validation/frontend/mobregister");
const validateLoginInput = require("../../validation/login");
const validatemobLoginInput = require("../../validation/moblogin");
const validateUpdateUserInput = require("../../validation/frontend/updateUser");
// const validateEmailtemplateInput = require("../../validation/emailtemplate");
const validateForgotInput = require("../../validation/forgot");
const validateCmsInput = require("../../validation/cms");
const validateFaqInput = require("../../validation/faq");
const validateUpdateSettingsInput = require("../../validation/settings");
const validateResetInput = require("../../validation/frontend/resetpassword");
const validatetfaInput = require("../../validation/frontend/tfainput");
const validateContactInput = require("../../validation/frontend/contact_us");
const tradeTable = require("../../models/tradeTable");
const spottradeTable = require("../../models/spottradeTable");
const charts = require("../../models/Chart");
const Bonus = require("../../models/Bonus");
const Assets = require("../../models/Assets");
const position_table = require("../../models/position_table");
const currency = require("../../models/currency");
const User = require("../../models/User");
const FundingHistory = require("../../models/FundingHistory");
const InterestHistory = require("../../models/InterestHistory");
const Emailtemplates = require("../../models/emailtemplate");
const exchangePrices = require("../../models/exchangePrices");
const spotPrices = require("../../models/spotPrices");
const spotpairs = require("../../models/spotpairs");
const FeeTable = require("../../models/FeeTable");
const multer = require("multer");
var node2fa = require("node-2fa");
var CryptoJS = require("crypto-js");
var moment = require("moment");
var Coinpayments = require("coinpayments");
const perpetual = require("../../models/perpetual");
const cryptoRandomString = require("crypto-random-string");
const nodemailer = require("nodemailer");
var fs = require("fs");
const client = require("twilio")(
  keys.TWILIO_ACCOUT_SID,
  keys.TWILIO_AUTH_TOKEN
);
const mongoose = require("mongoose");
const url = require("url");
const ObjectId = mongoose.Types.ObjectId;
var symbolsDatabase = require("../symbols_database"),
  RequestProcessor = require("../request-processor").RequestProcessor;
var requestProcessor = new RequestProcessor(symbolsDatabase);
var schedule = require("node-schedule");

var cron = require("node-cron");

var request = require("request");
const events = require('events');
const eventEmitter = new events.EventEmitter();
var syncEach = require('sync-each');

const rp = require("request-promise");
const perf = require("execution-time")();
var tradeinfo = [];
const userinfo = [];

const WebSocket = require("ws");

var clientsss = new Coinpayments(keys.coinPayment);

const binanceHelper = require('../helper/binanceHelper')

var openWebSocket = function () {
  const ws = new WebSocket(
    "wss://streamer.cryptocompare.com/v2?api_key=" + keys.cryptoCompare.key1
  );

  ws.on("message", function incoming(data) {
    // //console.log("---message")
    ////console.log(JSON.parse(data), 'data');
    var result = JSON.parse(data);
    if (result.TYPE == "2") {
      var price = result.PRICE ? result.PRICE : 0;
      // //console.log(price,'price')
      // //console.log(result.MARKET,'MARKET')
      if (price != 0 && price != "") {
        var updatedata = {
          last: price,
        };

        var pairname =
          result.FROMSYMBOL == "BTC"
            ? "BTCUSD"
            : result.FROMSYMBOL == "LTC"
              ? "LTCUSD"
              : result.FROMSYMBOL == "ETH"
                ? "ETHUSD"
                : result.FROMSYMBOL == "BCH"
                  ? "BCHUSD"
                  : result.FROMSYMBOL == "XRP"
                    ? "XRPUSD"
                    : "";
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "ETH") {
          pairname = "ETHBTC";
        }
        if (result.TOSYMBOL == "ETH" && result.FROMSYMBOL == "BTC") {
          pairname = "BTCETH";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "DASH") {
          pairname = "DASHBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "TRX") {
          pairname = "TRXBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "XMR") {
          pairname = "XMRBTC";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "XMR") {
          pairname = "XMRUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "DASH") {
          pairname = "DASHUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "TRX") {
          pairname = "TRXUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "TMR") {
          pairname = "TMRUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "XMR") {
          pairname = "XMRUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "TRX") {
          pairname = "TRXUSD";
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "BNB") {
          pairname = "BNBUSD";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "BNB") {
          pairname = "BNBBTC";
        }

        // updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
        //
        // exchangePrices.findOneAndUpdate(
        //   { exchangename: result.MARKET, pairname: pairname },
        //   { $set: updatedata, $inc: updatebaldata },
        //   { new: true, fields: { exchangename: 1 } },
        //   function (balerr, baldata) {
        //     // //console.log(balancerr,'balerr');
        //     // //console.log(baldata,'baldata');
        //   }    );

        // exchangePrices
        //   .find({ pairname: pairname, exchangename: result.MARKET })
        //     .exec(function (err, findresult) {
        //     if (findresult) {
        //       if(findresult.length==0){
        //              const newexchange = new exchangePrices({
        //         pairname: pairname,
        //         exchangename: result.MARKET
        //       });
        //       newexchange.save().then((result) => {
        //         //console.log("Saveddsa", result);
        //       });
        //     }else{
        //       updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
        //       exchangePrices.findOneAndUpdate(
        //         { exchangename: result.MARKET, pairname: pairname },
        //         { $set: updatedata, $inc: updatebaldata },
        //         { new: true },
        //         function (balerr, baldata) {
        //           //console.log("updated exchange pricesx");
        //
        //         }
        //       );
        //     }
        //     }
        //
        //   });
        if (pairname == "DASHBTC" || pairname == "TRXBTC" || pairname == "XMRBTC" || pairname == "DASHUSD" ||
          pairname == "TRXUSD" || pairname == "XMRUSD" || pairname == "TRXUSD") {
          // //console.log("resultsss",result);
          exchangePrices
            .find({ pairname: pairname, exchangename: result.MARKET })
            .exec(function (err, findresult) {
              if (findresult) {
                if (findresult.length == 0) {
                  const newexchange = new exchangePrices({
                    pairname: pairname,
                    exchangename: result.MARKET
                  });
                  newexchange.save().then((result) => {
                    // //console.log("Saveddsa", result);
                  });
                } else {
                  updatelowdata = {

                  }
                  updatebaldata = {
                    last: price,
                    //   low:result.LOW24HOUR?result.LOW24HOUR:0,
                    // high:result.HIGH24HOUR?result.HIGH24HOUR:0
                  };
                  updatevol = {
                    volume: result.LASTVOLUME ? result.LASTVOLUME : 0,
                  }
                  exchangePrices.findOneAndUpdate(
                    { exchangename: result.MARKET, pairname: pairname },
                    { $set: updatebaldata, $inc: updatevol },
                    { new: true },
                    function (balerr, baldata) {
                      // //console.log("updated exchange pricesx",baldata);

                    }
                  );
                }
              }

            });
        } else {
          exchangePrices
            .find({ pairname: pairname, exchangename: result.MARKET })
            .exec(function (err, findresult) {
              if (findresult) {
                if (findresult.length == 0) {
                  const newexchange = new exchangePrices({
                    pairname: pairname,
                    exchangename: result.MARKET
                  });
                  newexchange.save().then((result) => {
                    //console.log("Saveddsa", result);
                  });
                } else {
                  updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
                  exchangePrices.findOneAndUpdate(
                    { exchangename: result.MARKET, pairname: pairname },
                    { $set: updatedata, $inc: updatebaldata },
                    { new: true },
                    function (balerr, baldata) {
                      // //console.log("updated exchange pricesx");

                    }
                  );
                }
              }

            });

        }



      }
    }
  });

  ws.on("open", function open() {
    // //console.log("---OPEN")
    ws.send(
      JSON.stringify({
        action: "SubAdd",
        subs: [
          "2~Bitstamp~BTC~USD",
          "2~Bitstamp~ETH~USD",
          "2~Bitstamp~LTC~USD",
          "2~Bitstamp~BCH~USD",
          "2~Bitstamp~XRP~USD",
          "2~Bitstamp~BTC~ETH",

          "2~Kraken~BTC~USD",
          "2~Kraken~ETH~USD",
          "2~Kraken~LTC~USD",
          "2~Kraken~BCH~USD",
          "2~Kraken~XRP~USD",
          "2~Kraken~BTC~ETH",


          "2~Coinbase~BTC~USD",
          "2~Coinbase~ETH~USD",
          "2~Coinbase~LTC~USD",
          "2~Coinbase~BCH~USD",
          "2~Coinbase~XRP~USD",
          "2~Kraken~BTC~ETH",

        ],
      })
    );
  });
  ws.on("close", function () {
    // //console.log("disconnected");
    openWebSocket();
  });
  ws.on("error", function (err) {
    // //console.log("WEB SOCKET ERROR", err)
  })
};

var openWebSockettwo = function () {
  const wstwo = new WebSocket(
    "wss://streamer.cryptocompare.com/v2?api_key=" + keys.cryptoCompare.key2
  );

  wstwo.on("message", function incoming(data) {
    // //console.log(JSON.parse(data),'second ssdata');
    // var result = JSON.parse(data);
    var result = JSON.parse(data);

    if (result.TYPE == "2") {
      var price = result.PRICE ? result.PRICE : 0;
      var pairname = "";

      // var pairname =
      // result.FROMSYMBOL == "BTC"
      //   ? "BTCUSD"
      //   : result.FROMSYMBOL == "LTC"
      //   ? "LTCUSD"
      //   : result.FROMSYMBOL == "ETH"
      //   ? "ETHUSD"
      //   : result.FROMSYMBOL == "BCH"
      //   ? "BCHUSD"
      //   : result.FROMSYMBOL == "XRP"
      //   ? "XRPUSD"
      //   : "";
      var updatedata = {
        last: price,
      };
      // //console.log(price,'price')
      // //console.log(result.MARKET,'MARKET')
      if (price != 0 && price != "") {
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "BTC") {
          pairname = "BTCUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "ETH") {
          pairname = "ETHUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "LTC") {
          pairname = "LTCUSD";
        }
        if (result.TOSYMBOL == "USD" && result.FROMSYMBOL == "BCH") {
          pairname = "BCHUSD";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "ETH") {
          pairname = "ETHBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "LTC") {
          pairname = "LTCBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "BCH") {
          pairname = "BCHBTC";
        }
        if (result.TOSYMBOL == "BTC" && result.FROMSYMBOL == "BNB") {
          pairname = "BNBBTC";
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "BNB") {
          pairname = "BNBUSDT";
        }
        // if(pairname=="BNBUSDT"){
        //           //console.log("result", result);

        // }
        // //console.log("Pairname", pairname);
        // //console.log("marketname",result.MARKET)

        exchangePrices
          .find({ pairname: pairname, exchangename: result.MARKET })
          .exec(function (err, findresult) {
            if (findresult) {
              if (findresult.length == 0) {
                const newexchange = new exchangePrices({
                  pairname: pairname,
                  exchangename: result.MARKET
                });
                newexchange.save().then((result) => {
                  //console.log("Saveddsa", result);
                });
              } else {
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


        // updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
        // exchangePrices.findOneAndUpdate(
        //   { exchangename: result.MARKET, pairname: pairname },
        //   { $set: updatedata, $inc: updatebaldata },
        //   { new: true },
        //   function (balerr, baldata) {
        //     // //console.log(balerr,'balerr');
        //     // //console.log(baldata,'baldata');
        //   }
        // );
      }
    }
  });
  wstwo.on("open", function open() {
    wstwo.send(
      JSON.stringify({
        action: "SubAdd",
        subs: [
          "2~Bitstamp~ETH~BTC",
          "2~Bitstamp~LTC~BTC",
          "2~Bitstamp~XRP~BTC",
          "2~Bitstamp~BCH~BTC",
          "2~Bitstamp~BTC~USD",
          "2~Bitstamp~ETH~USD",
          "2~Bitstamp~LTC~USD",
          "2~Bitstamp~XRP~USD",
          "2~Bitstamp~BCH~USD",

          "2~Kraken~ETH~BTC",
          "2~Kraken~LTC~BTC",
          "2~Kraken~XRP~BTC",
          "2~Kraken~BCH~BTC",
          "2~Kraken~BTC~USD",
          "2~Kraken~ETH~USD",
          "2~Kraken~LTC~USD",
          "2~Kraken~XRP~USD",
          "2~Kraken~BCH~USD",

          "2~Coinbase~ETH~BTC",
          "2~Coinbase~LTC~BTC",
          "2~Coinbase~XRP~BTC",
          "2~Coinbase~BCH~BTC",
          "2~Coinbase~BTC~USD",
          "2~Coinbase~ETH~USD",
          "2~Coinbase~LTC~USD",
          "2~Coinbase~XRP~USD",
          "2~Coinbase~BCH~USD",
        ],
      })
    );
  });
  wstwo.on("close", function () {
    // //console.log("disconnected from wwebsocket 222");
    openWebSockettwo();
  });
  ws.on("error", function () {

  })
};


var openWebSocketThree = function () {
  const wsthree = new WebSocket(
    "wss://streamer.cryptocompare.com/v2?api_key=" + keys.cryptoCompare.key3
  );
  //
  // wsthree.on("message", function incoming(data) {
  //   // //console.log(JSON.parse(data),'Thriidss ssdata');
  //   var result = JSON.parse(data);
  //
  //   if (result.TYPE == "2") {
  //     var price = result.PRICE ? result.PRICE : 0;
  //     var pairname = "";
  //
  //     // var pairname =
  //     // result.FROMSYMBOL == "BTC"
  //     //   ? "BTCUSD"
  //     //   : result.FROMSYMBOL == "LTC"
  //     //   ? "LTCUSD"
  //     //   : result.FROMSYMBOL == "ETH"
  //     //   ? "ETHUSD"
  //     //   : result.FROMSYMBOL == "BCH"
  //     //   ? "BCHUSD"
  //     //   : result.FROMSYMBOL == "XRP"
  //     //   ? "XRPUSD"
  //     //   : "";
  //     var updatedata = {
  //       last: price,
  //     };
  //     // //console.log(price,'price')
  //     // //console.log(result.MARKET,'MARKET')
  //     if (price != 0 && price != "") {
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "BTC") {
  //         pairname = "BTCBUSD";
  //       }
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "ETH") {
  //         pairname = "ETHBUSD";
  //       }
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "XRP") {
  //         pairname = "XRPBUSD";
  //       }
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "LTC") {
  //         pairname = "LTCBUSD";
  //       }
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "BCH") {
  //         pairname = "BCHBUSD";
  //       }
  //
  //       if (result.TOSYMBOL == "BUSD" && result.FROMSYMBOL == "XRP") {
  //         pairname = "XRPBUSD";
  //       }
  //
  //
  //       // //console.log("Pairname", pairname);
  //       // //console.log("marketname",result.MARKET)
  //
  //       // exchangePrices
  //       //   .find({ pairname: pairname, exchangename: result.MARKET })
  //       //   // .then((findresult) => {
  //       //     .exec(function (err, findresult) {
  //       //     if (findresult) {
  //       //       //console.log("Already saved",findresult);
  //       //       if(findresult.length==0){
  //       //              const newexchange = new exchangePrices({
  //       //         pairname: pairname,
  //       //         exchangename: result.MARKET
  //       //       });
  //       //       newexchange.save().then((result) => {
  //       //         //console.log("Saveddsa", result);
  //       //       });
  //       //       }
  //       //     }
  //
  //       //   });
  //
  //
  //
  //       updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
  //       updatebalance={
  //         markprice: result.PRICE
  //       }
  //       spotpairs.findOneAndUpdate(
  //         { tiker_root: pairname },
  //         { $set: updatebalance },
  //         {
  //           new: true,
  //         },
  //         function (pererr1, perdata1) {
  //           if(perdata1)
  //           {
  //           socketio.emit("PRICEDETAILS", perdata1);
  //           // //console.log("perdata1",perdata1)
  //
  //                 const newrecord = new spotPrices({
  //                   price: result.PRICE,
  //                   pair: ObjectId(perdata1._id),
  //                   pairname: pairname,
  //                   createdAt: new Date(),
  //                 });
  //                 newrecord.save().then((result) => {
  //                 // //console.log("Saveddsa", result);
  //               });
  //
  //           }
  //         })
  //       exchangePrices.findOneAndUpdate(
  //         { exchangename: result.MARKET, pairname: pairname },
  //         { $set: updatedata, $inc: updatebaldata },
  //         { new: true },
  //         function (balerr, baldata) {
  //                // //console.log(balerr,'balerr');
  //           // //console.log(baldata,'baldata');
  //         }
  //       );
  //
  //     }
  //   }
  // });


  wsthree.on("message", function incoming(data) {
    //console.log(JSON.parse(data), 'Thriidss ssdata');
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
          // //console.log("result.PRICE",result.PRICE);
        }
        if (result.TOSYMBOL == "USDT" && result.FROMSYMBOL == "XRP") {
          pairname = "XRPUSDT";
        }
        updatebaldata = { volume: result.LASTVOLUME ? result.LASTVOLUME : 0 };
        updatebalance = {
          markprice: result.PRICE,
          binance_volume: result.LASTVOLUME ? result.LASTVOLUME : 0
        }
        spotpairs.findOneAndUpdate(
          { tiker_root: pairname, botstatus: "Off" },
          { $set: updatebalance },
          {
            new: true,
          },
          function (pererr1, perdata1) {
            if (perdata1) {
              socketio.emit("PRICEDETAILS", perdata1);
              // //console.log("perdata1",perdata1)
              // //console.log('pairname spot prices cron',pairname)

              if (perdata1.botstatus == "On") {
                ////console.log('pairname',pairname,typeof result.PRICE)
                eventEmitter.emit('stop-limit-order', { price: result.PRICE, pairname: pairname }, function () {
                });

              }

              const newrecord = new spotPrices({
                price: result.PRICE,
                pair: ObjectId(perdata1._id),
                pairname: pairname,
                createdAt: new Date(),
              });
              newrecord.save().then((result) => {
                ////console.log("Saveddsa~~~~~~~~~", result);
              });

            }
          })

        exchangePrices
          .find({ pairname: pairname, exchangename: result.MARKET })
          .exec(function (err, findresult) {
            if (findresult) {
              if (findresult.length == 0) {
                const newexchange = new exchangePrices({
                  pairname: pairname,
                  exchangename: result.MARKET
                });
                newexchange.save().then((result) => {
                  //console.log("Saveddsa", result);
                });
              } else {
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


      }
    }
  });

  eventEmitter.on('stop-limit-order', async function (data, done) {

    try {
      // done();
      // return false;
      var currPrice = parseFloat(data.price);
      let cond = { status: '4', orderType: 'Stop Limit', trigger_price: currPrice, pairName: data.pairname };

      var getData = await spottradeTable
        .aggregate([
          {
            $match: cond,
          },
          { $sort: { orderDate: 1 } },
          { $limit: 100 },
          { $project: { trigger_price: 1, _id: 1 } }
        ]).allowDiskUse(true);
      ////console.log('~~~~~~~~~',getData.length)
      if (getData && getData.length > 0) {
        //console.log('@@@@@@@@', getData)
        syncEach(getData, async function (items, next) {
          ////console.log('!!!!!!!!!!!!!')
          var update = await spottradeTable.findOneAndUpdate(
            { _id: ObjectId(items._id), status: "4", stopstatus: { $ne: "1" } },
            { $set: { status: "0" } },
            { new: true, fields: { status: 1 } });
          //console.log('update', update)

          process.nextTick(next);
        }, function (err, transformedItems) {
          done();
        });
      } else {
        done();
      }


    } catch (err) {
      done();
    }


  });



  wsthree.on("open", function open() {
    wsthree.send(
      JSON.stringify({
        action: "SubAdd",
        subs: [
          // "2~Binance~BTC~BUSD",
          // "2~Binance~ETH~BUSD",
          // "2~Binance~LTC~BUSD",
          // "2~Binance~XRP~BUSD",
          // "2~Binance~BCH~BUSD",
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
    // //console.log("disconnected from wwebsocket 222");
    openWebSocketThree();
  });
  wsthree.on("error", function () {

  })
};

// openWebSocket();

// // openWebSockettwo();
// //
// //
// openWebSocketThree();


router.get("/currencydetails", (req, res) => {
  currency.find({}, function (err, currencydetails) {
    if (currencydetails) {
      res.json({ status: true, data: currencydetails });
    } else {
      res.json({ status: false, message: "Something went wrong" });
    }
  });
});
router.get("/removespot", (req, res) => {
  spotPrices.remove(
    { createdAt: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } },
    function (err, result) {
      if (!err) {
        // res.send("success");
        //console.log("succes on spotremoveal");
      } else {
        res.send(err);
      }
    }
  );
})

router.post("/loadmoreRescentorder", (req, res) => {
  var pair = req.body.pair;
  var rescentcount = req.body.rescentcount;
  tradeTable
    .aggregate([
      { $match: { pairName: pair, status: "1" } },
      { $unwind: "$filled" },
      { $project: { filled: 1 } },
      {
        $group: {
          _id: {
            buyuserId: "$filled.buyuserId",
            selluserId: "$filled.selluserId",
            sellId: "$filled.sellId",
            buyId: "$filled.buyId",
          },
          created_at: { $first: "$filled.created_at" },
          Type: { $first: "$filled.Type" },
          filledAmount: { $first: "$filled.filledAmount" },
          pairname: { $first: "$filled.pairname" },
          Price: { $first: "$filled.Price" },
          Type: { $first: "$filled.Type" },
        },
      },
      { $sort: { "created_at": -1 } },
      // {$skip: rescentcount},
      { $limit: rescentcount },
    ])
    .exec(function (err, result) {
      res.json({ status: true, data: result });
    });
});

router.get("/balance", (req, res) => {
  // res.json({statue:"success"});
  User.find({}, function (err, userdetails) {
    if (userdetails) {
      userdetails.forEach(function (res) {
        var userId = res._id;
        currency.find({}, function (err, currencydetails) {
          currencydetails.forEach(function (cur) {
            var insertobj = {
              balance: 0,
              currency: cur._id,
              currencySymbol: cur.currencySymbol,
            };

            const newContact = new Assets({
              balance: 0,
              currency: cur._id,
              currencySymbol: cur.currencySymbol,
              userId: userId,
            });
            newContact.save(function (err, data) {
              //console.log("success");
            });
          });
        });
      });
      res.send("success");
    }
  });
});

function gettradedata(firstCurrency, secondCurrency, io) {
  //console.log("inside function");
  var findObj = {
    firstCurrency: firstCurrency,
    secondCurrency: secondCurrency,
  };
  var pair = firstCurrency + secondCurrency;
  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel(
    {
      buyOrder: function (cb) {
        var sort = { _id: -1 };
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "0" }, { status: "2" }],
                firstCurrency: firstCurrency,
                secondCurrency: secondCurrency,
                buyorsell: "buy",
              },
            },
            {
              $group: {
                _id: "$price",
                quantity: { $sum: "$quantity" },
                filledAmount: { $sum: "$filledAmount" },
              },
            },
            { $sort: sort },
            { $limit: 10 },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },
      sellOrder: function (cb) {
        var sort = { _id: 1 };
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "0" }, { status: "2" }],
                firstCurrency: firstCurrency,
                secondCurrency: secondCurrency,
                buyorsell: "sell",
              },
            },
            {
              $group: {
                _id: "$price",
                quantity: { $sum: "$quantity" },
                filledAmount: { $sum: "$filledAmount" },
              },
            },
            { $sort: sort },
            { $limit: 10 },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },
      contractdetails: function (cb) {
        perpetual
          .findOne(
            { first_currency: firstCurrency, second_currency: secondCurrency },
            {
              tiker_root: 1,
              maint_margin: 1,
              first_currency: 1,
              second_currency: 1,
            }
          )
          .exec(cb);
      },
      Rescentorder: function (cb) {
        tradeTable
          .aggregate([
            { $match: { pairName: pair, status: "1" } },
            { $unwind: "$filled" },
            { $project: { filled: 1 } },
            {
              $group: {
                _id: {
                  buyuserId: "$filled.buyuserId",
                  selluserId: "$filled.selluserId",
                  sellId: "$filled.sellId",
                  buyId: "$filled.buyId",
                },
                created_at: { $first: "$filled.created_at" },
                Type: { $first: "$filled.Type" },
                filledAmount: { $first: "$filled.filledAmount" },
                pairname: { $first: "$filled.pairname" },
                Price: { $first: "$filled.Price" },
                Type: { $first: "$filled.Type" },
              },
            },
            { $sort: { "created_at": -1 } },
            { $limit: 20 },
          ])
          .exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        result.status = false;
        result.message = "Error occured.";
        result.err = err;
        result.notify_show = "no";
        // res.json(result);
      } else if (results) {
        var sellOrder = results.sellOrder;
        var buyOrder = results.buyOrder;

        if (buyOrder.length > 0) {
          var sumamount = 0;
          for (i = 0; i < buyOrder.length; i++) {
            var quantity =
              parseFloat(buyOrder[i].quantity) -
              parseFloat(buyOrder[i].filledAmount);
            var _id = buyOrder[i]._id;
            sumamount = parseFloat(sumamount) + parseFloat(quantity);
            buyOrder[i].total = sumamount;
            buyOrder[i].quantity = quantity;
          }
        }

        if (sellOrder.length > 0) {
          var sumamount = 0;
          for (i = 0; i < sellOrder.length; i++) {
            var quantity =
              parseFloat(Math.abs(sellOrder[i].quantity)) -
              Math.abs(parseFloat(sellOrder[i].filledAmount));
            var _id = sellOrder[i]._id;
            sumamount = parseFloat(sumamount) + parseFloat(quantity);
            sellOrder[i].total = sumamount;
            sellOrder[i].quantity = quantity;
          }
        }

        sellOrder = sellOrder.reverse();

        result.status = true;
        result.message = "tradeTableAll";
        result.buyOrder = results.buyOrder;
        result.sellOrder = results.sellOrder;
        result.contractdetails = results.contractdetails;
        result.notify_show = "no";
        result.Rescentorder = results.Rescentorder;
        // res.json(result);
        // //console.log(result);
        if (typeof socketio != "undefined") {
          socketio.emit("TRADE", result);
        }
      } else {
        result.status = false;
        result.message = "Error occured.";
        result.err = "";
        result.notify_show = "no";
        // res.json(result);
      }
    }
  );
}

router.post("/getTradeData", (req, res) => {
  var findObj = {
    firstCurrency: req.body.firstCurrency,
    secondCurrency: req.body.secondCurrency,
  };
  var pair = req.body.firstCurrency + req.body.secondCurrency;
  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel(
    {
      buyOrder: function (cb) {
        var sort = { _id: -1 };
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "0" }, { status: "2" }],
                firstCurrency: req.body.firstCurrency,
                secondCurrency: req.body.secondCurrency,
                buyorsell: "buy",
              },
            },
            {
              $group: {
                _id: "$price",
                quantity: { $sum: "$quantity" },
                filledAmount: { $sum: "$filledAmount" },
              },
            },
            { $sort: sort },
            { $limit: 10 },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },
      sellOrder: function (cb) {
        var sort = { _id: 1 };
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "0" }, { status: "2" }],
                firstCurrency: req.body.firstCurrency,
                secondCurrency: req.body.secondCurrency,
                buyorsell: "sell",
              },
            },
            {
              $group: {
                _id: "$price",
                quantity: { $sum: "$quantity" },
                filledAmount: { $sum: "$filledAmount" },
              },
            },
            { $sort: sort },
            { $limit: 10 },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },

      Assetdetails: function (cb) {
        Assets.find({ userId: ObjectId(req.body.userid) }).exec(cb);
      },
      contractdetails: function (cb) {
        perpetual
          .findOne(
            {
              first_currency: req.body.firstCurrency,
              second_currency: req.body.secondCurrency,
            },
            {
              tiker_root: 1,
              maint_margin: 1,
              first_currency: 1,
              second_currency: 1,
            }
          )
          .exec(cb);
      },
      Rescentorder: function (cb) {
        tradeTable
          .aggregate([
            { $match: { pairName: pair, status: "1" } },
            { $unwind: "$filled" },
            { $project: { filled: 1 } },
            {
              $group: {
                _id: {
                  buyuserId: "$filled.buyuserId",
                  selluserId: "$filled.selluserId",
                  sellId: "$filled.sellId",
                  buyId: "$filled.buyId",
                },
                created_at: { $first: "$filled.created_at" },
                Type: { $first: "$filled.Type" },
                filledAmount: { $first: "$filled.filledAmount" },
                pairname: { $first: "$filled.pairname" },
                Price: { $first: "$filled.Price" },
                Type: { $first: "$filled.Type" },
              },
            },
            { $sort: { "created_at": -1 } },
            { $limit: 20 },
          ])
          .exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        result.status = false;
        result.message = "Error occured.";
        result.err = err;
        result.notify_show = "no";
        res.json(result);
      } else if (results) {
        var sellOrder = results.sellOrder;
        var buyOrder = results.buyOrder;
        if (buyOrder.length > 0) {
          var sumamount = 0;
          for (i = 0; i < buyOrder.length; i++) {
            var quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledAmount);;
            var _id = buyOrder[i]._id;
            sumamount = parseFloat(sumamount) + parseFloat(quantity);
            buyOrder[i].total = sumamount;
            buyOrder[i].quantity = quantity;
          }
        }

        if (sellOrder.length > 0) {
          var sumamount = 0;
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
        result.message = "tradeTableAll";
        result.buyOrder = results.buyOrder;
        result.sellOrder = results.sellOrder;
        result.contractdetails = results.contractdetails;
        result.notify_show = "no";
        result.assetdetails = results.Assetdetails;
        result.Rescentorder = results.Rescentorder;
        res.json(result);
      } else {
        result.status = false;
        result.message = "Error occured.";
        result.err = "";
        result.notify_show = "no";
        res.json(result);
      }
    }
  );
});
function cancel_trade(tradeid, userid) {
  update = { status: '3' }
  tradeTable.aggregate([
    { $match: { '_id': ObjectId(tradeid), 'status': { $ne: '3' } } },
  ]).exec((tradeerr, tradedata) => {
    //console.log("-----cancel_trad----tradeerr", tradeerr)
    //console.log("-----cancel_trade----tradedata", tradedata)
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
      var leverage = tradedata[0].leverage;
      var btcprice = tradedata[0].btcprice;
      var taker_fees = tradedata[0].taker_fees;
      var pairName = tradedata[0].pairName;

      quantity = parseFloat(quantity) - parseFloat(filledAmt);

      var order_value1 = parseFloat(quantity * price).toFixed(8);
      var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
      var required_margin = parseFloat(order_value1) / leverage;
      var fee = parseFloat(order_value1) * taker_fees / 100;
      var margininbtc = parseFloat(required_margin) / parseFloat(btcprice);
      var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
      var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
      order_cost = parseFloat(Math.abs(order_cost)).toFixed(8);

      async.parallel(
        {
          position_details: function (cb) {
            var pair = pairName;
            tradeTable
              .aggregate([
                {
                  $match: {
                    filledAmount: { $ne: 0 },
                    position_status: "1",
                    userId: ObjectId(userId),
                    pairName: pair,
                  },
                },
                { $unwind: "$filled" },
                { $match: { "filled.position_status": "1" } },
                { $project: { filled: 1, leverage: 1 } },
                {
                  $group: {
                    _id: null,
                    price: { $avg: "$filled.Price" },
                    quantity: { $sum: "$filled.filledAmount" },
                    pairName: { $first: "$filled.pairname" },
                    leverage: { $first: "$leverage" },
                  },
                },
              ])
              .exec(cb);
          },
          openorders: function (cb) {
            var pair = pairName;
            var sort = { '_id': 1 };
            tradeTable.aggregate([
              { $match: { '$or': [{ "status": '0' }, { "status": '2' }], "pairName": pair, buyorsell: type, userId: ObjectId(userId) } },
              {
                $group: {
                  '_id': '$price',
                  'quantity': { $sum: '$quantity' },
                  'filledAmount': { $sum: '$filledAmount' }
                }
              },
              { $sort: sort },
              { $limit: 100 },
            ]).allowDiskUse(true).exec(cb)
          },
        },
        (err, cancelresults) => {
          //console.log("----cancelresults", cancelresults)
          var position_details = cancelresults.position_details.length > 0 ? cancelresults.position_details[0].quantity : 0;
          var usersidequant = 0;
          var openorders = cancelresults.openorders;
          if (openorders.length > 0) {
            usersidequant = openorders[0].quantity - openorders[0].filledAmount;
          }

          async.parallel({
            // update balance
            data1: function (cb) {
              var updatebaldata = {};
              updatebaldata["balance"] = order_cost;
              // //console.log(order_cost,'order cost');
              Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {

              });
            },
            data2: function (cb) {
              //console.log("-----usersidequant----", usersidequant)
              //console.log("-----position_details---", position_details)
              if (Math.abs(usersidequant) > Math.abs(position_details)) {
                var updatedata = { "status": '3' }
                tradeTable.findOneAndUpdate({ _id: ObjectId(tradeid) }, { "$set": updatedata }, { new: true, "fields": { balance: 1 } }, function (upErr, upRes) {
                  if (upRes) {
                    //res.json({status:true,message:"Your Order cancelled successfully.",notify_show:'yes'});
                    gettradedata(t_firstcurrencyId, t_secondcurrencyId, socketio)
                  }
                  else {
                    //res.json({status:false,message:"Due to some error occurred,While Order cancelling"});
                  }
                });
              }
            }
          }, function (err, results) {
            // //console.log("----cancel_trade--err", err)
            // //console.log("----cancel_trade--results", results)

          });
        });
    }
    else {
      //console.log({ status: false, message: "Your Order already cancelled" });
    }
  });
}

function cancel_trade_MatchedOrder(tradeid, userid) {
  update = { status: '3' }
  tradeTable.aggregate([
    { $match: { '_id': ObjectId(tradeid), 'status': { $ne: '3' } } },
  ]).exec((tradeerr, tradedata) => {
    // //console.log("-----cancel_trad----tradeerr", tradeerr)
    // //console.log("-----cancel_trade----tradedata", tradedata)
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
      var leverage = tradedata[0].leverage;
      var btcprice = tradedata[0].btcprice;
      var taker_fees = tradedata[0].taker_fees;
      var pairName = tradedata[0].pairName;

      quantity = parseFloat(quantity) - parseFloat(filledAmt);

      var order_value1 = parseFloat(quantity * price).toFixed(8);
      var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
      var required_margin = parseFloat(order_value1) / leverage;
      var fee = parseFloat(order_value1) * taker_fees / 100;
      var margininbtc = parseFloat(required_margin) / parseFloat(btcprice);
      var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
      var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
      order_cost = parseFloat(Math.abs(order_cost)).toFixed(8);

      async.parallel(
        {
          position_details: function (cb) {
            var pair = pairName;
            tradeTable
              .aggregate([
                {
                  $match: {
                    filledAmount: { $ne: 0 },
                    position_status: "1",
                    userId: ObjectId(userId),
                    pairName: pair,
                  },
                },
                { $unwind: "$filled" },
                { $match: { "filled.position_status": "1" } },
                { $project: { filled: 1, leverage: 1 } },
                {
                  $group: {
                    _id: null,
                    price: { $avg: "$filled.Price" },
                    quantity: { $sum: "$filled.filledAmount" },
                    pairName: { $first: "$filled.pairname" },
                    leverage: { $first: "$leverage" },
                  },
                },
              ])
              .exec(cb);
          },
          openorders: function (cb) {
            var pair = pairName;
            var sort = { '_id': 1 };
            tradeTable.aggregate([
              { $match: { '$or': [{ "status": '0' }, { "status": '2' }], "pairName": pair, buyorsell: type, userId: ObjectId(userId) } },
              {
                $group: {
                  '_id': '$price',
                  'quantity': { $sum: '$quantity' },
                  'filledAmount': { $sum: '$filledAmount' }
                }
              },
              { $sort: sort },
              { $limit: 100 },
            ]).allowDiskUse(true).exec(cb)
          },
        },
        (err, cancelresults) => {
          // //console.log("----cancelresults", cancelresults)
          var position_details = cancelresults.position_details.length > 0 ? cancelresults.position_details[0].quantity : 0;
          var usersidequant = 0;
          var openorders = cancelresults.openorders;
          if (openorders.length > 0) {
            usersidequant = openorders[0].quantity - openorders[0].filledAmount;
          }

          async.parallel({
            // update balance
            data1: function (cb) {
              var updatebaldata = {};
              updatebaldata["balance"] = order_cost;
              // //console.log(order_cost,'order cost');
              Assets.findOneAndUpdate({ currencySymbol: 'BTC', userId: ObjectId(userId) }, { "$inc": updatebaldata }, { new: true, "fields": { balance: 1 } }, function (balerr, baldata) {

              });
            },
            data2: function (cb) {
              // //console.log("-----usersidequant----", usersidequant)
              // //console.log("-----position_details---", position_details)
              // if (Math.abs(usersidequant) > Math.abs(position_details)) {
              var updatedata = { "status": '3' }
              tradeTable.findOneAndUpdate({ _id: ObjectId(tradeid) }, { "$set": updatedata }, { new: true, "fields": { balance: 1 } }, function (upErr, upRes) {
                if (upRes) {
                  //res.json({status:true,message:"Your Order cancelled successfully.",notify_show:'yes'});
                  gettradedata(t_firstcurrencyId, t_secondcurrencyId, socketio)
                }
                else {
                  //res.json({status:false,message:"Due to some error occurred,While Order cancelling"});
                }
              });
              // }
            }
          }, function (err, results) {
            // //console.log("----cancel_trade--err", err)
            // //console.log("----cancel_trade--results", results)

          });
        });
    }
    else {
      //console.log({ status: false, message: "Your Order already cancelled" });
    }
  });
}

router.post("/cancelTrade", (req, res) => {
  var tradeid = req.body.id;
  var userid = req.body.userid;
  update = { status: "3" };
  tradeTable
    .findOne({ _id: ObjectId(tradeid), status: { $nin: ['1', '3'] } /*status: { $ne: "3" }*/ })
    .exec((tradeerr, tradedata) => {
      if (tradedata) {
        var type = tradedata.buyorsell;
        var trade_ids = tradedata._id;
        var userId = tradedata.userId;
        var filledAmt = tradedata.filledAmount;
        var status = tradedata.status;
        var quantity = tradedata.quantity;
        var price = tradedata.price;
        var t_firstcurrencyId = tradedata.firstCurrency;
        var t_secondcurrencyId = tradedata.secondCurrency;
        var beforeBalance = tradedata.beforeBalance;
        var afterBalance = tradedata.afterBalance;
        var leverage = tradedata.leverage;
        var btcprice = tradedata.btcprice;
        var taker_fees = tradedata.taker_fees;
        var pairName = tradedata.pairName;

        quantity = parseFloat(quantity) - parseFloat(filledAmt);

        var order_value1 = parseFloat(quantity * price).toFixed(8);
        var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
        var required_margin = parseFloat(order_value1) / leverage;
        var fee = parseFloat(order_value1) * parseFloat(taker_fees) / 100;
        var margininbtc = parseFloat(required_margin) / parseFloat(btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(Math.abs(order_cost)).toFixed(8);

        async.parallel(
          {
            position_details: function (cb) {
              var pair = pairName;
              tradeTable
                .aggregate([
                  {
                    $match: {
                      filledAmount: { $ne: 0 },
                      position_status: "1",
                      userId: ObjectId(userId),
                      pairName: pair,
                    },
                  },
                  { $unwind: "$filled" },
                  { $match: { "filled.position_status": "1" } },
                  { $project: { filled: 1, leverage: 1 } },
                  {
                    $group: {
                      _id: null,
                      price: { $avg: "$filled.Price" },
                      quantity: { $sum: "$filled.filledAmount" },
                      pairName: { $first: "$filled.pairname" },
                      leverage: { $first: "$leverage" },
                    },
                  },
                ])
                .exec(cb);
            },
            openorders: function (cb) {
              var pair = pairName;
              var sort = { '_id': req.body.buyorsell == 'buy' ? 1 : -1 };
              tradeTable.aggregate([
                { $match: { '$or': [{ "status": '0' }, { "status": '2' }], "pairName": pair, buyorsell: type, userId: ObjectId(userId) } },
                {
                  $group: {
                    '_id': '$price',
                    'quantity': { $sum: '$quantity' },
                    'filledAmount': { $sum: '$filledAmount' }
                  }
                },
                { $sort: sort },
                { $limit: 100 },
              ]).allowDiskUse(true).exec(cb)
            },
          },
          (err, cancelresults) => {
            var position_details = cancelresults.position_details.length > 0 ? cancelresults.position_details[0].quantity : 0;
            var usersidequant = 0;
            var openorders = cancelresults.openorders;
            if (openorders.length > 0) {
              usersidequant = openorders[0].quantity - openorders[0].filledAmount;
            }

            async.parallel(
              {
                // update balance
                data1: function (cb) {
                  var updatedata = { status: "3" };
                  tradeTable.findOneAndUpdate(
                    { _id: ObjectId(tradeid) },
                    { $set: updatedata },
                    { new: true, fields: { balance: 1 } },
                    function (upErr, upRes) {
                      if (upRes) {
                        res.json({
                          status: true,
                          message: "Your Order cancelled successfully.",
                          notify_show: "yes",
                        });
                        gettradedata(
                          t_firstcurrencyId,
                          t_secondcurrencyId,
                          socketio
                        );
                      } else {
                        res.json({
                          status: false,
                          message:
                            "Due to some error occurred,While Order cancelling",
                        });
                      }
                    }
                  );
                },
                data2: function (cb) {
                  // //console.log(usersidequant+">="+position_details)
                  if (Math.abs(usersidequant) > Math.abs(position_details)) {
                    var updatebaldata = {};
                    updatebaldata["balance"] = order_cost;
                    //console.log("ordercost before update", order_cost);
                    Assets.findOneAndUpdate(
                      { currencySymbol: "BTC", userId: ObjectId(userId) },
                      { $inc: updatebaldata },
                      { new: true },
                      function (balerr, baldata) {
                        // //console.log(" on cancel bal update",baldata);
                      }
                    );
                  }
                },
              },
              function (err, results) { }
            );
          });
      } else {
        res.json({ status: false, message: "Your Order already cancelled" });
      }
    });
});

// router.post("/cancelTrade", (req, res) => {
//   var tradeid = req.body.id;
//   var userid = req.body.userid;
//   update = { status: "3" };
//   tradeTable
//     .findOne({ _id: ObjectId(tradeid), status: { $nin: ['1','3'] } /* status: { $ne: "3" }  */})
//     .exec((tradeerr, tradedata) => {
//       if (tradedata) {
//         var type = tradedata.buyorsell;
//         var trade_ids = tradedata._id;
//         var userId = tradedata.userId;
//         var filledAmt = tradedata.filledAmount;
//         var status = tradedata.status;
//         var quantity = tradedata.quantity;
//         var price = tradedata.price;
//         var t_firstcurrencyId = tradedata.firstCurrency;
//         var t_secondcurrencyId = tradedata.secondCurrency;
//         var beforeBalance = tradedata.beforeBalance;
//         var afterBalance = tradedata.afterBalance;
//         var leverage = tradedata.leverage;
//         var btcprice = tradedata.btcprice;
//         var taker_fees = tradedata.taker_fees;

//         quantity = parseFloat(quantity) - parseFloat(filledAmt);

//         var order_value1 = parseFloat(quantity * price).toFixed(8);
//         var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
//         var required_margin = parseFloat(order_value1) / leverage;
//         var fee = (parseFloat(order_value1) * taker_fees) / 100;
//         var margininbtc = parseFloat(required_margin) / parseFloat(btcprice);
//         var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
//         var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
//         // order_cost = parseFloat(order_cost).toFixed(8);
//         order_cost = parseFloat(Math.abs(order_cost)).toFixed(8);

//         async.parallel(
//           {
//             // update balance
//             data1: function (cb) {
//               var updatedata = { status: "3" };
//               tradeTable.findOneAndUpdate(
//                 { _id: ObjectId(tradeid) },
//                 { $set: updatedata },
//                 { new: true, fields: { balance: 1 } },
//                 function (upErr, upRes) {
//                   if (upRes) {
//                     res.json({
//                       status: true,
//                       message: "Your Order cancelled successfully.",
//                       notify_show: "yes",
//                     });
//                     gettradedata(
//                       t_firstcurrencyId,
//                       t_secondcurrencyId,
//                       socketio
//                     );
//                   } else {
//                     res.json({
//                       status: false,
//                       message:
//                         "Due to some error occurred,While Order cancelling",
//                     });
//                   }
//                 }
//               );
//             },
//             data2: function (cb) {
//               var updatebaldata = {};
//               updatebaldata["balance"] = order_cost;
//               Assets.findOneAndUpdate(
//                 { currencySymbol: "BTC", userId: ObjectId(userId) },
//                 { $inc: updatebaldata },
//                 { new: true, fields: { balance: 1 } },
//                 function (balerr, baldata) { }
//               );
//             },
//           },
//           function (err, results) { }
//         );
//       } else {
//         res.json({ status: false, message: "Your Order already cancelled" });
//       }
//     });
// });

router.post("/allposition_details", (req, res) => {
  var userId = req.body.userId;
  tradeTable
    .aggregate([
      { $match: { filledAmount: { $ne: 0 }, userId: ObjectId(userId) } },
      { $unwind: "$filled" },
      { $match: { "filled.position_status": "1" } },
      { $project: { filled: 1, leverage: 1, firstCurrency: 1 } },
      {
        $group: {
          _id: "$pairName",
          price: { $avg: "$filled.Price" },
          quantity: { $sum: "$filled.filledAmount" },
          pairName: { $first: "$filled.pairname" },
          leverage: { $first: "$leverage" },
          firstCurrency: { $first: "$firstCurrency" },
        },
      },
    ])
    .exec(function (err, result) {
      res.json({ status: true, data: result, type: "allposition_details" });
    });
});

router.post("/getPricevalue", (req, res) => {
  var result = {};
  async.parallel(
    {
      volumedata: function (cb) {
        var sort = { orderDate: -1 };
        tradeTable
          .aggregate([
            {
              $match: {
                orderDate: {
                  $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  $lte: new Date(),
                },
                $or: [{ status: "1" }, { status: "2" }],
              },
            },
            { $unwind: "$filled" },
            {
              $match: {
                "filled.pairname":
                  req.body.firstCurrency + req.body.secondCurrency,
              },
            },
            {
              $group: {
                _id: "$item",
                low: { $min: "$filled.Price" },
                high: { $max: "$filled.Price" },
                volume: { $sum: { $abs: "$filled.filledAmount" } },
              },
            },
          ])
          .exec(cb);
      },
      rates: function (cb) {
        spotPrices
          .aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  $lte: new Date(),
                },
                pairname: req.body.firstCurrency + req.body.secondCurrency,
              },
            },
            {
              $sort: { createdAt: 1 },
            },
            { $limit: 86400 },
            {
              $group: {
                _id: null,
                pairname: { $first: "$pairname" },
                open: { $first: "$price" },
                close: { $last: "$price" },
                high: { $max: "$price" },
                low: { $min: "$price" },
              },
            },
            // {
            //   $project: {
            //     _id: 1,
            //     pairname: 1,
            //     open: 1,
            //     close: 1,
            //     low: 1,
            //     high: 1,
            //     // change: {
            //     //   $multiply: [
            //     //     {
            //     //       $subtract: [
            //     //         1,
            //     //         {
            //     //           $divide: [
            //     //             { $cond: [{ $eq: ["$open", null] }, 0, "$open"] },
            //     //             { $cond: [{ $eq: ["$close", null] }, 0, "$close"] },
            //     //           ],
            //     //         },
            //     //       ],
            //     //     },
            //     //     100,
            //     //   ],
            //     // },
            //   },
            // },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        result.status = false;
        result.message = "Error occured.";
        result.err = err;
        result.notify_show = "no";
        res.json(result);
      } else if (results) {
        var open = 0;
        var last = 0;
        if (results.rates.length > 0) {
          results.rates[0].volume =
            results.volumedata.length > 0
              ? results.volumedata[0].volume / 2
              : 0;
          var low = results.rates[0].low;
          var high = results.rates[0].high;
          var last = results.rates[0].close;
          var open = results.rates[0].open;
          var volume =
            results.volumedata.length > 0
              ? parseFloat(results.volumedata[0].volume) / 2
              : 0;
          // var total_volume = results.rates[0].volume;

          var change = (1 - parseFloat(open) / parseFloat(last)) * 100;
          results.rates[0].change = change;
        }

        // var change = results.rates.length > 0 ? results.rates[0].change : 0;
        perpetual
          .findOneAndUpdate(
            { tiker_root: req.body.firstCurrency + req.body.secondCurrency },
            {
              $set: {
                low: low,
                high: high,
                last: last,
                volume: volume,
                change: change,
              },
            },
            { multi: true, fields: { tiker_root: 1 } }
          )
          .exec(function (err, resUpdate) {
            if (resUpdate) {
              //console.log(resUpdate, "price update");
            }
          });

        result.status = true;
        result.message = "tradeTableAll";
        result.pricedet = results.rates;
        // result.lastpricedet = results.lastpricedet;
        // result.change       = results.change;
        result.notify_show = "no";
        res.json(result);
      } else {
        result.status = false;
        result.message = "Error occured.";
        result.err = "";
        result.notify_show = "no";
        res.json(result);
      }
    }
  );
});

function getusertradedata(userId, firstCurrency, secondCurrency) {
  // //console.log(userId,'getuserdra')
  if (userId.toString() != "5e567694b912240c7f0e4299") {
    var userId = userId;
    var result = {};
    async.parallel(
      {
        orderHistory: function (cb) {
          var sort = { _id: -1 };
          tradeTable
            .aggregate([
              {
                $match: {
                  $or: [{ status: "0" }, { status: "2" }],
                  // firstCurrency: firstCurrency,
                  // secondCurrency: secondCurrency,
                  userId: ObjectId(userId),
                },
              },
              { $sort: sort },
              { $limit: 20 },
            ])
            .allowDiskUse(true)
            .exec(cb);
        },
        Histroydetails: function (cb) {
          tradeTable
            .find({
              userId: ObjectId(userId),
              firstCurrency: firstCurrency,
              secondCurrency: secondCurrency,
            })
            .sort({ _id: -1 })
            .limit(20)
            .exec(cb);
        },
        Filleddetails: function (cb) {
          tradeTable
            .find({
              status: 1,
              userId: ObjectId(userId),
              firstCurrency: firstCurrency,
              secondCurrency: secondCurrency,
            })
            .sort({ _id: -1 })
            .limit(20)
            .exec(cb);
        },
        Conditional_details: function (cb) {
          tradeTable
            .find({
              status: "4",
              userId: ObjectId(userId),
              firstCurrency: firstCurrency,
              secondCurrency: secondCurrency,
            })
            .sort({ _id: -1 })
            .limit(20)
            .exec(cb);
        },
        position_details: function (cb) {
          var pair = firstCurrency + secondCurrency;
          tradeTable
            .aggregate([
              {
                $match: {
                  filledAmount: { $ne: 0 },
                  userId: ObjectId(userId),
                  pairName: pair,
                },
              },
              { $unwind: "$filled" },
              { $match: { "filled.position_status": "1" } },
              { $project: { filled: 1, leverage: 1 } },
              {
                $group: {
                  _id: null,
                  price: { $avg: "$filled.Price" },
                  quantity: { $sum: "$filled.filledAmount" },
                  pairName: { $first: "$filled.pairname" },
                  leverage: { $first: "$leverage" },
                },
              },
            ])
            .exec(cb);
        },
        daily_details: function (cb) {
          var pair = firstCurrency + secondCurrency;
          var start = new Date();
          start.setHours(0, 0, 0, 0);
          // //console.log(start,'start');
          var end = new Date();
          end.setHours(23, 59, 59, 999);
          // //console.log(end,'start');
          tradeTable
            .aggregate([
              {
                $match: {
                  filledAmount: { $ne: 0 },
                  position_status: "1",
                  userId: ObjectId(userId),
                  pairName: pair,
                },
              },
              { $unwind: "$filled" },
              { $project: { filled: 1, leverage: 1 } },
              {
                $match: {
                  "filled.created_at": {
                    $gte: new Date(start),
                    $lt: new Date(end),
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  price: { $avg: "$filled.Price" },
                  quantity: { $sum: "$filled.filledAmount" },
                  Fees: { $sum: "$filled.Fees" },
                  pairName: { $first: "$filled.pairname" },
                  leverage: { $first: "$leverage" },
                },
              },
            ])
            .exec(cb);
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
          Assets.find({ userId: ObjectId(userId) }).exec(cb);
        },
        contractdetails: function (cb) {
          perpetual
            .findOne(
              {
                first_currency: firstCurrency,
                second_currency: secondCurrency,
              },
              {
                tiker_root: 1,
                maint_margin: 1,
                first_currency: 1,
                second_currency: 1,
              }
            )
            .exec(cb);
        },
        closed_positions: function (cb) {
          position_table
            .find({
              userId: ObjectId(userId),
              pairname: firstCurrency + secondCurrency,
            })
            .sort({ _id: -1 })
            .limit(20)
            .exec(cb);
        },
        allposition_details: function (cb) {
          tradeTable
            .aggregate([
              {
                $match: { filledAmount: { $ne: 0 }, userId: ObjectId(userId) },
              },
              { $unwind: "$filled" },
              { $match: { "filled.position_status": "1" } },
              { $project: { filled: 1, leverage: 1, firstCurrency: 1 } },
              {
                $group: {
                  _id: "$pairName",
                  price: { $avg: "$filled.Price" },
                  quantity: { $sum: "$filled.filledAmount" },
                  pairName: { $first: "$filled.pairname" },
                  leverage: { $first: "$leverage" },
                  firstCurrency: { $first: "$firstCurrency" },
                },
              },
            ])
            .exec(cb);
        },
      },
      (err, results) => {
        if (err) {
          result.status = false;
          result.message = "Error occured.";
          result.err = err;
          result.notify_show = "no";
          // res.json(result);
        } else if (results) {
          result.status = true;
          result.message = "tradeTableAll";
          result.buyOrder = results.buyOrder;
          result.sellOrder = results.sellOrder;
          result.orderHistory = results.orderHistory;
          result.Histroydetails = results.Histroydetails;
          result.Conditional_details = results.Conditional_details;
          result.Filleddetails = results.Filleddetails;
          // result.lastpricedet         = results.lastpricedet;
          result.assetdetails = results.Assetdetails;
          result.allposition_details = results.allposition_details;
          result.contractdetails = results.contractdetails;
          result.position_details = results.position_details;
          result.closed_positions = results.closed_positions;
          result.daily_details = results.daily_details;
          result.notify_show = "no";
          if (typeof socketio != "undefined" && typeof userId != "undefined") {
            socketio.sockets.in(userId.toString()).emit("USERTRADE", result);
          }
        } else {
          result.status = false;
          result.message = "Error occured.";
          result.err = "";
          result.notify_show = "no";
          // res.json(result);
        }
      }
    );
  }
}
router.post("/changeopenpositions", (req, res) => {
  //console.log("call here");
  tradeTable.findOneAndUpdate(
    {
      "filled.user_id": ObjectId(req.body.user_id),
      "filled.position_status": 1,
    },
    { $set: { leverage: req.body.leverage } },
    { new: true, fields: { filled: 1 } },
    function (selltemp_err, selltempData) {
      if (selltempData) {
        res.json({
          status: true,
          message: "Position updated successfully",
          notify_show: "yes",
        });
      } else {
        res.json({
          status: true,
          message: "Position updated successfully",
          notify_show: "yes",
        });
      }
    }
  );
});

router.post('/getOrderHistory/trade', (req, res) => {
  var sort = { '_id': -1 };
  var userId = req.body.userId;
  var page = req.body.page;
  let skip = 0, limit = 10;
  if (page > 1) {
    skip = (page - 1) * limit
  }
  tradeTable.aggregate([
    {
      $match: {
        '$or': [{ "status": '0' }, { "status": '2' }],
        firstCurrency: req.body.firstCurrency,
        secondCurrency: req.body.secondCurrency,
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


router.post("/getuserTradeData", (req, res) => {
  var userId = req.body.userid;
  var status = req.body.status;
  var firstCurrency = req.body.firstCurrency;
  var secondCurrency = req.body.secondCurrency;
  var result = {};
  // tradeTable.find(findObj,function(err,tradeTableAll){
  async.parallel(
    {
      orderHistory: function (cb) {
        var sort = { _id: -1 };
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "0" }, { status: "2" }],
                firstCurrency: req.body.firstCurrency,
                secondCurrency: req.body.secondCurrency,
                userId: ObjectId(userId),
              },
            },
            { $sort: sort },
            { $limit: 10 },
          ])
          .allowDiskUse(true)
          .exec(cb);
      },
      orderHistoryCount: function (cb) {
        tradeTable.find({ '$or': [{ "status": '0' }, { "status": '2' }], firstCurrency: req.body.firstCurrency, secondCurrency: req.body.secondCurrency, userId: ObjectId(userId) }).countDocuments().exec(cb)
      },
      Histroydetails: function (cb) {
        tradeTable
          .find({
            userId: ObjectId(userId),
            firstCurrency: firstCurrency,
            secondCurrency: secondCurrency,
          })
          .sort({ _id: -1 })
          .limit(20)
          .exec(cb);
      },
      Filleddetails: function (cb) {
        tradeTable
          .find({
            status: 1,
            userId: ObjectId(userId),
            firstCurrency: firstCurrency,
            secondCurrency: secondCurrency,
          })
          .sort({ _id: -1 })
          .limit(20)
          .exec(cb);
      },
      Conditional_details: function (cb) {
        tradeTable
          .find({
            status: "4",
            userId: ObjectId(userId),
            firstCurrency: firstCurrency,
            secondCurrency: secondCurrency,
          })
          .sort({ _id: -1 })
          .limit(20)
          .exec(cb);
      },
      position_details: function (cb) {
        var pair = req.body.firstCurrency + req.body.secondCurrency;
        tradeTable
          .aggregate([
            {
              $match: {
                filledAmount: { $ne: 0 },
                userId: ObjectId(userId),
                pairName: pair,
              },
            },
            { $unwind: "$filled" },
            // { $match: { "filled.position_status": "1" } },
            { $match: { "filled.position_status": { "$in": ["1", "2"] } } },
            { $project: { filled: 1, leverage: 1 } },
            {
              $group: {
                _id: null,
                price: { $avg: "$filled.Price" },
                positionFilled: { "$sum": "$filled.positionFilled" },
                quantity: { $sum: "$filled.filledAmount" },
                pairName: { $first: "$filled.pairname" },
                leverage: { $first: "$leverage" },
              },
            },
          ])
          .exec(cb);
      },
      daily_details: function (cb) {
        var pair = req.body.firstCurrency + req.body.secondCurrency;
        var start = new Date();
        start.setHours(0, 0, 0, 0);
        // //console.log(start,'start');
        var end = new Date();
        end.setHours(23, 59, 59, 999);
        // //console.log(end,'start');
        tradeTable
          .aggregate([
            {
              $match: {
                filledAmount: { $ne: 0 },
                position_status: "1",
                userId: ObjectId(userId),
                pairName: pair,
              },
            },
            { $unwind: "$filled" },
            { $project: { filled: 1, leverage: 1 } },
            {
              $match: {
                "filled.created_at": {
                  $gte: new Date(start),
                  $lt: new Date(end),
                },
              },
            },
            {
              $group: {
                _id: null,
                price: { $avg: "$filled.Price" },
                quantity: { $sum: "$filled.filledAmount" },
                Fees: { $sum: "$filled.Fees" },
                pairName: { $first: "$filled.pairname" },
                leverage: { $first: "$leverage" },
              },
            },
          ])
          .exec(cb);
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
      Assetdetails: function (cb) {
        Assets.find({ userId: ObjectId(req.body.userid) }).exec(cb);
      },
      contractdetails: function (cb) {
        perpetual
          .findOne(
            {
              first_currency: req.body.firstCurrency,
              second_currency: req.body.secondCurrency,
            },
            {
              tiker_root: 1,
              maint_margin: 1,
              first_currency: 1,
              second_currency: 1,
            }
          )
          .exec(cb);
      },
      closed_positions: function (cb) {
        position_table
          .find({
            userId: ObjectId(req.body.userid),
            pairname: req.body.firstCurrency + req.body.secondCurrency,
          })
          .sort({ _id: -1 })
          .limit(20)
          .exec(cb);
      },
      allposition_details: function (cb) {
        tradeTable
          .aggregate([
            {
              $match: {
                filledAmount: { $ne: 0 },
                userId: ObjectId(req.body.userid),
              },
            },
            { $unwind: "$filled" },
            { $match: { "filled.position_status": "1" } },
            { $project: { filled: 1, leverage: 1, firstCurrency: 1 } },
            {
              $group: {
                _id: "$pairName",
                price: { $avg: "$filled.Price" },
                quantity: { $sum: "$filled.filledAmount" },
                pairName: { $first: "$filled.pairname" },
                leverage: { $first: "$leverage" },
                firstCurrency: { $first: "$firstCurrency" },
              },
            },
          ])
          .exec(cb);
      },
    },
    (err, results) => {
      // //console.log(results.position_details,'position_details');
      if (err) {
        result.status = false;
        result.message = "Error occured.";
        result.err = err;
        result.notify_show = "no";
        res.json(result);
      } else if (results) {
        result.status = true;
        result.message = "tradeTableAll";
        result.buyOrder = results.buyOrder;
        result.sellOrder = results.sellOrder;
        result.orderHistory = results.orderHistory;
        result.Histroydetails = results.Histroydetails;
        result.Conditional_details = results.Conditional_details;
        result.Filleddetails = results.Filleddetails;
        // result.lastpricedet         = results.lastpricedet;
        result.assetdetails = results.Assetdetails;
        result.contractdetails = results.contractdetails;
        result.position_details = results.position_details;
        result.allposition_details = results.allposition_details;
        result.closed_positions = results.closed_positions;
        result.daily_details = results.daily_details;
        result.orderHistoryCnt = results.orderHistoryCount
        result.notify_show = "no";
        res.json(result);
      } else {
        result.status = false;
        result.message = "Error occured.";
        result.err = "";
        result.notify_show = "no";
        res.json(result);
      }
    }
  );
});

function order_placing(
  ordertype,
  buyorsell,
  price,
  quantity,
  actleverage,
  pairname,
  userid,
  trigger_price = 0,
  trigger_type = null,
  id = 0,
  typeorder = "Conditional",
  trailstopdistance = 0,
  forced_liquidation = false
) {
  //console.log(price, "trigger_type" + forced_liquidation);

  async.parallel(
    {
      position_details: function (cb) {
        tradeTable
          .aggregate([
            {
              $match: {
                filledAmount: { $ne: 0 },
                position_status: "1",
                userId: ObjectId(userid),
                pairName: pairname,
              },
            },
            { $unwind: "$filled" },
            { $project: { filled: 1, leverage: 1 } },
            {
              $group: { _id: null, quantity: { $sum: "$filled.filledAmount" } },
            },
          ])
          .exec(cb);
      },
    },
    (err, results) => {
      var position_details =
        results.position_details.length > 0
          ? results.position_details[0].quantity
          : 0;

      perpetual.find(
        { $or: [{ tiker_root: pairname }, { tiker_root: "BTCUSD" }] },
        {
          tiker_root: 1,
          maint_margin: 1,
          first_currency: 1,
          second_currency: 1,
          markprice: 1,
          maxquantity: 1,
          minquantity: 1,
          taker_fees: 1,
        },
        function (err, contractdetails) {
          //console.log(pairname, "pairname");
          var float = pairname == "XRPUSD" ? 4 : 2;
          var index = contractdetails.findIndex(
            (x) => x.tiker_root === pairname
          );
          var btcindex = contractdetails.findIndex(
            (x) => x.tiker_root === "BTCUSD"
          );
          var markprice = contractdetails[index].markprice;
          var btcprice = contractdetails[btcindex].markprice;
          var taker_fees = contractdetails[index].taker_fees;
          var leverage = parseFloat(actleverage);
          var order_value1 = parseFloat(quantity) * parseFloat(price);
          var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
          var required_margin = parseFloat(order_value1) / leverage;
          var fee = (parseFloat(order_value1) * taker_fees) / 100;
          var margininbtc = parseFloat(required_margin) / parseFloat(btcprice);
          var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
          var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
          order_cost = parseFloat(order_cost).toFixed(8);

          var mainmargin = contractdetails[index].maint_margin / 100;
          var balance_check = true;
          if (buyorsell == "buy") {
            if (
              position_details < 0 &&
              Math.abs(position_details) >= quantity
            ) {
              var balance_check = false;
            }
            var Liqprice =
              (price * leverage) / (leverage + 1 - mainmargin * leverage);
          } else {
            if (
              position_details > 0 &&
              Math.abs(position_details) >= quantity
            ) {
              var balance_check = false;
            }
            quantity = parseFloat(quantity) * -1;
            var Liqprice =
              (price * leverage) / (leverage - 1 + mainmargin * leverage);
          }
          if (err) {
            res.json({
              status: false,
              message: "Error occured.",
              err: err,
              notify_show: "yes",
            });
          } else {
            Assets.findOne(
              { userId: ObjectId(userid), currencySymbol: "BTC" },
              function (err, assetdetails) {
                if (err) {
                  res.json({
                    status: false,
                    message: "Error occured.",
                    err: err,
                    notify_show: "yes",
                  });
                } else if (assetdetails) {
                  var firstcurrency = contractdetails[index].first_currency;
                  var secondcurrency = contractdetails[index].second_currency;
                  var curbalance = assetdetails.balance;
                  // if(curbalance<order_cost && balance_check==true)
                  // {
                  //   //console.log({status:false,message:"Due to insuffient balance order cannot be placed",notify_show:'yes'})
                  // } else {

                  var before_reduce_bal = curbalance;
                  var after_reduce_bal =
                    curbalance - balance_check ? order_cost : 0;

                  var updateObj = { balance: after_reduce_bal };

                  // Assets.findByIdAndUpdate(assetdetails._id, updateObj, {new: true}, function(err, changed) {
                  //   if (err) {
                  //     res.json({status:false,message:"Error occured.",err:err,notify_show:'yes'});
                  //   } else if(changed){
                  //console.log(typeorder, "triggertyrp");
                  if (typeorder == "trailingstop") {
                    const newtradeTable = new tradeTable({
                      quantity: parseFloat(quantity).toFixed(8),
                      price: parseFloat(price).toFixed(float),
                      trigger_price: trigger_price,
                      orderCost: order_cost,
                      orderValue: order_value,
                      leverage: actleverage,
                      userId: userid,
                      pair: contractdetails[index]._id,
                      pairName: pairname,
                      beforeBalance: before_reduce_bal,
                      afterBalance: after_reduce_bal,
                      firstCurrency: firstcurrency,
                      secondCurrency: secondcurrency,
                      Liqprice: Liqprice,
                      orderType: ordertype,
                      trigger_type: trigger_type,
                      stopstatus: "0",
                      buyorsell: buyorsell,
                      pairid: id,
                      trigger_ordertype: typeorder,
                      btcprice: btcprice,
                      taker_fees: taker_fees,
                      trailstop: "1",
                      orderDate: new Date(),
                      trailstopdistance: trailstopdistance,
                      forced_liquidation: forced_liquidation,
                      status: 4, // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                    });
                    newtradeTable
                      .save()
                      .then((curorder) => {
                        if (typeof socketio != "undefined") {
                          socketio.sockets
                            .in(userid.toString())
                            .emit(
                              "NOTIFICATION",
                              "Trail stop order created successfully"
                            );
                        }
                        tradematching(curorder);
                      })
                      .catch((err) => {
                        //console.log(err, "error");
                        res.json({
                          status: false,
                          message: "Your order not placed.",
                          notify_show: "yes",
                        });
                      });
                  } else {
                    //console.log("else");
                    const newtradeTable = new tradeTable({
                      quantity: quantity,
                      price:
                        typeorder == "stop" || typeorder == "takeprofit"
                          ? trigger_price
                          : price,
                      trigger_price: trigger_price,
                      orderCost: order_cost,
                      orderValue: order_value,
                      leverage: actleverage,
                      userId: userid,
                      pair: contractdetails[index]._id,
                      pairName: pairname,
                      beforeBalance: before_reduce_bal,
                      afterBalance: after_reduce_bal,
                      firstCurrency: firstcurrency,
                      secondCurrency: secondcurrency,
                      Liqprice: Liqprice,
                      orderType: ordertype,
                      trigger_type: trigger_type,
                      stopstatus: typeorder != "Conditional" ? "1" : "0",
                      buyorsell: buyorsell,
                      pairid: id,
                      trigger_ordertype: typeorder,
                      btcprice: btcprice,
                      taker_fees: taker_fees,
                      orderDate: new Date(),
                      forced_liquidation: forced_liquidation,
                      status: trigger_type != null ? 4 : 0, // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                    });
                    newtradeTable
                      .save()
                      .then((curorder) => {
                        // if(forced_liquidation==false)
                        // {
                        tradematching(curorder);
                        // }
                      })
                      .catch((err) => {
                        //console.log(err, "error");
                        res.json({
                          status: false,
                          message: "Your order not placed.",
                          notify_show: "yes",
                        });
                      });
                  }

                  //   }
                  // })
                  // insert trade tab
                  // }
                } else {
                }
              }
            );
          }
        }
      );
    }
  );
}

router.post("/triggerstop", (req, res) => {
  var takeprofitcheck = req.body.takeprofitcheck;
  var stopcheck = req.body.stopcheck;
  var quantity = req.body.quantity;
  var takeprofit = req.body.takeprofit;
  var ordertype = req.body.ordertype;
  var buyorsell = req.body.buyorsell;
  var price = req.body.price;
  var leverage = req.body.leverage;
  var trailingstopdistance = req.body.trailingstopdistance;

  if (takeprofitcheck) {
    var trigger_price = takeprofit;
    var tptrigger_type = "Mark";
    var newbuyorsell = buyorsell == "buy" ? "sell" : "buy";
    order_placing(
      ordertype,
      newbuyorsell,
      price,
      quantity,
      leverage,
      req.body.pairname,
      req.body.userid,
      trigger_price,
      tptrigger_type,
      0,
      "takeprofit"
    );
    res.json({
      status: true,
      message: "Your take profit order set successfully.",
      notify_show: "yes",
    });
  }
  if (stopcheck) {
    var stoptrigger_type = "Mark";
    var trigger_price = stopprice;
    var newbuyorsell = buyorsell == "buy" ? "sell" : "buy";
    order_placing(
      ordertype,
      newbuyorsell,
      price,
      quantity,
      leverage,
      req.body.pairname,
      req.body.userid,
      trigger_price,
      stoptrigger_type,
      0,
      "stop"
    );
    res.json({
      status: true,
      message: "Your stop order set successfully.",
      notify_show: "yes",
    });
  }
  if (trailingstopdistance != "" && trailingstopdistance != 0) {
    var trigger_price =
      buyorsell == "buy"
        ? parseFloat(price) + parseFloat(trailingstopdistance)
        : parseFloat(price) - parseFloat(trailingstopdistance);
    // var newbuyorsell = (buyorsell=='buy')?'sell':'buy';
    order_placing(
      ordertype,
      buyorsell,
      price,
      quantity,
      leverage,
      req.body.pairname,
      req.body.userid,
      trigger_price,
      "Last",
      0,
      "trailingstop",
      trailingstopdistance
    );
    res.json({
      status: true,
      message: "Your trail stop order set successfully.",
      notify_show: "yes",
    });
  }
});

function write_log(msg) {
  var now = new Date();
  var log_file =
    "log/common_log_" +
    now.getFullYear() +
    now.getMonth() +
    now.getDay() +
    ".txt";
  fs.appendFileSync(log_file, msg);
  ////console.log(msg);
  return true;
}


/// 30 miutess     */30 * * * *

//
// cron.schedule("*/7 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// generatebot(orderType,buyorsell)
// });
//
//
//
// cron.schedule("*/5 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// generatebot(orderType,buyorsell)
// });

//
// cron.schedule("*/2 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Market"
// var buyorsell ="buy"
// generatebot(orderType,buyorsell)
// });
//
// cron.schedule("*/3 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Market"
// var buyorsell ="sell"
// generatebot(orderType,buyorsell)
// });

function generatebot(orderType, buyorsell) {
  // //console.log("orderType",orderType);
  // //console.log("buyorsell",buyorsell);
  perpetual.find({}).then(perpetual => {
    //console.log("perpetual", perpetual.length);
    if (perpetual.length > 0) {
      perpetual[0].orderTypedata = orderType
      perpetual[0].buyorselldata = buyorsell
      var i = 0;

      // //console.log("spotpairsss",spotpairs[0])
      generateBuyTradeOrder(perpetual[0], function () {
        // //console.log("length of array",spotpairs.length);
        if (i === perpetual.length - 1) {
          // //console.log("inside the if sss")
          callBackSpotImport();
        } else {
          // //console.log("isndie else")
          i += 1;
          perpetual[i].orderTypedata = orderType
          perpetual[i].buyorselldata = buyorsell
          if (perpetual[i]) {
            // //console.log("next creatinon token ss",currencytokendetails[i]);
            generateBuyTradeOrder(perpetual[i]);
          } else {
            callBackSpotImport();
          }
        }
      });
    }
  })

}



// function generateBuyTradeOrder(perpetual, callBackOne) {
//   if (callBackOne) {
//     userinfo.tradeover = callBackOne;
//   }
//
//   // //console.log("perpetuallaa",perpetual);
//   var pairname = perpetual.tiker_root;
//   var randomprice;
//   var highpricetable=perpetual.high;
//   var lowpricetable=perpetual.low
//   var buyorsell=perpetual.buyorselldata
//     var ordertype = perpetual.orderTypedata;
//     // var useridstatic=ObjectId("5f3617da362e0610f8df95d5")
//     var useridstatic=ObjectId("5f11301062c7e3584e61ec88")
//
//     var highpricetable=perpetual.high;
//     var lowpricetable=perpetual.low
//     var maxdbleverage =perpetual.leverage
//     var randomleverage = Math.random() * (+maxdbleverage - +1) + +1;
//     var dbmarkprice=perpetual.markprice
//     var randommulti = Math.random() * (+0.001 - +0.002) + +0.002
//     //console.log("randommultiii",randommulti);
//     //console.log("oridigal price",perpetual.markprice);
//     var checkprice= parseFloat(dbmarkprice)  * parseFloat(randommulti)
//     var divvaluee
//     if(pairname=="BTCUSD" ){
//         divvaluee = parseFloat(checkprice)/ 100
//     }else if(pairname=="ETHUSD"){
//       divvaluee= parseFloat(checkprice) * 5
//     }else if (pairname=="LTCUSD") {
//       divvaluee= parseFloat(checkprice) * 5
//     }
//     else {
//       divvaluee =randommulti
//     }
//     var checkprice= parseFloat(dbmarkprice)  * parseFloat(divvaluee)
//     if(buyorsell=="buy"){
//       // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;
//       randomprice = parseFloat(dbmarkprice) - parseFloat(checkprice)
//     }else{
//       randomprice = parseFloat(dbmarkprice) + parseFloat(checkprice)
//     }
//     // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;
//
//     var randomquantity = Math.random() * (+1 - +0.5) + +0.5
//
//     var timeinforcetype = "GoodTillCancelled";
//     var trigger_price = 0;
//     var trigger_type = null;
//
//
// //console.log("perpetuals",pairname);
//   if(perpetual.botstatus=="On"){
//     tradeTable
//       .aggregate([
//         {
//           $match: {
//             $or: [{ status: "0" }, { status: "2" }],
//             pairName: pairname,
//             buyorsell:buyorsell,
//           },
//         }])
//   .then(buyresult=>{
//   //console.log("length",buyresult.length);
//
//   if(buyresult.length<=9 && buyresult.length>=0){
//     var i = 0;
//     generateTenTradeOrder(perpetual, function () {
//       //console.log("i valueesa/*/*/*/*/*",i);
//       // //console.log("perpetuall",perpetual);
//       var  firstcurrency=perpetual.first_currency
//   var secondcurrency = perpetual.second_currency
//       gettradedata(
//         firstcurrency,
//         secondcurrency,
//         socketio
//       );
//       if (i === 10 - 1) {
//         // callBackSpotImport();
//         userinfo.tradeover()
//       } else {
//         i += 1;
//         perpetual.orderTypedata=ordertype
//         perpetual.buyorselldata=buyorsell
//           generateTenTradeOrder(perpetual);
//       }
//     });
//   }
//   else{
//       userinfo.tradeover()
//   }
// })}
// else{
//     userinfo.tradeover()
// }
// }

// cron.schedule("*/2 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// var pairname="BCHUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/4 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// var pairname="BTCUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/6 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// var pairname="ETHUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/8 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// var pairname="LTCUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/10 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="sell"
// var pairname="XRPUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });


// cron.schedule("*/4 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// var pairname="BCHUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/8 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// var pairname="BTCUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/12 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// var pairname="ETHUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/16 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// var pairname="LTCUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });

// cron.schedule("*/18 * * * *", (req, res) => {
// //console.log("cron working in minutess/*/*/*/");
// var orderType="Limit"
// var buyorsell ="buy"
// var pairname="XRPUSD"
// perpetual.findOne({tiker_root:pairname}).then(perpetual=>{
//   if(perpetual){
//     perpetual.buyorselldata =buyorsell
//     perpetual.orderTypedata=orderType
//     generateBuyTradeOrder(perpetual)
//   }
// })
// });


function generateBuyTradeOrder(perpetual) {

  // //console.log("perpetuallaa",perpetual);
  var pairname = perpetual.tiker_root;
  var randomprice;
  var highpricetable = perpetual.high;
  var lowpricetable = perpetual.low
  var buyorsell = perpetual.buyorselldata
  var ordertype = perpetual.orderTypedata;
  // var useridstatic=ObjectId("5f3617da362e0610f8df95d5")
  var useridstatic = ObjectId("5f11301062c7e3584e61ec88")

  var highpricetable = perpetual.high;
  var lowpricetable = perpetual.low
  var maxdbleverage = perpetual.leverage
  var randomleverage = Math.random() * (+maxdbleverage - +1) + +1;
  var dbmarkprice = perpetual.markprice
  var randommulti = Math.random() * (+0.001 - +0.002) + +0.002
  //console.log("randommultiii", randommulti);
  //console.log("oridigal price", perpetual.markprice);
  var checkprice = parseFloat(dbmarkprice) * parseFloat(randommulti)
  var divvaluee
  if (pairname == "BTCUSD") {
    divvaluee = parseFloat(checkprice) / 100
  } else if (pairname == "ETHUSD") {
    divvaluee = parseFloat(checkprice) * 5
  } else if (pairname == "LTCUSD") {
    divvaluee = parseFloat(checkprice) * 5
  }
  else {
    divvaluee = randommulti
  }
  var checkprice = parseFloat(dbmarkprice) * parseFloat(divvaluee)
  if (buyorsell == "buy") {
    // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;
    randomprice = parseFloat(dbmarkprice) - parseFloat(checkprice)
  } else {
    randomprice = parseFloat(dbmarkprice) + parseFloat(checkprice)
  }
  // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;

  var randomquantity12 = Math.random() * (+1 - +0.5) + +0.5
  var randomquantity = randomquantity12.toFixed(4)

  var timeinforcetype = "GoodTillCancelled";
  var trigger_price = 0;
  var trigger_type = null;


  //console.log("perpetuals", pairname);
  if (perpetual.botstatus == "On") {
    tradeTable
      .aggregate([
        {
          $match: {
            $or: [{ status: "0" }, { status: "2" }],
            pairName: pairname,
            buyorsell: buyorsell,
          },
        }])
      .then(buyresult => {
        //console.log("length", buyresult.length);

        if (buyresult.length <= 9 && buyresult.length >= 0) {
          var i = 0;
          generateTenTradeOrder(perpetual, function () {
            //console.log("i valueesa/*/*/*/*/*", i);
            // //console.log("perpetuall",perpetual);
            var firstcurrency = perpetual.first_currency
            var secondcurrency = perpetual.second_currency

            if (i === 10 - 1) {
              gettradedata(
                firstcurrency,
                secondcurrency,
                socketio
              );
              // callBackSpotImport();
              // userinfo.tradeover()
            } else {
              i += 1;
              perpetual.orderTypedata = ordertype
              perpetual.buyorselldata = buyorsell
              generateTenTradeOrder(perpetual);
            }
          });
        }

      })
  }
}

function generateTenTradeOrder(perpetual, callBackTwo) {
  if (callBackTwo) {
    userinfo.tradeplacingover = callBackTwo;
  }
  var pairname = perpetual.tiker_root;
  var randomprice;
  var highpricetable = perpetual.high;
  var lowpricetable = perpetual.low
  var buyorsell = perpetual.buyorselldata
  var ordertype = perpetual.orderTypedata;
  // var useridstatic=ObjectId("5f3617da362e0610f8df95d5")
  var useridstatic = ObjectId("5f11301062c7e3584e61ec88")

  var highpricetable = perpetual.high;
  var lowpricetable = perpetual.low
  var maxdbleverage = perpetual.leverage
  var randomleverage = Math.random() * (+maxdbleverage - +1) + +1;
  // var dbmarkprice=perpetual.markprice
  // var checkprice= parseFloat(dbmarkprice)  * parseFloat(0.01)
  // if(buyorsell=="buy"){
  //   // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;
  //   randomprice = parseFloat(dbmarkprice) - parseFloat(checkprice)
  // }else{
  //   randomprice = parseFloat(dbmarkprice) + parseFloat(checkprice)
  // }
  // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;

  var dbmarkprice = perpetual.markprice
  var randommulti = Math.random() * (+0.001 - +0.002) + +0.002
  //console.log("randommultiii", randommulti);
  //console.log("oridigal price", perpetual.markprice);
  var checkprice = parseFloat(dbmarkprice) * parseFloat(randommulti)
  //console.log("checkprice", checkprice);
  var divvaluee
  if (pairname == "BTCUSD") {
    divvaluee = parseFloat(checkprice) / 100
  } else if (pairname == "ETHUSD") {
    divvaluee = parseFloat(checkprice) * 5
  }
  else if (pairname == "BCHUSD") {
    divvaluee = parseFloat(checkprice)

  } else if (pairname == "LTCUSD") {
    divvaluee = parseFloat(checkprice) * 15
  }
  else {
    divvaluee = randommulti
  }


  var checkprice = parseFloat(dbmarkprice) * parseFloat(divvaluee)
  if (buyorsell == "buy") {
    // var randomprice = Math.random() * (+highpricetable - +lowpricetable) + +lowpricetable;
    randomprice = parseFloat(dbmarkprice) - parseFloat(divvaluee)
  } else {
    randomprice = parseFloat(dbmarkprice) + parseFloat(divvaluee)
  }
  //console.log("randomprice", randomprice);


  var randomquantity12 = Math.random() * (+1 - +0.5) + +0.5
  var randomquantity = randomquantity12.toFixed(4)


  var timeinforcetype = "GoodTillCancelled";
  var trigger_price = 0;
  var trigger_type = null;


  //console.log("perpetuals in tenorder", pairname);

  var position_price = 0
  var position_details = 0
  var contractdetails = perpetual

  var markprice = contractdetails.markprice
  // var btcprice = contractdetails[btcindex].markprice;
  var btcprice = 0
  var maxquantity = contractdetails.maxquantity;
  var minquantity = contractdetails.minquantity;
  var taker_fees = contractdetails.taker_fees;
  // var maxquantity = contractdetails[index].maxquantity;
  // var minquantity = contractdetails[index].minquantity;
  // var taker_fees = contractdetails[index].taker_fees;
  var leverage = parseFloat(randomleverage);
  var order_value1 = parseFloat(randomquantity * randomprice).toFixed(8);
  var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
  var required_margin = parseFloat(order_value1) / leverage;
  var fee = (parseFloat(order_value1) * taker_fees) / 100;
  var margininbtc =
    parseFloat(required_margin) / parseFloat(btcprice);
  var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
  var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
  order_cost = parseFloat(order_cost).toFixed(8);
  var mainmargin = contractdetails.maint_margin / 100;
  var firstcurrency = contractdetails.first_currency;
  if (buyorsell == "buy") {
    var Liqprice =
      (randomprice * randomleverage) /
      (randomleverage + 1 - mainmargin * randomleverage);
  } else {
    var Liqprice =
      (parseFloat(randomprice) * parseFloat(randomleverage)) /
      (parseFloat(randomleverage) -
        1 +
        parseFloat(mainmargin) * parseFloat(randomleverage));
  }

  if (parseFloat(randomquantity) < parseFloat(minquantity)) {
    //console.log("Quantity of contract must not be lesser than " + minquantity);
  } else if (parseFloat(randomquantity) > parseFloat(maxquantity)) {
    //console.log("Quantity of contract must not be higher than " + maxquantity);
  }

  else if (
    ordertype == "Limit" &&
    buyorsell == "buy" &&
    parseFloat(Liqprice) > parseFloat(randomprice)
  ) {
    //console.log("Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be above Mark Price if the order is fulfilled.");

  } else if (
    ordertype == "Limit" &&
    buyorsell == "sell" &&
    parseFloat(Liqprice) < parseFloat(randomprice)
  ) {
    //console.log("Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be beloww Mark Price if the order is fulfilled.");
  } else {
    var balance_check = true;
    var profitnloss = 0;
    if (buyorsell == "buy") {
      if (
        position_details < 0 &&
        Math.abs(position_details) >= randomquantity
      ) {
        var balance_check = false;
      }

      if (
        position_details > 0 &&
        buyorsell == "sell" &&
        Math.abs(position_details) >= parseFloat(randomquantity)
      ) {
        var balance_check = false;
        var profitnlossusd =
          parseFloat(randomprice) - parseFloat(position_price);
        var profitnlossusd =
          parseFloat(profitnlossusd) * parseFloat(position_details);

        var profitnloss =
          parseFloat(profitnlossusd) / parseFloat(position_price);
      } else if (
        position_details < 0 &&
        buyorsell == "buy" &&
        Math.abs(position_details) >= parseFloat(randomquantity)
      ) {

        var balance_check = false;
        var profitnlossusd =
          parseFloat(position_price) - parseFloat(randomprice);
        var profitnlossusd =
          parseFloat(profitnlossusd) *
          parseFloat(Math.abs(position_details));

        var profitnloss =
          parseFloat(profitnlossusd) / parseFloat(position_price);
      }
    } else {
      if (
        position_details > 0 &&
        buyorsell == "sell" &&
        Math.abs(position_details) >= parseFloat(randomquantity)
      ) {
        var balance_check = false;
        var profitnlossusd =
          parseFloat(randomprice) - parseFloat(position_price);
        var profitnlossusd =
          parseFloat(profitnlossusd) * parseFloat(position_details);

        var profitnloss =
          parseFloat(profitnlossusd) / parseFloat(position_price);
      } else if (
        position_details < 0 &&
        buyorsell == "buy" &&
        Math.abs(position_details) >= parseFloat(randomquantity)
      ) {
        var balance_check = false;
        var profitnlossusd =
          parseFloat(randomprice) - parseFloat(position_price);
        var profitnlossusd =
          parseFloat(profitnlossusd) * parseFloat(position_details);

        var profitnloss =
          parseFloat(profitnlossusd) / parseFloat(position_price);
      }
      randomquantity = parseFloat(randomquantity) * -1;
    }

    var before_reduce_bal = 0
    var after_reduce_bal = 0

    var float = pairname == "XRPUSD" ? 4 : 2;
    const newtradeTable = new tradeTable({
      quantity: parseFloat(randomquantity).toFixed(8),
      price: parseFloat(randomprice).toFixed(float),
      trigger_price: trigger_price,
      orderCost: order_cost,
      orderValue: order_value,
      leverage: randomleverage,
      userId: useridstatic,
      pair: contractdetails._id,
      pairName: pairname,
      beforeBalance: before_reduce_bal,
      afterBalance: after_reduce_bal,
      timeinforcetype: timeinforcetype,
      firstCurrency: contractdetails.first_currency,
      secondCurrency: contractdetails.second_currency,
      Liqprice: Liqprice,
      orderType: ordertype,
      trigger_type: trigger_type,
      buyorsell: buyorsell,
      btcprice: btcprice,
      taker_fees: taker_fees,
      orderDate: new Date(),
      status: trigger_type != null ? 4 : 0, // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
    });
    newtradeTable
      .save()
      .then((curorder) => {
        // write_log("\n"+JSON.stringify({date:new Date(),process:"orderplacing",result:curorder}));
        //console.log("placed ordere");
        userinfo.tradeplacingover()

      })
      .catch((err) => {
        //console.log(err, "error");

      });


  }


}

function callBackSpotImport() {
  // tradeinfo.filledamount = 0;
  //console.log("spot generatedds");
}

router.post("/orderPlacing", (req, res) => {
  //console.log("req.bodyss", req.body);
  var bytes = CryptoJS.AES.decrypt(req.body.token, keys.cryptoPass);
  req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  //console.log("req.bodyss", req.body);
  const { errors, isValid } = validateTradeInput(req.body);
  if (!isValid) {
    res.json({
      status: false,
      message: "Error occured, please fill all required fields.",
      errors: errors,
      notify_show: "yes",
    });
  } else {
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

    async.parallel(
      {
        position_details: function (cb) {
          var pair = req.body.pairname;
          tradeTable
            .aggregate([
              {
                $match: {
                  filledAmount: { $ne: 0 },
                  position_status: "1",
                  userId: ObjectId(req.body.userid),
                  pairName: pair,
                },
              },
              { $unwind: "$filled" },
              { $match: { "filled.position_status": "1" } },
              { $project: { filled: 1, leverage: 1 } },
              {
                $group: {
                  _id: null,
                  price: { $avg: "$filled.Price" },
                  quantity: { $sum: "$filled.filledAmount" },
                  pairName: { $first: "$filled.pairname" },
                  leverage: { $first: "$leverage" },
                },
              },
            ])
            .exec(cb);
        },
        orderbook: function (cb) {
          var pair = req.body.pairname;
          var type = req.body.buyorsell == 'buy' ? "sell" : "buy";
          var sort = { '_id': req.body.buyorsell == 'buy' ? 1 : -1 };
          tradeTable.aggregate([
            { $match: { '$or': [{ "status": '0' }, { "status": '2' }], "pairName": pair, buyorsell: type } },
            {
              $group: {
                '_id': '$price',
                'quantity': { $sum: '$quantity' },
                'filledAmount': { $sum: '$filledAmount' }
              }
            },
            { $sort: sort },
            { $limit: 100 },
          ]).allowDiskUse(true).exec(cb)
        },
        openorders: function (cb) {
          var pair = req.body.pairname;
          var type = req.body.buyorsell;
          var sort = { '_id': req.body.buyorsell == 'buy' ? 1 : -1 };
          tradeTable.aggregate([
            { $match: { '$or': [{ "status": '0' }, { "status": '2' }], "pairName": pair, buyorsell: type, userId: ObjectId(req.body.userid) } },
            {
              $group: {
                '_id': '$price',
                'quantity': { $sum: '$quantity' },
                'filledAmount': { $sum: '$filledAmount' }
              }
            },
            { $sort: sort },
            { $limit: 100 },
          ]).allowDiskUse(true).exec(cb)
        },
      },
      (err, results) => {
        //console.log("----results", results)
        var position_details =
          results.position_details.length > 0
            ? results.position_details[0].quantity
            : 0;
        var position_price =
          results.position_details.length > 0
            ? results.position_details[0].price
            : 0;
        var openorders = results.openorders;
        var usersidequant = 0;
        // //console.log(openorders,'openorders')
        if (openorders.length > 0) {
          usersidequant = openorders[0].quantity - openorders[0].filledAmount;
        }
        // //console.log(usersidequant,'usersidequant')
        var orderbook = (results.orderbook.length > 0) ? results.orderbook : 0;

        if (results.orderbook.length > 0 && req.body.ordertype == 'Market') {
          var orderdetails = results.orderbook;
          var ordertotal = 0;
          for (var i = 0; i < orderdetails.length; i++) {
            var orderprice = orderdetails[i]._id;
            var orderquantity = parseFloat(Math.abs(orderdetails[i].quantity)) - parseFloat(Math.abs(orderdetails[i].filledAmount));
            ordertotal = parseFloat(Math.abs(ordertotal)) + parseFloat(Math.abs(orderquantity));

            if (parseFloat(ordertotal) >= parseFloat(Math.abs(quantity))) {
              price = orderprice;
              break;
            }
          }
        }
        if (req.body.ordertype == 'Market') {
          if (results.orderbook.length == 0) {
            return res.json({
              status: false,
              message: "There is no order in order book",
              errors: 'no res 2',
              notify_show: 'yes'
            });
          }
        }

        // //console.log(price, "price");
        perpetual.find(
          {
            $or: [{ tiker_root: req.body.pairname }, { tiker_root: "BTCUSD" }],
          },
          {
            tiker_root: 1,
            maint_margin: 1,
            first_currency: 1,
            second_currency: 1,
            markprice: 1,
            maxquantity: 1,
            minquantity: 1,
            taker_fees: 1,
          },
          function (err, contractdetails) {
            var index = contractdetails.findIndex(
              (x) => x.tiker_root === req.body.pairname
            );
            var btcindex = contractdetails.findIndex(
              (x) => x.tiker_root === "BTCUSD"
            );
            var markprice = parseFloat(
              contractdetails[index].markprice
            ).toFixed(4);
            var btcprice = contractdetails[btcindex].markprice;
            var maxquantity = contractdetails[index].maxquantity;
            var minquantity = contractdetails[index].minquantity;
            var taker_fees = contractdetails[index].taker_fees;
            var leverage = parseFloat(req.body.leverage);
            var order_value1 = parseFloat(quantity * price).toFixed(8);
            var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
            var required_margin = parseFloat(order_value1) / leverage;
            var fee = (parseFloat(order_value1) * taker_fees) / 100;

            var margininbtc =
              parseFloat(required_margin) / parseFloat(btcprice);
            var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
            var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
            order_cost = parseFloat(order_cost).toFixed(8);

            var mainmargin = contractdetails[index].maint_margin / 100;
            var firstcurrency = contractdetails[index].first_currency;
            if (req.body.buyorsell == "buy") {
              var Liqprice =
                (price * req.body.leverage) /
                (req.body.leverage + 1 - mainmargin * req.body.leverage);
            } else {
              var Liqprice =
                (parseFloat(price) * parseFloat(req.body.leverage)) /
                (parseFloat(req.body.leverage) -
                  1 +
                  parseFloat(mainmargin) * parseFloat(req.body.leverage));
            }

            if (req.body.price < 0.001) {
              return res.json({
                status: false,
                message: "Price of contract must not be lesser than 0.001",
                notify_show: "yes",
              });
            }
            else if (parseFloat(quantity) < parseFloat(minquantity)) {
              return res.json({
                status: false,
                message:
                  "Quantity of contract must not be lesser than " + minquantity,
                notify_show: "yes",
              });
            }
            else if (parseFloat(quantity) > parseFloat(maxquantity)) {
              return res.json({
                status: false,
                message:
                  "Quantity of contract must not be higher than " + maxquantity,
                notify_show: "yes",
              });
            }
            // else if(ordertype=='Limit' && buyorsell=="buy" && parseFloat(req.body.price) > parseFloat(markprice))
            // {
            //     return res.json({
            //     status:false,
            //     message:"Entry price you set must be lower or equal to "+markprice,
            //     notify_show:'yes'
            //     });
            // }
            // else if(ordertype=='Limit' && buyorsell=="sell" && parseFloat(req.body.price) < parseFloat(markprice))
            // {
            //   //console.log("inside the sell elsif");
            //     return res.json({
            //     status:false,
            //     message:"Entry price you set must be higher or equal to "+markprice,
            //     notify_show:'yes'
            //     });
            // }
            else if (
              ordertype == "Limit" &&
              buyorsell == "buy" &&
              parseFloat(Liqprice) > parseFloat(price)
            ) {
              return res.json({
                status: false,
                message:
                  "Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be above Mark Price if the order is fulfilled.",
                notify_show: "yes",
              });
            } else if (
              ordertype == "Limit" &&
              buyorsell == "sell" &&
              parseFloat(Liqprice) < parseFloat(price)
            ) {
              return res.json({
                status: false,
                message:
                  "Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be beloww Mark Price if the order is fulfilled.",
                notify_show: "yes",
              });
            } else {
              var balance_check = true;
              var profitnloss = 0;
              if (req.body.buyorsell == "buy") {

                if (position_details < 0 && Math.abs(position_details) < parseFloat(quantity)) {
                  let detective_qty = Math.abs(quantity) - parseFloat(position_details)
                  let single_order_cost = order_cost / parseFloat(quantity);
                  order_cost = single_order_cost * detective_qty;
                }
                //console.log("----------1")

                if (
                  position_details < 0 &&
                  Math.abs(position_details) >= (parseFloat(quantity) + Math.abs(usersidequant))
                ) {
                  var balance_check = false;
                }

                if (
                  position_details > 0 &&
                  buyorsell == "sell" &&
                  Math.abs(position_details) >= (parseFloat(quantity) + Math.abs(usersidequant))
                ) {
                  //console.log("----------2")
                  var balance_check = false;
                  var profitnlossusd =
                    parseFloat(price) - parseFloat(position_price);
                  var profitnlossusd =
                    parseFloat(profitnlossusd) * parseFloat(position_details);

                  var profitnloss =
                    parseFloat(profitnlossusd) / parseFloat(position_price);
                } else if (
                  position_details < 0 &&
                  buyorsell == "buy" &&
                  Math.abs(position_details) >= (parseFloat(quantity) + Math.abs(usersidequant))
                ) {
                  //console.log("----------3")
                  //console.log(position_price);
                  //console.log(price);
                  var balance_check = false;
                  var profitnlossusd =
                    parseFloat(position_price) - parseFloat(price);
                  var profitnlossusd =
                    parseFloat(profitnlossusd) *
                    parseFloat(Math.abs(position_details));

                  var profitnloss =
                    parseFloat(profitnlossusd) / parseFloat(position_price);
                }
              } else {
                if (position_details > 0 && buyorsell == "sell" && Math.abs(position_details) < parseFloat(quantity)) {
                  let detective_qty = Math.abs(quantity) - parseFloat(position_details)
                  let single_order_cost = order_cost / parseFloat(quantity);
                  order_cost = single_order_cost * detective_qty;
                }
                if (
                  position_details > 0 &&
                  buyorsell == "sell" &&
                  Math.abs(position_details) >= (parseFloat(quantity) + Math.abs(usersidequant))
                ) {
                  //console.log("----------4")
                  var balance_check = false;
                  var profitnlossusd =
                    parseFloat(price) - parseFloat(position_price);
                  var profitnlossusd =
                    parseFloat(profitnlossusd) * parseFloat(position_details);

                  var profitnloss =
                    parseFloat(profitnlossusd) / parseFloat(position_price);
                } else if (
                  position_details < 0 &&
                  buyorsell == "buy" &&
                  Math.abs(position_details) >= (parseFloat(quantity) + Math.abs(usersidequant))
                ) {
                  //console.log("----------5")
                  var balance_check = false;
                  var profitnlossusd =
                    parseFloat(price) - parseFloat(position_price);
                  var profitnlossusd =
                    parseFloat(profitnlossusd) * parseFloat(position_details);

                  var profitnloss =
                    parseFloat(profitnlossusd) / parseFloat(position_price);
                }
                quantity = parseFloat(quantity) * -1;
              }
              if (err) {
                //console.log("----err", err)
                res.json({
                  status: false,
                  message: "Error occured.",
                  err: err,
                  notify_show: "yes",
                });
              } else {
                Assets.findOne(
                  { userId: ObjectId(req.body.userid), currencySymbol: "BTC" },
                  function (err, assetdetails) {
                    if (err) {
                      //console.log("----err22", err)
                      res.json({
                        status: false,
                        message: "Error occured.",
                        err: err,
                        notify_show: "yes",
                      });
                    } else if (assetdetails) {
                      var firstcurrency = contractdetails[index].first_currency;
                      var secondcurrency =
                        contractdetails[index].second_currency;
                      var curbalance = parseFloat(assetdetails.balance);
                      if (curbalance < order_cost && balance_check == true) {
                        res.json({
                          status: false,
                          message:
                            "Due to insuffient balance order cannot be placed",
                          notify_show: "yes",
                        });
                      } else {
                        var before_reduce_bal = assetdetails.balance;
                        // if(firstcurrency=='BTC')
                        // {
                        if (order_cost <= assetdetails.balance) {
                          var after_reduce_bal =
                            parseFloat(assetdetails.balance) -
                            parseFloat(order_cost);
                        }

                        if (balance_check) {
                          var updateObj = { balance: after_reduce_bal };
                        } else {
                          var updateObj = { balance: before_reduce_bal };
                        }

                        //console.log("------balance_check", balance_check)
                        //console.log("------updateObj", updateObj)
                        var userid = req.body.userid;
                        //console.log("updateObj", updateObj);
                        Assets.findByIdAndUpdate(
                          assetdetails._id,
                          updateObj,
                          { new: true },
                          function (err, changed) {
                            if (err) {
                              //console.log("----err3", err)
                              res.json({
                                status: false,
                                message: "Error occured.",
                                err: err,
                                notify_show: "yes",
                              });
                            } else if (changed) {
                              var float = req.body.pairname == "XRPUSD" ? 4 : 2;
                              const newtradeTable = new tradeTable({
                                quantity: parseFloat(quantity).toFixed(8),
                                price: parseFloat(price).toFixed(float),
                                trigger_price: trigger_price,
                                orderCost: order_cost,
                                orderValue: order_value,
                                leverage: req.body.leverage,
                                userId: req.body.userid,
                                pair: contractdetails[index]._id,
                                pairName: req.body.pairname,
                                postOnly: post_only,
                                reduceOnly: reduce_only,
                                beforeBalance: before_reduce_bal,
                                afterBalance: (balance_check) ? after_reduce_bal : before_reduce_bal,
                                timeinforcetype: timeinforcetype,
                                firstCurrency: firstcurrency,
                                secondCurrency: secondcurrency,
                                Liqprice: Liqprice,
                                orderType: ordertype,
                                trigger_type: trigger_type,
                                buyorsell: buyorsell,
                                btcprice: btcprice,
                                taker_fees: taker_fees,
                                orderDate: new Date(),
                                status: trigger_type != null ? 4 : 0, // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
                              });
                              newtradeTable
                                .save()
                                .then((curorder) => {
                                  // write_log("\n"+JSON.stringify({date:new Date(),process:"orderplacing",result:curorder}));
                                  var io = req.app.get("socket");
                                  if (typeof io != "undefined") {
                                    socketio.sockets
                                      .in(req.body.userid.toString())
                                      .emit("TRADE", curorder);
                                  }
                                  res.json({
                                    status: true,
                                    message: "Your order placed successfully.",
                                    notify_show: "yes",
                                  });
                                  if (takeprofitcheck == false) {
                                    var trigger_price = takeprofit;
                                    var tptrigger_type = "Mark";
                                    var newbuyorsell =
                                      buyorsell == "buy" ? "sell" : "buy";
                                    order_placing(
                                      ordertype,
                                      newbuyorsell,
                                      price,
                                      quantity,
                                      leverage,
                                      req.body.pairname,
                                      req.body.userid,
                                      trigger_price,
                                      tptrigger_type,
                                      curorder._id,
                                      "takeprofit"
                                    );
                                  }
                                  // //console.log(profitnloss,'profitnloss')
                                  // //console.log(balance_check,'balance_check')
                                  if (stopcheck == false) {
                                    var stoptrigger_type = "Mark";
                                    var trigger_price = stopprice;
                                    var newbuyorsell =
                                      buyorsell == "buy" ? "sell" : "buy";
                                    order_placing(
                                      ordertype,
                                      newbuyorsell,
                                      price,
                                      quantity,
                                      leverage,
                                      req.body.pairname,
                                      req.body.userid,
                                      trigger_price,
                                      stoptrigger_type,
                                      curorder._id,
                                      "stop"
                                    );
                                  }
                                  // //console.log(balance_check,'balance_check')
                                  // //console.log(profitnloss,'profitnloss')

                                  tradematching(
                                    curorder,
                                    io,
                                    balance_check,
                                    profitnloss
                                  );
                                })
                                .catch((err) => {
                                  //console.log(err, "error");
                                  res.json({
                                    status: false,
                                    message: "Your order not placed.",
                                    notify_show: "yes",
                                  });
                                });
                              ``;
                            }
                          }
                        );
                        // insert trade tab
                      }
                    } else {
                      //console.log("err4")
                      res.json({
                        status: false,
                        message: "Error occured.",
                        err: "no res 2",
                        notify_show: "yes",
                      });
                    }
                  }
                );
              }
            }
          }
        );
      }
    );
  }
});

function selldetailsupdate(
  tempdata,
  buyorderid,
  buyUpdate,
  sellorderid,
  sellUpdate,
  selluserid,
  buyprice,
  maker_rebate,
  io,
  sellerforced_liquidation,
  sellleverage,
  buyOrder,
  callBackOne
) {
  // //console.log(tempdata,'selltempdataprev')
  var buyuserid = tempdata.user_id;
  if (callBackOne) {
    tradeinfo.callBacksellTrade = callBackOne;
  }
  async.waterfall(
    [
      function (callback) {
        tradeTable.findOneAndUpdate(
          { _id: ObjectId(buyorderid) },
          {
            $set: { status: buyUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(buyUpdate.filledAmt) },
          },
          { new: true, fields: { status: 1, filled: 1 } },
          function (buytemp_err, buytempData1) {
            if (buytempData1) {
              callback(null, buytempData1);
            }
          }
        );
      },
      function (data, callback) {
        var order_value1 = parseFloat(sellUpdate.filledAmt * buyprice).toFixed(
          8
        );
        var order_value = parseFloat(order_value1 / buyOrder.btcprice).toFixed(
          8
        );
        var required_margin = parseFloat(order_value1) / sellleverage;
        var fee = (parseFloat(order_value1) * buyOrder.taker_fees) / 100;
        var margininbtc =
          parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);

        var fee_amount = feeinbtc;
        tempdata.Type = "sell";
        tempdata.user_id = ObjectId(selluserid);
        tempdata.order_cost = parseFloat(order_cost).toFixed(8);
        tempdata.forced_liquidation = sellerforced_liquidation;
        tempdata.Fees = parseFloat(fee_amount).toFixed(8);
        tempdata.filledAmount = +sellUpdate.filledAmt.toFixed(8) * -1;
        tempdata.afterBalance = buyOrder.afterBalance;
        tempdata.beforeBalance = buyOrder.beforeBalance;
        tempdata.uniqueid = Math.floor(Math.random() * 1000000000);
        // //console.log(tempdata,'selltempdatanext')
        tempdata.order_value = order_value;
        //console.log(sellUpdate.status, "sellUpdate.status");
        tradeTable.findOneAndUpdate(
          { _id: ObjectId(sellorderid) },
          {
            $set: { status: sellUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(sellUpdate.filledAmt * -1) },
          },
          { new: true, fields: { status: 1, filled: 1 } },
          function (buytemp_err, selltempData) {
            if (selltempData) {
              positionmatching(data.filled[data.filled.length - 1]);
              positionmatching(
                selltempData.filled[selltempData.filled.length - 1]
              );
              callback(null, selltempData);
            }
          }
        );
      },
    ],
    function (err, result) {
      tradeinfo.callBacksellTrade();
      //Bonus updation
      FeeTable.findOne({}).exec(function (err, bonusdetails) {
        // //console.log(bonusdetails,'bonusdetails')
        if (bonusdetails) {
          var trade_bonus = bonusdetails.trade_bonus;
          var updatebonusdata = {};
          updatebonusdata["tempcurrency"] = trade_bonus;
          Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(selluserid) },
            { $inc: updatebonusdata },
            { new: true, fields: { balance: 1 } },
            function (balerr, baldata) {
              //console.log(balerr, "bale");
              //console.log(baldata, "bale");
              const newBonus = new Bonus({
                userId: selluserid,
                bonus_amount: trade_bonus,
                type: "4",
              });
              newBonus.save(function (err, data) {
                // //console.log(err,'err')
                // //console.log(data,'data')
              });
            }
          );

          Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(buyuserid) },
            { $inc: updatebonusdata },
            { new: true, fields: { balance: 1 } },
            function (balerr, baldata) {
              //console.log(balerr, "bale");
              //console.log(baldata, "bale");
              const newBonus = new Bonus({
                userId: buyuserid,
                bonus_amount: trade_bonus,
                type: "4",
              });
              newBonus.save(function (err, data) {
                // //console.log(err,'err')
                // //console.log(data,'data')
              });
            }
          );
        }
      });
      //socket call
      setTimeout(function () {
        gettradedata(
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency,
          socketio
        );
        getusertradedata(
          result.filled[0].selluserId,
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency
        );
        getusertradedata(
          result.filled[0].buyuserId,
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency
        );
      }, 3000);

      tradeTable.findOneAndUpdate(
        { pairid: buyorderid, status: "4", stopstatus: "1" },
        { $set: { stopstatus: "2" } },
        { new: true, fields: { status: 1 } },
        function (buytemp_err, buytempData) { }
      );

      tradeTable.findOneAndUpdate(
        { pairid: sellorderid, status: "4", stopstatus: "1" },
        { $set: { stopstatus: "2" } },
        { new: true, fields: { status: 1 } },
        function (buytemp_err, buytempData) { }
      );

      tradeTable.find({ status: "4", trigger_type: "Last" }, function (
        buytemp_err,
        buytempData
      ) {
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
            // //console.log(trigger_price,'trigger_price');
            // //console.log(buyprice,'buyprice');
            if (different > 0) {
              if (
                trailstop == "0" &&
                parseFloat(trigger_price) > parseFloat(buyprice)
              ) {
                // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  { $set: { status: "0" } },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
            } else {
              if (
                trailstop == "0" &&
                parseFloat(trigger_price) < parseFloat(buyprice)
              ) {
                //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  { $set: { status: "0" } },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
            }
            //trailing stop trigger
            if (
              trailstop == "1" &&
              buyorsell == "buy" &&
              parseFloat(price) > parseFloat(buyprice)
            ) {
              var addprice = parseFloat(buyprice) - parseFloat(price);
              var newtriggerprice =
                parseFloat(trigger_price) + parseFloat(addprice);
              tradeTable.findOneAndUpdate(
                { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                {
                  $set: {
                    price: newtriggerprice,
                    trigger_price: newtriggerprice,
                  },
                },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
            if (
              trailstop == "1" &&
              buyorsell == "buy" &&
              parseFloat(trigger_price) < parseFloat(buyprice)
            ) {
              tradeTable.findOneAndUpdate(
                { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
            if (
              trailstop == "1" &&
              buyorsell == "sell" &&
              parseFloat(price) < parseFloat(buyprice)
            ) {
              var addprice = parseFloat(price) - parseFloat(buyprice);
              var newtriggerprice =
                parseFloat(trigger_price) - parseFloat(addprice);
              tradeTable.findOneAndUpdate(
                { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                {
                  $set: {
                    price: newtriggerprice,
                    trigger_price: newtriggerprice,
                  },
                },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
            if (
              trailstop == "1" &&
              buyorsell == "sell" &&
              parseFloat(trigger_price) > parseFloat(buyprice)
            ) {
              tradeTable.findOneAndUpdate(
                { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
          }
        }
      });
    }
  );
}
function buydetailsupdate(
  tempdata,
  buyorderid,
  buyUpdate,
  sellorderid,
  sellUpdate,
  selluserid,
  buyprice,
  maker_rebate,
  io,
  sellforced_liquidation,
  sellleverage,
  sellOrder,
  callBackOne
) {
  var buyuserid = tempdata.user_id;
  // //console.log(tempdata,'tempdataii')
  if (callBackOne) {
    tradeinfo.callBackbuyTrade = callBackOne;
  }
  async.waterfall(
    [
      function (callback) {
        tradeTable.findOneAndUpdate(
          { _id: ObjectId(buyorderid) },
          {
            $set: { status: buyUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: buyUpdate.filledAmt },
          },
          { new: true, fields: { filled: 1 } },
          function (buytemp_err, buytempData) {
            if (buytempData) {
              callback(null, buytempData);
            }
          }
        );
      },
      function (data, callback) {
        var order_value1 = parseFloat(sellUpdate.filledAmt * buyprice).toFixed(
          8
        );
        var order_value = parseFloat(order_value1 / sellOrder.btcprice).toFixed(
          8
        );
        var required_margin = parseFloat(order_value1) / sellleverage;
        var fee = (parseFloat(order_value1) * sellOrder.taker_fees) / 100;
        var margininbtc =
          parseFloat(required_margin) / parseFloat(sellOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(sellOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);

        var fee_amount = feeinbtc;
        tempdata.Type = "sell";
        tempdata.user_id = ObjectId(selluserid);
        tempdata.order_cost = order_cost;
        tempdata.forced_liquidation = sellforced_liquidation;
        tempdata.filledAmount = sellUpdate.filledAmt * -1;
        tempdata.Fees = parseFloat(fee_amount).toFixed(8);
        tempdata.beforeBalance = sellOrder.beforeBalance;
        tempdata.afterBalance = sellOrder.afterBalance;
        tempdata.order_value = order_value;
        tempdata.uniqueid = Math.floor(Math.random() * 1000000000);
        // //console.log(tempdata,'tempdatanext')
        tradeTable.findOneAndUpdate(
          { _id: ObjectId(sellorderid) },
          {
            $set: { status: sellUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(sellUpdate.filledAmt) * -1 },
          },
          { new: true, fields: { filled: 1 } },
          function (selltemp_err, selltempData) {
            if (selltempData) {
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              positionmatching(data.filled[data.filled.length - 1]);
              positionmatching(
                selltempData.filled[selltempData.filled.length - 1]
              );
              callback(null, selltempData);
            }
          }
        );
      },
    ],
    function (err, result) {
      tradeinfo.callBackbuyTrade();
      //Bonus updation
      FeeTable.findOne({}).exec(function (err, bonusdetails) {
        // //console.log(bonusdetails,'bonusdetails')
        if (bonusdetails) {
          var trade_bonus = bonusdetails.trade_bonus;
          var updatebonusdata = {};
          updatebonusdata["tempcurrency"] = trade_bonus;
          Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(selluserid) },
            { $inc: updatebonusdata },
            { new: true, fields: { balance: 1 } },
            function (balerr, baldata) {
              //console.log(balerr, "bale");
              //console.log(baldata, "bale");
              const newBonus = new Bonus({
                userId: selluserid,
                bonus_amount: trade_bonus,
                type: "4",
              });
              newBonus.save(function (err, data) {
                // //console.log(err,'err')
                // //console.log(data,'data')
              });
            }
          );

          Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(buyuserid) },
            { $inc: updatebonusdata },
            { new: true, fields: { balance: 1 } },
            function (balerr, baldata) {
              //console.log(balerr, "bale");
              //console.log(baldata, "bale");
              const newBonus = new Bonus({
                userId: buyuserid,
                bonus_amount: trade_bonus,
                type: "4",
              });
              newBonus.save(function (err, data) {
                // //console.log(err,'err')
                // //console.log(data,'data')
              });
            }
          );
        }
      });

      //socket call
      setTimeout(function () {
        gettradedata(
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency,
          socketio
        );
        getusertradedata(
          result.filled[0].selluserId,
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency
        );
        getusertradedata(
          result.filled[0].buyuserId,
          result.filled[0].firstCurrency,
          result.filled[0].secondCurrency
        );
      }, 3000);

      tradeTable.findOneAndUpdate(
        { pairid: buyorderid, status: "4", stopstatus: "1" },
        { $set: { stopstatus: "2" } },
        { new: true, fields: { status: 1 } },
        function (buytemp_err, buytempData) { }
      );

      tradeTable.findOneAndUpdate(
        { pairid: sellorderid, status: "4", stopstatus: "1" },
        { $set: { stopstatus: "2" } },
        { new: true, fields: { status: 1 } },
        function (buytemp_err, buytempData) { }
      );

      tradeTable
        .find({ status: "4", trigger_type: "Last" })
        .limit(10, function (buytemp_err, buytempData) {
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
              // //console.log(trigger_price,'trigger_price');
              // //console.log(buyprice,'buyprice');
              if (different > 0) {
                if (
                  trailstop == "0" &&
                  parseFloat(trigger_price) > parseFloat(buyprice)
                ) {
                  // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                  tradeTable.findOneAndUpdate(
                    {
                      _id: ObjectId(_id),
                      status: "4",
                      stopstatus: { $ne: "1" },
                    },
                    { $set: { status: "0" } },
                    { new: true, fields: { status: 1 } },
                    function (buytemp_err, buytempData) {
                      // //console.log(buytemp_err,'trigger error');
                    }
                  );
                }
              } else {
                if (
                  trailstop == "0" &&
                  parseFloat(trigger_price) < parseFloat(buyprice)
                ) {
                  //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
                  tradeTable.findOneAndUpdate(
                    {
                      _id: ObjectId(_id),
                      status: "4",
                      stopstatus: { $ne: "1" },
                    },
                    { $set: { status: "0" } },
                    { new: true, fields: { status: 1 } },
                    function (buytemp_err, buytempData) {
                      // //console.log(buytemp_err,'trigger error');
                    }
                  );
                }
              }
              //trailing stop trigger
              if (
                trailstop == "1" &&
                buyorsell == "buy" &&
                parseFloat(price) > parseFloat(buyprice)
              ) {
                var addprice = parseFloat(buyprice) - parseFloat(price);
                var newtriggerprice =
                  parseFloat(trigger_price) + parseFloat(addprice);
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  {
                    $set: {
                      price: newtriggerprice,
                      trigger_price: newtriggerprice,
                    },
                  },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
              if (
                trailstop == "1" &&
                buyorsell == "buy" &&
                parseFloat(trigger_price) < parseFloat(buyprice)
              ) {
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  { $set: { status: "0" } },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
              if (
                trailstop == "1" &&
                buyorsell == "sell" &&
                parseFloat(price) < parseFloat(buyprice)
              ) {
                var addprice = parseFloat(price) - parseFloat(buyprice);
                var newtriggerprice =
                  parseFloat(trigger_price) - parseFloat(addprice);
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  {
                    $set: {
                      price: newtriggerprice,
                      trigger_price: newtriggerprice,
                    },
                  },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
              if (
                trailstop == "1" &&
                buyorsell == "sell" &&
                parseFloat(trigger_price) > parseFloat(buyprice)
              ) {
                tradeTable.findOneAndUpdate(
                  { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
                  { $set: { status: "0" } },
                  { new: true, fields: { status: 1 } },
                  function (buytemp_err, buytempData) {
                    // //console.log(buytemp_err,'trigger error');
                  }
                );
              }
            }
          }
        });
    }
  );
}

async function buymatchingprocess(curorder, tradedata, pairData, io) {
  // //console.log("buy");
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
  // tradedata.forEach(function(data_loop){
  // for (var i = 0; i < tradedata.length; i++) {
  await Promise.all(
    tradedata.map(async (file) => {
      var data_loop = file;
      buyAmt = rounds(buyOrder.quantity - buytempamount);
      if (buyAmt == 0 || forceBreak == true) {
        // //console.log("break");
        return;
      } else {
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
          orderSocket = {};
        buyeramount = buyeramount - sellAmt;
        // //console.log(buyAmt,"buyAmt");
        // //console.log(Math.abs(sellAmt),"sellAmt");
        if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
          // //console.log("amount eq");
          buyUpdate = {
            status: "1",
            filledAmt: Math.abs(sellAmt),
          };
          sellUpdate = {
            status: "1",
            filledAmt: buyAmt,
          };
          forceBreak = true;
        } else if (Math.abs(buyAmt) > Math.abs(sellAmt)) {
          // //console.log("else buy gt");
          buyUpdate = {
            status: "2",
            filledAmt: Math.abs(sellAmt),
          };
          sellUpdate = {
            status: "1",
            filledAmt: Math.abs(sellAmt),
          };
          buyAmt = rounds(+buyAmt - +sellAmt);
        } else if (Math.abs(buyAmt) < Math.abs(sellAmt)) {
          // //console.log("else sell gt");
          buyUpdate = {
            status: "1",
            filledAmt: buyAmt,
          };
          sellUpdate = {
            status: "2",
            filledAmt: buyAmt,
          };
          forceBreak = true;
        } else {
          silentBreak = true;
        }

        if (silentBreak == false) {
          var order_value1 = parseFloat(
            buyUpdate.filledAmt * buyOrder.price
          ).toFixed(8);
          var order_value = parseFloat(
            order_value1 / buyOrder.btcprice
          ).toFixed(8);
          var required_margin = parseFloat(order_value1) / buyleverage;
          var fee = (parseFloat(order_value1) * pairData.taker_fees) / 100;
          var margininbtc =
            parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
          var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
          var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
          order_cost = parseFloat(order_cost).toFixed(8);

          // //console.log("si brk");
          var taker_fee = pairData.taker_fees;
          var fee_amount = feeinbtc;
          var tempdata = {
            pair: ObjectId(pairData._id),
            firstCurrency: pairData.first_currency,
            secondCurrency: pairData.second_currency,
            buyuserId: ObjectId(buyuserid),
            user_id: ObjectId(buyuserid),
            selluserId: ObjectId(selluserid),
            sellId: ObjectId(sellorderid),
            buyId: ObjectId(buyorderid),
            filledAmount: +buyUpdate.filledAmt.toFixed(8),
            Price: +buyOrder.price,
            forced_liquidation: buyforced_liquidation,
            pairname: curorder.pairName,
            order_cost: order_cost,
            Fees: parseFloat(fee_amount).toFixed(8),
            status: "filled",
            Type: "buy",
            created_at: new Date(),
            beforeBalance: curorder.beforeBalance,
            afterBalance: curorder.afterBalance,
            order_value: order_value,
          };
          buytempamount += +buyUpdate.filledAmt;

          await buydetailsupdate(
            tempdata,
            buyorderid,
            buyUpdate,
            sellorderid,
            sellUpdate,
            selluserid,
            sellOrder.price,
            pairData.maker_rebate,
            io,
            sellforced_liquidation,
            sellleverage,
            sellOrder
          );
          // if (
          //   tradedata.length == i &&
          //   forceBreak != true &&
          //   curorder.timeinforcetype == "ImmediateOrCancel"
          // ) {
          //   cancel_trade(curorder._id, curorder.userId);
          // }
          // positionmatching(data_loop);
          if (forceBreak == true) {
            // //console.log('forceBreak')
            return true;
          }
        }
      }
    })
  );
}

async function sellmatchingprocess(curorder, tradedata, pairData, io) {
  var sellOrder = curorder,
    sellorderid = sellOrder._id,
    selluserid = sellOrder.userId,
    sellleverage = sellOrder.leverage,
    sellAmt = rounds(Math.abs(sellOrder.quantity)),
    forceBreak = false,
    selleramount = rounds(sellOrder.quantity);
  selleramount1 = rounds(sellOrder.quantity);
  sellerforced_liquidation = sellOrder.forced_liquidation;
  selltempamount = 0;
  sell_res_len = tradedata.length;
  //console.log(sell_res_len, "sell_res_len");
  // for (var i = 0; i < tradedata.length; i++) {
  await Promise.all(
    tradedata.map(async (file) => {
      var data_loop = file;
      sellAmt = rounds(Math.abs(sellOrder.quantity) - selltempamount);
      // //console.log('loop starting',i);
      if (sellAmt == 0 || forceBreak == true) return;

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
        orderSocket = {};
      selleramount = selleramount - buyAmt;

      //console.log(Math.abs(sellAmt), "sellamount");
      //console.log(buyAmt, "buyamount");
      if (Math.abs(sellAmt) == Math.abs(buyAmt)) {
        //console.log("equal");
        buyUpdate = {
          status: 1,
          filledAmt: Math.abs(sellAmt),
        };
        sellUpdate = {
          status: 1,
          filledAmt: buyAmt,
        };
        forceBreak = true;
      } else if (Math.abs(sellAmt) > Math.abs(buyAmt)) {
        //console.log("gr");
        buyUpdate = {
          status: 1,
          filledAmt: buyAmt,
        };
        sellUpdate = {
          status: 2,
          filledAmt: buyAmt,
        };
        sellAmt = rounds(+sellAmt - +buyAmt);
      } else if (Math.abs(sellAmt) < Math.abs(buyAmt)) {
        //console.log("less");
        buyUpdate = {
          status: 2,
          filledAmt: Math.abs(sellAmt),
        };
        sellUpdate = {
          status: 1,
          filledAmt: Math.abs(sellAmt),
        };
        forceBreak = true;
      } else {
        silentBreak = true;
      }
      var returnbalance = 0;
      if (+buyOrder.price > +sellOrder.price) {
        var return_price = +buyOrder.price - +sellOrder.price;
        returnbalance = +buyUpdate.filledAmt * +return_price;
        returnbalance = parseFloat(returnbalance).toFixed(8);
      }

      if (silentBreak == false) {
        var order_value1 = parseFloat(
          buyUpdate.filledAmt * sellOrder.price
        ).toFixed(8);
        var order_value = parseFloat(order_value1 / sellOrder.btcprice).toFixed(
          8
        );
        var required_margin = parseFloat(order_value1) / buyleverage;
        var fee = (parseFloat(order_value1) * pairData.taker_fees) / 100;
        var margininbtc =
          parseFloat(required_margin) / parseFloat(sellOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(sellOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);

        //console.log(curorder.afterBalance, "curorder.afterBalance");
        //console.log(curorder.beforeBalance, "curorder.beforeBalance");
        var taker_fee = pairData.taker_fees;
        var fee_amount = feeinbtc;
        var tempdata = {
          pair: ObjectId(pairData._id),
          firstCurrency: pairData.first_currency,
          secondCurrency: pairData.second_currency,
          forced_liquidation: buyforced_liquidation,
          buyuserId: ObjectId(buyuserid),
          user_id: ObjectId(buyuserid),
          selluserId: ObjectId(selluserid),
          sellId: ObjectId(sellorderid),
          buyId: ObjectId(buyorderid),
          filledAmount: +buyUpdate.filledAmt.toFixed(8),
          Price: +sellOrder.price,
          pairname: curorder.pairName,
          order_cost: order_cost,
          status: "filled",
          Type: "buy",
          Fees: parseFloat(fee_amount).toFixed(8),
          created_at: new Date(),
          beforeBalance: buyOrder.beforeBalance,
          afterBalance: buyOrder.afterBalance,
          order_value: order_value,
        };
        selltempamount += +sellUpdate.filledAmt;
        // //console.log(tempdata,'before sell update');

        selldetailsupdate(
          tempdata,
          buyorderid,
          buyUpdate,
          sellorderid,
          sellUpdate,
          selluserid,
          sellOrder.price,
          pairData.maker_rebate,
          io,
          sellerforced_liquidation,
          sellleverage,
          curorder
        );
        if (
          tradedata.length == i &&
          forceBreak != true &&
          curorder.timeinforcetype == "ImmediateOrCancel"
        ) {
          cancel_trade(curorder._id, curorder.userId);
        }
        if (forceBreak == true) {
          // //console.log("true");
          // getrateandorders(curorder.pair,userid);
          return true;
        }
      }
      if (forceBreak == true) {
        // getrateandorders(curorder.pair,userid);
        return true;
      }
    })
  );
}
router.post("/DerivativebotTradeOrderplacing", (req, res) => {
  if (!req.body.pair) {
    return res.json({ status: true, message: "Please Select the Pair" })
  }
  perpetual.find({ $or: [{ tiker_root: req.body.pair.value }, { tiker_root: "BTCUSD" }] },
    function (err, contractdetailstable) {
      // //console.log("contractdetailstable",contractdetailstable);
      var index = contractdetailstable.findIndex(
        (x) => x.tiker_root === req.body.pair.value
      );
      var btcindex = contractdetailstable.findIndex(
        (x) => x.tiker_root === "BTCUSD"
      );

      var tradeprice = 0
      var randomprice
      var markprice = parseFloat(contractdetailstable[index].markprice)

      if (req.body.tradeprice) {
        tradeprice = parseFloat(req.body.tradeprice)
      }
      randomprice = tradeprice

      if (!req.body.tradequantity) {
        return res.json({ status: true, message: "Please Enter the Quantity" })
      }
      if (!req.body.buyorsell) {
        return res.json({ status: true, message: "Please Select the BUY/SELL" })
      }
      if (!req.body.ordertypechange) {
        return res.json({ status: true, message: "Please Select the Limit/Market" })
      }
      var ordertype = req.body.ordertypechange.value;
      var buyorsell = req.body.buyorsell.value


      if (buyorsell == "buy" && parseFloat(randomprice) > parseFloat(markprice) && ordertype == "Limit") {
        // //console.log("inside if");
        return res.json({ status: true, message: "Please Enter  the price below " + markprice })
      }
      if (buyorsell == "sell" && parseFloat(randomprice) < parseFloat(markprice) && ordertype == "Limit") {
        return res.json({ status: true, message: "Please Enter  the price above " + markprice })
      }

      var pairname = contractdetailstable[index].tiker_root;
      // var randomprice;
      var highpricetable = contractdetailstable[index].high;
      var lowpricetable = contractdetailstable[index].low
      var useridstatic = ObjectId("5f11301062c7e3584e61ec88")
      var maxdbleverage = contractdetailstable[index].leverage
      var randomleverage = Math.random() * (+maxdbleverage - +1) + +1;
      var dbmarkprice = contractdetailstable[index].markprice
      var randommulti = Math.random() * (+0.001 - +0.002) + +0.002
      var randomquantity = parseFloat(req.body.tradequantity)

      var timeinforcetype = "GoodTillCancelled";
      var trigger_price = 0;
      var trigger_type = null;
      var position_price = 0
      var position_details = 0

      var btcprice = contractdetailstable[btcindex].markprice;
      // var btcprice = 0
      var maxquantity = contractdetailstable[index].maxquantity;
      var minquantity = contractdetailstable[index].minquantity;
      var taker_fees = contractdetailstable[index].taker_fees;
      var leverage = parseFloat(randomleverage);
      var order_value1 = parseFloat(randomquantity * randomprice).toFixed(8);
      //console.log("ordervalue 1", order_value1);
      var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
      //console.log("ordervaluee", order_value);
      var required_margin = parseFloat(order_value1) / leverage;
      var fee = (parseFloat(order_value1) * taker_fees) / 100;
      var margininbtc =
        parseFloat(required_margin) / parseFloat(btcprice);
      var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
      var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
      order_cost = parseFloat(order_cost).toFixed(8);
      var mainmargin = parseFloat(contractdetailstable[index].maint_margin) / 100;
      var firstcurrency = contractdetailstable[index].first_currency;

      if (buyorsell == "buy") {
        var Liqprice =
          (randomprice * randomleverage) /
          (randomleverage + 1 - mainmargin * randomleverage);
      } else {
        var Liqprice =
          (parseFloat(randomprice) * parseFloat(randomleverage)) /
          (parseFloat(randomleverage) -
            1 +
            parseFloat(mainmargin) * parseFloat(randomleverage));
      }
      var balance_check = true;
      var profitnloss = 0;
      if (buyorsell == "buy") {
        if (
          position_details < 0 &&
          Math.abs(position_details) >= randomquantity
        ) {
          var balance_check = false;
        }
      } else {

        randomquantity = parseFloat(randomquantity) * -1;
      }

      var before_reduce_bal = 0
      var after_reduce_bal = 0

      var float = pairname == "XRPUSD" ? 4 : 2;
      const newtradeTable = new tradeTable({
        quantity: parseFloat(randomquantity).toFixed(8),
        price: parseFloat(randomprice).toFixed(float),
        trigger_price: trigger_price,
        orderCost: order_cost,
        orderValue: order_value,
        leverage: randomleverage,
        userId: useridstatic,
        pair: contractdetailstable[index]._id,
        pairName: pairname,
        beforeBalance: before_reduce_bal,
        afterBalance: after_reduce_bal,
        timeinforcetype: timeinforcetype,
        firstCurrency: contractdetailstable[index].first_currency,
        secondCurrency: contractdetailstable[index].second_currency,
        Liqprice: Liqprice,
        orderType: ordertype,
        trigger_type: trigger_type,
        buyorsell: buyorsell,
        btcprice: btcprice,
        taker_fees: taker_fees,
        status: trigger_type != null ? 4 : 0, // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
      });
      newtradeTable
        .save()
        .then((curorder) => {
          // write_log("\n"+JSON.stringify({date:new Date(),process:"orderplacing",result:curorder}));
          //console.log("placed ordere");

          tradematching(curorder);

          return res.json({ status: true, message: "Order Placed Succesfully" })
        })
        .catch((err) => {
          //console.log(err, "error");

        });




    })

})

const tradematching = async (curorder, io, balance_check = true, profitnloss = 0) => {
  //console.log("tradematching")
  //console.log("curorder-----", curorder)
  let isFillOrKill_Match = true;
  //Fill or kill order type
  //Fill or kill order type
  if (curorder.timeinforcetype == "FillOrKill") {
    //console.log('filleorkill');
    isFillOrKill_Match = false;
    var datas = {
      $or: [{ status: "2" }, { status: "0" }],
      userId: { $ne: ObjectId(curorder.userId) },
      pairName: curorder.pairName,
    },
      sort;

    if (curorder.buyorsell == "buy") {
      datas["buyorsell"] = "sell";
      datas["price"] = { $lte: curorder.price };
      sort = { price: 1 };
    } else {
      datas["buyorsell"] = "buy";
      datas["price"] = { $gte: curorder.price };
      sort = { price: -1 };
    }
    tradeTable
      .aggregate([
        { $match: datas },
        {
          $group: {
            _id: null,
            quantity: { $sum: "$quantity" },
            filledAmount: { $sum: "$filledAmount" },
          },
        },
        { $sort: sort },
        { $limit: 10 },
      ])
      .exec((tradeerr, tradedata) => {
        //console.log(tradedata, 'tradedata')
        //console.log(tradeerr, 'tradeerr')
        if (tradedata.length > 0) {
          var quantity = tradedata[0].quantity;
          var filledAmount = tradedata[0].filledAmount;
          var pendingamount =
            parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
          //console.log(pendingamount, 'pendingamount')
          //console.log(curorder.quantity, 'quantity')
          //console.log("----Math.abs(curorder.quantity) < pendingamount", Math.abs(curorder.quantity) < pendingamount)
          if (Math.abs(curorder.quantity) < pendingamount) {
            isFillOrKill_Match = true;
            //console.log("inside the if ")
            var quant =
              parseFloat(Math.abs(curorder.quantity)) -
              parseFloat(pendingamount);
            // if (curorder.forced_liquidation == true) {
            var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
            var newbuyorsell = curorder.buyorsell == "buy" ? "sell" : "buy";
            var quant = curorder.buyorsell == "buy" ? quant : quant * -1;
            // order_placing(
            //   curorder.orderType,
            //   newbuyorsell,
            //   curorder.price,
            //   Math.abs(quant),
            //   curorder.leverage,
            //   curorder.pairName,
            //   oppuser_id
            // );
            // } else {
            //   cancel_trade(curorder._id, curorder.userId);
            // }
          } else {
            //console.log("fill or kill cancel order")
            // cancel_trade(curorder._id, curorder.userId);
            cancel_trade_MatchedOrder(curorder._id, curorder.userId);
            isFillOrKill_Match = false;
          }
        } else {
          //console.log("fill or kill cancel order")
          // cancel_trade(curorder._id, curorder.userId);
          cancel_trade_MatchedOrder(curorder._id, curorder.userId);
          isFillOrKill_Match = false;
        }

        /* else if (curorder.forced_liquidation == false) {
         // cancel_trade(curorder._id, curorder.userId);
         cancel_trade_MatchedOrder(curorder._id, curorder.userId);
       } */
      });
  }
  if (!isFillOrKill_Match) {
    return
  }
  var datas = {
    $or: [{ status: "2" }, { status: "0" }],
    userId: { $ne: ObjectId(curorder.userId) },
    pairName: curorder.pairName,
  },
    sort;

  if (curorder.buyorsell == "buy") {
    datas["buyorsell"] = "sell";
    datas["price"] = { $lte: curorder.price };
    sort = { price: 1 };
  } else {
    datas["buyorsell"] = "buy";
    datas["price"] = { $gte: curorder.price };
    sort = { price: -1 };
  }

  const tradedata = await tradeTable.aggregate([{ $match: datas }, { $sort: sort }, { $limit: 50 }])
  //console.log("----tradedata", tradedata);
  if (tradedata && tradedata.length > 0) {
    //console.log('in trade data')
    const pairData = await perpetual.findOne({ _id: ObjectId(curorder.pair) });
    //console.log("----pairData", pairData)
    if (curorder.buyorsell == "buy") {
      var buyOrder = curorder,
        buyAmt = rounds(buyOrder.quantity),
        buyorderid = buyOrder._id,
        buyuserid = buyOrder.userId,
        buyleverage = buyOrder.leverage,
        buyforced_liquidation = buyOrder.forced_liquidation,
        buyeramount = rounds(buyOrder.quantity),
        buyeramount1 = rounds(buyOrder.quantity),
        forceBreak = false,
        buytempamount = 0;

      for (var ii = 0; ii < tradedata.length; ii++) {
        if (curorder.postOnly) {
          cancel_trade(curorder._id, curorder.userId);
        }
        //console.log(buytempamount, 'buytempamount')
        var sellOrder = tradedata[ii],
          buyAmt = Math.abs(buyOrder.quantity) - buytempamount,
          sellorderid = sellOrder._id,
          selluserid = sellOrder.userId,
          sellleverage = sellOrder.leverage,
          sellforced_liquidation = sellOrder.forced_liquidation,
          sellAmt = rounds(+Math.abs(sellOrder.quantity) - Math.abs(sellOrder.filledAmount)),
          buyUpdate = {},
          sellUpdate = {};
        //console.log(buyAmt, 'buyAmt+++')
        //console.log(sellAmt, 'sellAmt+++')
        if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
          // //console.log("amount eq");
          buyUpdate = { status: "1", filledAmt: Math.abs(sellAmt) };
          sellUpdate = { status: "1", filledAmt: buyAmt };
          forceBreak = true;

        } else if (Math.abs(buyAmt) > Math.abs(sellAmt)) {
          // //console.log("else buy gt");
          buyUpdate = { status: "2", filledAmt: Math.abs(sellAmt) };
          sellUpdate = { status: "1", filledAmt: Math.abs(sellAmt) };
          // buyAmt = rounds(+buyAmt - +sellAmt);

        } else if (Math.abs(buyAmt) < Math.abs(sellAmt)) {
          // //console.log("else sell gt");
          buyUpdate = { status: "1", filledAmt: buyAmt };
          sellUpdate = { status: "2", filledAmt: buyAmt };
          forceBreak = true;
        }

        var order_value1 = parseFloat(buyUpdate.filledAmt * buyOrder.price).toFixed(
          8
        );
        var order_value = parseFloat(order_value1 / buyOrder.btcprice).toFixed(8);
        var required_margin = parseFloat(order_value1) / buyleverage;
        var fee = (parseFloat(order_value1) * pairData.taker_fees) / 100;
        var margininbtc = parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);

        // //console.log("si brk");
        var taker_fee = pairData.taker_fees;
        var fee_amount = feeinbtc;
        var buyfill = buyUpdate.filledAmt.toFixed(8);
        var tempdata = {
          pair: ObjectId(pairData._id),
          firstCurrency: pairData.first_currency,
          secondCurrency: pairData.second_currency,
          buyuserId: ObjectId(buyuserid),
          user_id: ObjectId(buyuserid),
          selluserId: ObjectId(selluserid),
          sellId: ObjectId(sellorderid),
          buyId: ObjectId(buyorderid),
          uniqueid: Math.floor(Math.random() * 1000000000),
          filledAmount: +buyfill,
          Price: +buyOrder.price,
          forced_liquidation: buyforced_liquidation,
          pairname: curorder.pairName,
          order_cost: order_cost,
          Fees: parseFloat(fee_amount).toFixed(8),
          status: "filled",
          Type: "buy",
          created_at: new Date(),
          beforeBalance: curorder.beforeBalance,
          afterBalance: curorder.afterBalance,
          order_value: order_value,
        };

        buytempamount += Math.abs(buyUpdate.filledAmt);

        var buytempdata = await tradeTable.findOneAndUpdate({ _id: ObjectId(buyorderid) }, {
          $set: { status: buyUpdate.status },
          $push: { filled: tempdata },
          $inc: { filledAmount: buyUpdate.filledAmt },
        }, { new: true, fields: { filled: 1 } });

        var order_value1 = parseFloat(sellUpdate.filledAmt * sellOrder.price).toFixed(
          8
        );

        var order_value = parseFloat(order_value1 / sellOrder.btcprice).toFixed(
          8
        );
        var required_margin = parseFloat(order_value1) / sellleverage;
        var fee = (parseFloat(order_value1) * sellOrder.taker_fees) / 100;
        var margininbtc =
          parseFloat(required_margin) / parseFloat(sellOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(sellOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);
        var sellfill = sellUpdate.filledAmt.toFixed(8);
        var fee_amount = feeinbtc;
        tempdata.Type = "sell";
        tempdata.user_id = ObjectId(selluserid);
        tempdata.order_cost = order_cost;
        tempdata.Price = sellOrder.price;
        tempdata.forced_liquidation = sellforced_liquidation;
        tempdata.filledAmount = +sellfill * -1;
        tempdata.Fees = parseFloat(fee_amount).toFixed(8);
        tempdata.beforeBalance = sellOrder.beforeBalance;
        tempdata.afterBalance = sellOrder.afterBalance;
        tempdata.order_value = order_value;
        tempdata.uniqueid = Math.floor(Math.random() * 1000000000);
        // //console.log(tempdata,'tempdatanext')
        var selltempdata = await tradeTable.findOneAndUpdate(
          { _id: ObjectId(sellorderid) },
          {
            $set: { status: sellUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(sellUpdate.filledAmt) * -1 },
          },
          { new: true, fields: { filled: 1 } });
        //console.log("-----tradedata.length", tradedata.length)
        //console.log("-----ii", ii + 1)
        //console.log("-----forceBreak", forceBreak)
        //console.log("----tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel'", tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel')
        if (tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel') {
          // cancel_trade(curorder._id, curorder.userId);
          cancel_trade_MatchedOrder(curorder._id, curorder.userId);
        }
        await buypositionmatching(buytempdata.filled[buytempdata.filled.length - 1])
        await sellpositionmatching(selltempdata.filled[selltempdata.filled.length - 1])
        stopbuyupdate(buyorderid, sellorderid);

        if (forceBreak == true) {
          break;
          setTimeout(function () {
            gettradedata(
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency,
              socketio
            );
            getusertradedata(
              buytempdata.filled[0].selluserId,
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency
            );
            getusertradedata(
              buytempdata.filled[0].buyuserId,
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency
            );
          }, 3000);
        }

      }
    }
    else {
      var sellOrder = curorder,
        sellorderid = sellOrder._id,
        selluserid = sellOrder.userId,
        sellleverage = sellOrder.leverage,
        sellAmt = rounds(Math.abs(sellOrder.quantity)),
        selleramount1 = rounds(sellOrder.quantity),
        sellerforced_liquidation = sellOrder.forced_liquidation,
        selltempamount = 0,
        sellAmt = rounds(Math.abs(sellOrder.quantity) - Math.abs(selltempamount)),
        forceBreak = false;

      for (var ii = 0; ii < tradedata.length; ii++) {
        sellAmt = rounds(Math.abs(sellOrder.quantity) - Math.abs(selltempamount));
        var buyOrder = tradedata[ii];
        (buyorderid = buyOrder._id),
          (buyuserid = buyOrder.userId),
          (buyleverage = buyOrder.leverage),
          (buyforced_liquidation = buyOrder.forced_liquidation),
          (buyAmt = rounds(buyOrder.quantity - Math.abs(buyOrder.filledAmount))),
          (buyUpdate = {}),
          (sellUpdate = {});
        //console.log(sellAmt, "sellAmt-----");
        //console.log(buyAmt, "buyAmt----");
        if (Math.abs(sellAmt) == Math.abs(buyAmt)) {
          buyUpdate = { status: 1, filledAmt: Math.abs(sellAmt) };
          sellUpdate = { status: 1, filledAmt: buyAmt };
          forceBreak = true;
        } else if (Math.abs(sellAmt) > Math.abs(buyAmt)) {
          buyUpdate = { status: 1, filledAmt: buyAmt };
          sellUpdate = { status: 2, filledAmt: buyAmt };
        } else if (Math.abs(sellAmt) < Math.abs(buyAmt)) {
          buyUpdate = { status: 2, filledAmt: Math.abs(sellAmt) };
          sellUpdate = { status: 1, filledAmt: Math.abs(sellAmt) };
          forceBreak = true;
        }

        var order_value1 = parseFloat(buyUpdate.filledAmt * buyOrder.price).toFixed(8);
        var order_value = parseFloat(order_value1 / buyOrder.btcprice).toFixed(8);
        var required_margin = parseFloat(order_value1) / buyleverage;
        var fee = (parseFloat(order_value1) * pairData.taker_fees) / 100;
        var margininbtc = parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);


        // //console.log(curorder.afterBalance,'curorder.afterBalance');
        //  //console.log(curorder.beforeBalance,'curorder.beforeBalance');
        var taker_fee = pairData.taker_fees;
        var fee_amount = feeinbtc;
        var buyfill = buyUpdate.filledAmt.toFixed(8);
        var tempdata = {
          pair: ObjectId(pairData._id),
          firstCurrency: pairData.first_currency,
          secondCurrency: pairData.second_currency,
          forced_liquidation: buyforced_liquidation,
          buyuserId: ObjectId(buyuserid),
          user_id: ObjectId(buyuserid),
          selluserId: ObjectId(selluserid),
          sellId: ObjectId(sellorderid),
          buyId: ObjectId(buyorderid),
          filledAmount: +buyfill,
          Price: +buyOrder.price,
          uniqueid: Math.floor(Math.random() * 1000000000),
          pairname: curorder.pairName,
          order_cost: order_cost,
          status: "filled",
          Type: "buy",
          Fees: parseFloat(fee_amount).toFixed(8),
          created_at: new Date(),
          beforeBalance: buyOrder.beforeBalance,
          afterBalance: buyOrder.afterBalance,
          order_value: order_value,
        };
        selltempamount += +sellUpdate.filledAmt;

        var buytempdata = await tradeTable.findOneAndUpdate(
          { _id: ObjectId(buyorderid) },
          {
            $set: { status: buyUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(buyUpdate.filledAmt) },
          },
          { new: true, fields: { status: 1, filled: 1 } });

        var order_value1 = parseFloat(sellUpdate.filledAmt * buyOrder.price).toFixed(
          8
        );
        var order_value = parseFloat(order_value1 / buyOrder.btcprice).toFixed(
          8
        );
        var required_margin = parseFloat(order_value1) / sellleverage;
        var fee = (parseFloat(order_value1) * buyOrder.taker_fees) / 100;
        var margininbtc =
          parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
        var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
        var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
        order_cost = parseFloat(order_cost).toFixed(8);
        var sellfill = sellUpdate.filledAmt.toFixed(8);
        var fee_amount = feeinbtc;
        tempdata.Type = "sell";
        tempdata.user_id = ObjectId(selluserid);
        tempdata.order_cost = parseFloat(order_cost).toFixed(8);
        tempdata.forced_liquidation = sellerforced_liquidation;
        tempdata.Price = sellOrder.price;
        tempdata.Fees = parseFloat(fee_amount).toFixed(8);
        tempdata.filledAmount = +sellfill * -1;
        tempdata.afterBalance = buyOrder.afterBalance;
        tempdata.beforeBalance = buyOrder.beforeBalance;
        tempdata.uniqueid = Math.floor(Math.random() * 1000000000);
        // //console.log(tempdata,'selltempdatanext')
        tempdata.order_value = order_value;
        // //console.log(sellUpdate.status, "sellUpdate.status");
        var selltempdata = await tradeTable.findOneAndUpdate(
          { _id: ObjectId(sellorderid) },
          {
            $set: { status: sellUpdate.status },
            $push: { filled: tempdata },
            $inc: { filledAmount: parseFloat(sellUpdate.filledAmt * -1) },
          },
          { new: true, fields: { status: 1, filled: 1 } });

        //console.log("-----tradedata.length", tradedata.length)
        //console.log("-----ii", ii)
        //console.log("-----forceBreak", forceBreak)
        //console.log("----tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel'", tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel')

        if (tradedata.length == ii + 1 && forceBreak != true && curorder.timeinforcetype == 'ImmediateOrCancel') {
          // cancel_trade(curorder._id, curorder.userId);
          cancel_trade_MatchedOrder(curorder._id, curorder.userId);
        }

        await buypositionmatching(buytempdata.filled[buytempdata.filled.length - 1])
        await sellpositionmatching(selltempdata.filled[selltempdata.filled.length - 1])
        stopbuyupdate(buyorderid, sellorderid);

        //console.log("-----forceBreak", forceBreak)
        if (forceBreak == true) {
          setTimeout(function () {
            gettradedata(
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency,
              socketio
            );
            getusertradedata(
              buytempdata.filled[0].selluserId,
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency
            );
            getusertradedata(
              buytempdata.filled[0].buyuserId,
              buytempdata.filled[0].firstCurrency,
              buytempdata.filled[0].secondCurrency
            );
          }, 3000);
          break;
        }
      }

    }

  }
  else {
    if (curorder.timeinforcetype == "ImmediateOrCancel") {
      // cancel_trade(curorder._id, curorder.userId);
      cancel_trade_MatchedOrder(curorder._id, curorder.userId);
    }
    gettradedata(
      curorder.firstCurrency,
      curorder.secondCurrency,
      socketio
    );
  }
}
function stopbuyupdate(buyorderid, sellorderid) {
  tradeTable.findOneAndUpdate(
    { pairid: buyorderid, status: "4", stopstatus: "1" },
    { $set: { stopstatus: "2" } },
    { new: true, fields: { status: 1 } },
    function (buytemp_err, buytempData) { }
  );

  tradeTable.findOneAndUpdate(
    { pairid: sellorderid, status: "4", stopstatus: "1" },
    { $set: { stopstatus: "2" } },
    { new: true, fields: { status: 1 } },
    function (buytemp_err, buytempData) { }
  );

  tradeTable
    .find({ status: "4", trigger_type: "Last" })
    .limit(10, function (buytemp_err, buytempData) {
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
          // //console.log(trigger_price,'trigger_price');
          // //console.log(buyprice,'buyprice');
          if (different > 0) {
            if (
              trailstop == "0" &&
              parseFloat(trigger_price) > parseFloat(buyprice)
            ) {
              // order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
              tradeTable.findOneAndUpdate(
                {
                  _id: ObjectId(_id),
                  status: "4",
                  stopstatus: { $ne: "1" },
                },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
          } else {
            if (
              trailstop == "0" &&
              parseFloat(trigger_price) < parseFloat(buyprice)
            ) {
              //order_placing(orderType,buyorsell,price,quantity,leverage,pairName,userId);
              tradeTable.findOneAndUpdate(
                {
                  _id: ObjectId(_id),
                  status: "4",
                  stopstatus: { $ne: "1" },
                },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) {
                  // //console.log(buytemp_err,'trigger error');
                }
              );
            }
          }
          //trailing stop trigger
          if (
            trailstop == "1" &&
            buyorsell == "buy" &&
            parseFloat(price) > parseFloat(buyprice)
          ) {
            var addprice = parseFloat(buyprice) - parseFloat(price);
            var newtriggerprice =
              parseFloat(trigger_price) + parseFloat(addprice);
            tradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              {
                $set: {
                  price: newtriggerprice,
                  trigger_price: newtriggerprice,
                },
              },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // //console.log(buytemp_err,'trigger error');
              }
            );
          }
          if (
            trailstop == "1" &&
            buyorsell == "buy" &&
            parseFloat(trigger_price) < parseFloat(buyprice)
          ) {
            tradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              { $set: { status: "0" } },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // //console.log(buytemp_err,'trigger error');
              }
            );
          }
          if (
            trailstop == "1" &&
            buyorsell == "sell" &&
            parseFloat(price) < parseFloat(buyprice)
          ) {
            var addprice = parseFloat(price) - parseFloat(buyprice);
            var newtriggerprice =
              parseFloat(trigger_price) - parseFloat(addprice);
            tradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              {
                $set: {
                  price: newtriggerprice,
                  trigger_price: newtriggerprice,
                },
              },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // //console.log(buytemp_err,'trigger error');
              }
            );
          }
          if (
            trailstop == "1" &&
            buyorsell == "sell" &&
            parseFloat(trigger_price) > parseFloat(buyprice)
          ) {
            tradeTable.findOneAndUpdate(
              { _id: ObjectId(_id), status: "4", stopstatus: { $ne: "1" } },
              { $set: { status: "0" } },
              { new: true, fields: { status: 1 } },
              function (buytemp_err, buytempData) {
                // //console.log(buytemp_err,'trigger error');
              }
            );
          }
        }
      }
    });
}

function tradematching1(curorder, io, balance_check = true, profitnloss = 0) {
  //Fill or kill order type
  if (
    curorder.timeinforcetype == "FillOrKill" ||
    curorder.forced_liquidation == true
  ) {
    // //console.log('filleorkill');
    var datas = {
      $or: [{ status: "2" }, { status: "0" }],
      userId: { $ne: ObjectId(curorder.userId) },
      pairName: curorder.pairName,
    },
      sort;

    if (curorder.buyorsell == "buy") {
      datas["buyorsell"] = "sell";
      datas["price"] = { $lte: curorder.price };
      sort = { price: 1 };
    } else {
      datas["buyorsell"] = "buy";
      datas["price"] = { $gte: curorder.price };
      sort = { price: -1 };
    }
    tradeTable
      .aggregate([
        { $match: datas },
        {
          $group: {
            _id: null,
            quantity: { $sum: "$quantity" },
            filledAmount: { $sum: "$filledAmount" },
          },
        },
        { $sort: sort },
        { $limit: 10 },
      ])
      .exec((tradeerr, tradedata) => {
        if (tradedata.length > 0) {
          var quantity = tradedata[0].quantity;
          var filledAmount = tradedata[0].filledAmount;
          var pendingamount =
            parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
          if (Math.abs(curorder.quantity) > pendingamount) {
            var quant =
              parseFloat(Math.abs(curorder.quantity)) -
              parseFloat(pendingamount);
            if (curorder.forced_liquidation == true) {
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              var newbuyorsell = curorder.buyorsell == "buy" ? "sell" : "buy";
              var quant = curorder.buyorsell == "buy" ? quant : quant * -1;
              order_placing(
                curorder.orderType,
                newbuyorsell,
                curorder.price,
                Math.abs(quant),
                curorder.leverage,
                curorder.pairName,
                oppuser_id
              );
            } else {
              cancel_trade(curorder._id, curorder.userId);
            }
          }
        } else if (curorder.forced_liquidation == false) {
          cancel_trade(curorder._id, curorder.userId);
        }
      });
  }
  var datas = {
    $or: [{ status: "2" }, { status: "0" }],
    userId: { $ne: ObjectId(curorder.userId) },
    pairName: curorder.pairName,
  },
    sort;

  if (curorder.buyorsell == "buy") {
    datas["buyorsell"] = "sell";
    datas["price"] = { $lte: curorder.price };
    sort = { price: 1 };
  } else {
    datas["buyorsell"] = "buy";
    datas["price"] = { $gte: curorder.price };
    sort = { price: -1 };
  }

  tradeTable
    .aggregate([{ $match: datas }, { $sort: sort }, { $limit: 50 }])
    .exec((tradeerr, tradedata) => {
      perpetual
        .findOne({ _id: ObjectId(curorder.pair) })
        .exec(function (pairerr, pairData) {
          // //console.log('perpetual');
          if (tradeerr) {
            //console.log({ status: false, message: tradeerr });
          }
          else if (tradedata.length > 0) {
            if (curorder.postOnly) {
              cancel_trade(curorder._id, curorder.userId);
            }
            var i = 0;
            if (curorder.buyorsell == "buy") {
              buyside(curorder, tradedata, pairData, io);
            } else if (curorder.buyorsell == "sell") {
              sellside(curorder, tradedata, pairData, io);
            }
          } else {
            if (curorder.timeinforcetype == "ImmediateOrCancel") {
              cancel_trade(curorder._id, curorder.userId);
            }
            gettradedata(
              curorder.firstCurrency,
              curorder.secondCurrency,
              socketio
            );
            var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
            if (
              curorder.status == "0" &&
              curorder.orderType == "Market" &&
              parseFloat(curorder.leverage) <= 20 &&
              curorder.userId.toString() != oppuser_id.toString()
            ) {
              // //console.log("here");
              var newbuyorsell = curorder.buyorsell == "buy" ? "sell" : "buy";
              order_placing(
                curorder.orderType,
                newbuyorsell,
                curorder.price,
                Math.abs(curorder.quantity),
                curorder.leverage,
                curorder.pairName,
                oppuser_id
              );
            } else if (
              curorder.status == "0" &&
              curorder.orderType == "Market" &&
              balance_check == false &&
              curorder.userId.toString() != oppuser_id.toString()
            ) {
              // //console.log("here");
              var newbuyorsell = curorder.buyorsell == "buy" ? "sell" : "buy";
              order_placing(
                curorder.orderType,
                newbuyorsell,
                curorder.price,
                Math.abs(curorder.quantity),
                curorder.leverage,
                curorder.pairName,
                oppuser_id
              );
            }
          }
        });
    });
}

function buyside(curorder, tradedata, pairData, io) {
  var tradePos = 0;
  var curtradequan =
    parseFloat(Math.abs(curorder.quantity)) -
    parseFloat(Math.abs(curorder.filledAmount));
  var tradequan =
    parseFloat(Math.abs(tradedata[0].quantity)) -
    parseFloat(Math.abs(tradedata[0].filledAmount));
  var tradequan1 =
    parseFloat(Math.abs(tradedata[0].quantity)) -
    parseFloat(Math.abs(tradedata[0].filledAmount));

  tradeinfo.filledamount =
    Math.abs(curtradequan) == Math.abs(tradequan)
      ? Math.abs(tradequan)
      : Math.abs(curtradequan) > Math.abs(tradequan)
        ? Math.abs(tradequan)
        : Math.abs(curtradequan) < Math.abs(tradequan)
          ? Math.abs(curtradequan)
          : 0;

  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails = tradedata[0];

  buymatchingtrade(tradetails, function () {

    if (
      tradePos === tradedata.length - 1 ||
      parseFloat(tradequan1) == parseFloat(curtradequan)
    ) {
      callBackResponseImport();
    } else {
      tradePos += 1;
      var tradequan1 =
        parseFloat(Math.abs(tradedata[tradePos].quantity)) -
        parseFloat(Math.abs(tradedata[tradePos].filledAmount));
      curtradequan -= parseFloat(Math.abs(tradeinfo.filledamount));
      tradeinfo.filledamount =
        Math.abs(curtradequan) == Math.abs(tradequan1)
          ? Math.abs(tradequan1)
          : Math.abs(curtradequan) > Math.abs(tradequan1)
            ? Math.abs(tradequan1)
            : Math.abs(curtradequan) < Math.abs(tradequan1)
              ? Math.abs(curtradequan)
              : 0;

      tradedata[tradePos].pairData = pairData;
      curorder.quantity = curtradequan;
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
  var tradePos = 0;
  var curtradequan =
    parseFloat(Math.abs(curorder.quantity)) -
    parseFloat(Math.abs(curorder.filledAmount));
  var tradequan =
    parseFloat(tradedata[0].quantity) - parseFloat(tradedata[0].filledAmount);
  tradeinfo.tradequan1 = tradequan;
  tradeinfo.filledamount =
    Math.abs(curtradequan) == Math.abs(tradequan)
      ? Math.abs(tradequan)
      : Math.abs(curtradequan) > Math.abs(tradequan)
        ? Math.abs(tradequan)
        : Math.abs(curtradequan) < Math.abs(tradequan)
          ? Math.abs(curtradequan)
          : 0;

  tradedata[0].pairData = pairData;
  tradedata[0].quantity = tradequan;
  curorder.quantity = curtradequan;
  tradedata[0].curorder = curorder;
  var tradetails = tradedata[0];

  sellmatchingtrade(tradetails, function () {
    if (
      tradePos === tradedata.length - 1 ||
      parseFloat(tradeinfo.filledamount) == parseFloat(curtradequan)
    ) {
      callBackResponseImport();
    } else {
      tradePos += 1;

      var tradequan1 =
        parseFloat(Math.abs(tradedata[tradePos].quantity)) -
        parseFloat(Math.abs(tradedata[tradePos].filledAmount));
      tradeinfo.tradequan1 = tradequan1;
      curtradequan -= parseFloat(Math.abs(tradeinfo.filledamount));

      tradeinfo.filledamount =
        Math.abs(curtradequan) == Math.abs(tradequan1)
          ? Math.abs(tradequan1)
          : Math.abs(curtradequan) > Math.abs(tradequan1)
            ? Math.abs(tradequan1)
            : Math.abs(curtradequan) < Math.abs(tradequan1)
              ? Math.abs(curtradequan)
              : 0;

      tradedata[tradePos].pairData = pairData;
      curorder.quantity = curtradequan;
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


function callBackResponseImport() {
  tradeinfo.filledamount = 0;
  // //console.log('fskdmflskmdflskdmflksmdf');
}
function callBackposResponseImport() {
  tradeinfo.posfilledamount = 0;
  //console.log('fskdmflskmdflskdmflksmdf');
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
  (sellOrder = data_loop),
    (sellorderid = sellOrder._id),
    (selluserid = sellOrder.userId),
    (sellleverage = sellOrder.leverage),
    (sellforced_liquidation = sellOrder.forced_liquidation),
    (sellAmt = rounds(+sellOrder.quantity)),
    (buyUpdate = {}),
    (sellUpdate = {});
  if (Math.abs(buyAmt) == Math.abs(sellAmt)) {
    // //console.log("amount eq");
    buyUpdate = {
      status: "1",
      filledAmt: Math.abs(sellAmt),
    };
    sellUpdate = {
      status: "1",
      filledAmt: buyAmt,
    };
  } else if (Math.abs(buyAmt) > Math.abs(sellAmt)) {
    // //console.log("else buy gt");
    buyUpdate = {
      status: "2",
      filledAmt: Math.abs(sellAmt),
    };
    sellUpdate = {
      status: "1",
      filledAmt: Math.abs(sellAmt),
    };
    buyAmt = rounds(+buyAmt - +sellAmt);
  } else if (Math.abs(buyAmt) < Math.abs(sellAmt)) {
    // //console.log("else sell gt");
    buyUpdate = {
      status: "1",
      filledAmt: buyAmt,
    };
    sellUpdate = {
      status: "2",
      filledAmt: buyAmt,
    };
  }
  var order_value1 = parseFloat(buyUpdate.filledAmt * buyOrder.price).toFixed(
    8
  );
  var order_value = parseFloat(order_value1 / buyOrder.btcprice).toFixed(8);
  var required_margin = parseFloat(order_value1) / buyleverage;
  var fee = (parseFloat(order_value1) * sellOrder.pairData.taker_fees) / 100;
  var margininbtc = parseFloat(required_margin) / parseFloat(buyOrder.btcprice);
  var feeinbtc = parseFloat(fee) / parseFloat(buyOrder.btcprice);
  var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
  order_cost = parseFloat(order_cost).toFixed(8);

  // //console.log("si brk");
  var taker_fee = sellOrder.pairData.taker_fees;
  var fee_amount = feeinbtc;
  var tempdata = {
    pair: ObjectId(sellOrder.pairData._id),
    firstCurrency: sellOrder.pairData.first_currency,
    secondCurrency: sellOrder.pairData.second_currency,
    buyuserId: ObjectId(buyuserid),
    user_id: ObjectId(buyuserid),
    selluserId: ObjectId(selluserid),
    sellId: ObjectId(sellorderid),
    buyId: ObjectId(buyorderid),
    uniqueid: Math.floor(Math.random() * 1000000000),
    filledAmount: +buyUpdate.filledAmt.toFixed(8),
    Price: +buyOrder.price,
    forced_liquidation: buyforced_liquidation,
    pairname: curorder.pairName,
    order_cost: order_cost,
    Fees: parseFloat(fee_amount).toFixed(8),
    status: "filled",
    Type: "buy",
    created_at: new Date(),
    beforeBalance: curorder.beforeBalance,
    afterBalance: curorder.afterBalance,
    order_value: order_value,
  };
  buytempamount += +buyUpdate.filledAmt;

  buydetailsupdate(
    tempdata,
    buyorderid,
    buyUpdate,
    sellorderid,
    sellUpdate,
    selluserid,
    sellOrder.price,
    sellOrder.pairData.maker_rebate,
    socketio,
    sellforced_liquidation,
    sellleverage,
    sellOrder,
    callBackOne
  );
  // if (
  //   tradedata.length == i &&
  //   forceBreak != true &&
  //   curorder.timeinforcetype == "ImmediateOrCancel"
  // ) {
  //   cancel_trade(curorder._id, curorder.userId);
  // }
}

function sellmatchingtrade(tradedata, callBackOne) {
  var curorder = tradedata.curorder;
  var sellOrder = curorder,
    sellorderid = sellOrder._id,
    selluserid = sellOrder.userId,
    sellleverage = sellOrder.leverage,
    sellAmt = rounds(Math.abs(sellOrder.quantity)),
    selleramount = rounds(sellOrder.quantity);
  selleramount1 = rounds(sellOrder.quantity);
  sellerforced_liquidation = sellOrder.forced_liquidation;
  selltempamount = 0;
  sell_res_len = tradedata.length;
  var data_loop = tradedata;
  sellAmt = rounds(Math.abs(sellOrder.quantity) - selltempamount);

  // var ii                   = i,
  (buyOrder = data_loop),
    (buyorderid = buyOrder._id),
    (buyuserid = buyOrder.userId),
    (buyleverage = buyOrder.leverage),
    (buyforced_liquidation = buyOrder.forced_liquidation),
    (buyAmt = rounds(buyOrder.quantity)),
    (buyUpdate = {}),
    (sellUpdate = {}),
    (selleramount = selleramount - buyAmt);
  // //console.log(sellAmt, "sellAmt");
  // //console.log(buyAmt, "buyAmt");
  if (Math.abs(sellAmt) == Math.abs(buyAmt)) {
    buyUpdate = {
      status: 1,
      filledAmt: Math.abs(sellAmt),
    };
    sellUpdate = {
      status: 1,
      filledAmt: buyAmt,
    };
    forceBreak = true;
  } else if (Math.abs(sellAmt) > Math.abs(buyAmt)) {
    buyUpdate = {
      status: 1,
      filledAmt: buyAmt,
    };
    sellUpdate = {
      status: 2,
      filledAmt: buyAmt,
    };
    sellAmt = rounds(+sellAmt - +buyAmt);
  } else if (Math.abs(sellAmt) < Math.abs(buyAmt)) {
    buyUpdate = {
      status: 2,
      filledAmt: Math.abs(sellAmt),
    };
    sellUpdate = {
      status: 1,
      filledAmt: Math.abs(sellAmt),
    };
  }

  var order_value1 = parseFloat(buyUpdate.filledAmt * sellOrder.price).toFixed(
    8
  );
  var order_value = parseFloat(order_value1 / sellOrder.btcprice).toFixed(8);
  var required_margin = parseFloat(order_value1) / buyleverage;
  var fee = (parseFloat(order_value1) * buyOrder.pairData.taker_fees) / 100;
  var margininbtc =
    parseFloat(required_margin) / parseFloat(sellOrder.btcprice);
  var feeinbtc = parseFloat(fee) / parseFloat(sellOrder.btcprice);
  var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
  order_cost = parseFloat(order_cost).toFixed(8);

  // //console.log(curorder.afterBalance,'curorder.afterBalance');
  //  //console.log(curorder.beforeBalance,'curorder.beforeBalance');
  var taker_fee = buyOrder.pairData.taker_fees;
  var fee_amount = feeinbtc;
  var tempdata = {
    pair: ObjectId(buyOrder.pairData._id),
    firstCurrency: buyOrder.pairData.first_currency,
    secondCurrency: buyOrder.pairData.second_currency,
    forced_liquidation: buyforced_liquidation,
    buyuserId: ObjectId(buyuserid),
    user_id: ObjectId(buyuserid),
    selluserId: ObjectId(selluserid),
    sellId: ObjectId(sellorderid),
    buyId: ObjectId(buyorderid),
    filledAmount: +buyUpdate.filledAmt.toFixed(8),
    Price: +sellOrder.price,
    uniqueid: Math.floor(Math.random() * 1000000000),
    pairname: curorder.pairName,
    order_cost: order_cost,
    status: "filled",
    Type: "buy",
    Fees: parseFloat(fee_amount).toFixed(8),
    created_at: new Date(),
    beforeBalance: buyOrder.beforeBalance,
    afterBalance: buyOrder.afterBalance,
    order_value: order_value,
  };
  selltempamount += +sellUpdate.filledAmt;

  selldetailsupdate(
    tempdata,
    buyorderid,
    buyUpdate,
    sellorderid,
    sellUpdate,
    selluserid,
    sellOrder.price,
    buyOrder.pairData.maker_rebate,
    socketio,
    sellerforced_liquidation,
    sellleverage,
    curorder,
    callBackOne
  );
  // if (
  //   tradedata.length == i &&
  //   forceBreak != true &&
  //   curorder.timeinforcetype == "ImmediateOrCancel"
  // ) {
  //   cancel_trade(curorder._id, curorder.userId);
  // }
}

function tradematching111(curorder, io, balance_check = true, profitnloss = 0) {
  //Fill or kill order type
  if (
    curorder.timeinforcetype == "FillOrKill" ||
    curorder.forced_liquidation == true
  ) {
    // //console.log('filleorkill');
    var datas = {
      $or: [{ status: "2" }, { status: "0" }],
      userId: { $ne: ObjectId(curorder.userId) },
      pairName: curorder.pairName,
    },
      sort;

    if (curorder.buyorsell == "buy") {
      datas["buyorsell"] = "sell";
      datas["price"] = { $lte: curorder.price };
      sort = { price: 1 };
    } else {
      datas["buyorsell"] = "buy";
      datas["price"] = { $gte: curorder.price };
      sort = { price: -1 };
    }
    tradeTable
      .aggregate([
        { $match: datas },
        {
          $group: {
            _id: null,
            quantity: { $sum: "$quantity" },
            filledAmount: { $sum: "$filledAmount" },
          },
        },
        { $sort: sort },
        { $limit: 10 },
      ])
      .exec((tradeerr, tradedata) => {
        if (tradedata.length > 0) {
          var quantity = tradedata[0].quantity;
          var filledAmount = tradedata[0].filledAmount;
          var pendingamount =
            parseFloat(Math.abs(quantity)) - parseFloat(Math.abs(filledAmount));
          if (Math.abs(curorder.quantity) > pendingamount) {
            var quant =
              parseFloat(Math.abs(curorder.quantity)) -
              parseFloat(pendingamount);
            if (curorder.forced_liquidation == true) {
              var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
              var newbuyorsell = curorder.buyorsell == "buy" ? "sell" : "buy";
              var quant = curorder.buyorsell == "buy" ? quant : quant * -1;
              order_placing(
                curorder.orderType,
                newbuyorsell,
                curorder.price,
                Math.abs(quant),
                curorder.leverage,
                curorder.pairName,
                oppuser_id
              );
            } else {
              cancel_trade(curorder._id, curorder.userId);
            }
          }
        } else if (curorder.forced_liquidation == false) {
          cancel_trade(curorder._id, curorder.userId);
        }
      });
  }
  var datas = {
    $or: [{ status: "2" }, { status: "0" }],
    userId: { $ne: ObjectId(curorder.userId) },
    pairName: curorder.pairName,
  },
    sort;

  if (curorder.buyorsell == "buy") {
    datas["buyorsell"] = "sell";
    datas["price"] = { $lte: curorder.price };
    sort = { price: 1 };
  } else {
    datas["buyorsell"] = "buy";
    datas["price"] = { $gte: curorder.price };
    sort = { price: -1 };
  }
  // //console.log(datas,'datas');
  tradeTable
    .aggregate([{ $match: datas }, { $sort: sort }])
    .exec((tradeerr, tradedata) => {
      perpetual
        .findOne({ _id: ObjectId(curorder.pair) })
        .exec(function (pairerr, pairData) {
          // //console.log('perpetual');
          if (tradeerr) {
            //console.log({ status: false, message: tradeerr });
          }
          else //console.log(tradedata, "tradedata");
            if (tradedata.length > 0) {
              if (curorder.postOnly) {
                cancel_trade(curorder._id, curorder.userId);
              }
              var i = 0;
              if (curorder.buyorsell == "buy") {
                buymatchingprocess(curorder, tradedata, pairData, io);
              } else if (curorder.buyorsell == "sell") {
                sellmatchingprocess(curorder, tradedata, pairData, io);
              }
            } else {
              if (curorder.timeinforcetype == "ImmediateOrCancel") {
                cancel_trade(curorder._id, curorder.userId);
              }
              gettradedata(
                curorder.firstCurrency,
                curorder.secondCurrency,
                socketio
              );
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

async function buypositionupdate(tradedata, callBackOne) {
  // //console.log(tradedata.filled, "buypostradedata166");
  if (callBackOne) {
    tradeinfo.callBackbuyposTrade = callBackOne;
  }
  var curorder = tradedata.curorder;
  var perdata = tradedata.perdata;
  var sellupdate = tradedata.sellupdate;
  var buyupdate = tradedata.buyupdate;
  var index = perdata.findIndex((x) => x.tiker_root === curorder.pairname);
  var btcindex = perdata.findIndex((x) => x.tiker_root === "BTCUSD");
  var btcprice = perdata[btcindex].markprice;
  var markprice = perdata[index].markprice;

  var sellorderid = tradedata.filled.sellId;
  var firstCurrency = curorder.firstCurrency;
  var secondCurrency = curorder.secondCurrency;
  var forced_liquidation = curorder.forced_liquidation;
  var buyorder_value = curorder.order_value;
  var buyorderid = curorder.buyId;
  var user_id = curorder.user_id;
  var buyFees = curorder.Fees;
  var sellFees = tradedata.filled.Fees;
  var beforeBalance = tradedata.filled.beforeBalance;
  var afterBalance = tradedata.filled.afterBalance;
  var sellorder_value = tradedata.filled.order_value;
  var buypairName = curorder.pairname;
  var buyuserId = curorder.buyuserId;
  var buypair = curorder.pair;
  var sellquantity = Math.abs(tradedata.filled.filledAmount);
  var buyprice = curorder.Price;
  var sellprice = tradedata.filled.Price;
  var orderCost = tradedata.filled.order_cost;

  //console.log(curorder.uniqueid, "buycurorder.uniqueid");
  //console.log(buyupdate.position_status, "buyupdate.position_status");
  tradeTable.findOneAndUpdate(
    { "filled.uniqueid": curorder.uniqueid },
    { $set: { "filled.$.position_status": buyupdate.position_status } },
    { multi: true, fields: { filled: 1 } },
    function (selltemp_err, selltempData) {
      // //console.log(selltempData,'selltempData')
      // //console.log(selltemp_err,'selltemp_err')
      if (selltempData) {
        Assets.findOne(
          { currencySymbol: "BTC", userId: ObjectId(user_id) },
          function (balanceerr, balancedata) {
            var totalfees = parseFloat(buyFees);

            var profitnlossusd = parseFloat(sellprice) - parseFloat(buyprice);
            var profitnlossusd =
              parseFloat(profitnlossusd) *
              parseFloat(sellupdate.positionFilled);

            var profitnloss = parseFloat(profitnlossusd) / parseFloat(btcprice);
            // var profitnloss    = parseFloat(sellorder_value)-parseFloat(buyorder_value);

            var fprofitnloss = parseFloat(profitnloss) - parseFloat(totalfees);
            var updatebal = parseFloat(orderCost) + parseFloat(fprofitnloss);
            if (forced_liquidation) {
              updatebal = orderCost * -1;
            }

            var reducebalance =
              parseFloat(beforeBalance) - parseFloat(afterBalance);

            var updatebaldata = {};
            updatebaldata["balance"] = updatebal;
            var afterBalance1 =
              parseFloat(balancedata.balance) + parseFloat(updatebal);

            const newposition = new position_table({
              pairname: buypairName,
              pair: buypair,
              userId: user_id,
              closing_direction: "Closed short",
              quantity: sellupdate.positionFilled,
              exit_price: buyprice,
              entry_price: sellprice,
              profitnloss: forced_liquidation ? updatebal : profitnloss,
              exit_type: forced_liquidation ? "Liquidated" : "Trade",
              beforeBalance: balancedata.balance,
              afterBalance: afterBalance1,
              orderCost: orderCost,
            });

            newposition.save(function (err, data) {
              // var updatebaldata = {};
              if (forced_liquidation == false) {
                // //console.log(updatebaldata,'updatebaldata')
                Assets.findOneAndUpdate(
                  { currencySymbol: "BTC", userId: ObjectId(user_id) },
                  { $inc: updatebaldata },
                  { new: true, fields: { balance: 1 } },
                  function (balerr, baldata) { }
                );
              }
            });
          }
        );
      }
    }
  );
  // //console.log('buyside')
  tradedata.filled.position_status = sellupdate.position_status;
  //console.log(tradedata.filled.uniqueid, "tradedata.filled.uniqueid");
  //console.log(sellupdate.position_status, "sellupdate.position_status");
  tradeTable.findOneAndUpdate(
    { "filled.uniqueid": tradedata.filled.uniqueid },
    { $set: { "filled.$.position_status": sellupdate.position_status } },
    { multi: true, fields: { filled: 1 } },
    function (selltemp_err, selltempData) {
      // //console.log(selltemp_err,'selltemp_erruuuuu')
      //console.log(selltempData, 'selltempDataiiiii')
      if (selltempData) {
        tradeinfo.callBackbuyposTrade();
        User.findOneAndUpdate(
          { _id: ObjectId(buyuserId), moderator: { $ne: "2" } },
          { $set: { liq_lock: false } },
          { new: true, fields: { _id: 1 } },
          function (usererr1, userdat1a) { }
        );

        setTimeout(function () {
          getusertradedata(buyuserId, firstCurrency, secondCurrency);
          getusertradedata(user_id, firstCurrency, secondCurrency);
          gettradedata(firstCurrency, secondCurrency, socketio);
        }, 5000);
      }
    }
  );
}
async function sellpositionupdate(tradedata, callBackOne) {
  // //console.log(tradedata, "sellpostradedata166");
  if (callBackOne) {
    tradeinfo.callBacksellposTrade = callBackOne;
  }
  var curorder = tradedata.curorder;
  var perdata = tradedata.perdata;
  var buyupdate = tradedata.buyupdate;
  var sellupdate = tradedata.sellupdate;
  var index = perdata.findIndex((x) => x.tiker_root === curorder.pairname);
  var btcindex = perdata.findIndex((x) => x.tiker_root === "BTCUSD");
  var btcprice = perdata[btcindex].markprice;
  var markprice = perdata[index].markprice;
  var buyorderid = tradedata.filled.buyId;
  var buyprice = tradedata.filled.Price;
  var sellorderid = curorder.sellId;
  var forced_liquidation = curorder.forced_liquidation;
  var sellorder_value = curorder.order_value;
  var firstCurrency = curorder.firstCurrency;
  var secondCurrency = curorder.secondCurrency;
  var selluserId = curorder.buyuserId;
  var user_id = curorder.user_id;
  var sellpair = curorder.pair;
  var sellprice = curorder.Price;
  var buyFees = curorder.Fees;
  var sellFees = tradedata.filled.Fees;
  var buyorder_value = tradedata.filled.order_value;
  var orderCost = tradedata.filled.order_cost;
  var beforeBalance = tradedata.filled.beforeBalance;
  var afterBalance = tradedata.filled.afterBalance;
  var sellpairName = curorder.pairname;
  var buyqauntity = Math.abs(tradedata.filled.filledAmount);

  // //console.log(tradedata.filled.uniqueid, "tradedata.filled.uniqueid");
  // //console.log(buyupdate.position_status, "buyupdate.position_status");
  tradeTable.findOneAndUpdate(
    { "filled.uniqueid": tradedata.filled.uniqueid },
    { $set: { "filled.$.position_status": buyupdate.position_status } },
    { multi: true, fields: { filled: 1 } },
    function (buytemp_err, buytempData) {
      if (buytempData) {
        Assets.findOne(
          { currencySymbol: "BTC", userId: ObjectId(user_id) },
          function (balanceerr, balancedata) {
            var totalfees = parseFloat(buyFees) + parseFloat(sellFees);
            var profitnloss =
              [1 / parseFloat(buyprice) - 1 / parseFloat(sellprice)] *
              parseFloat(buyupdate.positionFilled);
            var profitnlossusd = parseFloat(sellprice) - parseFloat(buyprice);
            var profitnlossusd =
              parseFloat(profitnlossusd) * parseFloat(buyupdate.positionFilled);

            var profitnloss = parseFloat(profitnlossusd) / parseFloat(btcprice);

            var fprofitnloss = parseFloat(profitnloss) - parseFloat(totalfees);
            var updatebal = parseFloat(orderCost) + parseFloat(fprofitnloss);
            if (forced_liquidation) {
              updatebal = orderCost * -1;
            }

            var updatebaldata = {};
            var reducebalance =
              parseFloat(beforeBalance) - parseFloat(afterBalance);

            updatebaldata["balance"] = updatebal;
            var afterBalance1 =
              parseFloat(balancedata.balance) + parseFloat(updatebal);

            const newposition = new position_table({
              pairname: sellpairName,
              pair: sellpair,
              userId: user_id,
              closing_direction: "Closed long",
              quantity: buyupdate.positionFilled,
              exit_price: sellprice,
              entry_price: buyprice,
              profitnloss: forced_liquidation ? updatebal : profitnloss,
              exit_type: forced_liquidation ? "Liquidated" : "Trade",
              beforeBalance: balancedata.balance,
              afterBalance: afterBalance1,
              orderCost: orderCost,
            });

            newposition.save(function (err, data) {
              // //console.log(err,'err')
              // //console.log(data,'edatarr')
              if (forced_liquidation == false) {
                Assets.findOneAndUpdate(
                  { currencySymbol: "BTC", userId: ObjectId(user_id) },
                  { $inc: updatebaldata },
                  { new: true, fields: { balance: 1 } },
                  function (balerr, baldata) { }
                );
              }
            });
          }
        );
      }
    }
  );
  // //console.log(curorder.uniqueid, "sellcurorder.uniqueid");
  // //console.log(sellupdate.position_status, "sellupdate.position_status");
  tradeTable.findOneAndUpdate(
    { "filled.uniqueid": curorder.uniqueid },
    { $set: { "filled.$.position_status": sellupdate.position_status } },
    { multi: true, fields: { filled: 1 } },
    function (selltemp_err, selltempData) {
      // //console.log(selltemp_err,'possell');
      // //console.log(selltempData,'possell');
      if (selltempData) {
        User.findOneAndUpdate(
          { _id: ObjectId(user_id), moderator: { $ne: "2" } },
          { $set: { liq_lock: false } },
          { new: true, fields: { _id: 1 } },
          function (usererr1, userdat1a) {
            tradeinfo.callBacksellposTrade();
          }
        );
        setTimeout(function () {
          getusertradedata(selluserId, firstCurrency, secondCurrency);
          getusertradedata(user_id, firstCurrency, secondCurrency);
          gettradedata(firstCurrency, secondCurrency, socketio);
        }, 5000);
      }
    }
  );
}

function buysideposition(curorder, tradedata, pairData) {
  // //console.log(tradedata,'tradedatatradedata')
  // tradeinfo.posfilledamount = 0;
  var buytradePos = 0;
  var curtradequan = parseFloat(Math.abs(curorder.filledAmount)).toFixed(8);
  var tradequan = parseFloat(
    Math.abs(tradedata[0].filled.filledAmount)
  ).toFixed(8);

  tradeinfo.posfilledamount =
    Math.abs(curtradequan) == Math.abs(tradequan)
      ? Math.abs(tradequan)
      : Math.abs(curtradequan) > Math.abs(tradequan)
        ? Math.abs(tradequan)
        : Math.abs(curtradequan) < Math.abs(tradequan)
          ? Math.abs(curtradequan)
          : 0;

  var buyupdate = {};
  var sellupdate = {};
  //console.log("buysideposition11");
  //console.log(curtradequan + "==" + tradequan)
  if (Math.abs(curtradequan) == Math.abs(tradequan)) {
    buyupdate["position_status"] = 0;
    buyupdate["positionFilled"] = tradequan;

    sellupdate["position_status"] = 0;
    sellupdate["positionFilled"] = tradequan;
  } else if (Math.abs(curtradequan) < Math.abs(tradequan)) {
    buyupdate["position_status"] = 0;
    buyupdate["positionFilled"] = curtradequan;

    sellupdate["position_status"] = 2;
    sellupdate["positionFilled"] = curtradequan;
  } else {
    buyupdate["position_status"] = 2;
    buyupdate["positionFilled"] = tradequan;

    sellupdate["position_status"] = 0;
    sellupdate["positionFilled"] = tradequan;
  }
  //console.log(buyupdate, 'buyupdate')
  //console.log(sellupdate, 'sellupdate')
  tradedata[0].perdata = pairData;
  tradedata[0].filled.filledAmount = tradequan;
  curorder.filledAmount = curtradequan;
  tradedata[0].curorder = curorder;
  tradedata[0].sellupdate = sellupdate;
  tradedata[0].buyupdate = buyupdate;
  var tradetails = tradedata[0];

  buypositionupdate(tradetails, function () {
    if (
      buytradePos === tradedata.length - 1 ||
      parseFloat(tradequan1) == parseFloat(curtradequan)
    ) {
      callBackposResponseImport();
    } else {
      //console.log(buytradePos, 'buytradePos');
      buytradePos += 1;
      var tradequan1 = parseFloat(
        tradedata[buytradePos].filled.filledAmount
      ).toFixed(8);
      curtradequan -= parseFloat(Math.abs(tradeinfo.posfilledamount)).toFixed(8);
      tradeinfo.posfilledamount =
        Math.abs(curtradequan) == Math.abs(tradequan1)
          ? Math.abs(tradequan1)
          : Math.abs(curtradequan) > Math.abs(tradequan1)
            ? Math.abs(tradequan1)
            : Math.abs(curtradequan) < Math.abs(tradequan1)
              ? Math.abs(curtradequan)
              : 0;

      var buyupdate = {};
      var sellupdate = {};

      if (Math.abs(curtradequan) == Math.abs(tradequan1)) {
        buyupdate["position_status"] = 0;
        buyupdate["positionFilled"] = tradequan1;

        sellupdate["position_status"] = 0;
        sellupdate["positionFilled"] = tradequan1;
      } else if (Math.abs(curtradequan) < Math.abs(tradequan1)) {
        buyupdate["position_status"] = 0;
        buyupdate["positionFilled"] = curtradequan;

        sellupdate["position_status"] = 2;
        sellupdate["positionFilled"] = curtradequan;
      } else {
        buyupdate["position_status"] = 2;
        buyupdate["positionFilled"] = tradequan1;

        sellupdate["position_status"] = 0;
        sellupdate["positionFilled"] = tradequan1;
      }

      // //console.log(buytradePos,'buytradePos')
      tradedata[buytradePos].perdata = pairData;
      tradedata[buytradePos].filled.filledAmount = tradequan1;
      curorder.filledAmount = curtradequan;
      tradedata[buytradePos].curorder = curorder;
      tradedata[buytradePos].sellupdate = sellupdate;
      tradedata[buytradePos].buyupdate = buyupdate;
      var tradetails = tradedata[buytradePos];

      if (tradedata[buytradePos]) {
        buypositionupdate(tradetails);
      } else {
        callBackposResponseImport();
      }
    }
  });
}

function sellsideposition(curorder, tradedata, pairData) {
  // //console.log(tradedata,'tradedatatradedatasell')
  // tradeinfo.posfilledamount = 0;
  var tradePos = 0;
  var curtradequan = parseFloat(Math.abs(curorder.filledAmount)).toFixed(8);
  var tradequan = parseFloat(
    Math.abs(tradedata[0].filled.filledAmount)
  ).toFixed(8);

  tradeinfo.posfilledamount =
    Math.abs(curtradequan) == Math.abs(tradequan)
      ? Math.abs(tradequan)
      : Math.abs(curtradequan) > Math.abs(tradequan)
        ? Math.abs(tradequan)
        : Math.abs(curtradequan) < Math.abs(tradequan)
          ? Math.abs(curtradequan)
          : 0;

  var buyupdate = {};
  var sellupdate = {};
  //console.log("sellsideposition");
  //console.log(curtradequan + "==" + tradequan)
  if (Math.abs(curtradequan) == Math.abs(tradequan)) {
    buyupdate["position_status"] = 0;
    buyupdate["positionFilled"] = tradequan;

    sellupdate["position_status"] = 0;
    sellupdate["positionFilled"] = tradequan; ObjectId("5fb62ab243d70c142c6413b0")
  } else if (Math.abs(curtradequan) < Math.abs(tradequan)) {
    buyupdate["position_status"] = 2;
    buyupdate["positionFilled"] = curtradequan;

    sellupdate["position_status"] = 0;
    sellupdate["positionFilled"] = curtradequan;
  } else {
    buyupdate["position_status"] = 0;
    buyupdate["positionFilled"] = tradequan;

    sellupdate["position_status"] = 2;
    sellupdate["positionFilled"] = tradequan;
  }
  //console.log(buyupdate, 'buyupdate')
  //console.log(sellupdate, 'sellupdate')

  tradedata[0].perdata = pairData;
  tradedata[0].filled.filledAmount = tradequan;
  curorder.filledAmount = curtradequan;
  tradedata[0].curorder = curorder;
  tradedata[0].sellupdate = sellupdate;
  tradedata[0].buyupdate = buyupdate;
  var tradetails = tradedata[0];

  sellpositionupdate(tradetails, function () {
    // //console.log(tradePos,'tradePos')
    if (
      tradePos === tradedata.length - 1 ||
      parseFloat(curtradequan) == parseFloat(tradeinfo.posfilledamount)
    ) {
      callBackposResponseImport();
    } else {
      tradePos += 1;
      //console.log(tradePos, 'selltradePos');
      var tradequan1 = parseFloat(
        tradedata[tradePos].filled.filledAmount
      ).toFixed(8);
      curtradequan -= parseFloat(Math.abs(tradeinfo.posfilledamount)).toFixed(8);
      tradeinfo.posfilledamount =
        Math.abs(curtradequan) == Math.abs(tradequan1)
          ? Math.abs(tradequan1)
          : Math.abs(curtradequan) > Math.abs(tradequan1)
            ? Math.abs(tradequan1)
            : Math.abs(curtradequan) < Math.abs(tradequan1)
              ? Math.abs(curtradequan)
              : 0;

      var buyupdate = {};
      var sellupdate = {};

      if (curtradequan == tradequan1) {
        buyupdate["position_status"] = 0;
        buyupdate["positionFilled"] = tradequan1;

        sellupdate["position_status"] = 0;
        sellupdate["positionFilled"] = tradequan1;
      } else if (curtradequan < tradequan1) {
        buyupdate["position_status"] = 2;
        buyupdate["positionFilled"] = curtradequan;

        sellupdate["position_status"] = 0;
        sellupdate["positionFilled"] = curtradequan;
      } else {
        buyupdate["position_status"] = 0;
        buyupdate["positionFilled"] = tradequan1;

        sellupdate["position_status"] = 2;
        sellupdate["positionFilled"] = tradequan1;
      }

      tradedata[tradePos].perdata = pairData;
      tradedata[tradePos].filled.filledAmount = tradequan1;
      curorder.filledAmount = curtradequan;
      tradedata[tradePos].curorder = curorder;
      tradedata[tradePos].sellupdate = sellupdate;
      tradedata[tradePos].buyupdate = buyupdate;
      var tradetails = tradedata[tradePos];

      if (tradedata[tradePos]) {
        sellpositionupdate(tradetails);
      } else {
        callBackposResponseImport();
      }
    }
  });

}

const sellpositionmatching = async (curorder) => {

  //console.log(curorder, 'newlog')
  var datas = {
    $or: [{ "filled.position_status": "2" }, { "filled.position_status": "1" }],
    "filled.user_id": ObjectId(curorder.user_id),
    "filled.pairname": curorder.pairname,
    // "filled.position_status": "1",
    "filled.status": "filled",
  },
    sort;
  if (curorder.Type == "buy") {
    datas["filled.Type"] = "sell";
  } else {
    datas["filled.Type"] = "buy";
  }

  const tradedata = await tradeTable
    .aggregate([
      { $unwind: "$filled" },
      { $project: { filled: 1, forced_liquidation: 1 } },
      { $match: datas },
    ]);

  const perdata = await perpetual.find(
    { $or: [{ tiker_root: curorder.pairname }, { tiker_root: "BTCUSD" }] });

  if (tradedata && tradedata.length > 0) {
    //console.log(tradedata, 'tradedata')
    //console.log(perdata, 'perdata')
    if (perdata && perdata.length > 0) {
      var curtempamount = 0;
      var forceBreak = false;
      for (var i = 0; i < tradedata.length; i++) {
        //console.log(i, 'count')
        var curorderupdate = {};
        var tradeupdate = {};
        //console.log(curtempamount, 'curtempamount')
        var curtradequan = Math.abs(curorder.filledAmount) - Math.abs(curtempamount);
        var tradequan = parseFloat(Math.abs(tradedata[i].filled.filledAmount)).toFixed(8);
        //console.log(Math.abs(curtradequan) + "==" + Math.abs(tradequan))
        //console.log("amount matching")
        if (Math.abs(curtradequan) == Math.abs(tradequan)) {
          curorderupdate["position_status"] = 0;
          curorderupdate["positionFilled"] = tradequan;

          tradeupdate["position_status"] = 0;
          tradeupdate["positionFilled"] = tradequan;
          forceBreak = true;
        } else if (Math.abs(curtradequan) < Math.abs(tradequan)) {
          curorderupdate["position_status"] = 0;
          curorderupdate["positionFilled"] = curtradequan;

          tradeupdate["position_status"] = 2;
          tradeupdate["positionFilled"] = curtradequan;
          forceBreak = true;
        } else {
          curorderupdate["position_status"] = 2;
          curorderupdate["positionFilled"] = tradequan;

          tradeupdate["position_status"] = 0;
          tradeupdate["positionFilled"] = tradequan;
        }
        //console.log(curorderupdate, 'curorderupdate')
        //console.log(tradeupdate, 'tradeupdate')

        var curorderdata = curorder;
        var traderdata = tradedata[i];
        var sellupdate = curorderupdate;
        var buyupdate = tradeupdate;
        var index = perdata.findIndex((x) => x.tiker_root === curorder.pairname);
        var btcindex = perdata.findIndex((x) => x.tiker_root === "BTCUSD");
        var btcprice = perdata[btcindex].markprice;
        var markprice = perdata[index].markprice;

        var sellorderid = traderdata.filled.sellId;
        var firstCurrency = curorderdata.firstCurrency;
        var secondCurrency = curorderdata.secondCurrency;
        var forced_liquidation = curorderdata.forced_liquidation;
        var sellorder_value = curorderdata.order_value;
        var buyorderid = curorderdata.buyId;
        var user_id = curorderdata.user_id;
        var sellFees = curorderdata.Fees;
        var buyFees = traderdata.filled.Fees;
        var beforeBalance = traderdata.filled.beforeBalance;
        var afterBalance = traderdata.filled.afterBalance;
        var buyorder_value = traderdata.filled.order_value;
        var sellpairName = curorderdata.pairname;
        var selluserId = curorderdata.buyuserId;
        var sellpair = curorderdata.pair;
        var buyquantity = Math.abs(traderdata.filled.filledAmount);
        var sellprice = curorderdata.Price;
        var buyprice = traderdata.filled.Price;
        var orderCost = traderdata.filled.order_cost;

        // //console.log(curorderdata.uniqueid, "buycurorder.uniqueid");
        //console.log(buyupdate, "buyupdate.position_status");
        //console.log(sellupdate, "sellupdate.position_status");

        const updatedetails = await tradeTable.findOneAndUpdate(
          { "filled.uniqueid": curorderdata.uniqueid },
          {
            $set: {
              "filled.$.position_status": sellupdate.position_status,
              "filled.$.positionFilled": sellupdate.positionFilled,
            }
          },
          { multi: true, fields: { filled: 1 } });

        const balancedata = await Assets.findOne(
          { currencySymbol: "BTC", userId: ObjectId(user_id) });
        //console.log(balancedata, 'balancedata')

        if (balancedata) {
          var totalfees = parseFloat(buyFees);
          var profitnlossusd = parseFloat(sellprice) - parseFloat(buyprice);
          var profitnlossusd =
            parseFloat(profitnlossusd) *
            parseFloat(sellupdate.positionFilled);

          var profitnloss = parseFloat(profitnlossusd) / parseFloat(btcprice);
          // var profitnloss    = parseFloat(sellorder_value)-parseFloat(buyorder_value);

          var fprofitnloss = parseFloat(profitnloss) - parseFloat(totalfees);
          var updatebal = parseFloat(orderCost) + parseFloat(fprofitnloss);
          if (forced_liquidation) {
            updatebal = orderCost * -1;
          }

          var reducebalance =
            parseFloat(beforeBalance) - parseFloat(afterBalance);

          var updatebaldata = {};
          updatebaldata["balance"] = updatebal;
          var afterBalance1 =
            parseFloat(balancedata.balance) + parseFloat(updatebal);

          const newposition = new position_table({
            pairname: sellpairName,
            pair: sellpair,
            userId: user_id,
            closing_direction: "Closed long",
            quantity: sellupdate.positionFilled,
            exit_price: sellprice,
            entry_price: buyprice,
            profitnloss: forced_liquidation ? updatebal : profitnloss,
            exit_type: forced_liquidation ? "Liquidated" : "Trade",
            beforeBalance: balancedata.balance,
            afterBalance: afterBalance1,
            orderCost: orderCost,
          });

          const savedata = await newposition.save();
          //console.log(savedata, 'savedata')
          const balupd = await Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(user_id) },
            { $inc: updatebaldata },
            { new: true, fields: { balance: 1 } });

          //console.log(traderdata.filled.uniqueid, 'buy unique id')
          const buyposupdate = await tradeTable.findOneAndUpdate(
            { "filled.uniqueid": traderdata.filled.uniqueid },
            {
              $set: {
                "filled.$.position_status": buyupdate.position_status,
                "filled.$.positionFilled": buyupdate.positionFilled,
              }
            },
            { multi: true, fields: { filled: 1 } });

          //console.log(buyposupdate, 'buyposupdate')
          setTimeout(function () {
            getusertradedata(selluserId, firstCurrency, secondCurrency);
            getusertradedata(user_id, firstCurrency, secondCurrency);
            gettradedata(firstCurrency, secondCurrency, socketio);
          }, 5000);
          //console.log(Math.abs(curtempamount) + " " + Math.abs(sellupdate.positionFilled));
          //console.log("testmp")
          curtempamount = Math.abs(curtempamount) + Math.abs(sellupdate.positionFilled)
          if (forceBreak == true) {
            break;
            return true;
          }
        }
      }
    }

  }
  else {
    return true;
  }

}

const buypositionmatching = async (curorder) => {
  //console.log(curorder, 'curorder----buypositionmatching')
  var datas = {
    $or: [{ "filled.position_status": "2" }, { "filled.position_status": "1" }],
    "filled.user_id": ObjectId(curorder.user_id),
    "filled.pairname": curorder.pairname,
    // "filled.position_status": "1",
    "filled.status": "filled",
  },
    sort;
  if (curorder.Type == "buy") {
    datas["filled.Type"] = "sell";
  } else {
    datas["filled.Type"] = "buy";
  }

  const tradedata = await tradeTable
    .aggregate([
      { $unwind: "$filled" },
      { $project: { filled: 1, forced_liquidation: 1 } },
      { $match: datas },
    ]);

  const perdata = await perpetual.find(
    { $or: [{ tiker_root: curorder.pairname }, { tiker_root: "BTCUSD" }] });
  var forceBreak = false;
  //console.log(tradedata, 'tradedata----buypositionmatching--')
  //console.log(perdata, 'perdata---buypositionmatching--')
  if (tradedata && tradedata.length > 0) {
    if (perdata && perdata.length > 0) {
      var curtempamount = 0;
      for (var i = 0; i < tradedata.length; i++) {
        //console.log(i, 'count')
        var curorderupdate = {};
        var tradeupdate = {};
        var curtradequan = Math.abs(curorder.filledAmount) - Math.abs(curtempamount);
        var tradequan = parseFloat(Math.abs(tradedata[i].filled.filledAmount)).toFixed(8);
        //console.log(Math.abs(curtradequan) + "==" + Math.abs(tradequan))
        //console.log("buy amount matching")
        if (Math.abs(curtradequan) == Math.abs(tradequan)) {
          curorderupdate["position_status"] = 0;
          curorderupdate["positionFilled"] = tradequan;

          tradeupdate["position_status"] = 0;
          tradeupdate["positionFilled"] = tradequan;
          forceBreak = true;
        } else if (Math.abs(curtradequan) < Math.abs(tradequan)) {
          curorderupdate["position_status"] = 0;
          curorderupdate["positionFilled"] = curtradequan;

          tradeupdate["position_status"] = 2;
          tradeupdate["positionFilled"] = curtradequan;
          forceBreak = true;
        } else {
          curorderupdate["position_status"] = 2;
          curorderupdate["positionFilled"] = tradequan;

          tradeupdate["position_status"] = 0;
          tradeupdate["positionFilled"] = tradequan;
        }
        //console.log(curorderupdate, 'curorderupdate')
        //console.log(tradeupdate, 'tradeupdate')

        var curorderdata = curorder;
        var traderdata = tradedata[i];
        var sellupdate = tradeupdate;
        var buyupdate = curorderupdate;
        var index = perdata.findIndex((x) => x.tiker_root === curorder.pairname);
        var btcindex = perdata.findIndex((x) => x.tiker_root === "BTCUSD");
        var btcprice = perdata[btcindex].markprice;
        var markprice = perdata[index].markprice;

        var sellorderid = traderdata.filled.sellId;
        var firstCurrency = curorderdata.firstCurrency;
        var secondCurrency = curorderdata.secondCurrency;
        var forced_liquidation = curorderdata.forced_liquidation;
        var buyorder_value = curorderdata.order_value;
        var buyorderid = curorderdata.buyId;
        var user_id = curorderdata.user_id;
        var buyFees = curorderdata.Fees;
        var sellFees = traderdata.filled.Fees;
        var beforeBalance = traderdata.filled.beforeBalance;
        var afterBalance = traderdata.filled.afterBalance;
        var sellorder_value = traderdata.filled.order_value;
        var buypairName = curorderdata.pairname;
        var buyuserId = curorderdata.buyuserId;
        var buypair = curorderdata.pair;
        var sellquantity = Math.abs(traderdata.filled.filledAmount);
        var buyprice = curorderdata.Price;
        var sellprice = traderdata.filled.Price;
        var orderCost = traderdata.filled.order_cost;

        // //console.log(curorderdata.uniqueid, "buycurorder.uniqueid");
        //console.log(buyupdate, "buyupdate.position_status");
        //console.log(sellupdate, "sellupdate.position_status");

        const updatedetails = await tradeTable.findOneAndUpdate(
          { "filled.uniqueid": curorderdata.uniqueid },
          {
            $set: {
              "filled.$.position_status": buyupdate.position_status,
              "filled.$.positionFilled": buyupdate.positionFilled,
            }
          },
          { multi: true, fields: { filled: 1 } });

        const balancedata = await Assets.findOne(
          { currencySymbol: "BTC", userId: ObjectId(user_id) });
        //console.log(balancedata, 'balancedata')

        if (balancedata) {
          var totalfees = parseFloat(buyFees);
          var profitnlossusd = parseFloat(sellprice) - parseFloat(buyprice);
          var profitnlossusd =
            parseFloat(profitnlossusd) *
            parseFloat(sellupdate.positionFilled);

          var profitnloss = parseFloat(profitnlossusd) / parseFloat(btcprice);
          // var profitnloss    = parseFloat(sellorder_value)-parseFloat(buyorder_value);

          var fprofitnloss = parseFloat(profitnloss) - parseFloat(totalfees);
          var updatebal = parseFloat(orderCost) + parseFloat(fprofitnloss);
          if (forced_liquidation) {
            updatebal = orderCost * -1;
          }

          var reducebalance =
            parseFloat(beforeBalance) - parseFloat(afterBalance);

          var updatebaldata = {};
          updatebaldata["balance"] = updatebal;
          var afterBalance1 =
            parseFloat(balancedata.balance) + parseFloat(updatebal);

          const newposition = new position_table({
            pairname: buypairName,
            pair: buypair,
            userId: user_id,
            closing_direction: "Closed short",
            quantity: sellupdate.positionFilled,
            exit_price: buyprice,
            entry_price: sellprice,
            profitnloss: forced_liquidation ? updatebal : profitnloss,
            exit_type: forced_liquidation ? "Liquidated" : "Trade",
            beforeBalance: balancedata.balance,
            afterBalance: afterBalance1,
            orderCost: orderCost,
          });

          const savedata = await newposition.save();
          //console.log(savedata, 'savedata')
          const balupd = await Assets.findOneAndUpdate(
            { currencySymbol: "BTC", userId: ObjectId(user_id) },
            { $inc: updatebaldata },
            { new: true, fields: { balance: 1 } });


          const sellposupdate = await tradeTable.findOneAndUpdate(
            { "filled.uniqueid": traderdata.filled.uniqueid },
            {
              $set: {
                "filled.$.position_status": sellupdate.position_status,
                "filled.$.positionFilled": buyupdate.positionFilled,
              }
            },
            { multi: true, fields: { filled: 1 } });

          setTimeout(function () {
            getusertradedata(buyuserId, firstCurrency, secondCurrency);
            getusertradedata(user_id, firstCurrency, secondCurrency);
            gettradedata(firstCurrency, secondCurrency, socketio);
          }, 5000);
          //console.log(Math.abs(curtempamount) + " " + Math.abs(sellupdate.positionFilled));
          //console.log("testmp buy")
          curtempamount = Math.abs(curtempamount) + Math.abs(sellupdate.positionFilled)
          if (forceBreak == true) {
            break;
            return true;
          }
        }
      }
    }

  }
  else {
    return true;
  }

}

function positionmatching(curorder) {
  // //console.log('positionmatching',curorder);
  var datas = {
    "filled.user_id": ObjectId(curorder.user_id),
    "filled.pairname": curorder.pairname,
    "filled.position_status": "1",
    "filled.status": "filled",
  },
    sort;
  if (curorder.Type == "buy") {
    datas["filled.Type"] = "sell";
  } else {
    datas["filled.Type"] = "buy";
  }
  tradeTable
    .aggregate([
      { $unwind: "$filled" },
      { $project: { filled: 1, forced_liquidation: 1 } },
      { $match: datas },
    ])
    .exec((tradeerr, tradedata) => {
      // //console.log(tradedata,'positiontradedata')
      perpetual.find(
        { $or: [{ tiker_root: curorder.pairname }, { tiker_root: "BTCUSD" }] },
        function (pererr, perdata) {
          if (tradedata.length > 0) {
            if (curorder.Type == "buy") {
              buysideposition(curorder, tradedata, perdata);
            } else {
              sellsideposition(curorder, tradedata, perdata);
            }
          }
        }
      );
    });
}

function rounds(n) {
  var roundValue = (+n).toFixed(8);
  return parseFloat(roundValue);
}

router.post("/user-activate", (req, res) => {
  var userid = req.body.userid;
  var updateObj = { active: "Activated" };
  User.findByIdAndUpdate(userid, updateObj, { new: true }, function (
    err,
    user
  ) {
    if (user) {
      return res
        .status(200)
        .json({ message: "Your Account activated successfully" });
    }
  });
});

router.post("/perpetual-data/", (req, res) => {
  perpetual.find({}).then((result) => {
    if (result) {
      return res
        .status(200)
        .json({ status: true, data: result, type: "perpetual" });
    }
  });
});

router.post("/spot-data/", (req, res) => {
  spotpairs.find({}).then((result) => {
    if (result) {
      return res.status(200).json({ status: true, data: result, type: "spot" });
    }
  });
});

router.post("/pair-data/", (req, res) => {
  var tablename = req.body.exchangetype == "Spot" ? spotpairs : perpetual;
  tablename.find({}).then((result) => {
    if (result) {
      return res
        .status(200)
        .json({ status: true, data: result, type: "perpetual" });
    }
  });
});

router.post("/order-history/", (req, res) => {
  var tablename = req.body.exchangetype == "Spot" ? spottradeTable : tradeTable;
  tablename
    .find({ userId: ObjectId(req.body.userid) })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "orderhistory" });
      }
    });
});

router.post("/assethistory/", (req, res) => {
  Transaction.find({
    user_id: ObjectId(req.body.userid),
    transferType: { $ne: "TOADMIN" },
  })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "assethistory" });
      }
    });
});

router.post("/bonus-historywithlimit", (req, res) => {
  //console.log("req.body", req.body);
  if (req.body.limit == "All") {
    Bonus.find({ userId: ObjectId(req.body.userid) })
      .populate({ path: "referId", select: "email" })
      .sort({ _id: -1 })
      .then((result) => {
        if (result) {
          return res
            .status(200)
            .json({ status: true, data: result, type: "bonushistory" });
        }
      });
  } else {
    Bonus.find({ userId: ObjectId(req.body.userid) })
      .populate({ path: "referId", select: "email" })
      .sort({ _id: -1 })
      .limit(req.body.rescentcount)
      .then((result) => {
        // //console.log("Resut",result)
        if (result) {
          return res
            .status(200)
            .json({ status: true, data: result, type: "bonushistory" });
        }
      });
  }
});

router.post("/bonus-history/", (req, res) => {
  Bonus.find({ userId: ObjectId(req.body.userid) })
    .populate({ path: "referId", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "bonushistory" });
      }
    });
});

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

router.post("/trade-history/", (req, res) => {
  var tablename = req.body.exchangetype == "Spot" ? spottradeTable : tradeTable;
  tablename
    .find({ status: 1, userId: ObjectId(req.body.userid) })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "tradehistory" });
      }
    });
});

router.post("/closedposhistory/", (req, res) => {
  position_table
    .find({ userId: ObjectId(req.body.userid), pairname: req.body.pair })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "closedposhistory" });
      }
    });
});

router.post("/position_details/", (req, res) => {
  var userId = req.body.userId;
  var pair = req.body.pair;
  async.parallel(
    {
      position_details: function (cb) {
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "1" }, { status: "2" }],
                userId: ObjectId(userId),
                pairName: pair,
              },
            },
            { $unwind: "$filled" },
            { $match: { "filled.position_status": "1" } },
            { $project: { filled: 1, leverage: 1 } },
            {
              $group: {
                _id: null,
                price: { $avg: "$filled.Price" },
                quantity: { $sum: "$filled.filledAmount" },
                pairName: { $first: "$filled.pairname" },
                leverage: { $first: "$leverage" },
              },
            },
          ])
          .exec(cb);
      },
      daily_details: function (cb) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);
        // //console.log(start,'start');
        var end = new Date();
        end.setHours(23, 59, 59, 999);
        // //console.log(end,'start');
        tradeTable
          .aggregate([
            {
              $match: {
                $or: [{ status: "1" }, { status: "2" }],
                position_status: "1",
                userId: ObjectId(userId),
                pairName: pair,
              },
            },
            { $unwind: "$filled" },
            { $project: { filled: 1, leverage: 1 } },
            {
              $match: {
                "filled.created_at": {
                  $gte: new Date(start),
                  $lt: new Date(end),
                },
              },
            },
            {
              $group: {
                _id: null,
                price: { $avg: "$filled.Price" },
                quantity: { $sum: "$filled.filledAmount" },
                Fees: { $sum: "$filled.Fees" },
                pairName: { $first: "$filled.pairname" },
                leverage: { $first: "$leverage" },
              },
            },
          ])
          .exec(cb);
      },
    },
    (err, results) => {
      return res
        .status(200)
        .json({ status: true, data: results, type: "position_details" });
    }
  );
});

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
  // //console.log(match,'search data');
  position_table.find(match).then((result) => {
    if (result) {
      return res
        .status(200)
        .json({ status: true, data: result, type: "closedposhistory" });
    }
  });
});

// cron.schedule("*/4 * * * * *", (req, res) => {
//   indexprice_calculation("LTCUSD", socketio);
// });

// cron.schedule("*/4 * * * * *", (req, res) => {
//   indexprice_calculation("ETHBTC", socketio);
// });
// cron.schedule("*/2 * * * * *", (req, res) => {
//   indexprice_calculation("BTCUSD", socketio);
// });

// cron.schedule("*/2 * * * * *", (req, res) => {
//   indexprice_calculation("ETHUSD", socketio);
// });

// cron.schedule("*/3 * * * * *", (req, res) => {
//   indexprice_calculation("BCHUSD", socketio);
// });

// cron.schedule("*/3 * * * * *", (req, res) => {
//   indexprice_calculation("XRPUSD", socketio);
// });

// cron.schedule("*/6 * * * * *", (req, res) => {
//   indexprice_calculation("LTCBTC", socketio);
// });

// cron.schedule("*/8 * * * * *", (req, res) => {
//   indexprice_calculation("BCHBTC", socketio);
// });

// cron.schedule("*/8 * * * * *", (req, res) => {
//   indexprice_calculation("XRPBTC", socketio);
// });

// cron.schedule("*/6 * * * * *", (req, res) => {
//   bnbindexprice_calculation("BNBBTC", socketio);
// });
// cron.schedule("*/6 * * * * *", (req, res) => {
//   bnbindexprice_calculation("BNBUSDT", socketio);
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

// cron.schedule("*/15 * * * * *", (req, res) => {
//   stopordertrigger("BTCUSD");
// });

// cron.schedule("*/15 * * * * *", (req, res) => {
//   stopordertrigger("LTCUSD");
// });

// cron.schedule("*/15 * * * * *", (req, res) => {
//   stopordertrigger("BCHUSD");
// });

// cron.schedule("*/15 * * * * *", (req, res) => {
//   stopordertrigger("ETHUSD");
// });

// cron.schedule("*/15 * * * * *", (req, res) => {
//   stopordertrigger("XRPUSD");
// });

// cron.schedule('* * * * * *', (req,res) => {
//   // //console.log('3SECCRON');
//   exchangePrices.find({})
//             .skip(10000)
//             .sort({createdAt: 'desc'})
//             .exec(function(err, result) {
//             if (err) {
//               next(err);
//               //console.log(err,'error');
//             }
//             if (result) {
//               // //console.log(result);
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

// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("DASHBTC", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("TRXBTC", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("XMRBTC", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("DASHUSD", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("TRXUSD", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("XMRUSD", socketio);
// });
//
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("BNBUSD", socketio);
// });
// cron.schedule("*/15 * * * * *", (req, res) => {
//   coinpaymentindexpricecalculation("BNBBTC", socketio);
// });


//
// async function coinpaymentindexpricecalculation(pair, io = null) {
//   var spotpairname=pair
//   // if(pair=="DASHUSD"|| pair=="TRXUSD"||pair=="XMRUSD"){
//   //     spotpairname = pair.replace("USD", "USDT");
//   // }else{
//   //   spotpairname=pair
//   // }
//   // //console.log("spotpair in coinpayment",spotpairname);
//   exchangePrices
//     .findOne({ pairname: spotpairname })
//       .exec(function (err, findresult) {
//         if(findresult){
//           // //console.log("findresult",findresult);
//           var markprice=findresult.last
//           var lowprice=findresult.low
//           var highprice=findresult.high
//           var changefromdb=parseFloat(highprice)-parseFloat(lowprice)
//           if(pair=="DASHUSD"|| pair=="TRXUSD"||pair=="XMRUSD"||pair=="BNBUSD"){
//               spotpairname = pair.replace("USD", "USDT");
//           }else{
//             spotpairname=pair
//           }
//           // //console.log("pairsssssssss",spotpairname);
//           spotpairs.findOneAndUpdate(
//             { tiker_root: spotpairname },
//             // { $set: { markprice: markprice,low:lowprice ,high:highprice,change:changefromdb } },
//             { $set: { markprice: markprice} },
//             {
//               new: true,
//               fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
//             },
//             function (pererr1, spotupdated) {
//               if(spotupdated){
//                 // //console.log("spotupdated",spotupdated);
//                 if(pair=="DASHUSD"|| pair=="TRXUSD"||pair=="XMRUSD"||pair=="BNBUSD"){
//                     spotpairname = pair.replace("USDT", "USD");
//                 }else{
//                   spotpairname=pair
//                 }
//                 const newrecord = new spotPrices({
//                   price: spotupdated.markprice,
//                   pair: ObjectId(spotupdated._id),
//                   pairname: spotpairname,
//                   createdAt: new Date(),
//                 });
//                 newrecord.save().then((result) => {
//                 // //console.log("Saveddsa", result);
//               });
//                 io.emit("PRICEDETAILS", spotupdated);
//
//               }
//
//             })
//
//         }
//       })
// }
//
// async function bnbindexprice_calculation(pair, io = null) {
//   var exc_A_avgtradevolumefor_month = await getspotprice("Binance", pair);
//   var exc_B_avgtradevolumefor_month = await getspotprice("Coinsbit", pair);
//   var exc_C_avgtradevolumefor_month = await getspotprice("CoinEx", pair);
//   var exchange_A_spotprice = exc_A_avgtradevolumefor_month
//     ? exc_A_avgtradevolumefor_month.last
//     : 0;
//   var exchange_B_spotprice = exc_B_avgtradevolumefor_month
//     ? exc_B_avgtradevolumefor_month.last
//     : 0;
//   var exchange_C_spotprice = exc_C_avgtradevolumefor_month
//     ? exc_C_avgtradevolumefor_month.last
//     : 0;
//   // //console.log("pairr",pair)
//   //   //console.log("exc_B_avgtradevolumefor_month",exc_B_avgtradevolumefor_month);
//   //   //console.log("exc_C_avgtradevolumefor_month",exc_C_avgtradevolumefor_month );
//   //   //console.log("exc_B_avgtradevolumefor_month",exc_B_avgtradevolumefor_month);
//   exc_A_avgtradevolumefor_month = exc_A_avgtradevolumefor_month
//     ? exc_A_avgtradevolumefor_month.volume
//     : 0;
//   exc_B_avgtradevolumefor_month = exc_B_avgtradevolumefor_month
//     ? exc_B_avgtradevolumefor_month.volume
//     : 0;
//   exc_C_avgtradevolumefor_month = exc_C_avgtradevolumefor_month
//     ? exc_C_avgtradevolumefor_month.volume
//     : 0;
//
//   // //console.log(exc_A_avgtradevolumefor_month);
//   // //console.log(exc_B_avgtradevolumefor_month);
//   // //console.log(exc_C_avgtradevolumefor_month);
//   // return false;
//
//   // var exc_A_avgtradevolumefor_month =  2722988075;
//   // var exc_B_avgtradevolumefor_month =  6031867375;
//   // var exc_C_avgtradevolumefor_month =  3951095106;
//
//   Totalexcvol =
//     exc_A_avgtradevolumefor_month +
//     exc_B_avgtradevolumefor_month +
//     exc_C_avgtradevolumefor_month;
//   //Weightage calculation
//
//   var Wt_A =
//     parseFloat(exc_A_avgtradevolumefor_month) / parseFloat(Totalexcvol);
//   var Wt_B =
//     parseFloat(exc_B_avgtradevolumefor_month) / parseFloat(Totalexcvol);
//   var Wt_C =
//     parseFloat(exc_C_avgtradevolumefor_month) / parseFloat(Totalexcvol);
//
//   // //console.log(exchange_A_ticker,'indexprice_calculation');
//   // return false;
//   // //console.log(exchange_B_ticker,'ticker details');
//
//   // //console.log(exchange_A_spotprice,'A price');
//   // //console.log(exchange_B_spotprice,'B price');
//   // //console.log(exchange_C_spotprice,'C price');
//
//   var total = Wt_A + Wt_B + Wt_C;
//   var awei = (Wt_A / total) * 100;
//   var bwei = (Wt_B / total) * 100;
//   var cwei = (Wt_C / total) * 100;
//
//   var EBTC =
//     parseFloat(awei / 100) * parseFloat(exchange_A_spotprice) +
//     parseFloat(bwei / 100) * parseFloat(exchange_B_spotprice) +
//     parseFloat(cwei / 100) * parseFloat(exchange_C_spotprice);
//   var pricespreadofA = Math.abs(
//     parseFloat(exchange_A_spotprice) - parseFloat(EBTC)
//   );
//   var pricespreadofB = Math.abs(
//     parseFloat(exchange_B_spotprice) - parseFloat(EBTC)
//   );
//   var pricespreadofC = Math.abs(
//     parseFloat(exchange_C_spotprice) - parseFloat(EBTC)
//   );
//
//   var asquare = 1 / (parseFloat(pricespreadofA) * parseFloat(pricespreadofA));
//   var bsquare = 1 / (parseFloat(pricespreadofB) * parseFloat(pricespreadofB));
//   var csquare = 1 / (parseFloat(pricespreadofC) * parseFloat(pricespreadofC));
//   var totalsquar =
//     parseFloat(asquare) + parseFloat(bsquare) + parseFloat(csquare);
//   var weight_A = parseFloat(asquare) / parseFloat(totalsquar);
//   var weight_B = parseFloat(bsquare) / parseFloat(totalsquar);
//   var weight_C = parseFloat(csquare) / parseFloat(totalsquar);
//
//   var index_price =
//     parseFloat(weight_A) * parseFloat(exchange_A_spotprice) +
//     parseFloat(weight_B) * parseFloat(exchange_B_spotprice) +
//     parseFloat(weight_C) * parseFloat(exchange_C_spotprice);
//
//   // //console.log(index_price,'indexprice');
//   var Interest_Quote_Index = 1 / 100;
//   var Interest_Base_Index = 0.25 / 100;
//   var fundingrate = (Interest_Quote_Index * Interest_Base_Index) / 3;
//
//   var timeuntillfunding = 5; //need to calculate
//   var fundinbasis = fundingrate * (timeuntillfunding / 3);
//   var mark_price = index_price * (1 + fundinbasis);
//
//   // //console.log(mark_price,'mark price');
//   var lastspot = await getlastspot(pair);
//
//   if (typeof index_price != "undefined" && typeof mark_price != "undefined") {
//     // //console.log(mark_price,'mark_price')
//     var tablename = pair == "ETHBTC" ? spotpairs : perpetual;
//     perpetual.findOneAndUpdate(
//       { tiker_root: pair },
//       { $set: { markprice: mark_price } },
//       {
//         new: true,
//         fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
//       },
//       function (pererr, perdata) {
//         var pricedata = perdata;
//         var spotpairname = pair;
//                 // var spotpairname = pair.replace("USD", "USDT");
//
//         spotpairs.findOneAndUpdate(
//           { tiker_root: spotpairname },
//           { $set: { markprice: mark_price } },
//           {
//             new: true,
//             fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
//           },
//           function (pererr1, perdata1) {
//             //var perdata = {"markprice":Math.floor(1000 + Math.random() * 9000),"last":1234,"tiker_root":"BTCUSD"};
//             io.emit("PRICEDETAILS", perdata1 ? perdata1 : pricedata);
//             var perdata = perdata1 ? perdata1 : pricedata;
//             if (perdata) {
//               var markprice = mark_price ? mark_price : 0;
//               var newpairr = pair.replace("USDT", "USD")
//               const newrecord = new spotPrices({
//                 price: mark_price ? mark_price : 0,
//                 pair: ObjectId(perdata._id),
//                 pairname: newpairr,
//                 createdAt: new Date(),
//               });
//               // //console.log(lastspot.price,'lastspot')
//               // //console.log(markprice,'markprice')
//               if (lastspot) {
//                 var difference = Math.abs(
//                   parseFloat(lastspot.price) - parseFloat(markprice)
//                 );
//                 var percent =
//                   (parseFloat(difference) / parseFloat(lastspot.price)) * 100;
//               }
//
//               if (markprice != 0 && markprice != "") {
//                 // //console.log('insert')
//                 newrecord.save(function (err, data) {
//                   // //console.log(err,'err');
//                   // //console.log(data,'data');
//                   // setTimeout(function () {
//                   //  stopordertrigger(mark_price,pair);
//                   // }, 5000);
//                 });
//               }
//             }
//           }
//         );
//       }
//     );
//   }
//   //here
//   // var Interest_Quote_Index = 1 / 100;
//   // var Interest_Base_Index = 0.25 / 100;
//   // // var mark_price        = 9260
//
//   // var Interest_Rate = ((Interest_Quote_Index - Interest_Base_Index) / 3) * 100;
//
//   // // var imapactbidprice      = await getimpactbidprice('buy',pair);
//   // // var imapactaskprice      = await getimpactbidprice('sell',pair);
//
//   // var imapactbidprice = await getspotprice(pair, "Coinbase");
//   // var imapactaskprice = await getspotprice(pair, "Kraken");
//   // // //console.log(imapactbidprice,'imapactbidprice'+pair);
//
//   // var exchange_A_ticker = await getspotprice(pair, "Bitstamp");
//   // var exchange_A_spotprice = exchange_A_ticker ? exchange_A_ticker.last : 0;
//
//   // if (typeof imapactbidprice != "undefined") {
//   //   imapactbidprice = imapactbidprice ? imapactbidprice.last : 0;
//   //   imapactaskprice = imapactaskprice ? imapactaskprice.last : 0;
//
//   //   // //console.log(imapactbidprice,'imapactbidprice');
//   //   // //console.log(imapactaskprice,'imapactaskprice');
//
//   //   var midprice = Math.round((imapactbidprice + imapactaskprice) / 2);
//
//   //   // //console.log(mark_price,'mark_price');
//   //   // //console.log(Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price)),'first');
//   //   // //console.log(Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice)),'second');
//   //   // //console.log(exchange_A_spotprice,'second');
//   //   var first = Math.max(
//   //     0,
//   //     parseFloat(imapactbidprice) - parseFloat(mark_price)
//   //   );
//   //   var second = Math.max(
//   //     0,
//   //     parseFloat(mark_price) - parseFloat(imapactaskprice)
//   //   );
//   //   var premium_index = (first - second) / parseFloat(exchange_A_spotprice);
//
//   //   // //console.log(premium_index,'premium_index');
//
//   //   var date = new Date();
//   //   var curhour = date.getHours();
//   //   var timeuntillfunding =
//   //     curhour > 0 && curhour < 8
//   //       ? 8 - curhour
//   //       : curhour > 8 && curhour < 16
//   //       ? 16 - curhour
//   //       : curhour > 16 && curhour < 24
//   //       ? 24 - curhour
//   //       : 0;
//
//   //   // var fairbasis      = (parseFloat(midprice)/parseFloat(index_price)-1)/(30/365);
//   //   var fairbasis = fundingrate * (timeuntillfunding / 3);
//   //   // //console.log(fairbasis,'fairbasis');
//   //   premium_index = parseFloat(premium_index) + fundingrate;
//
//   //   // //console.log(parseFloat(premium_index),'premium_index');
//   //   // //console.log(Interest_Rate,'Interest_Rate');
//
//   //   const clamp = (min, max) => (value) =>
//   //     value < min ? min : value > max ? max : value;
//   //   // var Interest_Rate = 0.01;
//   //   var cl = Interest_Rate - premium_index;
//   //   var minusval = Math.min(Math.max(parseFloat(cl), -0.05), 0.05);
//   //   // //console.log(parseFloat(minusval),'minusval');
//   //   var Funding_Rate = parseFloat(premium_index) + parseFloat(minusval);
//   //   // //console.log(Funding_Rate,'Funding_Rate');
//   //   if (
//   //     typeof Funding_Rate != "undefined" &&
//   //     typeof mark_price != "undefined"
//   //   ) {
//   //     perpetual.findOneAndUpdate(
//   //       { tiker_root: pair },
//   //       {
//   //         $set: {
//   //           funding_rate: Funding_Rate,
//   //           markprice: mark_price,
//   //           index_price: index_price,
//   //         },
//   //       },
//   //       { new: true, fields: { tiker_root: 1, last: 1, markprice: 1 } },
//   //       function (pererr, perdata) {
//   //         // //console.log(perdata);
//   //       }
//   //     );
//   //   }
//   // }
// }

function stopordertrigger(pair) {
  perpetual.findOne(
    { tiker_root: pair },
    {
      tiker_root: 1,
      first_currency: 1,
      second_currency: 1,
      markprice: 1,
      maxquantity: 1,
      minquantity: 1,
    },
    function (err, contractdetails) {
      if (contractdetails) {
        var markprice = contractdetails.markprice;
        // if(pair=='XRPUSD')
        // {
        // //console.log(markprice,'markprice');
        // }
        if (!isNaN(markprice)) {
          async.parallel(
            {
              stopbuyOrder: function (cb) {
                tradeTable
                  .find({
                    trigger_ordertype: "stop",
                    pairName: pair,
                    status: "4",
                    stopstatus: "2",
                    trigger_type: "Mark",
                    buyorsell: "sell",
                    trigger_price: { $gte: markprice },
                    userId: { $ne: ObjectId("5e567694b912240c7f0e4299") },
                  })
                  .exec(cb);
              },
              stopsellOrder: function (cb) {
                tradeTable
                  .find({
                    trigger_ordertype: "stop",
                    pairName: pair,
                    status: "4",
                    stopstatus: "2",
                    trigger_type: "Mark",
                    buyorsell: "buy",
                    trigger_price: { $lte: markprice },
                    userId: { $ne: ObjectId("5e567694b912240c7f0e4299") },
                  })
                  .exec(cb);
              },
              limitbuyorder: function (cb) {
                tradeTable
                  .find({
                    pairName: pair,
                    orderType: "Limit",
                    buyorsell: "sell",
                    price: { $lte: parseFloat(markprice).toFixed(8) },
                    $or: [{ status: "0" }, { status: "2" }],
                  })
                  .limit(100)
                  .sort({ price: 1 })
                  .exec(cb);
              },
              limitsellorder: function (cb) {
                tradeTable
                  .find({
                    pairName: pair,
                    orderType: "Limit",
                    buyorsell: "buy",
                    price: { $gte: parseFloat(markprice).toFixed(8) },
                    $or: [{ status: "0" }, { status: "2" }],
                  })
                  .limit(100)
                  .sort({ price: -1 })
                  .exec(cb);
              },
            },
            (err, results) => {
              var stopbuyOrder = results.stopbuyOrder;
              var stopsellOrder = results.stopsellOrder;
              var limitbuyorder = results.limitbuyorder;
              var limitsellorder = results.limitsellorder;
              if (stopbuyOrder.length) {
                var i = 0;
                generatestopbuyorder(stopbuyOrder[0], function () {
                  //console.log("stopbuyOrder of array", stopbuyOrder.length);
                  if (i === stopbuyOrder.length - 1) {
                    // //console.log("inside the if sss")
                    callBackResponseImport();
                  } else {
                    // //console.log("isndie else")
                    i += 1;
                    if (stopbuyOrder[i]) {
                      // //console.log("next creatinon token ss",currencytokendetails[i]);
                      generatestopbuyorder(stopbuyOrder[i]);
                    } else {
                      callBackResponseImport();
                    }
                  }
                });
                //
                // for (var i = 0; i < stopbuyOrder.length; i++) {
                //   var _id = stopbuyOrder[i]._id;
                //   var price = stopbuyOrder[i].price;
                //   var trigger_price = stopbuyOrder[i].trigger_price;
                //   var userId = stopbuyOrder[i].userId;
                //   var pairName = stopbuyOrder[i].pairName;
                //   var leverage = stopbuyOrder[i].leverage;
                //   var quantity = stopbuyOrder[i].quantity;
                //   var buyorsell = stopbuyOrder[i].buyorsell;
                //   var orderType = stopbuyOrder[i].orderType;
                //   var trailstop = stopbuyOrder[i].trailstop;
                //   var pos_leverage = stopbuyOrder[i].leverage;
                //   var pos_liqprice = stopbuyOrder[i].Liqprice;
                //   var curorder = stopbuyOrder[i];
                //   curorder.status = "0";
                //   var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
                //   tradeTable.findOneAndUpdate(
                //     { _id: ObjectId(_id), status: "4", stopstatus: "2" },
                //     { $set: { status: "0", price: trigger_price } },
                //     { new: true, fields: { status: 1 } },
                //     function (buytemp_err, buytempDat) {
                //       tradematching(curorder);
                //     }
                //   );
                // }
              }

              if (stopsellOrder.length) {
                var i = 0;
                generatestopsellorder(stopsellOrder[0], function () {
                  //console.log("stopsellOrder of array", stopsellOrder.length);
                  if (i === stopsellOrder.length - 1) {
                    // //console.log("inside the if sss")
                    callBackResponseImport();
                  } else {
                    // //console.log("isndie else")
                    i += 1;
                    if (stopsellOrder[i]) {
                      // //console.log("next creatinon token ss",currencytokendetails[i]);
                      generatestopsellorder(stopsellOrder[i]);
                    } else {
                      callBackResponseImport();
                    }
                  }
                });

                // for (var i = 0; i < stopsellOrder.length; i++) {
                //   var _id = stopsellOrder[i]._id;
                //   var price = stopsellOrder[i].price;
                //   var trigger_price = stopsellOrder[i].trigger_price;
                //   var userId = stopsellOrder[i].userId;
                //   var pairName = stopsellOrder[i].pairName;
                //   var leverage = stopsellOrder[i].leverage;
                //   var quantity = stopsellOrder[i].quantity;
                //   var buyorsell = stopsellOrder[i].buyorsell;
                //   var orderType = stopsellOrder[i].orderType;
                //   var trailstop = stopsellOrder[i].trailstop;
                //   var pos_leverage = stopsellOrder[i].leverage;
                //   var pos_liqprice = stopsellOrder[i].Liqprice;
                //   var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
                //   var curorder = stopsellOrder[i];
                //   curorder.status = "0";
                //   tradeTable.findOneAndUpdate(
                //     { _id: ObjectId(_id), status: "4", stopstatus: "2" },
                //     { $set: { status: "0", price: trigger_price } },
                //     { new: true, fields: { status: 1 } },
                //     function (buytemp_err, buytempDat) {
                //       tradematching(curorder);
                //     }
                //   );
                // }
              }

              //take profit
              tradeTable.findOneAndUpdate(
                {
                  trigger_ordertype: "takeprofit",
                  pairName: pair,
                  status: "4",
                  stopstatus: "2",
                  trigger_type: "Mark",
                  buyorsell: "sell",
                  trigger_price: { $lte: markprice },
                },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) { }
              );
              tradeTable.findOneAndUpdate(
                {
                  trigger_ordertype: "takeprofit",
                  pairName: pair,
                  status: "4",
                  stopstatus: "2",
                  trigger_type: "Mark",
                  buyorsell: "buy",
                  trigger_price: { $gte: markprice },
                },
                { $set: { status: "0" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) { }
              );

              tradeTable.findOneAndUpdate(
                {
                  pairName: pair,
                  orderType: "Market",
                  buyorsell: "sell",
                  price: { $lt: parseFloat(markprice - 1) },
                  $or: [{ status: "0" }, { status: "2" }],
                },
                { $set: { status: "3" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) { }
              );

              tradeTable.findOneAndUpdate(
                {
                  pairName: pair,
                  orderType: "Market",
                  buyorsell: "buy",
                  price: { $gt: parseFloat(markprice + 1) },
                  $or: [{ status: "0" }, { status: "2" }],
                },
                { $set: { status: "3" } },
                { new: true, fields: { status: 1 } },
                function (buytemp_err, buytempData) { }
              );
              if (limitbuyorder.length) {
                var i = 0;
                generatelimitbuyorder(limitbuyorder[0], function () {
                  //console.log("length of array", limitbuyorder.length);
                  if (i === limitbuyorder.length - 1) {
                    // //console.log("inside the if sss")
                    callBackResponseImport();
                  } else {
                    // //console.log("isndie else")
                    i += 1;
                    if (limitbuyorder[i]) {
                      // //console.log("next creatinon token ss",currencytokendetails[i]);
                      generatelimitbuyorder(limitbuyorder[i]);
                    } else {
                      callBackResponseImport();
                    }
                  }
                });
                // for (var i = 0; i < limitbuyorder.length; i++) {
                //   var _id = limitbuyorder[i]._id;
                //   var userId = limitbuyorder[i].userId;
                //   var buyorsell = limitbuyorder[i].buyorsell;
                //   var pairName = limitbuyorder[i].pairName;
                //   var leverage = limitbuyorder[i].leverage;
                //   var quantity =
                //     limitbuyorder[i].quantity - limitbuyorder[i].filledAmount;
                //   var price = limitbuyorder[i].price;
                //   var leverage = limitbuyorder[i].leverage;
                //   var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
                //   var float = pairName == "XRPUSD" ? 4 : 2;
                //   var buytype = buyorsell == "buy" ? "sell" : "buy";
                //     //console.log(pairName, "pairName");
                //     order_placing(
                //       "Market",
                //       buytype,
                //       parseFloat(price).toFixed(float),
                //       Math.abs(quantity),
                //       leverage,
                //       pairName,
                //       oppuser_id,
                //       (trigger_price = 0),
                //       (trigger_type = null),
                //       (id = 0),
                //       "",
                //       (trailstopdistance = 0)
                //     );
                //
                // }
              }

              if (limitsellorder.length) {

                var i = 0;
                generatelimitsellorder(limitsellorder[0], function () {
                  //console.log("limitsellorder of array", limitsellorder.length);
                  if (i === limitsellorder.length - 1) {
                    // //console.log("inside the if sss")
                    callBackResponseImport();
                  } else {
                    // //console.log("isndie else")
                    i += 1;
                    if (limitsellorder[i]) {
                      // //console.log("next creatinon token ss",currencytokendetails[i]);
                      generatelimitsellorder(limitsellorder[i]);
                    } else {
                      callBackResponseImport();
                    }
                  }
                });
                //
                // for (var i = 0; i < limitsellorder.length; i++) {
                //   var _id = limitsellorder[i]._id;
                //   var userId = limitsellorder[i].userId;
                //   var buyorsell = limitsellorder[i].buyorsell;
                //   var pairName = limitsellorder[i].pairName;
                //   var quantity =
                //     limitsellorder[i].quantity - limitsellorder[i].filledAmount;
                //   var price = limitsellorder[i].price;
                //   var leverage = limitsellorder[i].leverage;
                //   var leverage = limitsellorder[i].leverage;
                //   var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
                //   var float = pairName == "XRPUSD" ? 4 : 2;
                //   var buytype = buyorsell == "buy" ? "sell" : "buy";
                //   // if (leverage <= 20) {
                //     order_placing(
                //       "Market",
                //       buytype,
                //       parseFloat(price).toFixed(float),
                //       Math.abs(quantity),
                //       leverage,
                //       pairName,
                //       oppuser_id,
                //       (trigger_price = 0),
                //       (trigger_type = null),
                //       (id = 0),
                //       "",
                //       (trailstopdistance = 0)
                //     );
                //   // } else {
                //   //   cancel_trade(_id, userId);
                //   // }
                // }
              }
            }
          );
        }
      }
    }
  );
}

function generatestopbuyorder(stopbuyOrder, callBacksix) {
  if (callBacksix) {
    userinfo.callstopbuyorder = callBacksix;
  }
  //console.log("inside geenrate  stopsellOrder");
  var _id = stopbuyOrder._id;
  var price = stopbuyOrder.price;
  var trigger_price = stopbuyOrder.trigger_price;
  var userId = stopbuyOrder.userId;
  var pairName = stopbuyOrder.pairName;
  var leverage = stopbuyOrder.leverage;
  var quantity = stopbuyOrder.quantity;
  var buyorsell = stopbuyOrder.buyorsell;
  var orderType = stopbuyOrder.orderType;
  var trailstop = stopbuyOrder.trailstop;
  var pos_leverage = stopbuyOrder.leverage;
  var pos_liqprice = stopbuyOrder.Liqprice;
  var curorder = stopbuyOrder;
  curorder.status = "0";
  var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
  tradeTable.findOneAndUpdate(
    { _id: ObjectId(_id), status: "4", stopstatus: "2" },
    { $set: { status: "0", price: trigger_price } },
    { new: true, fields: { status: 1 } },
    function (buytemp_err, buytempDat) {
      tradematching(curorder);
      userinfo.callstopbuyorder()
    }
  );

}

function generatestopsellorder(stopsellOrder, callBackfive) {
  if (callBackfive) {
    userinfo.callstopsellorder = callBackfive;
  }
  //console.log("inside geenrate  stopsellOrder");

  var _id = stopsellOrder._id;
  var price = stopsellOrder.price;
  var trigger_price = stopsellOrder.trigger_price;
  var userId = stopsellOrder.userId;
  var pairName = stopsellOrder.pairName;
  var leverage = stopsellOrder.leverage;
  var quantity = stopsellOrder.quantity;
  var buyorsell = stopsellOrder.buyorsell;
  var orderType = stopsellOrder.orderType;
  var trailstop = stopsellOrder.trailstop;
  var pos_leverage = stopsellOrder.leverage;
  var pos_liqprice = stopsellOrder.Liqprice;
  var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
  var curorder = stopsellOrder;
  curorder.status = "0";
  tradeTable.findOneAndUpdate(
    { _id: ObjectId(_id), status: "4", stopstatus: "2" },
    { $set: { status: "0", price: trigger_price } },
    { new: true, fields: { status: 1 } },
    function (buytemp_err, buytempDat) {
      tradematching(curorder);
      userinfo.callstopsellorder();
    }
  );

}

function generatelimitsellorder(limitsellorder, callBackfour) {
  if (callBackfour) {
    userinfo.calllimitsellorder = callBackfour;
  }
  //console.log("inside geenrate limit sellorder");
  var _id = limitsellorder._id;
  var userId = limitsellorder.userId;
  var buyorsell = limitsellorder.buyorsell;
  var pairName = limitsellorder.pairName;
  var quantity =
    limitsellorder.quantity - limitsellorder.filledAmount;
  var price = limitsellorder.price;
  var leverage = limitsellorder.leverage;
  var leverage = limitsellorder.leverage;
  var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
  var float = pairName == "XRPUSD" ? 4 : 2;
  var buytype = buyorsell == "buy" ? "sell" : "buy";
  // if (leverage <= 20) {
  order_placing(
    "Market",
    buytype,
    parseFloat(price).toFixed(float),
    Math.abs(quantity),
    leverage,
    pairName,
    oppuser_id,
    (trigger_price = 0),
    (trigger_type = null),
    (id = 0),
    "",
    (trailstopdistance = 0)
  );
  userinfo.calllimitsellorder()

}
function generatelimitbuyorder(limitbuyorder, callBackThree) {
  if (callBackThree) {
    userinfo.calllimitbuyorder = callBackThree;
  }
  //console.log("inside geenrate limit buyorer");
  var _id = limitbuyorder._id;
  var userId = limitbuyorder.userId;
  var buyorsell = limitbuyorder.buyorsell;
  var pairName = limitbuyorder.pairName;
  var leverage = limitbuyorder.leverage;
  var quantity =
    limitbuyorder.quantity - limitbuyorder.filledAmount;
  var price = limitbuyorder.price;
  var leverage = limitbuyorder.leverage;
  var oppuser_id = ObjectId("5e567694b912240c7f0e4299");
  var float = pairName == "XRPUSD" ? 4 : 2;
  var buytype = buyorsell == "buy" ? "sell" : "buy";
  //console.log(pairName, "pairName");
  order_placing(
    "Market",
    buytype,
    parseFloat(price).toFixed(float),
    Math.abs(quantity),
    leverage,
    pairName,
    oppuser_id,
    (trigger_price = 0),
    (trigger_type = null),
    (id = 0),
    "",
    (trailstopdistance = 0)
  );
  userinfo.calllimitbuyorder()
}



function forced_liquidation(pair) {
  perf.start();

  // //console.log("forced liq",pair);
  perpetual.find(
    { liq_users: "0" },
    {
      tiker_root: 1,
      markprice: 1,
      maint_margin: 1,
      taker_fees: 1,
      first_currency: 1,
      second_currency: 1,
    },
    function (pererr, perdata) {
      var index = perdata.findIndex((x) => x.tiker_root === pair);
      if (index != -1) {
        perpetual.findOneAndUpdate(
          { tiker_root: pair, liq_users: "0" },
          { $set: { liq_users: "1" } },
          { new: true, fields: { _id: 1, liq_users: 1 } },
          function (userer, userdat) {
            var lastprice = perdata[index].markprice;
            var mainmargin = perdata[index].maint_margin / 100;
            tradeTable
              .aggregate([
                {
                  $match: {
                    $or: [{ status: "1" }, { status: "2" }],
                    forced_liquidation: false,
                    pairName: pair,
                    userId: { $ne: ObjectId("5e567694b912240c7f0e4299") },
                  },
                },
                { $unwind: "$filled" },
                {
                  $match: {
                    "filled.position_status": "1",
                    "filled.forced_liquidation": false,
                  },
                },
                { $project: { filled: 1, leverage: 1 } },
                {
                  $group: {
                    _id: "$filled.user_id",
                    price: { $avg: "$filled.Price" },
                    quantity: { $sum: "$filled.filledAmount" },
                    pairName: { $first: "$filled.pairname" },
                    leverage: { $first: "$leverage" },
                  },
                },
              ])
              .exec(function (err, result) {
                //console.log(result, "result");
                if (result.length > 0) {
                  var tradePos = 0;
                  var tradetails = result[0];
                  tradetails["lastprice"] = lastprice;
                  tradetails["perdata"] = perdata;
                  tradetails["mainmargin"] = mainmargin;
                  tradetails["index"] = index;
                  tradetails["pair"] = pair;
                  force_updation(tradetails, function () {
                    if (tradePos === result.length - 1) {
                      perpetual.findOneAndUpdate(
                        { tiker_root: pair, liq_users: "1" },
                        { $set: { liq_users: "0" } },
                        { new: true, fields: { _id: 1, liq_users: 1 } },
                        function (usererr1, userdat1a) {
                          tradeinfo.callBackforceTrade();
                        }
                      );
                      callBackResponseImport();
                    } else {
                      //console.log("another call");
                      tradePos += 1;
                      var tradeDetails = result[tradePos];
                      tradetails["lastprice"] = lastprice;
                      tradetails["mainmargin"] = mainmargin;
                      tradetails["perdata"] = perdata;
                      tradetails["index"] = index;
                      tradetails["pair"] = pair;
                      if (tradeDetails) {
                        force_updation(tradetails);
                      } else {
                        callBackResponseImport();
                      }
                    }
                  });
                } else {
                  perpetual.findOneAndUpdate(
                    { tiker_root: pair, liq_users: "1" },
                    { $set: { liq_users: "0" } },
                    { new: true, fields: { _id: 1, liq_users: 1 } },
                    function (usererr1, userdat1a) { }
                  );
                }
              });
          }
        );
      }
    }
  );
  const results1 = perf.stop();
  //console.log(results1.time, "results1.time" + pair);
}
function force_updation(result, callBackOne) {
  var lastprice = result.lastprice;
  var mainmargin = result.mainmargin;
  var index = result.index;
  var pair = result.pair;
  var perdata = result.perdata;
  if (callBackOne) {
    tradeinfo.callBackforceTrade = callBackOne;
  }
  condition_check = false;
  // //console.log(i,'i')
  var pos_pairName = result.pairName ? result.pairName : 0;
  var user_id = result._id ? result._id : 0;
  var pos_quantity = result.quantity ? result.quantity : 0;
  var pos_price = result.price ? result.price : 0;
  var pos_leverage = result.leverage ? result.leverage : 0;

  //calculate the initial margin

  var order_value1 = parseFloat(pos_quantity * pos_price).toFixed(8);
  var order_value = parseFloat(order_value1 / pos_price).toFixed(8);
  var required_margin = parseFloat(order_value1) / pos_leverage;
  var margininbtc = parseFloat(required_margin) / parseFloat(pos_price);

  var profitnlossusd = parseFloat(pos_price) - parseFloat(lastprice);
  var profitnlossusd = parseFloat(profitnlossusd) * parseFloat(pos_quantity);

  var profitnloss = parseFloat(profitnlossusd) / parseFloat(pos_price);
  var mainmarginwithleverage =
    parseFloat(mainmargin) * parseFloat(pos_leverage);

  if (pos_quantity > 0) {
    var pos_liqprice =
      (parseFloat(pos_price) * parseFloat(pos_leverage)) /
      (parseFloat(pos_leverage) + 1 - parseFloat(mainmarginwithleverage));
  } else {
    var pos_liqprice =
      (parseFloat(pos_price) * parseFloat(pos_leverage)) /
      (parseFloat(pos_leverage) - 1 + parseFloat(mainmarginwithleverage));
  }
  //console.log(pos_liqprice, "pos_liqprice");
  //console.log(lastprice, "lastprice");
  //console.log(pos_quantity, "pos_quantity");
  //console.log(user_id, "user_id");
  if (pos_quantity > 0 && pos_liqprice > lastprice) {
    var condition_check = true;
    //console.log("long", pos_quantity);
    var bankruptcy = +pos_price * (+pos_leverage / (+pos_leverage + 1));
    var orderType = "Market";
    var oppuser_id = ObjectId("5e567694b912240c7f0e4299");

    var jsonfilter = {
      identifier: "liquidation_notification",
    };
    var logo = keys.baseUrl + "Logo-small.png";

    async.waterfall(
      [
        function (done) {
          User.findOne(
            { _id: ObjectId(user_id) },
            { email: 1, liq_lock: 1 },
            function (err, userdet) {
              if (userdet) {
                userdetails = userdet;
                done();
              }
            }
          );
        },
        function (done) {
          tradeTable.findOneAndUpdate(
            {
              "filled.position_status": "1",
              "filled.forced_liquidation": false,
              "filled.pairname": pair,
              "filled.user_id": ObjectId(user_id),
            },
            {
              $set: {
                "filled.$.position_status": "0",
                forced_liquidation: true,
              },
            },
            { new: true, fields: { _id: 1 } },
            function (usererr1, userdat1a) {
              //console.log(usererr1, "usererr1");
              //console.log(userdat1a, "userdat1a");
              var buyorsell = "sell";
              var selluserid = ObjectId(user_id);
              var buyuserid = ObjectId(oppuser_id);
              var sellorderid = ObjectId();
              var buyorderid = ObjectId();
              var btcindex = perdata.findIndex(
                (x) => x.tiker_root === "BTCUSD"
              );
              var markprice = perdata[index].markprice;
              var btcprice = perdata[btcindex].markprice;
              var taker_fees = perdata[index].taker_fees;
              var leverage = parseFloat(pos_leverage);
              var order_value1 =
                parseFloat(pos_quantity) * parseFloat(pos_liqprice);
              var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
              var required_margin = parseFloat(order_value1) / leverage;
              var fee = (parseFloat(order_value1) * taker_fees) / 100;
              var margininbtc =
                parseFloat(required_margin) / parseFloat(btcprice);
              var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
              var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
              order_cost = parseFloat(order_cost).toFixed(8);
              var quantity = pos_quantity;

              var mainmargin = perdata[index].maint_margin / 100;
              var balance_check = true;

              var buyLiqprice =
                (parseFloat(pos_liqprice) * parseFloat(leverage)) /
                (leverage + 1 - parseFloat(mainmargin) * parseFloat(leverage));

              sellquantity = parseFloat(quantity) * -1;
              var sellLiqprice =
                (parseFloat(pos_liqprice) * parseFloat(leverage)) /
                (leverage - 1 + parseFloat(mainmargin) * parseFloat(leverage));

              var float = pair == "XRPUSD" ? 4 : 2;
              var tempdata = {
                pair: ObjectId(perdata[index]._id),
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                forced_liquidation: true,
                buyuserId: ObjectId(buyuserid),
                user_id: ObjectId(selluserid),
                selluserId: ObjectId(selluserid),
                sellId: ObjectId(sellorderid),
                buyId: ObjectId(buyorderid),
                filledAmount: +sellquantity.toFixed(8),
                Price: +parseFloat(pos_liqprice).toFixed(float),
                pairname: pair,
                order_cost: order_cost,
                status: "filled",
                Type: "sell",
                position_status: "0",
                Fees: parseFloat(feeinbtc).toFixed(8),
                created_at: new Date(),
                order_value: order_value,
              };

              const newtradeTable = new tradeTable({
                _id: sellorderid,
                quantity: sellquantity,
                price: parseFloat(pos_liqprice).toFixed(float),
                orderCost: order_cost,
                orderValue: order_value,
                leverage: leverage,
                userId: user_id,
                pair: perdata[index]._id,
                pairName: pair,
                beforeBalance: 0,
                afterBalance: 0,
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                Liqprice: sellLiqprice,
                orderType: "Market",
                buyorsell: buyorsell,
                btcprice: btcprice,
                taker_fees: taker_fees,
                trigger_price: 0,
                forced_liquidation: true,
                filled: tempdata,
                position_status: "1",
                orderDate: new Date(),
                status: "1", // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
              });

              newtradeTable
                .save()
                .then((curorder) => {
                  //console.log("sellorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                  res.json({
                    status: false,
                    message: "Your order not placed.",
                    notify_show: "yes",
                  });
                });

              tempdata.user_id = oppuser_id;
              tempdata.Type = "buy";

              const newtradeTable1 = new tradeTable({
                _id: buyorderid,
                quantity: quantity,
                price: parseFloat(pos_liqprice).toFixed(float),
                orderCost: order_cost,
                orderValue: order_value,
                leverage: leverage,
                userId: oppuser_id,
                pair: perdata[index]._id,
                pairName: pair,
                beforeBalance: 0,
                afterBalance: 0,
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                Liqprice: buyLiqprice,
                orderType: "Market",
                buyorsell: "buy",
                btcprice: btcprice,
                taker_fees: taker_fees,
                forced_liquidation: true,
                filled: tempdata,
                trigger_price: 0,
                orderDate: new Date(),
                position_status: "1",
                status: "1", // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
              });

              newtradeTable1
                .save()
                .then((curorder) => {
                  //console.log("buyorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                });

              const newposition = new position_table({
                pairname: pair,
                pair: perdata[index]._id,
                userId: user_id,
                closing_direction: "Closed long",
                quantity: quantity,
                exit_price: pos_liqprice,
                entry_price: pos_price,
                profitnloss: Math.abs(order_cost) * -1,
                exit_type: "Liquidated",
                orderCost: order_cost,
              });

              newposition
                .save()
                .then((curorder) => {
                  //console.log("buyorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                });

              //console.log("order triggering");
              Emailtemplates.findOne(
                jsonfilter,
                {
                  _id: 0,
                },
                function (err, templates) {
                  if (templates) {
                    template = templates;
                    if (templates.content) {
                      templateData = templates;
                      templateData.content = templateData.content.replace(
                        /##templateInfo_name##/g,
                        userdetails.email
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_appName##/g,
                        keys.siteName
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_logo##/g,
                        logo
                      );

                      templateData.content = templateData.content.replace(
                        /##PAIR##/g,
                        pos_pairName
                      );
                      templateData.content = templateData.content.replace(
                        /##SIDE##/g,
                        "Buy"
                      );
                      templateData.content = templateData.content.replace(
                        /##QUANTITY##/g,
                        pos_quantity
                      );
                      templateData.content = templateData.content.replace(
                        /##LEVERAGE##/g,
                        pos_leverage
                      );
                      templateData.content = templateData.content.replace(
                        /##POSITIONMARGIN##/g,
                        parseFloat(margininbtc).toFixed(8)
                      );
                      templateData.content = templateData.content.replace(
                        /##LIQPRICE##/g,
                        parseFloat(pos_liqprice).toFixed(8)
                      );
                      templateData.content = templateData.content.replace(
                        /##MAINTMARGIN##/g,
                        mainmargin
                      );
                      templateData.content = templateData.content.replace(
                        /##LIQDATE##/g,
                        new Date()
                      );
                      templateData.content = templateData.content.replace(
                        /##MARKPRICE##/g,
                        parseFloat(pos_liqprice).toFixed(float)
                      );
                      templateData.content = templateData.content.replace(
                        /##BANKRUPTSY##/g,
                        bankruptcy
                      );
                      done();
                    }
                  }
                }
              );
            }
          );
        },
        function (done) {
          var smtpConfig = {
            // service: keys.serverName,
            host: keys.host, // Amazon email SMTP hostname
            auth: {
              user: keys.email,
              pass: keys.password,
            },
          };
          var transporter = nodemailer.createTransport(smtpConfig);

          var mailOptions = {
            from: keys.fromName + "<" + keys.fromemail + ">", // sender address
            to: userdetails.email, // list of receivers
            subject: templateData.subject, // Subject line
            html: templateData.content, // html body
          };
          // transporter.sendMail(mailOptions, function (error, info) {
          // if (error) {
          //   return //console.log(error);
          // }

          // });
        },
      ],
      function (err) {
        getusertradedata(
          user_id,
          perdata[index].first_currency,
          perdata[index].second_currency
        );
        gettradedata(
          perdata[index].first_currency,
          perdata[index].second_currency,
          socketio
        );
      }
    );
  } else if (pos_quantity < 0 && pos_liqprice < lastprice) {
    var condition_check = true;
    var bankruptcy = +pos_price * (+pos_leverage / (+pos_leverage - 1));
    var orderType = "Market";
    var oppuser_id = ObjectId("5e567694b912240c7f0e4299");

    var jsonfilter = {
      identifier: "liquidation_notification",
    };
    var logo = keys.baseUrl + "Logo-small.png";

    async.waterfall(
      [
        function (done) {
          User.findOne(
            { _id: ObjectId(user_id) },
            { email: 1, liq_lock: 1 },
            function (err, userdet) {
              if (userdet) {
                userdetails = userdet;
                done();
              }
            }
          );
        },
        function (done) {
          tradeTable.findOneAndUpdate(
            {
              "filled.position_status": "1",
              "filled.forced_liquidation": false,
              "filled.pairname": pair,
              "filled.user_id": ObjectId(user_id),
            },
            {
              $set: {
                forced_liquidation: true,
                "filled.$.position_status": "0",
              },
            },
            { new: true, fields: { _id: 1 } },
            function (usererr1, userdat1a) {
              //console.log(userdat1a, "userdat1a");
              //console.log(usererr1, "usererr1");

              var buyorsell = "buy";
              var selluserid = ObjectId(oppuser_id);
              var buyuserid = ObjectId(user_id);
              var sellorderid = ObjectId();
              var buyorderid = ObjectId();
              var btcindex = perdata.findIndex(
                (x) => x.tiker_root === "BTCUSD"
              );
              var markprice = perdata[index].markprice;
              var btcprice = perdata[btcindex].markprice;
              var taker_fees = perdata[index].taker_fees;
              var leverage = parseFloat(pos_leverage);
              var order_value1 =
                parseFloat(pos_quantity) * parseFloat(pos_liqprice);
              var order_value = parseFloat(order_value1 / btcprice).toFixed(8);
              var required_margin = parseFloat(order_value1) / leverage;
              var fee = (parseFloat(order_value1) * taker_fees) / 100;
              var margininbtc =
                parseFloat(required_margin) / parseFloat(btcprice);
              var feeinbtc = parseFloat(fee) / parseFloat(btcprice);
              var order_cost = parseFloat(margininbtc) + parseFloat(feeinbtc);
              order_cost = parseFloat(order_cost).toFixed(8);
              var quantity = pos_quantity;

              var mainmargin = perdata[index].maint_margin / 100;
              var balance_check = true;

              var buyLiqprice =
                (parseFloat(pos_liqprice) * parseFloat(leverage)) /
                (leverage + 1 - parseFloat(mainmargin) * parseFloat(leverage));

              sellquantity = parseFloat(quantity) * -1;
              var sellLiqprice =
                (parseFloat(pos_liqprice) * parseFloat(leverage)) /
                (leverage - 1 + parseFloat(mainmargin) * parseFloat(leverage));

              var float = pair == "XRPUSD" ? 4 : 2;
              var tempdata = {
                pair: ObjectId(perdata[index]._id),
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                forced_liquidation: true,
                buyuserId: ObjectId(buyuserid),
                user_id: ObjectId(buyuserid),
                selluserId: ObjectId(selluserid),
                sellId: ObjectId(sellorderid),
                buyId: ObjectId(buyorderid),
                filledAmount: +quantity.toFixed(8),
                Price: +parseFloat(pos_liqprice).toFixed(float),
                pairname: pair,
                order_cost: order_cost,
                position_status: "0",
                status: "filled",
                Type: "buy",
                Fees: parseFloat(feeinbtc).toFixed(8),
                created_at: new Date(),
                order_value: order_value,
              };

              const newtradeTable = new tradeTable({
                _id: sellorderid,
                quantity: sellquantity,
                price: parseFloat(pos_liqprice).toFixed(float),
                orderCost: order_cost,
                orderValue: order_value,
                leverage: leverage,
                userId: oppuser_id,
                pair: perdata[index]._id,
                pairName: pair,
                beforeBalance: 0,
                afterBalance: 0,
                trigger_price: 0,
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                Liqprice: sellLiqprice,
                orderType: "Market",
                buyorsell: "sell",
                btcprice: btcprice,
                taker_fees: taker_fees,
                forced_liquidation: true,
                filled: tempdata,
                position_status: "1",
                orderDate: new Date(),
                status: "1", // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
              });
              newtradeTable
                .save()
                .then((curorder) => {
                  //console.log("sellorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                });

              tempdata.user_id = user_id;
              tempdata.Type = "buy";

              const newtradeTable1 = new tradeTable({
                _id: buyorderid,
                quantity: quantity,
                price: parseFloat(pos_liqprice).toFixed(float),
                orderCost: order_cost,
                orderValue: order_value,
                leverage: leverage,
                userId: user_id,
                pair: perdata[index]._id,
                pairName: pair,
                beforeBalance: 0,
                afterBalance: 0,
                trigger_price: 0,
                firstCurrency: perdata[index].first_currency,
                secondCurrency: perdata[index].second_currency,
                Liqprice: buyLiqprice,
                orderType: "Market",
                buyorsell: "buy",
                btcprice: btcprice,
                taker_fees: taker_fees,
                forced_liquidation: true,
                filled: tempdata,
                orderDate: new Date(),
                position_status: "1",
                status: "1", // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
              });
              newtradeTable1
                .save()
                .then((curorder) => {
                  //console.log("buyorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                });

              const newposition = new position_table({
                pairname: pair,
                pair: perdata[index]._id,
                userId: user_id,
                closing_direction: "Closed short",
                quantity: quantity,
                exit_price: pos_liqprice,
                entry_price: pos_price,
                profitnloss: Math.abs(order_cost) * -1,
                exit_type: "Liquidated",
                orderCost: order_cost,
              });

              newposition
                .save()
                .then((curorder) => {
                  //console.log("buyorder created");
                })
                .catch((err) => {
                  //console.log(err, "error");
                });

              Emailtemplates.findOne(
                jsonfilter,
                {
                  _id: 0,
                },
                function (err, template) {
                  if (template) {
                    templates = template;
                    if (templates.content) {
                      templateData = templates;
                      templateData.content = templateData.content.replace(
                        /##templateInfo_name##/g,
                        userdetails.email
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_appName##/g,
                        keys.siteName
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_logo##/g,
                        logo
                      );

                      templateData.content = templateData.content.replace(
                        /##PAIR##/g,
                        pos_pairName
                      );
                      templateData.content = templateData.content.replace(
                        /##SIDE##/g,
                        "Sell"
                      );
                      templateData.content = templateData.content.replace(
                        /##QUANTITY##/g,
                        pos_quantity
                      );
                      templateData.content = templateData.content.replace(
                        /##LEVERAGE##/g,
                        pos_leverage
                      );
                      templateData.content = templateData.content.replace(
                        /##POSITIONMARGIN##/g,
                        parseFloat(margininbtc).toFixed(8)
                      );
                      templateData.content = templateData.content.replace(
                        /##LIQPRICE##/g,
                        parseFloat(pos_liqprice).toFixed(8)
                      );
                      templateData.content = templateData.content.replace(
                        /##MAINTMARGIN##/g,
                        mainmargin
                      );
                      templateData.content = templateData.content.replace(
                        /##LIQDATE##/g,
                        new Date()
                      );
                      templateData.content = templateData.content.replace(
                        /##MARKPRICE##/g,
                        parseFloat(pos_liqprice).toFixed(float)
                      );
                      templateData.content = templateData.content.replace(
                        /##BANKRUPTSY##/g,
                        bankruptcy
                      );
                      done();
                    }
                  }
                }
              );
            }
          );
        },
        function (done) {
          var smtpConfig = {
            // service: keys.serverName,
            host: keys.host, // Amazon email SMTP hostname
            auth: {
              user: keys.email,
              pass: keys.password,
            },
          };
          var transporter = nodemailer.createTransport(smtpConfig);

          var mailOptions = {
            from: keys.fromName + "<" + keys.fromemail + ">", // sender address
            to: userdetails.email, // list of receivers
            subject: templateData.subject, // Subject line
            html: templateData.content, // html body
          };
          // transporter.sendMail(mailOptions, function (error, info) {
          //   if (error) {
          //     return //console.log(error);
          //   }
          // perpetual.findOneAndUpdate({tiker_root:pair,liq_users:'1'},{"$set": {"liq_users":'0'} } , {new:true,"fields": {_id:1,liq_users:1} } ,function(usererr1,userdat1a){
          // tradeinfo.callBackforceTrade();
          // });
          // });
        },
      ],
      function (err) {
        getusertradedata(
          user_id,
          perdata[index].first_currency,
          perdata[index].second_currency
        );
        gettradedata(
          perdata[index].first_currency,
          perdata[index].second_currency,
          socketio
        );
      }
    );
  } else {
    tradeinfo.callBackforceTrade();
  }
}

function interestfeefunction() {
  var datas = {
    "filled.position_status": "1",
    "filled.status": "filled",
  },
    sort;
  perpetual
    .find(
      {},
      { tiker_root: 1, funding_rate: 1, markprice: 1, dailyinterest: 1 }
    )
    .exec(function (pairerr, pairDetails) {
      // //console.log(perdata);
      tradeTable
        .aggregate([
          { $unwind: "$filled" },
          { $project: { filled: 1 } },
          { $match: datas },
        ])
        .exec((tradeerr, tradedata) => {
          if (tradedata.length > 0) {
            for (i = 0; i < tradedata.length; i++) {
              var quantity = tradedata[i].filled.filledAmount;
              var Price = tradedata[i].filled.Price;
              var order_cost = tradedata[i].filled.order_cost;
              var pairname = tradedata[i].filled.pairname;
              var firstCurrency = tradedata[i].filled.firstCurrency;
              var user_id = tradedata[i].filled.user_id;
              var index = pairDetails.findIndex(
                (x) => x.tiker_root === pairname
              );
              var btcindex = pairDetails.findIndex(
                (x) => x.tiker_root === "BTCUSD"
              );
              if (index != -1) {
                var dailyinterest = pairDetails[index].dailyinterest;
                var markprice = pairDetails[index].markprice;
                var btcprice = pairDetails[btcindex].markprice;

                var intrestinfirstcur = (order_cost * dailyinterest) / 100;
                var interestusd =
                  parseFloat(intrestinfirstcur) * parseFloat(markprice);
                var interest = parseFloat(interestusd) / parseFloat(btcprice);
                var updatebaldata = {};
                updatebaldata["balance"] = interest;

                Assets.findOneAndUpdate(
                  {
                    currencySymbol: "BTC",
                    userId: ObjectId(user_id),
                    balance: { $gte: interest },
                  },
                  { $dec: updatebaldata },
                  { new: true, fields: { balance: 1 } },
                  function (balerr, baldata) {
                    if (baldata) {
                      const newTransaction = new Transaction({
                        user_id: user_id,
                        currency: "BTC",
                        transferType: "Realized P&L",
                        amount: interest,
                      });
                      newTransaction.save(function (err, data) { });
                    }
                  }
                );
              }
            }
          }
        });
    });
}

router.get("/indexprice_calculation/", (req, res) => {
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
function getimpactbidprice(type, pair) {
  // //console.log(pair,'fsdfsdfsdfsdfsdfsdf')

  return tradeTable.aggregate([
    // { "$match": { "orderDate": { $gt:new Date(Date.now() - 8*60*60 * 1000) },"status":'1',"buyorsell":type,"pairname": pair} },
    { $match: { status: "1", buyorsell: type, pairName: pair } },
    { $group: { _id: null, price: { $avg: "$price" } } },
  ]);
}

function getavgtradevolume(type, pair) {
  return exchangePrices.aggregate([
    {
      $match:
        // { "createdAt":{
        //     $gte: (new Date((new Date()).getTime() - (10 * 24 * 60 * 60 * 1000)))
        // },
        { pairname: pair, exchangename: type },
    },
    // { "$match": { "status":'1',"buyorsell":type } },
    { $group: { _id: null, volume: { $avg: "$volume" } } },
  ]);
}

function getspotprice(exchange, pair) {
  return exchangePrices
    .findOne({ pairname: pair, exchangename: exchange })
    .sort({ createdAt: -1 })
    .select("last")
    .select("createdAt")
    .select("volume");
}

async function getlastspot(pair) {
  return spotPrices
    .findOne({ pairname: pair })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .select("pairname")
    .select("price");
}

async function indexprice_calculation(pair, io = null) {
  var exc_A_avgtradevolumefor_month = await getspotprice("Bitstamp", pair);
  var exc_B_avgtradevolumefor_month = await getspotprice("Kraken", pair);
  var exc_C_avgtradevolumefor_month = await getspotprice("Coinbase", pair);
  var exchange_A_spotprice = exc_A_avgtradevolumefor_month
    ? exc_A_avgtradevolumefor_month.last
    : 0;
  var exchange_B_spotprice = exc_B_avgtradevolumefor_month
    ? exc_B_avgtradevolumefor_month.last
    : 0;
  var exchange_C_spotprice = exc_C_avgtradevolumefor_month
    ? exc_C_avgtradevolumefor_month.last
    : 0;
  // //console.log("pairr",pair)
  //   //console.log("exc_B_avgtradevolumefor_month",exc_B_avgtradevolumefor_month);
  //   //console.log("exc_C_avgtradevolumefor_month",exc_C_avgtradevolumefor_month );
  //   //console.log("exc_B_avgtradevolumefor_month",exc_B_avgtradevolumefor_month);
  exc_A_avgtradevolumefor_month = exc_A_avgtradevolumefor_month
    ? exc_A_avgtradevolumefor_month.volume
    : 0;
  exc_B_avgtradevolumefor_month = exc_B_avgtradevolumefor_month
    ? exc_B_avgtradevolumefor_month.volume
    : 0;
  exc_C_avgtradevolumefor_month = exc_C_avgtradevolumefor_month
    ? exc_C_avgtradevolumefor_month.volume
    : 0;

  // //console.log(exc_A_avgtradevolumefor_month);
  // //console.log(exc_B_avgtradevolumefor_month);
  // //console.log(exc_C_avgtradevolumefor_month);
  // return false;

  // var exc_A_avgtradevolumefor_month =  2722988075;
  // var exc_B_avgtradevolumefor_month =  6031867375;
  // var exc_C_avgtradevolumefor_month =  3951095106;

  Totalexcvol =
    exc_A_avgtradevolumefor_month +
    exc_B_avgtradevolumefor_month +
    exc_C_avgtradevolumefor_month;
  //Weightage calculation

  var Wt_A =
    parseFloat(exc_A_avgtradevolumefor_month) / parseFloat(Totalexcvol);
  var Wt_B =
    parseFloat(exc_B_avgtradevolumefor_month) / parseFloat(Totalexcvol);
  var Wt_C =
    parseFloat(exc_C_avgtradevolumefor_month) / parseFloat(Totalexcvol);

  // //console.log(exchange_A_ticker,'indexprice_calculation');
  // return false;
  // //console.log(exchange_B_ticker,'ticker details');

  // //console.log(exchange_A_spotprice,'A price');
  // //console.log(exchange_B_spotprice,'B price');
  // //console.log(exchange_C_spotprice,'C price');

  var total = Wt_A + Wt_B + Wt_C;
  var awei = (Wt_A / total) * 100;
  var bwei = (Wt_B / total) * 100;
  var cwei = (Wt_C / total) * 100;

  var EBTC =
    parseFloat(awei / 100) * parseFloat(exchange_A_spotprice) +
    parseFloat(bwei / 100) * parseFloat(exchange_B_spotprice) +
    parseFloat(cwei / 100) * parseFloat(exchange_C_spotprice);
  var pricespreadofA = Math.abs(
    parseFloat(exchange_A_spotprice) - parseFloat(EBTC)
  );
  var pricespreadofB = Math.abs(
    parseFloat(exchange_B_spotprice) - parseFloat(EBTC)
  );
  var pricespreadofC = Math.abs(
    parseFloat(exchange_C_spotprice) - parseFloat(EBTC)
  );

  var asquare = 1 / (parseFloat(pricespreadofA) * parseFloat(pricespreadofA));
  var bsquare = 1 / (parseFloat(pricespreadofB) * parseFloat(pricespreadofB));
  var csquare = 1 / (parseFloat(pricespreadofC) * parseFloat(pricespreadofC));
  var totalsquar =
    parseFloat(asquare) + parseFloat(bsquare) + parseFloat(csquare);
  var weight_A = parseFloat(asquare) / parseFloat(totalsquar);
  var weight_B = parseFloat(bsquare) / parseFloat(totalsquar);
  var weight_C = parseFloat(csquare) / parseFloat(totalsquar);

  var index_price =
    parseFloat(weight_A) * parseFloat(exchange_A_spotprice) +
    parseFloat(weight_B) * parseFloat(exchange_B_spotprice) +
    parseFloat(weight_C) * parseFloat(exchange_C_spotprice);

  // //console.log(index_price,'indexprice');
  var Interest_Quote_Index = 1 / 100;
  var Interest_Base_Index = 0.25 / 100;
  var fundingrate = (Interest_Quote_Index * Interest_Base_Index) / 3;

  var timeuntillfunding = 5; //need to calculate
  var fundinbasis = fundingrate * (timeuntillfunding / 3);
  var mark_price = index_price * (1 + fundinbasis);

  // //console.log(mark_price,'mark price');
  var lastspot = await getlastspot(pair);

  if (typeof index_price != "undefined" && typeof mark_price != "undefined") {
    // //console.log(mark_price,'mark_price')
    var tablename = pair == "ETHBTC" ? spotpairs : perpetual;
    perpetual.findOneAndUpdate(
      { tiker_root: pair },
      { $set: { markprice: mark_price } },
      {
        new: true,
        fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
      },
      function (pererr, perdata) {
        var pricedata = perdata;
        var spotpairname = pair.replace("USD", "USDT");
        spotpairs.findOneAndUpdate(
          { tiker_root: spotpairname },
          { $set: { markprice: mark_price } },
          {
            new: true,
            fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
          },
          function (pererr1, perdata1) {
            //var perdata = {"markprice":Math.floor(1000 + Math.random() * 9000),"last":1234,"tiker_root":"BTCUSD"};
            io.emit("PRICEDETAILS", perdata1 ? perdata1 : pricedata);
            var perdata = perdata1 ? perdata1 : pricedata;
            if (perdata) {
              var markprice = mark_price ? mark_price : 0;
              const newrecord = new spotPrices({
                price: mark_price ? mark_price : 0,
                pair: ObjectId(perdata._id),
                pairname: pair,
                createdAt: new Date(),
              });
              // //console.log(lastspot.price,'lastspot')
              // //console.log(markprice,'markprice')
              if (lastspot) {
                var difference = Math.abs(
                  parseFloat(lastspot.price) - parseFloat(markprice)
                );
                var percent =
                  (parseFloat(difference) / parseFloat(lastspot.price)) * 100;
              }

              if (markprice != 0 && markprice != "") {
                // //console.log('insert')
                newrecord.save(function (err, data) {
                  // //console.log(err,'err');
                  // //console.log(data,'data');
                  // setTimeout(function () {
                  //  stopordertrigger(mark_price,pair);
                  // }, 5000);
                });
              }
            }
          }
        );
      }
    );
  }
  //here
  var Interest_Quote_Index = 1 / 100;
  var Interest_Base_Index = 0.25 / 100;
  // var mark_price        = 9260

  var Interest_Rate = ((Interest_Quote_Index - Interest_Base_Index) / 3) * 100;

  // var imapactbidprice      = await getimpactbidprice('buy',pair);
  // var imapactaskprice      = await getimpactbidprice('sell',pair);

  var imapactbidprice = await getspotprice(pair, "Coinbase");
  var imapactaskprice = await getspotprice(pair, "Kraken");
  // //console.log(imapactbidprice,'imapactbidprice'+pair);

  var exchange_A_ticker = await getspotprice(pair, "Bitstamp");
  var exchange_A_spotprice = exchange_A_ticker ? exchange_A_ticker.last : 0;

  if (typeof imapactbidprice != "undefined") {
    imapactbidprice = imapactbidprice ? imapactbidprice.last : 0;
    imapactaskprice = imapactaskprice ? imapactaskprice.last : 0;

    // //console.log(imapactbidprice,'imapactbidprice');
    // //console.log(imapactaskprice,'imapactaskprice');

    var midprice = Math.round((imapactbidprice + imapactaskprice) / 2);

    // //console.log(mark_price,'mark_price');
    // //console.log(Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price)),'first');
    // //console.log(Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice)),'second');
    // //console.log(exchange_A_spotprice,'second');
    var first = Math.max(
      0,
      parseFloat(imapactbidprice) - parseFloat(mark_price)
    );
    var second = Math.max(
      0,
      parseFloat(mark_price) - parseFloat(imapactaskprice)
    );
    var premium_index = (first - second) / parseFloat(exchange_A_spotprice);

    // //console.log(premium_index,'premium_index');

    var date = new Date();
    var curhour = date.getHours();
    var timeuntillfunding =
      curhour > 0 && curhour < 8
        ? 8 - curhour
        : curhour > 8 && curhour < 16
          ? 16 - curhour
          : curhour > 16 && curhour < 24
            ? 24 - curhour
            : 0;

    // var fairbasis      = (parseFloat(midprice)/parseFloat(index_price)-1)/(30/365);
    var fairbasis = fundingrate * (timeuntillfunding / 3);
    // //console.log(fairbasis,'fairbasis');
    premium_index = parseFloat(premium_index) + fundingrate;

    // //console.log(parseFloat(premium_index),'premium_index');
    // //console.log(Interest_Rate,'Interest_Rate');

    const clamp = (min, max) => (value) =>
      value < min ? min : value > max ? max : value;
    // var Interest_Rate = 0.01;
    var cl = Interest_Rate - premium_index;
    var minusval = Math.min(Math.max(parseFloat(cl), -0.05), 0.05);
    // //console.log(parseFloat(minusval),'minusval');
    var Funding_Rate = parseFloat(premium_index) + parseFloat(minusval);
    // //console.log(Funding_Rate,'Funding_Rate');
    if (
      typeof Funding_Rate != "undefined" &&
      typeof mark_price != "undefined"
    ) {
      perpetual.findOneAndUpdate(
        { tiker_root: pair },
        {
          $set: {
            funding_rate: Funding_Rate,
            markprice: mark_price,
            index_price: index_price,
          },
        },
        { new: true, fields: { tiker_root: 1, last: 1, markprice: 1 } },
        function (pererr, perdata) {
          // //console.log(perdata);
        }
      );
    }
  }
}

async function indexprice_calculation1(pair, io = null) {
  var exc_A_avgtradevolumefor_month = await getavgtradevolume("Bitstamp", pair);
  var exc_B_avgtradevolumefor_month = await getavgtradevolume("Kraken", pair);
  var exc_C_avgtradevolumefor_month = await getavgtradevolume("Coinbase", pair);

  // //console.log(exc_B_avgtradevolumefor_month);
  // //console.log(exc_C_avgtradevolumefor_month);
  // //console.log(exc_B_avgtradevolumefor_month);
  // //console.log(exc_C_avgtradevolumefor_month);
  exc_A_avgtradevolumefor_month =
    exc_A_avgtradevolumefor_month.length > 0
      ? exc_A_avgtradevolumefor_month[0].volume
      : 0;
  exc_B_avgtradevolumefor_month =
    exc_B_avgtradevolumefor_month.length > 0
      ? exc_B_avgtradevolumefor_month[0].volume
      : 0;
  exc_C_avgtradevolumefor_month =
    exc_C_avgtradevolumefor_month.length > 0
      ? exc_C_avgtradevolumefor_month[0].volume
      : 0;

  // //console.log(exc_A_avgtradevolumefor_month);
  // //console.log(exc_B_avgtradevolumefor_month);
  // //console.log(exc_C_avgtradevolumefor_month);
  // return false;

  // var exc_A_avgtradevolumefor_month =  2722988075;
  // var exc_B_avgtradevolumefor_month =  6031867375;
  // var exc_C_avgtradevolumefor_month =  3951095106;

  Totalexcvol =
    exc_A_avgtradevolumefor_month +
    exc_B_avgtradevolumefor_month +
    exc_C_avgtradevolumefor_month;
  //Weightage calculation

  var Wt_A =
    parseFloat(exc_A_avgtradevolumefor_month) / parseFloat(Totalexcvol);
  var Wt_B =
    parseFloat(exc_B_avgtradevolumefor_month) / parseFloat(Totalexcvol);
  var Wt_C =
    parseFloat(exc_C_avgtradevolumefor_month) / parseFloat(Totalexcvol);

  var exchange_A_ticker = await getspotprice(pair, "Bitstamp");
  var exchange_B_ticker = await getspotprice(pair, "Kraken");
  var exchange_C_ticker = await getspotprice(pair, "Coinbase");

  // //console.log(exchange_A_ticker,'indexprice_calculation');
  // return false;
  // //console.log(exchange_B_ticker,'ticker details');
  var exchange_A_spotprice = exchange_A_ticker ? exchange_A_ticker.last : 0;
  var exchange_B_spotprice = exchange_B_ticker ? exchange_B_ticker.last : 0;
  var exchange_C_spotprice = exchange_C_ticker ? exchange_C_ticker.last : 0;

  // //console.log(exchange_A_spotprice,'A price');
  // //console.log(exchange_B_spotprice,'B price');
  // //console.log(exchange_C_spotprice,'C price');

  var total = Wt_A + Wt_B + Wt_C;
  var awei = (Wt_A / total) * 100;
  var bwei = (Wt_B / total) * 100;
  var cwei = (Wt_C / total) * 100;

  var EBTC =
    parseFloat(awei / 100) * parseFloat(exchange_A_spotprice) +
    parseFloat(bwei / 100) * parseFloat(exchange_B_spotprice) +
    parseFloat(cwei / 100) * parseFloat(exchange_C_spotprice);
  var pricespreadofA = Math.abs(
    parseFloat(exchange_A_spotprice) - parseFloat(EBTC)
  );
  var pricespreadofB = Math.abs(
    parseFloat(exchange_B_spotprice) - parseFloat(EBTC)
  );
  var pricespreadofC = Math.abs(
    parseFloat(exchange_C_spotprice) - parseFloat(EBTC)
  );

  var asquare = 1 / (parseFloat(pricespreadofA) * parseFloat(pricespreadofA));
  var bsquare = 1 / (parseFloat(pricespreadofB) * parseFloat(pricespreadofB));
  var csquare = 1 / (parseFloat(pricespreadofC) * parseFloat(pricespreadofC));
  var totalsquar =
    parseFloat(asquare) + parseFloat(bsquare) + parseFloat(csquare);
  var weight_A = parseFloat(asquare) / parseFloat(totalsquar);
  var weight_B = parseFloat(bsquare) / parseFloat(totalsquar);
  var weight_C = parseFloat(csquare) / parseFloat(totalsquar);

  var index_price =
    parseFloat(weight_A) * parseFloat(exchange_A_spotprice) +
    parseFloat(weight_B) * parseFloat(exchange_B_spotprice) +
    parseFloat(weight_C) * parseFloat(exchange_C_spotprice);

  // //console.log(index_price,'indexprice');
  var Interest_Quote_Index = 1 / 100;
  var Interest_Base_Index = 0.25 / 100;
  var fundingrate = (Interest_Quote_Index * Interest_Base_Index) / 3;

  var timeuntillfunding = 5; //need to calculate
  var fundinbasis = fundingrate * (timeuntillfunding / 3);
  var mark_price = index_price * (1 + fundinbasis);

  // //console.log(mark_price,'mark price');
  var lastspot = await getlastspot(pair);

  if (typeof index_price != "undefined" && typeof mark_price != "undefined") {
    // //console.log(mark_price,'mark_price')

    perpetual.findOneAndUpdate(
      { tiker_root: pair },
      { $set: { markprice: mark_price } },
      {
        new: true,
        fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
      },
      function (pererr, perdata) {
        var pricedata = perdata;
        var spotpairname = pair.replace("USD", "USDT");
        spotpairs.findOneAndUpdate(
          { tiker_root: spotpairname },
          { $set: { markprice: mark_price } },
          {
            new: true,
            fields: { tiker_root: 1, last: 1, markprice: 1, _id: 1, change: 1 },
          },
          function (pererr1, perdata1) {
            //var perdata = {"markprice":Math.floor(1000 + Math.random() * 9000),"last":1234,"tiker_root":"BTCUSD"};
            io.emit("PRICEDETAILS", pair == "ETHBTC" ? perdata1 : pricedata);
            var perdata = pair == "ETHBTC" ? perdata1 : pricedata;
            if (perdata) {
              var markprice = mark_price ? mark_price : 0;
              const newrecord = new spotPrices({
                price: mark_price ? mark_price : 0,
                pair: ObjectId(perdata._id),
                pairname: pair,
                createdAt: new Date(),
              });
              // //console.log(lastspot.price,'lastspot')
              // //console.log(markprice,'markprice')
              if (lastspot) {
                var difference = Math.abs(
                  parseFloat(lastspot.price) - parseFloat(markprice)
                );
                var percent =
                  (parseFloat(difference) / parseFloat(lastspot.price)) * 100;
              }

              if (markprice != 0 && markprice != "") {
                // //console.log('insert')
                newrecord.save(function (err, data) {
                  // //console.log(err,'err');
                  // //console.log(data,'data');
                  setTimeout(function () {
                    stopordertrigger(mark_price, pair);
                  }, 5000);
                });
              }
            }
          }
        );
      }
    );
  }
  //here
  var Interest_Quote_Index = 1 / 100;
  var Interest_Base_Index = 0.25 / 100;
  // var mark_price        = 9260

  var Interest_Rate = ((Interest_Quote_Index - Interest_Base_Index) / 3) * 100;

  // var imapactbidprice      = await getimpactbidprice('buy',pair);
  // var imapactaskprice      = await getimpactbidprice('sell',pair);

  var imapactbidprice = await getspotprice(pair, "Coinbase");
  var imapactaskprice = await getspotprice(pair, "Kraken");
  // //console.log(imapactbidprice,'imapactbidprice'+pair);

  var exchange_A_ticker = await getspotprice(pair, "Bitstamp");
  var exchange_A_spotprice = exchange_A_ticker ? exchange_A_ticker.last : 0;

  if (typeof imapactbidprice != "undefined") {
    imapactbidprice = imapactbidprice ? imapactbidprice.last : 0;
    imapactaskprice = imapactaskprice ? imapactaskprice.last : 0;

    // //console.log(imapactbidprice,'imapactbidprice');
    // //console.log(imapactaskprice,'imapactaskprice');

    var midprice = Math.round((imapactbidprice + imapactaskprice) / 2);

    // //console.log(mark_price,'mark_price');
    // //console.log(Math.max(0, parseFloat(imapactbidprice) - parseFloat(mark_price)),'first');
    // //console.log(Math.max(0, parseFloat(mark_price) - parseFloat(imapactaskprice)),'second');
    // //console.log(exchange_A_spotprice,'second');
    var first = Math.max(
      0,
      parseFloat(imapactbidprice) - parseFloat(mark_price)
    );
    var second = Math.max(
      0,
      parseFloat(mark_price) - parseFloat(imapactaskprice)
    );
    var premium_index = (first - second) / parseFloat(exchange_A_spotprice);

    // //console.log(premium_index,'premium_index');

    var date = new Date();
    var curhour = date.getHours();
    var timeuntillfunding =
      curhour > 0 && curhour < 8
        ? 8 - curhour
        : curhour > 8 && curhour < 16
          ? 16 - curhour
          : curhour > 16 && curhour < 24
            ? 24 - curhour
            : 0;

    // var fairbasis      = (parseFloat(midprice)/parseFloat(index_price)-1)/(30/365);
    var fairbasis = fundingrate * (timeuntillfunding / 3);
    // //console.log(fairbasis,'fairbasis');
    premium_index = parseFloat(premium_index) + fundingrate;

    // //console.log(parseFloat(premium_index),'premium_index');
    // //console.log(Interest_Rate,'Interest_Rate');

    const clamp = (min, max) => (value) =>
      value < min ? min : value > max ? max : value;
    // var Interest_Rate = 0.01;
    var cl = Interest_Rate - premium_index;
    var minusval = Math.min(Math.max(parseFloat(cl), -0.05), 0.05);
    // //console.log(parseFloat(minusval),'minusval');
    var Funding_Rate = parseFloat(premium_index) + parseFloat(minusval);
    // //console.log(Funding_Rate,'Funding_Rate');
    if (
      typeof Funding_Rate != "undefined" &&
      typeof mark_price != "undefined"
    ) {
      perpetual.findOneAndUpdate(
        { tiker_root: pair },
        {
          $set: {
            funding_rate: Funding_Rate,
            markprice: mark_price,
            index_price: index_price,
          },
        },
        { new: true, fields: { tiker_root: 1, last: 1, markprice: 1 } },
        function (pererr, perdata) {
          // //console.log(perdata);
        }
      );
    }
  }
}
function updatefunction(
  payerid,
  receiverid,
  amount,
  firstCurrency,
  markprice,
  quantity,
  funding_rate,
  pairid,
  pairname
) {
  // //console.log("updatefunction");
  updatebaldata["balance"] = amount;
  // //console.log(amount);
  var order_value = parseFloat(quantity) / parseFloat(markprice);
  Assets.findOneAndUpdate(
    { currencySymbol: firstCurrency, userId: ObjectId(receiverid) },
    { $inc: updatebaldata },
    { new: true, fields: { balance: 1 } },
    function (balerr, baldata) {
      if (baldata) {
        const newrecord = new FundingHistory({
          userId: receiverid,
          pair: ObjectId(pairid),
          pairname: pairname,
          createdDate: new Date(),
          quantity: quantity,
          price: markprice,
          order_value: order_value,
          feerate: funding_rate / 100,
          feepaid: amount,
          type: "received",
        });
        newrecord.save(function (err, data) {
          //console.log(err, "err");
          //console.log(data, "data");
        });
      }
    }
  );

  Assets.findOneAndUpdate(
    {
      currencySymbol: firstCurrency,
      userId: ObjectId(payerid),
      balance: { $gte: amount },
    },
    { $dec: updatebaldata },
    { new: true, fields: { balance: 1 } },
    function (balerr, baldata) {
      if (baldata) {
        const newrecord = new FundingHistory({
          userId: payerid,
          pair: ObjectId(pairid),
          pairname: pairname,
          createdDate: new Date(),
          quantity: quantity,
          price: markprice,
          order_value: order_value,
          feerate: funding_rate / 100,
          feepaid: amount,
          type: "paid",
        });
        newrecord.save(function (err, data) { });
      }
    }
  );
}
async function calculatingfun(tradeDetails, pairDetails) {
  //console.log("calculatingfun");
  if (tradeDetails.length > 0) {
    var buyuserIdarr = [];
    var selluserIdarr = [];
    var sellIdarr = [];
    var buyIdarr = [];
    var pairarr = [];
    for (var i = 0; i < tradeDetails.length; i++) {
      var quantity = tradeDetails[i].quantity;
      var price = tradeDetails[i].price;
      var filled = tradeDetails[i].filled;
      var leverage = tradeDetails[i].leverage;
      var firstCurrency = tradeDetails[i].firstCurrency;
      if (filled) {
        for (var j = 0; j < filled.length; j++) {
          var buyuserId = filled[j].buyuserId;
          var selluserId = filled[j].selluserId;
          var sellId = filled[j].sellId;
          var buyId = filled[j].buyId;
          var pair = filled[j].pair;
          var pairname = filled[j].pairname;
          var filledAmount = filled[j].filledAmount;
          var Price = filled[j].Price;
          var beforeBalance = filled[j].beforeBalance;
          var afterBalance = filled[j].afterBalance;

          if (
            sellIdarr.includes(sellId) &&
            buyIdarr.includes(buyId) &&
            pairarr.includes(pair) &&
            buyuserIdarr.includes(buyuserId) &&
            selluserIdarr.includes(selluserId)
          ) {
            continue;
          } else {
            sellIdarr.push(sellId);
            buyIdarr.push(buyId);
            pairarr.push(pair);
            buyuserIdarr.push(buyuserId);
            selluserIdarr.push(selluserId);
            var index = pairDetails.findIndex((x) => x.tiker_root === pairname);
            var btcindex = pairDetails.findIndex(
              (x) => x.tiker_root === "BTCUSD"
            );
            if (index != -1) {
              var markprice = pairDetails[index].markprice;
              var funding_rate = pairDetails[index].funding_rate;
              var position_value = quantity / markprice;
              var fundingamount = position_value * (funding_rate / 100);
              if (funding_rate >= 0) {
                await updatefunction(
                  buyuserId,
                  selluserId,
                  fundingamount,
                  firstCurrency,
                  markprice,
                  quantity,
                  funding_rate,
                  pairDetails._id,
                  pairname
                );
              } else {
                await updatefunction(
                  selluserId,
                  buyuserId,
                  fundingamount,
                  firstCurrency,
                  markprice,
                  quantity,
                  funding_rate,
                  pairDetails._id,
                  pairname
                );
              }
            }
          }
        }
      }
    }
  }
}
async function fundingAmount() {
  //console.log("funding amourn");
  perpetual
    .find({}, { tiker_root: 1, funding_rate: 1, markprice: 1 })
    .exec(function (pairerr, pairDetails) {
      if (pairDetails) {
        tradeTable
          .find({
            $or: [{ status: "1" }, { status: "2" }],
            "filled.position_status": "1",
          })
          .exec(function (err, tradeDetails) {
            //console.log(tradeDetails, "tradeDetails");
            calculatingfun(tradeDetails, pairDetails);
          });
      }
    });
}

router.get("/counttest", (req, res) => {
  exchangePrices.find().count(function (err, data) {
    if (err) {
      //console.log(err);
    } else {
      res.end("success" + data);
    }
  });
});
router.get("/apitest11", (req, res) => {
  // //console.log("apitest:")
  // var count = 1000;
  // var header = { "Content-Type": "application/json" };
  // perf.start();
  // for(i=0;i<count;i++)
  // {
  //   var quantity = Math.random();
  //   var price  = (i % 2)?12000+Math.random():12000-Math.random();
  //     var args = {
  //       "quantity"         : quantity,
  //       "price"            : price,
  //       "userid"           : (i % 2)?"5e9abd0985e1da1ea7c6bbe0":"5ecf2e04ac4d306230ff532b",
  //       "pair"             : "BTCUSDT",
  //       "pairname"         : "BTCUSDT",
  //       "firstcurrency"    : "BTC",
  //       "secondcurrency"   : "USDT",
  //       "timeinforcetype"  : "GoodTillCancelled",
  //       "buyorsell"        : (i % 2)?"buy":"sell",
  //       "ordertype"        : "Market",
  //       "trigger_price"    : 0,
  //       "trigger_type"     : null,
  //       "tptrigger_type"   : null,
  //       "stoptrigger_type" : null,
  //       "post_only"        : false,
  //       "reduce_only"      : false,
  //       "stopcheck"        : true,
  //       "takeprofitcheck"  : true,
  //       "takeprofit"       : 0,
  //       "stopprice"        : 0
  //     };
  //     const options = {
  //       url: "http://localhost:5000/cryptoapi/spotorderPlacing",
  //       method: "POST",
  //       headers: header,
  //       body: JSON.stringify(args),
  //     };
  //     request(options, function (error, response, body) {
  //       //console.log(error,'requesterror');
  //       //console.log(body,'requestsuccess');
  //     });
  //     //console.log(i)
  //     //console.log(count)
  //     if(i==count-1)
  //     {
  //       const results1 = perf.stop();
  // //console.log(results1.time, "result time");
  // var seconds = results1.time/1000;
  // res.json({status:"successfully in "+seconds+" seconds"})
  //     }
  // }

  // tradeTable.findOneAndUpdate({"filled.position_status":'1',"filled.forced_liquidation":false,"filled.user_id":ObjectId("5e9a9d84daf0990cc5e26096")},{"$set": {"filled.$.position_status":'0',forced_liquidation:true} } , {new:true,"fields": {_id:1} } ,function(usererr1,userdat1a){
  //  //console.log(userdat1a,'userdat1a');
  // });

  // Assets.updateMany({currencySymbol:"BTC"},{"$set": {tempcurrency:25} } , {new:true,"fields": {exchangename:1} } ,function(balerr,baldata){
  //   res.json({status:true})
  //             // //console.log(balancerr,'balerr');
  //             // //console.log(baldata,'baldata');
  //           });
  // var json = {'filled.$.position_status':'5'};
  //   tradeTable.findOneAndUpdate({'filled.uniqueid':'335659933'},{ "$set": json},{new:true,"fields": {filled:1} },function(selltemp_err,selltempData){
  //     //console.log(selltemp_err,'selltemp_err')
  //     //console.log(selltempData,'sellteselltempDatamp_err')
  //   });

  // //console.log(ObjectId(),'id');
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
  //    //console.log(results)
  //  })

  // forced_liquidation('BTCUSD');
  // spotPrices.remove(
  //   { createdAt: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } },
  //   function (err, result) {
  //     if (!err) {
  //       res.send("success");
  //     } else {
  //       res.send(err);
  //     }
  //   }
  // );

  // tradeTable.remove(
  //   { userId:ObjectId("5e567694b912240c7f0e4299"),orderDate:{$gte:new Date("2020-09-03 00:22:23.941Z")} },
  //   function (err, result) {
  //     if (!err) {
  //       res.send("success");
  //     } else {
  //       res.send(err);
  //     }
  //   }
  // );
  // exchangePrices.find({})
  //           .skip(10000)
  //           .sort({createdAt: 'desc'})
  //           .exec(function(err, result) {
  //           if (err) {
  //             next(err);
  //             //console.log(err,'error');
  //           }
  //           if (result) {
  //             // //console.log(result);
  //             result.forEach( function (doc) {
  //                doc.remove();
  //              });
  //           }
  //         });
  // exchangePrices.find().count(function(err,data) {
  //           if (err) {
  //               //console.log(err)
  //           } else {
  //               res.end('success'+data);
  //           }
  //       }
  //   );
  // //console.log('sdjfsjdflsjdf');
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
  //   //console.log(err);
  //   //console.log(result);
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

router.get("/markets", (req, res) => {
  perpetual
    .aggregate([
      {
        $project: {
          _id: 0,
          name: "$tiker_root",
          type: "crypto",
          exchange: "Alwin",
        },
      },
    ])
    .exec(function (err, pairdata) {
      res.json(pairdata);
    });
});

router.get("/chart/:config", (request, response) => {
  var uri = url.parse(request.url, true);
  // console.log("----trade")
  // //console.log(uri.query,'querydfjsldjflsdjflsdkfjldfs');
  var action = uri.pathname;
  // console.log(action,'action');
  switch (action) {
    case "/chart/config":
      action = "/config";
      break;
    case "/chart/time":
      action = "/time";
      break;
    case "/chart/symbols":
      symbolsDatabase.initGetAllMarketsdata();
      action = "/symbols";
      break;
    case "/chart/history":
      action = "/history";
      break;
  }
  return requestProcessor.processRequest(action, uri.query, response);
});

router.get("/chartData", (req, res) => {
  // //console.log('callhere chart');
  var url = require("url");
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
      res.json({ message: "Start date is not a valid format" });
      return false;
    }
  } else {
    res.json({ message: "Start date parameter not found" });
    return false;
  }
  if (end_date) {
    if (!pattern.test(end_date)) {
      res.json({ message: "End date is not a valid format" });
      return false;
    }
  } else {
    res.json({ message: "End date parameter not found" });
    return false;
  }
  charts.findOne({ type: resol, pairname: pair }).exec(function (err, result) {
    if (result) {
      res.json(result.data);
    } else {
      res.json([]);
    }
  });
});

router.get("/chartData1", (req, res) => {
  // //console.log('callhere chart');
  var url = require("url");
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
      res.json({ message: "Start date is not a valid format" });
      return false;
    }
  } else {
    res.json({ message: "Start date parameter not found" });
    return false;
  }
  if (end_date) {
    if (!pattern.test(end_date)) {
      res.json({ message: "End date is not a valid format" });
      return false;
    }
  } else {
    res.json({ message: "End date parameter not found" });
    return false;
  }
  var sDate = start_date + " 00:00:0.000Z";
  var eDate = end_date + " 00:00:0.000Z";

  // //console.log(start_date,'start_date');
  // //console.log(end_date,'end_date');

  // //console.log(sDate,'start_date');
  // //console.log(eDate,'end_date');
  if (sDate > eDate) {
    res.json({
      message:
        "Please ensure that the End Date is greater than or equal to the Start Date",
    });
  }
  // perpetual.find({tiker_root:pair}).select("_id").select("tiker_root").exec(function(err,pairdata){
  try {
    // if(pairdata.length > 0)
    // {
    //   var pairId   = pairdata[0]._id;
    //   var pairname = pairdata[0].tiker_root;
    // //console.log(pairname);
    var limits;
    var project = {
      Date: "$Date",
      pair: "$pair",
      low: "$low",
      high: "$high",
      open: "$open",
      close: "$close",
      volume: "$volume",
      exchange: "GlobalCryptoX",
    };

    if (resol) {
      if (
        resol != 1 &&
        resol != 5 &&
        resol != 15 &&
        resol != 30 &&
        resol != 60 &&
        resol != "1d" &&
        resol != "2d" &&
        resol != "3d" &&
        resol != "d" &&
        resol != "1w" &&
        resol != "3w" &&
        resol != "m" &&
        resol != "6m"
      ) {
        res.json({ message: "Resolution value is not valid" });
        return false;
      } else {
        if (resol == "1d") {
          //console.log("1d");
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                  +resol,
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == "d") {
          _trProject = {
            week: { $week: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              week: "$week",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 10080;
        } else if (resol == "1m") {
          _trProject = {
            month: { $month: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              month: "$month",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pairname" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 43200;
        } else if (resol == 1) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: "$minute",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 5) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 5] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 30) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 30] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 60) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 15) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 15] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: {
              $hour: "$createdAt",
            },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        }
      }
    }
    // //console.log(end_date,'eDate');
    //console.log(moment(end_date).add(1, "days"), "eDate");
    // //console.log(moment(start_date).format(),'sDate');
    spotPrices
      .aggregate([
        {
          $match: {
            pairname: pair,
            createdAt: {
              $lt: new Date(moment(end_date).add("1 days")),
              $gte: new Date(moment(start_date).format()),
            },
          },
        },
        // {$limit: 500000},
        {
          $project: _trProject,
        },
        {
          $group: _trGroup,
        },
        {
          $project: project,
        },
        {
          $sort: {
            Date: 1,
          },
        },
        // {
        //                      allowDiskUse: true
        //                    },
      ])
      .exec(function (err, result) {
        // //console.log(err,'err');
        ////console.log(result,'result');
        res.json(result);
      });

    // }
    // else
    // {
    //     // //console.log("no pair data");
    //     res.json({"message" : "No Pair Found"});
    // }
  } catch (e) {
    //console.log("no pair", e);
  }
  // //console.log(pairdata);
  // });
});

cron.schedule("*/5 * * * *", (req, res) => {
  chartupdate("5", "BTCUSD");
});

cron.schedule("*/5 * * * *", (req, res) => {
  chartupdate("5", "ETHBTC");
});

cron.schedule("*/5 * * * *", (req, res) => {
  chartupdate("5", "ETHUSD");
});


cron.schedule("* * * * *", (req, res) => {
  chartupdate("1", "BTCUSD");
});

cron.schedule("* * * * *", (req, res) => {
  chartupdate("1", "ETHBTC");
});

cron.schedule("* * * * *", (req, res) => {
  chartupdate("1", "ETHUSD");
});



cron.schedule("*/15 * * * *", (req, res) => {
  chartupdate("15", "BTCUSD");
});

cron.schedule("*/15 * * * *", (req, res) => {
  chartupdate("15", "ETHBTC");
});

cron.schedule("*/15 * * * *", (req, res) => {
  chartupdate("15", "ETHUSD");
});


cron.schedule("*/30 * * * *", (req, res) => {
  chartupdate("30", "BTCUSD");
});

cron.schedule("*/30 * * * *", (req, res) => {
  chartupdate("30", "ETHBTC");
});

cron.schedule("*/30 * * * *", (req, res) => {
  chartupdate("30", "ETHUSD");
});

cron.schedule("0 0 * * *", (req, res) => {
  spotPrices.remove(
    { createdAt: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } },
    function (err, result) {
      if (!err) {
        // res.send("success");
        //console.log("succes on spotremoveal");
      } else {
        res.send(err);
      }
    }
  );
});



cron.schedule("0 * * * *", (req, res) => {
  chartupdate("60", "BTCUSD");
});

cron.schedule("0 * * * *", (req, res) => {
  chartupdate("60", "ETHBTC");
});

cron.schedule("0 * * * *", (req, res) => {
  chartupdate("60", "ETHUSD");
});


cron.schedule("0 0 * * *", (req, res) => {
  chartupdate("1d", "BTCUSD");
});

cron.schedule("0 0 * * *", (req, res) => {
  chartupdate("1d", "ETHBTC");
});

cron.schedule("0 0 * * *", (req, res) => {
  chartupdate("1d", "ETHUSD");
});

cron.schedule("0 0 1 * *", (req, res) => {
  chartupdate("m", "BTCUSD");
  chartupdate("m", "ETHUSD");
  chartupdate("m", "ETHBTC");
})

function chartspotupdate(resol, pair) {
  try {
    var limits;
    var project = {
      Date: "$Date",
      pair: "$pair",
      low: "$low",
      high: "$high",
      open: "$open",
      close: "$close",
      volume: "$volume",
      exchange: "GlobalCryptoX",
    };

    if (resol) {
      var restype = resol;
      if (
        resol != 1 &&
        resol != 5 &&
        resol != 15 &&
        resol != 30 &&
        resol != 60 &&
        resol != "1d" &&
        resol != "2d" &&
        resol != "3d" &&
        resol != "d" &&
        resol != "1w" &&
        resol != "3w" &&
        resol != "m" &&
        resol != "6m"
      ) {
        res.json({ message: "Resolution value is not valid" });
        return false;
      } else {
        if (resol == "1d") {
          //console.log("1d");
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                  +resol,
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == "d") {
          _trProject = {
            week: { $week: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              week: "$week",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 10080;
        } else if (resol == "m") {
          _trProject = {
            month: { $month: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              month: "$month",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pairName" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 43200;
        } else if (resol == 1) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: { $hour: "$orderDate" },
            minute: { $minute: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: "$minute",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 5) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: { $hour: "$orderDate" },
            minute: { $minute: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 5] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 30) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: { $hour: "$orderDate" },
            minute: { $minute: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 30] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 60) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: { $hour: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 15) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: { $hour: "$orderDate" },
            minute: { $minute: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 15] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$orderDate",
            },
            mn: {
              $month: "$orderDate",
            },
            dt: {
              $dayOfMonth: "$orderDate",
            },
            hour: {
              $hour: "$orderDate",
            },
            minute: { $minute: "$orderDate" },
            filledAmount: 1,
            price: 1,
            pair: "$pairName",
            modifiedDate: "$orderDate",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        }
      }
    }
    // //console.log(end_date,'eDate');
    // //console.log(moment(end_date).add(1, 'days'),'eDate');

    var d1 = new Date();
    var d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() - parseFloat(restype));
    // //console.log(d2)
    // //console.log(d1)
    // //console.log(moment(start_date).format(),'sDate');
    spottradeTable
      .aggregate([
        {
          $match: {
            pairName: pair,
            orderDate: {
              $lt: new Date(),
              $gte: d2,
            },
          },
        },
        // {$limit: 500000},
        {
          $project: _trProject,
        },
        {
          $group: _trGroup,
        },
        {
          $project: project,
        },
        {
          $sort: {
            Date: 1,
          },
        },
      ])
      .exec(function (err, result) {
        // //console.log(err,'err')
        // //console.log(result,'chartresut')
        charts.update(
          { type: restype, pairname: pair },
          { $addToSet: { data: result } },
          function (err, ress) {
            // //console.log(err)
            // //console.log(ress)
          }
        );
      });
  } catch (e) {
    //console.log("no pair", e);
  }
}
//chartupdate("1", "ETHUSD")
function chartupdate(resol, pair) {
  ////console.log('resol',resol)
  //if(resol==30){
  try {
    var limits;
    var project = {
      Date: "$Date",
      pair: "$pair",
      low: "$low",
      high: "$high",
      open: "$open",
      close: "$close",
      volume: "$volume",
      exchange: "GlobalCryptoX",
    };

    if (resol) {
      var restype = resol;
      if (
        resol != 1 &&
        resol != 5 &&
        resol != 15 &&
        resol != 30 &&
        resol != 60 &&
        resol != "1d" &&
        resol != "2d" &&
        resol != "3d" &&
        resol != "d" &&
        resol != "1w" &&
        resol != "3w" &&
        resol != "m" &&
        resol != "6m"
      ) {
        res.json({ message: "Resolution value is not valid" });
        return false;
      } else {
        if (resol == "1d") {
          //console.log("1d");
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            // "hour": {
            //     "$hour": "$createdAt"
            // },
            // "minute": { "$minute": "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                  +resol,
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == "d") {
          _trProject = {
            week: { $week: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              week: "$week",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 10080;
        } else if (resol == "m") {
          _trProject = {
            month: { $month: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              month: "$month",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pairname" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };

          resol = 43200;
        } else if (resol == 1) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: "$minute",
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 5) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 5] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 30) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 30] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else if (resol == 60) {
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
        } else if (resol == 15) {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: { $hour: "$createdAt" },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $subtract: [
                  { $minute: "$modifiedDate" },
                  { $mod: [{ $minute: "$modifiedDate" }, 15] },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        } else {
          resol = 1440;
          _trProject = {
            yr: {
              $year: "$createdAt",
            },
            mn: {
              $month: "$createdAt",
            },
            dt: {
              $dayOfMonth: "$createdAt",
            },
            hour: {
              $hour: "$createdAt",
            },
            minute: { $minute: "$createdAt" },
            filledAmount: 1,
            price: 1,
            pair: "$pairname",
            modifiedDate: "$createdAt",
          };
          _trGroup = {
            _id: {
              year: "$yr",
              month: "$mn",
              day: "$dt",
              hour: "$hour",
              minute: {
                $add: [
                  {
                    $subtract: [
                      { $minute: "$modifiedDate" },
                      { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                    ],
                  },
                ],
              },
            },
            count: {
              $sum: 1,
            },
            Date: { $last: "$modifiedDate" },
            pair: { $first: "$pair" },
            low: { $min: "$price" },
            high: { $max: "$price" },
            open: { $first: "$price" },
            close: { $last: "$price" },
            volume: { $sum: "$filledAmount" },
          };
        }
      }
    }
    // //console.log(end_date,'eDate');
    // //console.log(moment(end_date).add(1, 'days'),'eDate');

    var d1 = new Date();
    var d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() - parseFloat(restype));
    // //console.log(d2)
    // //console.log(d1)
    // //console.log(moment(start_date).format(),'sDate');
    ////console.log('_trGroup',_trGroup)
    var pairCnd = pair;
    if (pair == "BTCUSD") {
      pairCnd = "BTCUSDT"
    }

    if (pair == "ETHUSD") {
      pairCnd = "ETHUSDT"
    }

    ////console.log('pairCnd~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',pairCnd)
    spotPrices
      .aggregate([
        {
          $match: {
            pairname: pairCnd,
            createdAt: {
              $lt: new Date(),
              $gte: d2,
            },
          },
        },
        { $limit: 86400 },
        {
          $project: _trProject,
        },
        {
          $group: _trGroup,
        },
        {
          $project: project,
        },
        {
          $sort: {
            Date: 1,
          },
        },
      ])
      .exec(function (err, result) {
        // //console.log("------err", err)
        ////console.log("-#####-----result", result,pair,restype)
        charts.update(
          { type: restype, pairname: pair },
          { $addToSet: { data: result } },
          function (err, ress) {
            // //console.log(err)
            ////console.log('!!!!!!!!!!!!!!!!!!!!!!!!',err,ress)
          }
        );
      });
  } catch (e) {
    //console.log("no pair", e);
  }
  //}

}

//removeChatData("1", "ETHUSD","Date");
cron.schedule("0 0 1 * *", (req, res) => {
  // one minute
  removeChatData("1", "BTCUSD", "String");
  removeChatData("1", "ETHUSD", "Date");
  removeChatData("1", "ETHBTC", "Date");

  // five minute
  removeChatData("5", "BTCUSD", "String");
  removeChatData("5", "ETHUSD", "Date");
  removeChatData("5", "ETHBTC", "Date");
});


function removeChatData(type, pairname, format) {
  let date = new Date();
  let toDay = `${date.getFullYear()}-${date.getMonth() + 1}-01`
  //console.log("----~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~toDay", toDay)
  if (format == "Date") {
    toDay = new Date(toDay)
  }
  charts.updateMany(
    {
      "pairname": pairname,
      "type": type
    },
    {
      "$pull": {
        "data": {
          "Date": {
            "$lte": toDay
          }
        }
      }
    },
    function (err, ress) {
      // //console.log("----",err)
      //console.log("----@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", ress)
    }
  )
}

module.exports = router;
