// import package
import axios from "axios";
import https from "https";
import converter from "hex2dec";
import querystring from "querystring";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import mongoose from "mongoose";

// import modal
import Currency from "../../models/currency";
import User from "../../models/User";
import Assets from "../../models/Assets";
import TransactionDB from "../../models/Transaction";

// import config
import config from "../../config/index";

// import lib
import { encryptString, decryptString } from '../../lib/cryptoJS'
import isEmpty from "../../lib/isEmpty";
// import isJsonParse from "../../lib/isJsonParse";

const web3 = new Web3(config.coinGateway.bnb.url);
const ObjectId = mongoose.Types.ObjectId;

export const createAddress = async () => {
    let account = await web3.eth.accounts.create();

    return account;
}


export const deposit = async (userId) => {
  console.log("BNB Deposit Cron... etnter ...........",userId);
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
       { "$match": { "userAssetsInfo.currencySymbol":"BNB"}},
       {
         "$project": {
            "_id":1,
            "email":1,
            "blockNo":"$userAssetsInfo.blockNo",
            "userAssetId": "$userAssetsInfo.userId",
            "currencySymbol": "$userAssetsInfo.currencySymbol",
            "currencyAddress": "$userAssetsInfo.currencyAddress",
            "privateKey": "$userAssetsInfo.privateKey",
            "currencyId": "$userAssetsInfo.currency"
         }
       }
    ])
  // console.log(getUsers,'getUsersgetUsersgetUsers-------------------------')
  // let getUsers = await User.find({});
  const latest = await web3.eth.getBlockNumber();
  console.log(getUsers,'getUsersgetUsersgetUsersgetUsers')
  for (let x in getUsers) {
    var user = getUsers[x];
    var startBlock = config.coinGateway.bnb.startBlock;
    var currentBlock = user.blockNo > 0 ? user.blockNo : startBlock;
    // console.log(latest,'---------latest-------------')
    if(user.currencyAddress){
      // console.log(user.currencyAddress,'user.currencyAddressuser.currencyAddress')
       let url = config.coinGateway.bnb.depositCheckUrl
                      .replace('##USER_ADDRESS##',user.currencyAddress)
                      .replace('##START_BLOCK##',currentBlock)
                      .replace('##END_BLOCK##',latest);
      //  let respData = await axios({
      //     'url':  url,
      //     'method': 'post'  
      //  })
      let respData = await axios({
        'url':  config.coinGateway.bnb.depositCheckUrl + 
           "api?module=account&action=txlist&address=" +
           user.currencyAddress +
           "&startblock=" +
           currentBlock +
           "&endblock=" +
           latest +
           "&sort=asc&apikey=15YENF4YFTS1N8SWJWX8X4WTKTM17M8I49",
         'method': 'post'  
      })
     //  console.log(url,'---------url')
        // console.log(respData && respData.data && respData.data.status,"******************************")
    
     if(respData && respData.data && respData.data.status == "1"){
       // console.log(respData.data,'respdata==================')
        for (let y in respData.data.result) {
          var result = respData.data.result[y];
          // console.log(result,'resultresultresultresultresult')
          let userAssetData = await Assets.findOne(
              { 'currencyAddress': {'$regex': new RegExp('.*' + result.to.toLowerCase() + '.*', 'i')},
                'currencySymbol' : "BNB"
              })
         // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetData--------------------')
          if(userAssetData){
          
          
          let transactionExist = await TransactionDB.findOne({
            txid: result.hash,
          });
          // console.log(transactionExist,'transactionExisttransactionExist')
          if (!transactionExist) {
            
            // user data object
            
             // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetData--------------------22222222222')
            const { status } = await bnbMovetoAdmin({
                       amount: parseInt(result.value, 10) / 1000000000000000000, 
                       // amount: parseInt(result.value) , 
                       useraddress:userAssetData.currencyAddress, 
                       userprivatekey: userAssetData.privateKey, 
                       adminAddress: config.coinGateway.bnb.address
                  });

            if(status){
                let transaction = new TransactionDB({
                  userId: user._id,
                  currencyId: user.currencyId,
                  fromaddress: result.from,
                  toaddress: result.to,
                  txid: result.hash,
                  currencySymbol: userAssetData.currencySymbol,
                  paymentType: "coin_deposit",
                  amount: parseInt(result.value, 10) / 1000000000000000000,
                  status: "completed"
                });
                //User insert
                let tran = await transaction.save();
                userAssetData.spotwallet = userAssetData.spotwallet + parseInt(result.value, 10) / 1000000000000000000;
                userAssetData.blockNo = result.blockNumber;
                await userAssetData.save();
            }

          } else if (transactionExist.status == "completed") {
            let newUserData = await TransactionDB.findOneAndUpdate(
              { _id: transactionExist._id },
              {
                $set: {
                  txid: result.hash
                }
              }
            );
          }

         }
        }
     }
      
     } 
  }    
  } catch (err) {
    //  res.status(200).json({"message":"errr"})

    console.log("Erron on BNB Deposit ", err);
  }
};

