const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// get Method
router.get('/', userController.home);
router.get('/users',userController.users);
router.get('/get-qr',userController.getQRCode);

// post methods
router.post('/signup', userController.userSignup);
router.post('/login', userController.userLogin);
router.post('/Add-bank', userController.bank);
router.post('/Add-wallet',userController.addWallet);
router.post('/generate-qr',userController.generate);
router.post('/send-money',userController.SendMoney);
router.post('/send-money-via-bank',userController.sendViaBank);
router.post('/self-transfer',userController.selfTransfer);
module.exports = router;
