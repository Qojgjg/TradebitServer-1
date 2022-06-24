let key = {};

if (process.env.NODE_ENV === 'production') {
    console.log('\x1b[35m%s\x1b[0m', `Set Production Config`)

    const API_URL = 'http://3.140.112.100';
    const PORT = 2053
    key = {
        SITE_NAME: 'Boxfy',
        secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
        cryptoSecretKey: "1234567812345678",
       // DATABASE_URL: "mongodb://Nsderduw:K8kbt478dr2@3.142.137.131:10943/boxdb",
        DATABASE_URL: "mongodb://Mvdvehe:R6hdt675pd8@3.140.112.100:10567/Kdceddb",

        PORT: PORT,
        FRONT_URL: 'http://3.140.112.100',
        ADMIN_URL: 'http://3.140.112.100/admin',
        SERVER_URL: `${API_URL}:${PORT}`,
        IMAGE_URL: `${API_URL}`,
        RECAPTCHA_SECRET_KEY:"6LdbK_kcAAAAAKPbm5JUJxTz-31onUrWV-k6S0WA",
        //Sms Gateway
        smsGateway: {
            TWILIO_ACCOUT_SID: 'AC2be65a765d9ab078a46f32db52a30af9',
            TWILIO_AUTH_TOKEN: '04f3021ea451c3622438951be6d06029',
            TWILIO_PHONE_NUMBER: "+19898502499",
        },

        // Email Gateway
        emailGateway: {
            SENDGRID_API_KEY: 'G2_6DHfmSaWcrRQ1RxTHrQ',
            fromMail: "support@alwin.com",
            nodemailer: {
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: 'ajith@britisheducationonline.org', // generated ethereal user
                    pass: 'Ajith@97', // generated ethereal password
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
            CURRENCY_PATH: 'public/images/currency',
            CURRENCY_URL_PATH: '/images/currency/',
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
                url: 'http://18.140.3.143:8545',
                mode: 'mainnet', // ropsten
                address: '0xa84eFb441506DeDdB74B36cd281B4e1EC71a271e',
                privateKey: 'U2FsdGVkX19kAyxw95yLxhMv3m/p8qgiGgSFQcLD2BwwmLZlRbvk4fny9mbw17B7MGUiZFj035VaZY7jF1w8Ig6ZNoc3GQTXATgvA1ucBDrbNj5DnSvt37GKPDnoYwn1',
                url: `${API_URL}:${PORT}/ethnode`,
                etherscanUrl: 'https://api.etherscan.io/api?', // https://api-ropsten.etherscan.io/api?
                blockDetail: {
                    'module': 'proxy',
                    'action': 'eth_blockNumber',
                    'apikey': 'S4MVA2KGP5SNX8WB5QB4APC1JJC78A1MFA'
                },
                blockTransaction: {
                    'module': 'proxy',
                    'action': 'eth_getBlockByNumber',
                    'tag': '',
                    'boolean': true,
                    'apikey': 'RH35J5B9BNQXY9K6DIWU8KTGRJ7BI6SZEH'
                }
            },
            btc: {
                url: 'http://3.1.6.100:3003'
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
        DATABASE_URL: "mongodb://localhost:27017/Kdceddb",//"mongodb://Nsderduw:K8kbt478dr2@3.142.137.131:10943/teldb", // "mongodb://localhost:27017/binetco", //"mongodb://localhost:27017/binetco_test", "mongodb://Nsderduw:K8kbt478dr2@3.142.137.131:10943/teldb"

        PORT: PORT,
        FRONT_URL: 'http://localhost:3000',
        ADMIN_URL: 'http://192.168.29.82:3000/admin',
        SERVER_URL: `${API_URL}:${PORT}`,
        RECAPTCHA_SECRET_KEY:"6LcIFvkcAAAAANZxinHREqDPSVLGf8ZUdWOfLiYV",
        //Sms GateWay
        smsGateway: { // Sridhar
            TWILIO_ACCOUT_SID: 'AC2d9e21a4dd3ef5bc0c5d678ac27ba191',
            TWILIO_AUTH_TOKEN: 'a25453cd2ab2a69e4b0906266325b57c',
            TWILIO_PHONE_NUMBER: "+15404529211",
        },

        emailGateway: {
            SENDGRID_API_KEY: 'G2_6DHfmSaWcrRQ1RxTHrQ',
            fromMail: "support@alwin.com",
            nodemailer: {
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: 'ajith@britisheducationonline.org', // generated ethereal user
                    pass: 'Ajith@97', // generated ethereal password
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
                url: 'http://18.140.3.143:8545',
                mode: 'mainnet', // ropsten
                address: '0xa84eFb441506DeDdB74B36cd281B4e1EC71a271e',
                privateKey: 'U2FsdGVkX19kAyxw95yLxhMv3m/p8qgiGgSFQcLD2BwwmLZlRbvk4fny9mbw17B7MGUiZFj035VaZY7jF1w8Ig6ZNoc3GQTXATgvA1ucBDrbNj5DnSvt37GKPDnoYwn1',
                url: `${API_URL}:${PORT}/ethnode`,
                etherscanUrl: 'https://api.etherscan.io/api?', // https://api-ropsten.etherscan.io/api?
                blockDetail: {
                    'module': 'proxy',
                    'action': 'eth_blockNumber',
                    'apikey': 'S4MVA2KGP5SNX8WB5QB4APC1JJC78A1MFA'
                },
                blockTransaction: {
                    'module': 'proxy',
                    'action': 'eth_getBlockByNumber',
                    'tag': '',
                    'boolean': true,
                    'apikey': 'RH35J5B9BNQXY9K6DIWU8KTGRJ7BI6SZEH'
                }
            },
            btc: {
                url: 'http://3.1.6.100:3003'
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