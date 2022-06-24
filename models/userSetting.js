// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserSettingSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    currencySymbol: {
        type: String,
        default: 'USD'
    },
    theme: {
        type: String,   //light, dark
        default: "dark"
    },
    afterLogin: {
        page: {
            type: String,
            default: 'dashboard'
        },
        url: {
            type: String,
            default: '/dashboard'
        }
    },
    languageId: {
        type: Schema.Types.ObjectId,
        ref: 'language'
    },
    timeZone: {
        name: {
            type: String,
            default: ''
        },
        GMT: {
            type: String,
            default: ''
        },
    },
    twoFA: {
        type: Boolean,
        default: false
    },
    passwordChange: {
        type: Boolean,
        default: false
    },
    siteNotification: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

const UserSetting = mongoose.model("usersetting", UserSettingSchema, 'usersetting');

export default UserSetting;