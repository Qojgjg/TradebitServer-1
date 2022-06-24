// import package
import mongoose from 'mongoose'
import lodash from 'lodash';

// import modal
import Assets from '../models/Assets';
import User from '../models/User';
import Currency from '../models/currency';
// import User from '../modals/user';
// import SpotPairs from '../modals/spotPairs';

// import controller
import * as ethGateway from './coin/ethGateway'
import * as btcGateway from './coin/btcGateway';
import * as ltcGateway from './coin/ltcGateway';
import * as dogeGateway from './coin/dogeGateway';
import * as bnbGateway from './coin/bnbGateway';
import * as tronGateway from './coin/tronGateway';
import * as xrpGateway from './coin/xrpGateway';
import * as coinpaymentGateway from './coin/coinpaymentGateway';
// import { updateRecoverySpotBalance } from './trade.controller';

// import config
import config from '../config';

// import lib
import isEmpty from '../lib/isEmpty';
import roundOf from '../lib/roundOf';
import { encryptString, decryptString } from '../lib/cryptoJS'


const ObjectId = mongoose.Types.ObjectId;

/** 
 * Get User Assets Details
 * URL: /api/getAssetsDetails
 * METHOD : GET
*/
export const getAssetsDetails = async (req, res) => {
    try {
        let newDoc = []
        // let userAssetsData = await Assets.find({ 'userId': req.user.id }).populate("currency");
        let userAssetsData = await Assets.aggregate([
            { "$match": { 'userId': ObjectId(req.user.id) } },

            {
                "$lookup":
                {
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
                    "let": {
                        "currencyId": '$currency'
                    },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ['$_id', '$$currencyId']
                                }
                            }
                        },
                        {
                            "$project": {
                                '_id': 1,
                                'currencyName': 1,
                                'currencySymbol': 1,
                                'type': 1,
                                'tokenType': 1,
                                'withdrawFee': 1,
                                'minimumWithdraw': 1,
                                'currencyImage': 1,
                                // 'currencyImage': {
                                //     "$cond": [
                                //         { "$eq": ['$currencyimage', ''] },
                                //         "",
                                //         { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$currencyimage"] }
                                //     ]
                                // },
                                'bankDetails': 1
                            }
                        }
                    ],
                    "as": "currencyInfo"
                }
            },
            { "$unwind": "$currencyInfo" },
            {
                "$project": {
                    '_id': 1,
                    'userId': 1,
                    'currencyAddress': 1,
                    'derivativeWallet': 1,
                    'spotwallet': 1,
                    "tokenType":1,
                    'p2pwallet':1,
                    'p2pbalance':1,
                    'dest_tag': 1,
                    'currency': "$currencyInfo",
                    'email': "$userInfo.email"
                }
            }
        ])

        if (userAssetsData && userAssetsData.length > 0) {
            let createAddressDoc = userAssetsData.filter((el) => el.currencyAddress == '')
            if (createAddressDoc && createAddressDoc.length > 0) {
                for (let item of createAddressDoc) {
                    if (item.currency.type == 'crypto') {
                        if (item.currency.currencySymbol == 'ETH') {
                            let ethResp = await ethGateway.createAddress()
                
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': ethResp.address,
                                        'privateKey': encryptString(ethResp.privateKey),
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                        } else if(item.currency.currencySymbol == 'BNB') {
                            let bnbResp = await bnbGateway.createAddress()   
                            
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress':bnbResp.address,
                                        'privateKey': encryptString(bnbResp.privateKey),
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                                                 
                        } else if(item.currency.currencySymbol == 'TRX') {
                            let tronResp = await tronGateway.createAddress()   
                            
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress':tronResp.address,
                                        'privateKey': encryptString(tronResp.privateKey),
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                                                 
                        } else if (item.currency.currencySymbol == 'BTC') {
                            let reqData = {
                                'email': item.email
                            }
                            
                            let btcResp = await btcGateway.createAddress(reqData)
                           
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': btcResp.address,
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                        } else if(item.currency.currencySymbol == 'DOGE'){
                            let reqData = {
                                'email': item.email
                            }

                            let dogeResp = await dogeGateway.createAddress(reqData);
                           // console.log(dogeResp,'--------dogeResp')
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': dogeResp.address,
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                        } else if(item.currency.currencySymbol == 'LTC'){
                            let reqData = {
                                'email': item.email
                            }

                            let ltcResp = await ltcGateway.createAddress(reqData);
                           // console.log(dogeResp,'--------dogeResp')
                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': ltcResp.address,
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                        } else if (item.currency.currencySymbol == 'XRP') {
                            let xrpResp = await xrpGateway.createAddress();

                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': xrpResp.address,
                                        'dest_tag': xrpResp.dest_tag,
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item)
                        }
                    } else if (item.currency.type == 'token') {
                        /**
                         * ERC Tokens
                         */
                        if (item.currency.tokenType == "erc20") { // Erc20 Token

                            let ethResp = await ethGateway.createAddress()

                                await Assets.updateOne(
                                    { "_id": item._id },
                                    {
                                        "$set": {
                                            'currencyAddress': ethResp.address,
                                            'privateKey': encryptString(ethResp.privateKey),
                                            'currencySymbol': item.currency.currencySymbol,
                                        }
                                    }
                                )
                            newDoc.push(item);
                        }

                        /**
                         * TRC Tokens
                         */
                        if (item.currency.tokenType == "trc20") { // Trc20 Token

                            let tronResp = await tronGateway.createAddress();

                                await Assets.updateOne(
                                    { "_id": item._id },
                                    {
                                        "$set": {
                                            'currencyAddress': tronResp.address,
                                            'privateKey': encryptString(tronResp.privateKey),
                                            'currencySymbol': item.currency.currencySymbol,
                                        }
                                    }
                                )
                            newDoc.push(item);
                        }

                        /**
                         * BEP Tokens
                         */
                        if (item.currency.tokenType == "bep20") { // Bep20 Token

                            let bnbResp = await bnbGateway.createAddress()

                            await Assets.updateOne(
                                { "_id": item._id },
                                {
                                    "$set": {
                                        'currencyAddress': bnbResp.address,
                                        'privateKey': encryptString(bnbResp.privateKey),
                                        'currencySymbol': item.currency.currencySymbol,
                                    }
                                }
                            )
                            newDoc.push(item);
                        }
                    } else if (item.type == 'fiat') {
                        await Assets.updateOne(
                            { "_id": item._id },
                            {
                                "$set": {
                                    'currencyAddress': item._id,
                                    'currencySymbol': item.currency.currencySymbol,
                                }
                            }
                        )
                    }
                }
            }
            let result = lodash.unionBy(newDoc, userAssetsData, "_id");
            // console.log("Result----",result)
            return res.status(200).json({ 'success': true, 'messages': "successfully", result })
        }

        return res.status(400).json({ 'success': false })
    }
    catch (err) {
        console.log(err,'---err')
        return res.status(500).json({ 'success': false })
    }
}


