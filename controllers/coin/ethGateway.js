// import package
import axios from 'axios';
import https from 'https';
import converter from 'hex2dec';
import querystring from 'querystring'
import Web3 from "web3";
import mongoose from "mongoose";

// import modal
import Currency from '../../models/currency';
import User from '../../models/User';
import Assets from '../../models/Assets';
import Transaction from '../../models/Transaction';


// import current folder
import { depositEmail } from '../emailTemplate.controller';
import { createNotification } from '../notification.controller';

// import config
import config from '../../config';

// import lib
import isEmpty from '../../lib/isEmpty';
import isJsonParse from '../../lib/isJsonParse';
import { encryptString, decryptString } from '../../lib/cryptoJS';

const web3 = new Web3(config.coinGateway.eth.url);
const ObjectId = mongoose.Types.ObjectId;

export const createAddress = async () => {
    try {
        let respData = await axios({
            'method': 'get',
            'url': `${config.coinGateway.eth.url}/getnewaddress`,
            'timeout': 1000,
        });

        if (respData && respData.status == 200 && !isEmpty(respData.data.data)) {
            const { address, privateKey } = respData.data.data;

            return {
                address,
                privateKey
            }
        } else {
            return {
                address: '',
                privateKey: ''
            }
        }
    }
    catch (err) {
        console.log(err,'----err')
        return {
            address: '',
            privateKey: ''
        }
    }
}


/** 
 * Deposit ETH
*/
export const deposit = async (userId) => {
    try {

          let getUsers = await User.aggregate([
           { "$match": { "_id":ObjectId(userId)}}, 
           {
              "$lookup":{
                 "from": "Assets",
                 "localField": "_id",
                 "foreignField": "userId",
                 "as": "userAssetsInfo"
              }
           },
           {
             "$unwind": "$userAssetsInfo"
           },
           { "$match": { "userAssetsInfo.currencySymbol":"ETH"}},
           {
              "$lookup":{
                 "from": "currency",
                 "localField": "userAssetsInfo.currency",
                 "foreignField": "_id",
                 "as": "currencyInfo"
              }
           },
           {
             "$unwind": "$currencyInfo"
           },
           {
             "$project": {
                "_id":1,
                "email":1,
                "blockNo":"$userAssetsInfo.blockNo",
                "userAssetId": "$userAssetsInfo._id",
                "userId": "$userAssetsInfo.userId",
                "currencySymbol": "$userAssetsInfo.currencySymbol",
                "currencyAddress": "$userAssetsInfo.currencyAddress",
                "privateKey": "$userAssetsInfo.privateKey",
                "currencyId": "$userAssetsInfo.currency",
                // "maximumDeposit": "$currencyInfo.maximumDeposit",
             }
           }
        ])
        // console.log(getUsers,'--***********getUsers')
       let { latestBlockNumber } = await getLatestBlock() 
        for (let x in getUsers) {
            var user = getUsers[x];
            
            // console.log('user',user)
            // console.log('latestBlockNumber',latestBlockNumber)
            var startBlock = config.coinGateway.eth.startBlock;
            let currentBlock = user.blockNo > 0 ? user.blockNo : startBlock;

            let depositUrl = config.coinGateway.eth.ethDepositUrl
                      .replace('##USER_ADDRESS##',user.currencyAddress)
                      .replace('##START_BLOCK##',currentBlock)
                      .replace('##END_BLOCK##',latestBlockNumber);
   
            let respData = await axios({
                  'url': depositUrl,
                  'method': 'post'  
            })
            
            if(respData && respData.data && respData.data.status=="1"){
                for (let y in respData.data.result) {
                  let result = respData.data.result[y];
                  // console.log(result,'----------result')
                  let userAssetData = await Assets.findOne(
                      { 'currencyAddress': {'$regex': new RegExp('.*' + result.to.toLowerCase() + '.*', 'i')},
                        'currencySymbol' : "ETH"
                      })
                    // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetData--------------------')
                    if(userAssetData){
                        // console.log(typeof result.value,'*******************************************')
                      let transactionExist = await Transaction.findOne({
                        txid: result.hash,
                      });

                      if (!transactionExist) {
                        // console.log('*********************')
                        let responseData = await amountMoveToAdmin({
                            toAddress: config.coinGateway.eth.address,
                            privateKey: decryptString(userAssetData.privateKey), 
                            fromAddress: userAssetData.currencyAddress,
                            // amount: result.value/1000000000000000000,
                        })


                        if(responseData && responseData.status){

                           let transaction = new Transaction({
                              userId: userAssetData.userId,
                              currencyId: user.currencyId,
                              fromaddress: result.from,
                              toaddress: result.to,
                              txid: result.hash,
                              currencySymbol: userAssetData.currencySymbol,
                              paymentType: "coin_deposit",
                              amount: result.value/1000000000000000000,
                              status: "completed"
                            });
                           let newTransaction = await transaction.save();
                           userAssetData.spotwallet = userAssetData.spotwallet + result.value/1000000000000000000;
                           userAssetData.blockNo = latestBlockNumber;
                           await userAssetData.save();

                            // depositEmail({
                            //   'email': user.email,
                            //   'amount': result.value/1000000000000000000,
                            //   'currencySymbol': "ETH",
                            //   'hash': result.hash,
                            //   'userId': userAssetData.userId,
                            // })

                            // let notifiObj = {
                            //     description : `${result.value/1000000000000000000} ${userAssetData.currencySymbol} | Completed`,
                            //     userId : userAssetData.userId,
                            //     type : "Deposit",
                            //     url: `${config.FRONT_URL}/wallet`,
                            // }

                            // createNotification(notifiObj)
                        }
                      }
                    }
                }
            }
        }    
    }
    catch (err) {
        console.log("Error on  ethGateway(deposit)",err)
        return
    }
}


