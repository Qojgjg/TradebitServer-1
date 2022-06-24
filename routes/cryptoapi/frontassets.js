const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const async = require("async");
const mongoose = require("mongoose");
const currency = require("../../models/currency");
const Assets = require("../../models/Assets");
const Request = require("../../models/Request");
const Address = require("../../models/address");
const Currency = require("../../models/currency");
const FeeTable = require("../../models/FeeTable");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const Emailtemplates = require("../../models/emailtemplate");
const perpetual = require("../../models/perpetual");
const nodemailer = require("nodemailer");
const node2fa = require("node-2fa");
const RippleAPI = require("ripple-lib").RippleAPI;
const CryptoJS = require("crypto-js");
const getJSON = require("get-json");
var rp = require("request-promise");
const Bonus = require("../../models/Bonus");
const axios = require('axios');
var moment = require('moment');
const queryString = require('query-string');
const ethconfigurl = keys.ethurl;
const btcconfigurl = keys.btcurl;
const ltcconfigurl = keys.ltcurl;
const wallets = require('../../models/sparewallets')

var contractAddr = "0xdac17f958d2ee523a22062336994597c13d831ec7";

const https = require('https')
const converter = require('hex2dec');

const userinfo = [];
var minABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_upgradedAddress", type: "address" }],
    name: "deprecate",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "deprecated",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_evilUser", type: "address" }],
    name: "addBlackList",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "upgradedAddress",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "balances",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "maximumFee",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "_totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "unpause",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_maker", type: "address" }],
    name: "getBlackListStatus",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    name: "allowed",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "who", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "pause",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getOwner",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "newBasisPoints", type: "uint256" },
      { name: "newMaxFee", type: "uint256" },
    ],
    name: "setParams",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "amount", type: "uint256" }],
    name: "issue",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "amount", type: "uint256" }],
    name: "redeem",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "basisPointsRate",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "isBlackListed",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_clearedUser", type: "address" }],
    name: "removeBlackList",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "MAX_UINT",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_blackListedUser", type: "address" }],
    name: "destroyBlackFunds",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_initialSupply", type: "uint256" },
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_decimals", type: "uint256" },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "amount", type: "uint256" }],
    name: "Issue",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "amount", type: "uint256" }],
    name: "Redeem",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "newAddress", type: "address" }],
    name: "Deprecate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "feeBasisPoints", type: "uint256" },
      { indexed: false, name: "maxFee", type: "uint256" },
    ],
    name: "Params",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "_blackListedUser", type: "address" },
      { indexed: false, name: "_balance", type: "uint256" },
    ],
    name: "DestroyedBlackFunds",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "_user", type: "address" }],
    name: "AddedBlackList",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "_user", type: "address" }],
    name: "RemovedBlackList",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  { anonymous: false, inputs: [], name: "Pause", type: "event" },
  { anonymous: false, inputs: [], name: "Unpause", type: "event" },
];

const validateWithdrawInput = require("../../validation/frontend/withdraw");

const ObjectId = mongoose.Types.ObjectId;
var cron = require("node-cron");
var request = require("request");
const bitcoin_rpc = require("node-bitcoin-rpc");
const Tx = require("ethereumjs-tx").Transaction;
const Web3 = require("web3");
const web3 = new Web3(keys.infura);
const api = new RippleAPI({
  server: keys.ripplehost, // Public rippled server
});

// let contract = new web3.eth.Contract(minABI, contractAddr);

cron.schedule("* * * * *", (req, res) => {
  // btcupdateBalance();
  // dcntrupdateBalance();
  // ltcupdateBalance();
});
function callBackResponseImport() {
  // tradeinfo.filledamount = 0;
  console.log("callback response");
}


router.get("/tokenupdate/:id", (req, res) => {
  return 
  var user_Id = mongoose.Types.ObjectId(req.params.id);
  Assets.find({ userId: user_Id })
    .populate({ path: "currency", select: "type" })
    .exec(function (err, tokendata) {
      // console.log("length of array",tokendata);

      if (tokendata.length > 0) {
        var i = 0;
        checkbalancetoken(tokendata[0], function () {
          if (i === tokendata.length - 1) {
            callBackResponseImport();
          } else {
            i += 1;
            if (tokendata[i]) {
              checkbalancetoken(tokendata[i]);
            } else {
              callBackResponseImport();
            }
          }
        });
      }
      // console.log("tokendata",tokendata)
      // for (i = 0; i < tokendata.length; i++) {
      //   if (tokendata[i].currency.type == "Token") {
      //     // console.log("tokendatasadasd in iff",tokendata[i])

      //     checkbalancetoken(tokendata[i]);
      //   }
      // }
    });
});


function checkbalancetoken(tokendata, callBackOne) {

  if (callBackOne) {
    userinfo.calltoken = callBackOne;
  }
  if (tokendata.currency.type == "Token") {
    // console.log("tokendata inside the function", tokendata);

    const userethaddress = tokendata.currencyAddress;
    const userprivkey = tokendata.privateKey;
    const userassetid = tokendata._id;
    const userId = tokendata.userId;
    const currencyname = tokendata.currencySymbol;
    const adminaddress = keys.ethaddress;
    const adminprivatekey = keys.ethkey;

    Assets.findOne({ userId: userId, currencySymbol: currencyname })
      .populate({ path: "userId", select: "email" })
      .exec(function (err, userassetdetails) {
        var privKey = userassetdetails ? userassetdetails.privateKey : "";
        userBal = userassetdetails ? userassetdetails.balance : "";

        let url = keys.ethereum.etherScanUrl
        url = url.replace(/##ETHERSCANTYPE##/g, keys.ethereum.etherScanType);

        let object = {
          apikey: keys.ethereum.apikey,
          module: 'account',
          action: 'tokentx',
          address: userethaddress,
        }

        const stringified = queryString.stringify(object);

        getJSON(
          url + stringified,
          // "&startblock=" +
          // max_blocknumber +
          // "&endblock=latest",
          function (errorBal, response) {
            console.log("responsee of token" + currencyname + " tokennnnnnnnnnnn", response);
            if (response) {
              if (response.message == "OK") {
                if (response.result.length > 0) {
                  response.result.forEach(function (singleres) {
                    if (
                      singleres.to.toUpperCase() ==
                      userethaddress.toUpperCase()
                    ) {
                      if (typeof userassetdetails != "undefined" && userassetdetails.currencyAddress != keys.ethaddress) {
                        Currency.findOne({ currencySymbol: currencyname }).then((currencydata) => {
                          console.log("inside");
                          const curcontractaddress = currencydata.contractAddress;
                          const slashminabii = JSON.parse(currencydata.minABI);
                          const decimals = currencydata.decimals
                          // console.log( slashminabii.replace(/\\|\//g,'') );
                          const curminabi = slashminabii.replace(/\\|\//g, '')
                          // token_move_to_admin(
                          //   userassetdetails.currencyAddress,
                          //   userprivkey,
                          //   adminaddress,
                          //   userethaddress,
                          //   userId,
                          //   decimals,
                          //   curminabi,
                          //   curcontractaddress
                          // );
                        });
                      }
                      Transaction.find({
                        user_id: userId,
                        txid: singleres.hash,
                      }).exec(function (uperr, resUpdate) {
                        console.log("length", resUpdate.length);
                        if (resUpdate.length == 0) {
                          currency.findOne({ currencySymbol: singleres.tokenSymbol }).then(currencydata => {
                            // console.log("Currencycdata",currencydata);
                            // var currencydecimal=currencydata.decimals
                            // var initialnum="1"
                            // var finallength = currencydecimal+1
                            // console.log("inital num",initialnum);
                            // return false
                            if (singleres.tokenDecimal == "1") {
                              var recamount = singleres.value / 10;
                            } else if (singleres.tokenDecimal == "6") {
                              var recamount = singleres.value / 1000000;
                              // var recamount =  singleres.value/10;
                            }
                            else if (singleres.tokenDecimal == "8") {
                              var recamount = singleres.value / 100000000;
                            }
                            var currencyfromrespone;
                            if (singleres.tokenSymbol == "????PC") {
                              currencyfromrespone = "💲PC"
                            } else {
                              currencyfromrespone = singleres.tokenSymbol
                            }
                            console.log(recamount, "recamount");
                            var transactions = new Transaction();
                            transactions["user_id"] = userId;
                            transactions["currency"] = currencyfromrespone;
                            transactions["transferType"] = "TOUSER";
                            transactions["toaddress"] = singleres.to;
                            transactions["fromaddress"] = singleres.from;
                            transactions["amount"] = recamount;
                            transactions["txid"] = singleres.hash;
                            var txid = singleres.hash;
                            var useremail = userassetdetails.userId.email;
                            var incdata = {};
                            incdata["spotwallet"] = recamount;
                            transactions.save(function (err, data) {
                              Assets.findOneAndUpdate(
                                {
                                  currencySymbol: currencyname,
                                  userId: ObjectId(userId),
                                },
                                { $inc: incdata },
                                { new: true, fields: { balance: 1 } },
                                function (balerr, baldata) {
                                  userinfo.calltoken();
                                }
                              );
                            });
                          })

                        } else {
                          userinfo.calltoken();
                        }
                      });

                    }
                  });

                }
              }
              else {
                userinfo.calltoken();
              }
            }
          }
        );
      })
  }
  else {
    userinfo.calltoken();
  }



}

function token_move_to_admin(
  currencyAddress,
  userprivkey,
  adminaddress,
  userethaddress,
  userId,
  decimals,
  curminabi,
  curcontractaddress
) {
  console.log("insidne tokenm to admin");
  var userAddress = keys.ethaddress;
  var userprivatekey = keys.ethkey;
  var header = { "Content-Type": "application/json" };
  var args = {
    userAddress: userAddress,
    userprivatekey: userprivatekey,
    privKey: userprivkey,
    currencyAddress: userethaddress,
    cryptoPass: keys.cryptoPass,
    curminabi: curminabi,
    curcontractaddress: curcontractaddress,
    decimals: decimals,
    type: "tokentoadmin",
  };
  // console.log("argsss", args);
  const options = {
    url: ethconfigurl + "/ethnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    console.log("Erorr", error);
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(body);
      console.log(result);
      console.log(result.txHash);
      var txHash = result.txHash;
      var recamount = result.tokenbalance;
      var account1 = adminaddress.ETH;
      var transactions = new Transaction();
      transactions["user_id"] = userId;
      transactions["currency"] = "ETH";
      transactions["transferType"] = "TOADMIN";
      transactions["toaddress"] = account1;
      transactions["fromaddress"] = userAddress;
      transactions["amount"] = recamount;
      transactions["txid"] = txHash;
      if (txHash) {
        transactions.save(function (err, data) {
          var updateVal = {};
          console.log(account1);
          // updateVal.balance =
          //   parseFloat(adminBalances.ETH) + parseFloat(recamount);
          updatebaldata["balance"] = parseFloat(recamount);
          Assets.findOneAndUpdate(
            { currencyAddress: account1 },
            { $inc: updatebaldata },
            // Assets.findOneAndUpdate(
            //   { currencyAddress: account1 },
            //   updateVal,
            { new: true },
            function (err, assetupdatedata) {
              console.log(assetupdatedata);
              console.log(err);
            }
          );
        });
      }
    }
  });
}


