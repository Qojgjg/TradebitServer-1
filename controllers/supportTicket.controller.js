import TicketSupport from '../models/ticketSupports';
import Admin from '../models/Admin';
import mongoose from 'mongoose'
import SupportCategory from '../models/supportCategory';
import User from '../models/User';
import { mailTemplateLang } from './emailTemplate.controller';
import { dateTimeFormat } from '../lib/dateHelper';
const ObjectId = mongoose.Types.ObjectId;


export const createNewTicket = async (req, res) => {
    try {
      //  console.log("Inside new Ticket function------",req.body);
        let reqBody = req.body;
        //console.log("Ticket Data------",req.body);
        let adminDetail = await Admin.findOne();
        if (!adminDetail) {
            return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
        }
     
        let newDoc = new TicketSupport({
            'userId': req.user.id,
            'adminId': adminDetail._id,
            'categorySubject': reqBody.categorySubject,
            'reply': [{
                'senderId': req.user.id,
                'receiverId': adminDetail._id,
                'message': reqBody.message,
                'messageBy':req.body.messageBy
            }]
        })
        
        const userId=req.user.id;
        const supportData=  await newDoc.save();

        
     const userData=await User.findOne({"_id":userId})
        var email=userData.email;
      let content = {
        'id': supportData._id
        
    };

    mailTemplateLang({
        'userId': userId,
        'identifier': 'support_ticket_send',
        'toEmail': email,
        content
    })

        return res.status(200).json({ 'success': true, 'result': { "messages": "Ticket rise successfully" } })

    } catch (err) {
        console.log("errrrrrrrrrrrr----------------",err);
        return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
    }
}
// export const userTicketList1= async (req, res) => {
//     console.log("userticketlist-----------",req.user.id);
//     TicketSupport.find({ 'userId': ObjectId(req.user.id) }, (err, categoryData) => {
//         if (err) {
//             console.log("err---------------",err)
//             return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
//         }
//         console.log("Ticket Data-----------",categoryData)
//         return res.status(200).json({ "success": true, 'result': { 'data': categoryData } })
//     })
// }

export const userTicketList = async (req, res) => {
const data=await SupportCategory.find({});
console.log("Get Support data------",req.user.id);

 TicketSupport.find({userId:ObjectId(req.user.id)}, (err, data) => {

            if (err) {
                console.log("Get support error---",err);
                return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
            }
            else{
                console.log("Get support details---",data);
               return res.status(200).json({ 'success': true, 'result': data })
            }
        })

}


export const closeTicket = (req, res) => {
    let reqBody = req.body;

    TicketSupport.findOneAndUpdate(
        { "_id": reqBody.ticketId },
        { "status": "closed" },
        {
            "fields": {
                "_id": 0,
                "status": 1
            },
            "new": true
        },
        (err, ticketData) => {
            if (err) {
                return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
            }
            return res.status(200).json({ 'success': true, 'messages': "Ticket closed successfully", 'result': ticketData })
        }
    )
}
//.................................admin...............................//

