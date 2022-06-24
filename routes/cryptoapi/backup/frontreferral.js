const express = require('express');
const router = express.Router();
const async = require("async");
const {
    ObjectId
} = require('mongodb');
var crypto = require("crypto");
const user = require('../../models/User');
const ReferTable = require('../../models/Referencetable')
const FeeTable = require('../../models/FeeTable')
const AssetsExchange = require('../../models/AssetExchange')
const CurrencyTable = require('../../models/currency')
const Assets = require('../../models/Assets')
const rp = require('request-promise')
const AssetHistory = require('../../models/AssetExchangeHistory')







router.post('/getTableDataDynamic', (req, res) => {
    var tablename = req.body.table.name;
    var returnname = req.body.return.name;
    var find = req.body.find;
    // console.log("Find in get table datadynamic", find);

    // console.log("table name", tablename);
    // console.log("returnname", returnname)
    if (tablename == 'users') {
        var findtable = User
    } else if (tablename == 'FeeTable') {
        var findtable = FeeTable;
        find = {};
    }
    if (typeof find._id != 'undefined') {
        find._id = ObjectId(find._id)
    }
    findtable.find(find).then(result => {
        if (!result) {
            return res.status(404).json({
                email: 'Email not found'
            });
        }
        var ret = {};
        if (returnname == 'loginuserdata') {
            ret.loginuserdata = result[0];

        } else if (returnname == 'referraldata') {
            ret.referraldata = result;

        } else if (returnname == 'Feedata') {
            ret.Feedata = result[0];
        }
        // console.log('ret');
        // console.log(ret);
        res.json(ret);
    })
})


router.post('/getAssetExchangeData', (req, res) => {
    console.log("inside the getAssetExchangeData")
    var tablename = req.body.table.name;
    var returnname = req.body.return.name;
    var find = req.body.find;
    console.log("bodyy ===>", req.body)

    console.log("tablename=>", tablename)
    console.log("returnname=>", returnname)
    console.log("find=>", find)
    AssetsExchange.find().then(result => {
        console.log("Result asset data", result)
        if (!result) {
            return res.status(404).json({
                email: 'Data not found'
            });
        } else {
            var ret = {};
            ret.AssetsExchangedata = result;
            res.json(ret);
        }


    })
})

router.post('/getCurrencyData', (req, res) => {
    console.log("Inside the get currency data")
    CurrencyTable.find().then(result => {
        if (!result) {
            return res.status(404).json({
                email: 'Data not found'
            });
        } else {
            var ret = {};
            ret.CurrencyTableData = result;
            res.json(ret);
        }
    })

})


router.post('/asset-exchange-history', (req, res) => {
    console.log("Inside the get asset-exchange-history ", req.body.find)
    var find = req.body.find
    console.log("Find =============",find)
    AssetHistory.find(find).then(result => {
        if (!result) {
            return res.status(404).json({
                email: 'Data not found'
            });
        } else {
            var userid = req.body.find.userId
            console.log("useridd ",userid)
            // console.log("REsult of history", result)
            var sample ={
                userId:userid,
                time: {
                    $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
            console.log("Sampolee",sample)
            AssetHistory.find({
                userId:userid,
                time: {
                    $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }).then(pasthistory => {
                console.log("REsult of 24 hours ",pasthistory)
                var ret = {};
                ret.AssetHistory = result;
                ret.pasthistory = pasthistory;
             
    
                res.json(ret);
            })
         
        }
    })

})




router.post('/getAssetData', (req, res) => {
    console.log("Inside the Get asset data")
    console.log("Inside Req.body", req.body)
    var find = req.body.find;
    console.log("Find", find)

    Assets.find(find).then(result => {
        console.log("Asset table data ", result)
        if (!result) {
            return res.status(404).json({
                email: 'Data not found'
            });
        } else {

            var ret = {};
            ret.AssetTableData = result;
            res.json(ret);
        }
    })


})



function getlivedata(from, to) {

    return rp({
        url: 'https://min-api.cryptocompare.com/data/price?fsym=' + from + '&tsyms=' + to,
        method: 'GET',
        json: true
    })

}


router.post('/LivePricedata', async (req, res) => {
    console.log("Inside the live price data")
    console.log("body in live price data", req.body)
    var from = req.body.find.from;
    var to = req.body.find.to;
    if (from == "" || to == "") {
        var liveprice = 0
    } else {
        var livedata = await getlivedata(from, to)
        console.log("livedatataat ", {
            val: livedata[to]
        })
        var liveprice = livedata[to]

    }
    res.json({
        val: liveprice
    })
})


router.post('/convertnow', (req, res) => {
    console.log("Inside route convertnow", req.body)
    console.log("from convertnow", req.body.from_coin)
    console.log("to convertnow", req.body.to_coin)
    var userid = req.body.userid;
    var fromcoin = req.body.from_coin;
    var tocoin = req.body.to_coin;
    var inputamount = req.body.inputamount;
    var receivingamount = req.body.receivingamount;
    async.waterfall([

        function (done) {
            Assets.findOne({
                userId: userid,
                currencySymbol: fromcoin
            }).exec(function (err, result) {
                if (err) {
                    console.log("Error in finding asset", err)
                    done();
                } else {
                    console.log("REssult of asset table find", result)
                    var prevbalance = result.balance;
                    var currbalance = prevbalance - inputamount;
                    Assets.findOneAndUpdate({
                        userId: userid,
                        currencySymbol: fromcoin
                    }, {
                        "$set": {
                            "balance": currbalance
                        }
                    }, {
                        new: true
                    }, function (err, updated) {
                        if (err) {
                            console.log("Error in updating", err)
                        } else {
                            console.log("updated new subtracted result", updated)
                            done();
                        }
                    })
                }
            })
        },
        function (done) {
            Assets.findOne({
                userId: userid,
                currencySymbol: tocoin
            }).exec(function (err, result) {
                if (err) {
                    console.log("Error in finding asset", err)
                    done();
                } else {
                    console.log("REssult of asset table addition find", result)
                    var prevbalance = result.balance;
                    var currbalance = prevbalance - -inputamount;
                    Assets.findOneAndUpdate({
                        userId: userid,
                        currencySymbol: tocoin
                    }, {
                        "$set": {
                            "balance": currbalance
                        }
                    }, {
                        new: true
                    }, function (err, updated) {
                        if (err) {
                            console.log("Error in updating", err)
                        } else {
                            console.log("updated new balance added result", updated)
                            done();
                        }
                    })
                }
            })
        },
        function (done) {
            var transactionid = crypto.randomBytes(20).toString('hex');
            console.log("TransactionId", transactionid);
            const assetexchangehistory = new AssetHistory({
                from_coin: fromcoin,
                to_coin: tocoin,
                input_amount: inputamount,
                receiving_amount: receivingamount,
                transaction_id: transactionid,
                userId: userid

            })
            assetexchangehistory.save().then(historyresult => {
                console.log("historyresult added", historyresult)

                if (historyresult) {
                    return res.status(200).json({
                        convertnow: "success",
                        message: 'Activation mail sent. Check your Registed email then activate'
                    })
                } else {
                    return res.status(200).json({
                        convertnow: "error",
                        message: 'Error at exchange convert'
                    })
                }

                done();
            })

        }

    ], function (err) {
        console.log("ereer", err)
    });




})






module.exports = router;