export const bnbMovetoAdmin = async ({ amount, useraddress, userprivatekey, adminAddress }) => {
   try {
    console.log("BNB Amount Move to Admin");
      var userprivatekey = decryptString(userprivatekey)
        let balance = await web3.eth.getBalance(useraddress)
        let getGasPrice = await web3.eth.getGasPrice()
        let txCount = await web3.eth.getTransactionCount(useraddress)
          var gaslimit = web3.utils.toHex(21000);
          var fee = web3.utils.toHex(getGasPrice) * gaslimit;
           console.log(gaslimit,'gaslimit-------------------------------------')
           console.log(fee,'fee-------------------------------------')
          
           console.log(amount,'amount-------------------------------------')
          amount = amount * 1000000000000000000 - fee;         
           console.log(web3.utils.toHex(amount),'amount222-------------------------------------')
       
          if (balance > amount) {
            console.log("consoleeeeeeeeeeeeeeeeeeeeeeee")
            var updateVal = {};
            const txObject = {
              nonce: web3.utils.toHex(txCount),
              gasLimit: web3.utils.toHex(gaslimit),
              gasPrice: web3.utils.toHex(getGasPrice),
              to: adminAddress.toString(),
              // value: "0x1e18",
              value: web3.utils.toHex(amount),
            };
            const common = await Common.forCustomChain(
              "mainnet",
              {
                name: "bnb",
                networkId: config.coinGateway.bnb.networkId,
                chainId: config.coinGateway.bnb.chainId,
              },
              "petersburg"
            );

            const tx = Transaction.fromTxData(txObject, {
              common,
            });
            const privateKey = Buffer.from(
              userprivatekey.substring(2, 66),
              "hex"
            );

            const signedTx = tx.sign(privateKey);

            const serializedTx = signedTx.serialize();

            const raw1 = "0x" + serializedTx.toString("hex");

            let responseData = await web3.eth.sendSignedTransaction(raw1)

            return {
               "status" : true,
               "message": "success"
            }
            // console.log(responseData,'--------------transactionHash')
            //     var recamount = web3.utils.fromWei(
            //       amount.toString(),
            //       "ether"
            //     );
                
              // console.log(responseData.transactionHash,'--------------transactionHash')
           
          } else {
            console.log('USER BNB BALNCE NOT FOUND')
            return {
               "status" : false,
               "message": "No Balance"
            }
          }
         
            
  } catch (err) {
    console.log(err,'Amount Move to Admin Catch Error')
    return {
           "status" : false,
           "message": "Catch Error"
        }
    

  }
}

