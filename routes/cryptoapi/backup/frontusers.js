const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const async = require("async");
const validateRegisterInput = require("../../validation/frontend/register");
const validatemobRegisterInput = require("../../validation/frontend/mobregister");
const validateLoginInput = require("../../validation/login");
const validatemobLoginInput = require("../../validation/moblogin");
const validateUpdateUserInput = require("../../validation/frontend/updateUser");
// const validateEmailtemplateInput = require("../../validation/emailtemplate");
const validateForgotInput = require("../../validation/forgot");
const validateCmsInput = require("../../validation/cms");
const validateFaqInput = require("../../validation/faq");
const validateUpdateSettingsInput = require("../../validation/settings");
var moment = require('moment');
const Web3 = require("web3");
const web3 = new Web3(keys.infura);
const validateResetInput = require("../../validation/frontend/resetpassword");
const validatetfaInput = require("../../validation/frontend/tfainput");
const validateContactInput = require("../../validation/frontend/contact_us");
const validateSupportReply1Input = require("../../validation/frontend/support_reply");
const validateSupportInput = require("../../validation/frontend/support");
const Cms = require("../../models/cms");
const User = require("../../models/User");
const Support = require("../../models/support");
const Faq = require("../../models/faq");
const currency = require("../../models/currency");
const FeeTable = require("../../models/FeeTable");
const Bonus = require("../../models/Bonus");
const Settings = require("../../models/settings");
const Contact = require("../../models/contactus");
const Emailtemplates = require("../../models/emailtemplate");
const nodemailer = require("nodemailer");
const multer = require("multer");
var node2fa = require("node-2fa");
var CryptoJS = require("crypto-js");
const perpetual = require("../../models/perpetual");
const cryptoRandomString = require("crypto-random-string");
const Assets = require("../../models/Assets");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const userinfo = [];
var request = require("request");
const rp = require("request-promise");
const Chat = require("../../models/Chat");
const client = require("twilio")(
  keys.TWILIO_ACCOUT_SID,
  keys.TWILIO_AUTH_TOKEN
);

const ReferTable = require("../../models/Referencetable");
var voucher_codes = require("coupon-code");
//console.log(keys.EMAILAPIKEY, "EMAILAPIKEY");
//console.log(keys.EMAILSECRETKEY, "EMAILSECRETKEY");
var ses = require("node-ses"),
  sesclient = ses.createClient({
    key: keys.EMAILAPIKEY,
    secret: keys.EMAILSECRETKEY,
  });




  var storagekyc = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/kyc");
    },
    filename: function (req, file, cb) {
      var userid = req.body.id;
      cb(null, userid + "-" + file.originalname);
    },
  });

  // var upload = multer({
  //   storage: storage
  // });
  const fileFilter = (req, file, cb, res) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb("File format should be PNG,JPG,JPEG", false);
      // if validation failed then generate error
    }
  };

  var uploadkyc = multer({ storage: storagekyc, fileFilter: fileFilter }).fields([
    { name: "idfront", maxCount: 1 },
    { name: "idback", maxCount: 1 },
    { name: "photofront", maxCount: 1 },
    { name: "Addfront", maxCount: 1 },
  ]);

  router.post("/kycupdate", (req, res) => {
    console.log("onini");
    uploadkyc(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }

      var photouploaded,iduploaded,addressuploaded = false
      User.findOne({ _id: req.body.id }).then((userdetails) => {
        if (userdetails.verifiedstatus != "Verified") {
          var IDprooffront, IDproofback, Photofile, Addfront;
          updatedata = {};
          if (
            typeof req.files.idfront != "undefined" &&
            req.files.idfront[0].filename
          ) {
            IDprooffront = req.files.idfront[0].filename;
            IDstatus = "Pending";
            updatedata["IDprooffront"] = IDprooffront;
            iduploaded=true
          }

          if (
            typeof req.files.idback != "undefined" &&
            req.files.idback[0].filename
          ) {
            IDproofback = req.files.idback[0].filename;
            IDstatus = "Pending";
            if (userdetails.IDstatus != "Verified") {
              updatedata["IDstatus"] = IDstatus;
              updatedata["IDproofback"] = IDproofback;
              iduploaded=true
            }
          }

          if (
            typeof req.files.photofront != "undefined" &&
            req.files.photofront[0].filename
          ) {
            Photofile = req.files.photofront[0].filename;
            Photostatus = "Pending";

            if (userdetails.Photostatus != "Verified") {
              updatedata["Photofile"] = Photofile;
              updatedata["Photostatus"] = Photostatus;
              photouploaded=true
            }
          }

          if (
            typeof req.files.Addfront != "undefined" &&
            req.files.Addfront[0].filename
          ) {
            Addressfile = req.files.Addfront[0].filename;
            Addresstatus = "Pending";

            if (userdetails.Addresstatus != "Verified") {
              updatedata["Addressfile"] = Addressfile;
              updatedata["Addresstatus"] = Addresstatus;
              addressuploaded=true
            }
          }

          updatedata["IDproofno"] = req.body.IDproofno;
          updatedata["IDtype"] = req.body.IdType;
          updatedata["Addressproofno"] = req.body.Addressproofno;
          updatedata["Addresstype"] = req.body.AddressType;
          // updatedata["Phototype"] = req.body.PhotoIDType;
          // updatedata["Phototypeno"] = req.body.Phototypeno;
          if(addressuploaded==true && photouploaded==true &&  iduploaded==true ){
            updatedata["verifiedstatus"] = "Pending";
          }
          updatedata["kycdate"] = Date.now();

          User.findOneAndUpdate(
            { _id: req.body.id },
            { $set: updatedata },
            { multi: true, new: true, fields: { _id: 0 } }
          ).exec(function (err, resUpdate) {
            if (err) {
              res.json({
                status: 0,
                message: "Something went wrong please try again later",
              });
            } else {
              res.json({
                status: 1,
                message:
                  "KYC details are submitted successfully,It will take some days to verify",
              });
            }
          });
        } else {
          return res.status(200).json({
            message: "KYC details are Already verified",
          });
        }
      });
    });
  });


router.get("/test1", (req, res) => {
  var smtpConfig = {
    service: keys.serverName,
    auth: {
      user: keys.email,
      pass: keys.password,
    },
  };
  var transporter = nodemailer.createTransport(smtpConfig);

  var mailOptions = {
    from: keys.fromName + "<" + keys.email + ">", // sender address
    to: "dev1@britisheducationonline.org", // list of receivers
    subject: "test", // Subject line
    html: "<h1>test</h1>", // html body
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
  });
  res.json({
    statue: "success",
  });
});

