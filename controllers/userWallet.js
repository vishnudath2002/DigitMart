const Wallet = require('../models/wallet')


exports.viewWallet = async (req, res , next) => {
    try {

        const userId = req.session.userId;

        const wallet = await Wallet.findOne({ User_id: userId }).populate('User_id');

        if (!wallet) {
            return res.render('user/wallet', { wallet: null });
        }

        res.render('user/wallet', { wallet , Razorpay });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.addMoneyToWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.userId; 

          
        let wallet = await Wallet.findOne({ User_id: userId });

        if (!wallet) {
         
            wallet = new Wallet({
                User_id: userId,
                Balance: 0,
                History: []
            });
        }

       
        const oldBalance = wallet.Balance;
        wallet.Balance += Number(amount);
        wallet.History.push({
            amount,
            status: 'Deposit',
            oldBalance
        });

       
        await wallet.save();

        res.status(200).json({ message: 'Money added successfully', balance: wallet.Balance });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.withdrawMoneyFromWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.userId;

       
        let wallet = await Wallet.findOne({ User_id: userId });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        if (wallet.Balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const oldBalance = wallet.Balance;
        wallet.Balance -= Number(amount);
        wallet.History.push({
            amount,
            status: 'Withdrawal',
            oldBalance
        });

     
        await wallet.save();

        res.status(200).json({ message: 'Money withdrawn successfully', balance: wallet.Balance });
    } catch (err) {
        console.error(err);
        next(err);
    }
};