router.get("/btccheck", (req, res) => {

  var privkey =
    "U2FsdGVkX182pNbTdqnAo9b0USqGdmIIfIBfj4wt4Ef9yppZKyaNadp0ZABUpyX6nxxEVcqf7kpm91RPpySe3nbIJd5uYj7sr/zHp+XuIJDnFiHTyWN5Lj/wD9wMXVovS"
  var decrypted = CryptoJS.AES.decrypt(privkey.toString(), keys.cryptoPass);
  var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
  var userprivatekey = decryptedData.substring(2);
  res.json({ userprivatekey: userprivatekey });
});
router.get("/getbonusdetails", (req, res) => {
  FeeTable.findOne({}).exec(function (err, bonusdetails) {
    if (bonusdetails) {
      res.json({ status: true, data: bonusdetails });
    } else {
      res.json({ status: false, data: err });
    }
  });
});

router.get("/getbonusbalance/:id", (req, res) => {
  var user_Id = mongoose.Types.ObjectId(req.params.id);
  Assets.findOne({ userId: user_Id, currencySymbol: "BTC" }).exec(function (
    err,
    assetdetails
  ) {
    if (assetdetails) {
      res.json({ status: true, data: assetdetails });
    } else {
      res.json({ status: false, data: err });
    }
  });
});

router.get("/checkdcntr", (req, res) => {
  var header = { "Content-Type": "application/json" };
  var args = { address: "DQw5trvNhoodSfs6ENRbGnuhym7HFp9znn", type: "getbalance" };
  const options = {
    url: "http://54.255.189.160:3003/dcntrcnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("boydd", body);
    }
  })
})

router.get("/addresscreate/:id", (req, res) => {
  var user_Id = mongoose.Types.ObjectId(req.params.id);
  //Eth Address Create
  //Check if user already have address
  Assets.find({ userId: user_Id })
    .populate("userId", "email")
    .populate("currency", "type")
    .exec(function (err, assetdetails) {
      var updateVal = {};
      xrpdetails = {};
      assetdetails.forEach(function (v, i) {
        v.destinationtag = "";
        if (v.currencySymbol == "ETH" && v.currencyAddress == "") {
          // console.log("fsdlkjflsdfl;sjdflksdjflsdkjflskdjf");
          var header = { "Content-Type": "application/json" };
          var args = { email: v.userId.email, type: "getnewaddress" };
          const options = {
            url: ethconfigurl + "/ethnode",
            method: "POST",
            headers: header,
            body: JSON.stringify(args),
          };
          request(options, async function (error, response, body) {
            console.log(error, "error---");
            if (!error && response.statusCode == 200) {
              const account = JSON.parse(body);
              // var account = web3.eth.accounts.create();
              updateVal.currencyAddress = account.address.toLowerCase();
              updateVal.privateKey = CryptoJS.AES.encrypt(
                account.privateKey,
                keys.cryptoPass
              ).toString();
              Assets.findOneAndUpdate(
                { userId: user_Id, currencySymbol: "ETH" },
                updateVal,
                { new: true },
                function (err, addressdata) { }
              );

              let tokenId = [];

              assetdetails.filter((el) => {
                if (el && el.currency.type == 'Token') {
                  tokenId.push(el._id)
                }
              })

              await Assets.updateMany({ "_id": { "$in": tokenId } }, { "$set": updateVal }, { "new": true })

            }
          });
        }

        if ((v.currencySymbol == "BTC" || v.currencySymbol == "LTC") && v.currencyAddress == "") {
          wallets.findOne({currency: v.currencySymbol}).exec(function(err, result){
            if(result){
              wallets.remove({_id: result._id}).exec(function(err, r){
                if(!err){
                  updateVal.currencyAddress = result.address;
                  Assets.findOneAndUpdate(
                    { userId: user_Id, currencySymbol: v.currencySymbol },
                    updateVal,
                    { new: true },
                    function (err, addressdata) {
                      res.json({ status: true, addressdata: addressdata });
                    }
                  );
                }
              })
            }
          })
          //update address
          // var header = { "Content-Type": "application/json" };
          // var args = { email: v.userId.email, type: "getnewaddress" };
          // const options = {
          //   url: btcconfigurl + "/btcnode",
          //   method: "POST",
          //   headers: header,
          //   body: JSON.stringify(args),
          // };
          // request(options, function (error, response, body) {
          //   if (!error && response.statusCode == 200) {
          //     const info = JSON.parse(body);
          //     updateVal.currencyAddress = info.result;
          //     Assets.findOneAndUpdate(
          //       { userId: user_Id, currencySymbol: "BTC" },
          //       updateVal,
          //       { new: true },
          //       function (err, addressdata) {
          //         res.json({ status: true, addressdata: addressdata });
          //       }
          //     );
          //   }
          // });
        }
        if (v.currency.type == "Token" && v.currencyAddress == "") {
          let ethAssetsData = assetdetails.find((el) => el.currencySymbol == 'ETH' && el.currencyAddress != '')
          if (ethAssetsData) {
            let updateVal = {
              currencyAddress: ethAssetsData.currencyAddress,
              privateKey: ethAssetsData.privateKey,
            }

            Assets.findOneAndUpdate(
              { userId: user_Id, currencySymbol: v.currencySymbol },
              updateVal,
              { new: true },
              function (err, addressdata) { }
            );
          }

          // var header = { "Content-Type": "application/json" };
          // var args = { email: v.userId.email, type: "getnewaddress" };
          // const options = {
          //   url: ethconfigurl + "/ethnode",
          //   method: "POST",
          //   headers: header,
          //   body: JSON.stringify(args),
          // };
          // request(options, function (error, response, body) {
          //   if (!error && response.statusCode == 200) {
          //     const account = JSON.parse(body);
          //     console.log(account);
          //     // var account = web3.eth.accounts.create();
          //     updateVal.currencyAddress = account.address;
          //     updateVal.privateKey = CryptoJS.AES.encrypt(
          //       account.privateKey,
          //       keys.cryptoPass
          //     ).toString();
          //     Assets.findOneAndUpdate(
          //       { userId: user_Id, currencySymbol: v.currencySymbol },
          //       updateVal,
          //       { new: true },
          //       function (err, addressdata) { }
          //     );
          //   }
          // });
        }
        // if (v.currencySymbol == 'LTC' && v.currencyAddress == '') {
        //   //update address
        //   var header = { "Content-Type": "application/json" }
        //   var args = { email: v.userId.email, type: "getnewaddress" }
        //   const options = {
        //     url: ltcconfigurl + '/ltcnode',
        //     method: 'POST',
        //     headers: header,
        //     body: JSON.stringify(args)
        //   };
        //   request(options, function (error, response, body) {
        //     if (!error && response.statusCode == 200) {
        //       const info = JSON.parse(body);
        //       updateVal.currencyAddress = info.result;
        //       Assets.findOneAndUpdate({ userId: user_Id, currencySymbol: 'LTC' }, updateVal, { new: true }, function (err, addressdata) {
        //       });
        //     }
        //   });
        // }
        if (v.currencySymbol == "XRP") {
          xrpdetails["address"] = keys.rippleaddress;
          if (v.currencyAddress == "") {
            User.findOne({ _id: ObjectId(user_Id) }, { userid: 1 }, function (
              err,
              userdata
            ) {
              updateVal.currencyAddress = userdata.userid
                ? userdata.userid
                : Math.floor(Math.random() * (9999999 - 1111111) + 1111111);
              Assets.findOneAndUpdate(
                { userId: user_Id, currencySymbol: "XRP" },
                updateVal,
                { new: true },
                function (err, addressdata) {}
              );
            });
          }
        }

        if (i == assetdetails.length - 1) {
          // res.json({status:true,data:assetdetails,xrpdetails:xrpdetails});
        }
      });
    });
});

router.get("/getBalance/:id", (req, res) => {
  var userId = mongoose.Types.ObjectId(req.params.id);
  xrpdetails = {};
  xrpdetails["address"] = keys.rippleaddress;
  Assets.find({ userId: userId })
    .populate("currency", "currencyName currencySymbol fee currencyimage")
    .populate("userId", "email name google")
    .exec(function (err, balance) {
      if (!err) {
        res.json({ status: true, data: balance, xrpdetails: xrpdetails });
      }
    });
});

