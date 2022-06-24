// import package
import mongoose from 'mongoose';

// import modal
import {
    User,
    Transaction,
    Notification,
    SiteSetting,
    Assets
} from '../models';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Get Recent Transaction
 * URL : /api/recentTransaction
 * METHOD : GET
*/
export const getRecentTransaction = (req, res) => {
    Transaction.find({
        "userId": req.user.id
    }, {
        "createdAt": 1,
        "paymentType": 1,
        "currencySymbol": 1,
        "actualAmount": 1,
        "amount": 1,
        'txid': 1,
        "status": 1
    }).sort({ "createdAt": -1 }).limit(5).exec((err, data) => {
        if (err) { return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" }) }
        return res.status(200).json({ "success": true, 'result': data })
    })
}

/** 
 * Get Login History
 * URL : /api/loginHistory
 * METHOD : GET
*/
export const getLoginHistory = (req, res) => {
    User.aggregate([
        { "$match": { '_id': ObjectId(req.user.id) } },
        { "$unwind": "$loginhistory" },
        { "$sort": { "loginhistory.createdDate": -1 } },
        { "$limit": 5 },
        {
            "$project": {
                "createdDate": "$loginhistory.createdDate",
                "ipaddress": "$loginhistory.ipaddress",
                "regionName": "$loginhistory.regionName",
                "countryName": "$loginhistory.countryName",
                "broswername": "$loginhistory.broswername",
                "os": "$loginhistory.os",
                "status": "$loginhistory.status"
            }
        }
    ], (err, data) => {
        if (err) { return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" }) }
        else {
            // console.log("Login History----",data);
            return res.status(200).json({ "success": true, 'result': data })
        }
    })
}

/** 
 * Get Notification History
 * URL : /api/notificationHistory
 * METHOD : GET
*/
export const getNotificationHistory = (req, res) => {
    var userId= ObjectId(req.user.id);
    Notification.find({
        "userId": userId
    }).sort({ "created_date": -1 }).exec((err, data) => {
        if (err) { 
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" }) 
        }else{
           // console.log("Notification History--- ",data);
        return res.status(200).json({ "success": true, 'result': data })
        }
    })
}


export const setNotificationHistory = async (req, res) => {
   
    var userId= ObjectId(req.user.id);

    await Notification.updateMany(
        {
            "userId": userId
        },
        {
          $set: {
            admin_read: true,
          },
        }
      ).exec((err, data) => {
       
        if (err) { 
            return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" }) 
        }else{
           // console.log("Notification History--- ",data);
        return res.status(200).json({ "success": true, 'result': data })
        }
    })
}

/** 
 * Get Dashboard Balance Detail
 * URL : /api/getDashBal
 * METHOD : GET
*/
export const getDashBal = async (req, res) => {
    try {
        const siteSetting = await SiteSetting.findOne({}, { "userDashboard": 1 });
        if (siteSetting) {
            let currencyId = siteSetting.userDashboard.map(item => item.currencyId)

            if (currencyId && currencyId.length > 0) {
                let userAsset = await Assets.find({
                    "userId": req.user.id,
                    "currency": { "$in": currencyId }
                }, {
                    '_id': 0,
                    'currency': 1,
                    'currencySymbol': 1,
                    'derivativeWallet': 1,
                    'spotwallet': 1
                }).limit(5).lean()

                if (userAsset && userAsset.length > 0) {
                    let result = []
                    userAsset.map(item => {
                        let findData = siteSetting.userDashboard.find(el => el.currencyId == item.currency.toString())
                        if (findData) {
                            result.push({
                                ...item,
                                ...{
                                    'colorCode': findData.colorCode
                                }
                            })
                        }
                    })
                    console.log("Sitesetting----",result);
                    return res.status(200).json({ 'success': true, 'message': "Fetch success", result })
                }
            }
            return res.status(400).json({ 'success': false, 'message': "no record" })
        }
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}