const userModel = require("../models/userModel.js");
const productModel = require('../models/productModel')
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');
const currencySymbol = require("currency-symbol-map")

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createProduct = async function (req, res) {
    try {
        let data = req.body


        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, message: "Please enter your details to Create Product" })   //validating the parameters of body
        }

        let { title, description, price, currencyId, availableSizes, isFreeShipping, installments, style } = data

        if (!validator.isValidValue(title)) {
            return res.status(400).send({ status: false, message: "Please provide select title" })
        }
        const titleUsed = await productModel.findOne({ title })
        if (titleUsed) {
            return res.status(400).send({ status: false, msg: `${title} is already used` })
        }

        if (!validator.isValidValue(description)) {
            return res.status(400).send({ status: false, msg: "plese provide des of product" })
        }

        if (!validator.isValidValue(price)) {
            return res.status(400).send({ status: false, message: "Please provide product price" })
        }
        //NaN(not a number) return true if a number is NAN
        // NAN convert the value to a number

        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, msg: " price should be valid number" })
        }

        if (!validator.isValidValue(currencyId)) {
            return res.status(400).send({ status: false, msg: "provide currencyid" })
        }

        // check currencyid equal to or not to INR
        if (currencyId != "INR") {
            return res.status(400).send({ status: false, msg: 'currencyId should be INR' })
        }


        if (!validator.isValidValue(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please provide the size " })   //availableSizes is mandory
        }

        if (availableSizes) {
            var arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            var arr2 = availableSizes.toUpperCase().split(",").map((s) => s.trim())

            for (let i = 0; i < arr2.length; i++) {
                if (!(arr1.includes(arr2[i]))) {
                    return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                }
            }
        }

        if (installments) {
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({ status: false, msg: "instalment can not be a decimal number" })
            }
        }

        if (isFreeShipping) {
            if (!(validator.Shipping(isFreeShipping))) {
                return res.status(400).send({ status: false, msg: "isFreeShipping must be  true or false." })
            }
        }

        let files = req.files
        if (files && files.length > 0) {
            var productImage = await awsConfig.uploadFile(files[0])   //upload to s3 and get the uploaded link
        }
        else {
            return res.status(400).send({ status: false, msg: 'please upload product image' })
        }
        let currencyFormat = "Rupees"

        const product = {
            title, description, currencyFormat: currencyFormat, price, currencyId, isFreeShipping,
            productImage, style, availableSizes, installments
        }

        let productData = await productModel.create(product) // //If all these validations passed , creating a product
        return res.status(201).send({ status: true, message: "New Product created successfully", data: productData })
    }

    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }
}

module.exports.createProduct = createProduct


const updateproduct = async function (req, res) {
    try {
        let data = req.body
        let productId = req.params.productId
        let { title, description, availableSizes, isFreeShipping, price, style, installments } = data

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid productID" })
        }
        let ProductId = await productModel.findById(productId)
        if (!ProductId) {
            return res.status(400).send({ status: false, message: "No product found" })
        }
        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, msg: "Please enter data to update" });
        }

        if (title == "") {
            return res.status(400).send({ status: false, message: "Please provide title" })

        }
        else if (title) {
            if (!validator.isValidValue(title)) return res.status(400).send({ status: false, message: "Please provide title" })

        }

        if (description == "") {
            return res.status(400).send({ status: false, message: "Please provide description" })

        }
        else if (description) {
            if (!validator.isValidValue(description)) return res.status(400).send({ status: false, message: "Please provide description" })

        }

        if (availableSizes == "") {
            return res.status(400).send({ status: false, message: "Please provide size to update" })

        }
        else if (availableSizes) {
            if (!validator.isValidValue(availableSizes)) return res.status(400).send({ status: false, message: "Please provide size to update" })

        }

        if (isFreeShipping == "") {
            return res.status(400).send({ status: false, message: "Please provide shipping filter" })

        }
        else if (isFreeShipping) {
            if (!validator.isValidValue(isFreeShipping)) return res.status(400).send({ status: false, message: "Please provide shipping filter" })

        }

        if (price == "") {
            return res.status(400).send({ status: false, message: "Please provide price" })

        }
        else if (price) {
            if (!validator.isValidValue(price)) return res.status(400).send({ status: false, message: "Please provide price" })

        }

        if (style == "") {
            return res.status(400).send({ status: false, message: "Please provide style" })

        }
        else if (style) {
            if (!validator.isValidValue(style)) return res.status(400).send({ status: false, message: "Please provide style" })

        }


        if (installments == "") {
            return res.status(400).send({ status: false, message: "Please provide installment to update" })

        }
        else if (installments) {
            if (!validator.isValidValue(installments)) return res.status(400).send({ status: false, message: "Please provide installment to update" })

        }

        let files = req.files

        if (files && files.length > 0) {
            var updateImage = await awsConfig.uploadFile(files[0])

        }

        const updatedData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false },
            { title: title, description: description, availableSizes: availableSizes, isFreeShipping: isFreeShipping, price: price, style: style, productImage: updateImage, installments: installments }, { new: true })
        res.send({ Data: updatedData })
    }

    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

}

