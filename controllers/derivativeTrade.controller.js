// import package
import mongoose from 'mongoose';

// import models
import {
    PerpetualPair,
    PerpetualOrder,
    Assets,
    SpotTrade
} from '../models';

// import config
import config from '../config';
import { socketEmitOne, socketEmitAll } from '../config/socketIO';

// import controller
import { calculateInverseOrderCost, isolatedLiquidationPrice, inversePositionMargin } from './bybit.controller'

// import lib
import isEmpty from '../lib/isEmpty';
import { encryptObject, decryptObject } from '../lib/cryptoJS';
import { paginationQuery } from '../lib/adminHelpers';
import { toFixed } from '../lib/roundOf'

const ObjectId = mongoose.Types.ObjectId;

const adminId = ObjectId("5e567694b912240c7f0e4299")

/** 
 * Trade Decrypt
 * BODY : token
*/
export const decryptTradeOrder = (req, res, next) => {
    try {
        let token = decryptObject(req.body.token)
        req.body = token;
        return next();
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "SOMETHING_WRONG" });
    }
}


/** 
 * Get Perpetual Pair List
 * METHOD: GET
 * URL : /api/perpetual/tradePair
*/
export const getPairList = async (req, res) => {
    try {
        let perpetualPairData = await PerpetualPair.aggregate([
            { "$match": { "status": "active" } },
            {
                "$lookup": {
                    "from": 'currency',
                    "localField": "firstCurrencyId",
                    "foreignField": "_id",
                    "as": "firstCurrencyInfo"
                }
            },
            { "$unwind": "$firstCurrencyInfo" },

            {
                "$lookup": {
                    "from": 'currency',
                    "localField": "secondCurrencyId",
                    "foreignField": "_id",
                    "as": "secondCurrencyInfo"
                }
            },
            { "$unwind": "$secondCurrencyInfo" },

            {
                "$project": {
                    '_id': 1,
                    'firstCurrencyId': 1,
                    'firstCurrencySymbol': 1,
                    'firstCurrencyImage': {
                        "$cond": [
                            { "$eq": ['$firstCurrencyInfo.currencyimage', ''] },
                            "",
                            { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$firstCurrencyInfo.currencyimage"] }
                        ]
                    },
                    'secondCurrencyId': 1,
                    'secondCurrencySymbol': 1,
                    'secondCurrencyImage': {
                        "$cond": [
                            { "$eq": ['$secondCurrencyInfo.currencyimage', ''] },
                            "",
                            { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$secondCurrencyInfo.currencyimage"] }
                        ]
                    },
                    'firstFloatDigit': 1,
                    'secondFloatDigit': 1,
                    'botstatus': 1,

                    'last': 1,
                    'markPrice': 1,
                    'low': 1,
                    'high': 1,
                    'firstVolume': 1,
                    'secondVolume': 1,
                    'changePrice': 1,
                    'change': 1,
                    'maker_rebate': 1,
                    'taker_fees': 1
                }
            },

        ])
        return res.status(200).json({ 'success': true, 'messages': "success", 'result': perpetualPairData })
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}

/**
 * Cancel Order
 * METHOD : DELETE
 * URL : /api/perpetual/cancelOrder/{{orderId}}
 * PARAMS : orderId
*/
export const cancelOrder = async (req, res) => {
    try {
        let orderData = await PerpetualOrder.findOne({ "_id": req.params.orderId }).populate({ "path": "pairId", "select": "taker_fees firstFloatDigit" });
        if (!orderData) {
            return res.status(400).json({ 'status': false, 'message': "NO_ORDER" });
        }

        if (orderData && !orderData.pairId) {
            return res.status(400).json({ 'status': false, 'message': "NO_ORDER" });
        }

        let orderCost = 0;
        let balanceRetrieve = false;

        if (['open', 'pending', 'conditional'].includes(orderData.status)) {

            let positionDetails = await checkUserPosition(orderData.pairId._id, orderData.userId, orderData.buyorsell);
            let quantity = orderData.quantity - orderData.filledQuantity;

            if (positionDetails && positionDetails.status == 'POSITIONED') {
                if (positionDetails.orderList && positionDetails.orderList.length == 1) {
                    if (quantity > positionDetails.positionQuantity) {
                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;
                        orderCost = calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
                    }

                } else if (positionDetails.orderList && positionDetails.orderList.length > 1) {
                    if (positionDetails.orderList[0].price == orderData.price) {

                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;

                        orderCost = calculateInverseOrderCost({
                            'price': positionDetails.orderList[1].price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        }) + calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': quantity - remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)

                    } else {
                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;
                        orderCost = calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
                    }
                }
            } else {
                let openOrder = await PerpetualOrder.aggregate([
                    {
                        "$match": {
                            'pairId': ObjectId(orderData.pairId._id),
                            'userId': ObjectId(req.user.id),
                            'status': { "$in": ['open', 'filled'] },
                            'positionStatus': 'closed',
                        }
                    },
                    {
                        "$project": {
                            'buyOrderCost': {
                                "$cond": [
                                    { "$eq": ["$buyorsell", "buy"] },
                                    "$orderCost",
                                    0
                                ]
                            },
                            'sellOrderCost': {
                                "$cond": [
                                    { "$eq": ["$buyorsell", "sell"] },
                                    "$orderCost",
                                    0
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": null,
                            "buyOrderCost": { "$sum": "$buyOrderCost" },
                            "sellOrderCost": { "$sum": "$sellOrderCost" },
                        }
                    }
                ])

                if (openOrder && openOrder.length > 0 && ((orderData.buyorsell == 'buy' && openOrder[0].sellOrderCost > 0) || (orderData.buyorsell == 'sell' && openOrder[0].buyOrderCost > 0))) {
                    let remainingOrderCost = 0;

                    if (orderData.buyorsell == 'buy') {
                        remainingOrderCost = openOrder[0].buyOrderCost - openOrder[0].sellOrderCost;
                    } else if (orderData.buyorsell == 'sell') {
                        remainingOrderCost = openOrder[0].sellOrderCost - openOrder[0].buyOrderCost;
                    }


                    if (remainingOrderCost > 0) {
                        if (remainingOrderCost > orderData.orderCost) {
                            balanceRetrieve = true
                            orderCost = orderData.orderCost;
                        } else if (remainingOrderCost < orderData.orderCost) {
                            balanceRetrieve = true
                            orderCost = remainingOrderCost;
                        }
                    }
                } else {
                    balanceRetrieve = true
                    orderCost = orderData.orderCost;
                }

                orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
            }

            orderData.status = 'cancel';
            await orderData.save();

            if (balanceRetrieve) {
                await Assets.findOneAndUpdate({ "userId": orderData.userId, "currency": orderData.firstCurrencyId }, { "$inc": { "derivativeWallet": orderCost } })
            }

            return res.status(200).json({ 'status': true, 'message': "ORDER_CANCEL" });

        } else if (orderData.status == 'completed') {
            return res.status(400).json({ 'status': false, 'message': "ORDER_ALREADY_COMPLETED" });
        } else if (orderData.status == 'cancel') {
            return res.status(400).json({ 'status': false, 'message': "ORDER_ALREADY_CANCEL" });
        }
        return res.status(400).json({ 'status': false, 'message': "SOMETHING_WRONG" });
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured" });
    }
}

/** 
 * Order cancel by Time In Force
*/
export const ordercancelTIF = async (orderData, pairData) => {
    try {
        let orderCost = 0;
        let balanceRetrieve = false;

        if (['open', 'pending', 'conditional'].includes(orderData.status)) {

            let positionDetails = await checkUserPosition(orderData.pairId._id, orderData.userId, orderData.buyorsell);
            let quantity = orderData.quantity - orderData.filledQuantity;

            if (positionDetails && positionDetails.status == 'POSITIONED') {
                if (positionDetails.orderList && positionDetails.orderList.length == 1) {
                    if (quantity > positionDetails.positionQuantity) {
                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;
                        orderCost = calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
                    }

                } else if (positionDetails.orderList && positionDetails.orderList.length > 1) {
                    if (positionDetails.orderList[0].price == orderData.price) {

                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;

                        orderCost = calculateInverseOrderCost({
                            'price': positionDetails.orderList[1].price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        }) + calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': quantity - remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)

                    } else {
                        balanceRetrieve = true

                        let remainingQuantity = quantity - positionDetails.positionQuantity;
                        orderCost = calculateInverseOrderCost({
                            'price': orderData.price,
                            'quantity': remainingQuantity,
                            'leverage': orderData.leverage,
                            'takerFee': orderData.pairId.taker_fees,
                            'buyorsell': orderData.buyorsell
                        })

                        orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
                    }
                }
            } else {
                let openOrder = await PerpetualOrder.aggregate([
                    {
                        "$match": {
                            'pairId': ObjectId(orderData.pairId._id),
                            'userId': ObjectId(req.user.id),
                            'status': { "$in": ['open', 'filled'] },
                            'positionStatus': 'closed',
                        }
                    },
                    {
                        "$project": {
                            'buyOrderCost': {
                                "$cond": [
                                    { "$eq": ["$buyorsell", "buy"] },
                                    "$orderCost",
                                    0
                                ]
                            },
                            'sellOrderCost': {
                                "$cond": [
                                    { "$eq": ["$buyorsell", "sell"] },
                                    "$orderCost",
                                    0
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": null,
                            "buyOrderCost": { "$sum": "$buyOrderCost" },
                            "sellOrderCost": { "$sum": "$sellOrderCost" },
                        }
                    }
                ])

                if (openOrder && openOrder.length > 0 && ((orderData.buyorsell == 'buy' && openOrder[0].sellOrderCost > 0) || (orderData.buyorsell == 'sell' && openOrder[0].buyOrderCost > 0))) {
                    let remainingOrderCost = 0;

                    if (orderData.buyorsell == 'buy') {
                        remainingOrderCost = openOrder[0].buyOrderCost - openOrder[0].sellOrderCost;
                    } else if (orderData.buyorsell == 'sell') {
                        remainingOrderCost = openOrder[0].sellOrderCost - openOrder[0].buyOrderCost;
                    }


                    if (remainingOrderCost > 0) {
                        if (remainingOrderCost > orderData.orderCost) {
                            balanceRetrieve = true
                            orderCost = orderData.orderCost;
                        } else if (remainingOrderCost < orderData.orderCost) {
                            balanceRetrieve = true
                            orderCost = remainingOrderCost;
                        }
                    }
                } else {
                    balanceRetrieve = true
                    orderCost = orderData.orderCost;
                }

                orderCost = toFixed(orderCost, orderData.pairId.firstFloatDigit)
            }

            orderData.status = 'cancel';
            await orderData.save();

            if (balanceRetrieve) {
                await Assets.findOneAndUpdate({ "userId": orderData.userId, "currency": orderData.firstCurrencyId }, { "$inc": { "derivativeWallet": orderCost } })
            }

            console.log("Your Order cancelled successfully (TIME IN FORCE)")
            return true

        }
    } catch (err) {
        console.log("Error on order cancel (TIME IN FORCE)")
        return false
    }
}

/**
 * Order Placing
 * METHOD : POST
 * URL : /api/perpetual/orderPlace
 * BODY : newdate, spotPairId, stopPrice, price, quantity, buyorsell, orderType(limit,market,stopLimit,oco), limitPrice
*/
export const orderPlace = (req, res) => {
    try {
        let
            reqBody = req.body,
            currentDate = new Date(),
            reqdate = new Date(reqBody.newdate),
            anotherdate = currentDate.getTime() + (1000 * 5),
            indate = new Date(anotherdate);


        if (indate > reqdate) {
            if (reqBody.orderType == 'limit') {
                limitOrderPlace(req, res)
            } else if (reqBody.orderType == 'market') {
                marketOrderPlace(req, res)
            } /* else if (reqBody.orderType == 'stop_limit') {
                // stopLimitOrderPlace(req, res)
            } else if (reqBody.orderType == 'stop_market') {
                // stopMarketOrderPlace(req, res)
            } */
        } else {
            return res.status(400).json({ 'status': false, 'message': "Error occured For the Interval_orderPlace" });
        }
    } catch (err) {
        return res.status(400).json({ 'status': false, 'message': "Error occured For the Interval_orderPlace_err" });
    }
}

/** 
 * Check User Position
*/
export const checkUserPosition = async (pairId, userId, buyorsell) => {
    try {
        let positionDetails = await PerpetualOrder.aggregate([
            {
                "$match": {
                    'pairId': ObjectId(pairId),
                    'userId': ObjectId(userId),
                    // 'status': { "$in": ['pending', 'completed', 'cancel'] },
                    'positionStatus': 'open',
                    'buyorsell': buyorsell == 'buy' ? 'sell' : 'buy'
                }
            },
            {
                "$group": {
                    '_id': null,
                    'positionQuantity': { "$sum": "$positionQuantity" },
                }
            }
        ])

        if (positionDetails.length > 0) {
            let openOrder = await PerpetualOrder.aggregate([
                {
                    "$match": {
                        'pairId': ObjectId(pairId),
                        'userId': ObjectId(userId),
                        'status': { "$in": ['open', 'filled'] },
                        'positionStatus': 'closed',
                        'buyorsell': buyorsell
                    }
                },
                { "$sort": { "price": buyorsell == 'sell' ? 1 : -1 } },
                {
                    "$project": {
                        'price': 1,
                        'quantity': 1,
                        'filledQuantity': 1
                    }
                },
                {
                    "$group": {
                        '_id': null,
                        'orderList': {
                            "$push": {
                                'price': "$price",
                            }
                        },
                        "quantity": {
                            "$sum": {
                                "$subtract": [
                                    "$quantity",
                                    "$filledQuantity"
                                ]
                            }
                        }
                    }
                }
            ])

            return {
                'status': 'POSITIONED',
                'positionQuantity': positionDetails.length > 0 ? positionDetails[0].positionQuantity : 0,
                'orderList': openOrder.length > 0 ? openOrder[0].orderList : [],
                'openQuantity': openOrder.length > 0 ? openOrder[0].quantity : 0,
            }
        }

        return {
            'status': 'NOT_POSITION',
        }

    } catch (err) {
        return {
            'status': 'NOT_POSITION',
        }
    }
}

/** 
 * Limit Order Place
 * METHOD : POST
 * URL : /api/
 * BODY : pairId, buyorsell(buy,sell), leverage, takeProfitPrice, stopLossPrice, typeTIF(GTC,IOC,FOK)
*/
export const limitOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = req.user.id;
        let balanceCheck = false;

        reqBody.price = parseFloat(reqBody.price);
        reqBody.quantity = parseFloat(reqBody.quantity);
        reqBody.leverage = parseFloat(reqBody.leverage);

        let pairData = await PerpetualPair.findOne({ "_id": reqBody.pairId });
        if (!pairData) {
            return res.status(400).json({ "success": false, 'message': "Invalid pair detail" })
        }

        let orderValue = (reqBody.price * reqBody.quantity);
        let orderCost = 0;
        let liquidityPrice = isolatedLiquidationPrice({
            'buyorsell': reqBody.buyorsell,
            'price': reqBody.price,
            'leverage': reqBody.leverage,
            'maintanceMargin': pairData.maintenanceMargin
        })


        if (reqBody.quantity < pairData.minQuantity) {
            return res.status(400).json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + pairData.minQuantity });
        } else if (reqBody.quantity > pairData.maxQuantity) {
            return res.status(400).json({ 'status': false, 'message': "Quantity of contract must not be higher than " + pairData.maxQuantity });
        } else if (reqBody.buyorsell == "buy" && liquidityPrice > reqBody.price) {
            return res.status(400).json({ 'status': false, 'message': "Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be above Mark Price if the order is fulfilled." });
        } else if (reqBody.buyorsell == "sell" && liquidityPrice < reqBody.price) {
            return res.status(400).json({ 'status': false, 'message': "Opening this position may cause immediate liquidation as the system predicts that the position's Liquidation price will be beloww Mark Price if the order is fulfilled." });
        }
        let positionDetails = await checkUserPosition(reqBody.pairId, req.user.id, reqBody.buyorsell)

        if (positionDetails && positionDetails.status == 'POSITIONED') {
            if (positionDetails.orderList && positionDetails.orderList.length > 0) {

                if (reqBody.buyorsell == 'sell') {
                    let positionQuantity = Math.max(0, positionDetails.positionQuantity - positionDetails.openQuantity)

                    if (reqBody.price < positionDetails.orderList[0].price) {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;

                            let remainingQuantity = reqBody.quantity - positionQuantity;

                            orderCost = calculateInverseOrderCost({
                                'price': positionDetails.orderList[0].price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })

                        }
                    } else {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;
                            let remainingQuantity = reqBody.quantity - positionQuantity;
                            orderCost = calculateInverseOrderCost({
                                'price': reqBody.price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })
                        }
                    }
                } else if (reqBody.buyorsell == 'buy') {
                    let positionQuantity = Math.max(0, positionDetails.positionQuantity - positionDetails.openQuantity)

                    if (reqBody.price > positionDetails.orderList[0].price) {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;

                            let remainingQuantity = reqBody.quantity - positionQuantity;

                            orderCost = calculateInverseOrderCost({
                                'price': positionDetails.orderList[0].price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })

                        }
                    } else {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;
                            let remainingQuantity = reqBody.quantity - positionQuantity;
                            orderCost = calculateInverseOrderCost({
                                'price': reqBody.price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })
                        }
                    }
                }
            } else if (positionDetails.orderList && positionDetails.orderList.length == 0) {
                if (reqBody.quantity > positionDetails.positionQuantity) {
                    balanceCheck = true;

                    let remainingQuantity = reqBody.quantity - positionDetails.positionQuantity;
                    orderCost = calculateInverseOrderCost({
                        'price': reqBody.price,
                        'quantity': remainingQuantity,
                        'leverage': reqBody.leverage,
                        'takerFee': pairData.taker_fees,
                        'buyorsell': reqBody.buyorsell
                    })

                }
            }
        } else {
            let openOrder = await PerpetualOrder.aggregate([
                {
                    "$match": {
                        'pairId': ObjectId(reqBody.pairId),
                        'userId': ObjectId(req.user.id),
                        'status': { "$in": ['open', 'filled'] },
                        'positionStatus': 'closed',
                    }
                },
                {
                    "$project": {
                        'buyOrderCost': {
                            "$cond": [
                                { "$eq": ["$buyorsell", "buy"] },
                                "$orderCost",
                                0
                            ]
                        },
                        'sellOrderCost': {
                            "$cond": [
                                { "$eq": ["$buyorsell", "sell"] },
                                "$orderCost",
                                0
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "buyOrderCost": { "$sum": "$buyOrderCost" },
                        "sellOrderCost": { "$sum": "$sellOrderCost" },
                    }
                }
            ])

            if (openOrder && openOrder.length > 0) {
                if (reqBody.buyorsell == 'buy') {
                    let totalBuyOrderCost = openOrder[0].buyOrderCost - openOrder[0].sellOrderCost;
                    if (totalBuyOrderCost >= 0) {
                        balanceCheck = true;
                        orderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                    } else {
                        let givenOrderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })

                        if (givenOrderCost > Math.abs(totalBuyOrderCost)) {
                            balanceCheck = true;
                            orderCost = givenOrderCost - Math.abs(totalBuyOrderCost)
                        }
                    }
                } else if (reqBody.buyorsell == 'sell') {
                    let totalSellOrderCost = openOrder[0].sellOrderCost - openOrder[0].buyOrderCost;
                    if (totalSellOrderCost >= 0) {
                        balanceCheck = true;
                        orderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                    } else {
                        let givenOrderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                        if (givenOrderCost > Math.abs(totalSellOrderCost)) {
                            balanceCheck = true;
                            orderCost = givenOrderCost - Math.abs(totalSellOrderCost)
                        }
                    }
                }
            } else {
                balanceCheck = true;
                orderCost = calculateInverseOrderCost({
                    'price': reqBody.price,
                    'quantity': reqBody.quantity,
                    'leverage': reqBody.leverage,
                    'takerFee': pairData.taker_fees,
                    'buyorsell': reqBody.buyorsell
                })
            }
        }

        let userAsset = await Assets.findOne({ "userId": userId, "currency": pairData.firstCurrencyId });
        if (!userAsset) {
            return res.status(400).json({ 'status': false, 'message': "Wallet not found" });
        }

        if (balanceCheck) {
            if (userAsset.derivativeWallet < orderCost) {
                return res.status(400).json({ 'status': false, 'message': "Due to insuffient balance order cannot be placed" });
            }

            userAsset.derivativeWallet = userAsset.derivativeWallet - toFixed(orderCost, pairData.firstFloatDigit);
            await userAsset.save()
        }

        const newOrder = new PerpetualOrder({
            'pairId': pairData._id,
            'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
            'userId': userId,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'secondCurrencyId': pairData.secondCurrencyId,
            'secondCurrency': pairData.secondCurrencySymbol,
            'buyorsell': reqBody.buyorsell,
            'orderType': reqBody.orderType,
            'price': reqBody.price,
            'quantity': reqBody.quantity,
            'liquidityPrice': liquidityPrice,
            'leverage': reqBody.leverage,
            'orderValue': orderValue,
            'orderCost': calculateInverseOrderCost({
                'price': reqBody.price,
                'quantity': reqBody.quantity,
                'leverage': reqBody.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': reqBody.buyorsell
            }),
            'orderDate': new Date(),
            'takerFee': pairData.taker_fees,
            'takeProfitPrice': reqBody.takeProfitPrice,
            'stopLossPrice': reqBody.stopLossPrice,
            'typeTIF': reqBody.typeTIF,
            'status': 'open',
        });

        let newOrderData = await newOrder.save();

        tradeList(newOrderData, pairData)
        getOpenOrderSocket(newOrderData.userId, newOrderData.pairId)
        getOrderBookSocket(newOrderData.pairId)
        getTradeHistorySocket(newOrderData.userId, newOrderData.pairId)

        return res.status(200).json({ 'status': false, 'message': "Your order placed successfully." });

    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured." });
    }
}

