// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const SiteSettingSchema = new Schema({
    userDashboard: [{
        _id: 0,
        currencyId: {
            type: ObjectId,
        },
        colorCode: {
            type: String,
            default: "",
        }
    }],
    marketTrend: {
        type: [ObjectId],
        default: []
    },
    contactPerson: {
        type: String,
        default: "",

    },
    companyName: {
        type: String,
        default: "",
    },
    siteName: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",

    },
    contactNo: {
        type: String,
        default: "",

    },
    mobileNo: {
        type: String,
        default: "",

    },
    registerCode: {
        type: String,
        default: "",

    },
    supportMail: {
        type: String,
        default: "",

    },
    facebookLink: {
        type: String,
        default: "",

    },
    facebookIcon: {
        type: String,
        default: "",
    },
    twitterIcon: {
        type: String,
        default: "",

    },
    twitterUrl: {
        type: String,
        default: "",

    },
    linkedinIcon: {
        type: String,
        default: "",

    },
    linkedinLink: {
        type: String,
        default: "",

    },
    mediumIcon: {
        type: String,
        default: "",

    },
    mediumLink: {
        type: String,
        default: "",

    },
    walletLicenseLink: {
        type: String,
        default: "",

    },
    companyInfoLink: {
        type: String,
        default: "",

    },
    copyrightText: {
        type: String,
        default: "",

    },
    forcedLiquidation: {
        type: String,
        default: "Enable",   //Enable,Disable
    },
    sitelogo: {
        type: String,
        default: "",

    },
    siteDescription: {
        type: String,
        default: "",

    },
    emailLogo: {
        type: String,
        default: "",

    },

})

const SiteSetting = mongoose.model('sitesetting', SiteSettingSchema, 'sitesetting');

export default SiteSetting;