export const bnbMovetoUser = async ({ amount, adminAddress, adminPrivatekey, userAddress }) => {
  try {
      console.log("BNB Amount Move to User");
      var adminPrivatekey = decryptString(adminPrivatekey)
      // var adminPrivatekey = adminPrivatekey

      console.log(amount,'amount',adminAddress,'adminAddress',adminPrivatekey,'adminPrivatekey', userAddress,'userAddress')
      let balance = await web3.eth.getBalance(adminAddress)
      let getGasPrice = await web3.eth.getGasPrice()
      let txCount = await web3.eth.getTransactionCount(adminAddress)
      var gaslimit = web3.utils.toHex(21000);
      var fee = web3.utils.toHex(getGasPrice) * gaslimit;
      var amount1 = amount * 1000000000000000000 - fee;
      // amount = amount * 1000000000000000000;
      
      // Convert to wei value
      
      console.log(balance,'balance',amount1,'amount---------------------------------------')
      if (balance > amount1) {
      // const amountToSend = web3.toWei(amount1, "ether");
      var updateVal = {};
      const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(gaslimit),
      gasPrice: web3.utils.toHex(getGasPrice),
      to: userAddress.toString(),
      // value: amountToSend ,
      value: web3.utils.toHex(amount1),
      };
      console.log(txObject,'txobjectttttttttttttttttt')
      const common = await Common.forCustomChain(
          "mainnet",
          {
          name: "bnb",
          networkId: config.coinGateway.bnb.networkId,
          chainId: config.coinGateway.bnb.chainId,
          },
          "petersburg"
        );
      // console.log(common,'commoncommoncommoncommon')

      const tx = Transaction.fromTxData(txObject, { common });
      // console.log(tx,'txtxtx')
      
      const privateKey = Buffer.from(adminPrivatekey.substring(2, 66),"hex");
      
      const signedTx = tx.sign(privateKey);
      
      const serializedTx = signedTx.serialize();
      
      const raw1 = "0x" + serializedTx.toString("hex");
      
      let responseData = await web3.eth.sendSignedTransaction(raw1)
      
      var recamount = web3.utils.fromWei(
      amount1.toString(),
      // amount1,
      "ether"
      );
      
      return {
            status: true,
            message: "Withdraw successfully",
            txHash:responseData.transactionHash
      }
  } else {
    console.log
    ("ther is no balance check it")
  return {
  status: false,
  message: "BNB No Balance"
  }
  }
  
  } catch (err) {
  console.log(err,'errerrerrerrerrerrerr')
  return {
  status: false,
  message: err.toString()
  }
  }
  }


