const Signup = require('../models/userSignup');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
exports.home = async (req, res) => {
    res.status(201).json({ message: "Welcome To Bank Api" });
};

exports.userSignup = async (req, res) => {
    try {
        let { name, email, mobile_number, pin, upi_id } = req.body;
        // console.log(req.body);
        const token = jwt.sign({ email }, 'sdhvhjqcsdqjsa', { expiresIn: "1h" });
        const user = new Signup({ name, email, mobile_number, pin, upi_id, token });
        await user.save();
        return res.status(201).json({ message: "User Signup Successfully", user });
    } catch (error) {
        return res.status(500).json(error);
    }
};

exports.userLogin = async (req, res) => {
    try {
        let { email, pin } = req.body;
        const user = await Signup.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "User Not Found" });
        }
        if (user.pin !== pin) {
            return res.status(401).json({ message: "Invalid Password" });
        }
        req.session.user = user;
        return res.status(201).json({ message: "User Login Successfully", user });
    } catch (error) {
        return res.status(500).json(error);
    }
};

exports.bank = async (req, res) => {
    try {
        let { bank_name, bank_account_number, ifsc_code, bank_account_holder_name } = req.body;
        const user = await Signup.findById(req.session.user._id);
        if (!user) {
            return res.status(401).json({ message: "User Not Found Please Login First" });
        }
        const newBankDetail = {
            bank_name,
            bank_account_number,
            ifsc_code,
            bank_account_holder_name
        };
        user.bank_detail.push(newBankDetail);
        await user.save();
        return res.status(201).json({ message: "Bank Detail Saved Successfully", user });
    } catch (error) {
        return res.status(500).json(error);
    }
};
exports.addWallet = async(req,res)=>{
    try {
        let { amount } = req.body;
        const user = await Signup.findById(req.session.user._id);

        if (!user) {
            return res.status(401).json({ message: "User Not Found. Please Login First" });
        }

        let currentBalance = parseInt(user.wallet_balance);
        let newBalance = currentBalance + parseInt(amount);

        user.wallet_balance = newBalance.toString();
        await user.save();

        res.status(201).json({ message: "Money Added to Wallet Successfully", wallet_balance: user.wallet_balance });
    } catch (error) {
        res.status(501).json(error);
    }
}
exports.users = async(req,res)=>{
    try{
        let user = await Signup.find({});
        res.status(201).json(user)
    }catch(error){
        res.status(501).json(error);

    }
}


// qr code post 
exports.generate = async(req,res)=>{
    try{
        const user = await Signup.findById(req.session.user._id)
        if(!user){
            return res.status(501).json({message:"Please Login First User Not Found"})
        }
        const upiId = user.upi_id;
        const qrcodeData = await QRCode.toDataURL(upiId)

        user.qr_code = qrcodeData
        await user.save();
        res.status(201).json({qrcodeData})
    }catch(error){
        res.status(501).json({message:error})

    }
}

exports.getQRCode = async (req, res) => {
    try {
        const user = await Signup.findById(req.session.user._id);
        if (!user) {
            return res.status(401).json({ message: "User Not Found. Please Login First" });
        }

        res.status(200).json({ qrCodeData: user.qr_code });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.SendMoney = async (req, res) => {
    try {
        let { qrData, amount } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const sender = await Signup.findById(req.session.user._id);
        if (!sender) {
            return res.status(401).json({ message: "User Not Found. Please Login First" });
        }

        let senderBalance = parseInt(sender.wallet_balance);
        let transferAmount = parseInt(amount);

        if (senderBalance < 0) {
            return res.status(400).json({ message: "Invalid sender balance" });
        }

        if (senderBalance < transferAmount) {
            return res.status(400).json({ message: "Insufficient Balance" });
        }

        const receiver = await Signup.findOne({ upi_id:qrData  });
        if (!receiver) {
            return res.status(404).json({ message: "Receiver Not Found" });
        }

        let receiverBalance = parseInt(receiver.wallet_balance);

        sender.wallet_balance = (senderBalance - transferAmount).toString();
        receiver.wallet_balance = (receiverBalance + transferAmount).toString();

        await sender.save();
        await receiver.save();

        res.status(201).json({
            message: "Money Sent Successfully",
        });
    } catch (error) {
        res.status(500).json(error);
    }
};
exports.sendViaBank = async(req,res)=>{
    try{
        let {sender_bank_account_number  , receiver_bank_account_number , amount}=req.body;
        if(!amount || amount<=0){
            return res.status(400).json({message:"Invalid amount"})
        }
        let sender = await Signup.findOne({'bank_detail.bank_account_number':sender_bank_account_number })
        if(!sender){
            return res.status(400).json({message:"Sender Bank Account Not Found"})
        }
        let receiver = await Signup.findOne({'bank_detail.bank_account_number':receiver_bank_account_number})
        if(!receiver){
            return res.status(400).json({message:"Receiver Bank Account Not Found"})
        } 
        const senderBank = sender.bank_detail.find(bank=>bank.bank_account_number === sender_bank_account_number)
        const senderBalance = parseFloat(senderBank.wallet);
        const transferAmount = parseFloat(amount);

        if(senderBalance < transferAmount){
            return res.status(400).json({ message: "Insufficient balance" });
        }
        const receiverBank = receiver.bank_detail.find(bank=>bank.bank_account_number === receiver_bank_account_number)
        const receiverBalance = parseFloat(receiverBank.wallet)

        senderBank.wallet = (senderBalance - transferAmount).toString();
        receiverBank.wallet = (receiverBalance + transferAmount).toString();
        
        await sender.save();
        await receiver.save();
        res.status(200).json({ message: "Money sent successfully" });
    }catch(error){
        res.status(500).json(error);
    }
}
// self transfer 
exports.selfTransfer = async(req,res)=>{
    try{
        let {bank_account_number, amount} = req.body
        if(!amount || amount<=0){
            return res.status(400).json({message:"Invalid amount"})
        }
        let  user = await Signup.findById(req.session.user._id);
        if (!user) {
            return res.status(401).json({ message: "User Not Found. Please Login First" });
        }
        const bankAccount = user.bank_detail.find(bank=>bank.bank_account_number === bank_account_number)

        if (!bankAccount) {
            return res.status(400).json({ message: "Bank Account Not Found" });
        }

        const bankWalletBalance = parseFloat(bankAccount.wallet);
        const transferAmount = parseFloat(amount);

        if (bankWalletBalance < transferAmount) {
            return res.status(400).json({ message: "Insufficient funds in bank account" });
        }

        bankAccount.wallet = (bankWalletBalance - transferAmount).toString();
        user.wallet_balance = (parseFloat(user.wallet_balance) + transferAmount).toString()
        await user.save();
        res.status(200).json({ message: "Money transferred to wallet successfully", wallet_balance: user.wallet_balance });
    }catch(error){
        res.status(500).json(error);

    }
}