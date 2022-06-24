// import package

// import modal
import {  Language, UserSetting, SiteSetting } from '../models';

// import config
import config from '../config';
import { EmailTemplate } from '../models';
// import lib
import { sendEmail } from '../lib/emailGateway';
import {
    paginationQuery,
    filterQuery,
    filterProofQuery,
    filterSearchQuery
} from '../lib/adminHelpers';
import isEmpty from '../lib/isEmpty';

/** 
 * Sent Email
 * URL: /api/getEmailId
 * METHOD : GET
 * BODY : identifier, Subject (object)userId
*/

// export const getEmailId = async (req, res) => {
//     try {
//         // let reqBody = req.body;
//         // let getUserData = await Admin.findOne({ "_id": reqBody.id })
//         let userid = req.query.cmsId;
//         let getUserData = await EmailTemplate.findOne({ "_id": userid })
//         //await getUserData.save();
//         return res.status(200).json({ 'success': true, "messages": "success", result: getUserData })
//     }
//     catch (err) {
//         return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
//     }
// }

/** 
 * Mail Template with language
*/
export const mailTemplateLang = async ({
    userId,
    identifier,
    toEmail,
    content
}) => {
    try {
        console.log("toemailk---",toEmail)
        let settingData = await UserSetting.findOne({ "userId": userId }).populate('languageId');
        if (settingData && settingData.languageId) {
            mailTemplate(identifier, toEmail, content, settingData.languageId.code)
        } else {
            let getLang = await Language.findOne({ "isPrimary": true })
            mailTemplate(identifier, toEmail, content, getLang.code)
        }
    } catch (err) {

    }
}

