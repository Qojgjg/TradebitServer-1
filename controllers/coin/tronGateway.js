import TronWeb from "tronweb"
import axios from "axios"

import config from "../../config";
import { encryptString, decryptString } from '../../lib/cryptoJS'
import isEmpty from "../../lib/isEmpty";

//Modals
import { Assets, Transaction, Currency } from '../../models'

// import current folder
import { depositEmail } from '../emailTemplate.controller';
import { createNotification } from '../notification.controller';

// tron config
const HttpProvider = TronWeb.providers.HttpProvider,
    fullNode = new HttpProvider(config.coinGateway.tron.fullNode),
    solidityNode = new HttpProvider(config.coinGateway.tron.solidityNode),
    eventServer = new HttpProvider(config.coinGateway.tron.eventServer);


// const privateKey = "3269CC93504FA54485A66C0BC9F8A160B95AD40212E7A35A5483BC3AF7FB40AD";
// const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

/** 
 * Create Tron User
*/
export const createAddress = async () => {
    let responseData = {
        "privateKey": '',
        "address": ''
    }
    try {
        let tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
        let createAccount = await tronWeb.createAccount()
        responseData['privateKey'] = createAccount.privateKey;
        responseData['address'] = createAccount.address.base58;
        return responseData;
    }
    catch (err) {
        return responseData;
    }
}

