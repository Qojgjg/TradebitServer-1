// import package
import WebSocket from 'ws';

// import model
import { PerpetualPair } from '../models'

// import config
import { socketEmitAll } from '../config/socketIO';

// import controller
import { forcedLiquidation, triggerProfitLoss } from './derivativeTrade.controller';

// import lib
import { splitPair } from '../lib/pairHelper'
import isEmpty from '../lib/isEmpty';

const ws = new WebSocket("wss://stream.bybit.com/realtime_public")

ws.on('open', function open() {
    ws.send('{"op": "subscribe", "args": ["instrument_info.100ms.BTCUSDT","instrument_info.100ms.XRPUSDT"]}')
});

ws.on("message", async function incoming(responseData) {
    try {
        if (responseData) {
            responseData = JSON.parse(responseData);
            if (/instrument_info.100ms/g.test(responseData.topic)) {
                if (responseData.type == 'snapshot') {
                    let { firstCurrency, secondCurrency } = splitPair(responseData.data.symbol);

                    let pairData = await PerpetualPair.findOne({
                        "firstCurrencySymbol": firstCurrency,
                        "secondCurrencySymbol": secondCurrency,
                    })

                    if (pairData) {
                        pairData.markPrice = responseData.data.index_price;

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

                        // forcedLiquidation(updatePairData)
                        // triggerProfitLoss(updatePairData)

                        socketEmitAll('perpetualMarketPrice', {
                            'pairId': updatePairData._id,
                            'data': result
                        })

                    }
                } else if (responseData.type == 'delta') {
                    if (responseData.data.update && responseData.data.update.length > 0) {
                        let { firstCurrency, secondCurrency } = splitPair(responseData.data.update[0].symbol);
                        let pairData = await PerpetualPair.findOne({
                            "firstCurrencySymbol": firstCurrency,
                            "secondCurrencySymbol": secondCurrency,
                        })

                        if (pairData) {
                            pairData.markPrice = isEmpty(responseData.data.update[0].index_price) ? pairData.markPrice : responseData.data.update[0].index_price;

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

                            // forcedLiquidation(updatePairData)
                            // triggerProfitLoss(updatePairData)

                            socketEmitAll('perpetualMarketPrice', {
                                'pairId': updatePairData._id,
                                'data': result
                            })

                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log("----Error on bybit websocket", err)
        console.log("Error on bybit websocket")
    }
})

ws.on("error", async function () {
    console.log("\x1b[31m", 'Error on bybit websocket')
})

/** 
 * Calculate order cost
*/
export const calculateInverseOrderCost = ({ price, quantity, leverage, takerFee, buyorsell }) => {
    try {
        price = parseFloat(price)
        quantity = parseFloat(quantity)
        leverage = parseFloat(leverage)
        takerFee = parseFloat(takerFee)

        return (
            inverseInitialMargin({ price, quantity, leverage })
            +
            inverseFeeToOpen({ price, quantity, takerFee })
            +
            inverseFeeToClose({ price, quantity, leverage, takerFee, buyorsell })
        )
    } catch (err) {
        return 0
    }
}

export const inverseInitialMargin = ({ price, quantity, leverage }) => {
    try {
        price = parseFloat(price)
        quantity = parseFloat(quantity)
        leverage = parseFloat(leverage)

        return quantity / (price * leverage)
    } catch (err) {
        return 0
    }
}

export const inverseFeeToOpen = ({ price, quantity, takerFee }) => {
    try {
        price = parseFloat(price)
        quantity = parseFloat(quantity)
        takerFee = parseFloat(takerFee)

        return (quantity / price) * (takerFee / 100)
    } catch (err) {
        return 0
    }
}

export const inverseFeeToClose = ({ price, quantity, leverage, takerFee, buyorsell }) => {
    try {
        price = parseFloat(price)
        quantity = parseFloat(quantity)
        takerFee = parseFloat(takerFee)

        return (quantity / inverseBankrupty({ price, leverage, buyorsell })) * (takerFee / 100)
    } catch (err) {
        return 0
    }
}

export const inverseBankrupty = ({ price, leverage, buyorsell }) => {
    try {
        price = parseFloat(price)
        leverage = parseFloat(leverage)

        if (buyorsell == 'buy') {
            return price * (leverage / (leverage + 1))
        } else if (buyorsell == 'sell') {
            return price * (leverage / (leverage - 1))
        }
        return 0
    } catch (err) {
        return 0
    }
}

export const isolatedLiquidationPrice = ({ buyorsell, price, leverage, maintanceMargin }) => {
    let liquidationPrice = 0;
    price = parseFloat(price)
    leverage = parseFloat(leverage)
    maintanceMargin = parseFloat(maintanceMargin)

    if (buyorsell == 'buy') {
        liquidationPrice = (price * leverage) / (leverage + 1 - ((maintanceMargin / 100) * leverage))
    } else if (buyorsell == 'sell') {
        liquidationPrice = (price * leverage) / (leverage - 1 + ((maintanceMargin / 100) * leverage))
    }

    return liquidationPrice;
}

export const inversePositionMargin = ({ price, quantity, leverage, takerFee, buyorsell }) => {
    try {
        price = parseFloat(price)
        quantity = parseFloat(quantity)
        leverage = parseFloat(leverage)
        takerFee = parseFloat(takerFee)

        return (
            inverseInitialMargin({ price, quantity, leverage })
            +
            inverseFeeToClose({ price, quantity, leverage, takerFee, buyorsell })
        )
    } catch (err) {
        return 0
    }
}