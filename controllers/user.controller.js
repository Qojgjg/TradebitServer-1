// import package
import mongoose from 'mongoose';
import node2fa from 'node-2fa';
import couponCode from 'coupon-code'
import moment from 'moment';
import Contact from '../models/contactus'

// import modal
import {
    User,
    UserSetting,
    UserKyc,
    Currency,
    Language,
    SiteSetting
} from '../models';
import P2PChat from '../models/P2PChat'
import Assets from '../models/Assets'
//admin helpers

import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers';
import { Notification } from '../models';
import { IncCntObjId } from '../lib/generalFun';
import ReferTable from '../models/Referencetable';

// import LoginHistory from '../modals/loginHistory';
// import ReferralHistory from '../modals/referralHistory';
// import Setting from '../modals/setting';
// import Assets from '../modals/assets';

// import controller
import { mailTemplateLang } from './emailTemplate.controller';
import { createUserKyc } from './userKyc.controller';
import { createUserAsset } from './assets.controller';

// import config
import config from '../config';

// import lib
import { encryptString, decryptString } from '../lib/cryptoJS';
import { sentSms } from '../lib/smsGateway';
import * as recaptchaFun from '../lib/recaptcha';
import { generatePassword, comparePassword } from '../lib/bcrypt';
// import config from '../lib/config';
import isEmpty from '../lib/isEmpty';
// import { encrypt, decrypt } from '../lib/crypto';
// import { oneTimePassword } from '../lib/userHelpers';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Create New User
 * URL: /api/register
 * METHOD : POST
 * BODY : email, password, confirmPassword, referalcode, langCode
*/
export const createNewUser = async (req, res) => {
    try {
        let reqBody = req.body;
           
        let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
        if (recaptcha && recaptcha.status == false) {
            return res.status(500).json({ "success": false, 'message': "Invalid reCaptcha" })
        }
        let { passwordStatus, hash } = await generatePassword(reqBody.password);

        if (!passwordStatus) {
            return res.status(500).json({ "status": false, 'errors': { 'messages': "Error on server" } })
        }
        if (reqBody.roleType == 1) {
            reqBody.email = reqBody.email.toLowerCase();

            let checkUser = await User.findOne({ 'email': reqBody.email })

            if (checkUser) {
                return res.status(400).json({ 'success': false, 'errors': { 'email': "Email already exists" } });
            }

            const referralcode = couponCode.generate();
            const userid = Math.floor(100000 + Math.random() * 900000);

            let newUser = new User({
                'email': reqBody.email,
                'password': hash,
                'userid': userid,
                'referencecode': referralcode,
            });
            newUser.uniqueId = IncCntObjId(newUser._id)

            if (!isEmpty(reqBody.referalcode)) {
                let checkReferralUser = await User.findOne({ "referencecode": reqBody.referalcode });
                if (!checkReferralUser) {
                    return res.status(500).json({ "success": false, 'errors': { 'referalcode': "Invalid referal code" } })
                }

               /* await ReferTable.update(
                        { 'userId': checkReferralUser._id },
                        { '$push': { refer_child: curuser._id } }
                    )
                    */

                newUser.referaluserid = checkReferralUser._id;
            }

            let newDoc = await newUser.save();


             if (!isEmpty(newDoc.referaluserid)) {
                 await ReferTable.update(
                     { 'userId': newDoc.referaluserid },
                     { '$push': { 'refer_child': newDoc._id } }
                 )
             }

            let encryptToken = encryptString(newDoc._id, true)
            let content = {
                'email': newDoc.email,
                'confirmMailUrl': `${config.FRONT_URL}/email-verification/${encryptToken}`,
                'date': newDoc.createdAt
            };
            createUserKyc(newDoc._id)
            createUserAsset(newDoc)
            defaultUserSetting(newDoc);
            mailTemplateLang({
                'userId': newDoc._id,
                'identifier': 'activate_register_user',
                'toEmail': reqBody.email,
                content
            })

            // mailTemplate('activate_register_user', reqBody.langCode, reqBody.email, content)

            return res.status(200).json({ "success": true, "message": "Your account has been successfully registered. Please check your email and verify your account. Thank you!" })
        }
        else if (reqBody.roleType == 2) {


            let checkMobile = await User.findOne({ "phoneNo": reqBody.phoneNo });
            let smsOtp = Math.floor(100000 + Math.random() * 900000);
            if (checkMobile) {


               if (checkMobile.phoneStatus == 'verified') {
                    return res.status(400).json({ "success": false, 'errors': { 'phoneNo': "Phone Number already exists" } })
              }

                // checkMobile.password = hash;
                // checkMobile.role = reqBody.roleType;
                checkMobile.otp = smsOtp;
                checkMobile.otptime = new Date();
                console.log("otp---",smsOtp)
                await checkMobile.save();              
                let encryptToken = encryptString(checkMobile._id)

                let smsContent = {
                    to: `+91${checkMobile.phoneNo}`,
                    body: '[Tradebit] Verification code: '+smsOtp+'. If this was not you, please inform Support. Beware of scam calls and SMS phishing. Verify sources with Tradebit Exchange.'

                }
               if (checkMobile.phoneStatus !== 'verified') 
                {
                var smsstate= sentSms(smsContent);
                if(smsstate)
                return res.status(200).json({ "status": true, 'message': "OTP sent successfully, It is only valid for 2 minutes", "userToken": encryptToken, "isMobile": true })
                }
            }
            if (checkMobile == null) {

                const referralcode = couponCode.generate();
                let newUserData = new User({
                    "password": hash,
                    //  "role": reqBody.roleType,
                     "phoneCode": reqBody.phoneCode,
                    "phoneNo": reqBody.phoneNo,
                    "otp": smsOtp,
                    "otptime": new Date(),
                     "referralCode": referralcode
                });
                
                newUserData.uniqueId = IncCntObjId(newUserData._id)

                if (!isEmpty(reqBody.referalcode)) {
                    let checkReferralUser = await User.findOne({ "referencecode": reqBody.referalcode });
                    if (!checkReferralUser) {
                        return res.status(500).json({ "success": false, 'errors': { 'referalcode': "Invalid referal code" } })
                    }
    
                   /* await ReferTable.update(
                        { 'userId': checkReferralUser._id },
                        { '$push': { refer_child: curuser._id } }
                    )
                    */
    
                    newUser.referaluserid = checkReferralUser._id;
                }
                let userData = await newUserData.save();

                if (!isEmpty(userData.referaluserid)) {
                    await ReferTable.update(
                        { 'userId': userData.referaluserid },
                        { '$push': { 'refer_child': userData._id } }
                    )
                }
                let encryptToken = encryptString(userData._id)



                let smsContent = {
                    to: "+91"+reqBody.phoneNo,
                    body: '[Tradebit] Verification code: '+smsOtp+'. If this was not you, please inform Support. Beware of scam calls and SMS phishing. Verify sources with Tradebit Exchange.'

                }
                console.log("content----",smsContent)
                console.log("otp---",smsOtp)
                //sentSms(smsContent);
               var smsstate= sentSms(smsContent);
                if(smsstate){
                createUserKyc(userData._id)
                createUserAsset(userData)
                defaultUserSetting(userData);
                return res.status(200).json({ "status": true, 'message': "OTP sent successfully, It is only valid for 2 minutes", "userToken": encryptToken, "isMobile": true })
                } 
            }
        }
        else {
            console.log(err, "errerrerrerrerrerr1111111111111");
            return res.status(500).json({ "status": false, 'message': "Something went wrong" })
        }

        // mailTemplate('activate_register_user', reqBody.langCode, reqBody.email, content)


    }
    catch (err) {
        console.log(err, "errerrerrerrerrerr2222222222222222222222");
        return res.status(500).json({ "success": false, 'message': "Something went wrong" })
    }
}