/** 
 * Get Asset By Curreny
 * METHOD: GET
 * URL : /api/asset/:currencyId
*/
export const getAssetByCurrency = async (req, res) => {
    try {
        Assets.findOne(
            {
                "userId": req.user.id,
                "currency": req.params.currencyId
            },
            {
                "_id": 1,
                "spotwallet": 1,
                "derivativeWallet": 1,
                'currencyId': "$currency",
            },
            (err, assetData) => {
                if (err) { return res.status(500).json({ 'status': false, 'message': "Error occured" }); }
                return res.status(200).json({ 'success': true, 'messages': "success", 'result': assetData })
            }
        )
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}

/** 
 * Create Asset at Signup
*/

export const createUserAsset = async (userData) => {
    try {
        console.log("Inside Asset creation")
        let userAssetDoc = [];
        let currencyData = await Currency.find();
        // console.log("currencyData---",currencyData)
        if (currencyData && currencyData.length > 0) {
          
            for (let item of currencyData) {

                if (item.type == 'crypto') {
                    if (item.currencySymbol == 'ETH') {

                        let ethResp = await ethGateway.createAddress();

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': ethResp.address,
                            'privateKey': encryptString(ethResp.privateKey), //orginal
                        })
                    } else if (item.currencySymbol == 'BNB') {

                        let bnbResp = await bnbGateway.createAddress();

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': bnbResp.address,
                            'privateKey': encryptString(bnbResp.privateKey), //orginal
                        })
                    } else if (item.currencySymbol == 'TRX') {

                        let tronResp = await tronGateway.createAddress();

                        userAssetDoc.push({

                            'currencySymbol': item.currencySymbol,
                            "userId": userData._id,
                            "currency": item._id,
                            'currencyAddress': tronResp.address,
                            'privateKey': encryptString(tronResp.privateKey),
                        })
                    } else if (item.currencySymbol == 'BTC') {

                        let reqData = {
                            'email': userData.email
                        }

                        let btcResp = await btcGateway.createAddress(reqData);

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': btcResp.address, // btcResp.address,
                            'privateKey': '',
                        })
                    } else if (item.currencySymbol == "LTC") {

                        let reqData = {
                            'email': userData.email
                        }

                        let ltcResp = await ltcGateway.createAddress(reqData);

                        userAssetDoc.push({
                            'currencySymbol': item.currencySymbol,
                            "userId": userData._id,
                            "currency": item._id,
                            'currencyAddress': ltcResp.address, // ltcResp.address
                            'privateKey': ''
                        })
                    } else if (item.currencySymbol == "DOGE") {

                        let reqData = {
                            'email': userData.email
                        }

                        let dogeResp = await dogeGateway.createAddress(reqData);

                        userAssetDoc.push({
                            'currencySymbol': item.currencySymbol,
                            "userId": userData._id,
                            "currency": item._id,
                            'currencyAddress': dogeResp.address, // dogeResp.address
                            'privateKey': ''
                        })
                    } else if (item.currencySymbol == "XRP") {
                        // console.log("XRP eneterrrrrrrr")

                        let xrpResp = await xrpGateway.createAddress();

                        userAssetDoc.push({
                            'currencySymbol': item.currencySymbol,
                            "userId": userData._id,
                            "currency": item._id,
                            'currencyAddress': xrpResp.address,
                            'privateKey': '',
                            'dest_tag': xrpResp.dest_tag, //original
                        })
                    }
                } else if (item.type == 'token') {
                    /**
                     * ERC Tokens
                     */
                    if (item.tokenType == "erc20") { // Erc20 Token

                        let ethResp = await ethGateway.createAddress()

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': ethResp.address,
                            'privateKey': encryptString(ethResp.privateKey)
                        })
                    }

                    /**
                     * TRC Tokens
                     */
                    if (item.tokenType == "trc20") { // Trc20 Token

                        let tronResp = await tronGateway.createAddress();

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': tronResp.address,
                            'privateKey': encryptString(tronResp.privateKey),
                        })
                    }

                    /**
                     * BEP Tokens
                     */
                    if (item.tokenType == "bep20") { // Bep20 Token
                    
                        let bnbResp = await bnbGateway.createAddress()

                        userAssetDoc.push({
                            "userId": userData._id,
                            "currency": item._id,
                            "currencySymbol": item.currencySymbol,
                            'currencyAddress': bnbResp.address,
                            'privateKey': encryptString(bnbResp.privateKey),
                        })
                        
                    }
                } else if (item.type == 'fiat') {
                    let id = new ObjectId();
                    userAssetDoc.push({
                        "_id": id,
                        "userId": userData._id,
                        "currency": item._id,
                        "currencySymbol": item.currencySymbol,
                        'currencyAddress': id,
                        'privateKey': '',
                    })
                }
            }
        }
       console.log(userAssetDoc,'---userAssetDoc')
        if (userAssetDoc.length > 0) {
            await Assets.create(userAssetDoc);
            console.log("Assetadded successfully")
            return
        } else {
            return
        }
    } catch (err) {
        console.log(err,'ERROR')
        return
    }
}

