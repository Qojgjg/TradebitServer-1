// import package
import mongoose from 'mongoose'

// import model
import {
    Staking,
    StakingOrder,
    StakingSettle,
    Assets,
    SiteSetting,
} from '../models';

// import config
import config from '../config';
import { flexibleSettleTask, redemListTask } from '../config/cron';

// import lib
import isEmpty from '../lib/isEmpty';
import { toFixed } from '../lib/roundOf';
import { findBtwDates, dateTimeFormat } from '../lib/dateHelper';
import { interestByDays } from '../lib/calculation';
import { paginationQuery } from '../lib/adminHelpers';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Add Staking
 * URL : /adminapi/staking
 * METHOD : POST
 * BODY : currencyId, minimumAmount, maximumAmount, redemptionPeriod, type, periodList(days,APY), flexibleAPY, status
*/
export const addStaking = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkStake = await Staking.findOne({ "currencyId": reqBody.currencyId });
        if (checkStake) {
            return res.status(400).json({ 'errors': { 'currencyId': 'Staking currency already exists' } });
        }

        let periodList = [];

        if (reqBody.type.some(r => ['fixed'].includes(r))) {
            for (let item of reqBody.periodList) {
                if (!isEmpty(item.days) && !isNaN(item.days) && !isEmpty(item.APY) && !isNaN(item.APY)) {
                    periodList.push(item)
                }
            }

            if (periodList.length == 0) {
                reqBody.type.splice(reqBody.type.indexOf("fixed"), 1);
            }
        }

        const newDoc = new Staking({
            'currencyId': reqBody.currencyId,
            'minimumAmount': reqBody.minimumAmount,
            'maximumAmount': reqBody.maximumAmount,
            'redemptionPeriod': reqBody.redemptionPeriod,
            'type': reqBody.type,
            'flexibleAPY': reqBody.flexibleAPY,
            'periodList': periodList,

        });
        await newDoc.save();
        return res.status(200).json({ 'success': true, 'message': "Staking added successfully" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Edit Staking
 * URL : /adminapi/staking
 * METHOD : GET
*/
export const stakingList = (req, res) => {
    Staking.aggregate([
        { "$sort": { "_id": -1 } },
        {
            "$lookup": {
                "from": 'currency',
                "localField": "currencyId",
                "foreignField": "_id",
                "as": "currencyInfo"
            }
        },
        { "$unwind": "$currencyInfo" },
        {
            "$project": {
                'currencyId': 1,
                'coin': "$currencyInfo.currencySymbol",
                'minimumAmount': 1,
                'maximumAmount': 1,
                'redemptionPeriod': 1,
                'type': 1,
                'flexibleAPY': 1,
                'periodList': 1,
                'status': 1
            }
        }
    ], (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Fetch successfully", 'result': data })
    })
}

/** 
 * Edit Staking
 * URL : /adminapi/staking
 * METHOD : PUT
 * BODY : stakingId, currencyId, minimumAmount, maximumAmount, redemptionPeriod, type(fixed,flexible), flexibleAPY, flexibleAPY, periodList(days,APY)
*/
export const editStaking = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkStake = await Staking.findOne({ "currencyId": reqBody.currencyId, '_id': { "$ne": reqBody.stakingId } });
        if (checkStake) {
            return res.status(400).json({ 'errors': { 'currencyId': 'Staking currency already exists' } });
        }

        let periodList = [];

        if (reqBody.type.some(r => ['fixed'].includes(r))) {
            for (let item of reqBody.periodList) {
                if (!isEmpty(item.days) && !isNaN(item.days) && !isEmpty(item.APY) && !isNaN(item.APY)) {
                    periodList.push(item)
                }
            }

            if (periodList.length == 0) {
                reqBody.type.splice(reqBody.type.indexOf("fixed"), 1);
            }
        }

        let stakingData = await Staking.findOne({ '_id': reqBody.stakingId });
        if (!stakingData) {
            return res.status(400).json({ 'success': false, 'message': "There is no data" })
        }

        stakingData.currencyId = reqBody.currencyId;
        stakingData.minimumAmount = reqBody.minimumAmount;
        stakingData.maximumAmount = reqBody.maximumAmount;
        stakingData.redemptionPeriod = reqBody.redemptionPeriod;
        stakingData.type = reqBody.type;
        stakingData.flexibleAPY = reqBody.flexibleAPY;
        stakingData.periodList = periodList;
        stakingData.status = reqBody.status;

        await stakingData.save();

        return res.status(200).json({ 'success': true, 'message': "Staking updated successfully." })

    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Get Staking 
 * URL : /api/getStaking
 * METHOD : GET
*/
export const getStaking = async (req, res) => {
    Staking.aggregate([
        { "$match": { "status": "active" } },
        {
            "$lookup": {
                "from": 'currency',
                "localField": "currencyId",
                "foreignField": "_id",
                "as": "currencyInfo"
            }
        },
        { "$unwind": "$currencyInfo" },
        {
            "$project": {
                'currencyId': 1,
                'image': {
                    "$cond": [
                        { "$eq": ['$currencyInfo.currencyImage', ''] },
                        "",
                        { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$currencyInfo.currencyImage"] }
                    ]
                },
                'coin': "$currencyInfo.currencySymbol",
                'name': "$currencyInfo.currencyName",
                'flexibleAPY': 1,
                'type': 1,
                'minimumAmount': 1,
                'maximumAmount': 1,
                'redemptionPeriod': 1,
            }
        }
    ], (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Fetch successfully", 'result': data })
    })
}

/**
 * Staking order place
 * URL : /api/stake/orderPlace
 * METHOD : POST
 * BODY : stakeId, type, price, isTerms
*/
export const orderPlace = async (req, res) => {
    try {
        let reqBody = req.body;

        reqBody.price = parseFloat(reqBody.price);

        let stakeData = await Staking.findOne({ '_id': reqBody.stakeId });

        if(parseFloat(stakeData.minimumAmount) > parseFloat(reqBody.price)){
            return res.status(400).json({ 'success': false, 'errors' : { 'price' : 'minimum price is ' + stakeData.minimumAmount } })
        }

        if(parseFloat(stakeData.maximumAmount) < parseFloat(reqBody.price)){
            return res.status(400).json({ 'success': false, 'errors' : { 'price' : 'maximum price is ' + stakeData.maximumAmount } })
        }

        let checkStake = await Staking.findOne({ "_id": reqBody.stakeId }).populate({ "path": "currencyId", "select": "currencySymbol currencyImage currencyName" });

        if (!checkStake) {
            return res.status(400).json({ 'success': false, 'message': "Invalid staking" })
        }

        if (checkStake && !checkStake.currencyId) {
            return res.status(400).json({ 'success': false, 'message': "Invalid currency" })
        }

        if (checkStake.status != 'active') {
            return res.status(400).json({ 'success': false, 'message': "Deactive" })
        }

        let usrAsset = await Assets.findOne({
            userId: req.user.id,
            currency: checkStake.currencyId._id,
          });

        if (!usrAsset) {
            return res.status(400).json({ 'success': false, 'message': "Invalid asset" })
        }

        if (usrAsset.spotwallet < reqBody.price || usrAsset.spotwallet <= 0) {
            return res.status(400).json({ 'success': false, 'message': "There is not enough asset in your balance." })
        }

        usrAsset.spotwallet = usrAsset.spotwallet - reqBody.price;
        await usrAsset.save();

        let nowDate = new Date();
        let orderDate = nowDate.setSeconds(0, 0)
        let nextSettleDate = nowDate.setDate(nowDate.getDate() + checkStake.settlementPeriod)

        let newDoc = new StakingOrder({
            "userId": req.user.id,
            "currencyId": checkStake.currencyId._id,
            "coin": checkStake.currencyId.currencySymbol,
            "stakeId": checkStake._id,
            "amount": reqBody.price,
            "type": reqBody.type,
            "APY": checkStake.flexibleAPY,
            "redemptionPeriod": checkStake.redemptionPeriod,
            "createdAt": orderDate,
            "settlementPeriod": checkStake.settlementPeriod,
            "settleStartDate": orderDate,
            "settleEndDate": nextSettleDate,
            "duration": 365
        })

        let newOrder = await newDoc.save()

        let result = {
            'wallet': {
                'userAssetId': usrAsset._id,
                'spotBal': usrAsset.spotwallet,
            },
            'orderData': {
                'currencyId': newOrder.currencyId,
                'image': `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}${checkStake.currencyId.currencyImage}`,
                'coin': checkStake.currencyId.currencySymbol,
                'name': checkStake.currencyId.currencyName,
                "createdAt": dateTimeFormat(newOrder.createdAt, 'YYYY-MM-DD HH:ss'),
                'APY': newOrder.APY,
                'amount': newOrder.amount,
                'status': newOrder.status,
                '_id': newOrder._id
            }
        }

        return res.status(200).json({ 'success': true, 'message': "Staking order added successfully.", 'result': result })

    } catch (err) {
        console.log("Error---",err)
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Stake order List
 * URL : /api/stake/orderList
 * METHOD : GET
*/
export const orderList = (req, res) => {
    try {
        StakingOrder.aggregate([
            {
                "$match": {
                    "userId": ObjectId(req.user.id),
                    "status": "active"
                }
            },
            { "$sort": { "createdAt": -1 } },
            {
                "$lookup": {
                    "from": 'currency',
                    "localField": "currencyId",
                    "foreignField": "_id",
                    "as": "currencyInfo"
                }
            },
            { "$unwind": "$currencyInfo" },
            {
                "$project": {
                    'currencyId': 1,
                    'image': {
                        "$cond": [
                            { "$eq": ['$currencyInfo.currencyImage', ''] },
                            "",
                            { "$concat": [config.SERVER_URL, config.IMAGE.CURRENCY_URL_PATH, "$currencyInfo.currencyImage"] }
                        ]
                    },
                    'coin': "$currencyInfo.currencySymbol",
                    'name': "$currencyInfo.currencyName",
                    "createdAt": {
                        "$dateToString": {
                            "date": '$createdAt',
                            "format": "%Y-%m-%d %H:%M"
                        }
                    },
                    'APY': 1,
                    'amount': 1,
                    'status': 1
                }
            }
        ], (err, data) => {
            if (err) {
                return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
            }
            return res.status(200).json({ 'success': true, 'message': "Fetch successfully", 'result': data })
        })
    } catch (err) {

    }
}

/** 
 * Stake order Cancel
 * URL : /api/stake/cancel
 * METHOD : DELETE
 * PARAMS : stakeId
*/
export const cancelOrder = async (req, res) => {
    try {
        let stakeOrder = await StakingOrder.findOne({ "_id": req.params.stakeId }).populate({ "path": "currencyId", "select": "currencySymbol currencyImage currencyName" });
        if (!stakeOrder) {
            return res.status(400).json({ 'success': false, 'message': "There is no record" })
        }

        if (["cancel_user", 'cancel_date'].includes(stakeOrder.status)) {
            return res.status(400).json({ 'success': false, 'message': "Already cancelled" })
        }

        if (stakeOrder && !stakeOrder.currencyId) {
            return res.status(400).json({ 'success': false, 'message': "Invalid currency" })
        }

        let nowDate = new Date();
        let orderDate = nowDate.setSeconds(0, 0)
        let nextSettleDate = nowDate.setDate(nowDate.getDate() + stakeOrder.redemptionPeriod)

        stakeOrder.status = 'cancel_user';
        stakeOrder.cancelDate = orderDate;
        stakeOrder.redemDate = nextSettleDate;
        stakeOrder.redemStatus = 'process';

        let getHours = findBtwDates(
            stakeOrder.settleStartDate,
            orderDate,
            'hours'
        )

        let updateOrder = await stakeOrder.save();

        let getDays = Math.floor(getHours / 24)
        let interestPerDay = toFixed(interestByDays(stakeOrder.amount, stakeOrder.APY, 365), 8)

        let newSettlement = new StakingSettle({
            "userId": stakeOrder.userId,
            "currencyId": stakeOrder.currencyId._id,
            "coin": stakeOrder.currencyId.currencySymbol,
            "stakeOrderId": stakeOrder._id,
            "amount": interestPerDay * getDays,
            "days": getDays,
            "type": "interest",
            "settleDate": new Date()
        })

        await newSettlement.save()

       
    await Assets.updateOne(
        {
          userId: stakeOrder.userId,
          currencyId: stakeOrder.currencyId._id,
        },
        {
          $inc: {
            spotwallet: interestPerDay * getDays,
          },
        }
      );

        let result = {
            '_id': updateOrder._id,
            'currencyId': stakeOrder.currencyId._id,
            'image': `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}${stakeOrder.currencyId.currencyImage}`,
            'coin': stakeOrder.currencyId.currencySymbol,
            'name': stakeOrder.currencyId.currencyName,
            "createdAt": dateTimeFormat(updateOrder.createdAt, 'YYYY-MM-DD HH:MM'),
            'APY': updateOrder.APY,
            'amount': updateOrder.amount,
            'status': updateOrder.status
        }

        return res.status(200).json({ 'success': true, 'message': "Cancelled successfully", result })
    } catch (err) {
        console.log(err,'---err')
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Flexible settle list
*/
flexibleSettleTask.start();
export const flexibleSettleList = async () => {
    flexibleSettleTask.stop()
    try {
        let nowDate = new Date();
        nowDate.setSeconds(0, 0)

        let stakingList = await StakingOrder.find({
            "settleEndDate": { "$lte": nowDate },
            "type": { "$in": ["flexible"] },
            "status": { "$in": ["active"] }
        })

        if (stakingList && stakingList.length > 0) {
            await flexibleSettlement(stakingList, 0, nowDate)
            flexibleSettleTask.start()
        } else {
            flexibleSettleTask.start()
        }
    } catch (err) {
        flexibleSettleTask.start()
    }
}

export const flexibleSettlement = async (settlementList, count = 0, nowDate) => {
    try {
        if (isEmpty(settlementList[count])) {
            return true
        }

        let endDate = settlementList[count].settleEndDate;
        let isCancel = false;

        let getHours = findBtwDates(
            settlementList[count].settleStartDate,
            endDate,
            'hours'
        )

        let getDays = Math.floor(getHours / 24)

        if (getDays < 1) {
            return await flexibleSettlement(settlementList, count + 1, nowDate)
        } else if (settlementList[count].status == 'active' && getDays > settlementList[count].duration) {
            getDays = settlementList[count].duration
            isCancel = true;
        }

        let interestPerDay = toFixed(interestByDays(settlementList[count].amount, settlementList[count].APY, 365), 8)

        let newSettlement = new StakingSettle({
            "userId": settlementList[count].userId,
            "currencyId": settlementList[count].currencyId,
            "coin": settlementList[count].currencySymbol,
            "stakeOrderId": settlementList[count]._id,
            "amount": interestPerDay * getDays,
            "days": getDays,
            "type": "interest",
            "settleDate": new Date()
        })

        let startDate = new Date(settlementList[count].settleEndDate);
        let nextSettleDate = startDate.setDate(startDate.getDate() + settlementList[count].settlementPeriod)

        let updateOrder = {
            "settleStartDate": settlementList[count].settleEndDate,
            "settleEndDate": nextSettleDate,
            "duration": settlementList[count].duration - getDays
        }

        if (isCancel) {
            updateOrder['cancelDate'] = nowDate
            updateOrder['status'] = "cancel_date"
        }

        await StakingOrder.updateOne({
            "_id": settlementList[count]._id
        }, { "$set": updateOrder })

        await newSettlement.save()

        // await Wallet.updateOne({
        //     "_id": settlementList[count].userId,
        //     'assets._id': settlementList[count].currencyId
        // }, {
        //     "$inc": {
        //         "assets.$.spotBal": interestPerDay * getDays
        //     }
        // })
        const aseetData = await Assets.updateOne(
            {
              userId: settlementList[count].userId,
              currency: settlementList[count].currencyId,
            },
            {
              $inc: {
                spotwallet: interestPerDay * getDays,
              },
            },
            {
              new: true,
            }
          );

        return await flexibleSettlement(settlementList, count + 1, nowDate)

    } catch (err) {
        return await flexibleSettlement(settlementList, count + 1, nowDate)
    }
}

/** 
 * Redemption Order List
*/
redemListTask.start()
export const redemList = async (nowDate) => {
    redemListTask.stop()
    try {
        let orderList = await StakingOrder.find({
            "redemDate": { "$lte": nowDate },
            "status": { "$in": ["cancel_user", "cancel_date"] },
            "redemStatus": { "$in": ["process"] }
        })

        if (orderList && orderList.length > 0) {
            await redemSettlement(orderList, 0, nowDate)
            redemListTask.start()
        } else {
            redemListTask.start()
        }
    } catch (err) {
        redemListTask.start()
    }
}

export const redemSettlement = async (settlementList, count, nowDate) => {
    try {
        if (isEmpty(settlementList[count])) {
            return true
        }

        let newSettlement = new StakingSettle({
            "userId": settlementList[count].userId,
            "currencyId": settlementList[count].currencyId,
            "coin": settlementList[count].currencySymbol,
            "stakeOrderId": settlementList[count]._id,
            "amount": settlementList[count].amount,
            "days": settlementList[count].redemptionPeriod,
            "type": "redemption",
            "settleDate": nowDate
        })

        await newSettlement.save()

        // await Wallet.updateOne({
        //     "_id": settlementList[count].userId,
        //     'assets._id': settlementList[count].currencyId
        // }, {
        //     "$inc": {
        //         "assets.$.spotBal": settlementList[count].amount
        //     }
        // })
        const assetData = await Assets.updateOne(
            {
              userId: settlementList[count].userId,
              currency: settlementList[count].currencyId,
            },
            {
              $inc: {
                spotwallet: settlementList[count].amount,
              },
            }
          );

        await StakingOrder.updateOne({
            '_id': settlementList[count]._id
        }, {
            "$set": {
                "redemStatus": "completed"
            }
        })

        return await redemSettlement(settlementList, count + 1, nowDate)

    } catch (err) {
        return await redemSettlement(settlementList, count + 1, nowDate)
    }
}

/**
 * Staking Settlement History
 * URL : /api/stake/settleHistory
 * METHOD : GET
 * Query : page, limit
*/
export const getSettleHistory = async (req, res) => {
    try {
        let filter = {
            "userId": ObjectId(req.user.id)
        };
        let pagination = paginationQuery(req.query);

        if (!isEmpty(req.query.coin) && req.query.coin != 'all') {
            filter['coin'] = req.query.coin
        }

        if (!['subscription', 'redemption', 'interest'].includes(req.query.type)) {
            return res.status(200).json({ 'success': true, result: [] })
        }

        let count, data;

        if (['redemption', 'interest'].includes(req.query.type)) {
            filter['type'] = req.query.type;
            count = await StakingSettle.aggregate([
                { "$match": filter },
                {
                    "$lookup": {
                        "from": 'stakingOrder',
                        "localField": "stakeOrderId",
                        "foreignField": "_id",
                        "as": "stakeInfo"
                    }
                },
                { "$unwind": "$stakeInfo" },
            ]);

            data = await StakingSettle.aggregate([
                { "$match": filter },
                { "$sort": { "settleDate": -1 } },
                {
                    "$lookup": {
                        "from": 'stakingOrder',
                        "localField": "stakeOrderId",
                        "foreignField": "_id",
                        "as": "stakeInfo"
                    }
                },
                { "$unwind": "$stakeInfo" },
                {
                    "$project": {
                        "settleDate": {
                            "$dateToString": {
                                "date": '$settleDate',
                                "format": "%Y-%m-%d %H:%M"
                            }
                        },
                        'coin': 1,
                        'stakeAmount': "$stakeInfo.amount",
                        'APY': "$stakeInfo.APY",
                        "amount": 1,
                        "type": 1
                    }
                },
                { "$skip": pagination.skip },
                { "$limit": pagination.limit },
            ])
        } else if (['subscription'].includes(req.query.type)) {
            count = await StakingOrder.aggregate([
                { "$match": filter }
            ]);

            data = await StakingOrder.aggregate([
                { "$match": filter },
                { "$sort": { "createdAt": -1 } },
                {
                    "$project": {
                        "settleDate": {
                            "$dateToString": {
                                "date": '$createdAt',
                                "format": "%Y-%m-%d %H:%M"
                            }
                        },
                        'coin': 1,
                        'stakeAmount': "$amount",
                        'APY': 1,
                        "amount": 1,
                        "type": 1
                    }
                },
                { "$skip": pagination.skip },
                { "$limit": pagination.limit },
            ])
        }

        let result = {
            count: count.length,
            data
        }
        return res.status(200).json({ 'success': true, result })
    } catch (err) {
        return res.status(500).json({ 'success': false })
    }
}

/** 
 * Get Staking Balance Detail
 * URL : /api/stake/balance
 * METHOD : GET
*/
export const getStakeBal = async (req, res) => {
    try {
        const siteSetting = await SiteSetting.findOne({}, { "userDashboard": 1 });
        if (siteSetting) {
            let currencyId = siteSetting.userDashboard.map(item => item.currencyId)

            if (currencyId && currencyId.length > 0) {
                let userAsset = await StakingOrder.find({
                    "userId": req.user.id,
                    "currencyId": { "$in": currencyId }
                }, {
                    '_id': 0,
                    'currencyId': 1,
                    'coin': 1,
                    'amount': 1,
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
                    return res.status(200).json({ 'success': true, 'message': "Fetch success", result })
                }
            }
            return res.status(400).json({ 'success': false, 'message': "no record" })
        }
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Get Dashboard Balance Detail
 * URL : /api/stake/getDashBal
 * METHOD : GET
*/
export const getDashBal = async (req, res) => {
    try {
        const siteSetting = await SiteSetting.findOne({}, { "userDashboard": 1 });
        if (siteSetting) {
            let currencyId = siteSetting.userDashboard.map(item => item.currencyId)
            if (currencyId && currencyId.length > 0) {
                let stakeSettle = await StakingSettle.aggregate([
                    {
                        "$match": {
                            "userId": req.user.id,
                            "type": "interest",
                            "currencyId": { "$in": currencyId },
                        }
                    },
                    {
                        "$project": {
                            'currencyId': 1,
                            'coin': 1,
                            'amount': 1,
                        }
                    },
                    {
                        "$group": {
                            '_id': "$currencyId",
                            'coin': { "$first": "$coin" },
                            'amount': { "$sum": "$amount" }

                        }
                    }
                ])

                if (stakeSettle && stakeSettle.length > 0) {
                    let result = []
                    stakeSettle.map(item => {
                        let findData = siteSetting.userDashboard.find(el => el.currencyId == item._id.toString())
                        if (findData) {
                            result.push({
                                'currencyId': item._id,
                                'coin': item.coin,
                                'amount': item.amount,
                                'colorCode': findData.colorCode
                            })
                        }
                    })
                    return res.status(200).json({ 'success': true, 'message': "Fetch success", result })
                }
            }
            return res.status(400).json({ 'success': false, 'message': "no record" })
        }
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}

/** 
 * Get Dashboard Balance Detail
 * URL : /api/stake/getDashBal
 * METHOD : GET
*/
export const getInterset = async (req, res) => {
    try {
        let stakeSettle = await StakingSettle.aggregate([
            {
                "$match": {
                    "userId": req.user.id,
                    "type": "interest",
                }
            },
            {
                "$project": {
                    'currencyId': 1,
                    'coin': 1,
                    'amount': 1,
                }
            },
            {
                "$group": {
                    '_id': "$currencyId",
                    'coin': { "$first": "$coin" },
                    'amount': { "$sum": "$amount" }

                }
            }
        ])
        console.log("stakeresult---",stakeSettle)
        return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': stakeSettle })
    } catch (err) {
        return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
}