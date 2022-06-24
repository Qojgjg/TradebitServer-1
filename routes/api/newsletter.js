const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Emailtemplates = require('../../models/emailtemplate');
const nodemailer = require('nodemailer');
const sendmail = require("./bsendmail.js"); 


router.get('/test', (req, res) => {
  res.json({statue:"success"});
});

router.get('/news-letter', (req, res) => {  
    User.find({}).then(user => {
        if (user) {
            return res.status(200).send(user);
            console.log(user,'uesrezzzzzzz');
        } 
    });
});
  
  

  router.post('/sendnewsletter', function(req,res) {  
   var pdata= req.body;
   console.log(pdata,'pdatazzzzzzzzzzzzzzz');
             // check DB 
                try {
                var emaildata = {} ; 
                var assign_email = []; 
                  pdata.email.forEach(function(fetitem){  
                       assign_email.push(fetitem);
                    /*********** send mail ***********/              
                        var toemail = assign_email;      
                        console.log(toemail,'toemail');
                          //toemail = "renuka@alwin.io";                  
                      /* var settings_dat = res.locals.settings; 
                      var sitename = settings_dat.sitename; */
                        var datetime = new Date();
                        var date = datetime.getFullYear()+'/'+(datetime.getMonth()+1)+'/'+datetime.getDate(); 
                      emaildata['identifier']="newsletter_send";                         
      
                      emaildata['replace_cnt']={ "##MESSAGE##": pdata.message, "##DATE##" : date };     
                      var strreplace_cnd = /##MESSAGE##|##DATE##/gi ;  
                      emaildata['strrp_cond']= strreplace_cnd ;    
                      /*emaildata['settings'] = { "sitename" :  sitename};  */  
                      emaildata['to']= toemail;   

                      var sent_mail = new sendmail.get(emaildata,res); 
                     console.log(sent_mail,'sent_mail');
                       // Create and save object                         
                     /*********** send mail ***********/
                   });   
                  res.json({status:true,message:"Sent newsletter mails sucessfully. Refreshing data..."});
                     }
                  catch(err) { 
                    console.log(err);
                    res.json({status:false,message:err});

                  }           
              
});     




module.exports = router;
