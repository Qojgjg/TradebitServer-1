// import package
import node2fa from 'node-2fa';
import mongoose from 'mongoose';
// import controller
import { mailTemplateLang } from './emailTemplate.controller';
import * as ethGateway from './coin/ethGateway';
import randomize from 'randomize'
// import modal
import {
    SupportCategory,
    SupportTicket,
    User,
    Admin
} from '../models'
import TicketSupport from '../models/ticketSupports';
import { mailTemplate } from './emailTemplate.controller';
// import lib
import { IncCntObjId } from '../lib/generalFun';
import {
    paginationQuery,
    filterQuery,
    filterProofQuery,
    filterSearchQuery
} from '../lib/adminHelpers';
// import key from '../lib/config';
import { dateTimeFormat } from '../lib/dateHelper';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Add Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : POST
 * BODY : categoryName
*/
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

/** 
 * Edit Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : PUT
 * BODY : categoryName, status, categoryId
*/
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
        await SupportCategory.updateOne(
            { "_id": reqBody.categoryId },
            {
                "$set": {
                    "categoryName": reqBody.categoryName,
                    'status': reqBody.status
                }
            }
        )
        return res.status(200).json({ "success": false, 'result': { 'messages': "update successfully" } })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    }
}

/** 
 * Get Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : GET
*/
export const getSupportCategory = (req, res) => {
    SupportCategory.find({}, { 'categoryName': 1, 'status': 1 }, (err, categoryData) => {
        if (err) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        return res.status(200).json({ "success": true, 'result': { 'data': categoryData } })
    })
}

/** 
 * Get Support Category for drop down
 * URL: /api/getSptCat
 * METHOD : GET
*/
export const getSptCat = (req, res) => {
    TicketSupport.find({userId:req.user.id, 'categorySubject':{ $ne: null}}, (err, categoryData) => {
        if (err) {
            
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        else{
            console.log("Result----",categoryData);
        return res.status(200).json({ "success": true, 'result': { 'data': categoryData } })
        }
    })
     
}

/** 
 * Get Single Support Cateogory
 * URL: /adminapi/getSingleSupportCategory
 * METHOD : GET
 * PARAMS : categoryId
*/
export const getSingleSupportCategory = (req, res) => {
    SupportCategory.findOne({ '_id': req.params.categoryId }, { 'categoryName': 1 }, (err, categoryData) => {
        if (err) {
            return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
        }
        return res.status(200).json({ "success": true, 'result': categoryData })
    })
}

/** 
 * Create New Ticket
 * URL: /api/ticket
 * METHOD : POST
 * BODY : categoryId, message
*/
export const createNewTicket = async (req, res) => {
    try {
       
          let reqBody = req.body;
          console.log("Ticket Data------",req.body);
          let adminDetail = await Admin.findOne();
          if (!adminDetail) {
              return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
          }
          let checkSubject =await TicketSupport.findOne({'categorySubject':reqBody.categorySubject})
          if(checkSubject)
          {
          return res.status(400).json({ 'success': false,'errors': {"messages": "Ticket Subject already exists" }} )
          }
          else{
           
            
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
          }
      } catch (err) {
          console.log("errrrrrrrrrrrr----------------",err);
          return res.status(500).json({ 'success': false, 'errors': { "messages": "Error on server" } })
      }
}

export const userCatTicketList = async (req, res) => {
    try {
        TicketSupport.find({userId:req.user.id,categorySubject:req.body.categorySubject}, (err, data) => {

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
    catch (err) {
        return res.status(500).json({ 'success': false, "message": "Error on server" })
    }
}

/** 
 * User Ticket List
 * URL: /api/ticket
 * METHOD : GET
*/
export const userTicketList = async (req, res) => {
    try {
        // let userData = await User.findOne({ "_id": req.user.id }, {
        //     "_id": 1,
        //     "firstName": 1
        // })
        // if (userData) {

        //     let adminData = await Admin.findOne({ "role": "superadmin" }, {
        //         "_id": 1,
        //         "name": 1
        //     })

        //     if (adminData) {
        //         let tickerData = await TicketSupport.aggregate([
        //             { '$match': { 'userId': ObjectId(req.user.id) } },
        //             {
        //                 "$lookup": {
        //                     "from": 'supportcategory',
        //                     "localField": "categoryId",
        //                     "foreignField": "_id",
        //                     "as": "categoryInfo"
        //                 }
        //             },
        //             { "$unwind": "$categoryInfo" },

        //             {
        //                 "$project": {
        //                     '_id': 1,
        //                     'categoryName': "$categoryInfo.categoryName",
        //                     'tickerId': 1,
        //                     'status': 1,
        //                     'userId': 1,
        //                     'adminId': 1,
        //                     'reply': 1,
        //                     'createdAt': 1
        //                 }
        //             }
        //         ])

        //         if (tickerData) {
        //             let result = {
        //                 'ticketList': tickerData,
        //                 'sender': userData,
        //                 'receiver': adminData
        //             }
        //             return res.status(200).json({ 'success': true, result })
        //         }
        //     }
        // }
        
        // return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
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
    catch (err) {
        return res.status(500).json({ 'success': false, "message": "Error on server" })
    }
}

/** 
 * User Reply Message
 * URL: /api/ticket
 * METHOD : PUT
 * BODY : ticketId, receiverId, message
*/
export const usrReplyMsg = (req, res) => {
    let reqBody = req.body;
    SupportTicket.findOneAndUpdate(
        {
            "_id": reqBody.ticketId,
            "userId": req.user.id,
            "adminId": reqBody.receiverId,
        },
        {
            "$push": {
                "reply": {
                    'senderId': req.user.id,
                    'receiverId': reqBody.receiverId,
                    "message": reqBody.message
                }
            }
        },
        { "new": true },
        (err, ticketData) => {
            if (err) {
                return res.status(500).json({ 'success': false, "message": "Something went wrong" })
            } else if (!ticketData) {
                return res.status(400).json({ 'success': false, "message": "No records" })
            }

            return res.status(200).json({ 'success': true, "message": 'Successfully reply the message', 'result': ticketData.reply })
        }
    )
}

/** 
 * Closed Ticket
 * URL: /api/ticket
 * METHOD : PATCH
 * BODY: ticketId
*/
export const closeTicket = (req, res) => {
    let reqBody = req.body;

    TicketSupport.findOneAndUpdate(
        {
            "_id": reqBody.ticketId,
            "userId": req.user.id
        },
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
                return res.status(500).json({ 'success': false, 'message': "SOMETHING_WRONG" })
            } else if (!ticketData) {
                return res.status(400).json({ 'success': false, 'message': "NO_DATA" })
            }
            return res.status(200).json({ 'success': true, 'message': "Ticket closed successfully", 'result': ticketData })
        }
    )
}


/** 
 * Get Ticket Message List
 * URL: adminapi/ticketMessage
 * METHOD : GET
 * QUERY: ticketId
*/
export const getTicketMessage = (req, res) => {
    let reqQuery = req.query;
    TicketSupport.aggregate([
        {
            "$match": {
                "_id": ObjectId(reqQuery.ticketId),
                "adminId": req.user.id
            }
        },
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
                "from": 'admins',
                "localField": "adminId",
                "foreignField": "_id",
                "as": "adminInfo"
            }
        },
        { "$unwind": "$adminInfo" },
        {
            "$project": {
                "userId": 1,
                "userName": "$userInfo.firstName",
                "adminId": 1,
                "adminName": "$adminInfo.name",
                "tickerId": 1,
                "reply": 1,
                "status": 1
            }
        }

    ], (err, ticketData) => {
        if (err) {
            return res.status(500).json({ 'success': false, "message": "Error on server" })
        } else if (ticketData && ticketData.length > 0) {
            return res.status(200).json({ 'success': true, 'result': ticketData[0] })
        }
        return res.status(400).json({ 'success': false, "message": "NO_DATA" })
    })
}

/** 
 * Admin Reply Message
 * URL: /adminapi/ticketMessage
 * METHOD : PUT
 * BODY : ticketId, receiverId, message
*/
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
            const userData=User.findOne({"_id":reqBody.receiverId})
            var email=userData.email;
            var role=userData.role;
            if(userData && role=="user"){
            let content = {
                'date': supportData._id
            };
        
            mailTemplateLang({
                'userId': reqBody.receiverId,
                'identifier': 'support_ticket_reply',
                'toEmail': email,
                content
            })
            let description="Received Reply message for your Support Ticket";
      
            let newNotification = new Notification({
                'description': description,
                'userId': reqBody.receiverId,
                'type':"General",
                'category': "Support Ticket",
                
            });
           newNotification.save();
        }
            return res.status(200).json({ 'success': true, 'result': result })
        }
    )
}