router.post("/user-activate", (req, res) => {
  var userid = req.body.userid;
  var updateObj = {
    active: "Activated",
  };
  User.findByIdAndUpdate(
    userid,
    updateObj,
    {
      new: true,
    },
    function (err, user) {
      if (user) {
        var jsonfilter = { identifier: "Bonus_notification" };
        Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
          err,
          templates
        ) {
          if (templates.content) {
            templateData = templates;
            templateData.content = templateData.content.replace(
              /##templateInfo_name##/g,
              user.email
            );
            templateData.content = templateData.content.replace(
              /##templateInfo_appName##/g,
              keys.siteName
            );
            templateData.content = templateData.content.replace(
              /##DATE##/g,
              new Date()
            );

            var smtpConfig = {
              host: keys.host, // Amazon email SMTP hostname
              auth: {
                user: keys.email,
                pass: keys.password,
              },
            };
            var transporter = nodemailer.createTransport(smtpConfig);

            var mailOptions = {
              from: keys.fromName + "<" + keys.fromemail + ">", // sender address
              to: user.email, // list of receivers
              subject: templateData.subject, // Subject line
              html: templateData.content, // html body
            };
            // transporter.sendMail(mailOptions, function (error, info) {
            //   if (error) {
            //     console.log(error);
            //   }
            // });
          }
        });

        return res.status(200).json({
          message: "Your Account activated successfully",
        });
      }
    }
  );
});
router.get("/emailresend", (req, res) => {
  User.find({
    active: {$ne:"Activated"}
    //email:"avsarma91@gmail.com"
  }).then((user) => {
    if(user)
    {
      for(var i=0;i<user.length;i++)
      {
        var email = user[i].email;
        var _id = user[i]._id;
            var jsonfilter = {
                    identifier: "activate_register_user",
                  };
                  var logo = keys.baseUrl + "Logo-small.png";
                  Emailtemplates.findOne(
                    jsonfilter,
                    {
                      _id: 0,
                    },
                    function (err, templates) {
                      if (templates) {
                        if (templates.content) {
                          templateData = templates;
                          templateData.content = templateData.content.replace(
                            /##DATE##/g,
                            new Date()
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_name##/g,
                            email
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_appName##/g,
                            keys.siteName
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_logo##/g,
                            logo
                          );
                          var link_html =
                            keys.frontUrl + "activate/" + _id;
                          templateData.content = templateData.content.replace(
                            /##templateInfo_url##/g,
                            link_html
                          );
                            var smtpConfig = {
                            // service: keys.serverName,
                            host: keys.host, // Amazon email SMTP hostname
                            auth: {
                            user: keys.email,
                            pass: keys.password,
                            },
                            };
                            var transporter = nodemailer.createTransport(smtpConfig);

                            var mailOptions = {
                            from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                            to: email, // list of receivers
                            subject: templateData.subject, // Subject line
                            html: templateData.content, // html body
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                            return console.log(error);
                            }
                            });
                        }

                      }
                    }
                  );
                  if(i==user.length-1)
                  {
                    res.json({success:true  })
                  }
      }
    }
  });
});
router.post("/user-add", (req, res) => {
  console.log("inside the user -add");
  const { errors, isValid } = validateRegisterInput(req.body, "register");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  var useremail= req.body.email

  var emailinlower=useremail.toLowerCase()

  User.findOne({
    email: emailinlower,
  }).then((user) => {
    if (user) {
      return res.status(400).json({
        email: "Email already existss",
      });
    } else {
      const referralcode = voucher_codes.generate();
      console.log("Voucher code =====", referralcode);

      userref = req.body.referalcode;
      console.log("userref", userref);

      const userid = Math.floor(100000 + Math.random() * 900000);
      const newUser = new User({
        email: emailinlower,
        password: req.body.password,
        userid: userid,
        acive: "Pending",
        referencecode: referralcode,
      });

      // bcrypt.genSalt(10, (err, salt) => {
      //   bcrypt.hash(newUser.password, salt, (err, hash) => {
      //     console.log("Data Saved");
      //     if (err) throw err;
      //     newUser.password = hash;
          var referaluserid = "";
          var curuser = {};
          var curref = {};

          async.waterfall(
            [
              function (done) {
                if (userref == "") {
                  done();
                } else {
                  console.log("Inisde else condiiton");
                  User.findOne({
                    referencecode: userref,
                  }).exec(function (error, userreferal) {
                    if (!error) {
                      referaluserid = userreferal._id;
                      newUser.referaluserid = referaluserid;
                      console.log("inside no error saving ", userreferal._id);
                    }
                    done();
                  });
                }
              },
              function (done) {
                newUser
                  .save()
                  .then((result) => {
                    curuser = result;
                    done();
                  })
                  .catch((err) => console.log(err));
              },
              function (done) {
                if (referaluserid == "") {
                  done();
                } else {
                  ReferTable.update(
                    {
                      userId: referaluserid,
                    },
                    {
                      $push: {
                        refer_child: curuser._id,
                      },
                    }
                  ).then((reference) => {
                    done();
                  });
                }
              },
              function (done) {
                if (referaluserid == "") {
                  var newRefer = new ReferTable();
                  newRefer.userId = curuser._id;
                  newRefer.save().then((reference) => {
                    curref = reference;
                    done();
                  });
                } else {
                  ReferTable.findOne({
                    userId: referaluserid,
                  }).then((res) => {
                    var refer_parent = res.refer_parent;

                    refer_parent.push(referaluserid);

                    var newRefer = new ReferTable();
                    newRefer.userId = curuser._id;
                    newRefer.refer_parent = refer_parent;
                    newRefer.save().then((reference) => {
                      curref = reference;
                      done();
                    });
                  });
                }
              },
              function (done) {
                User.findOne({
                  email: emailinlower,
                }).then((user) => {
                  var jsonfilter = {
                    identifier: "activate_register_user",
                  };
                  var logo = keys.baseUrl + "Logo-small.png";
                  Emailtemplates.findOne(
                    jsonfilter,
                    {
                      _id: 0,
                    },
                    function (err, templates) {
                      try{
                          if (templates) {
                        console.log(templates,'template67890')
                        if (templates.content) {
                          templateData = templates;
                          templateData.content = templateData.content.replace(
                            /##DATE##/g,
                            new Date()
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_name##/g,
                            user.email
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_appName##/g,
                            keys.siteName
                          );
                          templateData.content = templateData.content.replace(
                            /##templateInfo_logo##/g,
                            logo
                          );
                          var link_html = keys.frontUrl + "activate/" + user._id;
                          templateData.content = templateData.content.replace(
                            /##templateInfo_url##/g,
                            link_html
                          );
                          done();
                        }
                      }
                      } catch(err){
                        console.log(err,"********-----------*******")
                      }
                      
                    }
                  );
                });
              },
              function (done) {
                var smtpConfig = {
                  // service: keys.serverName,
                  host: keys.host, // Amazon email SMTP hostname
                  auth: {
                    user: keys.email,
                    pass: keys.password,
                  },
                  port: 465,
                  secure: true,
                };
                var transporter = nodemailer.createTransport(smtpConfig);

                var mailOptions = {
                  from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                  to: req.body.email, // list of receivers
                  subject: "Register Link", // Subject line
                  html: templateData.content, // html body
                };
                transporter.sendMail(mailOptions, function (error, info) {
                  if (error) {
                    return console.log(error);
                  }
                });
                done();
              },
              function (done) {
                currency
                  .find({ type: "Token" })
                  .then((currencytokendetails) => {
                    if (currencytokendetails.length > 0) {

                      // console.log("currenct token detailss",currencytokendetails)
                      currencytokendetails[0].email = req.body.email;
                      currencytokendetails[0].userId = curuser._id;
                      currencytokendetails[0].user_id = curuser.userid;
                      var i = 0;
                      // console.log("first length",currencytokendetails.length);

                      generatetokenaddress(currencytokendetails[0], function () {
                        console.log("length of array", currencytokendetails.length);
                        if (i === currencytokendetails.length - 1) {
                          // console.log("inside the if sss")
                          callBackResponseImport();
                        } else {
                          // console.log("isndie else")
                          i += 1;
                          currencytokendetails[i].email = req.body.email;
                          currencytokendetails[i].userId = curuser._id;
                          currencytokendetails[i].user_id = curuser.userid;

                          if (currencytokendetails[i]) {
                            // console.log("next creatinon token ss",currencytokendetails[i]);
                            generatetokenaddress(currencytokendetails[i]);
                          } else {
                            callBackResponseImport();
                          }
                        }
                      });
                    }
                  });
                done();
              },
              function (done) {
                currency.find({}).then((currencydetails) => {
                  if (currencydetails.length > 0) {
                    FeeTable.findOne({}).then((feedetails) => {
                      currencydetails[0].email = emailinlower;
                      currencydetails[0].userId = curuser._id;
                      currencydetails[0].user_id = curuser.userid;
                      currencydetails[0].tempbalance = feedetails.signup_bonus;
                      var i = 0;
                      generateaddress(currencydetails[0], function () {
                        // console.log("first");
                        if (i === currencydetails.length - 1) {
                          callBackResponseImport();
                        } else {
                          i += 1;
                          currencydetails[i].email = emailinlower;
                          currencydetails[i].userId = curuser._id;
                          currencydetails[i].user_id = curuser.userid;
                          currencydetails[i].tempbalance =
                            feedetails.signup_bonus;
                          if (currencydetails[i]) {
                            // console.log("next");
                            generateaddress(currencydetails[i]);
                          } else {
                            callBackResponseImport();
                          }
                        }
                      });
                    });
                  } else {
                    console.log("else");
                  }
                });
              },
            ],
            function (err) {}
          );
          return res.status(200).json({
            message:
              "Activation mail sent. Check your Registered email then Activate",
          });
      //   });
      // });
    }
  });
});
function generatetokenaddress(currencytokendetails, callBackOne) {
  // console.log("cureencty in generated token addres",currencytokendetails)

  if (callBackOne) {
    userinfo.calltoken = callBackOne;
  }
  // console.log("cureencty in generated token addres",currencytokendetails)
  var currencyAddress = "";
  // var header = { "Content-Type": "application/json" };
  // var args = {
  //   email: currencytokendetails.email,
  //   type: "getnewaddress",
  // };
  // // var tempbalance = feedetails.signup_bonus;
  // const options = {
  // url: "http://139.59.40.237:3003/ethnode",
  //   method: "POST",
  //   headers: header,
  //   body: JSON.stringify(args),
  // };
  // request(options, function (error, response, body) {
  //   if (!error && response.statusCode == 200) {
  // const tokenaddresss = JSON.parse(body);
  // console.log("currencytokendetails.currencySymbol",currencytokendetails.currencySymbol)
  // console.log("ADdress from the token  creadrere",tokenaddresss)
  // var eth_address = tokenaddresss.address;
  // var privateKey = tokenaddresss.privateKey;
  // var privateKey = CryptoJS.AES.encrypt(
  //   privateKey,
  //   keys.cryptoPass
  // ).toString();
  // var curid = currencytokendetails[i]._id;
  // var cursymbol = currencytokendetails[i].currencySymbol;
  const newAssets = new Assets({
    userId: currencytokendetails.userId,
    balance: 0,
    currency: currencytokendetails._id,
    currencySymbol: currencytokendetails.currencySymbol,
    privateKey: "",
    currencyAddress: "",
  });

  newAssets.save(function (err, data) {
    userinfo.calltoken();
    if (err) {
      console.log("Error in new assets add", err);
    }
  });
  //   }
  // });


}


