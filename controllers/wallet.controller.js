// import package
import mongoose from 'mongoose';
import node2fa from 'node-2fa';
import multer from 'multer';
import path from 'path';
import WAValidator from 'multicoin-address-validator';

// import model
import {
    User,
    UserKyc,
    Assets,
    Transaction
} from '../models';

// import controller
import { mailTemplateLang } from './emailTemplate.controller';
import * as coinpaymentGateway from './coin/coinpaymentGateway';
import * as ethGateway from './coin/ethGateway'
import * as btcGateway from './coin/btcGateway';
import * as ltcGateway from './coin/ltcGateway';
import * as dogeGateway from './coin/dogeGateway';
import * as bnbGateway from './coin/bnbGateway';
import * as xrpGateway from './coin/xrpGateway';
import * as tronGateway from './coin/tronGateway';
import { Notification } from '../models';
// import config
import config from '../config';

// import lib
// import { comparePassword } from '../lib/bcrypt';
import imageFilter from '../lib/imageFilter';
import isEmpty from '../lib/isEmpty';
import { encryptString, decryptString } from '../lib/cryptoJS'
import { precentConvetPrice, commissionFeeCalculate } from '../lib/calculation';
import { paginationQuery, filterSearchQuery } from '../lib/adminHelpers';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Multer Image Uploade 
*/
const walletStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.IMAGE.DEPOSIT_PATH);
    },

    // By default, multer removes file extensions so let's add them back
    filename: function (req, file, cb) {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
});

let walletUpload = multer({
    storage: walletStorage,
    fileFilter: imageFilter,
    limits: { fileSize: config.IMAGE.DEFAULT_SIZE }
}).fields([
    { name: 'image', maxCount: 1 }
])

export const uploadWalletDoc = (req, res, next) => {
    walletUpload(req, res, function (err) {
        if (!isEmpty(req.validationError)) {
            return res.status(400).json({ "success": false, 'errors': { [req.validationError.fieldname]: req.validationError.messages } })
        }
        else if (err instanceof multer.MulterError) {
            return res.status(400).json({ "success": false, 'errors': { [err.field]: "TOO_LARGE" } })
        }
        else if (err) {
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
        }
        return next();
    })
}

