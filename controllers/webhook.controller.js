// import package
import fs from 'fs';

// import model

import {
    Currency,
    Transaction,
    Assets
} from '../models';

// import controller
import { mailTemplateLang } from './emailTemplate.controller';

function write_log(msg) {
    try {
        var now = new Date();
        var log_file =
            "log/common_log_" +
            now.getFullYear() +
            now.getMonth() +
            now.getDay() +
            ".txt";
        fs.appendFileSync(log_file, msg);
        //console.log(msg);
        return true;
    } catch (err) {
        console.log('err', err)
    }
}

/** 
 * Coin Payment Deposit Webhook
 * URL: /api/depositwebhook
 * BODY : currency, address, txn_id, amount
*/
export const depositwebhook = async (req, res) => {
    write_log(JSON.stringify(req.body))
    write_log(JSON.stringify(req.headers))
    try {
        let reqBody = req.body;
        let currencyData = await Currency.findOne({ 'currencySymbol': reqBody.currency })

        if (!currencyData) {
            return res.status(400).json({ 'success': false, 'messages': "Invalid currency" })
        }

        let userAssetData = await Assets.findOne({ 'currency': currencyData._id, 'currencyAddress': reqBody.address }).populate({ path: "userId" })

        if (!userAssetData) {
            return res.status(400).json({ 'success': false, 'messages': "Invalid assets" })
        }

        if (userAssetData && !userAssetData.userId) {
            return res.status(400).json({ 'success': false, 'messages': "Invalid user data" })
        }

        let trxnData = await Transaction.findOne({ 'currencyId': currencyData._id, 'txid': reqBody.txn_id });

        if (trxnData) {
            return res.status(400).json({ 'success': false, 'messages': "Already payment exists" })
        }

        let transactions = new Transaction();
        transactions["userId"] = userAssetData.userId._id;
        transactions["currencyId"] = currencyData._id;
        transactions["currencySymbol"] = currencyData.currencySymbol;
        transactions["toaddress"] = reqBody.address;
        transactions["amount"] = reqBody.amount;
        transactions["actualAmount"] = reqBody.amount;
        transactions["txid"] = reqBody.txn_id;
        transactions["status"] = 'completed';
        transactions["paymentType"] = 'coin_deposit';

        await transactions.save();

        await Assets.findOneAndUpdate(
            { '_id': userAssetData._id },
            { $inc: { 'spotwallet': parseFloat(reqBody.amount).toFixed(8) } }
        )

        let content = {
            'email': userAssetData.userId.email,
            'date': new Date(),
            'amount': parseFloat(reqBody.amount).toFixed(8),
            'transactionId': reqBody.txn_id,
            'currency': reqBody.currency,
        };

        mailTemplateLang({
            'userId': userAssetData.userId._id,
            'identifier': 'User_deposit',
            'toEmail': userAssetData.userId.email,
            content
        })

        return res.status(200).json({ 'success': true, 'messages': "Updated successfully" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'messages': "Error on server" })
    }
}