/**
 * Create Asset at new currency
*/
export const createAssetAtAddCurrency = async (currencyData) => {
    try {
        let userData = await User.aggregate([
            {
                "$project": {
                    '_id': 0,
                    "userId": '$_id',
                    "currency": currencyData._id,
                    "currencySymbol": currencyData.currencySymbol
                }
            }
        ])

        await Assets.create(userData);
        return
    } catch (err) {
        return
    }
}

// export const calculateTradeFee = ({ percentage, price }) => {
//     let finalPrice = 0;
//     if (!isEmpty(percentage) && !isEmpty(price)) {
//         finalPrice = price - (price * (percentage / 100))
//     }
//     return roundOf(finalPrice)
// }

/**
 * Update User Asset at Trade Match
 * PARAMS: userId, pairId, buyorsell(sell,buy), price, filledQuantity, type(maker,taker)
*/
// export const updateSpotBalance = async (tradeData) => {
//     try {
//         let spotPairData = await SpotPairs.findOne({ '_id': tradeData.pairId })
//         if (spotPairData) {
//             let percentage = 0;
//             if (tradeData.type == 'maker') {
//                 percentage = spotPairData.maker_rebate
//             } else if (tradeData.type == 'taker') {
//                 percentage = spotPairData.taker_fees
//             }

