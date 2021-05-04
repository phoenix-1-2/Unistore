const express = require('express');
const router = express.Router();
const isAuth = require('../controllers/authController').isAuth;
const shopController = require('../controllers/shopController');

router.get('/',shopController.getHome);

router.get('/products',shopController.getHome);

router.get('/products/:productId',shopController.getProduct);

router.get('/cart',isAuth,shopController.getCart);

router.get('/orders',isAuth,shopController.getOrders);

router.get('/orders/:orderId',isAuth,shopController.getInvoice);


router.post('/orders',isAuth,shopController.postOrders);

router.post('/add-to-cart',isAuth,shopController.postAddCart);

router.post('/delete-cart',isAuth,shopController.postDeleteCart);

module.exports = router;