/** 
 * Sent Email
 * URL: /api/mailTemplate
 * METHOD : POST
 * BODY : identifier, email, contentData (object)
*/
export const mailTemplate = async (identifier, toEmail, content, langCode = '') => {
    try {
        // if (isEmpty(langCode)) {
        //     let getLang = await Language.findOne({ "isPrimary": true })
        //     if (!getLang) {
        //         return false
        //     }

        //     langCode = getLang.code;
        // }
       
        let siteSettingsData = await SiteSetting.findOne({});
        // console.log("identifier----",identifier)

        let emailTemplateData = await EmailTemplate.findOne({ "identifier": identifier});
        // console.log("emailTemplateData----",emailTemplateData)
        if (!emailTemplateData) {
            // return res.status(400).json({ "success": false, 'messages': "Not found" })
            console.log("No Email Template")
            return false
        }

        // companyName, Binetco Private Limited
        // console.log("config.SERVER_URL + '/settings/' + siteSettingsData.emailLogo",config.SERVER_URL + '/settings/' + siteSettingsData.emailLogo);

        let logo = config.SERVER_URL + "Logo-small.png";
        let mailContent = {};
        mailContent['subject'] = emailTemplateData.subject;
        mailContent['template'] = emailTemplateData.content
            .replace('##SITE_URL##', config.FRONT_URL)
            .replace('##EMAIL_LOGO##', config.SERVER_URL + '/settings/' + siteSettingsData.emailLogo)
            .replace(/##SUPPORT_MAIL##/g, siteSettingsData.supportMail)
            .replace('##TWITER_LINK##', siteSettingsData.twitterUrl)
            .replace('##LINKEDIN_LINK##', siteSettingsData.linkedinLink)
            .replace('##FB_LINK##', siteSettingsData.facebookLink)
            .replace(/##SITE_NAME##/g, siteSettingsData.siteName)
            .replace('##CONTACT_NO##', siteSettingsData.contactNo)
            .replace('##ADDRESS##', siteSettingsData.address)
            .replace('##TWITER_LOGO##', config.SERVER_URL + '/emailimages/twiter.png')
            .replace('##FB_LOGO##', config.SERVER_URL + '/emailimages/facbook.png')
            .replace('##LINKED_IN_LOGO##', config.SERVER_URL + '/emailimages/linkedin.png');



        switch (identifier) {

            case "activate_register_user":
                
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", content.email)
                    .replace("##templateInfo_url##", content.confirmMailUrl)
                    .replace("##templateInfo_appName##", config.SITE_NAME)
                    .replace("##templateInfo_logo##", logo)
                    .replace("##DATE##", content.date);

                break;
                case "support_ticket_send":
                  
                    mailContent['template'] = mailContent['template']
                        .replace("##templateInfo_name##", content.email)
                        .replace("##templateInfo_url##", content.confirmMailUrl)
                        .replace("##templateInfo_appName##", config.SITE_NAME)
                        .replace("##templateInfo_logo##", logo)
                        .replace("##ID##", content.id);
    
                    break;
                    case "support_ticket_reply":
                        
                        mailContent['template'] = mailContent['template']
                            .replace("##templateInfo_name##", content.email)
                            .replace("##templateInfo_url##", content.confirmMailUrl)
                            .replace("##templateInfo_appName##", config.SITE_NAME)
                            .replace("##templateInfo_logo##", logo)
                            .replace("##DATE##", content.date);
        
                        break;

            case "User_forgot":
               
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##templateInfo_url##", content.confirmMailUrl);

                break;
                case "admin_otp":
                    /** 
                     * ##OTP## --> otp to sent
                    */
                    mailContent['template'] = mailContent['template']
                        .replace("##OTP##", content.otp)
                       // .replace("##templateInfo_name##", content.email)

                       
    
                    break;
            case "change_register_email":
                /** 
                 * ##templateInfo_name## --> name
                 * ##templateInfo_url## --> confirmMailUrl
                */
                mailContent['template'] = mailContent['template']
                    .replace("##DATE##", content.date)
                    .replace("##templateInfo_url##", content.confirmMailUrl);

                break;


            case "verify_new_email":
                /** 
                 * ##templateInfo_name## --> name
                 * ##templateInfo_url## --> confirmMailUrl
                */
                mailContent['template'] = mailContent['template']
                    .replace("##DATE##", content.date)
                    .replace("##templateInfo_url##", content.confirmMailUrl);

                break;

            case "Login_confirmation":
                /** 
                 * ##BROWSER## --> broswername
                 * ##IP## --> ipaddress
                 * ##COUNTRY## --> countryName
                 * ##DATE## --> date
                 * ##CODE## --> code
                */
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##BROWSER##", content.broswername)
                    .replace("##IP##", content.ipaddress)
                    .replace("##COUNTRY##", content.countryName)
                    .replace("##DATE##", content.date)
                    .replace("##CODE##", content.code)


                break;

            case "Alert_Notification":
                /** 
                 * ##templateInfo_name## --> email
                 * ##MESSAGE## --> message
                */
         
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", content.email)
                    .replace("##MESSAGE##", content.message)
            break;    

            case "KYC_ID_PROOF":
            /** 
             * ##templateInfo_name## --> email
            */
         
                mailContent['template'] =  mailContent['template']
                     .replace("##templateInfo_name##", content.email)
            break; 

            case "KYC_ADDRESS_PROOF":
            /** 
             * ##templateInfo_name## --> email
            */
         
                mailContent['template'] =  mailContent['template']
                     .replace("##templateInfo_name##", content.email)
            break;

            case "KYC_APPROVED":
            /** 
             * ##templateInfo_name## --> email
            */
         
                mailContent['template'] =  mailContent['template']
                     .replace("##templateInfo_name##", content.email)
                     .replace("##PROOF_TYPE##", content.proofType)
            break;    

            case "KYC_REJECTED":
            /** 
             * ##templateInfo_name## --> email
            */
         
                mailContent['template'] =  mailContent['template']
                     .replace("##templateInfo_name##", content.email)
                     .replace("##PROOF_TYPE##", content.proofType)
                     .replace("##REASON##", content.reason)
            break;    

            case "withdraw_request":
                /** 
                 * ##templateInfo_name## --> name
                 * ##templateInfo_url## --> confirmMailUrl
                */
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##templateInfo_url##", content.confirmMailUrl);
                break;

            case "Login_notification":
                /** 
                 * ##BROWSER## --> broswername
                 * ##IP## --> ipaddress
                 * ##COUNTRY## --> countryName
                 * ##DATE## --> date
                 * ##CODE## --> code
                */
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##BROWSER##", content.broswername)
                    .replace("##IP##", content.ipaddress)
                    .replace("##COUNTRY##", content.countryName)
                    .replace("##DATE##", content.date)

                break;


            case "User_deposit":
                /** 
                 * ##AMOUNT## --> amount
                 * ##CURRENCY## --> currency
                 * ##TXID## --> tranactionId
                 * ##DATE## --> date
                */
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##AMOUNT##", content.amount)
                    .replace("##CURRENCY##", content.currency)
                    .replace("##TXID##", content.tranactionId)
                    .replace("##DATE##", content.date)
                break;

            case "Withdraw_notification":
                /** 
                 * ##AMOUNT## --> amount
                 * ##CURRENCY## --> currency
                 * ##TXID## --> tranactionId
                 * ##DATE## --> date
                */
                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##AMOUNT##", content.amount)
                    .replace("##CURRENCY##", content.currency)
                    .replace("##TXID##", content.tranactionId)
                    .replace("##DATE##", content.date)
                break;
            case "Post_ad":
                    /** 
                     * ##AMOUNT## --> amount
                     * ##CURRENCY## --> currency
                     * ##TXID## --> tranactionId
                     * ##DATE## --> date
                    */
                    mailContent['template'] = mailContent['template']
                        .replace("##templateInfo_name##", "Valid User")
                        .replace("##ID##", content.id)
                        
                    break;
            case "Trade_completed":

                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##ID##", content.id)
                    .replace("##Date##", content.Date)
                    .replace("##Price##", content.Price)
                    .replace("##Type##", content.Type)      
                break;
            case "Trade_cancelled":

                mailContent['template'] = mailContent['template']
                    .replace("##templateInfo_name##", "Valid User")
                    .replace("##ID##", content.id)
                    .replace("##FiatAmount##", content.FiatAmount)
                    .replace("##CryptoAmount##", content.CryptoAmount)
                    .replace("##Pair##", content.Pair)   
                break;
             case "Trade_disputed":
                mailContent['template'] = mailContent['template']
                        .replace("##templateInfo_name##", "Valid User")
                        .replace("##ID##", content.id)
                        .replace("##FiatAmount##", content.FiatAmount)
                        .replace("##CryptoAmount##", content.CryptoAmount)
                        .replace("##Pair##", content.Pair)           
                break;
            // case "enable_2fa":
            //     mailContent['template'] = mailContent['template']
            //             .replace("##templateInfo_name##", "Valid User")             
            //         break;
            // case "disable_2fa":
            //     mailContent['template'] = mailContent['template']
            //             .replace("##templateInfo_name##", "Valid User")             
            //         break;
            // case "Idproof_rejeceted":
            //     mailContent['template'] = mailContent['template']
            //             .replace("##templateInfo_name##", "Valid User")
            //             .replace("##DATE##", content.date)
            //             .replace("##REASON##",content.reason)
            //     break;
            // case "addressproof_rejeceted":
            //     mailContent['template'] = mailContent['template']
            //             .replace("##templateInfo_name##", "Valid User")
            //             .replace("##DATE##", content.date)
            //             .replace("##REASON##",content.reason)
            //     break;
            case "contactus_reply":
                mailContent['template'] = mailContent['template']
                       // .replace("##templateInfo_name##", "Valid User")
                        .replace("##REPLY##", content.replyMessage)
                        .replace("##DATE##", content.date)
                        // .replace("##REASON##",content.reason)
                break;
        }

        sendEmail(toEmail, mailContent)
        return true
        // return res.status(200).json({ "success": true, 'messages': "Mail sent successfully" })
    }
    catch (err) {
        console.log("Error on mail template", err.toString())
        // return res.status(500).json({ "success": false, 'messages': "Error on server" })
    }
}

/** 
 * Add Email Template
 * URL: /adminapi/emailTemplate
 * METHOD : POST
 * BODY : identifier, subject, content, langCode
*/
export const addEmailTemplate = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkTemplate = await EmailTemplate.findOne({ 'identifier': reqBody.identifier, 'langCode': reqBody.langCode })
        if (checkTemplate) {
            return res.status(400).json({ 'success': false, 'errors': { 'langCode': 'Identifier and Language code already exists' } });
        }

        let checkLang = await Language.findOne({ "code": reqBody.langCode })
        if (!checkLang) {
            return res.status(400).json({ 'success': false, 'errors': { 'code': 'There is no Language code' } });
        }

        const newTemplate = new EmailTemplate({
            identifier: reqBody.identifier,
            subject: reqBody.subject,
            content: reqBody.content,
            langCode: reqBody.langCode
        });

        await newTemplate.save();
        return res.status(200).json({ 'success': true, 'message': 'Template added successfully.' })

    } catch (err) {
        return res.status(409).json({ 'success': false, 'message': 'Something went wrong.' })
    }
}

