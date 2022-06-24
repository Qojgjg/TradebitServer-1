const express = require('express');
const router = express.Router();
const validateSupportInput = require('../../validation/frontend/support');
const Support = require('../../models/support');
const User = require('../../models/User');
const multer = require('multer');
router.get('/test', (req, res) => {
  res.json({statue:"success"});
});
 
router.get('/test1', (req, res) => {
  res.json({statue:"success"});
});
/*router.get('/getsupport', (req, res) => {
    User.findOne({},{}).then(user => {
      console.log(user,'userzzzzzzzzzzzzzzzzz');
        if (user) {
            return res.status(200).send(user);
        } 
    });
});*/

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/support_images')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' +file.originalname )
    }
})

var upload = multer({ storage: storage });

  router.post('/support_1',upload.single('file'), (req, res) => {
    const { errors, isValid } = validateSupportInput(req.body,'support');
    if (!isValid) {
        return res.status(400).json(errors);
    }  
     const file = req.file;
     const details = req.body;
     console.log(details,'detailsxxxx');
     console.log(file,'filesdata');
     var attachment1 = ''; 
     //console.log(attachment1,'attachment1');    
       if(file!="" && file!=undefined){
        attachment1 = req.file.filename; 
      } else { 
        attachment1 = null      
      }  
            const newSupport = new Support({
                email_add: req.body.email_add,
                subject: req.body.subject,
                description: req.body.description,
                attachment  : attachment1
            });
           newSupport.save(function(err,data) {
      console.log(err,'errrrrrrrrrrrrrrrr');
    if(err)
      {
         return res.status(400).json({ message: 'some error occurred' });      }
      else
      {
        return res.status(200).json({ message: 'Support ticket is submitted successfully. Refreshing data...' });
      }

      });
       
    });


  



module.exports = router;