function generateaddress(currencydetails, callBackOne) {
  // console.log(currencydetails, "currencydetailsssssssssssss");
  if (callBackOne) {
    userinfo.callBackbuyposTrade = callBackOne;
  }
  if (currencydetails.type == "Token") {
    return userinfo.callBackbuyposTrade();
  }
  // console.log("currencydetails.currencySymbol",currencydetails.currencySymbol);
  if (currencydetails.currencySymbol == "BTC") {
    var currencyAddress = "";

    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      tempcurrency: currencydetails.tempbalance,
      currencyAddress: "",
    });

    newAssets.save(function (err, data) {
      const newBonus = new Bonus({
        userId: currencydetails.userId,
        bonus_amount: currencydetails.tempbalance,
      });
      newBonus.save(function (err, data) {
        // console.log(err,'err')
        // console.log(data,'data')
      });
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });

  } else if (currencydetails.currencySymbol == "ETH") {
    var currencyAddress = "";

    // console.log("body of ETH server", body);


    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      privateKey: "",
      currencyAddress: "",
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
    //   }
    // });
  } else if (currencydetails.currencySymbol == "USD") {
    var currencyAddress = "";

    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      currencyAddress: currencyAddress,
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
  }
  else if (currencydetails.currencySymbol == "XRP") {
    var currencyAddress = currencydetails.user_id;

    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      currencyAddress: currencyAddress,
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
  }
  else if (currencydetails.currencySymbol == "BCH") {

    var currencyAddress = "";

    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      currencyAddress: info.result,
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
  }
  else if (currencydetails.currencySymbol == "LTC") {

    var currencyAddress = "";

    // console.log("body of LTC server", body);

    // const info = JSON.parse(body);
    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      currencyAddress: "",
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
  }
  else {
    // userinfo.callBackbuyposTrade();
    const newAssets = new Assets({
      userId: currencydetails.userId,
      balance: 0,
      currency: currencydetails._id,
      currencySymbol: currencydetails.currencySymbol,
      currencyAddress: "",
    });

    newAssets.save(function (err, data) {
      userinfo.callBackbuyposTrade();
      if (err) {
        console.log("Error in new assets add", err);
      }
    });
  }
}




// function generateaddress(currencydetails, callBackOne) {
//    console.log(currencydetails, "currencydetailsssssssssssss");
//   if (callBackOne) {
//     userinfo.callBackbuyposTrade = callBackOne;
//   }
//
//
//   if (currencydetails.currencySymbol == "BTC") {
//     var currencyAddress = "";
//     var header = { "Content-Type": "application/json" };
//     var args = { email: currencydetails.email, type: "getnewaddress" };
//     // var tempbalance = feedetails.signup_bonus;
//     const options = {
//       url: "http://136.244.107.56:3000/btcnode",
//       method: "POST",
//       headers: header,
//       body: JSON.stringify(args),
//     };
//     request(options, function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//         const info = JSON.parse(body);
//         const newAssets = new Assets({
//           userId: currencydetails.userId,
//           balance: 0,
//           currency: currencydetails._id,
//           currencySymbol: currencydetails.currencySymbol,
//           tempcurrency: currencydetails.tempbalance,
//           currencyAddress: info.result,
//         });
//
//         newAssets.save(function (err, data) {
//           const newBonus = new Bonus({
//             userId: currencydetails.userId,
//             bonus_amount: currencydetails.tempbalance,
//           });
//           newBonus.save(function (err, data) {
//             // console.log(err,'err')
//             // console.log(data,'data')
//           });
//           userinfo.callBackbuyposTrade();
//           if (err) {
//             console.log("Error in new assets add", err);
//           }
//         });
//       }
//     });
//   } else if (currencydetails.currencySymbol == "ETH") {
//     var currencyAddress = "";
//     var header = { "Content-Type": "application/json" };
//     var args = { email: currencydetails.email, type: "getnewaddress" };
//     // var tempbalance = feedetails.signup_bonus;
//     const options = {
//       url: "http://78.141.220.37:3000/ethnode",
//       method: "POST",
//       headers: header,
//       body: JSON.stringify(args),
//     };
//     request(options, function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//         const addressdetails = JSON.parse(body);
//         // var addressdetails = web3.eth.accounts.create();
//         var eth_address = addressdetails.address;
//         var privateKey = addressdetails.privateKey;
//         var privateKey = CryptoJS.AES.encrypt(
//           privateKey,
//           keys.cryptoPass
//         ).toString();
//         const newAssets = new Assets({
//           userId: currencydetails.userId,
//           balance: 0,
//           currency: currencydetails._id,
//           currencySymbol: currencydetails.currencySymbol,
//           privateKey: privateKey,
//           currencyAddress: eth_address,
//         });
//
//         newAssets.save(function (err, data) {
//           userinfo.callBackbuyposTrade();
//           if (err) {
//             console.log("Error in new assets add", err);
//           }
//         });
//       }
//     });
//   } else if (currencydetails.currencySymbol == "USDT") {
//     var currencyAddress = "";
//     var header = { "Content-Type": "application/json" };
//     var args = { email: currencydetails.email, type: "getnewaddress" };
//     // var tempbalance = feedetails.signup_bonus;
//     const options = {
//       url: "http://78.141.220.37:3000/ethnode",
//       method: "POST",
//       headers: header,
//       body: JSON.stringify(args),
//     };
//
//     request(options, function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//         const addressdetails = JSON.parse(body);
//         var eth_address = addressdetails.address;
//         var privateKey = addressdetails.privateKey;
//         var privateKey = CryptoJS.AES.encrypt(
//           privateKey,
//           keys.cryptoPass
//         ).toString();
//         const newAssets = new Assets({
//           userId: currencydetails.userId,
//           balance: 0,
//           currency: currencydetails._id,
//           currencySymbol: currencydetails.currencySymbol,
//           privateKey: privateKey,
//           currencyAddress: eth_address,
//         });
//
//         newAssets.save(function (err, data) {
//           userinfo.callBackbuyposTrade();
//           if (err) {
//             console.log("Error in new assets add", err);
//           }
//         });
//       }
//     });
//   } else if (currencydetails.currencySymbol == "USD") {
//     var currencyAddress = "";
//
//     const newAssets = new Assets({
//       userId: currencydetails.userId,
//       balance: 0,
//       currency: currencydetails._id,
//       currencySymbol: currencydetails.currencySymbol,
//       currencyAddress: currencyAddress,
//     });
//
//     newAssets.save(function (err, data) {
//       userinfo.callBackbuyposTrade();
//       if (err) {
//         console.log("Error in new assets add", err);
//       }
//     });
//   } else if (currencydetails.currencySymbol == "XRP") {
//     var currencyAddress = currencydetails.user_id;
//
//     const newAssets = new Assets({
//       userId: currencydetails.userId,
//       balance: 0,
//       currency: currencydetails._id,
//       currencySymbol: currencydetails.currencySymbol,
//       currencyAddress: currencyAddress,
//     });
//
//     newAssets.save(function (err, data) {
//       userinfo.callBackbuyposTrade();
//       if (err) {
//         console.log("Error in new assets add", err);
//       }
//     });
//   }else if (currencydetails.currencySymbol == "DCNTR") {
//
//     var currencyAddress = "";
//     var header = { "Content-Type": "application/json" };
//     var args = { email: currencydetails.email, type: "getnewaddress" };
//     // var tempbalance = feedetails.signup_bonus;
//     const options = {
//       url: "http://54.255.189.160:3003/dcntrcnode",
//       method: "POST",
//       headers: header,
//       body: JSON.stringify(args),
//     };
//     request(options, function (error, response, body) {
//       console.log("response from the  DCNTbody" ,body);
//       if (!error && response.statusCode == 200) {
//         const info = JSON.parse(body);
//         const newAssets = new Assets({
//           userId: currencydetails.userId,
//           balance: 0,
//           currency: currencydetails._id,
//           currencySymbol: currencydetails.currencySymbol,
//           tempcurrency: currencydetails.tempbalance,
//           currencyAddress: info.result,
//         });
//
//         newAssets.save(function (err, data) {
//           const newBonus = new Bonus({
//             userId: currencydetails.userId,
//             bonus_amount: currencydetails.tempbalance,
//           });
//           newBonus.save(function (err, data) {
//             // console.log(err,'err')
//             // console.log(data,'data')
//           });
//           userinfo.callBackbuyposTrade();
//           if (err) {
//             console.log("Error in new assets add", err);
//           }
//         });
//       }
//     });
//   } else {
//     userinfo.callBackbuyposTrade();
//   }
// }

