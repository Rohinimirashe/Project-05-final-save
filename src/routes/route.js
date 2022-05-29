const express = require("express");
const router = express.Router();
const aws= require("aws-sdk")
const userController=require("../controllers/userController")
const middleware=require('../utils/auth')
const productController=require("../controllers/productController")

router.post('/register', userController.createUser );  //CreateUser

router.post('/login', userController.loginUser );

router.get('/user/:userId/profile',middleware.userAuth,userController.getUserProfile )

router.put('/user/:userId/profile', middleware.userAuth, middleware.Authorisation,userController.updateUser );

// ----------------------------------Product Routes-------------------------------------------//

router.post('/products', productController.createProduct );
router.post('/products/:productId', productController.createProduct );

router.get('/products', productController.getProduct );


router.put('/products/:productId', productController.updateproduct);

router.get('/products',productController.getproducts)

router.get('/products/:productId',productController.getProductById)

router.delete('/products/:productId',productController.deleteProductById)

// ----------------------------Cart Routes---------------------------------------------//


module.exports = router;