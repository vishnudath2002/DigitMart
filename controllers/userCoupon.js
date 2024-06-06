const Address = require('../models/address');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');
const Wallet = require('../models/wallet')




exports.applyCoupon = async (req, res , next) => {
    try {
        const { couponCode } = req.body;

        req.session.couponNum = couponCode;

        const cart = await Cart.findOne({ User_id: req.session.userId }).populate('Items.Product');
        if (!cart || cart.Items.length === 0) {
            return res.status(404).send('Cart is empty');
        }

        const currentDate = new Date();
        const coupon = await Coupon.findOne({
            Coupons: couponCode,
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate }
        });
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }


        const address = await Address.findOne({ User_id: req.session.userId });


        let discountedPrice = cart.TotalAmount;

        const products = cart.Items.map(item => ({
            product: item.Product,
            quantity: item.Quantity
        }));


        if (coupon) {
            const discountPercentage = coupon.Discount_amount;
            const discountAmount = (discountPercentage / 100) * cart.TotalAmount;
            discountedPrice -= discountAmount;
        }

        discountedPrice = Math.max(discountedPrice, 0);

        const wallet = await Wallet.findOne({ User_id: req.session.userId })

        res.render('user/CreateOrder', { address, cart, discountedPrice, products, wallet });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.removeCoupon = async (req, res , next) => {


    try {

        req.session.couponNum = null;

        const currentDate = new Date();

        const cart = await Cart.findOne({ User_id: req.session.userId }).populate('Items.Product');
        if (!cart || cart.Items.length === 0) {
            return res.status(404).send('Cart is empty');
        }
        
        const coupons = await Coupon.find({ 
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate }
        });

        const address = await Address.findOne({ User_id: req.session.userId });

        const products = cart.Items.map(item => ({
            product: item.Product,
            quantity: item.Quantity
        }));

        const wallet = await Wallet.findOne({ User_id: req.session.userId })

        res.render('user/CreateOrder', { address, cart, products, wallet , coupons });
    } catch (err) {
        console.error(err);
        next(err);
    }
};