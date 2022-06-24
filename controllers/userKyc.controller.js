// import package
import multer from 'multer';
import path from 'path';


// import modal
import { UserKyc,User } from '../models';

// import config
import config from '../config';

// import controller
import * as cloudinaryCtrl from './cloudinary.controller';

// import lib
import imageFilter from '../lib/imageFilter';
import isEmpty from '../lib/isEmpty';
import { removeKycDbFile, removeKycReqFile } from '../lib/removeFile';
import {
    paginationQuery,
    filterQuery,
    filterProofQuery,
    filterSearchQuery
} from '../lib/adminHelpers';
import { mailTemplateLang } from './emailTemplate.controller';
import Notification from '../models/notification';

/** 
 * Multer Image Uploade 
*/
const kycStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.IMAGE.KYC_PATH);
    },

    // By default, multer removes file extensions so let's add them back
    filename: function (req, file, cb) {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
});

let kycUpload = multer({
    storage: kycStorage,
    fileFilter: imageFilter,
    limits: { fileSize: config.IMAGE.DEFAULT_SIZE }
}).fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfiImage', maxCount: 1 },
])

let IDUpload = multer({
    storage: kycStorage,
    fileFilter: imageFilter,
    limits: { fileSize: config.IMAGE.ID_DOC_SIZE }
}).fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfiImage', maxCount: 1 },
])