router.get("/updateusdtBalance/:id", (req, res) => {
  var userId = mongoose.Types.ObjectId(req.params.id);
  // setTimeout(function () {
  //   var adminId = "";
  //   var adminAddresses = { ETH: "", BTC: "", USDT: "", LTC: "", XRP: "" };
  //   var adminBalances = { ETH: "", BTC: "", USDT: "", LTC: "", XRP: "" };
  //   var userBal = "";
  //   async.waterfall(
  //     [
  //       function (done) {
  //         User.findOne({ moderator: 2 }).then((user) => {
  //           adminId = user._id;
  //           done();
  //         });
  //       },
  //       function (done) {
  //         Assets.find({ userId: mongoose.Types.ObjectId(adminId) }).then(
  //           (adminassets) => {
  //             adminassets.forEach(function (v, i) {
  //               adminAddresses[v.currencySymbol] = v.currencyAddress;
  //               adminBalances[v.currencySymbol] = v.balance;
  //             });
  //             done();
  //           }
  //         );
  //       },
  //       function (done) {
  //         Assets.findOne({ userId: userId, currencySymbol: "USDT" })
  //           .populate({ path: "userId", select: "email" })
  //           .exec(function (err, v) {
  //             if (!err) {
  //               var privKey = v.privateKey;
  //               var currencyAddress = v.currencyAddress;
  //               userBal = v.balance;
  //               var userAddress = keys.ethaddress;
  //               var userprivatekey = keys.ethkey;
  //               var header = { "Content-Type": "application/json" };
  //               var args = {
  //                 currencyAddress: currencyAddress,
  //                 cryptoPass: keys.cryptoPass,
  //                 privKey: privKey,
  //                 userAddress: userAddress,
  //                 userprivatekey: userprivatekey,
  //                 type: "tokenupdation",
  //               };
  //               console.log(args, "args");
  //               const options = {
  //                 url: ethconfigurl+"/ethnode",
  //                 method: "POST",
  //                 headers: header,
  //                 body: JSON.stringify(args),
  //               };
  //               rp(options).then(function (body, response, test) {
  //                 console.log(body, "body");
  //                 var info = JSON.parse(body);
  //                 if (info.status) {
  //                   console.log("here");
  //                   var tokenbalnce = web3.utils.fromWei(
  //                     info.tokenbalnce.toString(),
  //                     "ether"
  //                   );
  //                   var txHash = info.txHash;
  //                   console.log(tokenbalnce, "tokenbalnce");
  //                   var transactions = new Transaction();
  //                   transactions["user_id"] = userId;
  //                   transactions["currency"] = "USDT";
  //                   transactions["transferType"] = "TOUSER";
  //                   transactions["toaddress"] = currencyAddress;
  //                   transactions["amount"] = tokenbalnce;
  //                   transactions["txid"] = txHash;
  //                   updatebaldata = {};
  //                   updatebaldata["spotwallet"] = tokenbalnce;
  //                   transactions.save(function (err, data) {
  //                     console.log(err);
  //                     console.log(data);
  //                     Assets.findOneAndUpdate(
  //                       { currencySymbol: "USDT", userId: ObjectId(userId) },
  //                       { $inc: updatebaldata },
  //                       { new: true, fields: { balance: 1 } },
  //                       function (balerr, baldata) {}
  //                     );
  //                   });
  //                 }
  //               });
  //             }
  //           });
  //       },
  //     ],
  //     function (err) {}
  //   );
  // }, 300000);
});

router.get("/updateBalance/:id", (req, res) => {
  var userId = mongoose.Types.ObjectId(req.params.id);
  //Add details into transactiontable
  // console.log('updateBalanceupdateBalanceupdateBalance')
  var adminId = "";
  var adminAddresses = { ETH: "", BTC: "", BCH: "", LTC: "", XRP: "" };
  var adminBalances = { ETH: "", BTC: "", BCH: "", LTC: "", XRP: "" };
  var userBal = "";
  async.waterfall(
    [
      function (done) {
        User.findOne({ moderator: 2 }).then((user) => {
          adminId = user._id;
          done();
        });
      },
      function (done) {
        Assets.find({ userId: mongoose.Types.ObjectId(adminId) }).then(
          (adminassets) => {
            adminassets.forEach(function (v, i) {
              adminAddresses[v.currencySymbol] = v.currencyAddress;
              adminBalances[v.currencySymbol] = v.balance;
            });
            done();
          }
        );
      },
      function (done) {
        console.log('#########################', userId);
        Assets.findOne({ userId: userId, currencySymbol: "ETH" })
          .populate({ path: "userId", select: "email" })
          .exec(function (err, v) {
            if (!err) {
              var privKey = v ? v.privateKey : "";
              userBal = v ? v.balance : "";
              var header = { "Content-Type": "application/json" };
              var args = { ethaddress: v.currencyAddress, type: "getbalance" };
              const options = {
                url: ethconfigurl + "/ethnode",
                method: "POST",
                headers: header,
                body: JSON.stringify(args),
              };
              request(options, function (error, response, body) {

                if (!error && response.statusCode == 200) {
                  var balance = JSON.parse(body);
                  // var balance = 10;
                  balance = balance.result;
                  console.log(balance, "balance");
                  console.log(roundToTwo(balance), "balance");
                  if (balance > 0) {
                    var max_blocknumber = 6091041;
                    getJSON(
                      "https://api.etherscan.io/api?apiKey=V1DJUVHQJV4GUCB97RH35MG9T3RWI4RBI5&module=account&action=txlist&address=" +
                      v.currencyAddress +
                      "&startblock=" +
                      max_blocknumber +
                      "&endblock=latest",
                      function (errorBal, response) {
                        // getJSON("https://ropsten.etherscan.io/api?apiKey=V1DJUVHQJV4GUCB97RH35MG9T3RWI4RBI5&module=account&action=txlist&address="+v.currencyAddress+"&startblock="+max_blocknumber+"&endblock=latest", function(errorBal,response){
                        // console.log(response,'response')
                        if (
                          typeof response != "undefined" &&
                          response.message == "OK"
                        ) {
                          if (response.result.length > 0) {
                            response.result.forEach(function (singleres) {
                              Transaction.find({
                                user_id: userId,
                                txid: singleres.hash,
                              }).exec(function (uperr, resUpdate) {
                                if (resUpdate.length == 0) {
                                  var recamount = web3.utils.fromWei(
                                    singleres.value,
                                    "ether"
                                  );
                                  var transactions = new Transaction();
                                  transactions["user_id"] = userId;
                                  transactions["currency"] = "ETH";
                                  transactions["transferType"] = "TOUSER";
                                  transactions["toaddress"] = singleres.to;
                                  transactions["fromaddress"] = singleres.from;
                                  transactions["amount"] = recamount;
                                  transactions["txid"] = singleres.hash;
                                  var txid = singleres.hash;
                                  var useremail = v.userId.email;
                                  transactions.save(function (err, data) {
                                    updatebaldata = {};
                                    updatebaldata["spotwallet"] = recamount;
                                    Assets.findOneAndUpdate(
                                      {
                                        currencySymbol: "ETH",
                                        userId: ObjectId(userId),
                                      },
                                      { $inc: updatebaldata },
                                      { new: true, fields: { balance: 1 } },
                                      function (balerr, baldata) { }
                                    );
                                    var jsonfilter = {
                                      identifier: "User_deposit",
                                    };
                                    Emailtemplates.findOne(
                                      jsonfilter,
                                      { _id: 0 },
                                      function (err, templates) {
                                        if (templates.content) {
                                          templateData = templates;
                                          templateData.content = templateData.content.replace(
                                            /##templateInfo_name##/g,
                                            useremail
                                          );
                                          templateData.content = templateData.content.replace(
                                            /##templateInfo_appName##/g,
                                            keys.siteName
                                          );
                                          templateData.content = templateData.content.replace(
                                            /##DATE##/g,
                                            new Date()
                                          );
                                          templateData.content = templateData.content.replace(
                                            /##AMOUNT##/g,
                                            parseFloat(recamount).toFixed(8)
                                          );
                                          templateData.content = templateData.content.replace(
                                            /##TXID##/g,
                                            txid
                                          );
                                          templateData.content = templateData.content.replace(
                                            /##CURRENCY##/g,
                                            "ETH"
                                          );
                                          var smtpConfig = {
                                            host: keys.host, // Amazon email SMTP hostname
                                            auth: {
                                              user: keys.email,
                                              pass: keys.password,
                                            },
                                          };
                                          var transporter = nodemailer.createTransport(
                                            smtpConfig
                                          );

                                          var mailOptions = {
                                            from:
                                              keys.fromName +
                                              "<" +
                                              keys.fromemail +
                                              ">", // sender address
                                            to: useremail, // list of receivers
                                            subject: templateData.subject, // Subject line
                                            html: templateData.content, // html body
                                          };
                                          if (
                                            v.currencyAddress !=
                                            adminAddresses.ETH
                                          ) {
                                            transporter.sendMail(
                                              mailOptions,
                                              function (error, info) {
                                                if (error) {
                                                  return console.log(error);
                                                }
                                              }
                                            );
                                          }
                                        }
                                      }
                                    );
                                  });
                                }
                              });
                            });
                          }
                        }
                      }
                    );
                    // console.log(v.currencyAddress,'v.currencyAddress')
                    console.log(adminAddresses, "adminAddresses");
                    if (v.currencyAddress != adminAddresses.ETH) {
                      // amount_move_to_admin(
                      //   v.currencyAddress,
                      //   privKey,
                      //   adminAddresses,
                      //   userBal,
                      //   userId,
                      //   adminBalances
                      // );
                    }
                  } else {
                    console.log("balance low");
                  }
                }
              });
            }
          });
      },
    ],
    function (err) { }
  );
});
function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}
function amount_move_to_admin(
  useraddress,
  privkey,
  address,
  userBal,
  userId,
  adminBalances
) {
  console.log("----useraddress", useraddress)
  console.log("----privkey", privkey)
  console.log("----address", address)
  console.log("----userBal", userBal)
  console.log("----userId", userId)
  console.log("----adminBalances", adminBalances)

  // console.log("fsdlskdjflsjdflsdjflsdjflsdkjfsldkjflsdf", address);
  //get Admin address
  //Update virtual amount into Asset Table
  //var updateVal = {};
  //updateVal.amount = {$inc: { amount : trans.amount }}
  var header = { "Content-Type": "application/json" };
  var args = {
    adminaddress: address.ETH,
    privkey: privkey,
    useraddress: useraddress,
    cryptoPass: keys.cryptoPass,
    type: "movetoadmin",
  };
  const options = {
    url: ethconfigurl + "/ethnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    console.log("------error", error)
    console.log("------body", body)
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(body);
      console.log(result);
      console.log(result.txHash);
      var txHash = result.txHash;
      var recamount = result.recamount;
      var account1 = address.ETH;
      var transactions = new Transaction();
      transactions["user_id"] = userId;
      transactions["currency"] = "ETH";
      transactions["transferType"] = "TOADMIN";
      transactions["toaddress"] = account1;
      transactions["fromaddress"] = useraddress;
      transactions["amount"] = recamount;
      transactions["txid"] = txHash;
      if (txHash) {
        transactions.save(function (err, data) {
          var updateVal = {};
          console.log(account1);
          updateVal.balance =
            parseFloat(adminBalances.ETH) + parseFloat(recamount);
          Assets.findOneAndUpdate(
            { currencyAddress: account1 },
            updateVal,
            { new: true },
            function (err, assetupdatedata) {
              console.log(assetupdatedata);
              console.log(err);
            }
          );
        });
      }
    }
  });

  var account1 = address.ETH;
  var decrypted = CryptoJS.AES.decrypt(privkey.toString(), keys.cryptoPass);
  var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
  var userprivatekey = decryptedData.substring(2);
  web3.eth.getBalance(useraddress, (err, balance) => {
    web3.eth.getGasPrice(function (err, getGasPrice) {
      web3.eth.getTransactionCount(useraddress, (err, txCount) => {
        var gaslimit = web3.utils.toHex(500000);
        var fee = web3.utils.toHex(getGasPrice) * gaslimit;
        var amount = balance - fee;
        if (amount > 0) {
          var updateVal = {};

          const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(gaslimit),
            gasPrice: web3.utils.toHex(getGasPrice),
            to: account1.toString(),
            value: amount,
          };
          console.log(txObject);
          var userprivatekey1 = Buffer.from(userprivatekey, "hex");
          const tx = new Tx(txObject, { chain: "ropsten" });
          tx.sign(userprivatekey1);
          const serializedTx = tx.serialize();
          console.log(serializedTx);
          const raw1 = "0x" + serializedTx.toString("hex");
          console.log(raw1);
          web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
            console.log(txHash);
            console.log(err);
            var recamount = web3.utils.fromWei(amount.toString(), "ether");
            var transactions = new Transaction();
            transactions["user_id"] = userId;
            transactions["currency"] = "ETH";
            transactions["transferType"] = "TOADMIN";
            transactions["toaddress"] = account1;
            transactions["fromaddress"] = useraddress;
            transactions["amount"] = recamount;
            transactions["txid"] = txHash;
            if (txHash) {
              transactions.save(function (err, data) {
                var updateVal = {};
                console.log(account1);
                updateVal.balance =
                  parseFloat(adminBalances.ETH) + parseFloat(recamount);
                Assets.findOneAndUpdate(
                  { currencyAddress: account1 },
                  updateVal,
                  { new: true },
                  function (err, assetupdatedata) {
                    console.log(assetupdatedata);
                    console.log(err);
                  }
                );
              });
            }
          });
        } else {
          console.log("no balance");
        }
      });
    });
  });
}

