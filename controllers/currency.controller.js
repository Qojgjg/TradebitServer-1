// import package
import multer from 'multer';
import path from 'path';

// import model
import { Currency } from '../models';
const SpotPairs = require('../models/spotpairs');

// import config
import config from '../config';

// import controller
import { createAssetAtAddCurrency } from './assets.controller';
import { addPriceCNV } from './priceCNV.controller';

// import lib
import imageFilter from '../lib/imageFilter';
import {
  paginationQuery,
  filterQuery,
  filterProofQuery,
  filterSearchQuery
} from '../lib/adminHelpers';
import isEmpty from '../lib/isEmpty';


/** 
 * Multer Image Uploade 
*/
const currencyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.IMAGE.CURRENCY_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, 'currency-' + Date.now() + path.extname(file.originalname));
  }
});

let currencyUpload = multer({

  storage: currencyStorage,
  onError: function (err, next) {
    next(err);
  },
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.CURRENCY_SIZE }
}).fields([
  { name: 'currencyImage', maxCount: 1 },
])

export const uploadCurrency = (req, res, next) => {
  currencyUpload(req, res, function (err) {
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

export const getCurrency = (req, res) => {
  Currency.find({ "status": 'active' }, {
    "currencyName": 1,
    "currencySymbol": 1,
    "type": 1
  }, (err, data) => {
    if (err) {
      return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
    return res.status(200).json({ 'success': true, 'message': "FETCH_SUCCESS", result: data })
  })
}

/** 
* Get All Currency List
* URL : /adminapi/currency
* METHOD : GET
*/
export const currencyList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ['currencyName', 'currencySymbol', 'type', 'status']);

    let count = await Currency.countDocuments(filter);
    let data = await Currency.find(filter, {
      "_id": 1,
      "currencyName": 1,
      "currencySymbol": 1,
      "type": 1,
      "withdrawFee": 1,
      "minimumWithdraw": 1,
      "currencyImage": 1,
      "bankDetails": 1,
      "tokenType": 1,
      "minABI": 1,
      "contractAddress": 1,
      "decimals": 1,
      "isPrimary": 1,
      "status": 1,
    }).sort({ "createdAt": -1 }).skip(pagination.skip).limit(pagination.limit);

    let result = {
      count,
      data,
      imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`
    }

    return res.status(200).json({ 'success': true, 'message': 'FETCH_SUCCESS', result })
  } catch (err) {
    return res.status(500).json({ 'success': true, 'message': 'SOMETHING_WRONG' })
  }
}

/** 
* Add Currency
* URL : /adminapi/currency
* METHOD : POST
* BODY : currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const addCurrency = async (req, res,) => {
  try {
    let reqBody = req.body, reqFile = req.files;

    let checkCurrency = await Currency.findOne({ "currencySymbol": reqBody.currencySymbol })
    if (checkCurrency) {
      return res.status(400).json({ 'success': false, 'errors': { "currencySymbol": "Currency symbol already exists" } })
    }

    if (reqBody.type == 'crypto') {
      const newDoc = new Currency({
        'currencyName': reqBody.currencyName,
        'currencySymbol': reqBody.currencySymbol,
        'currencyImage': reqFile.currencyImage[0].filename,
        'withdrawFee': reqBody.withdrawFee,
        'minimumWithdraw': reqBody.minimumWithdraw,
        'type': reqBody.type,
      });

      let newData = await newDoc.save();
      createAssetAtAddCurrency(newData)
      return res.status(200).json({ 'success': true, 'message': 'Crypto Currency added successfully' })
    } else if (reqBody.type == 'token') {
      const newDoc = new Currency({
        'currencyName': reqBody.currencyName,
        'currencySymbol': reqBody.currencySymbol,
        'currencyImage': reqFile.currencyImage[0].filename,
        'contractAddress': reqBody.contractAddress,
        'minABI': reqBody.minABI,
        'decimals': reqBody.decimals,
        'withdrawFee': reqBody.withdrawFee,
        'minimumWithdraw': reqBody.minimumWithdraw,
        'type': reqBody.type,
        'tokenType': reqBody.tokenType,
      });

      let newData = await newDoc.save();
      createAssetAtAddCurrency(newData)
      return res.status(200).json({ 'success': true, 'message': 'Token currency added successfully' })
    } else if (reqBody.type == 'fiat') {
      const newDoc = new Currency({
        'currencyName': reqBody.currencyName,
        'currencySymbol': reqBody.currencySymbol,
        'currencyImage': reqFile.currencyImage[0].filename,
        'bankDetails.bankName': reqBody.bankName,
        'bankDetails.accountNo': reqBody.accountNo,
        'bankDetails.holderName': reqBody.holderName,
        'bankDetails.bankcode': reqBody.bankcode,
        'bankDetails.country': reqBody.country,
        'withdrawFee': reqBody.withdrawFee,
        'minimumWithdraw': reqBody.minimumWithdraw,
        'type': reqBody.type,
      });

      let newData = await newDoc.save();
      createAssetAtAddCurrency(newData)
      addPriceCNV(newData)
      return res.status(200).json({ 'success': true, 'message': 'Fiat Currency added successfully' })
    }
    return res.status(409).json({ 'success': false, 'message': 'Something went wrong' })
  } catch (err) {
    return res.status(500).json({ 'success': false, 'message': 'Something went wrong' })
  }
}



/** 
* Update Currency
* URL : /adminapi/currency
* METHOD : PUT
* BODY : currencyId, currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const updateCurrency = async (req, res,) => {
  try {
    let reqBody = req.body, reqFile = req.files;

    let checkCurrency = await Currency.findOne({ "currencySymbol": reqBody.currencySymbol, "_id": { "$ne": reqBody.currencyId } })
    if (checkCurrency) {
      return res.status(400).json({ 'success': false, 'errors': { "currencySymbol": "Currency symbol already exists" } })
    }

    if (reqBody.type == 'crypto') {
      let currencyDoc = await Currency.findOne({ "_id": reqBody.currencyId })

      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage = reqFile.currencyImage && reqFile.currencyImage[0] ? reqFile.currencyImage[0].filename : currencyDoc.currencyImage;
      currencyDoc.withdrawFee = reqBody.withdrawFee;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.status = reqBody.status;

      await currencyDoc.save();
      return res.status(200).json({ 'success': true, 'message': 'Crypto Currency updated successfully' })

    } else if (reqBody.type == 'token') {
      let currencyDoc = await Currency.findOne({ "_id": reqBody.currencyId })

      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage = reqFile.currencyImage && reqFile.currencyImage[0] ? reqFile.currencyImage[0].filename : currencyDoc.currencyImage;
      currencyDoc.contractAddress = reqBody.contractAddress;
      currencyDoc.minABI = reqBody.minABI;
      currencyDoc.decimals = reqBody.decimals;
      currencyDoc.withdrawFee = reqBody.withdrawFee;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.tokenType = reqBody.tokenType;
      currencyDoc.status = reqBody.status;

      await currencyDoc.save();
      return res.status(200).json({ 'success': true, 'message': 'Token currency updated successfully' })
    } else if (reqBody.type == 'fiat') {
      let currencyDoc = await Currency.findOne({ "_id": reqBody.currencyId })

      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage = reqFile.currencyImage && reqFile.currencyImage[0] ? reqFile.currencyImage[0].filename : currencyDoc.currencyImage;
      currencyDoc.bankDetails.bankName = reqBody.bankName;
      currencyDoc.bankDetails.accountNo = reqBody.accountNo;
      currencyDoc.bankDetails.holderName = reqBody.holderName;
      currencyDoc.bankDetails.bankcode = reqBody.bankcode;
      currencyDoc.bankDetails.country = reqBody.country;
      currencyDoc.withdrawFee = reqBody.withdrawFee;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.status = reqBody.status;

      await currencyDoc.save();
      return res.status(200).json({ 'success': true, 'message': 'Fiat Currency updated successfully' })
    }
    return res.status(409).json({ 'success': false, 'message': 'Something went wrong' })
  } catch (err) {
    return res.status(500).json({ 'success': false, 'message': 'Something went wrong' })
  }
}

export const deleteCurrency = async (req, res) => {
  try {
    let spotPairData = await SpotPairs.findOne({
      "$or": [
        { "firstCurrencyId": req.params.currencyId },
        { "secondCurrencyId": req.params.currencyId },
      ]
    })
    if (spotPairData) {
      return res.status(500).json({ "success": false, 'errors': { 'messages': "Currently working" } })
    }

    await currency.deleteOne({ '_id': req.params.currencyId })
    return res.status(200).json({ 'result': { 'messages': 'Currency deleted sucessfully. Refreshing data...' } })
  }
  catch (err) {
    return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
  }
}

/**
 * Edit Currency
 * URL : /adminapi/currency
 * METHOD: PUT
 *  BODY : currencyId, currencyType, currencyName, currencySymbol, withdrawFee, minabi, contractAddress, bankName, name, accountNo, routingNo, photo 
*/

/** 
* Get Language Dropdown
* URL : /adminapi/getLanguage
* METHOD : GET
*/
export const getLanguage = async (req, res) => {
  Language.find({ 'status': 'active' }, { '_id': 1, 'code': 1, 'name': 1, 'isPrimary': 1, 'status': 1 }, (err, data) => {
    if (err) {
      return res.status(500).json({ 'success': false, 'message': 'Something went wrong' })
    }
    return res.status(200).json({ 'success': true, 'message': 'Fetch successfully', 'result': data })
  })
}