module.exports.updateproduct = updateproduct

const getproducts = async function (req, res) {
    try {
        let filter = req.query
        let Name = filter.name
        let size = filter.size
        let priceGreaterThan = filter.priceGreaterThan
        let priceLessThan = filter.priceLessThan



        if (Name) {
            if (!(validator.isValidValue(Name)))

                return res.status(400).send({ msg: "please give valid input" })
            const product = await productModel.find({ title: Name, isDeleted: false })
            if (product.length == 0) return res.status(404).send({ msg: "product not found" })

            return res.status(200).send({ msg: "All products", data: product })

        }
        if (size) {
            if (!(validator.isValidValue(size)))
                return res.status(400).send({ msg: "please give valid input" })

            const product = await productModel.find({ availableSizes: size, isDeleted: false })
            if (product.length == 0) return res.status(404).send({ msg: "product not found" })

            return res.status(200).send({ msg: "All products", data: product })

        }
        if (priceGreaterThan && priceLessThan) {
            if (!validator.isValidValue(priceGreaterThan))

                return res.status(400).send({ msg: "please give valid input" })
            if (!validator.isValidValue(priceLessThan))

                return res.status(400).send({ msg: "please give valid input" })

            const product = await productModel.find({ price: { $gt: priceGreaterThan, $lt: priceLessThan }, isDeleted: false }).sort({ price: 1 })

            if (product.length == 0) return res.status(404).send({ msg: "product not found" })
            return res.status(200).send({ msg: "All products", data: product })

        } if (priceLessThan) {
            if (!(validator.isValidValue(priceLessThan)))

                return res.status(400).send({ msg: "please give valid input" })

            const product = await productModel.find({ price: { $lt: priceLessThan }, isDeleted: false }).sort({ price: -1 })
            if (product.length == 0) return res.status(404).send({ msg: "product not found" })

            return res.status(200).send({ msg: "All products", data: product })

        } if (priceGreaterThan) {
            if (!validator.isValidValue(priceGreaterThan))

                return res.status(400).send({ msg: "please give valid input" })

            const product = await productModel.find({ price: { $gt: priceGreaterThan }, isDeleted: false }).sort({ price: 1 })
            if (product.length == 0) return res.status(404).send({ msg: "product not found" })

            return res.status(200).send({ msg: "All products", data: product })

        }
    }

    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }


}


module.exports.getproducts = getproducts

const getProductById = async function (req, res) {
    try {

        const productId = req.params.productId;
        if (!(validator.isValidObjectId(productId))) return res.status(400).send({ status: false, message: "Please provide valid productId" })

        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productDetails) return res.status(404).send({ status: false, message: "No such product exists" })

        return res.status(200).send({ status: true, message: 'Success', data: productDetails })

    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

module.exports.getProductById = getProductById

const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in params." })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }
        await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, message: 'Successfully deleted' })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

module.exports.deleteProductById = deleteProductById
