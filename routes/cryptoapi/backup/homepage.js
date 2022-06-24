const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const async = require("async");
const Cms = require('../../models/cms');
const User = require('../../models/User');
const Faq = require('../../models/faq');
const Settings = require('../../models/settings');
const Contact = require('../../models/contactus');
const Emailtemplates = require('../../models/emailtemplate');
// const client = require('twilio')(
//   keys.TWILIO_ACCOUT_SID,
//   keys.TWILIO_AUTH_TOKEN
// );

router.get('/test1', (req, res) => {
  res.json({statue:"success"});
});


router.get('/getcms/:key', (req, res) => {
    Cms.findOne({ "subject" : req.params.key},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
           // console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/banner', (req, res) => {
    Cms.findOne({ "subject" : "Banner_sec"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
           // console.log(user,'uesrezzzzzzz');
        }
    });
});
router.get('/banner_1', (req, res) => {
    Cms.findOne({ "subject" : "Home_banner_1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
           // console.log(user,'uesrezzzzzzz');
        }
    });
});
router.get('/banner_2', (req, res) => {
    Cms.findOne({ "subject" : "Home_banner_2"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/features', (req, res) => {
    Cms.findOne({ "subject" : "Features_title"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/features_1', (req, res) => {
    Cms.findOne({ "subject" : "Features_1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/features_2', (req, res) => {
    Cms.findOne({ "subject" : "Features_2"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
           // console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/features_3', (req, res) => {
    Cms.findOne({ "subject" : "Features_3"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/features_4', (req, res) => {
    Cms.findOne({ "subject" : "Features_4"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/start', (req, res) => {
    Cms.findOne({ "subject" : "Started"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/start_1', (req, res) => {
    Cms.findOne({ "subject" : "Started_1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/coming', (req, res) => {
    Cms.findOne({ "subject" : "Coming Soon"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/trading', (req, res) => {
    Cms.findOne({ "subject" : "Trading_platform"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/about_us', (req, res) => {
    Cms.findOne({ "subject" : "About_us"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/about_us_1', (req, res) => {
    Cms.findOne({ "subject" : "About_us1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
           // console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/leverage', (req, res) => {
    Cms.findOne({ "subject" : "Leverage_1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/leverage_1', (req, res) => {
    Cms.findOne({ "subject" : "Leverage_2"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/contact', (req, res) => {
    Settings.findOne({},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/licence', (req, res) => {
    Cms.findOne({ "subject" : "licence_1"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});
router.get('/terms', (req, res) => {
    Cms.findOne({ "subject" : "Terms"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/privacy', (req, res) => {
    Cms.findOne({ "subject" : "privacy"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/faq', (req, res) => {
   Faq.find({},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/faq_1', (req, res) => {
   Faq.find({},{}).sort({'_id':1}).limit(3).then(user => {
        if (user) {
            return res.status(200).send(user);
            console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/risk', (req, res) => {
    Cms.findOne({ "subject" : "Risk Disclosure Statement"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/aml-cft', (req, res) => {
    Cms.findOne({ "subject" : "AML&CFT"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/cookie-policy', (req, res) => {
    Cms.findOne({ "subject" : "CookiePolicy"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

router.get('/anti-spam-policy', (req, res) => {
    Cms.findOne({ "subject" : "AntiSpamPolicy"},{}).then(user => {
        if (user) {
            return res.status(200).send(user);
            //console.log(user,'uesrezzzzzzz');
        }
    });
});

module.exports = router;
