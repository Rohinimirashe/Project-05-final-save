const express = require("express");
const router = express.Router();
const aws = require("aws-sdk")
const userController = require("../controllers/userController")
const { userAuth, Authorisation } = require('../utils/auth')
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")


router.post('/register', userController.createUser);  //CreateUser

router.post('/login', userController.loginUser);

router.get('/user/:userId/profile', userAuth, Authorisation, userController.getUserProfile)

router.put('/user/:userId/profile', userAuth, Authorisation, userController.updateUser);

// ----------------------------------Product Routes-------------------------------------------//

router.post('/products', productController.createProduct);

router.put('/products/:productId', productController.updateproduct);

router.get('/products', productController.getproducts)

router.get('/products/:productId', productController.getProductById)

router.delete('/products/:productId', productController.deleteProductById)

// ----------------------------Cart Routes---------------------------------------------//

router.post('/users/:userId/cart', userAuth, Authorisation, cartController.createCart);

router.put('/users/:userId/cart', userAuth, Authorisation, cartController.updateCart);

router.get('/users/:userId/cart', userAuth, Authorisation, cartController.getCartDetails)

router.delete('/users/:userId/cart', userAuth, Authorisation, cartController.deleteCart)

// ----------------------------order Routes---------------------------------------------//

router.post('/users/:userId/orders', userAuth, Authorisation, orderController.createOrder);

router.put('/users/:userId/orders',userAuth, Authorisation, orderController.updateOrder);

// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});

module.exports = router;