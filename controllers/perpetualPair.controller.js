// import package

// import model
import {
    Currency,
    PerpetualPair,
    SpotPair
} from '../models'

import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers';

/** 
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const addPerpetualPair = async (req, res) => {
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


        let checkSpotPair = await PerpetualPair.findOne({ 'firstCurrencyId': reqBody.firstCurrencyId, 'secondCurrencyId': reqBody.secondCurrencyId })
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Currency pair is already exists" } })
        }

        let newDoc = new PerpetualPair({
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
            'markupPercentage': reqBody.markupPercentage,
            'markPrice':reqBody.markPrice,
            "maintenanceMargin":reqBody.maintenanceMargin,
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
export const editPerpetualPair = async (req, res) => {
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


        let checkSpotPair = await PerpetualPair.findOne({ 'firstCurrencyId': reqBody.firstCurrencyId, 'secondCurrencyId': reqBody.secondCurrencyId, "_id": { "$ne": reqBody.pairId } })
        if (checkSpotPair) {
            return res.status(400).json({ "success": false, 'errors': { 'firstCurrencyId': "Currency pair is already exists" } })
        }

        await PerpetualPair.updateOne({
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
                'markupPercentage': reqBody.markupPercentage,
                'markPrice':reqBody.markPrice,
                 "maintenanceMargin":reqBody.maintenanceMargin,
                'status': reqBody.status,
            }
        })

        return res.status(200).json({ 'message': 'Pair updated successfully. Refreshing data...' })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

/** 
 * Get Spot Trade Pair
 * METHOD : GET
*/
export const perpetualPairList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['firstCurrencySymbol', 'secondCurrencySymbol', 'botstatus', 'status']);

        let count = await PerpetualPair.countDocuments(filter)
        let data = await PerpetualPair.find(filter, {
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
            'markupPercentage': 1,
            'markPrice':1,
            "maintenanceMargin":1
,            'status': 1
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