/** 
 * Deposit ERC20_TOEKEN
*/
export const ERC20_Deposit = async (userId,currencySymbol) => {
    try {

          let getUsers = await User.aggregate([
           { "$match": { "_id":ObjectId(userId)}}, 
           {
              "$lookup":{
                 "from": "Assets",
                 "localField": "_id",
                 "foreignField": "userId",
                 "as": "userAssetsInfo"
              }
           },
           {
             "$unwind": "$userAssetsInfo"
           },
           { "$match": { "userAssetsInfo.currencySymbol":currencySymbol}},
           {
              "$lookup":{
                 "from": "currency",
                 "localField": "userAssetsInfo.currency",
                 "foreignField": "_id",
                 "as": "currencyInfo"
              }
           },
           {
             "$unwind": "$currencyInfo"
           },
           {
             "$project": {
                "_id":1,
                "blockNo":"$userAssetsInfo.blockNo",
                "userAssetId": "$userAssetsInfo.userId",
                "currencySymbol": "$userAssetsInfo.currencySymbol",
                "currencyAddress": "$userAssetsInfo.currencyAddress",
                "privateKey": "$userAssetsInfo.privateKey",
                "currencyId": "$userAssetsInfo.currency",
                "contractAddress": "$currencyInfo.contractAddress",
                "minABI": "$currencyInfo.minABI",
                "decimals": "$currencyInfo.decimals",
                "maximumDeposit": "$currencyInfo.maximumDeposit",
             }
           }
        ])
        console.log(getUsers,'-----getUsers---->>>')
       let { latestBlockNumber } = await getLatestBlock() 
        for (let x in getUsers) {
            var user = getUsers[x];
            
            // console.log('user',user)
            // console.log('latestBlockNumber',latestBlockNumber)
            var startBlock = config.coinGateway.eth.startBlock;
            let currentBlock = user.blockNo > 0 ? user.blockNo : startBlock;

            let depositUrl = config.coinGateway.eth.ethTokenDepositUrl
                      .replace('##USER_ADDRESS##',user.currencyAddress)
                      .replace('##START_BLOCK##',currentBlock)
                      .replace('##END_BLOCK##',latestBlockNumber);
            // console.log(depositUrl,'depositUrldepositUrl')
            let respData = await axios({
                  'url': depositUrl,
                  'method': 'post'  
            })

            if(respData && respData.data && respData.data.status=="1"){
                for (let y in respData.data.result) {
                  let result = respData.data.result[y];

                  let userAssetData = await Assets.findOne(
                      { 'currencyAddress': {'$regex': new RegExp('.*' + result.to.toLowerCase() + '.*', 'i')},
                        'currencySymbol' : currencySymbol
                      })

                    if(userAssetData){
                        // console.log(result.value,'*******************************************')
                      let transactionExist = await Transaction.findOne({
                        txid: result.hash,
                      });
                      
                      if (!transactionExist) {
                        
                        let responseData = await tokenMoveToAdmin({
                             userPrivateKey: decryptString(userAssetData.privateKey),
                             adminPrivateKey: decryptString(config.coinGateway.eth.privateKey),
                             fromAddress: userAssetData.currencyAddress,
                             toAddress:config.coinGateway.eth.address,
                             minAbi: user.minABI,
                             contractAddress: user.contractAddress,
                             decimals: user.decimals,
                             amount: result.value/10 ** parseInt(user.decimals)
                        })
                        
                        // console.log('*****',responseData)
                      
                        if(responseData && responseData.status){

                           let transaction = new Transaction({
                              userId: userAssetData.userId,
                              currencyId: user.currencyId,
                              fromaddress: result.from,
                              toaddress: result.to,
                              txid: result.hash,
                              currencySymbol: userAssetData.currencySymbol,
                              paymentType: "coin_deposit",
                              amount: result.value/10 ** parseInt(user.decimals),
                              status: "completed"
                            });
                           let newTransaction = await transaction.save();
                           userAssetData.spotwallet = userAssetData.spotwallet + (result.value/10 ** parseInt(user.decimals));
                           userAssetData.blockNo = latestBlockNumber;
                           await userAssetData.save();
                            
                            depositEmail({
                              'email': user.email,
                              'amount': result.value/10 ** parseInt(user.decimals),
                              'currencySymbol': currencySymbol,
                              'hash': result.hash,
                              'userId': userAssetData.userId,
                            })

                            let notifiObj = {
                                description : `${result.value/10 ** parseInt(user.decimals)} ${currencySymbol} | Completed`,
                                userId : userAssetData.userId,
                                type : "Deposit",
                                url: `${config.FRONT_URL}/wallet`,
                            }

                            createNotification(notifiObj)
                        }
                      }
                    }
                }
            }
        }    
    }
    catch (err) {
        console.log("Error on  ethGateway(deposit)",err)
        return
    }
}


