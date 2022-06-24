// import package
import mongoose from 'mongoose';

// import modal
import Admin from '../models/Admin';
   
import SiteSetting from '../models/sitesetting'
import User from '../models/User'
// import cofig
import config from '../config';

// import lib
import { comparePassword ,generatePassword} from '../lib/bcrypt';
import isEmpty from '../lib/isEmpty';

import { mailTemplateLang } from "./emailTemplate.controller";


const ObjectId = mongoose.Types.ObjectId;

/**
 * Add New Admin
 * URL : /adminapi/admin
 * METHOD: POST
 * BODY : name, email, password ,restriction(path, isWriteAccess)
*/
export const addAdmin = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.email = reqBody.email.toLowerCase();

        let checkUser = await Admin.findOne({ "email": reqBody.email });

        if (checkUser) {
            return res.status(400).json({ "success": false, 'errors': { 'email': "Email is not exists" } })
        }

        let { passwordStatus, hash } = await generatePassword(reqBody.password);
        if (!passwordStatus) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }

        let newDoc = new Admin({
            'name': reqBody.name,
            'email': reqBody.email,
            'password': hash,
            'role': 'admin',
            'restriction': reqBody.restriction
        })

        await newDoc.save();
        return res.status(200).json({ "success": true })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

/**
 * Edit Admin
 * URL : /adminapi/admin
 * METHOD: POST
 * BODY : adminId, name, email, restriction(path, isWriteAccess)
*/
export const editAdmin = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.email = reqBody.email.toLowerCase();

        let checkUser = await Admin.findOne({ "email": reqBody.email, '_id': { "$ne": reqBody.adminId } });

        if (checkUser) {
            return res.status(400).json({ "success": false, 'errors': { 'email': "Email is not exists" } })
        }

        // let { passwordStatus, hash } = await generatePassword(reqBody.password);
        // if (!passwordStatus) {
        //     return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        // }
        let updateData = await Admin.findOneAndUpdate(
            { "_id": reqBody.adminId },
            {
                "$set": {
                    'name': reqBody.name,
                    'email': reqBody.email,
                    'restriction': reqBody.restriction
                }
            },
            { "new": true }
        )

        return res.status(200).json({ "success": true, 'result': { "messages": "Updated successfully" } })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

/**
 * Admin List
 * URL : /adminapi/admin
 * METHOD: GET
*/
export const getAdmin = (req, res) => {
    Admin.find({}, { 'name': 1, "email": 1 }, (err, adminData) => {
        if (err) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        return res.status(200).json({ "success": true, 'result': adminData })
    })
}

/**
 * Get Single Admin
 * URL : /adminapi/singleAdmin
 * METHOD: GET
*/
export const getSingleAdmin = (req, res) => {
    Admin.findOne({ '_id': req.params.id }, { 'name': 1, 'email': 1, 'restriction': 1 }, (err, adminData) => {
        if (err) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        return res.status(200).json({ "success": true, 'result': adminData })
    })
}

/**
 * Admin Login
 * URL : /adminapi/login
 * METHOD: POST
 * BODY : email, password
*/
export const adminLogin = async (req, res) => {
    try {
        let reqBody = req.body;
        console.log(req.body)
        reqBody.email = reqBody.email.toLowerCase();

        let checkUser = await Admin.findOne({ "email": reqBody.email });
        if (!checkUser) {
            return res.status(404).json({ "success": false, 'errors': { 'email': "Email not found" } })
        }
        // if (!checkUser.role) {
        //     return res.status(400).json({ "success": false, 'errors': { 'messages': "Role is not exists" } })
        // }

        // if (checkUser.role != 'superadmin' && (!checkUser.restriction || checkUser.restriction.length < 0)) {
        //     return res.status(400).json({ "success": false, 'errors': { 'messages': "Restriction access is not exists" } })
        // }

        let { passwordStatus } = await comparePassword(reqBody.password, checkUser.password);
        if (!passwordStatus) {
            return res.status(400).json({ "success": false, 'errors': { "password": "Password incorrect" } })
        }

        let payloadData = {
            "_id": checkUser._id,
            // "restriction": checkUser.restriction,
            "role": checkUser.role
        }
        let token = new Admin().generateJWT(payloadData);

        return res.status(200).json({ 'success': true, 'message': "Login successfully", token })
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'message': "Error on server" })
    }
}