/** 
 * Get Overall Ticket List
 * URL: /adminapi/ticketList
 * METHOD : GET
*/
export const getTicketList = async (req, res) => {
    try {
        TicketSupport.find({}).populate("userId", "email").then((result)=>{
            if(result){
            console.log("User tickets---",result)
            return res.status(200).json({ 'success': true, 'message': 'Fetch successfully', 'result': result })
            }
             })
    } catch (err) {
        return res.status(500).json({ "success": false, 'errors': { 'messages': 'Error on server' } })
    }
}

/** 
 * Ticket List
 * URL: /adminapi/ticketList
 * METHOD : POST
*/
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
                "from": 'admins',
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
                'userName': "$userInfo.firstName",
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
        if (data.length <= 0) {
            return res.status(400).json({ 'success': false, 'errors': { "messages": "No chart" } })
        }
        return res.status(200).json({ 'success': true, 'result': data[0] })
    })
}


export const getticketList = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['email', 'categorySubject', 'status']);

        let count = await TicketSupport.aggregate([
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
                    "email": "$userInfo.email",
                    "userId": 1,
                    "categorySubject":1,
                    "status":1,
                    "createdAt":1
                }
            },
            { "$match": filter },
        ])

        let data = await TicketSupport.aggregate([

            { "$sort": { "_id": -1 } },

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
                    "email": "$userInfo.email",
                    "userId": 1,
                    "categorySubject":1,
                    "status":1,
                    "createdAt":1
                }
            },
            { "$match": filter },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
        ])
        let alldata=await TicketSupport.find({})
        let result = {
            data,
            count: count.length,
            alldata
        }

        return res.status(200).json({ "success": true, result })
    }
    catch (err) {
        return res.status(500).json({ 'success': false })
    }
}
