const jwt = require('jsonwebtoken')
const userModel = require('../model/userModel')
const { isValidObjectId } = require('../validators/validation')




const authentication = async function (req, res, next) {
    try {
        let token = req.header('Authorization')
        // console.log(token)
        if (!token) return res.status(401).send({ status: false, message: "token is missing" })

        let splitToken = token.split(" ")
        token = splitToken[1]
        console.log(token)

        jwt.verify(token, "project-5-group-33", (error, token) => {

            if (error) return res.status(401).send({ status: false, message: error.message });
            req["decodedToken"] = token.id;
            console.log(token.id)
            next();
        });


    } catch (err) {
        res.status(500).send({ status: false, message: err.message })

    }
}


const authorization = async function (req, res, next) {
   let  userId = req.params.userId
   let  validId = req.decodedToken

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter Valid user Id" })

    let checkUser = await userModel.findById({_id:userId})
    console.log(checkUser)
    if (!checkUser) return res.status(404).send({ status: false, message: "user not Found" })

    if (userId != validId) return res.status(403).send({ status: false, message: "you are not authorized " })
    next()
}

module.exports.authentication = authentication;
module.exports.authorization = authorization;