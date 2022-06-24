//  import packages
import express from 'express';
import passport from 'passport';
import multer from 'multer';
import path from 'path';
// import controllers
import * as userCtrl from '../controllers/user.controller';
import * as currencyCtrl from '../controllers/currency.controller'
import * as languageCtrl from '../controllers/language.controller';
import * as userKycCtrl from '../controllers/userKyc.controller';
import * as assetsCtrl from '../controllers/assets.controller';
import * as walletCtrl from '../controllers/wallet.controller';
import * as dashboardCtrl from '../controllers/dashboard.controller';
import * as spotTradeCtrl from '../controllers/spotTrade.controller';
import * as derivativeTradeCtrl from '../controllers/derivativeTrade.controller'
import * as chartCtrl from '../controllers/chart/chart.controller'
import * as binanceCtrl from '../controllers/binance.controller';
import * as bybitCtrl from '../controllers/bybit.controller';
import * as cloudinaryCtrl from '../controllers/cloudinary.controller';
import * as commonCtrl from '../controllers/common.controller';
import * as cmsCtrl from '../controllers/cms.controller';
import * as faqCtrl from '../controllers/faq.controller';
import * as stakingCtrl from '../controllers/staking.controller';
import * as anouncementCtrl from '../controllers/anouncement.controller';
import * as supportCtrl from '../controllers/support.controller';
import * as webhookCtrl from '../controllers/webhook.controller';
import * as p2pCtrl from '../controllers/p2p.controller';
// import validation
import * as userValid from '../validation/user.validation';
import * as userKycValid from '../validation/userKyc.validation';
import * as walletValid from '../validation/wallet.validation';
import * as spotTradeValid from '../validation/spotTrade.validation';
import * as p2pTradeValid from '../validation/p2pTrade.validation';

const router = express();
const passportAuth = passport.authenticate("usersAuth", { session: false });