export const getSupportCategory = (req, res) => {
    TicketSupport.find({userId:req.user.id, 'categorySubject':{ $ne: null}}, (err, categoryData) => {
        if (err) {
            
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        else{
        return res.status(200).json({ "success": true, 'result': { 'data': categoryData } })
        }
    })
     
}
export const addSupportCategory = async (req, res) => {
    try {

        let reqBody = req.body;
        let checkCategory = await SupportCategory.findOne({ "categoryName": reqBody.categoryName })
        if (checkCategory) {
            return res.status(400).json({ "success": false, 'errors': { 'categoryName': "category name already exists" } })
        }
        let newDoc = new SupportCategory({
            'categoryName': reqBody.categoryName
        })
        await newDoc.save()
        return res.status(200).json({ "success": false, 'result': { 'messages': "Added successfully" } })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}


export const getSingleSupportCategory = (req, res) => {
    SupportCategory.findOne({ '_id': req.params.categoryId }, { 'categoryName': 1 }, (err, categoryData) => {
        if (err) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        return res.status(200).json({ "success": true, 'result': categoryData })
    })
}

export const editSupportCategory = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkCategory = await SupportCategory.findOne({
            "categoryName": reqBody.categoryName,
            "_id": { "$ne": reqBody.categoryId }
        })
        if (checkCategory) {
            return res.status(400).json({ "success": false, 'errors': { 'categoryName': "category name already exists" } })
        }
        await SupportCategory.findOneAndUpdate(
            { "_id": reqBody.categoryId },
            { "categoryName": reqBody.categoryName }
        )
        return res.status(200).json({ "success": false, 'result': { 'messages': "update successfully" } })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

export const deleteSupportCategory=async( req,res)=>{


    const result=await   SupportCategory.findOneAndDelete({"_id":req.body.id})
    return res.status(200).json({ "success": true, message:"deleted successfully " })
  
  
  }
  

  export const getTicketList = async (req, res) => {
    try {

       
        // let pagination = paginationQuery(req.query);
        // let count = await TicketSupport.countDocuments()

        let data = await TicketSupport.aggregate([
            {
                "$sort": {
                    "createdAt": -1
                }
            },
            {
                "$lookup": {
                    "from": 'supportCategory',
                    "localField": "categoryId",
                    "foreignField": "_id",
                    "as": "categoryInfo"
                }
            },
            { "$unwind": "$categoryInfo" },

            {
                "$lookup": {
                    "from": 'users',
                    "localField": "userId",
                    "foreignField": "_id",
                    "as": "userInfo"
                }
            },
            { "$unwind": "$userInfo" },

            {
                "$project": {
                    '_id': 1,
                    "categoryName": "$categoryInfo.categoryName",
                    "userName": "$userInfo.email",
                    "userId": 1,
                    "adminId": 1,
                    'status': 1,
                    'createdAt': {
                        '$dateToString': {
                            'format': "%Y-%m-%d %H:%M",
                            'date': "$createdAt"
                        }
                    },
                }
            }
        ])

        console.log("dataxxxxxxxxxxxxxxx",data);
        let respData = {
           // count: count,
            data
        }
        return res.status(200).json({ "success": true, 'result': respData })
    } catch (err) {

        console.log("errrrrrrrrrrrrrrr",err)
        return res.status(500).json({ "success": false, 'errors': { 'messages': 'Error on server' } })
    }
}



export const ticketList = async (req, res) => {

    TicketSupport.aggregate([
        { '$match': { '_id': ObjectId(req.params.ticketId) } },
        {
            "$lookup":
            {
                "from": 'supportCategory',
                "localField": "categoryId",
                "foreignField": "_id",
                "as": "categoryInfo"
            }
        },
         { "$unwind": "$categoryInfo" },

        {
            "$lookup": {
                "from": 'users',
                "localField": "userId",
                "foreignField": "_id",
                "as": "userInfo"
            }
        },
         { "$unwind": "$userInfo" },

        {
            "$lookup": {
                "from": 'admin_users',
                "localField": "adminId",
                "foreignField": "_id",
                "as": "adminInfo"
            }
        },
        { "$unwind": "$adminInfo" },

        {
            "$project": {
                '_id': 1,
                'categoryName': "$categoryInfo.categoryName",
                'status': 1,
                'userName': "$userInfo.email",
                'adminName': "$adminInfo.name",
                'userId': 1,
                 'adminId': 1,
                'createdAt': {
                    '$dateToString': {
                        'format': "%Y-%m-%d %H:%M",
                        'date': "$createdAt"
                    }
                }
            }
        }
    ], (err, data) => {

        if (err) {

            return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
        }
        // if (data.length <= 0) {
        //     console.log("errrrrrrrrrrrrrrrrrrrr",err);
        //     return res.status(400).json({ 'success': false, 'errors': { "messages": "No chart" } })
        // }
        return res.status(200).json({ 'success': true, 'result': data[0] })
    })
}


export const getTicketMessage = (req, res) => {
    let reqQuery = req.query;

    TicketSupport.aggregate([
        {
            "$match": {
                "_id": ObjectId(reqQuery.id),
            }
        },
        { "$unwind": "$reply" },
        {
            "$project": {
                "senderId": "$reply.senderId",
                "receiverId": "$reply.receiverId",
                "message": "$reply.message",
                "messageBy":"$reply.messageBy",
                'createdAt': {
                    '$dateToString': {
                        'format': "%Y-%m-%d %H:%M",
                        'date': "$createdAt"
                    }
                }
            }
        }

    ], (err, ticketData) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
        }
        return res.status(200).json({ 'success': true, 'result': ticketData })
    })
}


export const replyMessage = (req, res) => {
    let reqBody = req.body;

    TicketSupport.findOneAndUpdate(
        { "_id": reqBody.ticketId },
        {
            "$push": {
                "reply": {
                    'senderId': req.user.id,
                    'receiverId': reqBody.receiverId,
                    "message": reqBody.message,
                    "messageBy":reqBody.messageBy
                }
            }
        },
        { "new": true },
        (err, ticketData) => {
            if (err) {
                return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
            }

            ticketData = ticketData.toJSON();
            let result = []
            ticketData.reply.map((item, key) => {
                result.push({
                    ...item,
                    // ...{
                    //     'createdAt': dateTimeFormat(item.createdAt)
                    // }
                })
            })
            return res.status(200).json({ 'success': true, 'result': result })
        }
    )
}

