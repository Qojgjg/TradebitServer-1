//  import packages
import express from 'express';
import passport from 'passport';

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
import * as webhookCtrl from '../controllers/webhook.controller';

// import validation
import * as userValid from '../validation/user.validation';
import * as userKycValid from '../validation/userKyc.validation';
import * as walletValid from '../validation/wallet.validation';
import * as spotTradeValid from '../validation/spotTrade.validation';

const router = express();
const passportAuth = passport.authenticate("usersAuth", { session: false });



export default router;