export const uploadKyc = (req, res, next) => {
    kycUpload(req, res, function (err) {
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

/** 
 * Upload ID Document
*/
export const IDKycUpload = (req, res, next) => {
    IDUpload(req, res, function (err) {
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

/** 
 * Create New User KYC Modal
*/
export const createUserKyc = (userId) => {
    let newDoc = new UserKyc({
        userId
    })

    newDoc.save((err, userKyc) => {
        if (err) { return console.log("Error on create Kyc", err.toString()) }
        return console.log("Kyc Create Successfully")
    })
}

/** 
 * Get Kyc Detail
 * URL: /api/kycdetail
 * METHOD : GET
*/
export const getUserKycDetail = async (req, res) => {
    UserKyc.findOne(
        { "userId": req.user.id },
        { "_id": 0, "idProof": 1, "addressProof": 1 },
        (err, data) => {
            if (err) {
                return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
            }
            return res.status(200).json({ 'success': true, 'message': "FETCH_SUCCESS", 'result': data })
        }
    )
}

/** 
 * Update Id Proof
 * URL: /api/kyc/idproof
 * METHOD : PUT
 * BODY : type,proofNumber, frontImage, backImage, selfiImage
*/
export const updateIdProof = async (req, res) => {
    try {
        let reqBody = req.body,
            reqFile = req.files;

        let idProofDoc = await UserKyc.findOne({ "userId": req.user.id }, { "idProof": 1 }).populate('userId');
        if (!idProofDoc) {
            return res.status(409).json({ 'success': false, 'message': "NO_DATA" })
        }

        if (idProofDoc.idProof.status == 'new' || idProofDoc.idProof.status == 'rejected') {
            // removeKycDbFile(idProofDoc.idProof)

            idProofDoc.idProof.type = reqBody.type;
            idProofDoc.idProof.proofNumber = reqBody.proofNumber;
            idProofDoc.idProof.frontImage = config.SERVER_URL+config.IMAGE.KYC_URL_PATH+req.files.frontImage[0].filename;
            idProofDoc.idProof.backImage = config.SERVER_URL+config.IMAGE.KYC_URL_PATH+req.files.backImage[0].filename;
            idProofDoc.idProof.selfiImage = config.SERVER_URL+config.IMAGE.KYC_URL_PATH+req.files.selfiImage[0].filename;
            idProofDoc.idProof.status = 'pending';
        } else {
            removeKycReqFile(req.files, 'id');
        }

        let content = {
            'email': idProofDoc && idProofDoc.userId && idProofDoc.userId.email,
        };

        mailTemplateLang({
            'userId': idProofDoc && idProofDoc.userId && idProofDoc.userId._id,
            'identifier': 'KYC_ID_PROOF',
            'toEmail': idProofDoc && idProofDoc.userId && idProofDoc.userId.email,
            content
        })

        let userKycData = await idProofDoc.save();


        return res.status(200).json({ 'success': true, 'message': "IDENTITY_DOC_UPLOAD_SUCCESS", 'result': userKycData })
    }
    catch (err) {
        removeKycReqFile(req.files, 'id');
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Update Address Proof
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : type, frontImage
*/
export const updateAddressProof = async (req, res) => {
    try {
        let reqBody = req.body,
            reqFile = req.files;

        let kycdoc = await UserKyc.findOne({ "userId": req.user.id }, { "addressProof": 1 }).populate('userId');
        if (!kycdoc) {
            return res.status(409).json({ 'success': false, 'message': "NO_DATA" })
        }

        if (kycdoc.addressProof.status == 'new' || kycdoc.addressProof.status == 'rejected') {
            removeKycDbFile(kycdoc.addressProof)
            kycdoc.addressProof.type = reqBody.type;
            kycdoc.addressProof.frontImage = config.SERVER_URL+config.IMAGE.KYC_URL_PATH+req.files.frontImage[0].filename;
            kycdoc.addressProof.status = 'pending';
        } else {
            removeKycReqFile(req.files, 'id');
        }

        let content = {
            'email': kycdoc && kycdoc.userId && kycdoc.userId.email,
        };

        mailTemplateLang({
            'userId': kycdoc && kycdoc.userId && kycdoc.userId._id,
            'identifier': 'KYC_ADDRESS_PROOF',
            'toEmail': kycdoc && kycdoc.userId && kycdoc.userId.email,
            content
        })

        let userKycData = await kycdoc.save();

        return res.status(200).json({ 'success': true, 'message': "ADDRESS_DOC_UPLOAD_SUCCESS", 'result': userKycData })
    }
    catch (err) {
        removeKycReqFile(req.files, 'id');
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Get All User Kyc Detail
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : type, frontImage
*/
export const getAllUserKyc = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'idProof.status', 'addressProof.status']);

        let count = await UserKyc.aggregate([
            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },

            {
                "$project": {
                    "email": "$userInfo.email",
                    "userId": 1,
                    "idProof": {
                        "type": 1,
                        "proofNumber": 1,
                        "status": 1

                    },
                    "addressProof": {
                        "type": 1,
                        "status": 1
                    },
                }
            },
            { "$match": filter },
        ])

        let data = await UserKyc.aggregate([

            { "$sort": { "_id": -1 } },

            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },

            {
                "$project": {
                    "email": "$userInfo.email",
                    "userId": 1,
                    "idProof": {
                        "type": 1,
                        "proofNumber": 1,
                        "frontImage": 1,
                        // "frontImage": {
                        //     '$concat': [config.SERVER_URL, config.IMAGE.KYC_URL_PATH, "$idProof.frontImage"]
                        // },
                        "backImage": 1,
                        // "backImage": {
                        //     '$concat': [config.SERVER_URL, config.IMAGE.KYC_URL_PATH, "$idProof.backImage"]
                        // },
                        "selfiImage": 1,
                        // "selfiImage": {
                        //     '$concat': [config.SERVER_URL, config.IMAGE.KYC_URL_PATH, "$idProof.selfiImage"]
                        // },
                        "status": 1
                    },
                    "addressProof": {
                        "type": 1,
                        "frontImage": 1,
                        // "frontImage": {
                        //     '$concat': [config.SERVER_URL, config.IMAGE.KYC_URL_PATH, "$addressProof.frontImage"]
                        // },
                        "status": 1

                    },
                }
            },
            { "$match": filter },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
        ])
        let alldata=await UserKyc.find({})
        let result = {
            data,
            count: count.length,
            alldata
        }

        return res.status(200).json({ "success": true, result })
    }
    catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/** 
 * Approve User Kyc Doc's
 * URL: /api/kyc/addressproof
 * METHOD : POST
 * BODY : userId, formType(idProof,addressProof)
*/
export const approveUserKyc = async (req, res) => {
    try {
        let reqBody = req.body;
        if (!["idProof", "addressProof"].includes(reqBody.formType)) {
            return res.status(400).json({ "success": false, 'message': "Invalid type" })
        }
        let userData=await User.findOne({'_id':reqBody.userId})
        let kycData = await UserKyc.findOne({ "userId": reqBody.userId }).populate('userId')
        if (!kycData) {
            return res.status(400).json({ "success": false, 'message': "No Data" })
        }

        if (kycData.status == 'new') {
            return res.status(400).json({ "success": false, 'message': "Upload kyc document" })
        }

        if (kycData.status == 'approved') {
            return res.status(400).json({ "success": false, 'message': "KYC doc's already approved" })
        }

        if (kycData.status == 'rejected') {
            return res.status(400).json({ "success": false, 'message': "KYC doc's was rejected. Please upload new document" })
        }


        if (reqBody.formType == 'idProof') {
            userData.IDstatus=="Verified"
            kycData.idProof.status = "approved";
        } else if (reqBody.formType == 'addressProof') {
            userData.Addresstatus=="Verified"
            kycData.addressProof.status = "approved";
        }

        let content = {
            'email': kycData && kycData.userId && kycData.userId.email,
            'proofType': reqBody.formType
        };

        mailTemplateLang({
            'userId': kycData && kycData.userId && kycData.userId._id,
            'identifier': 'KYC_APPROVED',
            'toEmail': kycData && kycData.userId && kycData.userId.email,
            content
        })

        await userData.save();
        await kycData.save();
        return res.status(200).json({ 'success': true, "message": "KYC document approved successfully" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Something went worng" })
    }
}

/** 
 * Reject User Kyc Doc's
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : userId, formType(idProof,addressProof), reason
*/
export const rejectUserKyc = async (req, res) => {
    try {
        let reqBody = req.body;
        if (!["idProof", "addressProof"].includes(reqBody.formType)) {
            return res.status(400).json({ "success": false, 'message': "Invalid type" })
        }

        let kycData = await UserKyc.findOne({ "userId": reqBody.userId }).populate('userId');
        if (!kycData) {
            return res.status(400).json({ "success": false, 'message': "No Data" })
        }

        if (kycData.status == 'new') {
            return res.status(400).json({ "success": false, 'message': "Upload kyc document" })
        }

        if (kycData.status == 'approved') {
            return res.status(400).json({ "success": false, 'message': "KYC doc's already approved" })
        }

        if (kycData.status == 'rejected') {
            return res.status(400).json({ "success": false, 'message': "KYC doc's was rejected. Please upload new document" })
        }


        if (reqBody.formType == 'idProof') {
            kycData.idProof.status = "rejected";
            kycData.idProof.reason = reqBody.reason;
        } else if (reqBody.formType == 'addressProof') {
            kycData.addressProof.status = "rejected";
            kycData.addressProof.reason = reqBody.reason;
        }

        let content = {
            'email': kycData && kycData.userId && kycData.userId.email,
            'proofType': reqBody.formType,
            'reason': reqBody.reason
        };
        
        // console.log(kycData,'----kycData')
        mailTemplateLang({
            'userId': kycData && kycData.userId && kycData.userId._id,
            'identifier': 'KYC_REJECTED',
            'toEmail': kycData && kycData.userId && kycData.userId.email,
            content
        })

        await kycData.save();
        // let checkUser =await User.findOne({ '_id': reqBody.userId})
        // let content = {
        //    'date': new Date(),
        //    'reason':reqBody.reason
        // };
        // console.log("Checkusrerrrrrrr----",checkUser.email)
        // mailTemplateLang({
        //     'userId': checkUser._id,
        //     'identifier': emailidentifier,
        //     'toEmail': checkUser.email,
        //     content
        // })

        let description="KYC : Rejected | Reason :"+reqBody.reason;
      
        let newNotification = new Notification({
            'description': description,
            'userId': reqBody.userId,
            'type':"General",
            'category': "KYC Status",
            
        });
         newNotification.save();
        return res.status(200).json({ 'success': true, "message": "KYC document rejected successfully" })
    }
    catch (err) {
        console.log("Error----",err)
        return res.status(500).json({ "success": false, 'message': "Something went worng" })
    }
}