var storage = multer.diskStorage({
    destination: "./public/images/chat/",
    filename: function(req, file, cb){
        console.log("File---",file)
    //    cb(null, file.fieldname + path.extname(file.originalname));
     cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
 });
 
 var upload = multer({
    storage: storage
 })

// User
router.route('/register').post(userValid.registerValidate, userCtrl.createNewUser);
router.route('/verifyOtp').post(userValid.verifyOtpValidation, userCtrl.verifyOtp);
router.route('/login').post(userCtrl.userLogin);
router.route('/confirm-mail').post(userValid.confirmMailValidate, userCtrl.confirmMail);
router.route('/userProfile')
    .get(passportAuth, userCtrl.getUserProfile)
    .put(passportAuth, userValid.editProfileValidate, userCtrl.editUserProfile);
router.route('/changePassword').post(passportAuth, userValid.changePwdValidate, userCtrl.changePassword);
router.route('/upgradeUser').post(passportAuth, userCtrl.upgradeUser)
router.route('/security/2fa')
    .get(passportAuth, userCtrl.get2faCode)
    .put(passportAuth, userValid.update2faValid, userCtrl.update2faCode)
    .patch(passportAuth, userValid.update2faValid, userCtrl.diabled2faCode);
router.route('/alertNotification').post(passportAuth,userCtrl.alertNotification)
router.route('/bankdetail')
    .post(passportAuth, userValid.editBankValidate, userCtrl.updateBankDetail)
    .put(passportAuth, userValid.deleteBankValidate, userCtrl.deleteBankDetail)
    .patch(passportAuth, userValid.deleteBankValidate, userCtrl.setPrimaryBank)
    .get(passportAuth, userCtrl.getBankDetail);
router.route('/userSetting')
    .get(passportAuth, userCtrl.getUserSetting)
    .post(passportAuth, userCtrl.editUserSetting);
    router.route('/addContactus').post(commonCtrl.addContactus)
router.route('/editNotif').put(passportAuth, userValid.editNotifValid, userCtrl.editNotif)
router.route('/forgotPassword').post(userValid.checkForgotPwdValidate, userCtrl.checkForgotPassword);
router.route('/resetPassword').post(userValid.resetPwdValidate, userCtrl.resetPassword);
router.route('/phoneChange')
    .post(passportAuth, userValid.newPhoneValidate, userCtrl.changeNewPhone)
    .put(passportAuth, userValid.editPhoneValidate, userCtrl.verifyNewPhone);
router.route('/emailChange')
    .post(passportAuth, userValid.editEmailValidate, userCtrl.editEmail)
    .put(userValid.tokenValidate, userCtrl.sentVerifLink)
    .patch(userValid.tokenValidate, userCtrl.verifyNewEmail);

// kyc
router.route('/kycdetail').get(passportAuth, userKycCtrl.getUserKycDetail);
router.route('/kyc/idproof').put(passportAuth, userKycCtrl.IDKycUpload, userKycValid.idProofValidate, userKycCtrl.updateIdProof);
router.route('/kyc/addressproof').put(passportAuth, userKycCtrl.uploadKyc, userKycValid.addressProofValidate, userKycCtrl.updateAddressProof);

// assets
router.route('/getAssetsDetails').get(passportAuth, assetsCtrl.getAssetsDetails);
router.route('/getAsset/:currencyId').get(passportAuth, assetsCtrl.getAssetByCurrency);

// wallet
router.route('/fiatWithdraw')
    .post(passportAuth, walletValid.fiatWithdrawValidate, walletCtrl.checkUserKyc, walletCtrl.withdrawFiatRequest)
    .patch(walletValid.tokenValidate, walletCtrl.fiatRequestVerify);
router.route('/coinWithdraw')
    .post(passportAuth, walletValid.coinWithdrawValidate, walletCtrl.withdrawCoinRequest)
    .patch(walletValid.tokenValidate, walletCtrl.coinRequestVerify);
router.route('/fiatDeposit').post(passportAuth, walletCtrl.uploadWalletDoc, walletValid.depositReqtValid, walletCtrl.checkUserKyc, walletCtrl.depositRequest);
router.route('/walletTransfer').post(passportAuth, walletValid.walletTransferValid, walletCtrl.walletTransfer);
router.route('/getuserDeposit').post(passportAuth,walletCtrl.getuserDeposit)
// Dashboard
router.route('/recentTransaction').get(passportAuth, dashboardCtrl.getRecentTransaction);
router.route('/loginHistory').get(passportAuth, dashboardCtrl.getLoginHistory);
router.route('/notificationHistory').get(passportAuth, dashboardCtrl.getNotificationHistory);
router.route('/notificationHistory').post(passportAuth, dashboardCtrl.setNotificationHistory);
router.route('/getDashBal').get(passportAuth, dashboardCtrl.getDashBal);

// Spot Trade
router.route('/spot/tradePair').get(spotTradeCtrl.getPairList);
router.route('/spot/orderPlace').post(passportAuth, spotTradeValid.decryptValidate, spotTradeCtrl.decryptTradeOrder, spotTradeValid.orderPlaceValidate, spotTradeCtrl.orderPlace)
router.route('/spot/ordeBook/:pairId').get(spotTradeCtrl.getOrderBook)
router.route('/spot/openOrder/:pairId').get(passportAuth, spotTradeCtrl.getOpenOrder)
router.route('/spot/filledOrder/:pairId').get(passportAuth, spotTradeCtrl.getFilledOrder)
router.route('/spot/orderHistory/:pairId').get(passportAuth, spotTradeCtrl.getOrderHistory)
router.route('/spot/tradeHistory/:pairId').get(passportAuth, spotTradeCtrl.getTradeHistory)
router.route('/spot/marketPrice/:pairId').get(spotTradeCtrl.getMarketPrice)
router.route('/spot/recentTrade/:pairId').get(spotTradeCtrl.getRecentTrade)
router.route('/spot/cancelOrder/:orderId').delete(passportAuth, spotTradeCtrl.cancelOrder)


// P2P Trade
router.route('/p2pTradePair').get(p2pCtrl.p2pTradePair);
router.route('/p2pSpotPair').get(p2pCtrl.p2pSpotPair);
router.route('/postTrade').post(passportAuth,p2pCtrl.p2pPostTrade)
router.route('/p2pMyadddetails').post(p2pCtrl.p2pMyadddetails);
router.route('/p2pMyrecentadddetails').post(p2pCtrl.p2pMyrecentadddetails);
router.route('/updateTrade').post(passportAuth,p2pTradeValid.p2pOrderUpdateValidate, p2pCtrl.p2pUpdateTrade)
router.route('/getBuyAdDetails').post(p2pCtrl.getBuyAdDetails);
router.route('/getSellAdDetails').post(p2pCtrl.getSellAdDetails);
router.route('/getSarchBuyData').post(passportAuth,p2pCtrl.getSarchBuyDetails);
router.route('/getSarchSellData').post(passportAuth,p2pCtrl.getSarchSellDetails);
router.route('/buyP2PTrade').post(p2pCtrl.buyP2PTrade);
router.route('/buyConfirmP2PTrade').post(p2pCtrl.buyConfirmP2PTrade);
router.route('/getSingleBuyAdDetails').post(p2pCtrl.getSingleBuyAdDetails);
router.route('/getSingleOrderDetails').post(p2pCtrl.getSingleOrderDetails);
router.route('/getOrderStatus').post(p2pCtrl.getOrderStatus);
router.route('/getChatDetails').post(p2pCtrl.getChatDetails);
router.route('/saveChatDetails').post(upload.single('proofImage'),p2pCtrl.saveChatDetails);
router.route('/confirmPay').post(p2pCtrl.confirmPay);
router.route('/releaseCryptocurrency').post(p2pCtrl.releaseCryptocurrency);
router.route('/cancelTrade').post(p2pCtrl.cancelTrade);
router.route('/disputeTrade').post(p2pCtrl.disputeTrade);
router.route('/getTradeDetails').post(p2pCtrl.getTradeDetails);
router.route('/getChatlisthistory').post(p2pCtrl.getChatlisthistory);
router.route('/cancelMyad').post(p2pCtrl.cancelMyad);
router.route('/getMyTransactions').post(p2pCtrl.getMyTransactions);
router.route('/getTransactionhistory').post(passportAuth,p2pCtrl.getMyTransactions);
router.route('/getMyP2PHistory').post(passportAuth,p2pCtrl.getMyP2PHistory);
router.route('/getMySpotHistory').post(passportAuth,spotTradeCtrl.getMySpotHistory);
router.route('/getFilledOrderHistory').post(passportAuth,spotTradeCtrl.getFilledOrderHistory);
router.route('/check2FA').get(passportAuth, userCtrl.check2FA);
router.route('/closeOrder').post(passportAuth,p2pCtrl.closeTrade);
router.route('/closeTrade').post(passportAuth,p2pCtrl.closeDateCrossed)

// Derivative Trade
router.route('/perpetual/tradePair').get(derivativeTradeCtrl.getPairList);
router.route('/perpetual/orderPlace').post(passportAuth, derivativeTradeCtrl.decryptTradeOrder, derivativeTradeCtrl.orderPlace)
router.route('/perpetual/ordeBook/:pairId').get(derivativeTradeCtrl.getOrderBook)
router.route('/perpetual/openOrder/:pairId').get(passportAuth, derivativeTradeCtrl.getOpenOrder)
router.route('/perpetual/filledOrder/:pairId').get(passportAuth, derivativeTradeCtrl.getFilledOrder)
router.route('/perpetual/tradeHistory/:pairId').get(passportAuth, derivativeTradeCtrl.getTradeHistory)
router.route('/perpetual/positionOrder/:pairId').get(passportAuth, derivativeTradeCtrl.getPositionOrder)
router.route('/perpetual/cancelOrder/:orderId').delete(passportAuth, derivativeTradeCtrl.cancelOrder)

// chart
router.route('/chart/:config').get(chartCtrl.getChartData)
router.route('/perpetual/chart/:config').get(chartCtrl.getPerpetualChart)


// Staking
router.route('/getStaking').get(stakingCtrl.getStaking)
router.route('/stake/balance').get(passportAuth, stakingCtrl.getStakeBal)
router.route('/stake/orderPlace').post(passportAuth, stakingCtrl.orderPlace)
router.route('/stake/orderList').get(passportAuth, stakingCtrl.orderList)
router.route('/stake/settleHistory').get(passportAuth, stakingCtrl.getSettleHistory)
router.route('/stake/cancel/:stakeId').delete(passportAuth, stakingCtrl.cancelOrder)
router.route('/stake/getDashBal').get(passportAuth, stakingCtrl.getDashBal)
router.route('/stake/getInterset').get(passportAuth, stakingCtrl.getInterset)

// Common
router.route('/getLanguage').get(languageCtrl.getLanguage);
router.route('/getCurrency').get(currencyCtrl.getCurrency);
router.route('/getMarketTrend').get(commonCtrl.getMarketTrend)
router.route('/getPairData').get(passportAuth, commonCtrl.getPairData)
router.route('/priceConversion').get(passportAuth, commonCtrl.getPriceCNV)

// Announcement
router.route('/announcement').get(passportAuth, anouncementCtrl.getAnnouncement)

// CMS 
router.route('/cms/:identifier').get(cmsCtrl.getCMSPage)

// FAQ
router.route('/faq').get(faqCtrl.getFaqWithCategory);

// Support Ticket
router.route('/getSptCat').get(passportAuth, supportCtrl.getSptCat);
router.route('/ticketMessage')
//.get(passportAuth, supportCtrl.getTicketMessage)
 .post(passportAuth, supportCtrl.replyMessage)
 .put(passportAuth, supportCtrl.closeTicket);
router.route('/newTicket')
    .get(passportAuth, supportCtrl.userTicketList)
    .post(passportAuth, supportCtrl.createNewTicket)
    .put(passportAuth, supportCtrl.usrReplyMsg)
    .patch(passportAuth, supportCtrl.closeTicket);
    router.route('/catTicket').post(passportAuth, supportCtrl.userCatTicketList)

// Webhook
router.route('/depositwebhook').post(webhookCtrl.depositwebhook)

export default router;