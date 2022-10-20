const userModel = require("../model/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { uploadFile } = require('../validators/aws')
const mongoose = require("mongoose")

// const validation = require("../validators/validation")
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
        let { fname, lname, email, password, phone, address, profileImage } = data
        files = req.files


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
        if (!address) return res.status(400).send({ status: false, msg: "address requried" })
        //var address1 = JSON.parse(address)

        //=============ADDRESS-SHIPPING==================
        if (address) {
            if (!isValid(data.address.shipping.street))
                return res.status(400).send({ status: false, message: "street field is required or not valid" })

            if (!isValid(data.address.shipping.city))
                return res.status(400).send({ status: false, message: "city field is required or not valid" })

            if (!isValid(data.address.shipping.pincode))
                return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

            if (!isValidPincode(data.address.shipping.pincode))
                return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })


            //=============ADDRESS-SHIPPING==================

            if(!data.address.billing) return res.status(400).send({status:false, message:"can't empty billing.street"})

            if (!isValid(data.address.billing.street))
                return res.status(400).send({ status: false, message: "street field is required or not valid" })

            if (!isValid(data.address.billing.city))
                return res.status(400).send({ status: false, message: "city field is required or not valid" })

            if (!isValid(data.address.billing.pincode))
                return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

            if (!isValidPincode(data.address.billing.pincode))
                return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
        }

        if (files.length == 0) return res.status(404).send({status:false, message:""})
        if (files.length > 0) {
            if (files && files.length > 0) {
                //upload to s3 and get the uploaded link
                // res.send the link back to frontend/postman
                let uploadedFileURL = await uploadFile(files[0])

                data['profileImage'] = uploadedFileURL

            }
        }

        const saltRounds = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, saltRounds)
        data.password = hash

        //data.address = address
        let createUser = await userModel.create(data)
        return res.status(201).send({ status: true, message: "user created successfully", data: createUser })

    }

    catch (err) {
        return res.status(500).send({ msg: "Error", error: err.message })
    }
}








const loginUser = async function (req, res) {
    try {
        let data = req.body;
        let { email, password } = data


        if (!isValid(email)) return res.status(400).send({ message: "email required" })
        if (!isValid(password)) return res.status(400).send({ message: "password required" })

        let User = await userModel.findOne({ email: email })

        if (!User)
            return res.status(400).send({ status: false, message: "Invalid credentials" })


        let decrypt = await bcrypt.compare(password, User.password)

        if (!decrypt) {
            return res.status(401).send({ status: false, msg: "Invalid credentials" })
        }

        let key = jwt.sign(
            {
                username: "Anul,meenakshi,mayank,rajan",
                id: User._id.toString(),
            },
            "project-5-group-33", { expiresIn: "10h" })

        res.setHeader("Authorization", key)


        let savedData = { userId: User._id, token: key }
        res.status(200).send({ status: true, message: "User login successfull", data: savedData })


    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
};

const getUserDetails = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "User Id is not valid" });

        const userDetails = await userModel.findById({ _id: userId })
        if (!userDetails) { return res.status(404).send({ status: false, message: "User Id does not exist" }) }

        return res.status(200).send({ status: true, message: "User profile details", data: userDetails })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }
}

const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!userId) return res.status(400).send({ status: false, message: "userId is required" })

        if (!isValidObjectId(userId)) return res.status(404).send({ status: false, message: "userId is wrong" })

        let { fname, lname, email, password, phone, address, profileImage } = req.body;
        let data = {}
        // if(!fname || !lname || !email || !password || !phone  || !profileImage) 
        // return res.status(404).send({ message: 'please provide required fied' }) 


        if (!isValidRequestBody(req.body))
            return res.status(400).send({ status: false, msg: "please provide  details to update" })

        //========================================NAME=====================================================

        if (fname) {
            if (!isValid(fname))
                return res.status(400).send({ status: false, message: "first name is required or not valid" })
            if (!nameFormet(fname))
                return res.status(404).send({ status: false, message: "fname formet is wrong" })
            data.fname = fname
        }

        if (lname) {
            if (!isValid(lname))
                return res.status(400).send({ status: false, message: "last name is required or not valid" })
            if (!nameFormet(lname))
                return res.status(404).send({ status: false, message: "lname formet is wrong" })
            data.lname = lname
        }

        //============================================EMAIL====================================================
        if (email) {
            if (!isValid(email))
                return res.status(400).send({ status: false, message: "email is required or not valid" })

            if (!isValidEmail(email))
                return res.status(400).send({ status: false, message: "email is not valid" })

            let checkEmail = await userModel.findOne({ email: email })

            if (checkEmail) return res.status(409).send({ status: false, msg: "email already exist" })
            data.email = email
        }
        //==========================================PASSWORD================================================
        if (password) {
            if (!isValid(password))
                return res.status(400).send({ status: false, message: "Password is required or not valid" })

            if (!isValidPassword(password))
                return res.status(400).send({ status: false, message: "Password length should be 8 to 15 digits and enter atleast one uppercase or lowercase" })
            data.password = password
        }

        //===========================================PHONE=================================================
        if (phone) {
            if (!isValid(phone))
                return res.status(400).send({ status: false, message: "phone is required or not valid" })

            if (!isValidNumber(phone))
                return res.status(400).send({ status: false, message: "phone number is not valid" })

            let checkPhone = await userModel.findOne({ phone: phone })

            if (checkPhone) return res.status(409).send({ status: false, msg: "Phone already exist" })
            data.phone = phone
        }
        //===========================================ADDRESS==============================================
        //if (!address) return res.status(400).send({ status: false, msg: "address requried" })
        //var address1 = JSON.parse(address)

        //=============ADDRESS-SHIPPING==================
        if (address) {
            if (address.shipping) {
                if (!isValid(data.address.shipping.street))
                    return res.status(400).send({ status: false, message: "street field is required or not valid" })
                data.address.shipping.street = address.shipping.street

                if (!isValid(data.address.shipping.city))
                    return res.status(400).send({ status: false, message: "city field is required or not valid" })
                data.address.shipping.city = address.shipping.city

                if (!isValid(data.address.shipping.pincode))
                    return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

                if (!isValidPincode(data.address.shipping.pincode))
                    return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
                data.address.shipping.pincode = address.shipping.pincode
            }

            //=============ADDRESS-BILLING==================
            if (address.billing) {
                if (!isValid(data.address.billing.street))
                    return res.status(400).send({ status: false, message: "street field is required or not valid" })
                data.address.billing.street = address.billing.pincode.street

                if (!isValid(data.address.billing.city))
                    return res.status(400).send({ status: false, message: "city field is required or not valid" })
                data.address.billing.city = address.billing.pincode.city

                if (!isValid(data.address.billing.pincode))
                    return res.status(400).send({ status: false, message: "pincode field is required or not valid" })

                if (!isValidPincode(data.address.billing.pincode))
                    return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
                data.address.billing.pincode = address.billing.pincode
            } ad
        }

        let file = req.files
        if (profileImage) {
            if (file && file.length > 0) {

                let uploadedFileURL = await uploadFile(file[0])
                data['profileImage'] = uploadedFileURL

            }
        }
        if (password) {
            const saltRounds = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, saltRounds)
            data.password = hash
        }
        //data.address = address
        let updatedUser = await userModel.findOneAndUpdate({
            _id: userId
        }, {
            $set: data
        }, {
            new: true
        })
        return res.status(200).send({ status: true, message: "user Updated successfully", data: updatedUser })

    }

    catch (err) {
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports = { createUser, loginUser, getUserDetails, updateUser }    