export const amountMoveToAdmin = async (data) => {
   try{
       let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.eth.url}/eth-move-to-admin`,
            data
        });

       if(respData && respData.data){
         return respData.data
       }
   }catch(err){

     return {
        status: false,
        message: 'Error on Server'
     }
   }
}

export const tokenMoveToAdmin = async (data) => {
   try{
       let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.eth.url}/erc20-token-move-to-admin`,
            data
        });

       if(respData && respData.data){
         return respData.data
       }
   }catch(err){

     return {
        status: false,
        message: 'Error on Server'
     }
   }
}

export const getLatestBlock = async () => {
    try{
        let respData = await axios({
         'method':'get',
         'url':`${config.coinGateway.eth.url}/getLatestBlock`,
        })
        
        if(respData && respData.data && respData.data.status)
        return {
            latestBlockNumber : respData.data.data
        }

    }catch(err){
        return{
            latestBlockNumber : 0
        }
    }
}


export const getTransactionList = (inc, count, currencyData, transactions = []) => {
    if (inc <= count) {
        let blknum = converter.decToHex(inc.toString());
        let params = config.coinGateway.eth.blockTransaction;
        params['tag'] = blknum;
        params = querystring.stringify(params);
        https.get(config.coinGateway.eth.etherscanUrl + params, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                try {
                    var responseTxn = JSON.parse(data);
                    if (responseTxn.result.transactions.length > 0) {
                        transactions = [...transactions, ...responseTxn.result.transactions]
                        var inc2 = inc + 1;
                        getTransactionList(inc2, count, currencyData, transactions)
                    }
                    else {
                        var inc2 = inc + 1;
                        getTransactionList(inc2, count, currencyData, transactions)
                    }
                }
                catch (err) {
                    var inc2 = inc + 1;
                    getTransactionList(inc2, count, currencyData, transactions)
                }
            });
        }).on("error", (err) => {
            let inc2 = inc + 1;
            getTransactionList(inc2, count, currencyData)
            console.log("Error: " + err.message);
        });
    }
    else {
        return checkCurrency(transactions, count, currencyData);
    }
}