/** 
 * Trade list data
*/
export const tradeList = async (newOrder, pairData) => {
    try {
        let matchQuery = {
            "$or": [
                { "status": "open" },
                { "status": "pending" }
            ],
            "userId": { "$ne": ObjectId(newOrder.userId) },
            "pairId": ObjectId(newOrder.pairId)
        };

        let sortQuery = { "price": 1 }

        if (newOrder.buyorsell == 'buy') {
            matchQuery['buyorsell'] = 'sell';
            matchQuery['price'] = { "$lte": newOrder.price };
        } else if (newOrder.buyorsell == 'sell') {
            matchQuery['buyorsell'] = 'buy';
            matchQuery['price'] = { "$gte": newOrder.price };
            sortQuery = { "price": -1 }
        }

        let orderList = await PerpetualOrder.aggregate([
            { '$match': matchQuery },
            { '$sort': sortQuery },
            { '$limit': 50 },
        ])

        if (newOrder.typeTIF == 'FOK') {
            let orderBookQuantity = 0;
            for (let orderBookData of orderList) {
                orderBookQuantity = orderBookQuantity + (orderBookData.quantity - orderBookData.filledQuantity)
            }
            if (orderBookQuantity < newOrder.quantity) {
                console.log("Fill or Kill")
                newOrder.status = 'cancel'
                await newOrder.save();

                await ordercancelTIF(newOrder, pairData);
                return false
            }
        }

        if (orderList && orderList.length > 0) {
            return await tradeMatching(newOrder, orderList, 0, pairData)
        } else {
            console.log("No trade record")
            return false
        }

        return true

    } catch (err) {
        console.log("Error on Trade match ", err)
        return false
    }
}