function callBackResponseImport() {
  // tradeinfo.filledamount = 0;
  console.log("fskdmflskmdflskdmflksmdf");
}

router.post("/mobuser-add", (req, res) => {
  const { errors, isValid } = validatemobRegisterInput(req.body, "register");
  const generate_number = Math.floor(100000 + Math.random() * 900000);
  const userid = Math.floor(100000 + Math.random() * 900000);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({
    phonenumber: req.body.phone,
  }).then((user) => {
    if (user) {
      if (user.active == "Activated") {
        return res.status(400).json({
          phone: "Phone number already used",
        });
      } else {
        const newUser = {
          phonenumber: req.body.phone,
          password: req.body.mobilepassword,
          referalcode: req.body.mobilereferalcode,
          otp: generate_number,
          acive: "Pending",
          otptime: new Date(),
        };
        // bcrypt.genSalt(10, (err, salt) => {
        //   bcrypt.hash(newUser.password, salt, (err, hash) => {
        //     if (err) throw err;
        //     newUser.password = hash;
            User.findOneAndUpdate(
              {
                phonenumber: req.body.phone,
              },
              {
                $set: newUser,
              }
            )
              .then((user) => {
                async.waterfall(
                  [
                    function (done) {
                      client.messages.create({
                        from: keys.TWILIO_PHONE_NUMBER,
                        to: newUser.phonenumber,
                        body:
                          "Your " +
                          keys.fromName +
                          " OTP Code is: " +
                          generate_number,
                      });
                      done();
                    },
                  ],
                  function (err) {}
                );
                return res.status(200).json({
                  message: "OTP sent to your number.",
                });
              })
              .catch((err) => console.log(err));
        //   });
        // });
      }
    } else {
      const newUser = new User({
        phonenumber: req.body.phone,
        password: req.body.mobilepassword,
        referalcode: req.body.mobilereferalcode,
        otp: generate_number,
        userid: userid,
        acive: "Pending",
        otptime: new Date(),
      });
      // bcrypt.genSalt(10, (err, salt) => {
      //   bcrypt.hash(newUser.password, salt, (err, hash) => {
          // if (err) throw err;
          // newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              async.waterfall(
                [
                  function (done) {
                    client.messages.create({
                      from: keys.TWILIO_PHONE_NUMBER,
                      to: newUser.phonenumber,
                      body:
                        "Your " +
                        keys.fromName +
                        " OTP Code is: " +
                        generate_number,
                    });
                    done();
                  },
                  // function (done) {
                  //   var smtpConfig = {
                  //     service: keys.serverName,
                  //     auth: {
                  //         user: keys.email,
                  //         pass: keys.password
                  //     }
                  //  };
                  //  var transporter = nodemailer.createTransport(smtpConfig);

                  //  var mailOptions = {
                  //     from: keys.fromName+ '<'+keys.email +'>', // sender address
                  //     to: req.body.email, // list of receivers
                  //     subject: templateData.subject, // Subject line
                  //     html: templateData.content // html body
                  //  };
                  //  transporter.sendMail(mailOptions, function(error, info){
                  //     if(error)
                  //     {
                  //        return console.log(error);
                  //     }

                  //  });
                  // }
                ],
                function (err) {}
              );
              return res.status(200).json({
                message: "OTP sent to your number.",
              });
            })
            .catch((err) => console.log(err));
      //   });
      // });
    }
  });
});

router.post("/reset", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body, "password");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const id = req.body._id;
  /*bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) throw err;
      let update = {
        password: hash,
      };
      User.update(
        {
          _id: req.body._id,
        },
        {
          $set: update,
        },
        function (err, result) {
          if (err) {
            return res.status(400).json({
              message: "Unable to update user.",
            });
          } else {
            return res.status(200).json({
              message: "Password updated successfully.",
              success: true,
            });
          }
        }
      );
    });
  });*/

  User.findOne({_id:id},function(er1,user) {
    // if (user.authenticate(req.body.password)) {
      user.password = req.body.password;
      user.save(function(err,updatedPassword) {
        if (err) {
          return res.status(400).json({ message: 'Unable to update user.' });
        } else {
          return res.status(200).json({ message: 'Password updated successfully. Refreshing data...', success: true });
        }
      })
    // }else {
    //   return res
    //     .status(400)
    //     .json({ oldpassword: 'Old password is wrong.' });
    // }
  })
});

router.post("/mobresetPassword", (req, res) => {
  const { errors, isValid } = validateResetInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({
    phonenumber: req.body.phone,
    otptime: {
      $gt: new Date(new Date().getTime() - 120000),
    },
    otp: req.body.otpcode,
  }).exec(function (err, ressult) {
    if (ressult) {
      /*bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.resetpassword, salt, (err, hash) => {
          if (err) throw err;
          let update = {
            password: hash,
          };
          User.findOneAndUpdate(
            {
              phonenumber: req.body.phone,
            },
            {
              $set: update,
            },
            function (err, result) {
              if (err) {
                return res.status(400).json({
                  message: "Unable to update user.",
                });
              } else {
                return res.status(200).json({
                  message: "Your password has been reset successfully",
                  success: true,
                });
              }
            }
          );
        });
      });*/

      ressult.password = req.body.password;
      ressult.save(function(err,updatedPassword) {
        if (err) {
          return res.status(400).json({ message: 'Unable to update user.' });
        } else {
          return res.status(200).json({ message: 'Password updated successfully. Refreshing data...', success: true });
        }
      })
    } else {
      errors.otpcode = "OTP is invalid or expired";
      return res.status(400).json(errors);
    }
  });
});

router.get("/userget/:id", (req, res) => {
  const id = req.params.id;
  User.findById(id).then((user) => {
    console.log(user);
    if (user) {
      var result = user.toObject();
      if (
        typeof user.googlesecretcode == "undefined" ||
        user.google == "Disabled"
      ) {
        var newSecret = node2fa.generateSecret({
          name: "Bitbaazi",
        });
        result.newSecret = newSecret;
      } else {
        console.log("else");
        result.newSecret = {
          secret: user.googlesecretcode,
        };
      }
      return res.status(200).send(result);
    } else {
      console.log("fsdfsdfsdf");
    }
  });
});

