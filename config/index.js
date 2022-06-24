let key = {};

if (process.env.NODE_ENV === 'production') {
    console.log('\x1b[35m%s\x1b[0m', `Set Production Config`)

    // const API_URL = 'http://3.140.112.100';
    const API_URL = 'https://boxfyapi.wealwin.com';
    const PORT = 3022
    key = {
        SITE_NAME: 'Boxfy',
        secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
        cryptoSecretKey: "1234567812345678",
       // DATABASE_URL: "mongodb://Nsderduw:K8kbt478dr2@3.142.137.131:10943/boxdb",
        DATABASE_URL: "mongodb://boxfydb:Jnvsdjdjsdjcsdcsdewd@194.195.114.124:10730/boxfydb",

        PORT: PORT,
        FRONT_URL: 'https://boxfy.wealwin.com',
        ADMIN_URL: 'https://boxfy.wealwin.com/admin',
        SERVER_URL: `${API_URL}`,
        IMAGE_URL: `${API_URL}`,
        // RECAPTCHA_SECRET_KEY:"6LfKFN4ZAAAAAM_4RonI_NEVwa39LJgQi5T0vn7E",
        RECAPTCHA_SECRET_KEY:"6LcM-cwfAAAAAJIfCqti6ODnsu_DZxxUzoX9BhKo",
    //    RECAPTCHA_SECRET_KEY:"6LdbK_kcAAAAAKPbm5JUJxTz-31onUrWV-k6S0WA",
       
        //Sms Gateway
         //kissan token account
         smsGateway: {
            TWILIO_ACCOUT_SID: 'AC6cbbf451f4423c916dbd76ff3fdd9',
           TWILIO_AUTH_TOKEN: '1e5474f474b7f61bc25c2d9c8c572',
           TWILIO_PHONE_NUMBER: "+19034004219",
       },

       // Email Gateway
       emailGateway: {
           SENDGRID_API_KEY: '',
           fromMail: "info@tradebit.io",
           nodemailer: {
               host: "smtp-relay.sendinblue.com",
               port: 587,
               secure: false, // true for 465, false for other ports
               auth: {
                   user: 'vikasyadavzx@gmail.com', // generated ethereal user
                   pass: 'xtZC8vGnQMfU79jH', // generated ethereal password
               },
           }
       },

        IMAGE: {
            DEFAULT_SIZE: 1 * 1024 * 1024,  // 1 MB,
            PROFILE_PATH: "public/images/profile",
            URL_PATH: '/images/profile/',
            PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
            KYC_PATH: 'public/images/kyc',
            KYC_URL_PATH: '/images/kyc/',
            CURRENCY_SIZE: 0.5 * 1024 * 1024, // 500 KB
            CURRENCY_PATH: 'public/currency',
            CURRENCY_URL_PATH: '/currency/',
            DEPOSIT_PATH: 'public/deposit',
            DEPOSIT_URL_PATH: '/deposit/',
            SETTINGS_URL_PATH:'public/settings'
        },
        NODE_TWOFA: {
            NAME: "Boxfy",
            QR_IMAGE: "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl="
        },

        coinGateway: {
            eth: {
                url: "http://3.134.250.197:3000",
                startBlock: 0,
                mode: "ropsten", // ropsten
                address: "0x551eACd1b6B1CE2E50e1446071d070b3139F1024",
                privateKey: "U2FsdGVkX1+s/aJeRRokafh884XWjOFUPH9B89wqtTsOJcLDJzGLiQxIEBXZ0Y25w5j/CGOIMXcHJxvmnRiknBLPgnaOa4rofrH3oz2Wdxy0ccOUIBCwCrjZywceM8Df",
                etherscanUrl: 'https://api.etherscan.io/api?', // https://api-ropsten.etherscan.io/api?
                ethDepositUrl: 'https://api.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K',
                ethTokenDepositUrl: 'https://api.etherscan.io/api?module=account&action=tokentx&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K',
            },
            bnb:{
                url: "https://bsc-dataseed.binance.org/",
                depositCheckUrl: "https://api.bscscan.com/",
                depositBEP20CheckUrl: "https://api.bscscan.com/api?module=account&action=tokentx&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=15YENF4YFTS1N8SWJWX8X4WTKTM17M8I49",
                networkId: 56,
                chainId: 56,
                address: "0x09998334Edd776189F4036cdFcb634edCb42A9a1",
                privateKey: "U2FsdGVkX189jYuxXCyUeY9M+91uuDhqE+tk6O0zgo0tN88xYCoqB5lubKU2Mfrv0JIGPVdui8cxlVI05A2w5HgI2KxYUANJecJ3To+Aukx4hrHO+uS8XC7MyQx7VyhZ"
            },
            tron: {
                fullNode: "https://api.trongrid.io",
                solidityNode: "https://api.trongrid.io",
                eventServer: "https://api.trongrid.io",
                contractAddress: "",
                privateKey: "U2FsdGVkX19VjGWPPThheQMpfe6CMFZSxFIZG+z8zm2kMwpAb64DOgEJL4jA6NNF+RoruyTs0X4xxGnlZUppRX92XaTxjdGDgZbrnyZb32UGFPO5WR+O01C8IMPhv3Wt",
                address: "TL1YxYN1DvCDcAb6RNLVpdF1C2Vu5NAAaA",
                transactionUrl: "https://api.trongrid.io/v1/accounts/##USER_ADDRESS##/transactions?only_to=true&limit=50",
                transactionContractUrl: "https://api.trongrid.io/v1/accounts/##USER_ADDRESS##/transactions/trc20?limit=100&contract_address=##CONTRACT_ADDRESS##",
                decimal: 1000000, //18
                tronDecimal:1000000, //6 
                adminAmtSentToUser: 2.00004,
            },
            btc: {
                url: 'http://52.15.146.48:3000'
            },
            // ltc: {
            //     url: 'http://141.164.41.32:3000'
            // },
            doge: {
                url: 'http://3.19.170.209:3000'
            },
            xrp: {
                url: "wss://s1.ripple.com",
                address: "rBjBJbbJ6Hk6Rd97wBXchZGHY9dY5wiyG7",
                secretkey: "U2FsdGVkX1+758DHTUQx0dqF1G0QJn4s5I5Cq1iUwAIZelWhYDLxaSBYxLiOTgx/"
                // url: "wss://s.altnet.rippletest.net:51233"
            }
        },

        BINANCE_GATE_WAY: {
            API_KEY: 'ek3qBabgl62s0EetKDag1Ha3hKMx5AaxFtKFSHwmE11U6nQMFs6j6G3Whv3VbXfK',
            API_SECRET: 'w7oKfiakpsGUsjXvRHMJBOY796lHVZXLgOZBL9SHg07Z4r6f579pjfecBLdlUGGa',
        },
        coinpaymentGateway: {
            PUBLIC_KEY: "9458d22b0afe1f705a6bff34232b482b383759a19773d280cbe98978da21fe72",
            PRIVATE_KEY: "1449dcd2e83623535753e5B8A0Ee05d9d418855f4ca3ceeb9251aB6Fd54a1CD7"
        },
        CLOUDINARY_GATE_WAY: {
            CLOUD_NAME: "btco",
            API_KEY: "573177252847672",
            API_SECRET: "OQlmyj0bV5x0ljO8pGr2Vqf8tpw",
        },
        COINMARKETCAP: {
            API_KEY: '6dc35eeb-ba06-418a-8367-3dead803dd3b',
            PRICE_CONVERSION: 'https://pro-api.coinmarketcap.com/v1/tools/price-conversion'
        }
    };

} else {
    console.log('\x1b[35m%s\x1b[0m', `Set Development Config`)

    const API_URL = 'http://localhost';
    const PORT = 2053
    key = {
        SITE_NAME: 'Boxfy',
        secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
        cryptoSecretKey: "1234567812345678",
        DATABASE_URL: "mongodb://boxfydb:Jnvsdjdjsdjcsdcsdewd@194.195.114.124:10730/boxfydb",
        PORT: PORT,
         FRONT_URL: 'http://localhost:3000',
        ADMIN_URL: 'http://localhost:3000/admin',
        SERVER_URL: `${API_URL}:${PORT}`,
        RECAPTCHA_SECRET_KEY:"6LcM-cwfAAAAAJIfCqti6ODnsu_DZxxUzoX9BhKo",
        // Sms Gateway
        smsGateway: {
            TWILIO_ACCOUT_SID: 'AC6c0bab1f4423c916dbd76ff3fdd9',
           TWILIO_AUTH_TOKEN: '1e5cad474b7f61bc25c2d9c8c572',
           TWILIO_PHONE_NUMBER: "+190304219",
       },

       // Email Gateway
       emailGateway: {
           SENDGRID_API_KEY: '',
           fromMail: "info@tradebit.io",
           nodemailer: {
               host: "smtp-relay.sendinblue.com",
               port: 587,
               secure: false, // true for 465, false for other ports
               auth: {
                   user: 'vikasyadavzx@gmail.com', // generated ethereal user
                   pass: 'xtZC8vGnQMfU79jH', // generated ethereal password
               },
           }
       },

        IMAGE: {
            DEFAULT_SIZE: 1 * 1024 * 1024,  // 1 MB,
            PROFILE_PATH: "public/images/profile",
            URL_PATH: '/images/profile/',
            PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
            ID_DOC_SIZE: 12 * 1024 * 1024,  // 12 MB,
            KYC_PATH: 'public/images/kyc',
            KYC_URL_PATH: '/images/kyc/',
            CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
            CURRENCY_PATH: 'public/currency',
            CURRENCY_URL_PATH: '/currency/',
            DEPOSIT_PATH: 'public/deposit',
            DEPOSIT_URL_PATH: '/deposit/',
            SETTINGS_URL_PATH:'public/settings'

        },

        NODE_TWOFA: {
            NAME: "Boxfy",
            QR_IMAGE: "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl="
        },

        coinGateway: {
            eth: {
                url: "http://3.134.250.197:3000",
                startBlock: 0,
                mode: "ropsten", // ropsten
                address: '0x33C005d791cdE98b0B7d49cC586b530849EE7F79',
                privateKey: 'U2FsdGVkX1+kko70n/nxLhYYJ3mlmsHsn731zNGwRDRo97614iuFjYlz939NSjpMBR4PS4/peyaHbKZ91jh6aC22Jxzdwohj0krknskP0Wnk7WLTCaaG+v2WcAN8eKK5',
                // etherscanUrl: 'https://api.etherscan.io/api?', // https://api-ropsten.etherscan.io/api?
                ethDepositUrl: 'https://api-ropsten.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K',
                ethTokenDepositUrl: 'https://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K',
            },
            bnb:{
                url: "https://bsc-dataseed.binance.org/",
                depositCheckUrl: "https://api.bscscan.com/",
                depositBEP20CheckUrl: "https://api.bscscan.com/api?module=account&action=tokentx&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=15YENF4YFTS1N8SWJWX8X4WTKTM17M8I49",
                networkId: 56,
                chainId: 56,
               address: "0x33C005d791cdE98b0B7d49cC586b530849EE7F79",
                privateKey: "U2FsdGVkX1+kko70n/nxLhYYJ3mlmsHsn731zNGwRDRo97614iuFjYlz939NSjpMBR4PS4/peyaHbKZ91jh6aC22Jxzdwohj0krknskP0Wnk7WLTCaaG+v2WcAN8eKK5",
            },
            tron: {
                fullNode: "https://api.trongrid.io",
                solidityNode: "https://api.trongrid.io",
                eventServer: "https://api.trongrid.io",
                contractAddress: "TKXi19mLzWfsvu72qUWyYaBByD4qMayL2H",
                privateKey: "U2FsdGVkX19NhpwhvbB+ICs3ypOFZAZDIFfykS/xSawDHth0RtkG6jJE86PR7UuqbGVD8I1sm8KDUkxCAgFuy5xqsR2VAwGn5rla7v7NvGfHwAtRVf9yNuj9+aV2SBs9",
                address: "TPtTmNvj7L4RHhnrKm4bh98vHNnEenogEE",
                transactionUrl: "https://api.trongrid.io/v1/accounts/##USER_ADDRESS##/transactions?only_to=true&limit=50",
                transactionContractUrl: "https://api.trongrid.io/v1/accounts/##USER_ADDRESS##/transactions/trc20?limit=100&contract_address=##CONTRACT_ADDRESS##",
                decimal: 1000000, //6
                tronDecimal:1000000, //6 
                adminAmtSentToUser: 2.00004,
            },
            btc: {
                url: 'http://52.15.146.48:3000'
            },
            // ltc: {
            //     url: 'http://141.164.41.32:3000'
            // },
            doge: {
                url: 'http://3.19.170.209:3000'
            },
            xrp: {
                 url: "wss://s1.ripple.com",
                address: "rBjBJbbJ6Hk6Rd97wBXchZGHY9dY5wiyG7",
                secretkey: "U2FsdGVkX1+758DHTUQx0dqF1G0QJn4s5I5Cq1iUwAIZelWhYDLxaSBYxLiOTgx/",
                url: "wss://s.altnet.rippletest.net:51233"
            }
        },

        BINANCE_GATE_WAY: {
            API_KEY: 'ek3qBabgl62s0EetKDag1Ha3hKMx5AaxFtKFSHwmE11U6nQMFs6j6G3Whv3VbXfK',
            API_SECRET: 'w7oKfiakpsGUsjXvRHMJBOY796lHVZXLgOZBL9SHg07Z4r6f579pjfecBLdlUGGa',
        },
        coinpaymentGateway: {
            PUBLIC_KEY: "0821c8c16d489d9551254522de7317d90652427bd2ac8cf514069a31d773111d",
            PRIVATE_KEY: "ef7288Db1f4c5006Ea281321A3ecFac8314263d2c685fe460c2709d88b4FfadE"
        },
        CLOUDINARY_GATE_WAY: {
            CLOUD_NAME: "btco",
            API_KEY: "573177252847672",
            API_SECRET: "OQlmyj0bV5x0ljO8pGr2Vqf8tpw",
        },
        COINMARKETCAP: {
            API_KEY: '6dc35eeb-ba06-418a-8367-3dead803dd3b',
            PRICE_CONVERSION: 'https://pro-api.coinmarketcap.com/v1/tools/price-conversion'
        }
    };
}

export default key;