/** 
 * Market Order Place
 * METHOD : POST
 * URL : /api/
 * BODY : pairId, buyorsell(buy,sell), quantity, leverage, takeProfitPrice, stopLossPrice
*/
export const marketOrderPlace = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = req.user.id;
        let balanceCheck = false;

        // reqBody.price = parseFloat(reqBody.price);
        reqBody.quantity = parseFloat(reqBody.quantity);
        reqBody.leverage = parseFloat(reqBody.leverage);

        let pairData = await PerpetualPair.findOne({ "_id": reqBody.pairId });
        if (!pairData) {
            return res.status(400).json({ "success": false, 'message': "Invalid pair detail" })
        }

        if (reqBody.quantity < pairData.minQuantity) {
            return res.status(400).json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + pairData.minQuantity });
        } else if (reqBody.quantity > pairData.maxQuantity) {
            return res.status(400).json({ 'status': false, 'message': "Quantity of contract must not be higher than " + pairData.maxQuantity });
        }

        let userAsset = await Assets.findOne({ "userId": userId, "currency": pairData.firstCurrencyId });
        if (!userAsset) {
            return res.status(400).json({ 'status': false, 'message': "Wallet not found" });
        }

        let perpetualOrder = await PerpetualOrder.aggregate([
            {
                "$match": {
                    'pairId': ObjectId(reqBody.pairId),
                    'userId': { "$ne": ObjectId(req.user.id) },
                    'status': { "$in": ['open', 'pending'] },
                    'buyorsell': reqBody.buyorsell == 'buy' ? "sell" : "buy"
                }
            },
            {
                "$facet": {
                    "orderList": [
                        { "$sort": { 'price': reqBody.buyorsell == 'buy' ? 1 : -1 } },
                        { "$limit": 100 },
                    ],
                    "orderBook": [
                        {
                            "$group": {
                                '_id': '$price',
                                'quantity': { '$sum': '$quantity' },
                                'filledQuantity': { '$sum': '$filledQuantity' },
                            }
                        },
                        { "$sort": { '_id': reqBody.buyorsell == 'buy' ? 1 : -1 } },
                        { "$limit": 100 },
                    ]
                }
            },
        ])

        if ((perpetualOrder && perpetualOrder.length == 0) || (perpetualOrder[0].orderBook && perpetualOrder[0].orderBook.length == 0)) {
            return res.status(400).json({ 'status': false, 'message': "NO_ORDER" });
        }

        let orderBookQuantity = 0, orderBookPrice = 0;
        for (const key in perpetualOrder[0].orderBook) {
            let item = perpetualOrder[0].orderBook[key];
            orderBookQuantity = orderBookQuantity + (item.quantity - item.filledQuantity);

            if (orderBookQuantity >= reqBody.quantity) {
                orderBookPrice = item._id;
                break;
            } else if (key == (perpetualOrder[0].orderBook.length - 1)) {
                orderBookPrice = item._id;;
            }
        }


        reqBody.price = parseFloat(orderBookPrice);

        let orderValue = (reqBody.price * reqBody.quantity);
        let orderCost = 0;
        let liquidityPrice = isolatedLiquidationPrice({
            'buyorsell': reqBody.buyorsell,
            'price': reqBody.price,
            'leverage': reqBody.leverage,
            'maintanceMargin': pairData.maintenanceMargin
        })

        let positionDetails = await checkUserPosition(reqBody.pairId, req.user.id, reqBody.buyorsell)

        if (positionDetails && positionDetails.status == 'POSITIONED') {
            if (positionDetails.orderList && positionDetails.orderList.length > 0) {

                if (reqBody.buyorsell == 'sell') {
                    let positionQuantity = Math.max(0, positionDetails.positionQuantity - positionDetails.openQuantity)

                    if (reqBody.price < positionDetails.orderList[0].price) {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;

                            let remainingQuantity = reqBody.quantity - positionQuantity;

                            orderCost = calculateInverseOrderCost({
                                'price': positionDetails.orderList[0].price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })

                        }
                    } else {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;
                            let remainingQuantity = reqBody.quantity - positionQuantity;
                            orderCost = calculateInverseOrderCost({
                                'price': reqBody.price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })
                        }
                    }
                } else if (reqBody.buyorsell == 'buy') {
                    let positionQuantity = Math.max(0, positionDetails.positionQuantity - positionDetails.openQuantity)

                    if (reqBody.price > positionDetails.orderList[0].price) {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;

                            let remainingQuantity = reqBody.quantity - positionQuantity;

                            orderCost = calculateInverseOrderCost({
                                'price': positionDetails.orderList[0].price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })

                        }
                    } else {
                        if (reqBody.quantity > positionQuantity) {
                            balanceCheck = true;
                            let remainingQuantity = reqBody.quantity - positionQuantity;
                            orderCost = calculateInverseOrderCost({
                                'price': reqBody.price,
                                'quantity': remainingQuantity,
                                'leverage': reqBody.leverage,
                                'takerFee': pairData.taker_fees,
                                'buyorsell': reqBody.buyorsell
                            })
                        }
                    }
                }
            } else if (positionDetails.orderList && positionDetails.orderList.length == 0) {
                if (reqBody.quantity > positionDetails.positionQuantity) {
                    balanceCheck = true;

                    let remainingQuantity = reqBody.quantity - positionDetails.positionQuantity;
                    orderCost = calculateInverseOrderCost({
                        'price': reqBody.price,
                        'quantity': remainingQuantity,
                        'leverage': reqBody.leverage,
                        'takerFee': pairData.taker_fees,
                        'buyorsell': reqBody.buyorsell
                    })

                }
            }
        } else {
            let openOrder = await PerpetualOrder.aggregate([
                {
                    "$match": {
                        'pairId': ObjectId(reqBody.pairId),
                        'userId': ObjectId(req.user.id),
                        'status': { "$in": ['open', 'filled'] },
                        'positionStatus': 'closed',
                    }
                },
                {
                    "$project": {
                        'buyOrderCost': {
                            "$cond": [
                                { "$eq": ["$buyorsell", "buy"] },
                                "$orderCost",
                                0
                            ]
                        },
                        'sellOrderCost': {
                            "$cond": [
                                { "$eq": ["$buyorsell", "sell"] },
                                "$orderCost",
                                0
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "buyOrderCost": { "$sum": "$buyOrderCost" },
                        "sellOrderCost": { "$sum": "$sellOrderCost" },
                    }
                }
            ])

            if (openOrder && openOrder.length > 0) {
                if (reqBody.buyorsell == 'buy') {
                    let totalBuyOrderCost = openOrder[0].buyOrderCost - openOrder[0].sellOrderCost;
                    if (totalBuyOrderCost >= 0) {
                        balanceCheck = true;
                        orderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                    } else {
                        let givenOrderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })

                        if (givenOrderCost > Math.abs(totalBuyOrderCost)) {
                            balanceCheck = true;
                            orderCost = givenOrderCost - Math.abs(totalBuyOrderCost)
                        }
                    }
                } else if (reqBody.buyorsell == 'sell') {
                    let totalSellOrderCost = openOrder[0].sellOrderCost - openOrder[0].buyOrderCost;
                    if (totalSellOrderCost >= 0) {
                        balanceCheck = true;
                        orderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                    } else {
                        let givenOrderCost = calculateInverseOrderCost({
                            'price': reqBody.price,
                            'quantity': reqBody.quantity,
                            'leverage': reqBody.leverage,
                            'takerFee': pairData.taker_fees,
                            'buyorsell': reqBody.buyorsell
                        })
                        if (givenOrderCost > Math.abs(totalSellOrderCost)) {
                            balanceCheck = true;
                            orderCost = givenOrderCost - Math.abs(totalSellOrderCost)
                        }
                    }
                }
            } else {
                balanceCheck = true;
                orderCost = calculateInverseOrderCost({
                    'price': reqBody.price,
                    'quantity': reqBody.quantity,
                    'leverage': reqBody.leverage,
                    'takerFee': pairData.taker_fees,
                    'buyorsell': reqBody.buyorsell
                })
            }
        }

        if (balanceCheck) {
            if (userAsset.derivativeWallet < orderCost) {
                return res.status(400).json({ 'status': false, 'message': "Due to insuffient balance order cannot be placed" });
            }

            userAsset.derivativeWallet = userAsset.derivativeWallet - toFixed(orderCost, pairData.firstFloatDigit);
            await userAsset.save()
        }

        const newOrder = new PerpetualOrder({
            'pairId': pairData._id,
            'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
            'userId': userId,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'secondCurrencyId': pairData.secondCurrencyId,
            'secondCurrency': pairData.secondCurrencySymbol,
            'buyorsell': reqBody.buyorsell,
            'orderType': reqBody.orderType,
            'price': reqBody.price,
            'quantity': reqBody.quantity,
            'liquidityPrice': liquidityPrice,
            'leverage': reqBody.leverage,
            'orderValue': orderValue,
            'orderCost': calculateInverseOrderCost({
                'price': reqBody.price,
                'quantity': reqBody.quantity,
                'leverage': reqBody.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': reqBody.buyorsell
            }),
            'orderDate': new Date(),
            'takerFee': pairData.taker_fees,
            'takeProfitPrice': reqBody.takeProfitPrice,
            'stopLossPrice': reqBody.stopLossPrice,
            'status': 'open',
        });

        let newOrderData = await newOrder.save();

        let matchStatus = await tradeMatching(newOrderData, perpetualOrder[0].orderList, 0, pairData)
        if (!matchStatus) {
            return res.status(400).json({ 'status': false, 'message': "Market order match error" });
        }

        // tradeList(newOrderData, pairData)
        // getOpenOrderSocket(newOrderData.userId, newOrderData.pairId)
        // getOrderBookSocket(newOrderData.pairId)
        // getTradeHistorySocket(newOrderData.userId, newOrderData.pairId)

        return res.status(200).json({ 'status': false, 'message': "Your order placed successfully." });

    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': "Error occured." });
    }
}

