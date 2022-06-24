//  import packages
import express from 'express';
import passport from 'passport';

// import controllers
import * as testCtrl from '../controllers/test.controller';

const router = express();
const passportAuth = passport.authenticate("usersAuth", { session: false });

// User
router.route('/create').get(testCtrl.createUser);

export default router;