router.post("/tfa-enable", function (req, res) {
  const { errors, isValid } = validatetfaInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne(
    {
      _id: req.body.id,
    },
    function (usererr, userdata) {
      if (userdata) {
        // bcrypt
        //   .compare(req.body.loginpassword, userdata.password)
        //   .then((isMatch) => {
            if (userdata.authenticate(req.body.loginpassword)) {
              if (
                typeof userdata.google == "undefined" ||
                userdata.google == "Disabled"
              ) {
                var secret_code = req.body.secretcode,
                  code_app = req.body.onecode;
                var newSecret = node2fa.verifyToken(secret_code, code_app);
                if (newSecret) {
                  if (
                    typeof newSecret.delta != "undefined" &&
                    newSecret.delta != -1
                  ) {
                    updatedata = {};
                    updatedata["googlesecretcode"] = secret_code;
                    updatedata["google"] = "Enabled";
                    User.findOneAndUpdate(
                      {
                        _id: req.body.id,
                      },
                      {
                        $set: updatedata,
                      },
                      {
                        new: true,
                      }
                    ).exec(function (uperr, resUpdate) {
                      if (uperr) {
                        res.json({
                          status: false,
                          message: uperr,
                        });
                      }
                      if (resUpdate) {
                        res.status(200).json({
                          message: "2fa status activated successfully",
                          success: true,
                          tfastatus: "active",
                        });
                      }
                    });
                  }
                } else {
                  return res.status(400).json({
                    onecode: "Code is wrong, try with new code",
                  });
                }
              } else {
                var secret_code = req.body.secretcode,
                  code_app = req.body.onecode;
                var newSecret = node2fa.verifyToken(secret_code, code_app);
                if (newSecret) {
                  if (
                    typeof newSecret.delta != "undefined" &&
                    newSecret.delta != -1
                  ) {
                    updatedata = {};
                    updatedata["googlesecretcode"] = "";
                    updatedata["google"] = "Disabled";
                    User.findOneAndUpdate(
                      {
                        _id: req.body.id,
                      },
                      {
                        $set: updatedata,
                      },
                      {
                        new: true,
                      }
                    ).exec(function (uperr, resUpdate) {
                      if (uperr) {
                        res.json({
                          status: false,
                          message: uperr,
                        });
                      }
                      if (resUpdate) {
                        res.status(200).json({
                          message: "2fa status deactivated successfully",
                          success: true,
                          tfastatus: "deactive",
                        });
                      }
                    });
                  }
                } else {
                  res.status(400).json({
                    onecode: "Code is wrong, try with new code",
                  });
                }
              }
            } else {
              return res.status(400).json({
                loginpassword: "Login password is wrong",
              });
            }
          // });
      }
    }
  );
});

router.post("/forgot", (req, res) => {
  const { errors, isValid } = validateForgotInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({
    email: req.body.email,
  }).then((user) => {
    if (!user) {
      return res.status(400).json({
        email: "Email not exists",
      });
    } else {
      async.waterfall(
        [
          function (done) {
            var jsonfilter = {
              identifier: "User_forgot",
            };

            var logo = keys.baseUrl + "Logo-small.png";
            Emailtemplates.findOne(
              jsonfilter,
              {
                _id: 0,
              },
              function (err, templates) {
                if (templates.content) {
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    user.email
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_appName##/g,
                    keys.siteName
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_logo##/g,
                    logo
                  );
                  var link_html =
                    keys.frontendUrl + "resetpassword/" + user._id;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_url##/g,
                    link_html
                  );
                  done();
                }
              }
            );
          },
          function (done) {
            var smtpConfig = {
              // service: keys.serverName,
              host: keys.host, // Amazon email SMTP hostname
              auth: {
                user: keys.email,
                pass: keys.password,
              },
            };
            var transporter = nodemailer.createTransport(smtpConfig);

            var mailOptions = {
              from: keys.fromName + "<" + keys.fromemail + ">", // sender address
              to: req.body.email, // list of receivers
              subject: templateData.subject, // Subject line
              html: templateData.content, // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                return console.log(error);
              } else {
              }
            });
          },
        ],
        function (err) {}
      );
      return res.status(200).json({
        message: "Reset Password link sent to Registered Mail ID",
      });
    }
  });
});

router.post("/forgotformob", (req, res) => {
  console.log(req.body);
  const { errors, isValid } = validateForgotInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne(
    {
      phonenumber: req.body.phone,
    },
    {
      loginhistory: 0,
    }
  ).then((user) => {
    if (!user) {
      return res.status(400).json({
        phone: "Phone number not exists",
      });
    } else {
      const generate_number = Math.floor(100000 + Math.random() * 900000);
      var tonumber = req.body.phone;
      client.messages
        .create({
          from: keys.TWILIO_PHONE_NUMBER,
          to: tonumber,
          body: "Your " + keys.fromName + " OTP Code is: " + generate_number,
        })
        .then(() => {
          var userid = req.body._id;
          var updateObj = {
            otp: generate_number,
            otptime: new Date(),
          };
          User.findOneAndUpdate(
            {
              phonenumber: req.body.phone,
            },
            {
              $set: updateObj,
            },
            {
              new: true,
            },
            function (err, user) {
              return res.status(200).json({
                message:
                  "OTP sent successfully, It is only valid for 2 minutes",
                success: true,
              });
            }
          );
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            message: "Something went wrong try again later",
            success: false,
          });
        });
    }
  });
});

router.post("/user-data", (req, res) => {
  User.find({})
    .select(["-password"])
    .then((user) => {
      if (user) {
        return res.status(200).send(user);
      }
    });
});

router.post("/user-delete", (req, res) => {
  User.deleteOne({
    _id: req.body._id,
  }).then((user) => {
    if (user) {
      return res.status(200).json({
        message: "User deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/user-update", (req, res) => {
  const { errors, isValid } = validateUpdateUserInput(req.body, "reg");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const _id = req.body._id;
  User.findOne({
    _id,
  }).then((user) => {
    if (user) {
      // if (req.body.password !== "") {
        // bcrypt.genSalt(10, (err, salt) => {
        //   bcrypt.hash(req.body.password, salt, (err, hash) => {
        //     if (err) throw err;
            // user.password = hash;
        //   });
        // });
      // }
      let update = {
        name: req.body.name,
        email: req.body.email
      };
      User.update(
        {
          _id: _id,
        },
        {
          $set: update,
        },
        function (err, result) {
          if (err) {
            return res.status(400).json({
              message: "Unable to update user.",
            });
          } else {
            return res.status(200).json({
              message: "User updated successfully. Refreshing data...",
              success: true,
            });
          }
        }
      );
    } else {
      return res.status(400).json({
        message: "Now user found to update.",
      });
    }
  });
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

router.post("/userupdate", (req, res) => {
  const { errors, isValid } = validateUpdateUserInput(req.body, "profile");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const _id = req.body.id;
  update = {
    name: req.body.name,
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to update user.",
        });
      } else {
        return res.status(200).json({
          message: "Profile details updated successfully",
          success: true,
        });
      }
    }
  );
});

router.post("/updatecurrency", (req, res) => {
  const { errors, isValid } = validateUpdateUserInput(req.body, "currency");
  if (!isValid) {
    return res.status(200).json({
      success: false,
      errors,
    });
  }
  const _id = req.body.id;
  update = {
    currency: req.body.currency,
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to update user.",
        });
      } else {
        return res.status(200).json({
          message: "Currency details updated successfully",
          success: true,
        });
      }
    }
  );
});

router.post("/updatenotification", (req, res) => {
  const _id = req.body._id;
  var notifications = {};

  update = {
    windoworder: req.body.windoworder,
    mobilesite: req.body.mobilesite,
    position: req.body.position,
    animation: req.body.animation,
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to update user.",
        });
      } else {
        return res.status(200).json({
          message: "Currency details updated successfully",
          success: true,
        });
      }
    }
  );
});