export const tokenDeposit = async (userId,currencySymbol) => {
  console.log("BNB Token Deposit Cron...",userId,currencySymbol);
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
            "email":1,
            "blockNo":"$userAssetsInfo.blockNo",
            "userAssetId": "$userAssetsInfo.userId",
            "currencySymbol": "$userAssetsInfo.currencySymbol",
            "currencyAddress": "$userAssetsInfo.currencyAddress",
            "privateKey": "$userAssetsInfo.privateKey",
            "currencyId": "$userAssetsInfo.currency",
            "contractAddress": "$currencyInfo.contractAddress",
            "minABI": "$currencyInfo.minABI",
            "decimals": "$currencyInfo.decimals",
         }
       }
    ])
  // console.log(getUsers,'getUsersgetUsersgetUsersgetUsers---->>')
  // let getUsers = await User.find({});
  const latest = await web3.eth.getBlockNumber();
  
  // console.log(getUsers,'getUsersgetUsersgetUsersgetUsers')
  for (let x in getUsers) {
    var user = getUsers[x];
    var startBlock = config.coinGateway.bnb.startBlock;
    var currentBlock = user.blockNo > 0 ? user.blockNo : startBlock;
    // console.log(user.currencyAddress,'currencyAddresscurrencyAddress')
    if(user.currencyAddress){
      // console.log(config.coinGateway.bnb.depositCheckUrl,'config.coinGateway.bnb.depositCheckUrl')
     let url = config.coinGateway.bnb.depositBEP20CheckUrl
                      .replace('##USER_ADDRESS##',user.currencyAddress)
                      .replace('##START_BLOCK##',currentBlock)
                      .replace('##END_BLOCK##',latest);
       let respData = await axios({
          'url':  url,
          'method': 'post'  
       })
     // console.log(respData.data.status,'respDatarespDatarespDatarespData')

     if(respData && respData.data && respData.data.status=="1"){
        for (let y in respData.data.result) {
          var result = respData.data.result[y];
          
          let userAssetData = await Assets.findOne(
              { 'currencyAddress': {'$regex': new RegExp('.*' + result.to.toLowerCase() + '.*', 'i')},
                'currencySymbol' : currencySymbol
              })
           // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetData--------------------')
          if(userAssetData){

          let transactionExist = await TransactionDB.findOne({
            txid: result.hash,
          });
          // console.log(transactionExist,'transactionExisttransactionExist')
          if (!transactionExist) {
            // user data object
            // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetDatauserAssetData')
            // console.log(result.value,'userrrrrrrrrrrrrrrrrrrrrrrr')
           const { status,  message } = await tokenMoveToAdmin({ 
                      minAbi: user.minABI,
                      contractAddress: user.contractAddress,
                      adminAddress: config.coinGateway.bnb.address,
                      decimals: user.decimals,
                      amount: parseInt(result.value / 1000000000000000000),
                      userPrivateKey:userAssetData.privateKey,
                      userAddress:userAssetData.currencyAddress
                     })
            console.log(status,message,'statataatatatatatat')
            if(!status){

              // console.log("result.hashresult.hash",result.hash);
              let transaction = new TransactionDB({
                  userId: user._id,
                  currencyId: user.currencyId,
                  fromaddress: result.from,
                  toaddress: result.to,
                  txid: result.hash,
                  currencySymbol: userAssetData.currencySymbol,
                  paymentType: "coin_deposit",
                  amount: parseInt(result.value, 10) / 1000000000,
                  status: "completed"
              });
            //User insert
            let tran = await transaction.save();
            userAssetData.spotwallet = userAssetData.spotwallet + parseInt(result.value / 1000000000);
            userAssetData.blockNo = result.blockNumber;
            await userAssetData.save();
            
            }
          } else if (transactionExist.status == "completed") {
            
            let newUserData = await TransactionDB.findOneAndUpdate(
              { _id: transactionExist._id },
              {
                $set: {
                  txid: result.hash
                }
              }
            );
          }
         }
        }
     }
      
     } 
  }
    
  } catch (err) {
    console.log("\x1b[33m%s\x1b[0m", "Erron on BNB Deposit ", err);
  }
};
export const tokenDepositSafemoon = async () => {
  console.log("BNB Token Safemoon Deposit Cron...");
  try {
  let getUsers = await User.aggregate([
       {
          "$lookup":{
             "from": "assets",
             "localField": "_id",
             "foreignField": "userId",
             "as": "userAssetsInfo"
          }
       },
       {
         "$unwind": "$userAssetsInfo"
       },
       { "$match": { "userAssetsInfo.currencySymbol":"SAFEMOON"}},
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
            "SafeBlock":1,
            "userAssetId": "$userAssetsInfo.userId",
            "currencySymbol": "$userAssetsInfo.currencySymbol",
            "currencyAddress": "$userAssetsInfo.currencyAddress",
            "privateKey": "$userAssetsInfo.privateKey",
            "currencyId": "$userAssetsInfo.currency",
            "contractAddress": "$currencyInfo.contractAddress",
            "minABI": "$currencyInfo.minABI",
            "decimals": "$currencyInfo.decimals",
         }
       }
    ])
  // console.log(getUsers,'getUsersgetUsersgetUsersgetUsers')
  // let getUsers = await User.find({});
  const latest = await web3.eth.getBlockNumber();
  // console.log(getUsers,'getUsersgetUsersgetUsersgetUsers')
  for (let x in getUsers) {
    var user = getUsers[x];
    var startBlock = config.coinGateway.bnb.startBlock;
    var currentBlock = user.SafeBlock > 0 ? user.SafeBlock : startBlock;
    // console.log(user.currencyAddress,'currencyAddresscurrencyAddress')
    if(user.currencyAddress){
      // console.log(config.coinGateway.bnb.depositCheckUrl,'config.coinGateway.bnb.depositCheckUrl')
     let respData = await axios({
       'url':  config.coinGateway.bnb.depositCheckUrl + 
          "api?module=account&action=tokentx&address=" +
          user.currencyAddress +
          "&startblock=" +
          currentBlock +
          "&endblock=" +
          latest +
          "&sort=asc&apikey=15YENF4YFTS1N8SWJWX8X4WTKTM17M8I49",
        'method': 'post'  
     })
     // console.log(respData.data.status,'respDatarespDatarespDatarespData')

     if(respData && respData.data && respData.data.status=="1"){
        for (let y in respData.data.result) {
          var result = respData.data.result[y];
          // console.log(result,'resultresultresultresultresult')
          let userAssetData = await Assets.findOne(
              { 'currencyAddress': {'$regex': new RegExp('.*' + result.to.toLowerCase() + '.*', 'i')},
                'currencySymbol' : "SAFEMOON"
              })
           // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetData--------------------')
          if(userAssetData){
            
            let newUserData = await User.findOneAndUpdate(
              { _id: userAssetData.userId },
              {
                $set: {
                  SafeBlock: result.blockNumber,
                },
              }
            );

          let transactionExist = await TransactionDB.findOne({
            txid: result.hash,
          });
          // console.log(transactionExist,'transactionExisttransactionExist')
          if (!transactionExist) {
            // user data object
            // console.log(userAssetData,'userAssetDatauserAssetDatauserAssetDatauserAssetData')
            // console.log(result.value,'userrrrrrrrrrrrrrrrrrrrrrrr')
           const { status,  message } = await tokenMoveToAdmin({ 
                      minAbi: user.minABI,
                      contractAddress: user.contractAddress,
                      adminAddress: config.coinGateway.bnb.address,
                      decimals: user.decimals,
                      amount: parseInt(result.value / 1000000000000000000),
                      userPrivateKey:userAssetData.privateKey,
                      userAddress:userAssetData.currencyAddress
                     })
           // console.log(status,message,'statataatatatatatat')
            if(status){


              let transaction = new TransactionDB({
              userId: user._id,
              currencyId: user.currencyId,
              fromaddress: result.from,
              toaddress: result.to,
              txid: result.hash,
              // transactionBlockHash: result.blockHash,
              // currency: userAssetData.currencySymbol,
              transferType: "coin_deposit",
              amount: parseInt(result.value / 1000000000000000000),
              status: "1",
              // block: result.blockNumber,
              // isError: result.isError,
            });
            //User insert
            let tran = await transaction.save();
            userAssetData.spotwallet = userAssetData.spotwallet + parseInt(result.value / 1000000000000000000);
            userAssetData.blockNo = result.blockNumber;
            await userAssetData.save();
            }
          } else if (transactionExist.status == "completed") {
            let newUserData = await TransactionDB.findOneAndUpdate(
              { _id: transactionExist._id },
              {
                $set: {
                  transactionBlockHash: result.blockHash,
                  //timestamp: result.timeStamp,
                  status: result.txreceipt_status,
                  block: result.blockNumber,
                  isError: result.isError,
                },
              }
            );
          }
         }
        }
     }
      
     } 
  }
    
  } catch (err) {
    console.log("\x1b[33m%s\x1b[0m", "Erron on BNB Deposit ", err.toString());
  }
};

