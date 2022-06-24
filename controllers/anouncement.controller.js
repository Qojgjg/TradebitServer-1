
// import model
import {
    Anouncement
} from '../models'

// import lib
import { nowDateInUTC } from '../lib/dateHelper'


/** 
 * Add Announcement
 * METHOD : POST
 * URL : /adminapi/anouncement
 * BODY : content, endDateTime
*/
export const anouncementAdd = async (req, res) => {
    let reqBody = req.body;
    let newDoc = new Anouncement({
        'content': reqBody.content,
        'endDateTime': reqBody.endDateTime
    })
    newDoc.save((err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Successfully added" })
    })
}

/** 
 * Get All Announcement
 * METHOD: GET
 * URL: /api/announcement
*/
export const getAnnouncement = (req, res) => {
    let dateTime = nowDateInUTC();
    Anouncement.find({ 'endDateTime': { "$gt": dateTime } }, { 'content': 1 }, { 'sort': { '_id': -1 }, "limit": 1 }, (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Successfully added", 'result': data })
    })
}
