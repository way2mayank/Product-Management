const userModel = require("../model/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const {uploadFile}= require('../validators/aws')

const mongoose = require("mongoose")

const validation= require("../validators/validation")
const {
    isValid,
    isValidEmail,
    isValidNumber,
    isValidRequestBody,
    isValidObjectId,
    isValidPincode,
    isValidPassword,
    nameFormet
} = require("../validators/validation")



const createUser = async function (req, res) {
    try {
        let data = req.body;
        let files = req.files
        let { fname, lname, email, password, phone, address,profileImage } = data

        // if(!fname || !lname || !email || !password || !phone  || !profileImage) 
        // return res.status(404).send({ message: 'please provide required fied' })

    
    if (!isValidRequestBody(data))
        return res.status(400).send({ status: false, msg: "please provide  details" })

    //========================================NAME=====================================================

    if (!isValid(fname))
        return res.status(400).send({ status: false, message: "first name is required or not valid" })
    if (!nameFormet(fname)) return res.status(404).send({ status: false, message: "fname formet is wrong" })

    if (!isValid(lname))
        return res.status(400).send({ status: false, message: "last name is required or not valid" })
    if (!nameFormet(fname)) return res.status(404).send({ status: false, message: "lname formet is wrong" })


    //============================================EMAIL====================================================
    if (!isValid(email))
        return res.status(400).send({ status: false, message: "email is required or not valid" })

    if (!isValidEmail(email))
        return res.status(400).send({ status: false, message: "email is not valid" })

    let checkEmail = await userModel.findOne({ email: email })

    if (checkEmail) return res.status(409).send({ status: false, msg: "email already exist" })


    //==========================================PASSWORD================================================
    if (!isValid(password))
        return res.status(400).send({ status: false, message: "Password is required or not valid" })

    if (!isValidPassword(password))
        return res.status(400).send({ status: false, message: "Password length should be 8 to 15 digits and enter atleast one uppercase or lowercase" })


    //===========================================PHONE=================================================
    if (!isValid(phone))
        return res.status(400).send({ status: false, message: "phone is required or not valid" })

    if (!isValidNumber(phone))
        return res.status(400).send({ status: false, message: "phone number is not valid" })

    let checkPhone = await userModel.findOne({ phone: phone })

    if (checkPhone) return res.status(409).send({ status: false, msg: "Phone already exist" })

    //===========================================ADDRESS==============================================
   // if (!address) return res.status(400).send({ status: false, msg: "address requried" })
    //var address1 = JSON.parse(address)

    //=============ADDRESS-SHIPPING==================
    if(address){
    if (!isValid(data.address.shipping.street))
        return res.status(400).send({ status: false, message: "street field is required or not valid" })

    if (!isValid(data.address.shipping.city))
        return res.status(400).send({ status: false, message: "city field is required or not valid" })

    if (!isValid(data.address.shipping.pincode))
        return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

    if (!isValidPincode(data.address.shipping.pincode))
        return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })


    //=============ADDRESS-SHIPPING==================
    if (!isValid(data.address.billing.street))
        return res.status(400).send({ status: false, message: "street field is required or not valid" })

    if (!isValid(data.address.billing.city))
        return res.status(400).send({ status: false, message: "city field is required or not valid" })

    if (!isValid(data.address.billing.pincode))
        return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

    if (!isValidPincode(data.address.billing.pincode))
        return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
    }
    // if (files && files.length == 0) {


    //     return res.status(400).send({ msg: "No file found" })
    // }
    // let uploadedFileURL = await aws.uploadFile(files[0])

    // data.profileImage = uploadedFileURL

    let file = req.files

    if(file && file.length>0){
        //upload to s3 and get the uploaded link
        // res.send the link back to frontend/postman
        let uploadedFileURL= await uploadFile(file[0])

        data['profileImage'] = uploadedFileURL
        
    }

    const saltRounds = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, saltRounds)
    data.password = hash

    //data.address = address
    let createUser = await userModel.create(data)
    return res.status(201).send({ status: true, message: "user created successfully",data: createUser })

}

    catch (err) {
    console.log("This is the error :", err.message)
    res.status(500).send({ msg: "Error", error: err.message })
}
}

module.exports = {createUser}