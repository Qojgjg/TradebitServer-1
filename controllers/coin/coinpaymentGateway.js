// import package
import coinpayments from 'coinpayments';


// import lib
import config from '../../config';

var coinPayment = new coinpayments({
    key: config.coinpaymentGateway.PUBLIC_KEY,
    secret: config.coinpaymentGateway.PRIVATE_KEY,
});

export const createAddress = async ({ currencySymbol, emailId, ipnUrl }) => {
    try {
        emailId = 'GM-' + emailId;
        ipnUrl = config.SERVER_URL + ipnUrl;
        let respData = await coinPayment.getCallbackAddress({ currency: currencySymbol, label: emailId, ipn_url: ipnUrl });
        return {
            'address': respData.address,
            'privateKey': ''
        }
    } catch (err) {
        return {
            'address': '',
            'privateKey': ''
        }
    }
}

export const createWithdrawal = async ({
    currencySymbol,
    amount,
    address,
}) => {
    try {
        let respData = await coinPayment.createWithdrawal({
            amount: parseFloat(amount),
            address,
            currency: currencySymbol,
        });
        return {
            status: true,
            data: respData
        }
    } catch (err) {
        return {
            status: false,
            message: err.toString()
        }
    }
}