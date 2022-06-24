// import package
const mongoose = require("mongoose");
import jwt from "jsonwebtoken";
var crypto = require('crypto');

// import config 
import config from '../config';

const Schema = mongoose.Schema;

const BankDetailsSchema = new Schema({
  bankName: {
    type: String,
    default: ""
  },
  accountNo: {
    type: String,
    default: ""
  },
  holderName: {
    type: String,
    default: ""
  },
  bankcode: {
    type: String,
    default: ""
  },
  country: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
});

const UserSchema = new Schema({
  uniqueId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    default: ""
  },
  lastName: {
    type: String,
    default: ""
  },
  email: {
    type: String,
   // required: true
  },
  phoneCode: {
    type: String,
    default: ""
  },
  phoneNo: {
    type: String,
    default: ""
  },
  otp: {
    type: String,
    default: ""
  },
  otptime: {
    type: Date,
    default: ''
  },
  newEmail: {
    type: String,
    default: ""
  },
  newEmailToken: {
    type: String,
    default: ""
  },
  newPhone: {
    phoneCode: {
      type: String,
      default: ""
    },
    phoneNo: {
      type: String,
      default: ""
    },
  },
  // hash: {
  //   type: String,
  // },
  // salt: {
  //   type: String,
  // },
  password:{
    type: String,
  },
  blockNo: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  google2Fa: {
    secret: {
      type: String,
      default: ""
    },
    uri: {
      type: String,
      default: ""
    },
  },
  emailStatus: {
    type: String,
    default: "unverified" //    default: 'unverified' //unverified, verified
  },
  phoneStatus: {
    type: String,
    default: "unverified" //    default: 'unverified' //unverified, verified
  },
  type: {
    type: String,
    enum: ['not_activate', 'basic_processing', 'basic', 'advanced_processing', 'advanced', 'pro_processing', 'pro'],
    default: 'not_activate' //not_activate, basic, advanced, pro
  },
  mailToken: {
    type: String,
    default: "" //
  },
  bankDetails: [BankDetailsSchema],
  status: {
    type: String,
    default: 'unverified' //unverified, verified
  },


  /* ------------------------ */
  liq_lock: {
    type: Boolean,
    default: false,
  },
  userid: {
    type: String,
  },

  moderator: {
    type: String,
    default: '0' //0-normal user, 1-moderator 2-admin,
  },
  phonenumber: {
    type: String,
    default: ""
  },
  ipblocktime: {
    type: Date,
  },
  ipblockcode: {
    type: String,
  },
  blocktime: {
    type: Date,
  },
  blockhours: {
    type: String,
  },
  expTime: {
    type: Date,
    default: ''
  },
  currency: {
    type: String,
    default: ""
  },
  profile: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    default: "user"
  },
  active: {
    type: String,
    default: "active"
  },
  referaluserid: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  referencecode: {
    type: String,
  },
  windoworder: {
    type: String,
    default: "false"
  },
  mobilesite: {
    type: String,
    default: "false"
  },
  position: {
    type: String,
    default: "false"
  },
  animation: {
    type: String,
    default: "false"
  },
  sms: {
    type: String,
    default: "Not Verified"
  },
  google: {
    type: String,
    default: "Disabled"
  },
  googlesecretcode: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  IDtype: {
    type: String,
    default: "",
  },
  IDproofno: {
    type: String,
    default: "",
  },
  IDprooffront: {
    type: String,
  },
  IDproofback: {
    type: String,
  },
  Addresstype: {
    type: String,
    default: "",
  },
  Addressproofno: {
    type: String,
    default: "",
  },
  Addressfile: {
    type: String,
  },
  Phototype: {
    type: String,
    default: "",
  },
  Phototypeno: {
    type: String,
    default: "",
  },
  Photofile: {
    type: String,
  },
  IDstatus: {
    type: String,
    default: "Not verified",
  }, //0-Unverified, 1-Verified, 2->pending, 3->Rejected
  Addresstatus: {
    type: String,
    default: "Not verified",
  }, //0-Unverified, 1-Verified, 2->pending, 3->Rejected
  Photostatus: {
    type: String,
    default: "Not verified",
  }, //0-Not verified, 1-Verified, 2->pending, 3->Rejected
  verifiedstatus: {
    type: String,
    default: "Not verified", //0-Unverified, 1-Verified, 2 -pending
  },
  kycdate: {
    type: Date,
  },
  p2pCompletedSellOrder: {
    type: Number,
    default: 0
  },
  p2pCompletedBuyOrder: {
    type: Number,
    default: 0
  },
  loginhistory: [{
    countryCode: {
      type: String,
      default: ''
    },
    countryName: {
      type: String,
      default: ''
    },
    regionName: {
      type: String,
      default: ''
    },
    ipaddress: {
      type: String,
      default: ''
    },
    broswername: {
      type: String,
      default: ''
    },
    ismobile: {
      type: String,
      default: ''
    },
    os: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: 'Success' // success / failure
    },
    createdDate: {
      type: Date,
      default: new Date() // success / failure
    },
  }],
  apiKeydetails: [{
    remarkname: {
      type: String,
      default: ''
    },
    ipaddress: {
      type: String,
      default: ''
    },
    keypermission: {
      type: String,
      default: ''
    },
    readOnly: {
      type: String,
      default: ''
    },
    applicationName: {
      type: String,
      default: ''
    },
    apikey: {
      type: String,
      default: ''
    },
    secretkey: {
      type: String,
      default: ''
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    expiredDate: {
      type: Date,
      default: ''
    },

  }]

});

// UserSchema.virtual('id').get(function () {
//   return this._id.toHexString();
// });

// UserSchema.set('toJSON', {
//   virtuals: true
// });

/**
 * Pre-save hook
 */
// UserSchema.pre('save', function (next) {
//   if (!this.isNew) return next();

//   if (!validatePresenceOf(this.hash))
//     next(new Error('Invalid password'));
//   else
//     next();
// });

// var validatePresenceOf = function (value) {
//   return value && value.length;
// };

// Validate empty password
// UserSchema
//   .path('hash')
//   .validate(function (hashedPassword) {
//     return hashedPassword.length;
//   }, 'Password cannot be blank');


/**
 * Virtuals
//  */
// UserSchema
//   .virtual('password')
//   .set(function (password) {
//     this._password = password;
//     this.salt = this.makeSalt();
//     this.hash = this.encryptPassword(password);
//   })
//   .get(function () {
//     return this._password;
//   });

/**
 * Methods
 */
// UserSchema.methods = {
//   /**
//    * Authenticate - check if the passwords are the same
//    *
//    * @param {String} plainText
//    * @return {Boolean}
//    * @api public
//    */
//   authenticate: function (plainText) {
//     return this.encryptPassword(plainText) === this.hash;
//   },

//   /**
//    * Make salt
//    *
//    * @return {String}
//    * @api public
//    */
//   makeSalt: function () {
//     return crypto.randomBytes(16).toString('base64');
//   },

//   /**
//    * Encrypt password
//    *
//    * @param {String} password
//    * @return {String}
//    * @api public
//    */
//   encryptPassword: function (password) {
//     if (!password || !this.salt) return '';
//     var salt = new Buffer(this.salt, 'base64');
//     return crypto.pbkdf2Sync(password, salt, 100000, 128, 'sha512').toString('base64');
//   }
// };

UserSchema.methods.generateJWT = function (payload) {
  var token = jwt.sign(payload, config.secretOrKey);
  return `Bearer ${token}`;
};



const User = mongoose.model("users", UserSchema);

module.exports = User;