export const tokenMoveToAdmin = async ({
userPrivateKey,
minAbi,
contractAddress,
userAddress,
decimals,
adminAddress,
amount}) => {
     
    try {
        // console.log(amount,'amount88888888888888888888888')
         userPrivateKey = decryptString(userPrivateKey);
         // console.log(userPrivateKey,'userPrivateKeyuserPrivateKeyuserPrivateKeyuserPrivateKey')
        // let userPrivateKey1 = Buffer.from(userPrivateKey, "hex");
        // console.log("-------admin privateKey",userPrivateKey);
        // return
        console.log(contractAddress,userAddress,"testsarantestsaran");
        let contract = new web3.eth.Contract(JSON.parse(minAbi), contractAddress);
        let tokenbalance = await contract.methods.balanceOf(userAddress).call();
        console.log(tokenbalance,'tokenbalance-----------')
       
        let muldecimal = 2;
        if (decimals == 0) {
            muldecimal = 1
        }
        else if (decimals == 1) {
            muldecimal = 10
        } else if (decimals == 2) {
            muldecimal = 100
        }
        else if (decimals == 4) {
            muldecimal = 10000
        }
        else if (decimals == 6) {
            muldecimal = 1000000
        }
        else if (decimals == 8) {
            muldecimal = 100000000
        }
        else if (decimals == 18) {
            muldecimal = 1000000000000000000
        }




         amount = parseFloat(amount) * parseFloat(muldecimal);
         
        if (tokenbalance > 0) {            
            let getBalance = await web3.eth.getBalance(userAddress);     
            let txCount = await web3.eth.getTransactionCount(userAddress);
            let getGasPrice = await web3.eth.getGasPrice()
            let gaslimit = web3.utils.toHex(500000);
            let fee = web3.utils.toHex(getGasPrice) * gaslimit;
            console.log(getBalance,'------------>>>>getBalance')         
            console.log(fee,'------------>>>>fee')         
                       
            if (getBalance > fee) {
              console.log('-------------->>>>>>>>>>-----------------<<<<<<<<<<<',amount)
            
                let tokenAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"));
                // let tokenAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"));
                let data = contract.methods.transfer(adminAddress,amount.toString()).encodeABI();
                let transactionObject = {
                    gasLimit: web3.utils.toHex(500000),
                    gasPrice: web3.utils.toHex(getGasPrice),
                    data: data,
                    nonce: txCount,
                    from: userAddress,
                    to: contractAddress,
                };
                
              
              const common = await Common.forCustomChain(
              "mainnet",
              {
                name: "bnb",
                networkId: config.coinGateway.bnb.networkId,
                chainId: config.coinGateway.bnb.chainId,
              },
              "petersburg"
            );

            const tx = Transaction.fromTxData(transactionObject, {
              common,
            });
            const privateKey = Buffer.from(
              userPrivateKey.substring(2, 66),
              "hex"
            );

            const signedTx = tx.sign(privateKey);

            const serializedTx = signedTx.serialize();

            const raw1 = "0x" + serializedTx.toString("hex");

            let result = await web3.eth.sendSignedTransaction(raw1)
                return {
                    status : true,
                    result : result
                }

            } else {
              
              let amopunttosend = parseFloat(fee) - parseFloat(getBalance) + parseFloat(web3.utils.toWei("0.00041", "ether"));
              
              console.log("<<<<-----------SEND BNB ADMIN TO USER AMOUNT----------->>>>",amopunttosend/1000000000000000000)
             let { status, message, result } = await bnbMovetoUser({
                                                  amount: amopunttosend/1000000000000000000, 
                                                  adminAddress: config.coinGateway.bnb.address, 
                                                  adminPrivatekey: config.coinGateway.bnb.privateKey, 
                                                  userAddress: userAddress
                                              })
                return {
                    status : false,
                    message : "No Balance"
                }
            }

        } else {
          console.log("<<<<-----------There is no new deposit----------->>>>")
            return {
                    status : false,
                    message : "There is no new deposit"
            }
        }
    }
    catch (err) {
        console.log("\x1b[33m%s\x1b[0m", "Erron on Token Move to Admin", err.toString());
          return {
              status : false,
              message : err.toString()
          }
    }
}



