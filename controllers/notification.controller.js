
import mongoose from 'mongoose';
// import modal
import {
    Notification
} from '../models';

//import lib 
import { paginationQuery } from '../lib/adminHelpers';
var {ObjectId} = mongoose.Types;
/** 
 * Create Notification
 * userId, currencyId, transactionId, trxId, currencySymbol, amount, paymentType,status
*/
export const newNotification = async (doc) => {
    try {
        let newDoc = new Notification(doc)
        await newDoc.save();

        return true;
    } catch (err) {
        return false;
    }
}

/** 
 * Create Notification
*/

export const createNotification = async (data) => {
    try {

        const newDoc = new Notification(data);
        await newDoc.save();

        return true;
    } catch (err) {
        console.log("notification save err", err);
        return false;
    }

}


/** 
 *GET method
 * parms:""or show All
 *api:  /getNotification
*/


export const getNotification = async (req, res) => {


    try {
        let pagination = paginationQuery(req.query);

        const paramData = req.query.param;

        if (paramData == 'showAll') {
            let count = await Notification.countDocuments({ userId: req.user.id, })
            let result = await Notification.find({ userId: req.user.id, },).sort({ _id: -1 }).limit(pagination.limit).skip(pagination.skip)
            return res.status(200).json({ 'status': true, 'count': count, 'result': result })
        }
        else {
            let count = await Notification.countDocuments({ userId: req.user.id, admin_read: false })
            let result = await Notification.find({ userId: req.user.id, admin_read: false },).limit(5).sort({ _id: -1 })
            return res.status(200).json({ 'status': true, 'count': count, 'result': result })
        }


    } catch (err) {
        console.log("errrrrrrrrrrr", err)
        res.status(500).json({ message: "error on server" })
    }

}

/** 
 * method:PUT
 * rq.body:object id
 *api:  /getNotification
*/
export const update_notification_status = async (req, res) => {

    try {
        
        const id = req.body.id;
        const update = { admin_read: true }
        const updateData = await Notification.updateOne({ "_id": ObjectId(id) }, { $set: update }, { new: true })
        return res.status(200).json({ 'status': true, })

    } catch (err) {
        console.log("errrrrrrrrrrrr",err)
        res.status(500).json({ message: "error on server" })

    }
}