/** 
 * Trade matching
*/
export const tradeMatching = async (newOrder, orderData, count = 0, pairData) => {
    try {
        if (!['open', 'pending'].includes(newOrder.status)) {
            return true;
        } else if (isEmpty(orderData[count])) {
            if (newOrder.orderType == 'limit' && newOrder.typeTIF == 'IOC') {
                await ordercancelTIF(newOrder, pairData);
            }
            return true;
        }

        let uniqueId = Math.floor(Math.random() * 1000000000);

        let newOrderQuantity = newOrder.quantity - newOrder.filledQuantity;
        let orderDataQuantity = orderData[count].quantity - orderData[count].filledQuantity;

        if (newOrderQuantity == orderDataQuantity) {
            let price = newOrder.buyorsell == 'buy' ? orderData[count].price : newOrder.price;

            /* New Order */
            let takerOrderValue = price * newOrderQuantity;
            let takerFee = takerOrderValue * (pairData.taker_fees / 100);
            let takerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': newOrderQuantity,
                'leverage': newOrder.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': newOrder.buyorsell
            })

            let newOrderUpdate = await await PerpetualOrder.findOneAndUpdate({
                '_id': newOrder._id
            }, {
                'status': 'completed',
                'filledQuantity': newOrder.filledQuantity + newOrderQuantity,
                "$push": {
                    "filled": {
                        "pairId": newOrder.pairId,
                        "sellUserId": newOrder.buyorsell == 'sell' ? newOrder.userId : orderData[count].userId,
                        "buyUserId": newOrder.buyorsell == 'buy' ? newOrder.userId : orderData[count].userId,
                        "userId": newOrder.userId,
                        "sellOrderId": newOrder.buyorsell == 'sell' ? newOrder._id : orderData[count]._id,
                        "buyOrderId": newOrder.buyorsell == 'buy' ? newOrder._id : orderData[count]._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": newOrderQuantity,
                        "Fees": takerFee,
                        "status": "filled",
                        "Type": newOrder.buyorsell,
                        "createdAt": new Date(),
                        "orderValue": takerOrderValue,
                        "orderCost": takerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(newOrderUpdate, price, newOrderQuantity, pairData)
            await getOpenOrderSocket(newOrder.userId, newOrder.pairId)
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId)
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId)
            await getPositionOrderSocket(pairData, newOrder.userId)


            /* Order Book */
            let makerOrderValue = price * orderDataQuantity;
            let makerFee = makerOrderValue * (pairData.maker_rebate / 100);
            let makerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': orderDataQuantity,
                'leverage': orderData[count].leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': orderData[count].buyorsell
            })

            let orderBookUpdate = await PerpetualOrder.findOneAndUpdate({
                '_id': orderData[count]._id
            }, {
                'status': 'completed',
                'filledQuantity': orderData[count].filledQuantity + orderDataQuantity,
                "$push": {
                    "filled": {
                        "pairId": orderData[count].pairId,
                        "sellUserId": orderData[count].buyorsell == 'sell' ? orderData[count].userId : newOrder.userId,
                        "buyUserId": orderData[count].buyorsell == 'buy' ? orderData[count].userId : newOrder.userId,
                        "userId": orderData[count].userId,
                        "sellOrderId": orderData[count].buyorsell == 'sell' ? orderData[count]._id : newOrder._id,
                        "buyOrderId": orderData[count].buyorsell == 'buy' ? orderData[count]._id : newOrder._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": orderDataQuantity,
                        "Fees": makerFee,
                        "status": "filled",
                        "Type": orderData[count].buyorsell,
                        "createdAt": new Date(),
                        "orderValue": makerOrderValue,
                        "orderCost": makerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(orderBookUpdate, price, orderDataQuantity, pairData)
            await getOpenOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getTradeHistorySocket(orderData[count].userId, orderData[count].pairId)
            await getPositionOrderSocket(pairData, orderData[count].userId)

            await getOrderBookSocket(orderData[count].pairId)
            await marketPriceSocket(orderData[count].pairId)

            return true
        } else if (newOrderQuantity < orderDataQuantity) {
            let price = newOrder.buyorsell == 'buy' ? orderData[count].price : newOrder.price;

            /* New Order */
            let takerOrderValue = price * newOrderQuantity;
            let takerRequiredMargin = takerOrderValue / newOrder.leverage;
            let takerFee = takerOrderValue * (pairData.taker_fees / 100);
            let takerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': newOrderQuantity,
                'leverage': newOrder.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': newOrder.buyorsell
            })

            let newOrderUpdate = await PerpetualOrder.findOneAndUpdate({
                '_id': newOrder._id
            }, {
                'status': 'completed',
                'filledQuantity': newOrder.filledQuantity + newOrderQuantity,
                "$push": {
                    "filled": {
                        "pairId": newOrder.pairId,
                        "sellUserId": newOrder.buyorsell == 'sell' ? newOrder.userId : orderData[count].userId,
                        "buyUserId": newOrder.buyorsell == 'buy' ? newOrder.userId : orderData[count].userId,
                        "userId": newOrder.userId,
                        "sellOrderId": newOrder.buyorsell == 'sell' ? newOrder._id : orderData[count]._id,
                        "buyOrderId": newOrder.buyorsell == 'buy' ? newOrder._id : orderData[count]._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": newOrderQuantity,
                        "Fees": takerFee,
                        "status": "filled",
                        "Type": newOrder.buyorsell,
                        "createdAt": new Date(),
                        "orderValue": takerOrderValue,
                        "orderCost": takerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(newOrderUpdate, price, newOrderQuantity, pairData)
            await getOpenOrderSocket(newOrder.userId, newOrder.pairId)
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId)
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId)
            await getPositionOrderSocket(pairData, newOrder.userId)

            /* Order Book */
            let makerOrderValue = price * newOrderQuantity;
            let makerRequiredMargin = makerOrderValue / orderData[count].leverage;
            let makerFee = makerOrderValue * (pairData.maker_rebate / 100);
            let makerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': orderDataQuantity,
                'leverage': orderData[count].leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': orderData[count].buyorsell
            })

            let orderBookUpdate = await PerpetualOrder.findOneAndUpdate({
                '_id': orderData[count]._id
            }, {
                'status': 'pending',
                'filledQuantity': orderData[count].filledQuantity + newOrderQuantity,
                "$push": {
                    "filled": {
                        "pairId": orderData[count].pairId,
                        "sellUserId": orderData[count].buyorsell == 'sell' ? orderData[count].userId : newOrder.userId,
                        "buyUserId": orderData[count].buyorsell == 'buy' ? orderData[count].userId : newOrder.userId,
                        "userId": orderData[count].userId,
                        "sellOrderId": orderData[count].buyorsell == 'sell' ? orderData[count]._id : newOrder._id,
                        "buyOrderId": orderData[count].buyorsell == 'buy' ? orderData[count]._id : newOrder._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": newOrderQuantity,
                        "Fees": makerFee,
                        "status": "filled",
                        "Type": orderData[count].buyorsell,
                        "createdAt": new Date(),
                        "orderValue": makerOrderValue,
                        "orderCost": makerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(orderBookUpdate, price, newOrderQuantity, pairData)
            await getOpenOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getTradeHistorySocket(orderData[count].userId, orderData[count].pairId)
            await getPositionOrderSocket(pairData, orderData[count].userId)

            await getOrderBookSocket(orderData[count].pairId)
            await marketPriceSocket(orderData[count].pairId)

            return true
        } else if (newOrderQuantity > orderDataQuantity) {
            let price = newOrder.buyorsell == 'buy' ? orderData[count].price : newOrder.price;

            /* New Order */
            let takerOrderValue = price * orderDataQuantity;
            let takerFee = takerOrderValue * (pairData.taker_fees / 100);
            let takerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': orderDataQuantity,
                'leverage': newOrder.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': newOrder.buyorsell
            })

            let newOrderUpdate = await PerpetualOrder.findOneAndUpdate({
                '_id': newOrder._id
            }, {
                'status': 'pending',
                'filledQuantity': newOrder.filledQuantity + orderDataQuantity,
                "$push": {
                    "filled": {
                        "pairId": newOrder.pairId,
                        "sellUserId": newOrder.buyorsell == 'sell' ? newOrder.userId : orderData[count].userId,
                        "buyUserId": newOrder.buyorsell == 'buy' ? newOrder.userId : orderData[count].userId,
                        "userId": newOrder.userId,
                        "sellOrderId": newOrder.buyorsell == 'sell' ? newOrder._id : orderData[count]._id,
                        "buyOrderId": newOrder.buyorsell == 'buy' ? newOrder._id : orderData[count]._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": orderDataQuantity,
                        "Fees": takerFee,
                        "status": "filled",
                        "Type": newOrder.buyorsell,
                        "createdAt": new Date(),
                        "orderValue": takerOrderValue,
                        "orderCost": takerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(newOrderUpdate, price, orderDataQuantity, pairData)
            await getOpenOrderSocket(newOrder.userId, newOrder.pairId)
            await getFilledOrderSocket(newOrder.userId, newOrder.pairId)
            await getTradeHistorySocket(newOrder.userId, newOrder.pairId)
            await getPositionOrderSocket(pairData, newOrder.userId)

            /* Order Book */
            let makerOrderValue = price * orderDataQuantity;
            let makerFee = makerOrderValue * (pairData.maker_rebate / 100);
            let makerOrderCost = calculateInverseOrderCost({
                'price': price,
                'quantity': orderDataQuantity,
                'leverage': orderData[count].leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': orderData[count].buyorsell
            })

            let orderBookUpdate = await PerpetualOrder.findOneAndUpdate({
                '_id': orderData[count]._id
            }, {
                'status': 'completed',
                'filledQuantity': orderData[count].filledQuantity + orderDataQuantity,
                "$push": {
                    "filled": {
                        "pairId": orderData[count].pairId,
                        "sellUserId": orderData[count].buyorsell == 'sell' ? orderData[count].userId : newOrder.userId,
                        "buyUserId": orderData[count].buyorsell == 'buy' ? orderData[count].userId : newOrder.userId,
                        "userId": orderData[count].userId,
                        "sellOrderId": orderData[count].buyorsell == 'sell' ? orderData[count]._id : newOrder._id,
                        "buyOrderId": orderData[count].buyorsell == 'buy' ? orderData[count]._id : newOrder._id,
                        "uniqueId": uniqueId,
                        "price": price,
                        "filledQuantity": orderDataQuantity,
                        "Fees": makerFee,
                        "status": "filled",
                        "Type": orderData[count].buyorsell,
                        "createdAt": new Date(),
                        "orderValue": makerOrderValue,
                        "orderCost": makerOrderCost
                    }
                }
            }, { 'new': true });

            await positionMatching(orderBookUpdate, price, orderDataQuantity, pairData)
            await getOpenOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getFilledOrderSocket(orderData[count].userId, orderData[count].pairId)
            await getTradeHistorySocket(orderData[count].userId, orderData[count].pairId)
            await getPositionOrderSocket(pairData, orderData[count].userId)

            await getOrderBookSocket(orderData[count].pairId)
            await marketPriceSocket(orderData[count].pairId)

            return await tradeMatching(newOrderUpdate, orderData, count = count + 1, pairData)
        }

    } catch (err) {
    }
}

/** 
 * Position Matching
*/
export const positionMatching = async (orderDetail, price, quantity, pairData) => {
    try {
        // if (quantity == 0) {
        //     return true
        // }

        let positionDetails = await PerpetualOrder.findOne({
            'pairId': orderDetail.pairId,
            'userId': orderDetail.userId,
            // 'status': { "$in": ['pending', 'completed', 'cancel'] },
            'positionStatus': 'open',
            // 'buyorsell': orderDetail.buyorsell,
            'buyorsell': orderDetail.buyorsell == 'buy' ? 'sell' : 'buy'
        })

        if (!positionDetails) {
            orderDetail.positionStatus = 'open';
            orderDetail.positionQuantity = orderDetail.positionQuantity + quantity;
            await orderDetail.save();
            return true
        }

        let positionQuantity = positionDetails.positionQuantity;

        if (positionQuantity == quantity) {
            positionDetails.positionQuantity = 0;
            positionDetails.positionStatus = 'closed';
            await positionDetails.save();

            let sellOrderPrice = orderDetail.buyorsell == 'buy' ? positionDetails.price : price
            let buyOrderPrice = orderDetail.buyorsell == 'buy' ? price : positionDetails.price

            let orderCost = calculateInverseOrderCost({
                'price': positionDetails.price,
                'quantity': quantity,
                'leverage': positionDetails.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': positionDetails.buyorsell == 'buy' ? 'sell' : 'buy'
            }) + ((quantity / sellOrderPrice) - (quantity / buyOrderPrice));

            orderCost = orderCost - (orderCost * (pairData.taker_fees / 100));

            await assetUpdate({
                'currencyId': orderDetail.firstCurrencyId,
                'userId': orderDetail.userId,
                'balance': orderCost
            })

            return true
        } else if (positionQuantity > quantity) {
            positionDetails.positionQuantity = positionQuantity - quantity;
            await positionDetails.save();

            let orderCost = calculateInverseOrderCost({
                'price': positionDetails.price,
                'quantity': quantity,
                'leverage': positionDetails.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': positionDetails.buyorsell == 'buy' ? 'sell' : 'buy'
            }) + ((quantity / sellOrderPrice) - (quantity / buyOrderPrice));

            orderCost = orderCost - (orderCost * (pairData.taker_fees / 100));

            await assetUpdate({
                'currencyId': orderDetail.firstCurrencyId,
                'userId': orderDetail.userId,
                'balance': orderCost
            })

            return true
        } else if (positionQuantity < quantity) {
            positionDetails.positionQuantity = 0;
            positionDetails.positionStatus = 'closed';
            await positionDetails.save();

            let orderCost = calculateInverseOrderCost({
                'price': positionDetails.price,
                'quantity': quantity - positionQuantity,
                'leverage': positionDetails.leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': positionDetails.buyorsell == 'buy' ? 'sell' : 'buy'
            }) + ((quantity / sellOrderPrice) - (quantity / buyOrderPrice));

            orderCost = orderCost - (orderCost * (pairData.taker_fees / 100));

            await assetUpdate({
                'currencyId': orderDetail.firstCurrencyId,
                'userId': orderDetail.userId,
                'balance': orderCost
            })

            return await positionMatching(orderDetail, price, quantity - positionQuantity, pairData)
        }
        return true
    } catch (err) {
        return false
    }
}

/** 
 * Get Order Book
 * URL : /api/perpetual/ordeBook/:{{pairId}}
 * METHOD : GET
 * PARAMS : pairId
*/
export const getOrderBook = async (req, res) => {
    try {
        let result = await orderBookData({
            'pairId': req.params.pairId
        })

        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/** 
 * Get Order Book Socket
 * PARAMS : pairId
*/
export const getOrderBookSocket = async (pairId) => {
    try {
        let result = await orderBookData({
            'pairId': pairId
        })

        result['pairId'] = pairId;
        socketEmitAll('perpetualOrderBook', result)
        return true
    } catch (err) {
        return false
    }
}

export const orderBookData = async ({ pairId }) => {
    try {
        let buyOrder = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "pairId": ObjectId(pairId),
                    "$or": [
                        { "status": "open" },
                        { "status": "pending" },
                    ],
                    'buyorsell': 'buy'
                }
            },
            {
                "$group": {
                    '_id': "$price",
                    'quantity': { "$sum": "$quantity" },
                    'filledQuantity': { "$sum": "$filledQuantity" },
                }
            },
            { "$sort": { "_id": -1 } },
            { "$limit": 10 }
        ])

        let sellOrder = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "pairId": ObjectId(pairId),
                    "$or": [
                        { "status": "open" },
                        { "status": "pending" },
                    ],
                    'buyorsell': 'sell'
                }
            },
            {
                "$group": {
                    '_id': "$price",
                    'quantity': { "$sum": "$quantity" },
                    'filledQuantity': { "$sum": "$filledQuantity" },
                }
            },
            { "$sort": { "_id": 1 } },
            { "$limit": 10 }
        ])

        if (buyOrder.length > 0) {
            let sumamount = 0
            for (let i = 0; i < buyOrder.length; i++) {
                let quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledQuantity);
                sumamount = parseFloat(sumamount) + parseFloat(quantity);
                buyOrder[i].total = sumamount;
                buyOrder[i].quantity = quantity;
            }
        }

        if (sellOrder.length > 0) {
            let sumamount = 0
            for (let i = 0; i < sellOrder.length; i++) {
                let quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledQuantity);
                sumamount = parseFloat(sumamount) + parseFloat(quantity);
                sellOrder[i].total = sumamount;
                sellOrder[i].quantity = quantity;
            }
        }
        sellOrder = sellOrder.reverse();

        return {
            buyOrder,
            sellOrder
        }

    } catch (err) {
        return {
            buyOrder: [],
            sellOrder: []
        }

    }
}