/**
 * Get Profile
 * URL : /adminapi/profile
 * METHOD: GET
*/
export const getProfile = async (req, res) => {
    Admin.findOne(
        { "_id": req.user.id },
        {
            "name": 1,
            "email": 1,
            "_id": 0
        },
        (err, adminData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
            }
            return res.status(200).json({ 'success': true, 'message': "Login successfully", 'result': adminData })
        }
    )
}

/**
 * Update Profile
 * URL : /adminapi/profile
 * METHOD: PUT
 * BODY : name
*/
export const editProfile = async (req, res) => {
    let reqBody = req.body;
    Admin.findOneAndUpdate(
        { "_id": req.user.id },
        { "name": reqBody.name },
        { "new": true },
        (err, adminData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
            }
            return res.status(200).json({ 'success': true, 'message': "Login successfully", 'result': adminData })
        }
    )
}


/**
 * Deactivate User
 * URL : /adminapi/updatestatus
 * METHOD: POST
 * BODY : id
*/
export const updatestatus = async (req, res) => {

    try {
      var reqBody = req.body;
      console.log(reqBody)
      var userdata=await User.findOne({_id:reqBody.id})

      console.log("userdata---",userdata)
      var status = userdata.active;
      if (status == "active") {
        var test = await User.findOneAndUpdate(
          { _id: reqBody.id },
          {
            "active": "deactive"
          }
        );
        return res
          .status(200)
          .json({ success: true, message: "Deactivated Successfully" })
      }
      if (status == "deactive") {
        var test = await User.findOneAndUpdate(
          { _id: reqBody.id },
          {
            "active": "active"
          }
        );
        return res
          .status(200)
          .json({ success: true, message: "activated Successfully" })
      }
  
      ;
    } catch (err) {
  console.log("Error---",err)
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
  
  }

/**
 * Forgot Password
 * URL : /adminapi/forgotPassword
 * METHOD: POST
 * BODY : email
*/
export const forgotPassword = async (req, res) => {
    let reqBody = req.body;

    Admin.findOne(
        {
            "email": reqBody.email
        },
        (err, adminData) => {
            if (err) {
                return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
            }
            if (!adminData) {
                return res.status(400).json({ "success": false, 'errors': { 'email': "Email is not exists" } })
            }
            let encryptToken = encrypt(adminData._id)

            let content = {
                'name': adminData.firstName,
                'confirmMailUrl': `${config.FRONT_URL}/admin/changepassword/${encryptToken}`
            }

            // mailTemplate('User_forgot', adminData.email, content)
            return res.status(200).json({ 'success': true, "messages": "Confirm your mail" })
        }
    )
}


/**
 * Reset Password
 * METHOD : POST
 * URL : /adminapi/resetPassword
 * BODY : password, confirmPassword, authToken
*/
export const resetPassword = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = decrypt(reqBody.authToken)

        let { passwordStatus, hash } = await generatePassword(reqBody.password);
        if (!passwordStatus) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }

        let adminData = await Admin.findOne({ "_id": userId });
        if (!adminData) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "User not found" } })
        }

        adminData.password = hash;
        await adminData.save();

        return res.status(200).json({ 'success': true, "messages": "Updated successfully" });
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}