// encrypFile()
// async function encrypFile(){
//     let func = await encryptString("545cc394c0fa901a1600a591ed2d470a622ab560639a4d0c5069051fd1a1f349")
//     console.log(func,'----------func')
// }



/**
 * Email Verification
 * METHOD : POST
 * URL : /api/confirm-mail 
 * BODY : userId
*/
export const confirmMail = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = decryptString(reqBody.userId, true)
        let userData = await User.findOne({ "_id": userId });
        if (!userData) {
            return res.status(400).json({ "success": false, 'message': "No user found" })
        }
        userData.status = 'verified';
        userData.emailStatus = 'verified';

        await userData.save();
        return res.status(200).json({ 'success': true, 'message': "Your email has been verified, you can now log in" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

/**
 * User Login
 * METHOD : POST
 * URL : /api/login 
 * BODY : email, password, loginHistory, langCode, twoFACode
*/
export const userLogin = async (req, res) => {
    console.log("req.body----------",req.body)
    try {

        let reqBody = req.body;
        let checkUser;
        let isLoginHistory = !isEmpty(req.body.loginHistory)
        let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
        if (recaptcha && recaptcha.status == false) {
            return res.status(500).json({ "success": false, 'messages': "Invalid reCaptcha" })
        }

        if (reqBody.roleType == 1) {
            reqBody.email = reqBody.email.toLowerCase();
            checkUser = await User.findOne({ 'email': reqBody.email })
            if (!checkUser) {
                return res.status(404).json({ 'success': false, 'errors': { 'email': "Email not found" } });
            }

            if (checkUser.status == 'unverified') {
                return res.status(400).json({ 'success': false, 'messages': "Your account still not activated" });
            }
            if (checkUser != null) {
                if (checkUser.active == "deactive") {
                    return res.status(400).json({ "status": false, 'messages': "Your Account Deactivated By Admin ,Please Contact Admin"})
          
                  // console.log("rttttttttttttttttttttt",checkUser.active)
                //   return res.status(400).json({ "success": false, 'errors': { 'messages': "Your Account Deactivated By Admin ,Please Contact Admin" } })
          
                }
              }
        }
        else if (reqBody.roleType == 2) {
            checkUser = await User.findOne({ 'phoneNo': reqBody.phoneNo })
            if (!checkUser) {
                return res.status(404).json({ 'success': false, 'errors': { 'phoneNo': "Phone number not found" } });
            }
            if (checkUser.phoneStatus == "unverified") {
                return res.status(400).json({ 'success': false, 'messages': "Your Phone number is not verified" });
            }
             if (checkUser != null) {
                if (checkUser.active == "deactive") {
          
                  // console.log("rttttttttttttttttttttt",checkUser.active)
                  return res.status(400).json({ "status": false, 'messages': "Your Account Deactivated By Admin ,Please Contact Admin"})
          
                }
              }
        }

        let { passwordStatus } = await comparePassword(reqBody.password, checkUser.password);
        if (!passwordStatus) {
            loginHistory({ ...reqBody.loginHistory, ...{ "status": 'Failed', "reason": "Password incorrect", "userId": checkUser._id } })
            return res.status(400).json({ 'success': false, 'errors': { 'password': "Password incorrect" } });
        }
        if ((!checkUser.phoneStatus && reqBody.roleType == 2) || (!checkUser.emailStatus && reqBody.roleType == 1)) {
            if (isLoginHistory) {
                loginHistory({ ...reqBody.loginHistory, ...{ "status": "Failure", "reason": "Unverified user", "userId": checkUser._id } })
            }
            return res.status(400).json({ "status": false, "messages": "Unverified user" })
        }

        if (checkUser.google2Fa && !isEmpty(checkUser.google2Fa.secret)) {
            if (isEmpty(reqBody.twoFACode)) {
                return res.status(200).json({ 'success': true, 'status': 'TWO_FA', 'message': "TWO_FA_CODE" })
            } else {
                let check2Fa = node2fa.verifyToken(checkUser.google2Fa.secret, reqBody.twoFACode)
                if (!(check2Fa && check2Fa.delta == 0)) {
                    return res.status(400).json({ 'success': false, 'errors': { 'twoFACode': "INVALID_CODE" } })
                }
            }
        }

        let payloadData = {
            "_id": checkUser._id
        }
        let token = new User().generateJWT(payloadData);

        if (isLoginHistory) {
            loginHistory({ ...reqBody.loginHistory, ...{ "status": 'Success', "reason": "", "userId": checkUser._id } })
        }
        if (checkUser.emailStatus == "verified") {
            let content = {
                'broswername': reqBody.loginHistory && reqBody.loginHistory.broswername,
                'ipaddress': reqBody.loginHistory && reqBody.loginHistory.ipaddress,
                'countryName': reqBody.loginHistory && reqBody.loginHistory.countryName,
                'date': new Date(),
            };

            mailTemplateLang({
                'userId': checkUser._id,
                'identifier': 'Login_notification',
                'toEmail': checkUser.email,
                content
            })
            let description = "IP:" + reqBody.loginHistory.ipaddress + "|Country:" + reqBody.loginHistory.countryName + "|Browser:" + reqBody.loginHistory.broswername + "";

            let newNotification = new Notification({
                'description': description,
                'userId': checkUser._id,
                'type': "General",
                'category': "Login",

            });
            console.log(newNotification)
            var noti=await newNotification.save();

        }

        // mailTemplate('Login_notification', reqBody.langCode, checkUser.email, content)
        let result = userProfileDetail(checkUser)
        let userSetting = await UserSetting.findOne({ "userId": checkUser._id }, {
            "_id": 0, "theme": 1, "afterLogin": 1
        })

        return res.status(200).json({ 'success': true, 'status': "SUCCESS", 'messages': "Login successfully", token, result, userSetting })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

const loginHistory = ({
    countryName,
    countryCode,
    ipaddress,
    region, // regionName
    broswername,
    ismobile,
    os,
    status,
    reason,
    userId
}) => {

    let data = {
        countryName,
        countryCode,
        ipaddress,
        regionName: region,
        broswername,
        ismobile,
        os,
        status,
        createdDate: new Date(),
        reason,
    }


    User.update({ '_id': userId }, {
        '$push': {
            'loginhistory': data,
        },
    }, (err, data) => { })
}

export const check2FA = async (req, res) => {
    try {

        let userId = req.user.id;
        let checkUser = await User.findOne({ '_id': userId })
        if (checkUser.google2Fa && !isEmpty(checkUser.google2Fa.secret)) {
            return res.status(200).json({ 'success': true, 'status': 'TWO_FA', 'message': "Enabled" })
        } else {
            return res.status(400).json({ 'success': false, 'status': 'TWO_FA_ACTIVATE', 'message': "Not Enabled" })
        }
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}



export const verifyOtp = async (req, res, next) => {
    try {

        let reqBody = req.body, otpTime = new Date(new Date().getTime() - 120000); //2 min

        let userId = decryptString(reqBody.otpAuth)
        // console.log(userId,reqBody.otpAuth,'userIduserId')
        let userData = await User.findOne({ "_id": userId });
        if (!userData) {
            return res.status(400).json({ "status": false, 'message': "No user found" })
        }

        if (userData.otptime <= otpTime) {
            return res.status(400).json({ "status": false, 'errors': { 'otp': "Expiry OTP" } })
        }

        if (userData.otp != reqBody.otp) {
            return res.status(400).json({ "status": false, 'errors': { 'otp': "Invalid OTP" } })
        }

        userData.otp = '';
        userData.phoneStatus = 'verified';
        await userData.save();
        return res.status(200).json({ 'status': true, 'message': "OTP verified successfully" })

    }
    catch (err) {
        console.log(err, '-----err')
        return res.status(500).json({ "status": false, 'messages': "Error on server" })
    }
}

/**
 * Get User Profile
 * METHOD : GET
 * URL : /api/userProfile
*/
export const getUserProfile = (req, res) => {
    User.findOne(
        { "_id": req.user.id },
        (err, userData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
            }
            let result = userProfileDetail(userData)

            return res.status(200).json({ 'success': true, 'result': result });
        }
    )
}

/**
 * Edit User Profile
 * METHOD : PUT
 * URL : /api/userProfile
 * BODY : firstName,lastName,blockNo,address,country,state,city,postalCode
*/
export const editUserProfile = async (req, res) => {
    try {
        let reqBody = req.body;
        let userData = await User.findOne({ "_id": req.user.id });

        userData.firstName = reqBody.firstName;
        userData.lastName = reqBody.lastName;
        userData.blockNo = reqBody.blockNo;
        userData.address = reqBody.address;
        userData.country = reqBody.country;
        userData.state = reqBody.state;
        userData.city = reqBody.city;
        userData.postalCode = reqBody.postalCode;

        let updateUserData = await userData.save();
        let result = userProfileDetail(updateUserData)

        return res.status(200).json({ "success": false, 'message': "PROFILE_EDIT_SUCCESS", 'result': result })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

const userProfileDetail = (userData) => {
    let data = {
        'userId': userData._id,
        'uniqueId': userData.uniqueId,
        'firstName': userData.firstName,
        'lastName': userData.lastName,
        'email': userData.email,
        'blockNo': userData.blockNo,
        'address': userData.address,
        'city': userData.city,
        'state': userData.state,
        'country': userData.country,
        'postalCode': userData.postalCode,
        'emailStatus': userData.emailStatus,
        'phoneStatus': userData.phoneStatus,
        'phonenumber': userData.phonenumber,
        'type': userData.type,
        'twoFAStatus': !isEmpty(userData.google2Fa.secret) ? 'enabled' : 'disabled',
        'createAt': moment(userData.createAt).format('DD MMM YYYY'),
        'loginHistory': (userData.loginhistory && userData.loginhistory.slice(-1).length > 0) ? userData.loginhistory.slice(-1)[0] : {},
        'bankDetail': {},
    }

    if (userData.bankDetails && userData.bankDetails.length > 0) {
        let bankDetail = userData.bankDetails.find((el => el.isPrimary == true))
        if (bankDetail) {
            data.bankDetail['bankName'] = bankDetail.bankName;
            data.bankDetail['accountNo'] = bankDetail.accountNo;
            data.bankDetail['holderName'] = bankDetail.holderName;
            data.bankDetail['bankcode'] = bankDetail.bankcode;
            data.bankDetail['country'] = bankDetail.country;
            data.bankDetail['city'] = bankDetail.city;
        }
    }

    return data
}

/**
 * Update Bank Detail
 * METHOD : POST
 * URL : /api/bankdetail
 * BODY : bankId, bankName,accountNo,holderName,bankcode,country,city
 */
export const updateBankDetail = async (req, res) => {
    try {
        let bankDetailsArr = [], reqBody = req.body;
        let message = '';
        let userData = await User.findOne({ "_id": req.user.id })

        if (!isEmpty(reqBody.bankId) && mongoose.Types.ObjectId.isValid(reqBody.bankId)) {
            let bankData = userData.bankDetails.id(reqBody.bankId);

            if (bankData.isPrimary == false && reqBody.isPrimary == true) {
                let isPrimaryId = userData.bankDetails.find(el => el.isPrimary == true)
                if (isPrimaryId) {
                    let isPrimaryData = userData.bankDetails.id(isPrimaryId);
                    isPrimaryData.isPrimary = false;
                }

            } else if (bankData.isPrimary == true && reqBody.isPrimary == false) {
                reqBody.isPrimary = true;
            }

            bankData.bankName = reqBody.bankName;
            bankData.accountNo = reqBody.accountNo;
            bankData.holderName = reqBody.holderName;
            bankData.bankcode = reqBody.bankcode;
            bankData.country = reqBody.country;
            bankData.city = reqBody.city;
            bankData.isPrimary = reqBody.isPrimary;
            message = "BANK_EDIT_SUCCESS"
        } else {
            if (userData.bankDetails && userData.bankDetails.length > 0) {
                bankDetailsArr = userData.bankDetails;

                if (reqBody.isPrimary == true) {
                    let bankDetails = userData.bankDetails.find(el => el.isPrimary == true)
                    let bankData = userData.bankDetails.id(bankDetails._id);
                    bankData.isPrimary = false;
                }

                bankDetailsArr.push({
                    bankName: reqBody.bankName,
                    accountNo: reqBody.accountNo,
                    holderName: reqBody.holderName,
                    bankcode: reqBody.bankcode,
                    country: reqBody.country,
                    city: reqBody.city,
                    isPrimary: reqBody.isPrimary
                })
            } else {
                bankDetailsArr.push({
                    bankName: reqBody.bankName,
                    accountNo: reqBody.accountNo,
                    holderName: reqBody.holderName,
                    bankcode: reqBody.bankcode,
                    country: reqBody.country,
                    city: reqBody.city,
                    isPrimary: true
                })
            }
            userData.bankDetails = bankDetailsArr;
            message = 'BANK_ADD_SUCCESS'
        }

        let updateData = await userData.save();
        let notify = new Notification({
            'description': message,
            'userId': req.user.id,
            'type': "General",
            'category': "Bank Detail",

        });
        await notify.save();

        return res.status(200).json({ 'success': true, 'message': message, 'result': updateData.bankDetails })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * GET Bank Detail
 * METHOD : GET
 * URL : /api/bankdetail
 */
export const getBankDetail = (req, res) => {
    User.findOne(
        { "_id": req.user.id },
        {
            "bankDetails._id": 1,
            "bankDetails.bankName": 1,
            "bankDetails.holderName": 1,
            "bankDetails.accountNo": 1,
            "bankDetails.bankcode": 1,
            "bankDetails.country": 1,
            "bankDetails.city": 1,
            "bankDetails.isPrimary": 1
        }, (err, userData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'message': "Error on server" })
            }
            return res.status(200).json({ 'success': true, 'message': "Success", 'result': userData.bankDetails })
        }
    )
}

/**
 * Delete Bank Detail
 * METHOD : PUT
 * URL : /api/bankdetail
 * BODY : bankId
*/
export const deleteBankDetail = async (req, res) => {
    try {
        let reqBody = req.body;
        let userData = await User.findOne({ "_id": req.user.id })

        let bankDataRemove = userData.bankDetails.id(reqBody.bankId);

        if (bankDataRemove.isPrimary) {
            let bankDetails = userData.bankDetails.find(el => el._id.toString() != reqBody.bankId)
            if (bankDetails) {
                let bankData = userData.bankDetails.id(bankDetails._id);
                bankData.isPrimary = true;
            }
        }

        bankDataRemove.remove();
        let updateData = await userData.save();

        return res.status(200).json({ 'success': true, 'message': "BANK_DELETE_SUCCESS", 'result': updateData.bankDetails })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Set Primary Bank 
 * METHOD : PATCH
 * URL : /api/bankdetail
 * BODY : bankId
*/
export const setPrimaryBank = async (req, res) => {
    try {
        let reqBody = req.body;
        let userData = await User.findOne({ "_id": req.user.id })

        let bankData = userData.bankDetails.id(reqBody.bankId);
        if (!bankData) {
            return res.status(400).json({ "success": false, 'message': "NO_DATA" })
        }

        if (!bankData.isPrimary) {
            let isPrimaryId = userData.bankDetails.find(el => el.isPrimary == true)
            if (isPrimaryId) {
                let isPrimaryData = userData.bankDetails.id(isPrimaryId);
                isPrimaryData.isPrimary = false;
            }
            bankData.isPrimary = true;
        }

        let updateData = await userData.save();

        return res.status(200).json({ 'success': true, 'message': "BANK_SET_PRIMARY_SUCCESS", 'result': updateData.bankDetails })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Change New Password
 * METHOD : POST
 * URL : /api/changePassword
 * BODY : password, confirmPassword, oldPassword
*/
export const changePassword = async (req, res) => {
    try {
        let reqBody = req.body;


        let userData = await User.findOne({ "_id": req.user.id });
        let userSetting = await UserSetting.findOne({ "userId": req.user.id });
        if (!userData) {
            return res.status(500).json({ "success": false, 'message': "User not found" })
        }
        let { passwordStatus } = await comparePassword(reqBody.oldPassword, userData.password);

        if (!passwordStatus) {
            return res.status(400).json({ 'success': false, 'errors': { 'oldPassword': "Incorrect Old Password" } });
        }
        let { newpasswordStatus, hash } = await generatePassword(reqBody.password);

        userData.password = hash;
        await userData.save();

        if(userSetting.passwordChange){

            let content = {
                  'email' : userData.email,
                  'message' : 'Your Password Changed Successfully'
               } 
            mailTemplateLang({
                'userId': userData._id,
                'identifier': 'Alert_Notification',
                'toEmail': userData.email,
                content
            })
        }

        let notify = new Notification({
            'description': "Password Changed Successfully",
            'userId': req.user.id,
            'type': "General",
            'category': "Password Change",

        });
        await notify.save();
        return res.status(200).json({ 'success': true, 'message': "PASSWORD_CHANGE_SUCCESS" });
    }
    catch (err) {
        console.log("Error---", err)
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Get 2FA Code
 * METHOD : GET
 * URL : /api/security/2fa
 */
export const get2faCode = async (req, res) => {
    let result = {};
    User.findOne(
        { "_id": req.user.id },
        (err, userData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
            }
            let result = generateTwoFa(userData)
            return res.status(200).json({ 'success': true, 'result': result })
        }
    )
}

/**
 * Update 2FA Code
 * METHOD : PUT
 * URL : /api/security/2fa
 * BODY : code, secret, uri
 */
export const update2faCode = async (req, res) => {
    try {
        let reqBody = req.body;

        let check2Fa = node2fa.verifyToken(reqBody.secret, reqBody.code)
        // console.log(check2Fa,'----check2Fa')
        if (check2Fa && check2Fa.delta == 0) {
            let userSetting = await UserSetting.findOne({ 'userId': req.user.id })
            let updateData = await User.findOneAndUpdate(
                { "_id": req.user.id },
                {
                    "google2Fa.secret": reqBody.secret,
                    "google2Fa.uri": reqBody.uri,
                },
                { "new": true }
            )
            let result = generateTwoFa(updateData)

            if (userSetting.twoFA) {
                let content = {
                    message: "2Fa Enabled Successfully",
                    email: updateData.email
                }
                mailTemplateLang({
                    'userId': updateData._id,
                    'identifier': 'Alert_Notification',
                    'toEmail': updateData.email,
                    'content': content
                })
            }

            let notify = new Notification({
                'description': "2Fa Enabled Successfully",
                'userId': req.user.id,
                'type': "General",
                'category': "2FA Enable",

            });

            await notify.save();
            // let userSetting = await UserSetting.findOne({'userId':req.user.id})
            
            // if(userSetting){
            //     if(userSetting.twoFA){
            //              let checkUser =await User.findOne({ '_id': req.user.id})
                  
            //         console.log("Checkusrerrrrrrr----",checkUser.email)
            //         mailTemplateLang({
            //             'userId': checkUser._id,
            //             'identifier': "enable_2fa",
            //             'toEmail': checkUser.email,
                    
            //         })
            //     }
            // }
            return res.status(200).json({ 'success': true, 'message': "TWO_FA_ENABLE_SUCCESS", result })
        }

        return res.status(400).json({ 'success': false, 'errors': { 'code': "INVALID_CODE" } })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}


export const alertNotification = async(req, res) => {
    try {
        let reqBody = req.body
       
        var state={"twoFa":reqBody.twoFA}
        let updateData = await UserSetting.findOneAndUpdate({'userId':ObjectId(req.user.id)},{$set:reqBody},{new:true})
       
         if(updateData){
             return res.json({status:true,message:"Notification Updated Successfully"})
         }
    }catch (err) {
         return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
     
 }

/**
 * Disable 2FA Code
 * METHOD : PATCH
 * URL : /api/security/2fa
 * Body : code, secret, uri
 */
export const diabled2faCode = async (req, res) => {
    try {
        let reqBody = req.body;
        let userData = await User.findOne({ "_id": req.user.id })
        let userSetting = await UserSetting.findOne({ 'userId': req.user.id })

        if (userData.google2Fa && userData.google2Fa.secret != reqBody.secret) {
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
        }

        let check2Fa = node2fa.verifyToken(reqBody.secret, reqBody.code)
        if (check2Fa && check2Fa.delta == 0) {
            userData.google2Fa.secret = '';
            userData.google2Fa.uri = '';
            let updateData = await userData.save();
            let result = generateTwoFa(updateData)

            if (userSetting.twoFA) {

                let content = {
                    message: "2Fa Disabled Successfully",
                    email: userData.email
                }
                mailTemplateLang({
                    'userId': userData._id,
                    'identifier': 'Alert_Notification',
                    'toEmail': userData.email,
                    'content': content
                })
            }

            let notify = new Notification({
                'description': "2FA Disabled Successfully",
                'userId': req.user.id,
                'type': "General",
                'category': "2FA Disable",

            });
            await notify.save();
            return res.status(200).json({ 'success': true, 'message': "TWO_FA_DISABLE_SUCCESS", result })
        }
        return res.status(400).json({ 'success': false, 'errors': { 'code': "INVALID_CODE" } })

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

export const generateTwoFa = (userData) => {
    let result = {}
    if (userData && userData.google2Fa.secret != "") {
        result = {
            secret: userData.google2Fa.secret,
            imageUrl: config.NODE_TWOFA.QR_IMAGE + userData.google2Fa.uri,
            uri: userData.google2Fa.uri,
            twoFaStatus: "enabled"
        }

    } else {
        let newSecret = node2fa.generateSecret({ 'name': config.NODE_TWOFA.NAME, 'account': userData.email })
        result = {
            secret: newSecret.secret,
            imageUrl: newSecret.qr,
            uri: newSecret.uri,
            twoFaStatus: "disabled"
        }
    }
    return result;
}

export const defaultUserSetting = async (userData) => {
    if (!isEmpty(userData)) {
        try {
            let newSetting = new UserSetting({
                "userId": userData._id
            });

            // let currencyData = await Currency.findOne({ "type": "fiat", /* "isPrimary": true  */ })
            // if (currencyData) {
            //     newSetting.currencySymbol = currencyData.currencySymbol;
            // }

            // let languageData = await Language.findOne({ "isPrimary": true })
            // if (languageData) {
            //     newSetting.languageId = languageData._id;
            // }

            await newSetting.save();
        } catch (err) {
        }
    }
}

/** 
 * Get User setting
 * METHOD : GET
 * URL: /api/userSetting
*/
export const getUserSetting = (req, res) => {
    UserSetting.findOne({ "userId": req.user.id }, { "_id": 0, "createdAt": 0, "updatedAt": 0, }, (err, data) => {
        if (err) {
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
        }
        return res.status(200).json({ 'success': true, 'message': "FETCH_SUCCESS", result: data })
    })
}

/**
 * Edit User Setting
 * METHOD : PUT
 * URL : /api/userSetting
 * BODY : languageId, theme, currencySymbol, timeZone(name,GMT), afterLogin(page,url)
 */
export const editUserSetting = async (req, res) => {
    try {
        let reqBody = req.body;
        console.log("ReqBody----", reqBody)
        await UserSetting.findOneAndUpdate(
            { "userId": req.user.id },
            {
                "languageId": reqBody.languageId,
                "theme": reqBody.theme,
                "currencySymbol": reqBody.currencySymbol,
                "timeZone": reqBody.timeZone,
                "afterLogin": reqBody.afterLogin,
            },
            {
                "fields": { "_id": 0, "createdAt": 0, "updatedAt": 0 },
                "new": true
            },
            (err, data) => {
                if (err) {
                    return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
                }
                return res.status(200).json({ 'success': true, 'message': "EDIT_SETTING_SUCCESS", result: data })
            }
        )
    } catch (err) {
        console.log("Error---", err)
    }
}

/**
 * Edit User Notification
 * METHOD : PUT
 * URL : /api/editNotif
 * BODY : name, checked
 */
export const editNotif = async (req, res) => {
    try {
        let reqBody = req.body;
        let usrSetting = await UserSetting.findOne({ "userId": req.user.id }, { "createdAt": 0, "updatedAt": 0 })

        if (!usrSetting) {
            return res.status(400).json({ "success": false, 'message': "NO_DATA" })
        }

        if (reqBody.name in usrSetting) {
            usrSetting[reqBody.name] = reqBody.checked;

        }
        let updateData = await usrSetting.save();

        return res.status(200).json({
            'success': true, 'message': "EDIT_SETTING_SUCCESS", result: {
                currencySymbol: updateData.currencySymbol,
                theme: updateData.theme,
                afterLogin: updateData.afterLogin,
                languageId: updateData.languageId,
                timeZone: updateData.timeZone,
                twoFA: updateData.twoFA,
                passwordChange: updateData.passwordChange,
                siteNotification: updateData.siteNotification,
            }
        })

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Check Forgot Password
 * METHOD : POST
 * URL : /api/forgotPassword
 * BODY : email, reCaptcha
*/
export const checkForgotPassword = async (req, res) => {
    try {
        let reqBody = req.body;

        let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
        if (recaptcha && recaptcha.status == false) {
            return res.status(500).json({ "success": false, 'message': "Invalid reCaptcha" })
        }

        let userData = await User.findOne({ "email": reqBody.email });
        if (!userData) {
            return res.status(400).json({ "success": false, 'errors': { 'email': "EMAIL_NOT_EXISTS" } })
        }

        let encryptToken = encryptString(userData._id, true)
        let content = {
            'name': userData.firstName,
            'confirmMailUrl': `${config.FRONT_URL}/reset-password/${encryptToken}`
        }

        userData.mailToken = encryptToken;
        await userData.save();
        mailTemplateLang({
            'userId': userData._id,
            'identifier': 'User_forgot',
            'toEmail': userData.email,
            content
        })

        return res.status(200).json({ 'success': true, "message": "Password Reset Link Sent to your Mail" })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Something Went Wrong" })
    }
}

/**
 * Reset Password
 * METHOD : POST
 * URL : /api/resetPassword
 * BODY : password, confirmPassword, authToken
*/
export const resetPassword = async (req, res) => {
    try {
        let reqBody = req.body;


        let userId = decryptString(reqBody.authToken, true)
        let userData = await User.findOne({ "_id": userId });
        if (!userData) {
            return res.status(500).json({ "success": false, 'message': "NOT_FOUND" })
        }

        if (!(userData.mailToken == reqBody.authToken)) {
            return res.status(400).json({ "success": false, 'message': "Your link was expiry" })
        }
        let { newpasswordStatus, hash } = await generatePassword(reqBody.password);
        console.log("Hashpassword---",hash)
        userData.password = hash;
        userData.mailToken = '';
        await userData.save();

        return res.status(200).json({ 'success': true, "message": "Updated successfully" });
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * User Upgrade
 * METHOD : POST
 * URL : /api/upgradeUser
 * BODY : upgradeType(basic,advanced,pro)
*/
export const upgradeUser = async (req, res) => {
    try {
        let reqBody = req.body;
        let userData = await User.findOne({ '_id': req.user.id });
        if (!userData) {
            return res.status(400).json({ 'success': false, 'message': "NO_DATA" })
        }

        let usrKyc = await UserKyc.findOne({ 'userId': req.user.id }, { "idProof": 1, "addressProof": 1 })

        if (!usrKyc) {
            return res.status(400).json({ 'success': false, 'message': "NO_DATA" })
        }

        if (usrKyc && usrKyc.idProof.status == 'approved' && usrKyc.addressProof.status == 'approved') {

            if (userData.type == 'not_activate' && ['advanced', 'pro'].includes(reqBody.upgradeType)) {
                return res.status(400).json({ 'success': false, 'message': "Please verify Basic User first!" })
            } else if (userData.type == 'basic' && ['pro'].includes(reqBody.upgradeType)) {
                return res.status(400).json({ 'success': false, 'message': "Please verify Advance User first!" })
            } else if (['basic_processing', 'advanced_processing', 'pro_processing'].includes(userData.type)) {
                return res.status(400).json({ 'success': false, 'message': "Your request are procesing" })
            } else if (userData.type == 'not_activate' && reqBody.upgradeType == 'basic') {
                userData.type = 'basic_processing';
                let updateDoc = await userData.save();

                let result = userProfileDetail(updateDoc)
                return res.status(200).json({ 'success': true, 'message': 'Successfully submitted', result })
            } else if (userData.type == 'basic' && reqBody.upgradeType == 'advanced') {
                userData.type = 'advanced_processing';
                let updateDoc = await userData.save();

                let result = userProfileDetail(updateDoc)
                return res.status(200).json({ 'success': true, 'message': 'Successfully submitted', result })
            } else if (userData.type == 'advanced' && reqBody.upgradeType == 'pro') {
                userData.type = 'pro_processing';
                let updateDoc = await userData.save();

                let result = userProfileDetail(updateDoc)
                return res.status(200).json({ 'success': true, 'message': 'Successfully submitted', result })
            }
        }

        return res.status(400).json({ 'success': false, 'message': 'Please verify the kyc' })

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Change New Phone
 * METHOD : POST
 * URL : /api/phoneChange
 * BODY : newPhoneCode, newPhoneNo
*/
export const changeNewPhone = async (req, res) => {
    try {

        let
            reqBody = req.body,
            smsOtp = Math.floor(100000 + Math.random() * 900000);

        let checkUser = await User.findOne({ "phoneCode": reqBody.newPhoneCode, "phoneNo": reqBody.newPhoneNo, "_id": { "$ne": req.user.id } })
        if (checkUser) {
            return res.status(401).json({ "success": false, 'errors': { 'newPhoneNo': "Phone number already exists" } })
        }

        let siteSetting = await SiteSetting.findOne({}, { 'siteName': 1 });
        console.log('siteSetting',siteSetting)
        if (!siteSetting) {
            console.log('ffff')
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
        }
        console.log('reqBody123',reqBody)

        let smsContent = {
            to: `+${reqBody.newPhoneCode}${reqBody.newPhoneNo}`,
            body: 'Your ' + siteSetting.siteName + ' OTP Code is: ' + smsOtp
        }

        let { smsStatus } = await sentSms(smsContent);
        if (!smsStatus) {
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
        }
console.log("smsOtp---",smsOtp)
        await User.updateOne(
            {
                "_id": req.user.id
            },
            {
                "newPhone": {
                    "phoneCode": reqBody.newPhoneCode,
                    "phoneNo": reqBody.newPhoneNo,
                },
                "otp": smsOtp,
                "otptime": new Date()
            }
        )
        return res.status(200).json({ "success": true, "message": "OTP sent successfully, It is only valid for 2 minutes" })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/**
 * Verify New Phone
 * METHOD : PUT
 * URL : /api/phoneChange
 * BODY : otp
*/
export const verifyNewPhone = async (req, res) => {
    try {
        let reqBody = req.body, otpTime = new Date(new Date().getTime() - 120000); //2 min
        let userData = await User.findOne({ "_id": req.user.id });

        if (userData.otptime <= otpTime) {
            return res.status(400).json({ "success": false, 'errors': { 'otp': "Expiry OTP" } })
        }

        if (userData.otp != reqBody.otp) {
            return res.status(400).json({ "success": false, 'errors': { 'otp': "Invalid OTP" } })
        }

        if (userData.newPhone.phoneCode == '' || userData.newPhone.phoneNo == '') {
            return res.status(400).json({ "success": false, 'errors': { 'otp': "Invalid new phone" } })
        }

        let checkUser = await User.findOne({ "phoneCode": userData.newPhone.phoneCode, "phoneNo": userData.newPhone.phoneNo, "_id": { "$ne": req.user.id } })
        if (checkUser) {
            return res.status(401).json({ "success": false, 'message': "Phone number already exists" })
        }


        userData.phoneCode = userData.newPhone.phoneCode;
        userData.phoneNo = userData.newPhone.phoneNo;
        userData.newPhone.phoneCode = '';
        userData.newPhone.phoneNo = '';
        userData.newPhone.otp = '';

        let updateUserData = await userData.save();

        let responseData = {
            'email': updateUserData.email,
            'phoneCode': updateUserData.phoneCode,
            'phoneNo': updateUserData.phoneNo
        }
        return res.status(200).json({ 'success': true, 'message': "Phone number changed successfully", 'result': responseData })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

export const getContactusList = async (req, res) => {
    Contact.find({}).sort({ '_id': -1 }).then(contact => {
        if (contact) {
            return res.status(200).send(contact);
        }
    });
}
export const replyContact = async (req,res) => {
    try{
       
      let contactData = await Contact.findOne({ _id: req.body._id });
      
      let errors = {}

      if(isEmpty(req.body.reply)){
        errors.reply = 'Reply field is required';
      }

      if(!isEmpty(errors)){
        return res.status(400).json({ errors : { reply : 'Reply field is required' } })  
      }

        let content = {
            'email': contactData.email,
            'replyMessage': req.body.reply,
            'date': new Date()
        }
        console.log("content---",content)

        mailTemplateLang({
            'identifier': 'contactus_reply',
            'toEmail': contactData.email,
            content
        })
      return res.status(200).json({ message: 'Reply Mail sent to user. Refreshing data...', success: true })  
    }catch(err){
        res.status(500).json({ "status": false, 'message': "error on server" })
    }
}

export const deleteContact =async(req,res)=>{
    Contact.deleteOne({ _id: req.body._id }).then(contact => {
        if (contact) {
          return res.status(200).json({ message: 'Contact deleted successfully. Refreshing data...', success: true })
        }
      });
}


/**
 * Get User List
 * METHOD : Get
 * URL : /adminapi/user
*/

export const getUserList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'active']);
        console.log("filter===========",filter)
        let count = await User.countDocuments(filter)
        let data = await User.find(filter, {
            'email': 1,
            'active': 1,
            'phoneNo':1,
            'createdAt': 1,

        }).sort({"_id":-1}).skip(pagination.skip).limit(pagination.limit)
       
        let result = {
            count,
            data
        }
        // console.log("RESSSSSSSSSSSS============",result)
        return res.status(200).json({ 'success': true, "messages": "success", result })

    } catch (err) {
        res.status(500).json({ "success": false, 'message': "error on server" })
    }

}

/**
 * Get Balance List
 * METHOD : Get
 * URL : /adminapi/getUserBalanceList
*/
export const getUserBalanceList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['currencySymbol']);
        let count = await Assets.countDocuments(filter);

        let data = await Assets.find(filter, 
            {
            'currencySymbol': 1,
            "spotwallet": 1,
            "p2pbalance": 1,
            'userId': 1,
            'createdAt': 1,
 }
 ).skip(pagination.skip).limit(pagination.limit)


        let result = {
            count: count,
            data
        }
        console.log("RRRRRRRRRRRRRRr----",data)

        return res.status(200).json({ "success": true, "messages": "success", result })

    } catch (err) {
        res.status(500).json({ "success": false, 'message': "error on server" })

    }

}

/**
 * Change Email
 * METHOD : POST
 * URL : /api/emailChange
 * BODY : newEmail
*/
export const editEmail = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkUser = await User.findOne({ "email": reqBody.newEmail, "_id": req.user.id  })
        if (checkUser) {
            return res.status(400).json({ "success": false, 'errors': { 'newEmail': "Email already exists" } })
        }

        let encryptToken = encryptString(req.user.id, true)
        let userData = await User.findOneAndUpdate(
            {
                "_id": req.user.id
            },
            {
                "newEmail": reqBody.newEmail,
                "newEmailToken": encryptToken
            },
            {
                "new": true
            }
        )
        let content = {
            'confirmMailUrl': `${config.FRONT_URL}/verify-old-email/${encryptToken}`,
            'date': new Date()
        };
        mailTemplateLang({
            'userId': userData._id,
            'identifier': 'change_register_email',
            'toEmail': userData.email,
            content
        })

        return res.status(200).json({ "success": true, "message": "Verification link sent to your old email address." })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

/**
 * Sent Verification Link to New Email
 * METHOD : PUT
 * URL : /api/emailChange
 * BODY : token
*/
export const sentVerifLink = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = decryptString(reqBody.token, true)

        let userData = await User.findOne({ "_id": userId })

        if (userData.newEmailToken != reqBody.token) {
            return res.status(400).json({ "success": false, 'message': "Invalid Link" })
        }

        let encryptToken = encryptString(userData._id, true)
        userData.newEmailToken = encryptToken;
        await userData.save();


        let content = {
            'confirmMailUrl': `${config.FRONT_URL}/verify-new-email/${encryptToken}`,
            'date': new Date()
        };

        mailTemplateLang({
            'userId': userData._id,
            'identifier': 'verify_new_email',
            'toEmail': userData.newEmail,
            content
        })
        return res.status(200).json({ "success": true, "message": "Verification link sent to your new email address." })

    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

/**
 * Verify New Email
 * METHOD : PATCH
 * URL : /api/emailChange
 * BODY : token
*/
export const verifyNewEmail = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = decryptString(reqBody.token, true);
        let checkUser = await User.findOne({ "_id": userId })

        if (!checkUser) {
            return res.status(500).json({ "success": false, 'message': "Invalid link" })
        }

        let checkEmail = await User.findOne({ "email": checkUser.newEmail, "_id": { "$ne": checkUser._id } })
        if (checkEmail) {
            return res.status(400).json({ "success": false, 'message': "Email already exists" })
        }

        await User.updateOne(
            {
                "_id": checkUser._id
            },
            {
                "$set": {
                    "email": checkUser.newEmail,
                    "newEmail": '',
                    "newEmailToken": ''
                }
            },
        )

        return res.status(200).json({ "success": true, "message": "Change email address successfully" })

    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}


export const saveChatDetails = async (req, res) => {

    try {
        console.log('ASSSDFD')

        const chatsave = new P2PChat({

            message: '1231313131',

        });

        await chatsave.save()


        return res.send('hi')

    } catch (err) {
        console.log("------err", err)
    }

}