// router.get('/ltcupdateBalance', (req, res) => {
function ltcupdateBalance() {
  var header = { "Content-Type": "application/json" };
  var args = { email: "test", type: "listtransactions" };
  const options = {
    url: 'http://136.244.105.184:3000/ltcnode',
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const info = JSON.parse(body);
      var result = info.result;
      // console.log(result,'result');
      async.waterfall(
        [
          function (done) {
            Assets.find(
              { currencySymbol: "LTC" },
              { currencyAddress: 1, userId: 1 }
            )
              .populate({ path: "userId", select: "email" })
              .exec(function (err, assetdetails) {
                if (assetdetails) {
                  done(err, assetdetails);
                }
              });
          },
          function (assetdetails, done) {
            Transaction.find({ currency: "LTC" }).exec(function (
              err,
              transactiondetails
            ) {
              if (transactiondetails) {
                done(err, transactiondetails, assetdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, done) {
            for (var i = 0; i < result.length; i++) {
              // console.log(result[i].address);
              var index1 = assetdetails.findIndex(
                (x) => x.currencyAddress === result[i].address
              );
              // console.log(index1,'index1')
              var index = transactiondetails.findIndex(
                (x) => x.txid === result[i].txid
              );
              // console.log(index,'index')
              if (index1 != -1) {
                // console.log('inside if')
                var userId =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId._id
                    : "";
                var useremail =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId.email
                    : "";
                // console.log(userId,'userId')
                // console.log(useremail,'useremail')
                if (
                  result[i].category == "receive" &&
                  result[i].confirmations > 0 &&
                  index == -1
                ) {
                  const newTransaction = new Transaction({
                    user_id: userId,
                    currency: "LTC",
                    toaddress: result[i].address,
                    transferType: "TOUSER",
                    amount: result[i].amount,
                    txid: result[i].txid,
                  });
                  updatebaldata = {};
                  updatebaldata["balance"] = result[i].amount;
                  var amount = result[i].amount;
                  var txid = result[i].txid;
                  Assets.findOneAndUpdate(
                    { currencySymbol: "LTC", userId: ObjectId(userId) },
                    { $inc: updatebaldata },
                    { new: true, fields: { balance: 1 } },
                    function (balerr, baldata) {
                      // console.log(balerr);
                      // console.log(baldata);
                    }
                  );

                  newTransaction.save(function (err, data) {
                    var jsonfilter = { identifier: "User_deposit" };
                    Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                      err,
                      templates
                    ) {
                      if (templates.content) {
                        templateData = templates;
                        templateData.content = templateData.content.replace(
                          /##templateInfo_name##/g,
                          useremail
                        );
                        templateData.content = templateData.content.replace(
                          /##templateInfo_appName##/g,
                          keys.siteName
                        );
                        templateData.content = templateData.content.replace(
                          /##DATE##/g,
                          new Date()
                        );
                        templateData.content = templateData.content.replace(
                          /##AMOUNT##/g,
                          parseFloat(amount).toFixed(8)
                        );
                        templateData.content = templateData.content.replace(
                          /##TXID##/g,
                          txid
                        );
                        templateData.content = templateData.content.replace(
                          /##CURRENCY##/g,
                          "LTC"
                        );
                        var smtpConfig = {
                          host: keys.host, // Amazon email SMTP hostname
                          auth: {
                            user: keys.email,
                            pass: keys.password,
                          },
                        };
                        var transporter = nodemailer.createTransport(
                          smtpConfig
                        );

                        var mailOptions = {
                          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                          to: useremail, // list of receivers
                          subject: templateData.subject, // Subject line
                          html: templateData.content, // html body
                        };
                        transporter.sendMail(mailOptions, function (
                          error,
                          info
                        ) {
                          if (error) {
                            return console.log(error);
                          }
                        });
                      }
                    });
                  });
                }
              }
            }
          },
        ],
        function (err, transactiondetails) { }
      );
    }
  });
  // });
}