router.post("/updatepassword", (req, res) => {
  const { errors, isValid } = validateUpdateUserInput(req.body, "password");
  if (!isValid) {
    return res.status(200).json({
      success: false,
      errors,
    });
  }
  const id = req.body._id;
  User.findById(id).then((user) => {
    // bcrypt.compare(req.body.oldpassword, user.password).then((isMatch) => {
      if (user.authenticate(req.body.oldpassword)) {
        /*bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            let update = {
              password: hash,
            };
            User.update(
              {
                _id: req.body._id,
              },
              {
                $set: update,
              },
              function (err, result) {
                if (err) {
                  return res.status(400).json({
                    message: "Unable to update user.",
                  });
                } else {
                  return res.status(200).json({
                    message:
                      "Password updated successfully. Refreshing data...",
                    success: true,
                  });
                }
              }
            );
          });
        });*/
        user.password = req.body.password;
        user.save(function(err,updatedPassword) {
          if (err) {
            return res.status(400).json({ message: 'Unable to update user.' });
          } else {
            return res.status(200).json({ message: 'Password updated successfully. Refreshing data...', success: true });
          }
        })
      } else {
        return res.status(200).json({
          success: false,
          errors: {
            oldpassword: "Old password is wrong.",
          },
        });
      }
    // });
  });
});

var upload = multer({
  storage: storage,
});

router.post("/profileupload", upload.single("file"), (req, res) => {
  const file = req.file; // file passed from client
  const meta = req.body; // all other values passed from the client, like name, etc..
  const { errors, isValid } = validateUpdateUserInput(req.body, "profile");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(meta);
  console.log(file);
  let update = {};
  if (file != "" && file != undefined) {
    const profile = req.file.filename;
    update = {
      name: req.body.name,
      phonenumber: req.body.phonenumber,
      profile: profile,
    };
  } else {
    update = {
      name: req.body.name,
      phonenumber: req.body.phonenumber,
    };
  }
  console.log(update);
  const _id = req.body._id;

  User.update(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to update user.",
        });
      } else {
        return res.status(200).json({
          message: "User updated successfully. Refreshing data...",
          success: true,
        });
      }
    }
  );
});

router.post("/logincheck", (req, res) => {
  console.log("dsfksjdlkfjsldkfjlskdjflksjdflksjdfkljsd");
  const { errors, isValid } = validateLoginInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  var emailinlower=email.toLowerCase()
  const password = req.body.password;
  const loginhistory = req.body.logininfo;
  User.findOne({
    email:
      emailinlower,
  }).exec(function(er1,user){
    if (er1) {
      return res.status(404).json({
        email: "Error while checking database",
      });
    }
    if (!user) {
      return res.status(404).json({
        email: "Email not found",
      });
    }
    // bcrypt.compare(password, user.password).then((isMatch) => {
      if (user.authenticate(req.body.password)) {
        var index = user.loginhistory.findIndex(
          (x) => x.ipaddress === loginhistory.ipaddress
        );
        if (user.active == "Activated") {
          if (user.google == "Enabled") {
            return res.status(400).json({
              notify: "2fa Enabled",
            });
          }
          //  else if (index == -1 && user.loginhistory.length > 0) {
          //   const generate_number = Math.floor(100000 + Math.random() * 900000);
          //   User.update(
          //     {
          //       _id: user._id,
          //     },
          //     {
          //       $set: {
          //         ipblockcode: generate_number,
          //         ipblocktime: new Date(),
          //       },
          //     }
          //   ).exec(function (err, student) {});
          //   async.waterfall(
          //     [
          //       function (done) {
          //         var jsonfilter = {
          //           identifier: "Login_confirmation",
          //         };

          //         var logo = keys.baseUrl + "Logo-small.png";
          //         Emailtemplates.findOne(
          //           jsonfilter,
          //           {
          //             _id: 0,
          //           },
          //           function (err, templates) {
          //             if (templates.content) {
          //               templateData = templates;
          //               templateData.content = templateData.content.replace(
          //                 /##templateInfo_name##/g,
          //                 email
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##templateInfo_appName##/g,
          //                 keys.siteName
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##DATE##/g,
          //                 new Date()
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##BROWSER##/g,
          //                 loginhistory.broswername
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##IP##/g,
          //                 loginhistory.ipaddress
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##COUNTRY##/g,
          //                 loginhistory.countryName
          //               );
          //               templateData.content = templateData.content.replace(
          //                 /##CODE##/g,
          //                 generate_number
          //               );
          //               done();
          //             }
          //           }
          //         );
          //       },
          //       function (done) {
          //         var smtpConfig = {
          //           // service: keys.serverName,
          //           host: keys.host, // Amazon email SMTP hostname
          //           auth: {
          //             user: keys.email,
          //             pass: keys.password,
          //           },
          //         };
          //         var transporter = nodemailer.createTransport(smtpConfig);

          //         var mailOptions = {
          //           from: keys.fromName + "<" + keys.fromemail + ">", // sender address
          //           to: email, // list of receivers
          //           subject: templateData.subject, // Subject line
          //           html: templateData.content, // html body
          //         };
          //         transporter.sendMail(mailOptions, function (error, info) {
          //           if (error) {
          //             return console.log(error);
          //           } else {
          //           }
          //         });
          //       },
          //     ],
          //     function (err) {}
          //   );

          //   return res.status(400).json({
          //     notify: "blocking",
          //   });
          // }
           else {
            loginhistory.status = "Success";
            loginhistory.createdDate = new Date();
            //update login info
            User.update(
              {
                _id: user._id,
              },
              {
                $push: {
                  loginhistory: loginhistory,
                },
              }
            ).exec(function (err, student) {});

            const payload = {
              id: user.id,
              name: user.name,
              email: user.email,
              blocktime: user.blocktime,
              blockhours: user.blockhours,
              referencecode: user.referencecode,
              moderator: user.moderator,
            };
            jwt.sign(
              payload,

              keys.secretOrKey,
              {
                expiresIn: 10000, // 1 year in seconds
                // expiresIn: 31556926 // 1 year in seconds
              },
              (err, token) => {
                var jsonfilter = { identifier: "Login_notification" };
                Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                  err,
                  templates
                ) {
                  if (templates.content) {
                    templateData = templates;
                    templateData.content = templateData.content.replace(
                      /##templateInfo_name##/g,
                      email
                    );
                    templateData.content = templateData.content.replace(
                      /##templateInfo_appName##/g,
                      keys.siteName
                    );
                    templateData.content = templateData.content.replace(
                      /##DATE##/g,
                      new Date()
                    );
                    templateData.content = templateData.content.replace(
                      /##BROWSER##/g,
                      loginhistory.broswername
                    );
                    templateData.content = templateData.content.replace(
                      /##IP##/g,
                      loginhistory.ipaddress
                    );
                    templateData.content = templateData.content.replace(
                      /##COUNTRY##/g,
                      loginhistory.countryName
                    );
                    var smtpConfig = {
                      host: keys.host, // Amazon email SMTP hostname
                      auth: {
                        user: keys.email,
                        pass: keys.password,
                      },
                    };
                    var transporter = nodemailer.createTransport(smtpConfig);

                    var mailOptions = {
                      from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                      to: email, // list of receivers
                      subject: templateData.subject, // Subject line
                      html: templateData.content, // html body
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log(error);
                      }
                    });
                  }
                });

                res.json({
                  success: false,
                  token: "Bearer " + token,
                });
              }
            );
          }
        } else {
          return res.status(400).json({
            notify: "Your account still not activated",
          });
        }
      } else {
        loginhistory.createdDate = new Date();
        loginhistory.status = "Failure";
        User.update(
          {
            _id: user._id,
          },
          {
            $push: {
              loginhistory: loginhistory,
            },
          }
        ).exec(function (err, student) {});
        return res.status(400).json({
          notify: "Password incorrect",
        });
      }
    // });
  });
});