/** 
 * Check User KYC
*/
export const checkUserKyc = async (req, res, next) => {
    try {
        let userKyc = await UserKyc.findOne({ "userId": req.user.id });
        if (!userKyc) {
            return res.status(400).json({ "success": false, 'message': "KYC_SUBMIT_ALERT" })
        }
        if (userKyc.idProof.status == 'approved' && userKyc.addressProof.status == 'approved') {
            return next();
        } else {
            return res.status(400).json({ "success": false, 'message': "KYC_SUBMIT_ALERT" })
        }
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : POST
 * BODY: currencyId, amount, bankId, twoFACode
*/
export const withdrawFiatRequest = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.amount = parseFloat(reqBody.amount);
        let userData = await User.findOne({ "_id": req.user.id, 'bankDetails._id': reqBody.bankId });

        if (!userData) {
            return res.status(400).json({ 'success': false, 'errors': { 'bankId': 'INVALID_BANK_ACCOUNT' } })
        }

        if (userData.google2Fa.secret == '') {
            return res.status(500).json({ "success": false, 'errors': { 'twoFACode': 'TWO_FA_MSG' } })
        }

        let verifyTwoFaCode = node2fa.verifyToken(userData.google2Fa.secret, reqBody.twoFACode);
        if (!(verifyTwoFaCode && verifyTwoFaCode.delta == 0)) {
            return res.status(400).json({ "success": false, 'errors': { 'twoFACode': "INVALID_CODE" } })
        }

        let bankDetails = userData.bankDetails.id(reqBody.bankId);

        if (!bankDetails) {
            return res.status(400).json({ 'success': false, 'errors': { 'bankId': 'INVALID_BANK_ACCOUNT' } })
        }

        let userAssetData = await Assets.findOne({ "userId": req.user.id, 'currency': reqBody.currencyId }).populate("currency")
        if (!userAssetData) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        if (userAssetData && !userAssetData.currency) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        let finalAmount = reqBody.amount + precentConvetPrice(reqBody.amount, userAssetData.currency.withdrawFee)
        if (userAssetData.spotwallet < finalAmount) {
            return res.status(400).json({ 'success': false, 'errors': { 'finalAmount': 'INSUFFICIENT_BALANCE' } })
        }

        if (userAssetData.currency.minimumWithdraw > finalAmount) {
            return res.status(400).json({ 'success': false, 'errors': { 'finalAmount': 'WITHDRAW_TOO_LOW' } })
        }


        var transactions = new Transaction();
        transactions["userId"] = req.user.id;
        transactions["currencyId"] = reqBody.currencyId;
        transactions["currencySymbol"] = userAssetData.currency.currencySymbol;
        transactions["amount"] = finalAmount;
        transactions["actualAmount"] = reqBody.amount;
        transactions["paymentType"] = 'fiat_withdraw';
        transactions["commissionFee"] = userAssetData.currency.withdrawFee;
        transactions['bankDetail'] = bankDetails;
        transactions["status"] = 'new';

        userAssetData.spotwallet = userAssetData.spotwallet - finalAmount;
        await userAssetData.save();
        let trxData = await transactions.save();

        let encryptToken = encryptString(trxData._id, true)
        let content = {
            'name': userData.firstName,
            'confirmMailUrl': `${config.FRONT_URL}/withdraw-fiat-verification/${encryptToken}`,
        };

        mailTemplateLang({
            'userId': req.user.id,
            'identifier': 'withdraw_request',
            'toEmail': userData.email,
            content
        })

        let description="Fiat Withdraw Request- Amount:"+trxData.amount+" | Currency:"+trxData.currencySymbol+" ";
      
        let newNotification = new Notification({
            'description': description,
            'userId':  req.user.id,
            'type':"Trade",
            'category': "Withdraw Request",
            
        });
       newNotification.save();

        return res.status(200).json({ "success": true, 'message': 'VERIFICATION_LINK' })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : PATCH
 * BODY: token
*/
export const fiatRequestVerify = async (req, res) => {
    try {
        let reqBody = req.body;
        let transactionId = decryptString(reqBody.token, true)
        let trxData = await Transaction.findOne({ "_id": transactionId, 'paymentType': "fiat_withdraw" })
        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'INVALID_TOKEN' })
        }

        if (trxData.status != 'new') {
            return res.status(400).json({ "success": false, 'message': 'EXPIRY_TOKEN' })
        }

        trxData.status = 'pending';
        let updateTrxData = await trxData.save();

        let description="Fiat Withdraw Verified-Amount:"+updateTrxData.amount+" | Currency:"+updateTrxData.currencySymbol+" ";
      
        let newNotification = new Notification({
            'description': description,
            'userId':  updateTrxData.userId,
            'type':"Trade",
            'category': "Withdraw Verification",
            
        });
       newNotification.save();

        return res.status(200).json({ "success": true, 'message': 'Successfully verify withdraw request' })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Coin Withdraw
 * URL: /api/coinWithdraw
 * METHOD : POST
 * BODY: currencyId, amount, receiverAddress, twoFACode
*/
export const withdrawCoinRequest = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.amount = parseFloat(reqBody.amount);
        let userData = await User.findOne({ "_id": req.user.id });

        if (userData.google2Fa.secret == '') {
            return res.status(500).json({ "success": false, 'errors': { 'twoFACode': 'TWO_FA_MSG' } })
        }

        let verifyTwoFaCode = node2fa.verifyToken(userData.google2Fa.secret, reqBody.twoFACode);
        if (!(verifyTwoFaCode && verifyTwoFaCode.delta == 0)) {
            return res.status(400).json({ "success": false, 'errors': { 'twoFACode': "INVALID_CODE" } })
        }

        let userAssetData = await Assets.findOne({ "userId": req.user.id, 'currency': reqBody.currencyId }).populate("currency")
        if (!userAssetData) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        if (userAssetData && !userAssetData.currency) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        if (userAssetData && userAssetData.currency && userAssetData.currency.currencySymbol) {
            let valid = await currencySymbolValid({
                address: reqBody.receiverAddress,
                currencySymbol: userAssetData.currency.currencySymbol,
                type: userAssetData.currency.type,
                tokenType: userAssetData.currency.tokenType
            });
            if (!valid) {
                return res.status(400).json({ "errors": { 'receiverAddress': `Invalid ${userAssetData.currency.currencySymbol} address` } })
            }
        }

        let finalAmount = reqBody.amount + precentConvetPrice(reqBody.amount, userAssetData.currency.withdrawFee)
        if (userAssetData.spotwallet < finalAmount) {
            return res.status(400).json({ 'success': false, 'errors': { 'finalAmount': 'INSUFFICIENT_BALANCE' } })
        }

        if (userAssetData.currency.minimumWithdraw > finalAmount) {
            return res.status(400).json({ 'success': false, 'errors': { 'finalAmount': 'WITHDRAW_TOO_LOW' } })
        }

        var transactions = new Transaction();

        if (reqBody.currencySymbol == "XRP") {
            transactions["dest_tag"] = parseInt(reqBody.dest_tag);
        }

        transactions["userId"] = req.user.id;
        transactions["currencyId"] = reqBody.currencyId;
        transactions["currencySymbol"] = userAssetData.currency.currencySymbol;
        transactions["fromaddress"] = userAssetData.currencyAddress;
        transactions["toaddress"] = reqBody.receiverAddress;
        transactions["amount"] = finalAmount;
        transactions["actualAmount"] = reqBody.amount;
        transactions["paymentType"] = 'coin_withdraw';
        transactions["commissionFee"] = userAssetData.currency.withdrawFee;
        transactions["txid"] = '';
        transactions["status"] = 'new';

        userAssetData.spotwallet = userAssetData.spotwallet - finalAmount;
        await userAssetData.save();
        let trxData = await transactions.save();

        let encryptToken = encryptString(trxData._id, true)
        let content = {
            'name': userData.firstName,
            'confirmMailUrl': `${config.FRONT_URL}/withdraw-coin-verification/${encryptToken}`,
        };

        mailTemplateLang({
            'userId': req.user.id,
            'identifier': 'withdraw_request',
            'toEmail': userData.email,
            content
        })

        let description="Coin Withdraw Request -Amount:"+trxData.amount+" | Currency:"+trxData.currencySymbol+"";
      
        let newNotification = new Notification({
            'description': description,
            'userId':  trxData.userId,
            'type':"Trade",
            'category': "Withdraw Request",
            
        });
       newNotification.save();

        return res.status(200).json({ "success": true, 'message': 'VERIFICATION_LINK' })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : PATCH
 * BODY: token
*/
export const coinRequestVerify = async (req, res) => {
    try {
        let reqBody = req.body;
        let transactionId = decryptString(reqBody.token, true)
        let trxData = await Transaction.findOne({ "_id": transactionId, 'paymentType': "coin_withdraw" })
        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'INVALID_TOKEN' })
        }

        if (trxData.status != 'new') {
            return res.status(400).json({ "success": false, 'message': 'EXPIRY_TOKEN' })
        }

        trxData.status = 'pending';
        let updateTrxData = await trxData.save();

        newNotification({
            'userId': updateTrxData.userId,
            'currencyId': updateTrxData.currencyId,
            'transactionId': updateTrxData._id,
            'trxId': updateTrxData._id,
            'currencySymbol': updateTrxData.currencySymbol,
            'amount': updateTrxData.amount,
            'paymentType': updateTrxData.paymentType,
            'status': updateTrxData.status,
        })

        return res.status(200).json({ "success": true, 'message': 'Successfully verify withdraw request' })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Get Deposit List
 * URL : /adminapi/depositList
 * METHOD : GET
