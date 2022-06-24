// import package
import { RippleAPI } from 'ripple-lib';

// import config
import config from "../../config/index";

// import modal
import { Assets, Transaction } from "../../models";

// import current folder
// import { depositEmail } from '../emailTemplate.controller';
import { createNotification } from '../notification.controller';

// import lib
import { encryptString, decryptString } from '../../lib/cryptoJS'
import isEmpty from "../../lib/isEmpty";

const RippleServer = new RippleAPI({
  server: config.coinGateway.xrp.url, 
});


export const createAddress = async ()=> {
  let dest_tag = createDestTagId();
  
  let checkData = await Assets.findOne({ 'currencySymbol':'XRP','dest_tag': dest_tag })

  if(checkData){
    dest_tag = createDestTagId();
  }

  return {
     'address': config.coinGateway.xrp.address,
     'dest_tag': dest_tag
  }
} 

export const createDestTagId = () => {
  let dest_tag = Math.floor(Math.random() * (9999999 - 1111111) + 1111111);
  return dest_tag;
}

export const connectRipple = async () => {
  return await RippleServer.connect();
}

export const deposit = async (userId) => {
  try{

    await connectRipple();
    let serverInfo = await RippleServer.getServerInfo();

    const ledgers = serverInfo.completeLedgers.split("-");
    const minLedgerVersion = Number(ledgers[0]);
    const maxLedgerVersion = Number(ledgers[1]);

    const myAddress = config.coinGateway.xrp.address;

    const transactionData = await RippleServer.getTransactions(
         myAddress, 
         { 
          minLedgerVersion,
          maxLedgerVersion 
        }
    )
 
    if(transactionData && transactionData.length > 0){
        let userAssetData = await Assets.findOne({ userId : userId, currencySymbol : "XRP" }).populate('currency').populate('userId');
        let dest_tag = userAssetData.dest_tag;

        for (var i = 0; i < transactionData.length; i++) {
          let trxId = transactionData[i].id;
          let amount = transaction[i].specification.source.maxAmount.value;
          let findData = { 'currencySymbol':'XRP','userId':userId,'txid':trxId,'dest_tag': dest_tag }
          let checkData = await Transaction.findOne(findData);

          if(isEmpty(checkData) && (userAssetData && userAssetData.currency && userAssetData.currency.maximumDeposit >= amount)){
            
            let transaction = new Transaction({
              userId: userId,
              currencyId: userAssetData.currency.currencyId,
              fromaddress: transaction[i].specification.source.address,
              toaddress: config.coinGateway.xrp.address,
              txid: trxId,
              currencySymbol: userAssetData.currencySymbol,
              paymentType: "coin_deposit",
              amount: amount,
              dest_tag: dest_tag,
              status: "completed"
            });

            let newTransaction = await transaction.save();
            userAssetData.spotwallet = userAssetData.spotwallet + amount;
            await userAssetData.save();

            // depositEmail({
            //   'email': userAssetData.userId.email,
            //   'amount': amount,
            //   'currencySymbol': "XRP",
            //   'hash': trxId,
            //   'userId': userId,
            // })

            let notifiObj = {
                description : `${amount} XRP | Completed`,
                userId : userId,
                type : "DEPOSIT",
                url: `${config.FRONT_URL}/wallet`,
            }

            createNotification(notifiObj)
          }
        }
    }else{
      console.log('NO XRP BALANCE')
    }    
    
  }catch(err){
    console.log('XRP DEPOSIT ERROR',err)
  }
}

export const amountMoveToUser = async ({ userAddress, amount, dest_tag }) => {
  try{
    
    const xrpAddress = config.coinGateway.xrp.address;
    const secretkey = decryptString(config.coinGateway.xrp.secretkey);
    

    const payment = {
      source: {
        address: xrpAddress,
        maxAmount: {
          value: amount.toString(),
          currency: "XRP",
        },
      },
      destination: {
        address: userAddress,
        tag: parseInt(dest_tag),
        amount: {
          value: amount.toString(),
          currency: "XRP",
        },
      },
    };

    const instructions = { maxLedgerVersionOffset: 5 };

    await connectRipple();
    let prepared = await RippleServer.preparePayment(xrpAddress, payment, instructions);

    const { signedTransaction } = await RippleServer.sign(prepared.txJSON,secretkey);

    let responseData = await RippleServer.submit(signedTransaction);

    if (responseData && typeof responseData.tx_json != "undefined" && typeof responseData.tx_json.hash != "undefined"){
      
      return {
         "status" : true,
         "message": "Withdraw successfully",
         "trxId": responseData.tx_json.hash
      }
    }else{
      return {
         "status" : false,
         "message": "Withdraw Error"
      }
    }
  }catch(err){
    console.log(err,'XRP WITHDRAW ERROR')
    return {
       "status" : false,
       "message": "Catch Error"
    }
  }
}

// export const createXRPAddress = async () => {
//   await connectRipple()
//   let address_info =  RippleServer.generateAddress();
//   console.log(address_info,'-----address_info')
// }

// createXRPAddress()
