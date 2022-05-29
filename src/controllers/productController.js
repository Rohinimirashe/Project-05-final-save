const userModel = require("../models/userModel.js");
const productModel = require('../models/productModel')
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { json } = require("body-parser");
const currencySymbol = require("currency-symbol-map");
const { isValidObjectId } = require("mongoose");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createProduct = async function (req,res) {
    try{
    let data= req .body
    

    if (!validator.isValidDetails(data)){
        return res.status(400).send({status: false, message: "Please enter your details to Create Product"})   //validating the parameters of body
    }

    let { title, description, price, currencyId,  availableSizes ,currencyFormat,  isFreeShipping, installments, style} = data

    if (!validator.isValidValue(title)){
        return res.status(400).send({status: false, message: "Please provide select title"})
    }
    const titleUsed = await productModel.findOne({title})
    if (titleUsed){
            return res.status(400).send({status:false, msg:`${title} is already used`})
    }

    if (!validator.isValidValue(description)){
        return res.status(400).send({status:false, msg:"plese provide des of product"})
    }

    if (!validator.isValidValue(price)){
        return res.status(400).send({status: false, message: "Please provide product price"})
    }
      //NaN(not a number) return true if a number is NAN
      // NAN convert the value to a number

    if (!(!isNaN(Number(price)))){
        return res .status(400).send({status:false,msg: " price should be valid number"})
    }

    if (!validator.isValidValue(currencyFormat)){
        return res.status(400).send({status: false, message: "Please provide currencyformat "})
    }

   

    if (!validator.isValidValue(currencyId)){
        return res .status(400).send({status:false,msg:"provide currencyid"})
    }

      // check currencyid equal to or not to INR
    if (currencyId !="INR"){
        return res .status(400).send({status:false,msg:'currencyId should be INR'})
    }
    currencyFormat= currencySymbol('INR') // need currency symbolmap package here

    
    //const availableSizes = JSON.parse(data.availableSizes ) 
    
    // let sizeEnum = availableSizes.split(",").map(x => x.trim())  //trim remove space like  "  a  "
    
    // for (let i = 0; i < sizeEnum.length; i++) {
    //  if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeEnum[i]))) {
    //      return res.status(400).send({status: false, message: `Available Sizes must be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
    //  }
   // }
   if (!validator.isValidSize(availableSizes)){
    return res.status(400).send({status:false, message:"Please provide the size in s,xs,m,x,l,xl,xxl"})   //availableSizes is mandory
   }

   if (!validator.isValidValue(availableSizes)){
    return res.status(400).send({status:false, message:"Please provide the size "})   //availableSizes is mandory
   }

   if (installments){
       if (!validator.validInstallment(installments)){
           return res .status(400).send({status:false,msg: "instalment can nt be a decimal number"})
       }
   }

   if(isFreeShipping) {
    if (!(isFreeShipping != true)) {
        return res.status(400).send({ status: false, msg: "isFreeShipping must be a true or false." })
    }
}

let files = req.files
if (files && files.length>0){
    var productImage = await awsConfig.uploadFile(files[0])   //upload to s3 and get the uploaded link
}
else {
    return res.status(400).send({status:false,msg:'please upload profile image'})
}

const product={ title,description,currencyFormat,price,currencyId,isFreeShipping,
productImage,style,availableSizes,installments}

let productData =await productModel.create(product) // //If all these validations passed , creating a product
return res.status(201).send({status: true , message: "New Product created successfully", data: productData })
}

catch(err) {
    console.log(err)
    res.status(500).send({message: err.message})
}
}
module.exports.createProduct = createProduct
const getProductById = async function(req, res){
    try{
    
        const productId = req.params.productId;
        if(!(validator.isValidObjectId(productId))) return res.status(400).send({status: false, message: "Please provide valid productId"})
    
        const productDetails = await productModel.findOne({_id:productId, isDeleted:false})
    
        if(!productDetails) return res.status(404).send({status:false, message:"No such product exists"})
    
        return res.status(200).send({status: true, message: 'Success', data:productDetails})
    
    }catch(error){
        return res.status(500).send({status:false, Error:error.message})
    }
}
module.exports.getProductById = getProductById

 const getProduct = async function(req, res){
     try{
        const getproducts=async function(req,res){
            let filter=req.query
            let Name=filter.name
            let size=filter.size
            let priceGreaterThan=filter.priceGreaterThan
            let priceLessThan=filter.priceLessThan
            const getproduct = { isDeleted: false };
            if (Name) {
                if (!(validator.isValidValue( Name))) {
                    return res.status(400).send({ status: false, message: `User id ${Name} is not valid` })
                }
                getproduct["title"] = Name
            }
            if ( priceGreaterThan) {
                if (!(validator.isValidValue( priceGreaterThan))) {
                    return res.status(400).send({ status: false, message: `User id ${ priceGreaterThan} is not valid` })
                }
                getproduct["price"] = {$gt: priceGreaterThan}
            }
            if ( priceLessThan) {
                if (!(validator.isValidValue( priceLessThan))) {
                    return res.status(400).send({ status: false, message: `User id ${ priceLessThan} is not valid` })
                }
                getproduct["price"] = {$lt: priceLessThan}
            }
            if (size) {
                if (!(validator.isValidValue(size))) {
                    return res.status(400).send({ status: false, message: `User id ${size} is not valid` })
                }
                getproduct["availableSizes"] ={$all:size}
            }
            if ( priceGreaterThan&& priceLessThan) {
                if (!validator.isValidValue( priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: `User id ${ priceGreaterThan} is not valid` })
                }
                if (!validator.isValidValue( priceLessThan)) {
                    return res.status(400).send({ status: false, message: `User id ${ priceLessThan} is not valid` })
                }
                getproduct["price"] = {$gt: priceGreaterThan,$lt: priceLessThan}
            }
            const findbyfilter=await productModel.find(getproduct)
            if(findbyfilter.length==0)return res.status(404).send({msg:"product not found"})
            return res.status(201).send({msg:"All products",data:findbyfilter})
            
            }}catch(error){
                return res.status(500).send({status:false, Error:error.message})
            }
     }
    
     module.exports.getProduct = getProduct