*/
export const getDepositList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'toaddress', 'currencySymbol', 'amount', 'txid', 'status']);

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

        let result = {
            data,
            count: count.length
        }
        return res.status(200).json({ "success": true, result })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Get Withdraw List
 * URL : /adminapi/withdrawList
 * METHOD : GET
*/
export const getWithdrawList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'toaddress','paymentType', 'currencySymbol', 'amount', 'txid', 'status']);

        let count = await Transaction.aggregate([
            {
                "$match": {
                    "paymentType": { "$in": ["coin_withdraw", "fiat_withdraw"] },
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
                    "amount": 1,
                    "actualAmount": 1,
                    "commissionFee": 1,
                    "bankDetail": 1,
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
                    "paymentType": { "$in": ["coin_withdraw", "fiat_withdraw"] },
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
                    "amount": 1,
                    "actualAmount": 1,
                    "commissionFee": 1,
                    "bankDetail": 1,
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

        let result = {
            data,
            count: count.length
        }
        return res.status(200).json({ "success": true, result })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Approve Coin Withdraw
 * URL: /adminapi/coinWithdraw/approve
 * METHOD : POST
 * BODY: transactionId
*/
export const coinWithdrawApprove = async (req, res) => {
    try {
        let reqParam = req.params

        let trxData = await Transaction.findOneAndUpdate({
            '_id': reqParam.transactionId,
            'paymentType': 'coin_withdraw',
            'status': 'pending'
        }, {
            'status': 'completed'
        }, { 'new': true }).populate('currencyId').populate('userId');

        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'Invalid Token' })
        }
        
        if (trxData.currencyId && trxData.currencyId.type == 'crypto') {
            if (trxData.currencyId.currencySymbol == 'ETH') {
                // console.log('******************ETH WITHDRAW********************')
                const ethWithdraw = await ethGateway.amountMoveToUser({
                    'toAddress': trxData.toaddress,
                    'amount': trxData.actualAmount,
                    'fromAddress': config.coinGateway.eth.address,
                    'privateKey': decryptString(config.coinGateway.eth.privateKey)
                })

                if (!ethWithdraw.status) {

                    return res.status(400).json({ "success": false, 'message': 'Something went wrong' })
                }
                // console.log(ethWithdraw,'------ethWithdraw')
                trxData.txid = ethWithdraw.data.transactionHash;
                // trxData.txid = ethWithdraw.trxId.transactionHash;
                let updateTrxData = await trxData.save();

            } else if (trxData.currencyId.currencySymbol == 'BTC') {

                // const btcWithdraw = await coinpaymentGateway.createWithdrawal({
                //     'currencySymbol': trxData.currencyId.currencySymbol,
                //     'amount': trxData.actualAmount,
                //     'address': trxData.toaddress,
                // })

                const btcWithdraw = await btcGateway.amountMoveToUser({
                    'userAddress': trxData.toaddress,
                    'amount': trxData.actualAmount,
                })

                if (!btcWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': btcWithdraw.message })
                }

                // trxData.txid = btcWithdraw.data.id;
                trxData.txid = btcWithdraw.trxId;
                let updateTrxData = await trxData.save();

            } else if (trxData.currencyId.currencySymbol == 'TRX') {
                let { status, message, txHash } = await tronGateway.sentTransaction({
                    fromAddress: config.coinGateway.tron.address,
                    toAddress: trxData.toaddress,
                    privateKey: decryptString(config.coinGateway.tron.privateKey),
                    amount: trxData.actualAmount
                })
                // console.log(status, message, txHash,'TRX Withdraw----------------')
                if (status) {
                    trxData.txid = txHash;
                    let updateTrxData = await trxData.save();

                    // return res.status(200).json({ 'success': status, 'message': "Withdraw successfully" })
                } else {
                    return res.status(200).json({ 'success': status, 'message': message })
                }
            } else if (trxData.currencyId.currencySymbol == 'BNB') {
                let { status, message, txHash } = await bnbGateway.bnbMovetoUser({
                    amount: trxData.actualAmount,
                    adminAddress: config.coinGateway.bnb.address,
                    adminPrivatekey: config.coinGateway.bnb.privateKey,
                    userAddress: trxData.toaddress
                })
                // console.log(status, message, txHash,'BNB Withdraw----------------')
                if (status) {
                    trxData.txid = txHash;
                    const updateTrxData = await trxData.save();
                    

                } else {
                    return res.status(200).json({ 'success': status, 'message': message })
                }
            } else if (trxData.currencyId.currencySymbol == 'LTC') {
                const ltcWithdraw = await ltcGateway.amountMoveToUser({
                    'userAddress': trxData.toaddress,
                    'amount': trxData.actualAmount,
                })

                if (!ltcWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': ltcWithdraw.message })
                }

                // trxData.txid = ltcWithdraw.data.id;
                trxData.txid = ltcWithdraw.trxId;
                let updateTrxData = await trxData.save();

            } else if (trxData.currencyId.currencySymbol == 'DOGE') {
                const dogeWithdraw = await dogeGateway.amountMoveToUser({
                    'userAddress': trxData.toaddress,
                    'amount': trxData.actualAmount,
                })

                if (!dogeWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': dogeWithdraw.message })
                }

                // trxData.txid = dogeWithdraw.data.id;
                trxData.txid = dogeWithdraw.trxId;
                let updateTrxData = await trxData.save();
            } else if (trxData.currencyId.currencySymbol == 'XRP') {

                const xrpWithdraw = await xrpGateway.amountMoveToUser({
                    'userAddress': trxData.toaddress,
                    'amount': trxData.actualAmount,
                    'dest_tag': trxData.dest_tag,
                })

                if (!xrpWithdraw.status) {
                    return res.status(400).json({ "success": false, 'message': xrpWithdraw.message })
                }

                trxData.txid = xrpWithdraw.trxId;
                let updateTrxData = await trxData.save();
                
            }
        } else if (trxData.currencyId && trxData.currencyId.type == 'token') {
            if (trxData.currencyId.tokenType == "erc20") { /* ETH Token */
                // if(trxData.currencyId.currencySymbol == 'USDT'){
                const ethWithdraw = await ethGateway.tokenMoveToUser({
                    privateKey: decryptString(config.coinGateway.eth.privateKey),
                    fromAddress: config.coinGateway.eth.address,
                    toAddress: trxData.toaddress,
                    amount: trxData.actualAmount,
                    contractAddress: trxData.currencyId.contractAddress,
                    minAbi: trxData.currencyId.minABI,
                    decimals: trxData.currencyId.decimals
                })
                // console.log(ethWithdraw,'---------ethWithdraw')
                if (!ethWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': ethWithdraw.message })
                }
                trxData.txid = ethWithdraw.data.transactionHash;
                let updateTrxData = await trxData.save();
                
            } else if (trxData.currencyId.tokenType == "trc20") {
                const trc20Withdraw = await tronGateway.tokenMoveToUser({
                    'amount': trxData.actualAmount,
                    'fromAddress': config.coinGateway.tron.address,
                    'toAddress': trxData.toaddress,
                    'currencycontract': trxData.currencyId.contractAddress,
                    'privateKey': decryptString(config.coinGateway.tron.privateKey),
                    'decimals': trxData.currencyId.decimals
                })
                // console.log(trc20Withdraw,'----->>>>>>>>TRC20Withdraw')
                if (!trc20Withdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': trc20Withdraw.message })
                }
                trxData.txid = trc20Withdraw.trxId;
                let updateTrxData = await trxData.save();

            } else if (trxData.currencyId.tokenType == "bep20") {

                const bnbWithdraw = await bnbGateway.tokenMoveToUser({
                    'amount': trxData.actualAmount,
                    'adminAddress': config.coinGateway.bnb.address,
                    'userAddress': trxData.toaddress,
                    'contractAddress': trxData.currencyId.contractAddress,
                    'adminPrivateKey': config.coinGateway.bnb.privateKey,
                    'minAbi': trxData.currencyId.minABI,
                    'decimals': trxData.currencyId.decimals
                })
                // console.log(bnbWithdraw, '----->>>>>>>>bnbWithdraw')
                if (!bnbWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    return res.status(400).json({ "success": false, 'message': bnbWithdraw.message })
                }
                trxData.txid = bnbWithdraw.trxId;
                let updateTrxData = await trxData.save();

            }
        } else {
            return res.status(500).json({ "success": false, 'message': 'Error on server' })
        }

        // if (trxData.currencyId && trxData.currencyId.type == 'crypto') {
        //     if (trxData.currencyId.currencySymbol == 'ETH') {
        //         const ethWithdraw = await coinpaymentGateway.createWithdrawal({
        //             'currencySymbol': trxData.currencyId.currencySymbol,
        //             'amount': trxData.actualAmount,
        //             'address': trxData.toaddress,
        //         })

        //         // const ethWithdraw = await ethGateway.amountMoveToUser({
        //         //     'userAddress': trxData.toaddress,
        //         //     'amount': trxData.amount,
        //         // })

        //         if (!ethWithdraw.status) {
        //             // trxData.status = 'pending';
        //             // await trxData.save();

        //             return res.status(400).json({ "success": false, 'message': ethWithdraw.message })
        //         }

        //         trxData.txid = ethWithdraw.data.id;
        //         // trxData.txid = ethWithdraw.trxId.transactionHash;
        //         let updateTrxData = await trxData.save();

        //         let description = "Coin Withdraw Approved- "+updateTrxData.currencySymbol+" | Amount :"+updateTrxData.amount+"";
        //         let newNotification = new Notification({
        //             'description': description,
        //             'userId':  updateTrxData.userId,
        //             'type':"Trade",
        //             'category': "Withdraw Approve",
                    
        //         });
        //        newNotification.save();


        //     } else if (trxData.currencyId.currencySymbol == 'BTC') {

        //         // const btcWithdraw = await coinpaymentGateway.createWithdrawal({
        //         //     'currencySymbol': trxData.currencyId.currencySymbol,
        //         //     'amount': trxData.actualAmount,
        //         //     'address': trxData.toaddress,
        //         // })

        //         const btcWithdraw = await btcGateway.amountMoveToUser({
        //             'userAddress': trxData.toaddress,
        //             'amount': trxData.actualAmount,
        //         })

        //         if (!btcWithdraw.status) {
        //             // trxData.status = 'pending';
        //             // await trxData.save();
        //             return res.status(400).json({ "success": false, 'message': btcWithdraw.message })
        //         }

        //         trxData.txid = btcWithdraw.trxId;
        //         let updateTrxData = await trxData.save();

        //         let description = "Coin Withdraw Approved- "+updateTrxData.currencySymbol+" | Amount :"+updateTrxData.amount+"";
        //         let newNotification = new Notification({
        //             'description': description,
        //             'userId':  updateTrxData.userId,
        //             'type':"Trade",
        //             'category': "Withdraw Approve",
                    
        //         });
        //        newNotification.save();
        //     } else if (trxData.currencyId.currencySymbol == 'DOGE') {
 

        //         const dogeWithdraw = await dogeGateway.amountMoveToUser({
        //             'userAddress': trxData.toaddress,
        //             'amount': trxData.actualAmount,
        //         })

        //         if (!dogeWithdraw.status) {
        //             // trxData.status = 'pending';
        //             // await trxData.save();
        //             return res.status(400).json({ "success": false, 'message': dogeWithdraw.message })
        //         }

        //         trxData.txid = dogeWithdraw.trxId;
        //         let updateTrxData = await trxData.save();

        //         let description = "Coin Withdraw Approved- "+updateTrxData.currencySymbol+" | Amount :"+updateTrxData.amount+"";
        //         let newNotification = new Notification({
        //             'description': description,
        //             'userId':  updateTrxData.userId,
        //             'type':"Trade",
        //             'category': "Withdraw Approve",
                    
        //         });
        //        newNotification.save();
        //     }
        // } else if (trxData.currencyId && trxData.currencyId.type == 'token') {
        //     if (trxData.currencyId.tokenType == 1) { /* ETH Token */
        //         const ethWithdraw = await ethGateway.tokenMoveToUser({
        //             'userAddress': trxData.toaddress,
        //             'amount': trxData.actualAmount,
        //             'minAbi': trxData.currencyId.minABI,
        //             'contractAddress': trxData.currencyId.contractAddress
        //         })
        //         if (!ethWithdraw.status) {
        //             // trxData.status = 'pending';
        //             // await trxData.save();
        //             return res.status(400).json({ "success": false, 'message': ethWithdraw.message })
        //         }
        //         trxData.txid = ethWithdraw.trxId;
        //         let updateTrxData = await trxData.save();

        //         let description = "Token Withdraw Approved- "+updateTrxData.currencySymbol+" | Amount :"+updateTrxData.amount+"";
        //         let newNotification = new Notification({
        //             'description': description,
        //             'userId':  updateTrxData.userId,
        //             'type':"Trade",
        //             'category': "Withdraw Approve",
                    
        //         });
        //        newNotification.save();
        //         // return res.status(200).json({ 'success': true, 'result': { 'messages': "Success" } })
        //     }
        // } else {
        //     return res.status(500).json({ "success": false, 'message': 'Error on server' })
        // }


        let description = "Coin Withdraw Approved- "+trxData.currencySymbol+" | Amount :"+trxData.amount+"";

        let newNotification = new Notification({
            'description': description,
            'userId':  trxData.userId,
            'type':"Trade",
            'category': "Withdraw Approve",
            
        });

        newNotification.save();

        let content = {
            'amount': trxData.actualAmount,
            'currency': trxData.currencyId && trxData.currencyId.currencySymbol,
            'tranactionId': reqParam.transactionId,
            'date': new Date(),
        };

        mailTemplateLang({
            'userId': trxData.userId._id,
            'identifier': 'Withdraw_notification',
            'toEmail': trxData.userId.email,
            content
        })

        return res.status(200).json({ 'success': true, 'message': "Withdraw successfully" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Reject Coin Withdraw
 * URL: /adminapi/coinWithdraw/reject
 * METHOD : POST
*/
export const coinWithdrawReject = async (req, res) => {
    try {
        let reqParam = req.params

        let trxData = await Transaction.findOneAndUpdate({
            '_id': reqParam.transactionId,
            'paymentType': 'coin_withdraw',
            'status': 'pending'
        }, {
            'status': 'rejected'
        }, { 'new': true });

        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'Invalid Token' })
        }

        await Assets.update(
            {
                "userId": trxData.userId,
                "currency": trxData.currencyId
            },
            {
                "$inc": {
                    'spotwallet': trxData.actualAmount
                }
            }
        )

        let description = "Coin Withdraw Rejected- "+trxData.currencySymbol+" | Amount :"+trxData.amount+"";
        let newNotification = new Notification({
            'description': description,
            'userId':  trxData.userId,
            'type':"Trade",
            'category': "Withdraw Reject",
            
        });
       newNotification.save();
        return res.status(200).json({ 'success': true, 'message': "Withdraw successfully rejected" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Approve Fiat Withdraw
 * URL: /adminapi/coinWithdraw/approve
 * METHOD : POST
 * BODY: transactionId
*/
export const fiatWithdrawApprove = async (req, res) => {
    try {
        let reqParam = req.params

        let trxData = await Transaction.findOneAndUpdate({
            '_id': reqParam.transactionId,
            'paymentType': 'fiat_withdraw',
            'status': 'pending'
        }, {
            'status': 'completed'
        }, { 'new': true }).populate('currencyId').populate('userId');

        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'Invalid Token' })
        }

        let content = {
            'amount': trxData.actualAmount,
            'currency': trxData.currencyId && trxData.currencyId.currencySymbol,
            'tranactionId': reqParam.transactionId,
            'date': new Date(),
        };

        mailTemplateLang({
            'userId': trxData.userId._id,
            'identifier': 'Withdraw_notification',
            'toEmail': trxData.userId.email,
            content
        })

        let description = "Fiat Withdraw Approved- "+trxData.currencySymbol+" | Amount :"+trxData.amount+"";
        let newNotification = new Notification({
            'description': description,
            'userId':  trxData.userId,
            'type':"Trade",
            'category': "Withdraw Approve",
            
        });
       newNotification.save();
        return res.status(200).json({ 'success': true, 'message': "Withdraw successfully" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Reject Coin Withdraw
 * URL: /adminapi/coinWithdraw/reject
 * METHOD : POST
*/
export const fiatWithdrawReject = async (req, res) => {
    try {
        let reqParam = req.params

        let trxData = await Transaction.findOneAndUpdate({
            '_id': reqParam.transactionId,
            'paymentType': 'fiat_withdraw',
            'status': 'pending'
        }, {
            'status': 'rejected'
        }, { 'new': true });

        if (!trxData) {
            return res.status(400).json({ "success": false, 'message': 'Invalid Token' })
        }

        await Assets.update(
            {
                "userId": trxData.userId,
                "currency": trxData.currencyId
            },
            {
                "$inc": {
                    'spotwallet': trxData.actualAmount
                }
            }
        )

        let description = "Fiat Withdraw Rejected- "+trxData.currencySymbol+" | Amount :"+trxData.amount+"";
        let newNotification = new Notification({
            'description': description,
            'userId':  trxData.userId,
            'type':"Trade",
            'category': "Withdraw Reject",
            
        });
       newNotification.save();
        return res.status(200).json({ 'success': true, 'message': "Withdraw successfully rejected" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Sent Deposit Request To Admin
 * URL: /api/depositRequest
 * METHOD : POST
 * BODY : userAssetId, amount, image
*/
export const depositRequest = async (req, res) => {
    try {
        let reqBody = req.body;
        let reqFile = req.files;

        let userAsset = await Assets.findOne({ "_id": reqBody.userAssetId })/* .populate("currency") */

        if (!userAsset) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        // if (userAsset && !userAsset.currency) {
        //     return res.status(400).json({ 'status': false, 'errors': { "messages": "Invalid currency" } })
        // }

        let newDoc = new Transaction({
            userId: req.user.id,
            currencyId: userAsset.currency,
            actualAmount: reqBody.amount,
            amount: reqBody.amount,
            currencySymbol: userAsset.currencySymbol,
            status: "pending",
            paymentType: "fiat_deposit",
            image: reqFile.image[0].filename,
            // commissionFee: userAsset.currency.depositCharge,
            userAssetId: reqBody.userAssetId
        })

        let updateTrxData = await newDoc.save();

        let description="Deposit Request -Amount:"+updateTrxData.amount+" | Currency:"+updateTrxData.currencySymbol+"";
      
        let newNotification = new Notification({
            'description': description,
            'userId':  updateTrxData.userId,
            'type':"Trade",
            'category': "Deposit Request",
            
        });
       newNotification.save();
        return res.status(200).json({ 'success': true, 'message': "DEPOSIT_REQUEST_SUCCESS" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Admin Approved Fiat Deposit Request
 * URL: /adminapi/fiatDeposit/approve
 * METHOD : POST
 * BODY : transactionId, amount
*/
export const fiatDepositApprove = async (req, res) => {
    try {
        let reqBody = req.body;
        let transactionData = await Transaction.findOneAndUpdate({
            "_id": reqBody.transactionId,
            "paymentType": "fiat_deposit",
            "status": "pending"
        }, {
            "status": "completed",
            "actualAmount": reqBody.amount
        }, { "new": true }).populate('userId');

        if (!transactionData) {
            return res.status(400).json({ "success": false, 'message': 'No Transaction Found' })
        }

        // let priceCalculate = commissionFeeCalculate(transactionData.actualAmount, reqBody.amount)
        await Assets.findOneAndUpdate(
            { "_id": transactionData.userAssetId },
            {
                "$inc": {
                    'spotwallet': reqBody.amount
                }
            },
            { "new": true }
        )

        let content = {
            'amount': reqBody.amount,
            'currency': transactionData.currencySymbol,
            'tranactionId': reqBody.transactionId,
            'date': new Date(),
        };

        mailTemplateLang({
            'userId': transactionData.userId && transactionData.userId._id,
            'identifier': 'User_deposit',
            'toEmail': transactionData.userId && transactionData.userId.email,
            content
        })
        let description = "Deposit Approved - Amount : "+reqBody.amount+" | Currency : "+transactionData.currencySymbol;
        console.log("DEscription----------------,",description)
        let newNotification = new Notification({
            'description': description,
            'userId':  transactionData.userId,
            'type':"Trade",
            'category': "Deposit Approve",
            
        });
       newNotification.save();

        return res.status(200).json({ 'success': false, "message": "Amount added successfully" })

    } catch (err) {
        console.log("Error---",err)
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}

/** 
 * Get User Deposit
 * URL: /api/get-user-deposit
 * METHOD : POST
*/

 export const getuserDeposit = async (req, res) => {
    try {
        let userId = req.user.id;
        console.log("Deposituser---",userId)
        // ETH and ERC20
       // ethGateway.deposit(userId); //  ETH
       // ethGateway.ERC20_Deposit(userId,"MAT"); // ERC20
       // ethGateway.ERC20_Deposit(userId,"SHIB"); // ERC20

        // // TRX and TRC20
       // tronGateway.tronDeposit(userId); // TRX
       // tronGateway.tronTokenDeposit(userId,"USDT");// TRC20

        // BNB and BEP20
        bnbGateway.deposit(userId); // BNB
         bnbGateway.tokenDeposit(userId,"MCOIN"); // BEP20
        //   console.log(dd);
        // XRP
       // xrpGateway.deposit(userId);
    }
    catch (err) {
        console.log(err,'----err')
        return res.status(500).json({ "success": false, 'message': 'Error on server' })
    }
}




/** 
 * Wallet Transfer
 * URL: /api/walletTransfer
 * METHOD : POST
 * BODY : fromType, toType, userAssetId, amount
*/
export const walletTransfer = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.amount = parseFloat(reqBody.amount);

        let userAssetData = await Assets.findOne({
            "_id": reqBody.userAssetId,
            "userId": req.user.id,
        })
        if (!userAssetData) {
            return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
        }

        if (reqBody.toType == 'spot') {
            if (userAssetData.p2pbalance < reqBody.amount) {
                return res.status(400).json({ 'success': false, 'message': 'INSUFFICIENT_BALANCE' })
            }

            userAssetData.spotwallet = userAssetData.spotwallet + reqBody.amount;
            userAssetData.p2pbalance = userAssetData.p2pbalance - reqBody.amount;
        } else if (reqBody.toType == 'P2P') {
            if (userAssetData.spotwallet < reqBody.amount) {
                return res.status(400).json({ 'success': false, 'message': 'INSUFFICIENT_BALANCE' })
            }

            userAssetData.spotwallet = userAssetData.spotwallet - reqBody.amount;
            userAssetData.p2pbalance = userAssetData.p2pbalance + reqBody.amount;
        }

        await userAssetData.save();
        let description="Transfer Amount:"+reqBody.amount+" | Currency:"+userAssetData.currencySymbol+" | To :"+reqBody.toType+" Wallet";
      
        let newNotification = new Notification({
            'description': description,
            'userId':  req.user.id,
            'type':"Trade",
            'category': "Wallet Transfer",
            
        });
       newNotification.save();
        return res.json({ 'status': true, 'message': "WALLET_TRANSFER_SUCCESS" });

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

export const currencySymbolValid = async ({ address, currencySymbol, type, tokenType = "" }) => {
    try {

        if (type == 'token') {
            currencySymbol = (tokenType == "bep20") ? "ETH" : (tokenType == "erc20") ? "ETH" : "TRX";
        }

        if(currencySymbol == "BNB"){
            currencySymbol = "ETH"
        }

        let valid = await WAValidator.validate(address, currencySymbol)

        return valid;
    } catch (err) {
        console.log(err, '----currencySymbolValid')
        return false;
    }
}