function dcntrupdateBalance() {
  // router.get('/btcupdateBalance', (req, res) => {
  var header = { "Content-Type": "application/json" };
  var args = { email: "test", type: "listtransactions" };
  const options = {
    url: "http://54.255.189.160:3003/dcntrcnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log("body from dcntr",body);
      // console.log("body from errotrrr",error);

      const info = JSON.parse(body);
      var result = info.result;

      async.waterfall(
        [
          function (done) {
            Assets.find(
              { currencySymbol: "DCNTR" },
              { currencyAddress: 1, userId: 1 }
            )
              .populate({
                path: "userId",
                select: { email: 1, referaluserid: 1 },
              })
              .exec(function (err, assetdetails) {
                if (assetdetails) {
                  done(err, assetdetails);
                }
              });
          },
          function (assetdetails, done) {
            Transaction.find({ currency: "DCNTR" }).exec(function (
              err,
              transactiondetails
            ) {
              if (transactiondetails) {
                done(err, transactiondetails, assetdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, done) {
            FeeTable.findOne({}).exec(function (err, bonusdetails) {
              if (bonusdetails) {
                done(err, transactiondetails, assetdetails, bonusdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, bonusdetails, done) {
            var referal_bonus = bonusdetails ? bonusdetails.firstlevel : 0;
            var deposit_bonus = bonusdetails ? bonusdetails.deposit_bonus : 0;
            // console.log(deposit_bonus,'deposit_bonus')
            for (var i = 0; i < result.length; i++) {
              // console.log(result[i].address);
              // console.log(assetdetails,'assetdetails');
              var address = result[i].address;
              var index1 = assetdetails.findIndex(
                (x) => x.currencyAddress === address
              );
              var index = transactiondetails.findIndex(
                (x) => x.txid === result[i].txid
              );
              if (index1 != -1) {
                var userId =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId._id
                    : "";
                var useremail =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId.email
                    : "";
                var referid =
                  typeof assetdetails[index1].userId != "undefined"
                    ? typeof assetdetails[index1].userId.referaluserid !=
                      "undefined"
                      ? assetdetails[index1].userId.referaluserid
                      : ""
                    : "";
                if (
                  result[i].category == "receive" &&
                  result[i].confirmations > 0 &&
                  index == -1
                ) {
                  const newTransaction = new Transaction({
                    user_id: userId,
                    currency: "DCNTR",
                    toaddress: result[i].address,
                    transferType: "TOUSER",
                    amount: result[i].amount,
                    txid: result[i].txid,
                  });
                  var amount = result[i].amount;
                  var bonus =
                    (parseFloat(amount) * parseFloat(deposit_bonus)) / 100;
                  updatebaldata = {};
                  updatebaldata["spotwallet"] = result[i].amount;
                  updatebaldata["tempcurrency"] = bonus;
                  var amount = result[i].amount;
                  var txid = result[i].txid;
                  const newBonus = new Bonus({
                    userId: userId,
                    bonus_amount: bonus,
                    depositamount: amount,
                    type: "2",
                  });
                  newBonus.save(function (err, data) {
                    // console.log(err,'err')
                    // console.log(data,'data')
                  });
                  Assets.findOneAndUpdate(
                    { currencySymbol: "DCNTR", userId: ObjectId(userId) },
                    { $inc: updatebaldata },
                    { new: true, fields: { balance: 1 } },
                    function (balerr, baldata) {
                      if (referid != "") {
                        updatebaldata = {};
                        var bonus =
                          (parseFloat(amount) * parseFloat(referal_bonus)) /
                          100;
                        updatebaldata["tempcurrency"] = bonus;
                        Assets.findOneAndUpdate(
                          { currencySymbol: "DCNTR", userId: ObjectId(referid) },
                          { $inc: updatebaldata },
                          { new: true, fields: { balance: 1 } },
                          function (balerr, baldata) { }
                        );

                        const newBonus1 = new Bonus({
                          userId: referid,
                          bonus_amount: bonus,
                          type: "1",
                          referId: userId,
                          depositamount: amount,
                        });
                        newBonus1.save(function (err, data) {
                          // console.log(err,'err')
                          // console.log(data,'data')
                        });
                      }
                      // console.log(balerr);
                      // console.log(baldata);
                    }
                  );

                  newTransaction.save(function (err, data) {
                    var jsonfilter = { identifier: "User_deposit" };
                    Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                      err,
                      templates
                    ) {
                      if (templates.content) {
                        templateData = templates;
                        templateData.content = templateData.content.replace(
                          /##templateInfo_name##/g,
                          useremail
                        );
                        templateData.content = templateData.content.replace(
                          /##templateInfo_appName##/g,
                          keys.siteName
                        );
                        templateData.content = templateData.content.replace(
                          /##DATE##/g,
                          new Date()
                        );
                        templateData.content = templateData.content.replace(
                          /##AMOUNT##/g,
                          parseFloat(amount).toFixed(8)
                        );
                        templateData.content = templateData.content.replace(
                          /##TXID##/g,
                          txid
                        );
                        templateData.content = templateData.content.replace(
                          /##CURRENCY##/g,
                          "DCNTR"
                        );
                        var smtpConfig = {
                          host: keys.host, // Amazon email SMTP hostname
                          auth: {
                            user: keys.email,
                            pass: keys.password,
                          },
                        };
                        var transporter = nodemailer.createTransport(
                          smtpConfig
                        );

                        var mailOptions = {
                          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                          to: useremail, // list of receivers
                          subject: templateData.subject, // Subject line
                          html: templateData.content, // html body
                        };
                        transporter.sendMail(mailOptions, function (
                          error,
                          info
                        ) {
                          if (error) {
                            return console.log(error);
                          }
                        });
                      }
                    });
                  });
                }
              }
            }
          },
        ],
        function (err, transactiondetails) { }
      );
    }
  });
  // });
}

function btcupdateBalance() {
  // router.get('/btcupdateBalance', (req, res) => {
  var header = { "Content-Type": "application/json" };
  var args = { email: "test", type: "listtransactions" };
  const options = {
    url: btcconfigurl + "/btcnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const info = JSON.parse(body);
      var result = info.result;

      async.waterfall(
        [
          function (done) {
            Assets.find(
              { currencySymbol: "BTC" },
              { currencyAddress: 1, userId: 1 }
            )
              .populate({
                path: "userId",
                select: { email: 1, referaluserid: 1 },
              })
              .exec(function (err, assetdetails) {
                if (assetdetails) {
                  done(err, assetdetails);
                }
              });
          },
          function (assetdetails, done) {
            Transaction.find({ currency: "BTC" }).exec(function (
              err,
              transactiondetails
            ) {
              if (transactiondetails) {
                done(err, transactiondetails, assetdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, done) {
            FeeTable.findOne({}).exec(function (err, bonusdetails) {
              if (bonusdetails) {
                done(err, transactiondetails, assetdetails, bonusdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, bonusdetails, done) {
            var referal_bonus = bonusdetails ? bonusdetails.firstlevel : 0;
            var deposit_bonus = bonusdetails ? bonusdetails.deposit_bonus : 0;
            // console.log(deposit_bonus,'deposit_bonus')
            for (var i = 0; i < result.length; i++) {
              // console.log(result[i].address);
              // console.log(assetdetails,'assetdetails');
              var address = result[i].address;
              var index1 = assetdetails.findIndex(
                (x) => x.currencyAddress === address
              );
              var index = transactiondetails.findIndex(
                (x) => x.txid === result[i].txid
              );
              if (index1 != -1) {
                var userId =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId._id
                    : "";
                var useremail =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId.email
                    : "";
                var referid =
                  typeof assetdetails[index1].userId != "undefined"
                    ? typeof assetdetails[index1].userId.referaluserid !=
                      "undefined"
                      ? assetdetails[index1].userId.referaluserid
                      : ""
                    : "";
                if (
                  result[i].category == "receive" &&
                  result[i].confirmations > 0 &&
                  index == -1
                ) {
                  const newTransaction = new Transaction({
                    user_id: userId,
                    currency: "BTC",
                    toaddress: result[i].address,
                    transferType: "TOUSER",
                    amount: result[i].amount,
                    txid: result[i].txid,
                  });
                  var amount = result[i].amount;
                  var bonus =
                    (parseFloat(amount) * parseFloat(deposit_bonus)) / 100;
                  updatebaldata = {};
                  updatebaldata["balance"] = result[i].amount;
                  updatebaldata["tempcurrency"] = bonus;
                  var amount = result[i].amount;
                  var txid = result[i].txid;
                  const newBonus = new Bonus({
                    userId: userId,
                    bonus_amount: bonus,
                    depositamount: amount,
                    type: "2",
                  });
                  newBonus.save(function (err, data) {
                    // console.log(err,'err')
                    // console.log(data,'data')
                  });
                  Assets.findOneAndUpdate(
                    { currencySymbol: "BTC", userId: ObjectId(userId) },
                    { $inc: updatebaldata },
                    { new: true, fields: { balance: 1 } },
                    function (balerr, baldata) {
                      if (referid != "") {
                        updatebaldata = {};
                        var bonus =
                          (parseFloat(amount) * parseFloat(referal_bonus)) /
                          100;
                        updatebaldata["tempcurrency"] = bonus;
                        Assets.findOneAndUpdate(
                          { currencySymbol: "BTC", userId: ObjectId(referid) },
                          { $inc: updatebaldata },
                          { new: true, fields: { balance: 1 } },
                          function (balerr, baldata) { }
                        );

                        const newBonus1 = new Bonus({
                          userId: referid,
                          bonus_amount: bonus,
                          type: "1",
                          referId: userId,
                          depositamount: amount,
                        });
                        newBonus1.save(function (err, data) {
                          // console.log(err,'err')
                          // console.log(data,'data')
                        });
                      }
                      // console.log(balerr);
                      // console.log(baldata);
                    }
                  );

                  newTransaction.save(function (err, data) {
                    var jsonfilter = { identifier: "User_deposit" };
                    Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                      err,
                      templates
                    ) {
                      if (templates.content) {
                        templateData = templates;
                        templateData.content = templateData.content.replace(
                          /##templateInfo_name##/g,
                          useremail
                        );
                        templateData.content = templateData.content.replace(
                          /##templateInfo_appName##/g,
                          keys.siteName
                        );
                        templateData.content = templateData.content.replace(
                          /##DATE##/g,
                          new Date()
                        );
                        templateData.content = templateData.content.replace(
                          /##AMOUNT##/g,
                          parseFloat(amount).toFixed(8)
                        );
                        templateData.content = templateData.content.replace(
                          /##TXID##/g,
                          txid
                        );
                        templateData.content = templateData.content.replace(
                          /##CURRENCY##/g,
                          "BTC"
                        );
                        var smtpConfig = {
                          host: keys.host, // Amazon email SMTP hostname
                          auth: {
                            user: keys.email,
                            pass: keys.password,
                          },
                        };
                        var transporter = nodemailer.createTransport(
                          smtpConfig
                        );

                        var mailOptions = {
                          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                          to: useremail, // list of receivers
                          subject: templateData.subject, // Subject line
                          html: templateData.content, // html body
                        };
                        transporter.sendMail(mailOptions, function (
                          error,
                          info
                        ) {
                          if (error) {
                            return console.log(error);
                          }
                        });
                      }
                    });
                  });
                }
              }
            }
          },
        ],
        function (err, transactiondetails) { }
      );
    }
  });
  // });
}
function bchupdateBalance() {
  // router.get('/bchupdateBalance', (req, res) => {
  var header = { "Content-Type": "application/json" };
  var args = { email: "test", type: "listtransactions" };
  const options = {
    url: "http://169.247.4.3:9003/bchnode",
    method: "POST",
    headers: header,
    body: JSON.stringify(args),
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const info = JSON.parse(body);
      var result = info.result;

      async.waterfall(
        [
          function (done) {
            Assets.find(
              { currencySymbol: "BCH" },
              { currencyAddress: 1, userId: 1 }
            )
              .populate({ path: "userId", select: "email" })
              .exec(function (err, assetdetails) {
                if (assetdetails) {
                  done(err, assetdetails);
                }
              });
          },
          function (assetdetails, done) {
            Transaction.find({ currency: "BCH" }).exec(function (
              err,
              transactiondetails
            ) {
              if (transactiondetails) {
                done(err, transactiondetails, assetdetails);
              }
            });
          },
          function (transactiondetails, assetdetails, done) {
            for (var i = 0; i < result.length; i++) {
              var address = result[i].address.replace("bitcoincash:", "");
              var index1 = assetdetails.findIndex(
                (x) => x.currencyAddress === address
              );
              var index = transactiondetails.findIndex(
                (x) => x.txid === result[i].txid
              );
              if (index1 != -1) {
                var userId =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId._id
                    : "";
                var useremail =
                  typeof assetdetails[index1].userId != "undefined"
                    ? assetdetails[index1].userId.email
                    : "";
                if (
                  result[i].category == "receive" &&
                  result[i].confirmations > 0 &&
                  index == -1
                ) {
                  const newTransaction = new Transaction({
                    user_id: userId,
                    currency: "BCH",
                    toaddress: result[i].address,
                    transferType: "TOUSER",
                    amount: result[i].amount,
                    txid: result[i].txid,
                  });
                  updatebaldata = {};
                  updatebaldata["balance"] = result[i].amount;
                  var amount = result[i].amount;
                  var txid = result[i].txid;
                  Assets.findOneAndUpdate(
                    { currencySymbol: "BCH", userId: ObjectId(userId) },
                    { $inc: updatebaldata },
                    { new: true, fields: { balance: 1 } },
                    function (balerr, baldata) {
                      // console.log(balerr);
                      // console.log(baldata);
                    }
                  );

                  newTransaction.save(function (err, data) {
                    var jsonfilter = { identifier: "User_deposit" };
                    Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                      err,
                      templates
                    ) {
                      if (templates.content) {
                        templateData = templates;
                        templateData.content = templateData.content.replace(
                          /##templateInfo_name##/g,
                          useremail
                        );
                        templateData.content = templateData.content.replace(
                          /##templateInfo_appName##/g,
                          keys.siteName
                        );
                        templateData.content = templateData.content.replace(
                          /##DATE##/g,
                          new Date()
                        );
                        templateData.content = templateData.content.replace(
                          /##AMOUNT##/g,
                          parseFloat(amount).toFixed(8)
                        );
                        templateData.content = templateData.content.replace(
                          /##TXID##/g,
                          txid
                        );
                        templateData.content = templateData.content.replace(
                          /##CURRENCY##/g,
                          "BCH"
                        );
                        var smtpConfig = {
                          host: keys.host, // Amazon email SMTP hostname
                          auth: {
                            user: keys.email,
                            pass: keys.password,
                          },
                        };
                        var transporter = nodemailer.createTransport(
                          smtpConfig
                        );

                        var mailOptions = {
                          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                          to: useremail, // list of receivers
                          subject: templateData.subject, // Subject line
                          html: templateData.content, // html body
                        };
                        transporter.sendMail(mailOptions, function (
                          error,
                          info
                        ) {
                          if (error) {
                            return console.log(error);
                          }
                        });
                      }
                    });
                  });
                }
              }
            }
          },
        ],
        function (err, transactiondetails) { }
      );
    }
  });
  // });
}

router.get("/xrpupdateBalance/:id", (req, res) => {
  console.log("insidwe xrp");
  var userId = mongoose.Types.ObjectId(req.params.id);
  Assets.findOne({ userId: userId, currencySymbol: "XRP" })
    .populate("currency", "currencyName currencySymbol")
    .populate("userId", "email name")
    .exec(function (err, assetdetails) {
      if (!err) {
        // console.log(assetdetails,'assetdetails');
        var currencyAddress = assetdetails.currencyAddress;
        api
          .connect()
          .then(() => {
            return api.getServerInfo();
          })
          .then((serverInfo) => {
            const ledgers = serverInfo.completeLedgers.split("-");
            const minLedgerVersion = Number(ledgers[0]);
            const maxLedgerVersion = Number(ledgers[1]);

            const myAddress = "rP7oi1VtWdapSS3fURURaT6G9rijQuGKr5";

            return api
              .getTransactions(myAddress, {
                minLedgerVersion,
                maxLedgerVersion,
              })
              .then((transaction) => {
                async.waterfall(
                  [
                    function (done) {
                      Transaction.find({
                        user_id: userId,
                        currency: "XRP",
                      }).exec(function (err, transactiondetails) {
                        console.log(transactiondetails);
                        if (transactiondetails) {
                          done(err, transactiondetails);
                        }
                      });
                    },
                    function (transactiondetails, done) {
                      for (var i = 0; i < transaction.length; i++) {
                        // console.log(transaction[i].specification,'transaction')
                        var index = transactiondetails.findIndex(
                          (x) => x.txid === transaction[i].id
                        );
                        if (
                          transaction[i].specification.destination.tag ==
                          currencyAddress &&
                          index == -1
                        ) {
                          const newTransaction = new Transaction({
                            tagid: req.body.tagid,
                            user_id: userId,
                            currency: "XRP",
                            toaddress: keys.rippleaddress,
                            transferType: "TOUSER",
                            amount:
                              transaction[i].specification.source.maxAmount
                                .value,
                            tagid: currencyAddress,
                            txid: transaction[i].id,
                          });
                          var amount =
                            transaction[i].specification.source.maxAmount.value;
                          var txid = transaction[i].id;
                          var useremail = assetdetails.userId.email;
                          // console.log(useremail,'useremail')
                          updatebaldata = {};
                          updatebaldata["spotwallet"] =
                            transaction[i].specification.source.maxAmount.value;
                          Assets.findOneAndUpdate(
                            { currencySymbol: "XRP", userId: ObjectId(userId) },
                            { $inc: updatebaldata },
                            { new: true, fields: { balance: 1 } },
                            function (balerr, baldata) {
                              // console.log(balerr);
                              // console.log(baldata);
                            }
                          );

                          newTransaction.save(function (err, data) {
                            var jsonfilter = { identifier: "User_deposit" };
                            Emailtemplates.findOne(
                              jsonfilter,
                              { _id: 0 },
                              function (err, templates) {
                                if (templates.content) {
                                  templateData = templates;
                                  templateData.content = templateData.content.replace(
                                    /##templateInfo_name##/g,
                                    useremail
                                  );
                                  templateData.content = templateData.content.replace(
                                    /##templateInfo_appName##/g,
                                    keys.siteName
                                  );
                                  templateData.content = templateData.content.replace(
                                    /##DATE##/g,
                                    new Date()
                                  );
                                  templateData.content = templateData.content.replace(
                                    /##AMOUNT##/g,
                                    parseFloat(amount).toFixed(8)
                                  );
                                  templateData.content = templateData.content.replace(
                                    /##TXID##/g,
                                    txid
                                  );
                                  templateData.content = templateData.content.replace(
                                    /##CURRENCY##/g,
                                    "XRP"
                                  );
                                  var smtpConfig = {
                                    host: keys.host, // Amazon email SMTP hostname
                                    auth: {
                                      user: keys.email,
                                      pass: keys.password,
                                    },
                                  };
                                  var transporter = nodemailer.createTransport(
                                    smtpConfig
                                  );

                                  var mailOptions = {
                                    from:
                                      keys.fromName +
                                      "<" +
                                      keys.fromemail +
                                      ">", // sender address
                                    to: useremail, // list of receivers
                                    subject: templateData.subject, // Subject line
                                    html: templateData.content, // html body
                                  };
                                  transporter.sendMail(mailOptions, function (
                                    error,
                                    info
                                  ) {
                                    if (error) {
                                      return console.log(error);
                                    }
                                  });
                                }
                              }
                            );
                          });
                        }
                      }
                    },
                  ],
                  function (err, transactiondetails) { }
                );
              });
          })
          .then(() => {
            return api.disconnect();
          })
          .then(() => {
            console.log("done and disconnected.");
          });
      }
    });
});

router.post("/withdrawrequest", (req, res) => {
  var withdraw_id = req.body.withdrawid;
  var updateVal = { status: "Pending" };
  Request.findByIdAndUpdate(
    { _id: mongoose.Types.ObjectId(withdraw_id) },
    updateVal,
    { new: true },
    function (err, assetupdatedata) {
      console.log(err);
      if (!err) {
        res.json({ status: true, message: "Withdraw Request Sent to admin" });
      }
    }
  );
});

router.post("/convertamount", (req, res) => {
  var inputamount = req.body.inputamount;
  var fromwallet = req.body.fromwallet.value;
  var towallet = req.body.towallet.value;
  var currency = req.body.currency;
  var userId = req.body.userId;

  if (fromwallet == towallet) {
    res.json({
      status: false,
      message: "From and to wallet should be different",
    });
  } else if (inputamount == "" || inputamount < 0 || isNaN(inputamount)) {
    res.json({ status: false, message: "Enter a valid amount" });
  } else {
    Assets.findOne({
      userId: mongoose.Types.ObjectId(userId),
      currencySymbol: currency,
    }).exec(function (err, assetdetails) {
      console.log(assetdetails, "assetdetails");
      if (assetdetails) {
        console.log(fromwallet, "fromwallet");
        var balance =
          fromwallet == "Derivatives"
            ? assetdetails.balance
            : fromwallet == "Spot"
              ? assetdetails.spotwallet
              : 0;
        console.log(balance, "balance");
        console.log(inputamount, "inputamount");
        if (balance < inputamount) {
          res.json({ status: false, message: "insuffient balance in wallet" });
        } else {
          if (fromwallet == "Derivatives") {
            var updateVal = {
              spotwallet: inputamount,
              balance: inputamount * -1,
            };
          } else if (fromwallet == "Spot") {
            var updateVal = {
              spotwallet: inputamount * -1,
              balance: inputamount,
            };
          }
          Assets.findOneAndUpdate(
            {
              userId: mongoose.Types.ObjectId(userId),
              currencySymbol: currency,
            },
            { $inc: updateVal },
            { new: true },
            function (err, assetupdatedata) {
              console.log(err, "err");
              if (!err) {
                res.json({
                  status: true,
                  message: "Wallet conversion process completed successfully",
                });
              }
            }
          );
        }
      }
    });
  }
});

router.post("/convertcurrency", (req, res) => {
  var inputamount = req.body.currencyamount;
  var fromwallet = req.body.fromcurrency.value;
  var towallet = req.body.tocurrency.value;
  var currency = req.body.currency;
  var userId = req.body.userId;

  if (fromwallet == towallet) {
    res.json({
      status: false,
      message: "From and to Currency should be different",
    });
  } else if (inputamount == "" || inputamount < 0 || isNaN(inputamount)) {
    res.json({ status: false, message: "Enter a valid amount" });
  } else {
    Assets.findOne({
      userId: mongoose.Types.ObjectId(userId),
      currencySymbol: fromwallet,
    }).exec(function (err, assetdetails) {
      console.log(assetdetails, "assetdetails");
      if (assetdetails) {
        console.log(fromwallet, "fromwallet");
        var balance =
          fromwallet == "BTC" ? assetdetails.balance : assetdetails.spotwallet;
        console.log(balance, "balance");
        console.log(inputamount, "inputamount");
        if (balance < inputamount) {
          res.json({ status: false, message: "insuffient balance in wallet" });
        } else {
          perpetual
            .findOne({ tiker_root: "BTCUSD" })
            .exec(function (pairerr, pairData) {
              if (pairData) {
                var markprice = pairData.markprice;
                if (fromwallet == "BTC") {
                  var newamnt = parseFloat(markprice) * parseFloat(inputamount);
                  var updateVal = { balance: inputamount * -1 };
                  var updateVal1 = { spotwallet: newamnt };
                } else {
                  var newamnt = parseFloat(inputamount) / parseFloat(markprice);
                  var updateVal = { balance: newamnt };
                  var updateVal1 = { spotwallet: inputamount * -1 };
                }

                Assets.findOneAndUpdate(
                  {
                    userId: mongoose.Types.ObjectId(userId),
                    currencySymbol: "BTC",
                  },
                  { $inc: updateVal },
                  { new: true },
                  function (err, assetupdatedata) {
                    console.log(err, "err");
                    if (!err) {
                      // res.json({status:true,message:"Wallet conversion process completed successfully"});
                    }
                  }
                );

                Assets.findOneAndUpdate(
                  {
                    userId: mongoose.Types.ObjectId(userId),
                    currencySymbol: "USD",
                  },
                  { $inc: updateVal1 },
                  { new: true },
                  function (err, assetupdatedata) {
                    console.log(err, "err");
                    if (!err) {
                      res.json({
                        status: true,
                        message:
                          "Wallet conversion process completed successfully",
                      });
                    }
                  }
                );
              }
            });
        }
      }
    });
  }
});

router.post("/check2fa", (req, res) => {

  // console.log("inside the two fa");
  // console.log("req.body",req.body);

  var bytes = CryptoJS.AES.decrypt(req.body.token, keys.cryptoPass);
  // console.log("bytess",bytes);
  req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));



  console.log("after the decryption", req.body);
  var reqdate = req.body.newdate


  var data1 = new Date(reqdate);
  console.log("datea1", data1);

  var data2 = new Date()
  console.log("Datate2", data2);
  var anotherdate = data2.getTime() + (1000 * 5)
  var indate = new Date(anotherdate)
  console.log("anotherdate", indate);
  if (indate > data1) {
    if (req.body.receiveraddress == "" || req.body.transferamount == "") {
      return res.json({ status: false, message: "Values should not be empty" });
    }
    var userId = mongoose.Types.ObjectId(req.body.id);
    var currencyfee = 0;
    var currencybalance = 0;
    var reducebalance = 0;
    var useremail = "";
    async.waterfall(
      [
        function (done) {
          User.findById(userId).then((user) => {
            // console.log(user);
            if (user) {
              useremail = user.email;
              var googlesecretcode = user.googlesecretcode;
              var newSecret = node2fa.verifyToken(
                googlesecretcode,
                req.body.twofa
              );
              done();
              // if (newSecret) {
              //   if (typeof newSecret.delta != 'undefined' && newSecret.delta != -1) {
              //      done();
              //   }
              // }else{
              //   return res.json({status:false,message:"Authendication Failed"})
              // }
            }
          });
        },
        function (done) {
          currency
            .findOne({ currencySymbol: req.body.cryptoType })
            .exec(function (err, currency) {
              currencyfee = currency.fee;
              done();
            });
        },
        function (done) {
          var amountToBeReduced =
            parseFloat(req.body.transferamount) + parseFloat(currencyfee);
          Assets.findOne(
            { userId: userId, currencySymbol: req.body.cryptoType },
            function (err, assetdata) {
              currencybalance =
                req.body.cryptoType == "BTC"
                  ? assetdata.spotwallet
                  : assetdata.spotwallet;
              if (currencybalance < amountToBeReduced) {
                res.json({ status: false, message: "Your balance is low" });
              } else {
                reducebalance = currencybalance - amountToBeReduced;
                done();
              }
            }
          );
        },
        function (done) {
          var updateVal = {};
          if (req.body.cryptoType == "BTC") {
            updateVal.balance = reducebalance;
          } else {
            updateVal.spotwallet = reducebalance;
          }
          Assets.findOneAndUpdate(
            { userId: userId, currencySymbol: req.body.cryptoType },
            updateVal,
            { new: true },
            function (err, assetupdatedata) {
              const newRequest = new Request({
                tagid: req.body.tagid,
                requestType: req.body.requestType,
                receiverCryptoAddress: req.body.receiverCryptoAddress,
                receiveraddress: mongoose.Types.ObjectId(
                  req.body.receiveraddress
                ),
                userId: userId,
                finalamount: req.body.finalamount,
                cryptoType: req.body.cryptoType,
                transferamount: req.body.transferamount,
                status: "Mail",
              });
              newRequest.save(function (err, data) {
                if (err) {
                  return res.status(400).json({
                    message: "some error occurred",
                  });
                } else {
                  //Mail Send to User with confirmation Link
                  var jsonfilter = {
                    identifier: "withdraw_request",
                  };
                  var logo = keys.baseUrl + "Logo-small.png";
                  Emailtemplates.findOne(
                    jsonfilter,
                    {
                      _id: 0,
                    },
                    function (err, templates) {
                      if (templates) {
                        if (templates.content) {
                          templateData = templates;
                          templateData.content = templateData.content.replace(
                            /##templateInfo_name##/g,
                            useremail
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_appName##/g,
                            keys.siteName
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_logo##/g,
                            logo
                          );
                          var link_html = keys.frontUrl + "Withdraw/" + data._id;
                          templateData.content = templateData.content.replace(
                            /##templateInfo_url##/g,
                            link_html
                          );
                          done();
                        }
                      }
                    }
                  );
                }
              });
            }
          );
        },
        function (done) {
          var smtpConfig = {
            host: keys.host, // Amazon email SMTP hostname
            auth: {
              user: keys.email,
              pass: keys.password,
            },
          };
          var transporter = nodemailer.createTransport(smtpConfig);
          var mailOptions = {
            from: keys.fromName + "<" + keys.fromemail + ">", // sender address
            to: useremail, // list of receivers
            subject: templateData.subject, // Subject line
            html: templateData.content, // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              return console.log(error);
            }
          });
          res.json({
            status: true,
            message: "Check your mailbox. Confirmation mail sent",
          });
        },
      ],
      function (err) { }
    );
  }
  else {
    res.json({ status: false, message: "INVALID Request" });
  }



});

