// import package\
import axios from 'axios';

// import config
import config from '../config';

// import model
import {
    PriceConversion,
    Currency
} from '../models';
;

// import controller
import * as binanceCtrl from './binance.controller'

// import lib
import isEmpty from '../lib/isEmpty';
import { replacePair } from '../lib/pairHelper';

import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers'

/** 
 * Price conversion in CRON
*/
export const priceCNV = async () => {
    try {
        let conversionList = await PriceConversion.find({});
        if (conversionList && conversionList.length > 0) {

            let binancePrice = await binanceCtrl.marketPrice();
            for (let item of conversionList) {
                if (!isEmpty(binancePrice) && binancePrice[item.baseSymbol + replacePair(item.convertSymbol)]) {
                    await PriceConversion.updateOne({
                        "_id": item._id
                    }, {
                        "$set": {
                            'convertPrice': binancePrice[item.baseSymbol + replacePair(item.convertSymbol)]
                        }
                    })

                }
            }
        }
    } catch (err) {
        console.log("Error on Price conversion")
    }
}

// priceCNV()
/** 
 * Add Price Conversion 
*/
export const addPriceCNV = async (currencyData) => {
    try {
        if (currencyData.type == 'fiat') {
            let currencyList = await Currency.find({
                "type": {
                    "$in": ['crypto', 'token']
                }
            });

            if (currencyList && currencyList.length > 0) {

                let binancePrice = await binanceCtrl.marketPrice();

                for (let item of currencyList) {

                    if (item.currencySymbol != currencyData.currencySymbol) {
                        let checkPrice = await PriceConversion.findOne({
                            'baseSymbol': item.currencySymbol,
                            'convertSymbol': currencyData.currencySymbol,
                        })


                        if (!checkPrice) {
                            let newDoc = new PriceConversion({
                                'baseSymbol': item.currencySymbol,
                                'convertSymbol': currencyData.currencySymbol,
                                'convertPrice': !isEmpty(binancePrice) && binancePrice[item.currencySymbol + replacePair(currencyData.currencySymbol)] ? binancePrice[item.currencySymbol + replacePair(currencyData.currencySymbol)] : 1
                            })
                            await newDoc.save()
                        }
                    }
                }
            }
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

// try {
//     let respData = await axios({
//         'method': 'get',
//         'url': config.COINMARKETCAP.PRICE_CONVERSION,
//         'headers': {
//             'X-CMC_PRO_API_KEY': config.COINMARKETCAP.API_KEY
//         },
//         'params': {
//             'amount': 1,
//             'symbol': item.baseSymbol,
//             'convert': item.convertSymbol
//         }
//     });

//     if (respData && respData.data) {
//         const { data } = respData.data
//         console.log("---data", data)
//     }

// } catch (err) { }

// priceCNVCMC()
// let newDoc = new PriceConversion({
//     baseSymbol:"BTC",
//     convertSymbol:"USD",
//     convertPrice:5
// })

// newDoc.save((err,data)=>{
//     console.log(err,'-----')
//     console.log(data,'---data--')
// })

// ---data {
//     id: 1,
//     symbol: 'BTC',
//     name: 'Bitcoin',
//     amount: 1,
//     last_updated: '2021-09-20T11:41:02.000Z',
//     quote: {
//       USD: {
//         price: 43944.280751262275,
//         last_updated: '2021-09-20T11:41:02.000Z'
//       }
//     }
//   }


export const getPriceCNVlist = async (req, res) => {
    try {

        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['baseSymbol', 'convertSymbol']);
        let count = await PriceConversion.countDocuments(filter)
        let data = await PriceConversion.find(filter, {
            'baseSymbol': 1,
            'convertSymbol': 1,
            'convertPrice': 1,

        }).skip(pagination.skip).limit(pagination.limit)

        let result = {
            count,
            data
        }
        return res.status(200).json({ 'success': true, "messages": "success", result })


    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })

    }
}


export const priceCNVUpdate = async (req, res) => {

    try {

        const reqBody = req.body;

        await PriceConversion.updateOne({
            "_id": reqBody.priceCNVId
        }, {
            "$set": {

                'convertPrice': reqBody.convertPrice,
            }
        })

        return res.status(200).json({ 'message': 'Price updated successfully. Refreshing data...' })

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })

    }

}