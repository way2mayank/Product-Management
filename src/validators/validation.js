const userModel = require("../model/userModel")



const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length > 0) return true;
};

const isValidRequestBody = function (object) {
    return Object.keys(object).length > 0;
};

const isValidEmail = function (email) {
    const regexForEmail = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
    return regexForEmail.test(email);
};

const isValidPhone = function (phone) {
    const regexForMobile = /^[6-9]\d{9}$/;
    return regexForMobile.test(phone);
};