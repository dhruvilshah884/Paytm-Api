const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
    bank_name: {
        type: String,
        required: true
    },
    bank_account_number: {
        type: String,
        required: true
    },
    ifsc_code: {
        type: String,
        required: true
    },
    bank_account_holder_name: {
        type: String,
        required: true
    },
    wallet: {
        type: String,
        default: '0'
    }
});

const userSignup = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile_number: {
        type: Number,
        required: true
    },
    pin: {
        type: String,
        required: true
    },
    upi_id: {
        type: String,
        required: true
    },
    wallet_balance: {
        type: String,
        default: '0'
    },
    token:{
        type:String
    },
   qr_code: String,
    bank_detail: [bankSchema]
});

const Signup = mongoose.model("Signup", userSignup);


module.exports = Signup;
