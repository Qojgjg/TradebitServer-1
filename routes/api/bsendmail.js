const express = require('express');
const router  = express.Router(); 
const async = require('async');
const nodemailer = require('nodemailer');
const emailtemplate = require('../../models/emailtemplate');
var fs = require('fs');

var get= function(req,res){  
 
 fs.readFile('./routes/api/bsmail.js', 'utf-8', (err, data) => { 
  if(err) { throw err; } 
    var data_og =  JSON.parse(data); 
    const smtpuser =  data_og.smtpuser; 
    const smtppass =  data_og.smtppass; 
    const smtpurl =  data_og.smtphost; 
    console.log(smtpurl);
    const smtpport =  data_og.smtpport; 
     
    var strreplace_cnd = req.strrp_cond
    var mapObj = req.replace_cnt
    var identifier = req.identifier
    var toemail = req.to
   /* var sitename = req.settings.sitename  */
    
      emailtemplate.findOne({"identifier" : identifier},{_id : 0 } , function (err, bcdata) {  
        console.log(bcdata,'bcdata');

      var msgcnt = bcdata.content.replace(strreplace_cnd, function(matched){
         return mapObj[matched];
      }); 
      var subcnt = bcdata.subject.replace(strreplace_cnd, function(matched){
         return mapObj[matched];
      });

       var  transporter = nodemailer.createTransport({
          host: smtpurl,
          port: smtpport,
          secure: true,
          auth: {
              user: smtpuser,
              pass: smtppass  
          }
      }); 

      var mailOptions = {

         /* from: sitename+' '+smtpuser,*/ // sender address
          to: toemail, // list of receivers
          subject: subcnt, // Subject line
         // text: bcdata.content, // plain text body
          html: msgcnt // html body 
      }; 
     console.log(mailOptions,'mailOptions');
      transporter.sendMail(mailOptions, (error, info) => { 
          if (error) {
            console.log(error);
            //   res.json({"status":false , "message":" message not sent.try again later."});   
          } else { 
            //console.log(info,'info');
           }
              
          });    
 
       });  

   });         
 
   } 
 

module.exports = router; 
module.exports.get = get; 