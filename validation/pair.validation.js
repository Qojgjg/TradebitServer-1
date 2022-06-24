// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

/** 
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const addSpotPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "baseCurrency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Invalid basecurrency";
    }

    if (isEmpty(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "baseCurrency floatDigit field is required";
    } else if (isNaN(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Only allow numerice";
    }

    if (isEmpty(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "quoteCurrency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Invalid quoteCurrency";
    } else if (reqBody.firstCurrencyId == reqBody.secondCurrencyId) {
        errors.secondCurrencyId = "Currency pair not be same";
    }

    if (isEmpty(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "quoteCurrency floatDigit field is required";
    } else if (isNaN(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "Only allow numerice";
    }
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "markPrice field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.markPrice = "Only allow numerice";
    }

    if (isEmpty(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "minPricePercentage field is required";
    } else if (isNaN(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "Only allow numerice";
    }

    if (isEmpty(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "maxPricePercentage field is required";
    } else if (isNaN(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "Only allow numerice";
    }

    if (isEmpty(reqBody.maxQuantity)) {
        errors.maxQuantity = "maxQuantity field is required";
    } else if (isNaN(reqBody.maxQuantity)) {
        errors.maxQuantity = "Only allow numerice";
    }

    if (isEmpty(reqBody.minQuantity)) {
        errors.minQuantity = "minQuantity field is required";
    } else if (isNaN(reqBody.minQuantity)) {
        errors.minQuantity = "Only allow numerice";
    }

    if (isEmpty(reqBody.maker_rebate)) {
        errors.maker_rebate = "maker_rebate field is required";
    } else if (isNaN(reqBody.maker_rebate)) {
        errors.maker_rebate = "Only allow numerice";
    }


    if (isEmpty(reqBody.taker_fees)) {
        errors.taker_fees = "taker_fees field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.taker_fees = "Only allow numerice";
    }


    if (isEmpty(reqBody.botstatus)) {
        errors.botstatus = "botstatus field is required";
    } else if (!['off', 'binance'.includes(reqBody.botstatus)]) {
        errors.botstatus = "Invalid bot status";
    }

    if (reqBody.botstatus == 'binance') {
        if (isEmpty(reqBody.markupPercentage)) {
            errors.markupPercentage = "markupPercentage field is required";
        } else if (isNaN(reqBody.markupPercentage)) {
            errors.markupPercentage = "Only allow numerice";
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}


export const addP2PPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.firstCurrency)) {
        errors.firstCurrency = "BaseCurrency field is required";
    } 

    if (isEmpty(reqBody.secondCurrency)) {
        errors.secondCurrency = "QuoteCurrency field is required";
    } 

   
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "MarkPrice field is required";
    } 
    if (isEmpty(reqBody.transactionfee)) {
        errors.transactionfee = "Transaction fee field is required";
    } else if (isNaN(reqBody.transactionfee)) {
        errors.transactionfee = "Only allowed numeric values";
    }

  

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}



/** 
 * Edit Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : pairId, firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const editSpotPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.pairId)) {
        errors.pairId = "pairId field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.pairId)) {
        errors.pairId = "Invalid pairId";
    }

    if (isEmpty(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "baseCurrency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Invalid basecurrency";
    }

    if (isEmpty(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "baseCurrency floatDigit field is required";
    } else if (isNaN(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Only allow numerice";
    }

    if (isEmpty(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "quoteCurrency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Invalid quoteCurrency";
    } else if (reqBody.firstCurrencyId == reqBody.secondCurrencyId) {
        errors.secondCurrencyId = "Currency pair not be same";
    }

    if (isEmpty(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "quoteCurrency floatDigit field is required";
    } else if (isNaN(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "Only allow numerice";
    }

    if (isEmpty(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "minPricePercentage field is required";
    } else if (isNaN(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "Only allow numerice";
    }

    if (isEmpty(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "maxPricePercentage field is required";
    } else if (isNaN(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "Only allow numerice";
    }
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "markPrice field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.markPrice = "Only allow numerice";
    }
    if (isEmpty(reqBody.maxQuantity)) {
        errors.maxQuantity = "maxQuantity field is required";
    } else if (isNaN(reqBody.maxQuantity)) {
        errors.maxQuantity = "Only allow numerice";
    }

    if (isEmpty(reqBody.minQuantity)) {
        errors.minQuantity = "minQuantity field is required";
    } else if (isNaN(reqBody.minQuantity)) {
        errors.minQuantity = "Only allow numerice";
    }

    if (isEmpty(reqBody.maker_rebate)) {
        errors.maker_rebate = "maker_rebate field is required";
    } else if (isNaN(reqBody.maker_rebate)) {
        errors.maker_rebate = "Only allow numerice";
    }


    if (isEmpty(reqBody.taker_fees)) {
        errors.taker_fees = "taker_fees field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.taker_fees = "Only allow numerice";
    }


    if (isEmpty(reqBody.botstatus)) {
        errors.botstatus = "botstatus field is required";
    } else if (!['off', 'binance'.includes(reqBody.botstatus)]) {
        errors.botstatus = "Invalid bot status";
    }

    if (reqBody.botstatus == 'binance') {
        if (isEmpty(reqBody.markupPercentage)) {
            errors.markupPercentage = "markupPercentage field is required";
        } else if (isNaN(reqBody.markupPercentage)) {
            errors.markupPercentage = "Only allow numerice";
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}


export const editP2PPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.pairId)) {
        errors.pairId = "pairId field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.pairId)) {
        errors.pairId = "Invalid pairId";
    }

    if (isEmpty(reqBody.firstCurrency)) {
        errors.firstCurrencyId = "baseCurrency field is required";
    } 
   

    if (isEmpty(reqBody.secondCurrency)) {
        errors.secondCurrencyId = "quoteCurrency field is required";
    } 

 
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "markPrice field is required";
    } else if (isNaN(reqBody.markPrice)) {
        errors.markPrice = "Only allow numerice";
    }
   

    if (isEmpty(reqBody.transactionfee)) {
        errors.transactionfee = "taker_fees field is required";
    } else if (isNaN(reqBody.transactionfee)) {
        errors.transactionfee = "Only allow numerice";
    }

   if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}