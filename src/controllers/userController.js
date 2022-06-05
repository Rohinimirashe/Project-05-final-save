const userModel = require("../models/userModel.js");
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt")
const { json } = require("body-parser");


// -----------Create User-----------------------------------------------------------------------------------
const createUser = async (req, res) => {
    try {

        let data = req.body

        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, message: "Please enter your details to Register" })   //validating the parameters of body
        }

        const { fname, lname, email, phone, password, pincode } = data

        if (!validator.isValidValue(fname)) {
            return res.status(400).send({ status: false, message: "Please provide the First name" })   //fname is mandory 
        }

        if (!validator.isValidValue(lname)) {
            return res.status(400).send({ status: false, message: "Please provide the Last name" })   //lname is mandory 
        }
        if (!validator.isValidValue(email)) {
            return res.status(400).send({ status: false, message: "Please provide the Email Address" })   //email is mandory
        }
        if (!validator.validateEmail(email)) {
            return res.status(400).send({ status: false, message: "Please provide the valid Email Address" })    //Regex for checking the valid email format 
        }
        const emailUsed = await userModel.findOne({ email })    //unique is email
        if (emailUsed) {
            return res.status(400).send({ status: false, message: `${email} is already exists` })   //checking the email address is already exist or not.
        }

        if (!validator.isValidValue(phone)) {
            return res.status(400).send({ status: false, message: "Please provide the phone number" })    //phone is mandory
        }
        if (!validator.validatephone(phone)) {
            return res.status(400).send({ status: false, message: "Please provide the valid phone number" })    //Regex for checking the valid phone format
        }
        const phoneUsed = await userModel.findOne({ phone })   //phone is unique
        if (phoneUsed) {
            return res.status(400).send({ status: false, message: `${phone} is already exists` })   //checking the phone number is already exist or not.
        }
        if (!validator.isValidValue(password)) {
            return res.status(400).send({ status: false, message: "Please provide the Password" })   //password is mandory 
        }
        if (!validator.validatePassword(password)) {
            return res.status(400).send({ status: false, message: "password should be between 8-15 characters and atleast 1 character should be in upppercase" })    //Regex for checking the valid password format 
        }

        const salt = bcrypt.genSaltSync(10);

        const encryptedPassword = bcrypt.hashSync(password, salt);     // USE HASHSYNC TO SECURE YOUR PASSWORD

        const address = JSON.parse(data.address)  //converting the address into JSON form


        if (!address.shipping || (address.shipping && (!address.shipping.street.trim() || !address.shipping.city.trim() || !address.shipping.pincode))) {
            return res.status(400).send({ status: false, message: "Please provide the Shipping address" })
        }


        if (!address.billing || (address.billing && (!address.billing.street.trim() || !address.billing.city.trim() || !address.billing.pincode))) {
            return res.status(400).send({ status: false, message: "Please provid the Billing address" })
        }
        if (!validator.isValidPincode(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Please provide the valid Pincode" })    //Regex for checking the valid password format 
        }

        if (!validator.isValidPincode(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Please provide the valid Pincode" })    //Regex for checking the valid password format 
        }


        let files = req.files

        if (files && files.length > 0) {
            var profileImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        else {
            return res.status(400).send({ status: false, message: "Please upload your Profile Image" })   //profileImage is mandory
        }

        const user = {
            fname,
            lname,
            email,
            profileImage,
            phone,
            password: encryptedPassword,
            address: address
        }

        let UserData = await userModel.create(user)      //If all these validations passed , creating a user
        return res.status(201).send({ status: true, message: "You're registered successfully", data: UserData })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }
}



module.exports.createUser = createUser

// ----------------------------2nd Api-------------------------------------------------------//
const loginUser = async function (req, res) {


    try {
        let requestBody = req.body;
        if (!validator.isValidDetails(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please enter login credentials" });
        }

        let { email, password } = requestBody;
        // assignment to consant variable if we give const
        if (!validator.isValidValue(email)) {
            res.status(400).send({ status: false, msg: "enter an email" });
            return;
        }

        if (!validator.isValidValue(password)) {
            return res.status(400).send({ status: false, message: "Please provide the Password" })   //password is mandory 
        }
        const user = await userModel.findOne({ email: email });

        if (!user) {
            res.status(401).send({ status: false, msg: " Either email or password incorrect" });
            return;
        }
        const extractPassword = await userModel.findOne({ email: email });
        let hash = extractPassword.password
        let pass = await bcrypt.compare(password, hash)
        if (!pass) {
            return res.status(400).send({ status: false, message: "Password Incorrect" })
        }

        var token = jwt.sign(
            { userId: user._id.toString() },
            "project-5", {
            expiresIn: '24hr'
        });



        res.setHeader("Authorization", token)
        res.status(200).send({ status: true, msg: "successful login", data: { userId: user._id, token: token } });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

module.exports.loginUser = loginUser

// -------------------------------------3rd API-------------------------------------------------//
const getUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId;

        //checking valid userId
        if (!(validator.isValidObjectId(userId))) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

        const userDetails = await userModel.findById({ _id: userId })


        if (!userDetails) return res.status(404).send({ status: false, message: "No such User Exists" })

        return res.status(200).send({ status: true, message: "User profile details", data: userDetails })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

module.exports.getUserProfile = getUserProfile

// ----------------------------------4th Api---------------------------------------------------//
const updateUser = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId


        let { fname, lname, email, phone, password, profileImage, address } = data

        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, msg: "Please enter data to update" });
        }

        if (fname == "") {
            return res.status(400).send({ status: false, message: "Please provide name" })

        }
        else if (fname) {
            if (!validator.isValidValue(fname)) return res.status(400).send({ status: false, message: "Please provide first name" })

        }

        if (lname == "") {
            return res.status(400).send({ status: false, message: "Please provide last name" })

        }
        else if (lname) {
            if (!validator.isValidValue(lname)) return res.status(400).send({ status: false, message: "Please provide the last name to update" })

        }

        if (email == "") {
            return res.status(400).send({ status: false, message: "Please provide email" })

        }
        else if (email) {
            if (!validator.validateEmail(email)) return res.status(400).send({ status: false, message: "Please provide the valid Email Address" })

        }

        if (phone == "") {
            return res.status(400).send({ status: false, message: "Please provide Phone number" })

        }
        else if (phone) {
            if (!validator.validatephone(phone)) return res.status(400).send({ status: false, message: "Please provide the valid Phone number" })

        }

        if (password == "") {
            return res.status(400).send({ status: false, message: "Please provide password" })

        }
        else if (password) {
            if (!validator.validatePassword(password)) return res.status(400).send({ status: false, message: "Please provide password" })

        }
        if (password) {
            var salt1 = bcrypt.genSaltSync(10);

            var encryptedPassword = bcrypt.hashSync(password, salt1);
        }
        if (address) {
            const address = JSON.parse(data.address)  //converting the address into JSON form


            if (!address.shipping || (address.shipping && (!address.shipping.street || !address.shipping.city || !address.shipping.pincode))) {
                return res.status(400).send({ status: false, message: "Please provide the Shipping address" })
            }


            if (!address.billing || (address.billing && (!address.billing.street || !address.billing.city || !address.billing.pincode))) {
                return res.status(400).send({ status: false, message: "Please provid the Billing address" })
            }
        }

        if (profileImage) {
            let files = req.files

            if (files && files.length > 0) {
                var updateImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
            }
            else {
                return res.status(400).send({ status: false, message: "Please upload your Profile Image" })   //profileImage is mandory
            }
        }

        const updatedData = await userModel.findOneAndUpdate({ _id: userId },
            { fname: fname, lname: lname, email: email, phone: phone, password: encryptedPassword, profileImage: updateImage, address: address }, { new: true })
        res.send({ Data: updatedData })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }

}
module.exports.updateUser = updateUser