router.get("/getaddress/:id", (req, res) => {
  var userId = mongoose.Types.ObjectId(req.params.id);
  Address.find({ userId: userId }, function (err, addressdetails) {
    res.json({ status: true, data: addressdetails });
  });
});

router.post("/addAddress", (req, res) => {
  var address = new Address(req.body);
  address.save().then((addressDetails) => {
    res.json({
      status: true,
      data: addressDetails,
      message: "Address Added Successfully",
    });
  });
});

router.get("/getcurrency", (req, res) => {
  currency.find({}, function (err, currencydetails) {
    res.json({ status: true, data: currencydetails });
  });
});

router.post("/withdrawalhistory/", (req, res) => {
  Request.find({ userId: ObjectId(req.body.userid), /* status: { $ne: "Mail" } */ })
    .populate("receiveraddress")
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "withdrawalhistory" });
      }
    });
});

router.post("/cancelwithdraw/", (req, res) => {
  var updateVal = {};
  updateVal.status = "Cancelled";
  Request.findOneAndUpdate(
    { _id: ObjectId(req.body.withdrawid), status: "Pending" },
    updateVal,
    { new: true },
    async function (err, addressdata) {
      await Assets.updateOne(
        {
          "userId": addressdata.userId,
          'currencySymbol': addressdata.cryptoType
        },
        {
          "$inc": {
            'spotwallet': addressdata.finalamount
          }
        }
      )
      return res.status(200).json({
        status: true,
        message: "Request cancelled successfully",
        type: "cancelwithdraw",
      });
    }
  );
});

