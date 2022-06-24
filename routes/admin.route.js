//  import packages
import express from 'express';
import passport from 'passport';

// import controllers
import * as adminCtrl from '../controllers/admin.controller';
import * as languageCtrl from '../controllers/language.controller';
import * as emailTemplateCtrl from '../controllers/emailTemplate.controller';
import * as userKycCtrl from '../controllers/userKyc.controller';
import * as currencyCtrl from '../controllers/currency.controller';
import * as walletCtrl from '../controllers/wallet.controller';
import * as stakingCtrl from '../controllers/staking.controller';
import * as siteSettingCtrl from '../controllers/siteSetting.controller';
import * as cmsCtrl from '../controllers/cms.controller';
import * as faqCtrl from '../controllers/faq.controller';
import * as commonCtrl from '../controllers/common.controller';
import * as pairCtrl from '../controllers/pairManage.controller';
import * as perpetualCtrl from '../controllers/perpetualPair.controller';
import * as userCntrl from '../controllers/user.controller';
import * as reportCtrl from '../controllers/report.controller';
import * as supportCtrl from '../controllers/support.controller';
import * as priceCNVCtrl from '../controllers/priceCNV.controller';
import * as anouncementCtrl from '../controllers/anouncement.controller';
import * as spotTrade from '../controllers/spotTrade.controller';



// import validation
import * as adminValid from '../validation/admin.validation';
import * as languageValid from '../validation/language.validation';
import * as currencyValid from '../validation/currency.validation';
import * as emailTemplateValid from '../validation/emailTemplate.validation';
import * as userKycValid from '../validation/userKyc.validation';
import * as walletValid from '../validation/wallet.validation';
import * as stakingValid from '../validation/staking.validation';
import * as pairValidate from '../validation/pair.validation';
import * as perpetualValid from '../validation/perpetual.validation'
import * as siteSettingsValid from '../validation/siteSettings.validation';
import * as priceCNVValid from '../validation/priceCNV.validation';
import * as anouncementValid from '../validation/anouncement.validation';
import * as adminSite from '../validation/adminSiteSettings.validation'
import * as adminProfile from '../validation/adminProfile.validation';
const router = express();
const passportAuth = passport.authenticate("adminAuth", { session: false });

// Admin
router.route('/login').post(adminValid.loginValidate, adminCtrl.adminLogin);
router.route('/sendotppasswordchange').post(passportAuth,adminCtrl.sendOtp);
router.route('/changepassword').post(passportAuth,adminCtrl.changePassword);
router.route('/profileupload').post(passportAuth,adminProfile.adminProfilesValid,adminCtrl.updateProfile);
router.route('/getAdminDetails').get(passportAuth,adminCtrl.userGet);
router.route('/siteUpdate').post(passportAuth,siteSettingCtrl.uploadSiteDetails,adminSite.siteSettingsValid ,adminCtrl.updateSiteSettings);
router.route('/getTradevolume').post( spotTrade.getTradevolume);



// Currency
router.route('/currency')
  .get(passportAuth, currencyCtrl.currencyList)
  .post(passportAuth, currencyCtrl.uploadCurrency, currencyValid.addCurrencyValidate, currencyCtrl.addCurrency)
  .put(passportAuth, currencyCtrl.uploadCurrency, currencyValid.editCurrencyValidate, currencyCtrl.updateCurrency);
router.route('/getCurrency').get(passportAuth, currencyCtrl.getCurrency);


// Language
router.route('/language')
  .get(passportAuth, languageCtrl.languageList)
  .post(passportAuth, languageValid.addLangValidate, languageCtrl.addLanguage)
  .put(passportAuth, languageValid.editLangValidate, languageCtrl.editLanguage);
router.route('/getLanguage').get(passportAuth, languageCtrl.getLanguage);

router.route('/contactus').get(passportAuth,userCntrl.getContactusList)
router.route('/contactus').post(passportAuth,userCntrl.replyContact)
router.route('/contact-delete').post(passportAuth,userCntrl.deleteContact)
router.route('/p2pTrade').get(passportAuth, reportCtrl.p2porderHistory)
 //router.route('/p2pchat').get(passportAuth, reportCtrl.p2pchatHistory)
 router.route('/getP2PTradeComplete').get(passportAuth, reportCtrl.getP2PTradeComplete)
router.route('/adminrevenue').post(passportAuth, reportCtrl.adminRevenue)

//P2P

router.route("/chat-data").post(passportAuth, reportCtrl.p2pchatdispute);
router.route("/p2pdisputelist").post(passportAuth, reportCtrl.p2pdisputelist);
router.route("/p2pTradeView/:orderId").get(passportAuth, reportCtrl.p2pOrder);
router.route("/p2pchat/:orderId").get(passportAuth, reportCtrl.p2pchatHistory);
router.route("/p2presolveBuyer").post(passportAuth, reportCtrl.p2presolveBuyer);
router
  .route("/p2presolveSeller")
  .post(passportAuth, reportCtrl.p2presolveSeller);
router.route("/saveChatDetails").post(passportAuth, reportCtrl.uploadChatImage, reportCtrl.saveChatDetails);



// Email Template
router.route('/emailTemplate')
  .get(passportAuth, emailTemplateCtrl.emailTemplateList)
  .post(passportAuth, emailTemplateValid.addTemplateValidate, emailTemplateCtrl.addEmailTemplate)
  .put(passportAuth, emailTemplateValid.editTemplateValidate, emailTemplateCtrl.editEmailTemplate)