/** 
 * Update Email Template
 * URL: /adminapi/emailTemplate
 * METHOD : PUT
 * BODY : id, identifier, subject, content, langCode, status
*/
export const editEmailTemplate = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkTemplate = await EmailTemplate.findOne({
            'identifier': reqBody.identifier,
            'langCode': reqBody.langCode,
            "_id": { "$ne": reqBody.id }
        })
        if (checkTemplate) {
            return res.status(400).json({ 'success': false, 'errors': { 'langCode': 'Identifier and Language code already exists' } });
        }

        let checkLang = await Language.findOne({ "code": reqBody.langCode })
        if (!checkLang) {
            return res.status(400).json({ 'success': false, 'errors': { 'code': 'There is no Language code' } });
        }

        let templateData = await EmailTemplate.findOne({ "_id": reqBody.id })
        templateData.subject = reqBody.subject;
        templateData.content = reqBody.content;
        templateData.langCode = reqBody.langCode;
        templateData.status = reqBody.status;

        await templateData.save();

        return res.status(200).json({ 'success': true, 'message': 'Template updated successfully.' })

    } catch (err) {
        return res.status(409).json({ 'success': false, 'message': 'Something went wrong.' })
    }
}

/** 
 * Get Email Template
 * URL: /adminapi/emailTemplate
 * METHOD : GET
 * BODY : identifier, subject, content, langCode, status
*/
export const emailTemplateList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['identifier', 'subject', 'langCode', 'status']);
        let count = await EmailTemplate.countDocuments(filter);
        let data = await EmailTemplate.find(filter, {
            "_id": 1,
            "identifier": 1,
            "subject": 1,
            "content": 1,
            "langCode": 1,
            "status": 1,
        }).skip(pagination.skip).limit(pagination.limit);

        let result = {
            count,
            data
        }
        return res.status(200).json({ 'success': true, 'message': 'Fetched successfully.', result })
    } catch (err) {
        return res.status(500).json({ 'success': true, 'message': 'Something went wrong.' })
    }
}