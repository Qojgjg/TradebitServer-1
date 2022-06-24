// import package
import mongoose from 'mongoose';

// import lib
import isEmpty, { isBoolean } from '../lib/isEmpty';

/** 
* Add Currency
* URL : /adminapi/currency
* METHOD : POST
* BODY : type
*/
export const addCurrencyValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;

    if (isEmpty(reqBody.type)) {
        errors.type = "REQUIRED";
    } else if (!['crypto', 'token', 'fiat'].includes(reqBody.type)) {
        errors.type = "INVALID_TYPE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    if (reqBody.type == 'crypto') {

        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'token') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }

        if (isEmpty(reqBody.contractAddress)) {
            errors.contractAddress = "REQUIRED";
        }

        if (isEmpty(reqBody.tokenType)) {
            errors.tokenType = "Token Type field is required";
        }

        if (isEmpty(reqBody.minABI)) {
            errors.minABI = "Min ABI field is required";
        }

        if (isEmpty(reqBody.decimals)) {
            errors.decimals = "Decimals field is required";
        } else if (isNaN(reqBody.decimals)) {
            errors.decimals = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'fiat') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }

        if (isEmpty(reqBody.bankName)) {
            errors.bankName = "Bank name field is required";
        }

        if (isEmpty(reqBody.accountNo)) {
            errors.accountNo = "Account number field is required";
        }

        if (isEmpty(reqBody.holderName)) {
            errors.holderName = "Holder name field is required";
        }

        if (isEmpty(reqBody.bankcode)) {
            errors.bankcode = "IBN code field is required";
        }

        if (isEmpty(reqBody.country)) {
            errors.country = "Country field is required";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();
    }
}

/** 
* Update Currency
* URL : /adminapi/currency
* METHOD : PUT
* BODY : currencyId, currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const editCurrencyValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;

    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "CurrencyId field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.currencyId))) {
        errors.currencyId = "CurrencyId is invalid";
    }

    if (isEmpty(reqBody.type)) {
        errors.type = "REQUIRED";
    } else if (!['crypto', 'token', 'fiat'].includes(reqBody.type)) {
        errors.type = "INVALID_TYPE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    if (reqBody.type == 'crypto') {

        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'token') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqBody.tokenType)) {
            errors.tokenType = "Token Type field is required";
        }

        if (isEmpty(reqBody.contractAddress)) {
            errors.contractAddress = "REQUIRED";
        }

        if (isEmpty(reqBody.minABI)) {
            errors.minABI = "Min ABI field is required";
        }

        if (isEmpty(reqBody.decimals)) {
            errors.decimals = "Decimals field is required";
        } else if (isNaN(reqBody.decimals)) {
            errors.decimals = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'fiat') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqBody.bankName)) {
            errors.bankName = "Bank name field is required";
        }

        if (isEmpty(reqBody.accountNo)) {
            errors.accountNo = "Account number field is required";
        }

        if (isEmpty(reqBody.holderName)) {
            errors.holderName = "Holder name field is required";
        }

        if (isEmpty(reqBody.bankcode)) {
            errors.bankcode = "IBN code field is required";
        }

        if (isEmpty(reqBody.country)) {
            errors.country = "Country field is required";
        }

        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();
    }
}

/** 
 * Crypto Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, withdrawFee, minimumWithdraw, status
*/
export const cryptoValidate = (req, res, next) => {

}

/** 
 * Token Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, withdrawFee, minimumWithdraw,
*/
export const tokenValidate = (req, res, next) => {

}

/** 
 * Fiat Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const fiatValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;


}