//anouncement
router.route('/anouncement').post(passportAuth, anouncementValid.anouncementAdd, anouncementCtrl.anouncementAdd)


// User
router.route('/user').get(passportAuth, userCntrl.getUserList)
router.route('/getUserBalnce').get(passportAuth, userCntrl.getUserBalanceList)
router.route('/updatestatus').post( adminCtrl.updatestatus);

router.route('/userKyc')
  .get(passportAuth, userKycCtrl.getAllUserKyc)
  .post(passportAuth, userKycCtrl.approveUserKyc)
  .put(passportAuth, userKycValid.rejectKycValidate, userKycCtrl.rejectUserKyc);


// Wallet
// router.route('/depositList').get(passportAuth, walletCtrl.getDepositList)
router.route('/depositList').get(passportAuth, reportCtrl.fundTransferHistory)
router.route('/withdrawList').get(passportAuth, walletCtrl.getWithdrawList)
//  router.route('/withdrawList').get(passportAuth, reportCtrl.getWithdrawList)


router.route('/coinWithdraw/approve/:transactionId').get(passportAuth, walletCtrl.coinWithdrawApprove)
router.route('/coinWithdraw/reject/:transactionId').get(passportAuth, walletCtrl.coinWithdrawReject)
router.route('/fiatWithdraw/approve/:transactionId').get(passportAuth, walletCtrl.fiatWithdrawApprove)
router.route('/fiatWithdraw/reject/:transactionId').get(passportAuth, walletCtrl.fiatWithdrawReject)
router.route('/fiatDeposit/approve').post(passportAuth, walletValid.fiatDepositApproveValid, walletCtrl.fiatDepositApprove)

// Staking
router.route('/staking')
  .get(passportAuth, stakingCtrl.stakingList)
  .post(passportAuth, stakingValid.addStakeValid, stakingCtrl.addStaking)
  .put(passportAuth, stakingValid.editStakeValid, stakingCtrl.editStaking)

// Site Setting
router.route('/getSiteSetting').get(passportAuth, siteSettingCtrl.getSiteSetting)
router.route('/updateSiteSetting').put(passportAuth, siteSettingCtrl.updateSiteSetting)
router.route('/updateSiteDetails')
  .put(passportAuth, siteSettingCtrl.uploadSiteDetails, siteSettingsValid.siteSettingsValid, siteSettingCtrl.updateSiteDetails)
router.route('/updateUsrDash').put(passportAuth, siteSettingCtrl.updateUsrDash)

// CMS
router.route('/cms').get(passportAuth, cmsCtrl.getCmsList).put(passportAuth, cmsCtrl.updateCms)

// FAQ
router.route('/faqCategory')
  .get(passportAuth, faqCtrl.listFaqCategory)
  .post(passportAuth, faqCtrl.addFaqCategory)
  .put(passportAuth, faqCtrl.updateFaqCategory)
  .delete(passportAuth, faqCtrl.deleteFaqCategory);

router.route('/getFaqCategory').get(passportAuth, faqCtrl.getFaqCategory);
router.route('/faq')
  .get(passportAuth, faqCtrl.listFaq)
  .post(passportAuth, faqCtrl.addFaq)
  .put(passportAuth, faqCtrl.updateFaq)
  .delete(passportAuth, faqCtrl.deleteFaq);

//spotTrade Pair
router.route('/spotPair')
  .get(passportAuth, pairCtrl.spotPairList)
  .post(passportAuth, pairValidate.addSpotPairValid, pairCtrl.addSpotPair)
  .put(passportAuth, pairValidate.editSpotPairValid, pairCtrl.editSpotPair);


  //P2PTrade Pair
router.route('/p2pPair')
.get(passportAuth, pairCtrl.p2pPairList)
.post(passportAuth,pairValidate.addP2PPairValid,pairCtrl.addP2PPair)
.put(passportAuth, pairValidate.editP2PPairValid, pairCtrl.editP2PPair);



// spot History
router.route('/spotOrderHistory').get(passportAuth, reportCtrl.spotorderHistory);
router.route('/spotTradeHistory').get(passportAuth, reportCtrl.spotTradeHistory);


//Perptual Pair
router.route('/perptualPair')
  .get(passportAuth, perpetualCtrl.perpetualPairList)
  .post(passportAuth, perpetualValid.addPerptualPairValid, perpetualCtrl.addPerpetualPair)
  .put(passportAuth, perpetualValid.editPerpetualPairValid, perpetualCtrl.editPerpetualPair)

//perpetual History
router.route('/perpetualOrderHistory').get(passportAuth, reportCtrl.perpetualOrderHistory);
router.route('/perpetualTradeHistory').get(passportAuth, reportCtrl.perpetualTradeHistory);

//Price Conversion 
router.route('/priceCNV')
  .get(passportAuth, priceCNVCtrl.getPriceCNVlist)
  .put(passportAuth, priceCNVValid.priceCNVUpdateValid, priceCNVCtrl.priceCNVUpdate)


// Support
router.route('/supportCategory')
  .get(passportAuth, supportCtrl.getSupportCategory)
  .post(passportAuth, supportCtrl.addSupportCategory)
  .put(passportAuth, supportCtrl.editSupportCategory);

router.route('/ticketList').get(passportAuth, supportCtrl.getticketList)

router.route('/ticketMessage')
  .get(passportAuth, supportCtrl.getTicketMessage)
  .put(passportAuth, supportCtrl.replyMessage);

// Common
router.route('/getPairDropdown').get(passportAuth, commonCtrl.getPairDropdown)

export default router;