//             if (tradeData.buyorsell == 'sell') {

//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.secondCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": calculateTradeFee({
//                                 percentage,
//                                 'price': parseFloat(tradeData.price) * parseFloat(tradeData.filledQuantity)
//                             })
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.secondCurrencyId,
//                     'balance': parseFloat(tradeData.price) * parseFloat(tradeData.filledQuantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'secondCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             } else if (tradeData.buyorsell == 'buy') {
//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.firstCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": calculateTradeFee({ percentage, 'price': tradeData.filledQuantity })
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.firstCurrencyId,
//                     'balance': tradeData.filledQuantity,
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'firstCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)
//             }
//             // firstCurrency
//         }
//     } catch (err) {
//         console.log("Error on Update Spot Balance")
//         return
//     }
// }

/**
 * Update User Asset at Cancel Order
 * PARAMS: userId, pairId, buyorsell(sell,buy), price, quantity
*/
// export const updateBalance = async (tradeData) => {
//     try {
//         let spotPairData = await SpotPairs.findOne({ '_id': tradeData.pairId })
//         if (spotPairData) {
//             if (tradeData.buyorsell == 'buy') {
//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.secondCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": parseFloat(tradeData.price) * parseFloat(tradeData.quantity)
//                         }
//                     },
//                     { "new": true }

//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.firstCurrencyId,
//                     'balance': parseFloat(tradeData.quantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'secondCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             } else if (tradeData.buyorsell == 'sell') {

//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.firstCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": parseFloat(tradeData.quantity)
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.secondCurrencyId,
//                     'balance': parseFloat(tradeData.price) * parseFloat(tradeData.quantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'firstCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             }
//             // firstCurrency
//         }
//     } catch (err) {
//         console.log("Error on Update Balance")
//         return
//     }
// }

/**
 * User Asset Chart
 * METHOD : GET
 * URL : /api/getUserAsset/:currencyType
 * PARAMS: currencyType
*/
// export const getUserAsset = async (req, res) => {

//     try {
//         let cryptoData = await Assets.aggregate([
//             { "$match": { 'userId': ObjectId(req.user.id) } },
//             {
//                 "$lookup": {
//                     "from": 'currency',
//                     "localField": "currency",
//                     "foreignField": "_id",
//                     "as": "currencyInfo"
//                 }
//             },
//             { "$unwind": "$currencyInfo" },
//             {
//                 "$match": {
//                     "$or": [
//                         { "currencyInfo.type": "crypto" },
//                         { "currencyInfo.type": "token" }
//                     ]
//                 }
//             },
//             { "$limit": 5 },
//             {
//                 "$project": {
//                     "currencyName": "$currencyInfo.currencyName",
//                     "currencySymbol": "$currencyInfo.currencySymbol",
//                     'currencyimage': {
//                         "$cond": [
//                             { "$eq": ['$currencyimage', ''] },
//                             "",
//                             { "$concat": [config.IMAGE_URL, config.image.currencyUrlPath, "$currencyimage"] }
//                         ]
//                     },
//                     'y': "$spotwallet",
//                     'spotwallet': 1,
//                 }
//             }
//         ])

//         let fiatData = await Assets.aggregate([
//             { "$match": { 'userId': ObjectId(req.user.id) } },
//             {
//                 "$lookup": {
//                     "from": 'currency',
//                     "localField": "currency",
//                     "foreignField": "_id",
//                     "as": "currencyInfo"
//                 }
//             },
//             { "$unwind": "$currencyInfo" },
//             {
//                 "$match": {
//                     "currencyInfo.type": "fiat"
//                 }
//             },
//             { "$limit": 5 },
//             {
//                 "$project": {
//                     "currencyName": "$currencyInfo.currencyName",
//                     "currencySymbol": "$currencyInfo.currencySymbol",
//                     'currencyimage': {
//                         "$cond": [
//                             { "$eq": ['$currencyimage', ''] },
//                             "",
//                             { "$concat": [config.IMAGE_URL, config.image.currencyUrlPath, "$currencyimage"] }
//                         ]
//                     },
//                     'y': "$spotwallet",
//                     'spotwallet': 1,
//                 }
//             }
//         ])

//         let result = {
//             cryptoData,
//             fiatData
//         }

//         return res.status(200).json({ 'success': true, 'result': result })
//     } catch (err) {
//         return res.status(500).json({ 'success': false })
//     }
// }