/**
 * Get User Open Order
 * URL : /api/perpetual/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getOpenOrder = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);

        let count = await PerpetualOrder.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
            "status": { "$in": ['open', 'pending', 'conditional'] }
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": { "$in": ['open', 'pending', 'conditional'] }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "status": 1
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            'nextPage': pagination.page + 1,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Open Order Socket
 * userId, pairId
*/
export const getOpenOrderSocket = async (userId, pairId) => {
    try {
        let count = await PerpetualOrder.countDocuments({
            "userId": userId,
            'pairId': pairId,
            "status": { "$in": ['open', 'pending', 'conditional'] }
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": { "$in": ['open', 'pending', 'conditional'] }
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "status": 1
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            'nextPage': 2,
            'limit': 10,
            data
        }

        socketEmitOne('perpetualOpenOrder', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/**
 * Get User Filled Order
 * URL : /api/perpetual/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getFilledOrder = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);

        let count = await PerpetualOrder.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
            "status": 'completed'
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                    "status": 'completed'
                }
            },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            'nextPage': pagination.page + 1,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Filled Order Socket
 * userId, pairId
*/
export const getFilledOrderSocket = async (userId, pairId) => {
    try {
        let count = await PerpetualOrder.countDocuments({
            "userId": userId,
            'pairId': pairId,
            "status": 'completed'
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                    "status": 'completed'
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            'nextPage': 2,
            'limit': 10,
            data
        }
        socketEmitOne('perpetualFilledOrder', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/**
 * Get User Trade History
 * URL : /api/perpetual/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
*/
export const getTradeHistory = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let count = await PerpetualOrder.countDocuments({
            "userId": req.user.id,
            'pairId': req.params.pairId,
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    'pairId': ObjectId(req.params.pairId),
                }
            },
            { "$sort": { '_id': -1 } },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "status": 1,
                }
            }
        ])

        let result = {
            count,
            'currentPage': pagination.page,
            'nextPage': pagination.page + 1,
            'limit': pagination.limit,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get User Trade History Socket
*/
export const getTradeHistorySocket = async (userId, pairId) => {
    try {
        let count = await PerpetualOrder.countDocuments({
            "userId": userId,
            'pairId': pairId,
        });
        let data = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(userId),
                    'pairId': ObjectId(pairId),
                }
            },
            { "$sort": { '_id': -1 } },
            { "$limit": 10 },
            {
                "$project": {
                    "orderDate": {
                        "$dateToString": {
                            "date": '$orderDate',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "orderType": 1,
                    "buyorsell": 1,
                    "price": 1,
                    "quantity": 1,
                    "filledQuantity": 1,
                    "orderValue": 1,
                    "status": 1
                }
            }
        ])

        let result = {
            pairId,
            count,
            'currentPage': 1,
            'nextPage': 2,
            'limit': 10,
            data
        }
        socketEmitOne('perpetualTradeHistory', result, userId)
        return true
    } catch (err) {
        return false
    }
}

/** 
 * Get User Position Order
 * URL : /api/perpetual/positionOrder/{{pairId}}
 * METHOD : GET
 * PARAMS : pairId
*/
export const getPositionOrder = async (req, res) => {
    try {
        let pairData = await PerpetualPair.findOne({ "_id": req.params.pairId })
        if (!pairData) {
            return res.status(400).json({ 'success': false, 'message': "NOT_PAIR" })
        }
        let positionOrder = await userPositionOrder(pairData, req.user.id);

        if (positionOrder.status) {
            return res.status(200).json({ 'success': true, 'result': positionOrder.result })
        }
        return res.status(400).json({ 'success': false, 'message': "NOT_POSITION" })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Something went worng" })
    }
}

/** 
 * Get Position Order Socket
*/
export const getPositionOrderSocket = async (pairData, userId) => {
    try {
        let positionOrder = await userPositionOrder(pairData, userId);
        if (positionOrder.status) {
            let result = {
                "pairId": pairData._id,
                "data": positionOrder.result
            }
            socketEmitOne('perpetualPositionOrder', result, userId)
            return true
        }
        return false
    } catch (err) {
        return false
    }
}
export const userPositionOrder = async (pairData, userId) => {
    try {
        let positionDetails = await PerpetualOrder.aggregate([
            {
                "$match": {
                    'pairId': ObjectId(pairData._id),
                    'userId': ObjectId(userId),
                    'status': { "$in": ['pending', 'completed', 'cancel'] },
                    'positionStatus': 'open',
                    // 'buyorsell': reqBody.buyorsell == 'buy' ? 'sell' : 'buy'
                }
            },
            {
                "$project": {
                    "pairName": 1,
                    "positionQuantity": 1,
                    "marginImpact": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.orderCost"] }
                            }
                        }
                    },
                    "price": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.price"] }
                            }
                        }
                    },
                    "buyorsell": {
                        "$cond": [
                            { "$eq": ["$buyorsell", 'buy'] }, 'sell', 'buy'
                        ]
                    },
                    "leverage": 1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "initialMargin": { "$literal": 0 },
                    "positionMargin": { "$literal": 0 },
                    "liquidityPrice": { "$literal": 0 },
                    "taker_fees": { "$literal": pairData.taker_fees }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "firstCurrency": { "$first": "$firstCurrency" },
                    "secondCurrency": { "$first": "$secondCurrency" },
                    "positionQuantity": { "$sum": "$positionQuantity" },
                    "price": { "$avg": "$price" },
                    "buyorsell": { "$first": "$buyorsell" },
                    "leverage": { "$last": "$leverage" },
                    "positionMargin": { "$first": "$liquidityPrice" },
                    "liquidityPrice": { "$first": "$liquidityPrice" },
                    "taker_fees": { "$first": "$taker_fees" },

                }
            }
        ])

        if (positionDetails && positionDetails.length > 0) {

            positionDetails[0].positionMargin = inversePositionMargin({
                'price': positionDetails[0].price,
                'quantity': positionDetails[0].positionQuantity,
                'leverage': positionDetails[0].leverage,
                'takerFee': pairData.taker_fees,
                'buyorsell': positionDetails[0].buyorsell,
            })

            positionDetails[0].liquidityPrice = isolatedLiquidationPrice({
                'buyorsell': positionDetails[0].buyorsell,
                'price': positionDetails[0].price,
                'leverage': positionDetails[0].leverage,
                'maintanceMargin': pairData.maintenanceMargin,
            })

            return {
                status: true,
                result: positionDetails[0]
            }
        }
        return {
            status: false,
        }
    } catch (err) {
        return {
            status: false,
        }
    }
}