export const checkCurrency = async (response, blockCnt, currencyData) => {
    try {
        let tokenData = await Currency.find({ 'type': 'Token', 'tokenType': 1 })
        if (response) {
            let count = 0
            for (let item of response) {
                count = count + 1
                // Check ERC 20 TOKEN ADDRESS
                if (item.contractAddress) {
                    let checkContractAddress = tokenData && tokenData.length > 0 && tokenData.find((el => { return el.contractAddress.toUpperCase() == item.contractAddress.toUpperCase() }))

                    if (checkContractAddress) {
                        let currencyData = checkContractAddress;
                        await updateTokenDeposit(item, currencyData)
                        // await ethTokenUpdate(item, currencyData)
                    }
                } else {
                    await updateDeposit(item, currencyData)
                }

                if (response.length == count) {
                    await Currency.update({ '_id': currencyData._id }, { "$set": { 'block': blockCnt } })
                }
            }
        } else {
            console.log("No Response ethGateway(checkCurrency)")
            return
        }
    }
    catch (err) {
        console.log("Error on  ethGateway(checkCurrency)")
        return
    }
}

async function updateTokenDeposit(transactionsData, currencyData) {
    try {
        if (isEmpty(transactionsData.to)) {
            console.log("Invalid Address")
            return
        }

        let userAssetData = await Assets.findOne(
            {
                'currencyAddress': {
                    '$regex': new RegExp('.*' + transactionsData.to.toLowerCase() + '.*', 'i')
                }
            }
        ).populate({ path: "userId", select: "email _id" })

        if (userAssetData) {
            // if (userAssetData.currencyAddress.toUpperCase() != keys.ethaddress.toUpperCase()) {
            //     const slashminabii = JSON.parse(currencyData.minABI);
            //     const curminabi = slashminabii.replace(/\\|\//g, '')

            //     token_move_to_admin(
            //         userAssetData.currencyAddress,
            //         userAssetData.privateKey,
            //         keys.ethaddress,
            //         userAssetData.currencyAddress,
            //         userAssetData.userId._id,
            //         currencyData.decimals,
            //         curminabi,
            //         currencyData.contractAddress
            //     );
            // }

            let checkTransactionData = await Transaction.findOne({
                userId: userAssetData.userId._id,
                txid: transactionsData.hash
            })

            if (checkTransactionData) {
                return
            }

            if (transactionsData.tokenDecimal == "1") {
                var recamount = transactionsData.value / 10;
            } else if (transactionsData.tokenDecimal == "6") {
                var recamount = transactionsData.value / 1000000;
            }
            else if (transactionsData.tokenDecimal == "8") {
                var recamount = transactionsData.value / 100000000;
            }

            var currencyfromrespone;
            if (transactionsData.tokenSymbol == "????PC") {
                currencyfromrespone = "💲PC"
            } else {
                currencyfromrespone = transactionsData.tokenSymbol
            }

            var transactions = new Transaction();
            transactions["user_id"] = userAssetData.userId._id;
            transactions["currencyId"] = currencyData._id;
            transactions["fromaddress"] = transactionsData.from;
            transactions["toaddress"] = transactionsData.to;
            transactions["transferType"] = "TOUSER";
            transactions["amount"] = recamount;
            transactions["txid"] = transactionsData.hash;
            transactions["paymentType"] = 1;
            transactions["status"] = 3;

            var incdata = {};
            incdata["spotwallet"] = recamount;
            await transactions.save()

            await Assets.findOneAndUpdate(
                { '_id': userAssetData._id },
                { $inc: incdata },
                { new: true, fields: { balance: 1 } },
            );
            return
        } else {
            return
        }
    }
    catch (err) {
        console.log("Error on  ethGateway(updateDeposit)")
    }
}