export const tokenMoveToUser = async({amount,adminAddress,userAddress,contractAddress,adminPrivateKey,minAbi,decimals}) => {
  try {
        // console.log(amount,',amountamountamount',adminAddress,',adminAddressadminAddressadminAddress',userAddress,',userAddressuserAddressuserAddress',contractAddress,',contractAddresscontractAddresscontractAddress',adminPrivateKey,',adminPrivateKeyadminPrivateKeyadminPrivateKey',minAbi,',minAbiminAbiminAbi',decimals,',decimalsdecimalsdecimals')
         adminPrivateKey = decryptString(adminPrivateKey);
        // let adminPrivateKey1 = Buffer.from(adminPrivateKey, "hex");
        // console.log("-------admin privateKey",adminPrivateKey);
        // return
        let contract = new web3.eth.Contract(JSON.parse(minAbi), contractAddress);
        let tokenbalance = await contract.methods.balanceOf(adminAddress).call();
        // console.log(tokenbalance,'tokenbalancetokenbalancetokenbalance')
       
        let muldecimal = 2;
        if (decimals == 0) {
            muldecimal = 1
        }
        else if (decimals == 1) {
            muldecimal = 10
        } else if (decimals == 2) {
            muldecimal = 100
        }
        else if (decimals == 4) {
            muldecimal = 10000
        }
        else if (decimals == 6) {
            muldecimal = 1000000
        }
        else if (decimals == 8) {
            muldecimal = 100000000
        }
        else if (decimals == 18) {
            muldecimal = 1000000000000000000
        }

         amount = parseFloat(amount) * parseFloat(muldecimal);
         

        if (tokenbalance > 0) {            
   
            let getBalance = await web3.eth.getBalance(adminAddress);     
            let txCount = await web3.eth.getTransactionCount(adminAddress);
            let getGasPrice = await web3.eth.getGasPrice()
            let gaslimit = web3.utils.toHex(500000);
            let fee = web3.utils.toHex(getGasPrice) * gaslimit;  
                       
            if (getBalance > fee) {

                let tokenAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"));
                // let tokenAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"));
                let data = contract.methods.transfer(userAddress,amount.toString()).encodeABI();
                let transactionObject = {
                    gasLimit: web3.utils.toHex(500000),
                    gasPrice: web3.utils.toHex(getGasPrice),
                    data: data,
                    nonce: txCount,
                    from: adminAddress,
                    to: contractAddress,
                };
                
              
              const common = await Common.forCustomChain(
              "mainnet",
              {
                name: "bnb",
                networkId: config.coinGateway.bnb.networkId,
                chainId: config.coinGateway.bnb.chainId,
              },
              "petersburg"
            );

            const tx = Transaction.fromTxData(transactionObject, {
              common,
            });
            const privateKey = Buffer.from(
              adminPrivateKey.substring(2, 66),
              "hex"
            );

            const signedTx = tx.sign(privateKey);

            const serializedTx = signedTx.serialize();

            const raw1 = "0x" + serializedTx.toString("hex");

            let result = await web3.eth.sendSignedTransaction(raw1)
                
                return {
                    status : true,
                    trxId : result && result.transactionHash,
                    message : "Withdraw successfully"
                }
            } else {
                return {
                    status : false,
                    message : "Te1 Balance Not Found"
                }
            }

        }
    }catch (err) {
        console.log("\x1b[33m%s\x1b[0m", "Erron on Token Move to User", err.toString());
          return {
              status : false,
              message : err.toString()
          }
    }
}


