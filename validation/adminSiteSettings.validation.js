import isEmpty from '../lib/isEmpty';

/** 
 * Update Ste Setails
 * METHOD : get
 * URL : /adminapi/updateSiteDetails
 * BODY twiterLink,linkedInLink,address,fbLink,supportMail,contactNo
*/
export const siteSettingsValid=(req,res,next)=>{

    let errors = {}, reqBody = req.body;
    let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;
    if (isEmpty(reqBody.contactPerson)) {
        errors.contact_person = "Contact Person field is required";
    } 
    if (isEmpty(reqBody.siteDescription)) {
        errors.site_description = "Site Description field is required";
    } 
    if (isEmpty(reqBody.twitterLink)) {
        errors.social_link1 = "Twitter Link field is required";
    } 
    if (isEmpty(reqBody.linkedInLink)) {
        errors.social_link5 = "LinkedIn Link field is required";
    } 
    if (isEmpty(reqBody.mediumLink)) {
        errors.social_link2 = "Medium Link field is required";
    }
    if (isEmpty(reqBody.telegramLink)) {
        errors.social_link3= "Telegram Link field is required";
    }
    if (isEmpty(reqBody.facebookLink)) {
        errors.social_link4 = "Facebook Link field is required";
    } 
    if (isEmpty(reqBody.registerCode)) {
        errors.reg_code = "Register Code field is required";
    } 
    if (isEmpty(reqBody.companyInfoLink)) {
        errors.company_info_link = "CompanyInfo Link field is required";
    } 
    if (isEmpty(reqBody.walletLicenseLink)) {
        errors.license_info_link = "WalletLicense Link field is required";
    } 
    if (isEmpty(reqBody.copyrightText)) {
        errors.copyright_text = "Copyright Text field is required";
    } 
    if (isEmpty(reqBody.address)) {
        errors.address = "Address field is required";
    } 
    if (isEmpty(reqBody.supportMail)) {
        errors.email = "Email field is required";
    } else if (!(emailRegex.test(reqBody.supportMail))) {
        errors.email = "Email is invalid";
    }
    if (isEmpty(reqBody.contactNo)) {
        errors.phone_number = "Phone Number field is required";
    } 
    if (isEmpty(reqBody.mobileNo)) {
        errors.mobile_number = "Mobile Number field is required";
    } 
    if (isEmpty(reqBody.siteName)) {
        errors.sitename = "Site Name field is required";
    } 
    if (isEmpty(reqBody.forcedLiquidation)) {
        errors.forcedliq = "Forced Liquidation field is required";
    } 
    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}