export const updateDeposit = async (transactionsData, currencyData) => {
    try {
        if (isEmpty(transactionsData.to)) {
            console.log("Invalid Address")
            return
        }
        let userAssetData = await Assets.findOne(
            {
                'currencyAddress': {
                    '$regex': new RegExp('.*' + transactionsData.to.toLowerCase() + '.*', 'i')
                }
            }
        ).populate({ path: "userId", select: "email _id" })

        if (userAssetData) {
            let respData = await axios({
                'method': 'post',
                'url': `${config.coinGateway.eth.url}/getBalance`,
                data: {
                    'address': userAssetData.currencyAddress,
                }
            });

            if (respData && respData.data) {

                if (userAssetData.currencyAddress.toUpperCase() != config.coinGateway.eth.address.toUpperCase()) {
                    amountMoveToAdmin({
                        'userAddress': userAssetData.currencyAddress,
                        'userPrivateKey': userAssetData.privateKey,
                    });
                }
                const { balance } = respData.data.result;
                if (balance > 0) {

                    let checkTransactionData = await Transaction.findOne({
                        userId: userAssetData.userId._id,
                        txid: transactionsData.hash
                    })
                    if (checkTransactionData) {
                        return
                    }

                    let fromWeiRespData = await axios({
                        'method': 'post',
                        'url': `${config.coinGateway.eth.url}/fromWei`,
                        data: {
                            'balance': transactionsData.value,
                        }
                    });

                    if (fromWeiRespData && fromWeiRespData.data) {
                        const { amount } = fromWeiRespData.data.result;

                        let transactions = new Transaction();
                        transactions["userId"] = userAssetData.userId._id;
                        transactions["currencyId"] = currencyData._id;
                        transactions["fromaddress"] = transactionsData.from;
                        transactions["toaddress"] = transactionsData.to;
                        transactions["transferType"] = "TOUSER";
                        transactions["amount"] = amount;
                        transactions["txid"] = transactionsData.hash;
                        transactions["status"] = 3;
                        transactions["paymentType"] = 1;
                        // transactions["createdAt"] = 1;

                        let newTransactions = await transactions.save();
                        await Assets.updateOne(
                            { "_id": userAssetData._id },
                            {
                                "$inc": {
                                    'spotwallet': amount
                                }
                            }
                        )

                    }
                    return
                } else {
                    console.log("no amount ethGateway(updateDeposit)")
                    return
                }
            } else {
                console.log("Error on getBalance ethGateway(updateDeposit)")
                return
            }
        } else {
            // console.log("No userAssetData ethGateway(updateDeposit)")
            return
        }
    }
    catch (err) {
        console.log("Error on  ethGateway(updateDeposit)")
        return
    }
}

// export const amountMoveToAdmin = async ({ userAddress, userPrivateKey }) => {
//     try {
//         let respData = await axios({
//             'method': 'post',
//             'url': `${config.coinGateway.eth.url}/amountMoveToAdmin`,
//             'data': {
//                 userAddress,
//                 userPrivateKey,
//                 adminAddress: config.coinGateway.eth.address
//             }
//         });

//         if (respData && respData.data) {
//             console.log("Success ON amountMoveToAdmin")
//             return
//         } else {
//             console.log("FAILED ON amountMoveToAdmin")
//             return
//         }
//     }
//     catch (err) {
//         console.log("ERRON ON amountMoveToAdmin", err)
//         return
//     }
// }

export const amountMoveToUser = async (data) => {
    try {

        let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.eth.url}/eth-move-to-user`,
            data
        });
        if (respData && respData.status == 200) {
            return {
                'status': true,
                'data': respData.data.data
            }
        } else {
            return {
                status: false,
                message: "Some error"
            }
        }
    }
    catch (err) {
        return {
            status: false,
            message: err.response.data.message
        }
    }
}

export const tokenMoveToUser = async (data) => {
    try {
        let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.eth.url}/erc20-token-move-to-user`,
             data
        });
        if (respData && respData.status == 200) {
            return {
                status: true,
                data: respData.data.data
            }
        } else {
            return {
                status: false,
                message: "Some error"
            }
        }
    } catch (err) {
        return {
            status: false,
            message: err.response.data.message
        }
    }
}

// async function example(){
//    let currencyData = await Currency.find({});
//    // console.log(currencyData[i].currencySymbol,'------------')
//    for(let i=0;i<currencyData.length;i++){
//      let data = await Assets.findOneAndUpdate(
//         {userId:ObjectId("61cc2578f175fe299929e3f4"),currencySymbol:currencyData[i].currencySymbol},
//         {$set:{currencyAddress:"",privateKey:""}},
//         {new:true}
//     )
//      console.log(data,'------------')
//    }
// }

// example();