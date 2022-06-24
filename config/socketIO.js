// import package
import { Server } from 'socket.io';

// import controller
// import { updateSpotBalance, updateBalance } from '../controllers/assets.controller';
// import { USDConvention } from '../controllers/binance/chart';
// import { orderBookByPairId, ticker24hrs } from '../controllers/binance.controller';

let socketIO = '';

export const createSocketIO = (server) => {
    socketIO = new Server(server, {
        cors: {
            origin: "*"
        }
    })

    socketIO.on('connection', (socket) => {
        socket.on('CREATEROOM', function (userId) {
            if (userId) {
                console.log("----userId", userId)
                socket.join(userId.toString());
            }
        });
socket.emit('Test','hai')
socket.on('Test',()=>{
    console.log("=----------------")
})

        /** 
         * Pending Order
         * toUserId, pairid, result
        */
        socket.on('pendingOrder', (data) => {
            try {
                let respData = {
                    pairId: data.pairId,
                    result: data.result
                }
                socketEmitOne('userPendingOrder', respData, data.toUserId)
            } catch (err) { }
        })

        /** 
         * Filled Order
         * toUserId, pairId, result
        */
        socket.on('filledOrder', (data) => {
            try {
                let respData = {
                    pairId: data.pairId,
                    result: data.result
                }
                socketEmitOne('userFilledOrder', respData, data.toUserId)
            } catch (err) {
            }
        })

        /** 
         * Order History
         * toUserId, pairId, result
        */
        socket.on('orderHistory', (data) => {
            try {
                let respData = {
                    pairId: data.pairId,
                    result: data.result
                }
                socketEmitOne('userOrderHistory', respData, data.toUserId)
            } catch (err) { }
        })

        /** 
         * Order Book
         * pairId, result
        */
        socket.on('orderBook', (data) => {
            socketEmitAll('userOrderBook', data)
        })

        /** 
         * Order Book
         * pairId, result
        */
        socket.on('recentTrades', (data) => {
            socketEmitAll('userRecentTrade', data)
        })

        /** 
         * Update Balance For Maker
         * pairId, price, userId, filledQuantity, buyorsell
        */
        socket.on('makerSpotBalance', (data) => {
            data['type'] = 'maker'
            // updateSpotBalance(data)
        })

        /** 
         * Update Balance For Taker
         * pairId, price, userId, filledQuantity, buyorsell
        */
        socket.on('takerSpotBalance', (data) => {
            data['type'] = 'taker'
            // updateSpotBalance(data)
        })

        /** 
         * Binance Price List
         * currencyList
        */
        socket.on('binancePriceList', (data) => {
            // USDConvention(data)
        });

        /** 
         * Binance Ticker
         * pairId, userId
        */
        socket.on('binanceTicker', (data, callback) => {
            // ticker24hrs(data, callback)
        });

        /** 
         * Binance Price List
         * currencyList
        */
        socket.on('orderBookByPairId', (data) => {
            // orderBookByPairId(data)
        });

        /** 
         * Balance Update at Cancel Order
         * userId, pairId, price, quantity, buyorsell
        */
        socket.on('updateBalance', (data) => {
             updateBalance(data)
        });

        socket.on('disconnecting', () => {
            console.log('DISCONNET', socket.rooms); // the Set contains at least the socket ID
        });
    })

}

export const socketEmitAll = (type, data) => {
    try {
        socketIO.emit(type, data)
    } catch (err) {
    }
}

export const socketEmitOne = (type, data, userId) => {
    try {
        socketIO.sockets.in(userId.toString()).emit(type, data);
    } catch (err) {
    }
}


export const socketEmitChat = (type, data,userid) => {
    try {
        console.log("fff", type, data);
        socketIO.emit(type, data,userid)
    } catch (err) { }
}