/**
 * Get market price
 * URL : /api/spot/marketPrice/{{pairId}}
 * METHOD : GET
*/
export const getMarketPrice = async (req, res) => {
    try {
        let tickerPrice = await marketPrice(req.params.pairId)
        if (tickerPrice.status) {
            return res.status(200).json({ 'success': true, 'result': tickerPrice.result })
        }
        return res.status(409).json({ 'success': false })

    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/**
 * Get market price socket
 * pairId
*/
export const marketPriceSocket = async (pairId) => {
    try {
        let tickerPrice = await marketPrice(pairId)
        if (tickerPrice.status) {
            socketEmitAll('perpetualMarketPrice', {
                pairId,
                'data': tickerPrice.result
            })
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export const marketPrice = async (pairId) => {
    try {
        let pairData = await PerpetualPair.findOne({ "_id": pairId });
        if (pairData) {
            if (pairData.botstatus == 'off') {

                let ticker24hrs = await PerpetualOrder.aggregate([
                    {
                        "$match": {
                            "pairId": ObjectId(pairId),
                            "buyorsell": "sell",
                            "status": { "$in": ['pending', 'completed'] },
                        }
                    },
                    { "$unwind": "$filled" },
                    {
                        "$match": {
                            "filled.createdAt": {
                                "$gte": new Date(Date.now() - 24 * 60 * 60 * 1000),
                                "$lte": new Date()
                            },
                        }
                    },
                    {
                        "$sort": { 'filled.createdAt': 1 }
                    },
                    {
                        "$group": {
                            "_id": null,
                            'open': { "$first": '$filled.price' },
                            'close': { "$last": '$filled.price' },
                            'high': { "$max": '$filled.price' },
                            'low': { "$min": '$filled.price' },
                            'firstVolume': { "$sum": "$filled.filledQuantity" },
                            'secondVolume': { "$sum": "$filled.order_value" }
                        }
                    },
                    {
                        "$project": {
                            "low": 1,
                            "high": 1,
                            "firstVolume": 1,
                            "secondVolume": 1,
                            "changePrice": {
                                "$subtract": [
                                    { "$cond": [{ "$eq": ["$close", null] }, 0, '$close'] },
                                    { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                ]
                            },
                            "changePercentage": {
                                "$multiply": [
                                    {
                                        "$divide": [
                                            {
                                                "$subtract": [
                                                    { "$cond": [{ "$eq": ["$close", null] }, 0, '$close'] },
                                                    { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                                ]
                                            },
                                            { "$cond": [{ "$eq": ["$open", null] }, 0, '$open'] },
                                        ]
                                    },
                                    100
                                ]

                            }
                        }
                    },
                ])

                if (ticker24hrs.length > 0) {
                    pairData.low = ticker24hrs[0].low;
                    pairData.high = ticker24hrs[0].high;
                    pairData.changePrice = ticker24hrs[0].changePrice;
                    pairData.change = ticker24hrs[0].changePercentage;
                    pairData.firstVolume = ticker24hrs[0].firstVolume;
                    pairData.secondVolume = ticker24hrs[0].secondVolume;
                } else {
                    pairData.low = 0;
                    pairData.high = 0;
                    pairData.changePrice = 0;
                    pairData.change = 0;
                    pairData.firstVolume = 0;
                    pairData.secondVolume = 0;
                }

                let recentTrade = await PerpetualOrder.aggregate([
                    {
                        "$match": {
                            "pairId": ObjectId(pairId),
                            "buyorsell": "sell",
                            "status": { "$in": ['pending', 'completed'] },
                        }
                    },
                    { "$unwind": "$filled" },
                    {
                        "$sort": { 'filled.createdAt': -1 }
                    },
                    { "$limit": 1 },
                    {
                        "$project": {
                            'price': '$filled.price'
                        }
                    }
                ])

                if (recentTrade.length > 0) {
                    pairData.last = recentTrade[0].price;
                    // pairData.markPrice = recentTrade[0].price;
                }

                let updatePairData = await pairData.save();
                let result = {
                    'last': updatePairData.last,
                    'markPrice': updatePairData.markPrice,
                    'low': updatePairData.low,
                    'high': updatePairData.high,
                    'firstVolume': updatePairData.firstVolume,
                    'secondVolume': updatePairData.secondVolume,
                    'changePrice': updatePairData.changePrice,
                    'change': updatePairData.change,
                    'botstatus': updatePairData.botstatus,
                }

                return {
                    'status': true,
                    'result': result
                }
            }
        }
        return {
            'status': false
        }
    } catch (err) {
        return {
            'status': false
        }
    }
}

export const forcedLiquidation = async (pairData) => {
    try {
        let positionDetails = await PerpetualOrder.aggregate([
            {
                "$match": {
                    'pairId': ObjectId(pairData._id),
                    'status': { "$in": ['pending', 'completed', 'cancel'] },
                    'positionStatus': 'open',
                    // 'buyorsell': reqBody.buyorsell == 'buy' ? 'sell' : 'buy'
                }
            },
            {
                "$project": {
                    '_id': 1,
                    "userId": 1,
                    "pairName": 1,
                    "positionQuantity": 1,
                    "marginImpact": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.orderCost"] }
                            }
                        }
                    },
                    "price": {
                        "$reduce": {
                            'input': "$filled",
                            'initialValue': 0,
                            'in': {
                                "$avg": { "$add": ["$$value", "$$this.price"] }
                            }
                        }
                    },
                    "buyorsell": {
                        "$cond": [
                            { "$eq": ["$buyorsell", 'buy'] }, 'sell', 'buy'
                        ]
                    },
                    "leverage": 1,
                    "firstCurrency": 1,
                    "secondCurrency": 1,
                    "initialMargin": { "$literal": 0 },
                    "liquidityPrice": { "$literal": 0 },
                }
            },
            {
                "$group": {
                    "_id": "$userId",
                    "userId": { "$first": "$userId" },
                    "orderId": { "$push": "$_id" },
                    "firstCurrency": { "$first": "$firstCurrency" },
                    "secondCurrency": { "$first": "$secondCurrency" },
                    "positionQuantity": { "$sum": "$positionQuantity" },
                    "positionMargin": { "$avg": "$marginImpact" },
                    "price": { "$avg": "$price" },
                    "buyorsell": { "$first": "$buyorsell" },
                    "leverage": { "$first": "$leverage" },
                    "liquidityPrice": { "$first": "$liquidityPrice" }
                }
            }
        ])

        if (positionDetails && positionDetails.length > 0) {
            await forceUpdate(positionDetails, pairData, 0)
            return true
        }
        return true
    } catch (err) {
        return false
    }
}

export const forceUpdate = async (positionDetails, pairData, count = 0) => {
    try {
        if (isEmpty(positionDetails[count])) {
            return true
        }

        let liquidityPrice = leverageCalculation({
            'buyorsell': positionDetails[count].buyorsell,
            'price': positionDetails[count].price,
            'leverage': positionDetails[count].leverage,
            'maintanceMargin': pairData.maintanceMargin,
        })

        if (positionDetails[count].buyorsell == 'sell' && liquidityPrice > pairData.markPrice) {
            await PerpetualOrder.updateMany({ "_id": { "$in": positionDetails[count].orderId } }, {
                "$set": {
                    'positionStatus': 'closed',
                }
            }, { "multi": true })

            let sellOrderId = ObjectId();
            let buyOrderId = ObjectId();
            let uniqueId = Math.floor(Math.random() * 1000000000);

            let sellLiquidityPrice = leverageCalculation({
                'buyorsell': 'sell',
                'price': liquidityPrice,
                'leverage': positionDetails[count].leverage,
                'maintanceMargin': pairData.maintanceMargin,
            })

            let orderValue = liquidityPrice * positionDetails[count].positionQuantity
            let requiredMargin = orderValue / positionDetails[count].leverage;
            let takerFee = orderValue * (pairData.taker_fees / 100)
            let orderCost = requiredMargin + takerFee;

            let sellOrder = new PerpetualOrder({
                '_id': sellOrderId,
                'pairId': pairData._id,
                'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
                'userId': positionDetails[count].userId,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'secondCurrencyId': pairData.secondCurrencyId,
                'secondCurrency': pairData.secondCurrencySymbol,
                'buyorsell': 'sell',
                'orderType': "market",
                'price': liquidityPrice,
                'quantity': positionDetails[count].positionQuantity,
                'liquidityPrice': liquidityPrice,
                'leverage': sellLiquidityPrice,
                'orderValue': orderValue,
                'orderCost': orderCost,
                'orderDate': new Date(),
                'status': 'completed',
                'filled': [{
                    "pairId": pairData.pairId,
                    "sellUserId": positionDetails[count].userId,
                    "buyUserId": ObjectId("5e567694b912240c7f0e4299"),
                    "userId": positionDetails[count].userId,
                    "sellOrderId": sellOrderId,
                    "buyOrderId": buyOrderId,
                    "uniqueId": uniqueId,
                    "price": liquidityPrice,
                    "filledQuantity": positionDetails[count].positionQuantity,
                    "Fees": takerFee,
                    "status": "filled",
                    "Type": positionDetails[count].buyorsell,
                    "createdAt": new Date(),
                    "orderValue": orderValue,
                    "orderCost": orderCost
                }]
            })

            await sellOrder.save();

            let buyLiquidityPrice = leverageCalculation({
                'buyorsell': 'buy',
                'price': liquidityPrice,
                'leverage': positionDetails[count].leverage,
                'maintanceMargin': pairData.maintanceMargin,
            })

            let buyOrder = new PerpetualOrder({
                '_id': buyOrderId,
                'pairId': pairData._id,
                'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
                'userId': ObjectId("5e567694b912240c7f0e4299"),
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'secondCurrencyId': pairData.secondCurrencyId,
                'secondCurrency': pairData.secondCurrencySymbol,
                'buyorsell': 'buy',
                'orderType': "market",
                'price': liquidityPrice,
                'quantity': positionDetails[count].positionQuantity,
                'liquidityPrice': liquidityPrice,
                'leverage': buyLiquidityPrice,
                'orderValue': orderValue,
                'orderCost': orderCost,
                'orderDate': new Date(),
                'status': 'completed',
                'filled': [{
                    "pairId": pairData.pairId,
                    "sellUserId": positionDetails[count].userId,
                    "buyUserId": ObjectId("5e567694b912240c7f0e4299"),
                    "userId": ObjectId("5e567694b912240c7f0e4299"),
                    "sellOrderId": sellOrderId,
                    "buyOrderId": buyOrderId,
                    "uniqueId": uniqueId,
                    "price": liquidityPrice,
                    "filledQuantity": positionDetails[count].positionQuantity,
                    "Fees": takerFee,
                    "status": "filled",
                    "Type": positionDetails[count].buyorsell,
                    "createdAt": new Date(),
                    "orderValue": orderValue,
                    "orderCost": orderCost
                }]
            })

            await buyOrder.save();
            return await forceUpdate(positionDetails, pairData, count + 1)
        } else if (positionDetails[count].buyorsell == 'buy' && liquidityPrice < pairData.markPrice) {
            await PerpetualOrder.updateMany({ "_id": { "$in": positionDetails[count].orderId } }, {
                "$set": {
                    'positionStatus': 'closed',
                }
            }, { "multi": true })

            let sellOrderId = ObjectId();
            let buyOrderId = ObjectId();
            let uniqueId = Math.floor(Math.random() * 1000000000);

            let sellLiquidityPrice = leverageCalculation({
                'buyorsell': 'sell',
                'price': liquidityPrice,
                'leverage': positionDetails[count].leverage,
                'maintanceMargin': pairData.maintanceMargin,
            })

            let orderValue = liquidityPrice * positionDetails[count].positionQuantity
            let requiredMargin = orderValue / positionDetails[count].leverage;
            let takerFee = orderValue * (pairData.taker_fees / 100)
            let orderCost = requiredMargin + takerFee;

            let sellOrder = new PerpetualOrder({
                '_id': sellOrderId,
                'pairId': pairData._id,
                'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
                'userId': ObjectId("5e567694b912240c7f0e4299"),
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'secondCurrencyId': pairData.secondCurrencyId,
                'secondCurrency': pairData.secondCurrencySymbol,
                'buyorsell': 'sell',
                'orderType': "market",
                'price': liquidityPrice,
                'quantity': positionDetails[count].positionQuantity,
                'liquidityPrice': liquidityPrice,
                'leverage': sellLiquidityPrice,
                'orderValue': orderValue,
                'orderCost': orderCost,
                'orderDate': new Date(),
                'status': 'completed',
                'filled': [{
                    "pairId": pairData.pairId,
                    "sellUserId": ObjectId("5e567694b912240c7f0e4299"),
                    "buyUserId": positionDetails[count].userId,
                    "userId": ObjectId("5e567694b912240c7f0e4299"),
                    "sellOrderId": sellOrderId,
                    "buyOrderId": buyOrderId,
                    "uniqueId": uniqueId,
                    "price": liquidityPrice,
                    "filledQuantity": positionDetails[count].positionQuantity,
                    "Fees": takerFee,
                    "status": "filled",
                    "Type": 'sell',
                    "createdAt": new Date(),
                    "orderValue": orderValue,
                    "orderCost": orderCost
                }]
            })

            await sellOrder.save();

            let buyLiquidityPrice = leverageCalculation({
                'buyorsell': 'buy',
                'price': liquidityPrice,
                'leverage': positionDetails[count].leverage,
                'maintanceMargin': pairData.maintanceMargin,
            })

            let buyOrder = new PerpetualOrder({
                '_id': buyOrderId,
                'pairId': pairData._id,
                'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
                'userId': positionDetails[count].userId,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'firstCurrencyId': pairData.firstCurrencyId,
                'firstCurrency': pairData.firstCurrencySymbol,
                'secondCurrencyId': pairData.secondCurrencyId,
                'secondCurrency': pairData.secondCurrencySymbol,
                'buyorsell': 'buy',
                'orderType': "market",
                'price': liquidityPrice,
                'quantity': positionDetails[count].positionQuantity,
                'liquidityPrice': liquidityPrice,
                'leverage': buyLiquidityPrice,
                'orderValue': orderValue,
                'orderCost': orderCost,
                'orderDate': new Date(),
                'status': 'completed',
                'filled': [{
                    "pairId": pairData.pairId,
                    "sellUserId": positionDetails[count].userId,
                    "buyUserId": ObjectId("5e567694b912240c7f0e4299"),
                    "userId": ObjectId("5e567694b912240c7f0e4299"),
                    "sellOrderId": sellOrderId,
                    "buyOrderId": buyOrderId,
                    "uniqueId": uniqueId,
                    "price": liquidityPrice,
                    "filledQuantity": positionDetails[count].positionQuantity,
                    "Fees": takerFee,
                    "status": "filled",
                    "Type": 'buy',
                    "createdAt": new Date(),
                    "orderValue": orderValue,
                    "orderCost": orderCost
                }]
            })

            await buyOrder.save();
            return await forceUpdate(positionDetails, pairData, count + 1)

        }
    } catch (err) {
        return false
    }
}

/** 
 * Take Profit and Stop Loss Position Close
*/
export const triggerProfitLoss = async (pairData) => {
    try {
        let buyOrderData = await PerpetualOrder.find({
            'isProfitLoss': true,
            'positionStatus': "open",
            'buyorsell': "buy",
            '$or': [
                { "takeProfitPrice": { "$gte": pairData.markPrice } },
                { "stopLossPrice": { "$lt": pairData.markPrice } }
            ]
        })

        if (buyOrderData && buyOrderData.length > 0) {
            profitLossPositionClosed(buyOrderData, 0, pairData)
        }

        let sellOrderData = await PerpetualOrder.find({
            'isProfitLoss': true,
            'positionStatus': "open",
            'buyorsell': "sell",
            '$or': [
                { "takeProfitPrice": { "$lt": pairData.markPrice } },
                { "stopLossPrice": { "$gte": pairData.markPrice } }
            ]
        })

        if (sellOrderData && sellOrderData.length > 0) {
            profitLossPositionClosed(sellOrderData, 0, pairData)
        }


    } catch (err) {

    }
}

export const profitLossPositionClosed = async (orderData, count = 0, pairData) => {
    try {
        if (isEmpty(orderData[count])) {
            return false
        }

        let price = pairData.markPrice > orderData[count].stopLossPrice ? orderData[count].stopLossPrice : orderData[count].takeProfitPrice;
        let orderValue = (price * orderData[count].positionQuantity);
        let requiredMargin = orderValue / orderData[count].leverage;
        let fee = orderValue * (pairData.taker_fees / 100);
        let orderCost = requiredMargin + fee;
        let liquidityPrice = leverageCalculation({
            'buyorsell': orderData[count].buyorsell == 'buy' ? 'sell' : 'buy',
            'price': price,
            'leverage': orderData[count].leverage,
            'maintanceMargin': pairData.maintanceMargin
        })

        // let adminOrderId = ObjectId()
        // let uniqueId = Math.floor(Math.random() * 1000000000);

        let newOrderDoc = new PerpetualOrder({
            'pairId': pairData._id,
            'pairName': `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
            'userId': orderData[count].userId,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'firstCurrencyId': pairData.firstCurrencyId,
            'firstCurrency': pairData.firstCurrencySymbol,
            'secondCurrencyId': pairData.secondCurrencyId,
            'secondCurrency': pairData.secondCurrencySymbol,
            'buyorsell': orderData[count].buyorsell == 'buy' ? 'sell' : 'buy',
            'orderType': 'market',
            'price': price,
            'quantity': orderData[count].positionQuantity,
            'liquidityPrice': liquidityPrice,
            'leverage': orderData[count].leverage,
            'orderValue': orderValue,
            'orderCost': orderCost,
            'orderDate': new Date(),
            'takerFee': pairData.taker_fees,
            'status': 'open',
        })

        let newOrder = await newOrderDoc.save();

        tradeList(newOrder, pairData)
        await profitLossPositionClosed(orderData, count + 1, pairData)

    } catch (err) {

    }
}

/** 
 * Calculate Leverage Calculation
*/
export const leverageCalculation = ({ buyorsell, price, leverage, maintanceMargin }) => {
    let leveragePrice = 0;
    if (buyorsell == 'buy') {
        leveragePrice = (price * leverage) / (leverage + 1 - maintanceMargin * leverage);
    } else if (buyorsell == 'sell') {
        leveragePrice = (price * leverage) / (leverage - 1 + maintanceMargin * leverage);
    }

    return leveragePrice;
}

/** 
 * Update user asset
*/
export const assetUpdate = async ({ currencyId, userId, balance }) => {
    try {
        let walletData = await Assets.findOne({
            'userId': userId,
            'currency': currencyId
        })
        if (walletData) {
            walletData.derivativeWallet = walletData.derivativeWallet + parseFloat(balance);
            let updateData = await walletData.save();
            // walletUpdatePub(updateData)
        }
    } catch (err) { }
}
