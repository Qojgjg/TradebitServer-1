// import package
import mongoose from 'mongoose';
import lodash from 'lodash';

// import config
import { nodeBinanceAPI, binanceApiNode } from '../config/binance';
import { socketEmitOne, socketEmitAll } from '../config/socketIO';

// import model
import {
    SpotPair,
    SpotTrade
} from '../models';

// import lib
import isEmpty from '../lib/isEmpty';
import { toFixed } from '../lib/roundOf';
import { replacePair } from '../lib/pairHelper';

const ObjectId = mongoose.Types.ObjectId;

let partialDepth, ticker, trades;
export const spotOrderBookWS = async () => {
    try {

        if(partialDepth){
            partialDepth()
        }

        let getSpotPair = await SpotPair.aggregate([
            { "$match": { 'botstatus': 'binance' } },
            {
                "$project": {
                    '_id': 1,
                    'symbol': {
                        "$concat": [
                            "$firstCurrencySymbol",
                            {
                                "$switch": {
                                    "branches": [
                                        { "case": { "$eq": ["$secondCurrencySymbol", 'USD'] }, then: "USDT" },
                                    ],
                                    "default": "$secondCurrencySymbol"
                                }
                            },
                        ]
                    },
                    'level': { "$literal": 10 },
                    'markupPercentage': 1
                }
            }
        ])

        if (getSpotPair && getSpotPair.length > 0) {

            partialDepth = binanceApiNode.ws.partialDepth(getSpotPair, async (depth) => {
                if (depth) {

                    let pairData = getSpotPair.find((el) => el.symbol == depth.symbol)

                    if (pairData) {

                        // sell order book
                        let sellOrder = [], binanceSellOrder = depth.asks;
                        let sellOrderData = await SpotTrade.aggregate([
                            {
                                "$match": {
                                    "pairId": ObjectId(pairData._id),
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

                        sellOrder = sellOrderData;
                        for (let sellItem of binanceSellOrder) {

                            let orderData = sellOrderData.find((x) => x._id === parseFloat(sellItem.price));
                            if (!orderData) {

                                sellOrder.push({
                                    '_id': calculateMarkup(sellItem.price, pairData.markupPercentage, '+'),
                                    'quantity': parseFloat(sellItem.quantity),
                                    'filledQuantity': 0
                                })
                            }
                        }

                        sellOrder = sellOrder.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

                        if (sellOrder.length > 0) {
                            let sumAmount = 0
                            for (let i = 0; i < sellOrder.length; i++) {
                                let quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledQuantity);
                                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                                sellOrder[i].total = sumAmount;
                                sellOrder[i].quantity = quantity;
                            }
                        }
                        sellOrder = sellOrder.reverse();


                        // buy order book
                        let buyOrder = [], binanceBuyOrder = depth.bids;

                        let buyOrderData = await SpotTrade.aggregate([
                            {
                                "$match": {
                                    "pairId": ObjectId(pairData._id),
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

                        buyOrder = buyOrderData;

                        for (let buyItem of binanceBuyOrder) {
                            let orderData = buyOrderData.find((x) => x._id === parseFloat(buyItem.price));
                            if (!orderData) {
                                buyOrder.push({
                                    '_id': calculateMarkup(buyItem.price, pairData.markupPercentage, '-'),
                                    'quantity': parseFloat(buyItem.quantity),
                                    'filledQuantity': 0
                                })
                            }
                        }

                        buyOrder = buyOrder.sort((a, b) => parseFloat(b._id) - parseFloat(a._id));

                        if (buyOrder.length > 0) {
                            let sumAmount = 0
                            for (let i = 0; i < buyOrder.length; i++) {
                                let quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledQuantity);
                                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                                buyOrder[i].total = sumAmount;
                                buyOrder[i].quantity = quantity;
                            }
                        }

                        socketEmitAll('orderBook', {
                            'pairId': pairData._id,
                            'sellOrder': sellOrder,
                            'buyOrder': buyOrder,
                        })
                    }
                }
            })
        }

    } catch (err) {
        console.log("Error on websocketcall in binanceHelper ", err)
    }
}

export const spotTickerPriceWS = async () => {
    try {

        if(ticker){
            ticker()
        }

        let getSpotPair = await SpotPair.aggregate([
            { "$match": { 'botstatus': 'binance' } },
            {
                "$group": {
                    '_id': null,
                    'symbol': {
                        "$push": {
                            "$concat": [
                                "$firstCurrencySymbol",
                                {
                                    "$switch": {
                                        "branches": [
                                            { "case": { "$eq": ["$secondCurrencySymbol", 'USD'] }, then: "USDT" },
                                        ],
                                        "default": "$secondCurrencySymbol"
                                    }
                                },
                            ]
                        }
                    },
                    'pairData': {
                        "$push": {
                            "pairId": "$_id",
                            'symbol': {
                                "$concat": [
                                    "$firstCurrencySymbol",
                                    {
                                        "$switch": {
                                            "branches": [
                                                { "case": { "$eq": ["$secondCurrencySymbol", 'USD'] }, then: "USDT" },
                                            ],
                                            "default": "$secondCurrencySymbol"
                                        }
                                    },
                                ]
                            }

                        }
                    }
                }
            }
        ])

        if (getSpotPair && getSpotPair.length > 0 && getSpotPair[0].symbol && getSpotPair[0].symbol.length > 0) {
            ticker = binanceApiNode.ws.ticker(getSpotPair[0].symbol, async tickerdata => {
                let pairData = getSpotPair[0].pairData.find(el => el.symbol == tickerdata.symbol);
                if (pairData) {
                    let updateSpotPair = await SpotPair.findOneAndUpdate({
                        '_id': pairData.pairId
                    }, {
                        'low': tickerdata.low,
                        'high': tickerdata.high,
                        'changePrice': tickerdata.priceChange,
                        'change': tickerdata.priceChangePercent,
                        'firstVolume': tickerdata.volume,
                        'secondVolume': tickerdata.volumeQuote,
                        'last': tickerdata.bestBid,
                        'markPrice': tickerdata.bestBid,
                    }, {
                        'new': true,
                        "fields": {
                            "last": 1,
                            "markPrice": 1,
                            "low": 1,
                            "high": 1,
                            "firstVolume": 1,
                            "secondVolume": 1,
                            "changePrice": 1,
                            "change": 1,
                            "botstatus": 1,
                        }
                    })

                    socketEmitAll('marketPrice', {
                        'pairId': pairData.pairId,
                        'data': updateSpotPair
                    })
                }
            })
        }
    } catch (err) {
        console.log("Error on ticker binance ", err)
    }
}

/**
 * Account Info
*/
export const accountInfo = async () => {
    try {
        let accountInfo = await binanceApiNode.accountInfo();
        if (accountInfo) {
            return {
                status: true,
                data: accountInfo
            };
        }
        return {
            status: false,
        };
    } catch (err) {
        return {
            status: false,
        };
    }
}

/**
 * Balance Info
 * BODY : currencySymbol
*/
export const balanceInfo = async ({ currencySymbol }) => {
    try {
        let info = await accountInfo();
        if (!info.status) {
            return {
                status: false,
            };
        }

        let currencyBalance = info.data.balances.find((el => el.asset == currencySymbol))
        if (!currencyBalance) {
            return {
                status: false,
            };
        }
        return {
            status: true,
            data: currencyBalance
        };

    } catch (err) {
        return {
            status: false,
        };
    }
}

/**
 * Check Currency Balance
 * BODY : firstCurrency, secondCurrency, buyorsell, price, quantity
*/
export const checkBalance = async ({
    firstCurrencySymbol,
    secondCurrencySymbol,
    buyorsell,
    price,
    quantity
}) => {
    try {
        let currencySymbol, orderValue;
        price = parseFloat(price);
        quantity = parseFloat(quantity);

        if (buyorsell == "buy") {
            currencySymbol = secondCurrencySymbol;
            orderValue = price * quantity;
        } else if (buyorsell == "sell") {
            currencySymbol = firstCurrencySymbol;
            orderValue = quantity;
        }

        let balanceData = await balanceInfo({ currencySymbol })
        if (!balanceData.status) {
            return {
                status: false
            }
        }

        if (parseFloat(balanceData.data.free) > orderValue) {
            return {
                status: true
            }
        } else {
            return {
                status: false
            }
        }

    } catch (err) {
        return {
            status: false
        }
    }
}

/** 
 * Binance Order Place
 * firstCurrencySymbol, secondCurrencySymbol, buyorsell, price, quantity, orderType (limit, market, stop_limit, stop_market), markupPercentage, minimumValue
*/
export const orderPlace = async (reqBody) => {
    try {
        // let reqBody = req.body;
        reqBody.quantity = parseFloat(reqBody.quantity);
        reqBody.price = parseFloat(reqBody.price);

        const checkBinanceBalance = await checkBalance({
            'firstCurrencySymbol': reqBody.firstCurrencySymbol,
            'secondCurrencySymbol': replacePair(reqBody.secondCurrencySymbol),
            'buyorsell': reqBody.buyorsell,
            'price': reqBody.price,
            'quantity': reqBody.quantity
        })

        if (!checkBinanceBalance.status) {
            return {
                status: false
            }
        }

        if (reqBody.orderType == 'limit') {
            return await limitOrderPlace({
                'price': reqBody.price,
                'quantity': reqBody.quantity,
                'buyorsell': reqBody.buyorsell,
                'markupPercentage': reqBody.markupPercentage,
                'minimumValue': reqBody.minimumValue,
                'firstCurrencySymbol': reqBody.firstCurrencySymbol,
                'secondCurrencySymbol': reqBody.secondCurrencySymbol
            })
        } else if (reqBody.orderType == 'market') {
            // return await marketOrderPlace()
        }

        return {
            status: false
        }
    } catch (err) {
        return {
            status: false
        }
    }
}

export const limitOrderPlace = async ({
    price,
    quantity,
    buyorsell,
    markupPercentage,
    minimumValue,
    firstCurrencySymbol,
    secondCurrencySymbol,
}) => {
    try {
        price = parseFloat(price);
        quantity = parseFloat(quantity);

        let withMarkupPrice;

        if (buyorsell == "buy") {
            withMarkupPrice = calculateMarkup(price, markupPercentage, '-')
        } else if (buyorsell == "sell") {
            withMarkupPrice = calculateMarkup(price, markupPercentage, '+')
        }

        let orderValue = quantity * withMarkupPrice;

        if (orderValue >= minimumValue) {
            let orderOption = {
                symbol: firstCurrencySymbol + secondCurrencySymbol,
                side: buyorsell.toUpperCase(),
                type: "LIMIT",
                quantity: quantity,
                price: withMarkupPrice
            }

            let neworder = await binanceApiNode.order(orderOption);

            if (!neworder) {
                return {
                    status: false
                }
            }
            return {
                status: true,
                data: {
                    "orderId": neworder.orderId,
                    "status": neworder.status,
                    "executedQty": neworder.executedQty,
                    "origQty": neworder.origQty
                }
            }
        } else {
            return {
                status: false,
            }
        }
    } catch (err) {
        return {
            status: false,
        }
    }
}

export const calculateMarkup = (price, percentage, type = '+') => {
    price = parseFloat(price);
    percentage = parseFloat(percentage)

    if (!isEmpty(price)) {
        if (type == '+') {
            return price + (price * (percentage / 100))
        } else if (type == '-') {
            return price - (price * (percentage / 100))
        }
    }
    return 0
}

/** 
 * Recent Trade
*/
export const recentTrade = async ({ firstCurrencySymbol, secondCurrencySymbol }) => {
    try {
        secondCurrencySymbol = replacePair(secondCurrencySymbol)
        let recentTradeData = await binanceApiNode.trades({ 'symbol': firstCurrencySymbol + secondCurrencySymbol, "limit": 50 })
        let recentTrade = [];
        recentTradeData.filter((el => {
            recentTrade.push({
                'createdAt': new Date(el.time),
                'Type': el.isBuyerMaker ? 'buy' : 'sell',
                'price': el.price,
                'filledQuantity': el.qty,
            })
        }))

        return recentTrade

    } catch (err) {
        console.log("\x1b[31m", 'Error on binance trade list',err)
        return []
    }

}

export const getSpotPair = async () => {
    try {
        let pairLists = await SpotPair.find(
            { "botstatus": 'binance' },
            {
                'firstCurrencySymbol': 1,
                'secondCurrencySymbol': 1,
            }
        );

        if (pairLists && pairLists.length > 0) {
            recentTradeWS(pairLists)
        }
        return true
    } catch (err) {
        return false
    }
}

export const recentTradeWS = async (pairList) => {
    try {

        if(trades){
            trades()
        }

        let symbolList = lodash.map(pairList, (item) => {
            return item.firstCurrencySymbol + replacePair(item.secondCurrencySymbol)
        });

        if (symbolList && symbolList.length > 0) {
            trades = binanceApiNode.ws.trades(symbolList, async trade => {
                if (trade) {
                    let pairData = pairList.find(el => el.firstCurrencySymbol + replacePair(el.secondCurrencySymbol) == trade.symbol)
                    let recentTrade = [{
                        'createdAt': new Date(trade.tradeTime),
                        'Type': trade.isBuyerMaker ? 'buy' : 'sell',
                        'price': trade.price,
                        'filledQuantity': trade.quantity,
                    }]

                    socketEmitAll('recentTrade', {
                        'pairId': pairData._id,
                        'data': recentTrade
                    })
                }
            })
        }
    } catch (err) {
        console.log("Error on recentTradeWS")
    }
}

export const marketPrice = async () => {
    try {
        return binanceApiNode.prices()
    } catch (err) {
        return ''
    }
}

// Initial Function Call
getSpotPair();
spotOrderBookWS();
spotTickerPriceWS();