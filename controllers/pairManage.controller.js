// import package

// import model
import {
    Currency,
    SpotPair,
    SpotTrade,
    PerpetualOrder
    
} from '../models'
import P2PSpotpairs from '../models/P2PSpotpairs';
import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers';

// import controller
import * as binanceCtrl from "./binance.controller";
import * as symbolDatabase from "./chart/symbols_database";

/** 
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const addSpotPair = async (req, res) => {
    try {
        let reqBody = req.body;

        let firstCurrencyData = await Currency.findOne({ "_id": reqBody.firstCurrencyId });
        if (!firstCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Invalid currency" } })
        }

        let secondCurrencyData = await Currency.findOne({ "_id": reqBody.secondCurrencyId });
        if (!secondCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'secondCurrencyId': "Invalid currency" } })
        }


        let checkSpotPair = await SpotPair.findOne({ 'firstCurrencyId': reqBody.firstCurrencyId, 'secondCurrencyId': reqBody.secondCurrencyId })
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Currency pair is already exists" } })
        }

        let newDoc = new SpotPair({
            'firstCurrencyId': reqBody.firstCurrencyId,
            'firstCurrencySymbol': firstCurrencyData.currencySymbol,
            'firstFloatDigit': reqBody.firstFloatDigit,
            'secondCurrencyId': reqBody.secondCurrencyId,
            'secondCurrencySymbol': secondCurrencyData.currencySymbol,
            'secondFloatDigit': reqBody.secondFloatDigit,
            'minPricePercentage': reqBody.minPricePercentage,
            'maxPricePercentage': reqBody.maxPricePercentage,
            'minQuantity': reqBody.minQuantity,
            'maxQuantity': reqBody.maxQuantity,
            'maker_rebate': reqBody.maker_rebate,
            "markPrice":reqBody.markPrice,
            'taker_fees': reqBody.taker_fees,
            'markupPercentage': reqBody.markupPercentage,
            'botstatus': reqBody.botstatus
        })
        await newDoc.save();
        return res.status(200).json({ 'message': 'Pair added successfully. Refreshing data...' })
    } catch (err) {
        console.log("Err---",err)
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}



export const addP2PPair = async (req, res) => {
    try {
        let reqBody = req.body;
        console.log("Admin Add P2P Body-----",req.body);
        let firstCurrencyData = await Currency.findOne({ "currencySymbol": reqBody.firstCurrency });
        if (!firstCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrency': "Invalid currency" } })
        }

        let secondCurrencyData = await Currency.findOne({ "currencySymbol": reqBody.secondCurrency});
        if (!secondCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'secondCurrency': "Invalid currency" } })
        }


        let checkSpotPair = await P2PSpotpairs.findOne({ 'first_currency': reqBody.firstCurrency, 'second_currency': reqBody.secondCurrency})
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrency': "Currency pair is already exists" } })
        }

        let newDoc = new P2PSpotpairs({
            'first_currency': reqBody.firstCurrency,
    
            'second_currency': reqBody.secondCurrency,
            "mark_price":reqBody.markPrice,
            "index_price":reqBody.markPrice,
            'transactionfee': reqBody.transactionfee,
            'tiker_root': reqBody.firstCurrency+reqBody.secondCurrency,
           
        })
        await newDoc.save();
       
        return res.status(200).json({ 'message': 'Pair added successfully. Refreshing data...' })
    } catch (err) {
      
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}



/** 
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : pairId, firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const editSpotPair = async (req, res) => {
    try {
        let reqBody = req.body;

        let firstCurrencyData = await Currency.findOne({ "_id": reqBody.firstCurrencyId });
        if (!firstCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Invalid currency" } })
        }

        let secondCurrencyData = await Currency.findOne({ "_id": reqBody.secondCurrencyId });
        if (!secondCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'secondCurrencyId': "Invalid currency" } })
        }


        let checkSpotPair = await SpotPair.findOne({ 'firstCurrencyId': reqBody.firstCurrencyId, 'secondCurrencyId': reqBody.secondCurrencyId, "_id": { "$ne": reqBody.pairId } })
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Currency pair is already exists" } })
        }

        await SpotPair.updateOne({
            "_id": reqBody.pairId
        }, {
            "$set": {
                'firstCurrencyId': reqBody.firstCurrencyId,
                'firstCurrencySymbol': firstCurrencyData.currencySymbol,
                'firstFloatDigit': reqBody.firstFloatDigit,
                'secondCurrencyId': reqBody.secondCurrencyId,
                'secondCurrencySymbol': secondCurrencyData.currencySymbol,
                'secondFloatDigit': reqBody.secondFloatDigit,
                'minPricePercentage': reqBody.minPricePercentage,
                'maxPricePercentage': reqBody.maxPricePercentage,
                'minQuantity': reqBody.minQuantity,
                'maxQuantity': reqBody.maxQuantity,
                'maker_rebate': reqBody.maker_rebate,
                'taker_fees': reqBody.taker_fees,
                "markPrice":reqBody.markPrice,
                'markupPercentage': reqBody.markupPercentage,
                'botstatus': reqBody.botstatus,
                'status': reqBody.status,
            }
        })

        symbolDatabase.initialChartSymbol();

        // if (updateDoc.botstatus == "binance") {
        //   binanceCtrl.getSpotPair();
        //   binanceCtrl.spotOrderBookWS();
        //   binanceCtrl.spotTickerPriceWS();
        // }

        if (reqBody.botstatus == 'binance' ||  reqBody.botstatus == 'off') {
          console.log('----------***********------------')
            binanceCtrl.getSpotPair();
            binanceCtrl.spotOrderBookWS();
            binanceCtrl.spotTickerPriceWS();
            binanceCtrl.recentTradeWS();
        }

        return res.status(200).json({ 'message': 'Pair updated successfully. Refreshing data...' })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

export const editP2PPair = async (req, res) => {
    try {
        let reqBody = req.body;

        let firstCurrencyData = await Currency.findOne({ "currencySymbol": reqBody.firstCurrency });
        if (!firstCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrency': "Invalid currency" } })
        }

        let secondCurrencyData = await Currency.findOne({ "currencySymbol": reqBody.secondCurrency });
        if (!secondCurrencyData) {
            return res.status(400).json({ "success": false, 'errors': { 'secondCurrency': "Invalid currency" } })
        }


        let checkSpotPair = await P2PSpotpairs.findOne({ 'first_currency': reqBody.firstCurrency, 'second_currency': reqBody.secondCurrency, "_id": { "$ne": reqBody.pairId } })
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrency': "Currency pair is already exists" } })
        }

        await P2PSpotpairs.updateOne({
            "_id": reqBody.pairId
        }, {
            "$set": {
                'first_currency': reqBody.firstCurrency,
                'second_currency': reqBody.secondCurrency,
                'transactionfee': reqBody.transactionfee,
                "mark_price":reqBody.markPrice,
                "index_price":reqBody.markPrice,
                'tiker_root': reqBody.firstCurrency+reqBody.secondCurrency,
                'status': reqBody.status,
            }
        })
        
        return res.status(200).json({ 'message': 'Pair updated successfully. Refreshing data...' })
    } catch (err) {
        console.log("----err", err)
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}




/** 
 * Get Spot Trade Pair
 * METHOD : GET
*/
export const spotPairList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrencySymbol', 'secondCurrencySymbol', 'botstatus', 'status']);

        let count = await SpotPair.countDocuments(filter)
        let data = await SpotPair.find(filter, {
            'firstCurrencyId': 1,
            'firstCurrencySymbol': 1,
            'firstFloatDigit': 1,
            'secondCurrencyId': 1,
            'secondCurrencySymbol': 1,
            'secondFloatDigit': 1,
            'minPricePercentage': 1,
            'maxPricePercentage': 1,
            'minQuantity': 1,
            'maxQuantity': 1,
            'maker_rebate': 1,
            'taker_fees': 1,
            "markPrice":1,
            'markupPercentage': 1,
            'botstatus': 1,
            'status': 1
        }).skip(pagination.skip).limit(pagination.limit)

        let result = {
            count,
            data
        }
        return res.status(200).json({ 'success': true, "messages": "success", result })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

export const p2pPairList = async (req, res) => {
    try {
        
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrencySymbol', 'secondCurrencySymbol', 'botstatus']);

        let count = await P2PSpotpairs.countDocuments(filter)
        let data = await P2PSpotpairs.find(filter, {
            'transactionfee': 1,
            'first_currency': 1,
            'second_currency': 1,
            'index_price': 1,
            'mark_price': 1,
            'tiker_root': 1,
            'status': 1
        }).skip(pagination.skip).limit(pagination.limit)

        let result = {
            count,
            data
        }
        console.log("Admin Result---",result.data);
        return res.status(200).json({ 'success': true, "messages": "success", result })
    }
    catch (err) {
        console.log("Admin Pair Error---",err);

        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}