router.post("/tfachecking", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  var emailinlower=email.toLowerCase()
  const password = req.body.password;
  const loginhistory = req.body.logininfo;
  User.findOne({
  email:emailinlower,
  }).then((user) => {
    if (!user) {
      return res.status(404).json({
        email: "Email not found",
      });
    }
    // bcrypt.compare(password, user.password).then((isMatch) => {
      if (user.authenticate(req.body.password)) {
        if (user.active == "Activated") {
          if (user.google == "Enabled") {
            var googlesecretcode = user.googlesecretcode;
            var tfacode = req.body.tfacode;
            var newSecret = node2fa.verifyToken(googlesecretcode, tfacode);
            loginhistory.createdDate = new Date();
            loginhistory.status = "Success";
            console.log("newsecret",newSecret);
            if (newSecret) {
              if(newSecret.delta==0){
              User.update(
                {
                  _id: user._id,
                },
                {
                  $push: {
                    loginhistory: loginhistory,
                  },
                }
              ).exec(function (err, student) {});

              const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
                blocktime: user.blocktime,
                blockhours: user.blockhours,
                referencecode: user.referencecode,
                moderator: user.moderator,
              };
              jwt.sign(
                payload,

                keys.secretOrKey,
                {
                  expiresIn: 31556926, // 1 year in seconds
                },
                (err, token) => {
                  var jsonfilter = { identifier: "Login_notification" };
                  Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                    err,
                    templates
                  ) {
                    if (templates.content) {
                      templateData = templates;
                      templateData.content = templateData.content.replace(
                        /##templateInfo_name##/g,
                        email
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_appName##/g,
                        keys.siteName
                      );
                      templateData.content = templateData.content.replace(
                        /##DATE##/g,
                        new Date()
                      );
                      templateData.content = templateData.content.replace(
                        /##BROWSER##/g,
                        loginhistory.broswername
                      );
                      templateData.content = templateData.content.replace(
                        /##IP##/g,
                        loginhistory.ipaddress
                      );
                      templateData.content = templateData.content.replace(
                        /##COUNTRY##/g,
                        loginhistory.countryName
                      );
                      var smtpConfig = {
                        host: keys.host, // Amazon email SMTP hostname
                        auth: {
                          user: keys.email,
                          pass: keys.password,
                        },
                      };
                      var transporter = nodemailer.createTransport(smtpConfig);

                      var mailOptions = {
                        from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                        to: email, // list of receivers
                        subject: templateData.subject, // Subject line
                        html: templateData.content, // html body
                      };
                      transporter.sendMail(mailOptions, function (error, info) {
                        console.log(info, "info");
                        if (error) {
                          console.log(error);
                        }
                      });
                    }
                  });
                  res.json({
                    success: false,
                    token: "Bearer " + token,
                  });
                }
              );
            }else{
            return res.status(400).json({
              notify: "Code is Expired",
            });}
          } else {
              return res.status(400).json({
                notify: "Code is invalid",
              });
            }
          }
        } else {
          return res.status(400).json({
            notify: "Your account still not activated",
          });
        }
      } else {
        return res.status(400).json({
          notify: "Password incorrect",
        });
      }
    // });
  });
});

router.post("/confirmaionchecking", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;
  const loginhistory = req.body.logininfo;
  User.findOne({
    email,
  }).then((user) => {
    if (!user) {
      return res.status(404).json({
        email: "Email not found",
      });
    }
    // bcrypt.compare(password, user.password).then((isMatch) => {
      if (user.authenticate(req.body.password)) {
        if (user.active == "Activated") {
          if (
            user.ipblocktime > new Date(new Date().getTime() - 120000) &&
            user.ipblockcode == req.body.ccode
          ) {
            loginhistory.createdDate = new Date();
            loginhistory.status = "Success";
            User.update(
              {
                _id: user._id,
              },
              {
                $push: {
                  loginhistory: loginhistory,
                },
              }
            ).exec(function (err, student) {});

            const payload = {
              id: user.id,
              name: user.name,
              email: user.email,
              blocktime: user.blocktime,
              blockhours: user.blockhours,
              referencecode: user.referencecode,
              moderator: user.moderator,
            };
            jwt.sign(
              payload,

              keys.secretOrKey,
              {
                expiresIn: 31556926, // 1 year in seconds
              },
              (err, token) => {
                var jsonfilter = { identifier: "Login_notification" };
                Emailtemplates.findOne(jsonfilter, { _id: 0 }, function (
                  err,
                  templates
                ) {
                  if (templates.content) {
                    templateData = templates;
                    templateData.content = templateData.content.replace(
                      /##templateInfo_name##/g,
                      email
                    );
                    templateData.content = templateData.content.replace(
                      /##templateInfo_appName##/g,
                      keys.siteName
                    );
                    templateData.content = templateData.content.replace(
                      /##DATE##/g,
                      new Date()
                    );
                    templateData.content = templateData.content.replace(
                      /##BROWSER##/g,
                      loginhistory.broswername
                    );
                    templateData.content = templateData.content.replace(
                      /##IP##/g,
                      loginhistory.ipaddress
                    );
                    templateData.content = templateData.content.replace(
                      /##COUNTRY##/g,
                      loginhistory.countryName
                    );
                    var smtpConfig = {
                      host: keys.host, // Amazon email SMTP hostname
                      auth: {
                        user: keys.email,
                        pass: keys.password,
                      },
                    };
                    var transporter = nodemailer.createTransport(smtpConfig);

                    var mailOptions = {
                      from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                      to: email, // list of receivers
                      subject: templateData.subject, // Subject line
                      html: templateData.content, // html body
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                      console.log(info, "info");
                      if (error) {
                        console.log(error);
                      }
                    });
                  }
                });
                res.json({
                  success: false,
                  token: "Bearer " + token,
                });
              }
            );
          } else {
            return res.status(400).json({
              notify: "Confirmation Code is invalid or expired",
            });
          }
        } else {
          return res.status(400).json({
            notify: "Your account still not activated",
          });
        }
      } else {
        return res.status(400).json({
          notify: "Password incorrect",
        });
      }
    // });
  });
});

router.post("/moblogincheck", (req, res) => {
  const { errors, isValid } = validatemobLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const phone = req.body.phone;
  const password = req.body.mobpassword;
  const loginhistory = req.body.logininfo;
  User.findOne({
    phonenumber: phone,
  }).then((user) => {
    if (!user) {
      return res.status(404).json({
        phone: "Phone number not found",
      });
    }
    // bcrypt.compare(password, user.password).then((isMatch) => {
      if (user.authenticate(req.body.mobpassword)) {
        if (user.active == "Activated") {
          //update login info
          User.update(
            {
              _id: user._id,
            },
            {
              $push: {
                loginhistory: loginhistory,
              },
            }
          ).exec(function (err, student) {});

          const payload = {
            id: user.id,
            name: user.name,
            phonenumber: user.phonenumber,
          };
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926, // 1 year in seconds
            },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token,
              });
            }
          );
        } else {
          return res.status(400).json({
            notify: "Your account still not activated",
          });
        }
      } else {
        return res.status(400).json({
          notify: "Password incorrect",
        });
      }
    // });
  });
});

router.post("/sendotp", (req, res) => {
  const generate_number = Math.floor(100000 + Math.random() * 900000);
  var tonumber = req.body.phone;
  User.findOne({
    _id: { $ne: ObjectId(req.body._id) },
    phonenumber: tonumber,
  }).then((user) => {
    if (user) {
      // return res.status(400).json({
      //   email: 'Email already existss'
      // });
      return res.status(200).json({
        message: "Phone number already used",
        success: false,
      });
    } else {
      client.messages
        .create({
          from: keys.TWILIO_PHONE_NUMBER,
          to: tonumber,
          body: "Your " + keys.fromName + " OTP Code is: " + generate_number,
        })
        .then(() => {
          var userid = req.body._id;
          var updateObj = {
            otp: generate_number,
            phonenumber: tonumber,
            otptime: new Date(),
          };
          User.findByIdAndUpdate(
            userid,
            updateObj,
            {
              new: true,
            },
            function (err, user) {
              return res.status(200).json({
                message:
                  "OTP sent successfully, It is only valid for 2 minutes",
                success: true,
              });
            }
          );
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            message: "Something went wrong try again later",
            success: false,
          });
        });
    }
  });
});

