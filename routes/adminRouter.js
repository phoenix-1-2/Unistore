const express = require('express');
const router = express.Router();
const isAuth = require('../controllers/authController').isAuth;
const adminController = require('../controllers/adminController');

router.get('/add-product',isAuth,adminController.getAddProduct)

router.get('/products',isAuth,adminController.getAdminProducts)

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);

router.post('/edit-product',isAuth,adminController.postEditProduct);

router.post('/add-product',isAuth,adminController.postAddProduct);

router.post('/delete-product',isAuth,adminController.postDeleteProduct);


module.exports = router;