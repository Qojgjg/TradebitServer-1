// import package
import cron from 'node-cron'


/** 
 * Every 5 Second
*/
cron.schedule('*/5 * * * * *', () => {

});

/** 
 * Every minutes
*/
export const flexibleSettleTask = cron.schedule('* * * * *', (date) => {
    require('../controllers/staking.controller').flexibleSettleList()
}, {
    scheduled: false
});

export const redemListTask = cron.schedule('* * * * *', (date) => {
    require('../controllers/staking.controller').redemList(date)
}, {
    scheduled: false
});

/** 
 * Every 6 hours
*/
cron.schedule('0 0 */6 * * *', () => {
    require('../controllers/priceCNV.controller').priceCNVCMC();
});