/**
 * Otp send for Change Password
 * METHOD : POST
 * URL : /adminapi/sendotppasswordchange
*/
export const sendOtp = async (req, res) => {
    try {
        let adminDetail=await Admin.find({_id:req.user.id})
        const otpcheck = Math.floor(100000 + Math.random() * 900000);
        console.log("otpcheckotpcheckotpcheck--------------------", otpcheck);
        await Admin.updateOne(
            {
              _id: req.user.id
            },
            {
              otp: otpcheck,
              otptime: new Date(),
            }
          );
  
          let content = {
            otp: otpcheck,
          };
          var mail=mailTemplateLang({
            userId: req.user.id,
            identifier: "admin_otp",
            toEmail: adminDetail[0].email,
            content,
          });
          if(mail)
          return res.status(200).json({
            success: true,
            status: "EMAIL_OTP_NOTIFY",
            message: "Enter OTP Received on Mail",
          });
    }
    catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

/**
 * Change Password
 * METHOD : POST
 * URL : /adminapi/changepassword
*/
export const changePassword = async (req, res) => {
    try {
        let adminDetail=await Admin.findOne({_id:req.user.id})
        if(adminDetail){
            if (req.body.otpnew !='') {
                let otpTime = new Date(new Date().getTime() - 120000); //2 min
                if (adminDetail.otptime <= otpTime) {
                  return res
                    .status(400)
                    .json({ success: false, errors: { message: "OTP Expired" } });
                }
          
                if (adminDetail.otp != req.body.otpnew) {
                  return res
                    .status(400)
                    .json({ success: false, errors: { message: "Invalid OTP" } });
                }

                let { passwordStatus } = await comparePassword(req.body.oldpassword, adminDetail.password);
                if (!passwordStatus) {
                    return res.status(400).json({ "success": false, 'errors': { "message": "Old Password incorrect" } })
                }

                let { newpasswordStatus } = await comparePassword(req.body.password, adminDetail.password);
                if (newpasswordStatus) {
                    return res.status(400).json({ "success": false, 'errors': { "message": "Old and New Password could not be same" } })
                }
                else{
                    if(req.body.password !== req.body.password2){
                        return res.status(400).json({ "success": false, 'errors': { "message": "New Password and Confirm Password does not match" } })
                    }
                    else{

                        let { passwordStatus, hash } = await generatePassword(req.body.password);
                        if (!passwordStatus) {
                            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
                        }
                        let result=await Admin.updateOne(
                            {
                              _id: req.user.id
                            },
                            {
                              password:hash,
                              otp :"",
                              otptime :""
                            }
                          );
                       
                        if(result){
                            return res.status(200).json({ "success": true ,'data':{messages:"Password Changed Successfully"}})
                        }
                    }
                }
          
                
                //await adminDetail.save();
              }
          
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

/**
 * Admin Profile Updation
 * METHOD : POST
 * URL : /adminapi/profileupload
*/
export const updateProfile = async (req, res) => {
    try {
        let adminDetail=await Admin.findOne({_id:req.user.id})
        console.log("AdminDetails---------------",adminDetail)
        if(adminDetail){
            var update_status= await Admin.updateOne(
                {
                  _id: req.user.id
                },
                {
                  name: req.body.name,
                  email:req.body.email,
                  phonenumber:req.body.phonenumber
                }
              );
              if(update_status){
                return res.status(200).json({ "success": true, 'result': { 'messages': "Profile Updated Successfully" } })
              }
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

export const updateSiteSettings= async (req, res) => {
    try {
  
      const reqBody = req.body
      const reqFile = req.files
      console.log("Update=================",reqBody)
      console.log("file=================",reqFile)
      let siteSettingData = await SiteSetting.findOne({});
      siteSettingData.contactPerson = reqBody.contactPerson;
      siteSettingData.registerCode = reqBody.registerCode;
      siteSettingData.mobileNo = reqBody.mobileNo;
      siteSettingData.companyInfoLink = reqBody.companyInfoLink;
      siteSettingData.walletLicenseLink = reqBody.walletLicenseLink;

      siteSettingData.copyrightText = reqBody.copyrightText;
      siteSettingData.forcedLiquidation = reqBody.forcedLiquidation;
      siteSettingData.siteDescription = reqBody.siteDescription;


      siteSettingData.facebookLink = reqBody.facebookLink;
      siteSettingData.twitterUrl = reqBody.twitterLink;
      siteSettingData.linkedinLink = reqBody.linkedInLink;
      siteSettingData.mediumLink = reqBody.mediumLink;
      siteSettingData.telegramLink = reqBody.telegramLink;
      siteSettingData.siteName = reqBody.siteName;
      siteSettingData.address = reqBody.address;
      siteSettingData.contactNo = reqBody.contactNo;
      siteSettingData.supportMail = reqBody.supportMail;
      siteSettingData.emailLogo = isEmpty(reqFile) ? siteSettingData.emailLogo : reqFile.emailLogo[0].filename;
      siteSettingData.sitelogo = isEmpty(reqFile) ? siteSettingData.emailLogo : reqFile.emailLogo[0].filename;
      await siteSettingData.save();
  
      return res.status(200).json({ 'success': true, 'message': "Updated Successfully", })
  
    } catch (err) {
        console.log("err----",err)
      return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
  
    }
  }


/**
 * Admin Profile Updation
 * METHOD : POST
 * URL : /adminapi/profileupload
*/
export const userGet = async (req, res) => {
    try {
        let adminDetail=await Admin.findOne({_id:req.user.id})
        if(adminDetail){
          
                return res.status(200).json({ "success": true, 'result': adminDetail })
           
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}