router.post("/checkotp", (req, res) => {
  const otp = req.body.otp;
  User.findOne({
    _id: req.body._id,
    otptime: {
      $gt: new Date(new Date().getTime() - 120000),
    },
    otp: otp,
  }).exec(function (err, ressult) {
    if (ressult) {
      var userid = req.body._id;
      var updateObj = {
        sms: "Verified",
      };
      User.findByIdAndUpdate(
        userid,
        updateObj,
        {
          new: true,
        },
        function (err, user) {
          // FeeTable.findOne({}).then(feedetails => {
          //    var tempbalance = feedetails.signup_bonus;
          //    updatebaldata = {};
          //    updatebaldata['tempcurrency'] = tempbalance;

          //    // Assets.findOneAndUpdate({currencySymbol:'BTC',userId:ObjectId(req.body._id)},{"$inc": updatebaldata } , {new:true,"fields": {tempcurrency:1} } ,function(balerr,baldata){
          //    //    var tempbalance = feedetails.signup_bonus;
          //    //       const newBonus = new Bonus({
          //    //         userId         : req.body._id,
          //    //         bonus_amount   : tempbalance,
          //    //       });
          //    //       newBonus.save(function(err,data){
          //    //       // console.log(err,'err')
          //    //       // console.log(data,'data')
          //    //       });
          //    // });

          // });
          return res.status(200).json({
            message: "OTP verification successfully completed",
            success: true,
          });
        }
      );
    } else {
      return res.status(200).json({
        message: "OTP is invalid or expired",
        success: false,
      });
    }
  });
});

router.post("/otp-submit", (req, res) => {
  const otpcode = req.body.otpcode;
  const phone = req.body.phone;
  User.findOne({
    phonenumber: phone,
    otptime: {
      $gt: new Date(new Date().getTime() - 120000),
    },
    otp: otpcode,
  }).exec(function (err, ressult) {
    if (ressult) {
      var userid = req.body._id;
      var updateObj = {
        sms: "Verified",
        active: "Activated",
      };
      User.findOneAndUpdate(
        {
          phonenumber: phone,
        },
        updateObj,
        {
          new: true,
        },
        function (err, user) {
          return res.status(200).json({
            message:
              "OTP verification successfully completed, You can login now",
            success: true,
          });
        }
      );
    } else {
      return res.status(200).json({
        message: "OTP is invalid or expired",
        success: false,
      });
    }
  });
});

router.post("/CreateApiKey", (req, res) => {
  console.log(req.body);
  const { errors, isValid } = validateUpdateUserInput(req.body, "apiKey");
  if (!isValid) {
    return res.status(200).json({
      success: false,
      errors,
    });
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({
    _id: req.body.userid,
  }).then((userdata) => {
    if (!userdata) {
      return res.status(200).json({
        success: false,
        error: "User not found",
      });
    }
    ``;
    if (userdata.apiKeydetails.length >= 5) {
      return res.status(200).json({
        success: false,
        message: "Only 5 API keys are allowed, You cant create new one",
      });
    }

    if (userdata) {
      if (
        typeof userdata.google != "undefined" ||
        userdata.google != "Disabled"
      ) {
        var secret_code = userdata.googlesecretcode,
          code_app = req.body.twofactorkey;
        console.log(req.body.ipaddress, "secret code");
        console.log(code_app);
        var newSecret = node2fa.verifyToken(secret_code, code_app);
        if (newSecret) {
          if (typeof newSecret.delta != "undefined" && newSecret.delta != -1) {
            if (req.body.ipaddress == "") {
              var date = new Date();
              var newDate = new Date(date.setMonth(date.getMonth() + 8));
            } else {
              var newDate = "";
            }
            var apikey = cryptoRandomString({
              length: 20,
            });
            var secretkey = cryptoRandomString({
              length: 60,
            });
            var apikeydetails = {
              remarkname: req.body.remarkname,
              ipaddress: req.body.ipaddress,
              keypermission: req.body.keypermission,
              readOnly: req.body.readOnly,
              applicationName: req.body.applicationName,
              apikey: apikey,
              secretkey: secretkey,
              expiredDate: newDate,
            };
            User.update(
              {
                _id: userdata._id,
              },
              {
                $push: {
                  apiKeydetails: apikeydetails,
                },
              }
            ).exec(function (err, updatedata) {
              if (err) {
                res.json({
                  status: false,
                  message: err,
                });
              }
              if (updatedata) {
                res.status(200).json({
                  message: "API key created successfully",
                  success: true,
                });
              }
            });
          }
        } else {
          return res.status(200).json({
            success: false,
            message: "Code is wrong, try with new code",
          });
        }
      } else {
        return res.status(200).json({
          success: false,
          message: "Code is wrong, try with new code",
        });
      }
    }
  });
});

router.post("/deleteApiKey", (req, res) => {
  User.update(
    {
      _id: req.body.userid,
    },
    {
      $pull: {
        apiKeydetails: {
          _id: req.body.id,
        },
      },
    }
  ).exec(function (err, updatedata) {
    if (err) {
      res.json({
        status: false,
        message: err,
      });
    }
    if (updatedata) {
      res.status(200).json({
        message: "API key deleted successfully",
        success: true,
      });
    }
  });
});

router.post("/contact", (req, res) => {
  const { errors, isValid } = validateContactInput(req.body, "withcaptcha");
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const newContact = new Contact({
    email: req.body.email,
    name: req.body.name,
    message: req.body.message,
  });
  newContact.save(function (err, data) {
    console.log(err);
    if (err) {
      return res.status(400).json({
        message: "some error occurred",
      });
    } else {
      return res.status(200).json({
        message: "Contact submitted successfully",
        success: true,
      });
    }
  });
});
var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/support_images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload2 = multer({
  storage: storage2,
});

router.post("/support", upload2.single("file"), (req, res) => {
  const { errors, isValid } = validateSupportInput(req.body, "support");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const file = req.file;
  const details = req.body;
  console.log(details, "detailsxxxx");
  console.log(file, "filesdata");
  var attachment1 = "";
  //console.log(attachment1,'attachment1');
  if (file != "" && file != undefined) {
    attachment1 = req.file.filename;
  } else {
    attachment1 = null;
  }
  const newSupport = new Support({
    email_add: req.body.email_add,
    subject: req.body.subject,
    description: req.body.description,
    attachment: attachment1,
  });
  newSupport.save(function (err, data) {
    console.log(err, "errrrrrrrrrrrrrrrr");
    if (err) {
      return res.status(400).json({
        message: "some error occurred",
      });
    } else {
      return res.status(200).json({
        message: "Support ticket is submitted successfully",
      });
    }
  });
});

router.post("/supportreply", (req, res) => {
  Support.findOne({}, {})
    .sort({
      _id: -1,
    })
    .limit(1)
    .then((user) => {
      if (user) {
        return res.status(200).send(user);
        console.log(user, "uesrezzzzzzz");
      }
    });
});

var storage4 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/support_images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload4 = multer({
  storage: storage4,
});
//multer({ storage: storage, limits: {fileSize: 100000000} });
router.post("/support_reply_user", upload4.single("file"), function (req, res) {
  const { errors, isValid } = validateSupportReply1Input(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const file = req.file;
  const detailsuser = req.body;
  console.log(detailsuser, "detailsuser");
  console.log(file, "filesdata");
  var attachment1 = "";
  console.log(attachment1, "attachment1");
  if (file != "" && file != undefined) {
    attachment1 = req.file.filename;
  } else {
    attachment1 = null;
  } // check DB
  var reply_details = {
    message_query: detailsuser.message_query,
    replytype: "user",
    /* "replyby"      : ObjectId(req.session.adminid_b),*/
    replydate: new Date(),
    query_image: attachment1,
  };

  Support.findOneAndUpdate(
    {
      _id: detailsuser._id,
    },
    {
      $set: {
        reply_status: "replied",
      },
      $push: {
        reply: reply_details,
      },
    },
    {
      new: true,
    },
    function (err, supdata) {
      console.log(supdata, "supdata");
      if (err) {
        return res.status(400).json({
          message: "some error occurred",
        });
      } else {
        return res.status(200).json({
          message: "Ticket Query submitted successfully",
        });
      }
    }
  );
});

// chat
router.post("/chat-add", (req, res) => {
  const chatMsg = new Chat({
    userId: req.body.userId,
    message: req.body.message,
  });
  chatMsg
    .save()
    .then((faq) => {
      return res
        .status(200)
        .json({
          status: true,
          message: "Chat added successfully. Refreshing data...",
        });
    })
    .catch((err) => console.log(err));
});

router.get("/chat-data", (req, res) => {
  Chat.find({
    createddate: {
      $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  })
    .populate("userId", "name email moderator ")
    .exec(function (err, chat) {
      if (chat) {
        return res.status(200).send(chat);
      }
    });
});

module.exports = router;