router.post("/searchwithdraw-history/", (req, res) => {
  console.log("req.body", req.body);
  var userid = req.body.userid;
  var contract = req.body.contract;
  var type = req.body.type;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var match = {};
  match["userId"] = userid;
  // match['status'] = { $ne: "Mail" }
  if (contract != "All") {
    match["cryptoType"] = contract;
  }
  if (type != "All") {
    match["status"] = type;
  }
  if (startDate != "" && endDate != "") {
    match["created_date"] = { $gte: startDate, $lte: endDate };
  } else if (startDate != "") {
    match["created_date"] = { $gte: startDate };
  } else if (endDate != "") {
    match["created_date"] = { $lte: endDate };
  }
  Request.find(match).populate("receiveraddress")
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        return res
          .status(200)
          .json({ status: true, data: result, type: "withdrawalhistory" });
      }
    });
});

router.post("/deleteaddress", (req, res) => {
  var id = mongoose.Types.ObjectId(req.body.id);
  Address.deleteOne({
    _id: id,
  }).then((address) => {
    if (address) {
      return res.status(200).json({
        message: "Address deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});


// ETH USER DEPOSIT CRON
cron.schedule('*/30 * * * * *', function () {
  // ethAddress()
})

function ethAddress() {
  currency.findOne({ currencySymbol: 'ETH' }, { block: 1 }, function (err, response) {
    var max_blocknumber = response.block;
    let url = keys.ethereum.etherScanUrl
    url = url.replace(/##ETHERSCANTYPE##/g, keys.ethereum.etherScanType);

    let object = {
      apikey: keys.ethereum.apikey,
      module: keys.ethereum.module,
      action: 'eth_blockNumber',
    }

    const stringified = queryString.stringify(object);


    https.get(url + stringified, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        var responseTxn = JSON.parse(data);
        console.log("-----responseTxn", responseTxn);
        console.log("-------etherdeposit", responseTxn);
        if (responseTxn.result != null) {
          var count = converter.hexToDec(responseTxn.result);
          console.log("-------count", count);
          console.log("-----------max_blocknumber", max_blocknumber);
          if (max_blocknumber < count) {
            transactions = [];
            // getETHTransactionETHList(count, max_blocknumber)
            getETHTransactionETHList(max_blocknumber, count)
            // get_all_eth_transactions(count, max_blocknumber);
          }
        }
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  })
}

const getETHTransactionETHList = (inc, to) => {
  //console.log("-----inc <= to", inc, to, inc <= to)
  // if (inc <= to) {

  if (inc <= to) {
    //  console.log(inc+"===="+to);
    var blknum = converter.decToHex(inc.toString());

    //console.log("------blknum---9456677", inc, blknum)
    let url = keys.ethereum.etherScanUrl
    url = url.replace(/##ETHERSCANTYPE##/g, keys.ethereum.etherScanType);

    let object = {
      apikey: keys.ethereum.apikey,
      module: keys.ethereum.module,
      action: 'eth_getBlockByNumber',
      tag: blknum,
      boolean: keys.ethereum.boolean
    }

    const stringified = queryString.stringify(object);

    https.get(url + stringified, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          var responseTxn = JSON.parse(data);

          if (responseTxn.result.transactions.length > 0) {
            Array.prototype.push.apply(transactions, responseTxn.result.transactions);
            var inc2 = inc + 1;
            // getETHTransactionETHList(to, inc2)
            getETHTransactionETHList(inc2, to)
          }
          else {
            var inc2 = inc + 1;
            // getETHTransactionETHList(to, inc2)
            getETHTransactionETHList(inc2, to)

          }
        }
        catch (err) {
          var inc2 = inc + 1;
          // getETHTransactionETHList(to, inc2)
          getETHTransactionETHList(inc2, to)
        }
      });
    }).on("error", (err) => {
      var inc2 = inc + 1;
      // getETHTransactionETHList(to, inc2)
      getETHTransactionETHList(inc2, to)
      console.log("Error: " + err.message);
    });
  }
  else {
    // console.log("-----transactions", transactions)
    return UpdateDeposit_ETH_ERC20(transactions, to);
  }
}

// ETH_ERC20 BALANCE UPDATION
async function UpdateDeposit_ETH_ERC20(response, blockCnt) {
  let currencyData = await Currency.find({
    "$or": [
      {
        'currencySymbol': 'ETH'
      },
      {
        'type': 'Token'
      }
    ]
  })
  if (currencyData && currencyData.length > 0) {
    if (response) {
      let count = 0
      for (let item of response) {
        count = count + 1
        // Check ERC 20 TOKEN ADDRESS
        console.log("-----item.contractAddress", item.contractAddress)
        if (item.contractAddress) {
          let checkContractAddress = currencyData.find((el => { return el.contractAddress.toUpperCase() == item.contractAddress.toUpperCase() }))
          if (checkContractAddress) {
            let currencyData = checkContractAddress;
            await ethTokenUpdate(item, currencyData)
          }
        } else {
          console.log("-------else00000____item")
          let checkContractAddress = currencyData.find((el => { return el.currencySymbol == 'ETH' }))
          await ERCBalanceUpdate(item, checkContractAddress)
        }

        if (response.length == count) {
          await Currency.update({ currencySymbol: 'ETH' }, { "$set": { 'block': blockCnt } })
        }

      }
    }
  }
}

async function ethTokenUpdate(transactionsData, currencyData) {
  if (!transactionsData.to) {
    console.log("----ERCBalanceUpdate")
    return
  }
  let userAssetData = await Assets.findOne({ currencyAddress: { '$regex': new RegExp('.*' + transactionsData.to.toLowerCase() + '.*', 'i') } }).populate({ path: "userId", select: "email _id" })

  if (userAssetData) {
    if (userAssetData.currencyAddress.toUpperCase() != keys.ethaddress.toUpperCase()) {
      const slashminabii = JSON.parse(currencyData.minABI);
      const curminabi = slashminabii.replace(/\\|\//g, '')

      token_move_to_admin(
        userAssetData.currencyAddress,
        userAssetData.privateKey,
        keys.ethaddress,
        userAssetData.currencyAddress,
        userAssetData.userId._id,
        currencyData.decimals,
        curminabi,
        currencyData.contractAddress
      );
    }

    let checkTransactionData = await Transaction.findOne({
      user_id: userAssetData.userId._id, txid: transactionsData.hash,
    })

    if (checkTransactionData) {
      return
    }

    if (transactionsData.tokenDecimal == "1") {
      var recamount = transactionsData.value / 10;
    } else if (transactionsData.tokenDecimal == "6") {
      var recamount = transactionsData.value / 1000000;
    }
    else if (transactionsData.tokenDecimal == "8") {
      var recamount = transactionsData.value / 100000000;
    }

    var currencyfromrespone;
    if (transactionsData.tokenSymbol == "????PC") {
      currencyfromrespone = "💲PC"
    } else {
      currencyfromrespone = transactionsData.tokenSymbol
    }

    var transactions = new Transaction();
    transactions["user_id"] = userAssetData.userId._id;
    transactions["currency"] = currencyfromrespone;
    transactions["transferType"] = "TOUSER";
    transactions["toaddress"] = transactionsData.to;
    transactions["fromaddress"] = transactionsData.from;
    transactions["amount"] = recamount;
    transactions["txid"] = transactionsData.hash;

    var incdata = {};
    incdata["spotwallet"] = recamount;
    await transactions.save()

    await Assets.findOneAndUpdate(
      { '_id': userAssetData._id },
      { $inc: incdata },
      { new: true, fields: { balance: 1 } },
    );
    return
  } else {
    return
  }
}

async function ERCBalanceUpdate(transactionsData, currencyData) {
  if (!transactionsData.to) {
    // console.log("----ERCBalanceUpdate")
    return
  }
  //console.log("----transactionsData.to", transactionsData.to)

  let userAssetData = await Assets.findOne({ currencyAddress: { '$regex': new RegExp('.*' + transactionsData.to.toLowerCase() + '.*', 'i') } }).populate({ path: "userId", select: "email _id" })
  //console.log("----userAssetData-----", userAssetData)
  if (userAssetData) {
    var header = { "Content-Type": "application/json" };
    var args = {
      ethaddress: userAssetData.currencyAddress,
      type: "getbalance"
    };
    const options = {
      url: ethconfigurl + "/ethnode",
      method: "POST",
      headers: header,
      data: args
    };

    //console.log("----options", options)


    let respData = await axios(options);
    //console.log("-----respData", respData)

    if (respData && respData.data) {

      if (userAssetData.currencyAddress.toUpperCase() != keys.ethaddress.toUpperCase()) {
        let adminAssetData = await Assets.findOne({ currencyAddress: { '$regex': new RegExp('.*' + keys.ethaddress.toLowerCase() + '.*', 'i') } })

        var adminAddresses = { ETH: "", BTC: "", BCH: "", LTC: "", XRP: "" };
        var adminBalances = { ETH: "", BTC: "", BCH: "", LTC: "", XRP: "" };
        adminAddresses['ETH'] = adminAssetData.currencyAddress
        adminBalances['ETH'] = adminAssetData.balance

        // amount move to Admin
        console.log("---currencyData", currencyData)
        amount_move_to_admin(
          userAssetData.currencyAddress,
          userAssetData.privateKey,
          adminAddresses,
          '',
          userAssetData.userId._id,
          adminBalances
        );

      }

      var balance = respData.data;
      // var balance = 10;
      balance = balance.result;
      console.log(balance, "balance");
      console.log(roundToTwo(balance), "balance");
      if (balance > 0) {

        let checkTransactionData = await Transaction.findOne({
          user_id: userAssetData.userId._id, txid: transactionsData.hash,
        })

        console.log("----checkTransactionData", checkTransactionData)

        if (checkTransactionData) {
          return
        }

        let recamount = web3.utils.fromWei(transactionsData.value, "ether");
        let transactions = new Transaction();
        transactions["user_id"] = userAssetData.userId._id;
        transactions["currency"] = "ETH";
        transactions["transferType"] = "TOUSER";
        transactions["toaddress"] = transactionsData.to;
        transactions["fromaddress"] = transactionsData.from;
        transactions["amount"] = recamount;
        transactions["txid"] = transactionsData.hash;

        let newTransactions = await transactions.save();
        console.log("----newTransactions", newTransactions)

        let updatebaldata = {};
        updatebaldata["spotwallet"] = recamount;
        let updateAssets = await Assets.findOneAndUpdate(
          {
            "_id": userAssetData._id
          },
          { $inc: updatebaldata },
          { new: true, fields: { balance: 1 } }
        );
        console.log("----updateAssets", updateAssets)
      } else {
        return
      }
    } else {
      return
    }
  } else {
    return
  }

}

module.exports = router;
