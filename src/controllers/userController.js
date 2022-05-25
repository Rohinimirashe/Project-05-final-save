const userModel = require("../models/userModel.js");
const validator = require('../utils/validator.js');
const awsConfig = require('../utils/awsConfig')
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { json } = require("body-parser");


// -----------Create User-----------------------------------------------------------------------------------
const createUser = async (req, res) => {
    try{
        // const query = req.query

        // if(Object.keys(query) != 0) {
        //     return res.status(400).send({status: false, message: "Invalid params present in URL"})
        // }

        let data = req.body

        if (!validator.isValidDetails(data)){
            return res.status(400).send({ status: false, message: "Please enter your details to Register" })   //validating the parameters of body
        }

        const { fname, lname, email, phone, password } = data

        if (!validator.isValidValue(fname)){
            return res.status(400).send({status: false, message: "Please provide the First name"})   //fname is mandory 
        }
        if (!validator.isValidValue(lname)){
            return res.status(400).send({status: false, message: "Please provide the Last name"})   //lname is mandory 
        }
        if (!validator.isValidValue(email)){
            return res.status(400).send({status: false, message: "Please provide the Email Address"})   //email is mandory
        }
        if(!validator.validateEmail(email)){
            return res.status(400).send({status: false, message: "Please provide the valid Email Address"})    //Regex for checking the valid email format 
        }
        const emailUsed = await userModel.findOne({email})    //unique is email
        if(emailUsed){
            return res.status(400).send({status: false, message:`${email} is already exists`})   //checking the email address is already exist or not.
        }
        
        if (!validator.isValidValue(phone)){
            return res.status(400).send({status: false, message: "Please provide the phone number"})    //phone is mandory
        }
        if(!validator.validatephone(phone)){
            return res.status(400).send({status: false, message: "Please provide the valid phone number"})    //Regex for checking the valid phone format
        }
        const phoneUsed = await userModel.findOne({phone})   //phone is unique
        if(phoneUsed){
            return res.status(400).send({status: false, message: `${phone} is already exists`})   //checking the phone number is already exist or not.
        }    
        if (!validator.isValidValue(password)){
            return res.status(400).send({status: false, message: "Please provide the Password"})   //password is mandory 
        }
        if(!validator.validatePassword(password)){
            return res.status(400).send({status: false, message: "Please provide the valid Password"})    //Regex for checking the valid password format 
        }

        const salt = bcrypt.genSaltSync(10);

        const encryptedPassword = bcrypt.hashSync(password, salt);     // USE HASHSYNC TO SECURE YOUR PASSWORD

        const address = JSON.parse(data.address )  //converting the address into JSON form
        console.log(address)
        
        if(!address.shipping ||(address.shipping && (!address.shipping.street || !address.shipping.city || !address.shipping.pincode))){
            return res.status(400).send({status: false, message: "Please provide the Shipping address"})
        } 
        

        if(!address.billing || (address.billing && (!address.billing.street || !address.billing.city || !address.billing.pincode))){
            return res.status(400).send({status: false, message: "Please provid the Billing address"})
        } 



        let files = req.files

        if (files && files.length > 0) {      
            var profileImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        else {
            return res.status(400).send({status: false, message: "Please upload your Profile Image"})   //profileImage is mandory
        }
        
        const user = {
            fname,
            lname,
            email,
            profileImage,
            phone,
            password: encryptedPassword,
            address:address
       }

       let UserData = await userModel.create(user)      //If all these validations passed , creating a user
            return res.status(201).send({status: true , message: "You're registered successfully", data: UserData })
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}



module.exports.createUser = createUser

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

        if (!validator.isValidValue(password)){
            return res.status(400).send({status: false, message: "Please provide the Password"})   //password is mandory 
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
            {userId: user._id.toString()},
             "Project-5", {
            expiresIn: '24hr'
         });



        res.header('Authorization', token)
        res.status(200).send({ status: true, msg: "successful login", data: { userId: user._id, token: token } });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

module.exports.loginUser = loginUser


const getUserProfile = async function (req, res) {
    try{
        const userId = req.params.userId;
    
        //checking valid userId
        if (!(validator.isValidObjectId(userId))) return res.status(400).send({ status: false, message: "Please Provide valid userId" })
    
        //checking for authorized user
        // if (userId != req.headers["userid"]) return res.status(401).send({ status: false, message: "User is not Authorized" })
    
    
        const userDetails = await userModel.findById({ _id: userId })
    
        if (!userDetails) return res.status(404).send({ status: false, message: "No such User Exists" })
    
        return res.status(200).send({ status: true, message: "User profile details", data: userDetails })
    }catch(error){
        return res.status(500).send({status:false, Error:error.message})
    }
    }

    module.exports.getUserProfile = getUserProfile


const updateUser= async function(req,res){
  let data=req.body
  let userId=req.params.userId
  let{fname,lname,email,phone,password,profileImage}=data

if(fname)
if (!validator.isValidValue(data.fname)){
    return res.status(400).send({status: false, message: "Please provide the First name"})   //fname is mandory 
}

if(lname)
if (!validator.isValidValue(data.lname)){
    return res.status(400).send({status: false, message: "Please provide the Last name"})   //lname is mandory 
}

if(email)
if(!validator.validateEmail(data.email)){
    return res.status(400).send({status: false, message: "Please provide the valid Email Address"})    //Regex for checking the valid email format 

}

if(phone)
if (!validator.isValidValue(phone)){
    return res.status(400).send({status: false, message: "Please provide the phone number"})    //phone is mandory
}

if(phone)
if(!validator.validatephone(phone)){
    return res.status(400).send({status: false, message: "Please provide the valid phone number"})    //Regex for checking the valid phone format
}

if(password)
if (!validator.isValidValue(data.password)){
    return res.status(400).send({status: false, message: "Please provide the Password"})   //password is mandory 
}

if(password)
if(!validator.validatePassword(data.password)){
    return res.status(400).send({status: false, message: "Please provide the valid Password"})    //Regex for checking the valid password format 
}

let files = req.files

        if (files && files.length > 0) {      
            var updateImage = await awsConfig.uploadFile(files[0])      //upload to s3 and get the uploaded link
        }
        

const salt = bcrypt.genSaltSync(10);

const encryptedPassword = bcrypt.hashSync(password, salt); 

  const updatedData= await userModel.findOneAndUpdate({ _id:userId },{fname:fname , lname:lname , email:email ,phone:phone,password:encryptedPassword,profileImage:updateImage},{new:true})
  res.send({Data:updatedData})
  console.log(updatedData)

}
module.exports.updateUser = updateUser