export const tronDeposit = async ( userId) => {
    try {
        
        
        let userAssetData = await Assets.findOne({ 'userId': userId, 'currencySymbol': "TRX" }).populate("userId").populate('currency',['maximumDeposit'])
       
        if (!userAssetData) {
            // return res.status(500).json({ "messages": "user assets not found" })
        }

        let checkBalance = await getAccountBalance(userAssetData.currencyAddress);
        checkBalance = checkBalance / config.coinGateway.tron.tronDecimal;
        
        // if ((checkBalance > 0) && (userAssetData && userAssetData.currency && userAssetData.currency.maximumDeposit >= checkBalance)) {
        if (checkBalance > 0){ 
            let transactionURL = config.coinGateway.tron.transactionUrl;
            transactionURL = transactionURL.replace(/##USER_ADDRESS##/gi, userAssetData.currencyAddress)

            let respData = await axios({
                'method': 'get',
                'url': transactionURL
            });

            if (respData.data.success == true && respData.data.data && respData.data.data.length > 0) {
                createTransaction({
                    'userId': userId,
                    'tronData': respData.data.data,
                    userAssetData
                })
            }

            // if (userAssetData.currencyAddress != adminAssetData.currencyAddress) {
            //     // let decrypted = CryptoJS.AES.decrypt(keys.tronConfig.privateKey, keys.cryptoPass);
            //     userAmountMoveToAdmin({
            //         'adminUserId': adminUserData._id,
            //         'privateKey': userAssetData.privateKey,
            //         'amount': checkBalance,
            //         'adminCurrencyAddress': adminAssetData.currencyAddress,
            //         'userCurrencyAddress': userAssetData.currencyAddress
            //     })
            // }
        }

        //return res.status(200).json({ "messages": "success" })
    }
    catch (err) {
        console.log(err,'----errerr')
        //return res.status(500).json({ "messages": "Error" })
    }
}

export const tronTokenDeposit = async (userId,currencySymbol) => {
    try {
     console.log('************* TRC20 DEPOSIT ****************')
        let currencyData = await Currency.findOne({"currencySymbol":currencySymbol,"tokenType":"trc20"})
        // console.log(currencyData,"currencyDatacurrencyData")
        if (!currencyData) {
            // return res.status(500).json({ "messages": "currency not found" })
            return { "messages": "currency not found" }
        }


        let userAssetData = await Assets.findOne({ 'userId': userId, 'currencySymbol': currencySymbol,'currency':currencyData._id }).populate("userId")        
   
        // let userPrivateKey = decryptString(userAssetData.privateKey)
        // let adminPrivateKey = decryptString(keys.coinGateway.tron.privateKey)
        // console.log(userPrivateKey,'userPrivateKey',adminPrivateKey,'adminPrivateKey')
        let checkBalance = await getContractBalance({
            "privateKey": decryptString(userAssetData.privateKey),
            "address": userAssetData.currencyAddress,
            "currencycontract": currencyData.contractAddress,
            "decimals": currencyData.decimals,
        });

        // console.log("----checkBalance--Token", checkBalance)
        // // console.log("----userPrivateKey", userPrivateKey)
        if (checkBalance > 0 /*&& currencyData.maximumDeposit >= checkBalance*/) {

            let transactionURL = config.coinGateway.tron.transactionContractUrl;
            transactionURL = transactionURL.replace(/##USER_ADDRESS##/gi, userAssetData.currencyAddress)
            transactionURL = transactionURL.replace(/##CONTRACT_ADDRESS##/gi, currencyData.contractAddress)

            let respData = await axios({
                'method': 'get',
                'url': transactionURL
            });
            console.log(respData.data.data,'---respData.data.data')
            if (respData.data.success == true && respData.data.data && respData.data.data.length > 0) {
               // console.log('*********************************************************')
                createTokenTrx({
                    'email': userAssetData.userId.email,
                    'userId': userId,
                    'tronData': respData.data.data,
                    'adminCurrencyAddress': config.coinGateway.tron.address,
                    'userCurrencyAddress': userAssetData.currencyAddress,
                    'currency': currencyData.currencySymbol,
                    'currencyId': currencyData._id,
                    'decimals': currencyData.decimals,
                    currencyData
                })
            }

            if (userAssetData.currencyAddress != config.coinGateway.tron.address) {
                // console.log("ADDfdfdlfjdlfdlfdfmin")
                adminSentUser({
                    //'adminUserId': adminUserData._id,
                    'userId': userId,
                    'privateKey': decryptString(userAssetData.privateKey),
                    'adminPrivateKey': decryptString(config.coinGateway.tron.privateKey),
                    'amount': checkBalance,
                    'adminCurrencyAddress': config.coinGateway.tron.address,
                    'userCurrencyAddress': userAssetData.currencyAddress,
                    'currency': currencyData.currencySymbol,
                    'currencyId': currencyData._id,
                    "contractAddress":currencyData.contractAddress,
                    "decimals":currencyData.decimals,
                    currencyData
                })

            }
        }

        // return res.status(200).json({ "messages": "success" })
    }
    catch (err) {
        console.log("---err", err)
        // return res.status(500).json({ "messages": "Error" })
        return { "messages": "Error" };
    }
}



const getContractBalance = async ({ currencycontract, privateKey, address, decimals }) => {
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    try {
        // console.log(currencycontract,'currencycontract',privateKey,'privateKey',address,'address',decimals,'decimals',typeof decimals,'typeofdecimals')
        let accountDetail = await tronWeb.contract().at(currencycontract);
        let result = await accountDetail.balanceOf(address).call();
        // console.log(result,'----result')
        return JSON.parse(result) / 10**parseInt(decimals);
    }
    catch (err) {
        // console.log("---TokenBalanceErr", err)
        return 0;
    }
}


export const getAccountBalance = async (address) => {
    try {
        let tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
        let accountDetail = await tronWeb.trx.getBalance(address)
        // console.log("----accountDetail---", address, accountDetail)
        return accountDetail;
    }
    catch (err) {
        return 0
    }
}

const convertToBaseAddress = async (address) => {
    let tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
    try {
        let baseAddress = await tronWeb.address.fromHex(address);
        return baseAddress
    }
    catch (err) {
        return ''
    }
}

const createTokenTrx = async ({ email, userId, tronData, adminCurrencyAddress, userCurrencyAddress, currency,currencyId,decimals, currencyData }) => {
    try {
        for (let item of tronData) {
          if(currencyData){  
            if (item && item.to.toString() == userCurrencyAddress) {
              // console.log(item.value,'--------item.value')
              // console.log(decimals,'--------decimals')
                let txid = item.transaction_id,
                    amount = item.value / 10**decimals;
                let transactionData = await Transaction.findOne({ userId: userId, txid })
                // console.log(transactionData,'----transactionData')
                if (!transactionData) {
                    let transactions = new Transaction();

                    transactions["userId"] = userId;
                    transactions["currencySymbol"] = currency;
                    transactions["toaddress"] = item.to;
                    transactions["fromaddress"] = item.from;
                    transactions["amount"] = amount;
                    transactions["txid"] = txid;
                    transactions["currencyId"] = currencyId;
                    transactions["paymentType"] = "coin_deposit";
                    transactions["status"] = "completed";

                    await transactions.save();

                    if (adminCurrencyAddress != userCurrencyAddress) {
                        let data = await Assets.findOneAndUpdate(
                            { 'userId': userId, 'currency': currencyId },
                            {
                                $inc: {
                                    'spotwallet': amount
                                }
                            },
                            {
                                new: true,
                                fields: { balance: 1 }
                            },
                        )
                        
                        // depositEmail({
                        //   'email': email,
                        //   'amount': amount,
                        //   'currencySymbol': currency,
                        //   'hash': txid,
                        //   'userId': userId,
                        // })

                        let notifiObj = {
                            description : `${amount} ${currency} | Completed`,
                            userId : userId,
                            type : "Deposit",
                            url: `${config.FRONT_URL}/wallet`,
                        }

                        // createNotification(notifiObj)

                    }
                }
            }
          }  
        }
    }
    catch (err) {
        console.log("-----err", err)
        return false
    }
}



const adminSentUser = async ({ privateKey, adminPrivateKey, adminCurrencyAddress, userCurrencyAddress, amount, currency, currencyId, userId,contractAddress,decimals }) => {
    try {

        // console.log("-----adminCurrencyAddress", adminCurrencyAddress)
        // console.log("-----userCurrencyAddress", userCurrencyAddress)
        // console.log("-----decimals", decimals)
        
        // var str = "1e" + decimal;
        //     const decimalVal = 1 * str;
        let userTronBalance = await getAccountBalance(userCurrencyAddress);
        // console.log("-----userTronBalance",userTronBalance,config.coinGateway.tron.adminAmtSentToUser * config.coinGateway.tron.tronDecimal)
        // console.log("-----******",config.coinGateway.tron.adminAmtSentToUser)
        // return
            // userTronBalance > (keys.coinGateway.tron.adminAmtSentToUser * keys.coinGateway.tron.decimal
        if (userTronBalance > 0 && userTronBalance > (config.coinGateway.tron.adminAmtSentToUser * config.coinGateway.tron.tronDecimal)) {
            // console.log('--------------2222222222222222--------------------------')
            // userTokenAmountMoveToAdmin({ adminUserId, privateKey, adminPrivateKey, adminCurrencyAddress, userCurrencyAddress, amount, currency, currencyId, userId, 'checkTransaction': false })

            userTokenMoveToAdmin({
                contractAddress, privateKey, adminCurrencyAddress, userCurrencyAddress, amount, decimals
            })

        } else {
            // console.log('--------------11111111111111111--------------------------')
            // checkTransaction
            let adminSentUserTrxId = await sentTransaction({
                'fromAddress': adminCurrencyAddress,
                'toAddress': userCurrencyAddress,
                'privateKey': adminPrivateKey,
                'amount': config.coinGateway.tron.adminAmtSentToUser,
                // 'decimal':decimals,
            })

            // console.log("-----adminSentUserTrxId", adminSentUserTrxId)

            // userTokenMoveToAdmin({
            //     adminUserId, privateKey, adminCurrencyAddress, userCurrencyAddress, amount, currency, currencyId
            // })

            // userTokenAmountMoveToAdmin({ adminUserId, privateKey, adminPrivateKey, adminCurrencyAddress, userCurrencyAddress, amount, currency, currencyId, userId, 'trxId': adminSentUserTrxId, 'count': 0 })
        }
    } catch (err) {
        console.log(err,'------------errr')
        return false
    }
}


const userTokenMoveToAdmin = async ({ contractAddress, privateKey, adminCurrencyAddress, userCurrencyAddress, amount, decimals }) => {
    try {

        let userTrokenSentAdminTrxId = await sendToaddressContract({
            'currencycontract': contractAddress,
            'toAddress': adminCurrencyAddress,
            'privateKey': privateKey,
            'fromAddress': userCurrencyAddress,
            'amount': amount,
            'decimals': decimals,
        })

        // console.log("----userTrokenSentAdminTrxId---", userTrokenSentAdminTrxId)

        if (!userTrokenSentAdminTrxId) {
            return false
        }

        
        return true

    }
    catch (err) {
        console.log("------userTokenMoveToAdmin", err)
        return false
    }
}



const sendToaddressContract = async ({ currencycontract, fromAddress, toAddress, privateKey, amount, decimals }) => {

    let tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    try {
        let balance = await getContractBalance({ currencycontract, 'address': fromAddress, privateKey, decimals });

        // console.log("-----balance", balance)
        // console.log("-----amount", amount)
        // console.log("-----fromAddress", fromAddress)
        // console.log("-----toAddress", toAddress)
        // console.log("-----privateKey", privateKey)
        // console.log("-----currencycontract", currencycontract)


        if (balance >= amount) {
            var value = await tronWeb.toBigNumber(amount * (10**decimals));
            let contract = await tronWeb.contract().at(currencycontract);
            // console.log(value,amount,decimals,currencycontract,toAddress,value.toString(10),'********************************')
            let transaction = await contract.transfer(
                toAddress, //address _to
                value.toString(10)  //amount
            ).send({
                feeLimit: 1000000000
            });

            // console.log("----Token Send TXHASH Id", transaction)
            return transaction
        }
        return false

    } catch (err) {
        console.log("---sendToaddressContract", err)
        return false
    }
}

const createTransaction = async ({ userId, tronData, userAssetData }) => {
    try {
        for (let item of tronData) {
            let txid = item.txID,
                amount = item.raw_data.contract[0].parameter.value.amount / config.coinGateway.tron.tronDecimal;

            if (item.raw_data.contract[0].type == 'TransferContract') {
                let transactionData = await Transaction.findOne({ userId: userId, txid })
                if (!transactionData) {
                           
                    let { status, txHash } =  await sentTransaction({
                         fromAddress: userAssetData.currencyAddress, 
                         toAddress: config.coinGateway.tron.address, 
                         privateKey: decryptString(userAssetData.privateKey), 
                         amount
                    })

                    if(status){
                        let transactions = new Transaction();

                        transactions["userId"] = userId;
                        transactions["currencySymbol"] = "TRX";
                        transactions["toaddress"] = await convertToBaseAddress(item.raw_data.contract[0].parameter.value.to_address);
                        transactions["fromaddress"] = await convertToBaseAddress(item.raw_data.contract[0].parameter.value.owner_address);
                        transactions["amount"] = amount;
                        transactions["txid"] = txid;
                        transactions["currencyId"] = userAssetData.currency && userAssetData.currency._id;
                        transactions["paymentType"] = "coin_deposit";
                        transactions["status"] = "completed";

                        await transactions.save();
                        userAssetData.spotwallet = userAssetData.spotwallet + amount;
                        await userAssetData.save();

                        depositEmail({
                          'email': userAssetData.userId.email,
                          'amount': amount,
                          'currencySymbol': "TRX",
                          'hash': txid,
                          'userId': userId,
                        })

                        let notifiObj = {
                            description : `${amount} TRX | Completed`,
                            userId : userId,
                            type : "Deposit",
                            url: `${config.FRONT_URL}/wallet`,
                        }

                        createNotification(notifiObj)
                    }
                }
            }
        }
    }
    catch (err) {
        console.log(err,'------err')
        return false
    }
}

const convertToHex = async (address) => {
    let tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
    try {
        let hexAddress = await tronWeb.address.toHex(address)
        return hexAddress
    }
    catch (err) {
        return ''
    }
}




// only for the TRX
export const sentTransaction = async ({ fromAddress, toAddress, privateKey, amount }) => {

    const tronWeb = new TronWeb({
        fullHost: config.coinGateway.tron.fullNode,
        privateKey
    });

    let fromAddressBalance = await getAccountBalance(fromAddress);
    let transferAmount = amount * config.coinGateway.tron.tronDecimal;

    // console.log("------------fromAddress", fromAddress)
    // console.log("------------fromAddressBalance", fromAddressBalance)
    // console.log("------------transferAmount", transferAmount)



    if (fromAddressBalance < transferAmount) {
        console.log("Insufficient balance-----")
        // return false
        return {
             status : false,
             message: "Insufficient TRX Balance"
        }
    }

    let fromAddressHex = await convertToHex(fromAddress);
    let toAddressHex = await convertToHex(toAddress);

    // console.log("----fromAddressHex", fromAddressHex)
    // console.log("----toAddressHex", toAddressHex)

    try {
        let accountDetail = await tronWeb.transactionBuilder.sendTrx(toAddressHex, transferAmount, fromAddressHex);
        let signedTx = await tronWeb.trx.sign(accountDetail)
        // console.log("----signedTx", signedTx)
        let broastTx = await tronWeb.trx.sendRawTransaction(signedTx)
         // console.log(broastTx,'----broastTx')
        // return broastTx.txid;
        return {
             status : true,
             txHash : broastTx.txid
        }
    }
    catch (err) {
        console.log("---sentTransaction", err)
        return false
    }
}


// TRC20 Token Withdraw

export const tokenMoveToUser = async ({ currencycontract, fromAddress, toAddress, privateKey, amount, decimals }) => {

    let tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    try {
        let balance = await getContractBalance({ currencycontract, 'address': fromAddress, privateKey, decimals });

        console.log("-----balance", balance)
        console.log("-----amount", amount)
        console.log("-----fromAddress", fromAddress)
        console.log("-----toAddress", toAddress)
        console.log("-----privateKey", privateKey)
        console.log("-----currencycontract", currencycontract)


        if (balance >= amount) {
            var value = await tronWeb.toBigNumber(amount * (10**decimals));
            let contract = await tronWeb.contract().at(currencycontract);
            console.log(value,amount,decimals,currencycontract,toAddress,value.toString(10),'********************************')
            let transaction = await contract.transfer(
                toAddress, //address _to
                value.toString(10)  //amount
            ).send({
                feeLimit: 1000000000
            });

            console.log("----Token Send TXHASH Id", transaction)
            return {
                status : true,
                message : "Transaction successfully",
                trxId:transaction
            }
        }
        return {
            status : false,
            message : "Transaction Failed",
        }

    } catch (err) {
        console.log("---sendToaddressContract", err)
        return {
            status : false,
            message : "Error on Occured",
        }
    }
}

// async function sentToken() {
//      let data = await sendToaddressContract({
//         currencycontract : 'TCMRiv3oegmXX9TGeycv1UJ8YxFfZZV9Td',
//         fromAddress : config.coinGateway.tron.address,
//         toAddress : "TX4WjfSdWfvm6WUd8CRGzXr2R3P956QiYa",
//         privateKey : decryptString(config.coinGateway.tron.privateKey),
//         amount : 1,
//         decimals : 18,
//      })

//      console.log(data,'----------------------------dataaaaaa')
// }

// sentToken()

// async function checkTokenBal() {
//     let checkBalance = await getContractBalance({
//         "privateKey": decryptString('U2FsdGVkX19lrJUMUsm5X4DE0iZfGEwEUs46bZrB6B1lmIN6EDKW/Zb9leIQGWmIj8zLzQU/uoq+GlySNb+j8EqbOMuPkzYMOf277BxM8W2Lenf459WSxgDhGcLzWwVz'),
//         "address": 'TQkHKHXBpAmkgCzyxfdqcUrFsTbE2Jq1Ag',
//         "currencycontract": 'TCMRiv3oegmXX9TGeycv1UJ8YxFfZZV9Td',
//         "decimals": '18',
//     });

//     console.log("----checkBalance--Token", checkBalance)
// }

// checkTokenBal()

