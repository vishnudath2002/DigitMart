const User = require('../models/user');
const Category = require('../models/category');
const Address = require('../models/address');
const Order = require('../models/order');
const Product = require('../models/product');
const Otp = require('../models/otp');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist')
const Wallet = require('../models/wallet')
const mongoose = require('mongoose');
const Razorpay = require('razorpay');



const nodemailer = require('nodemailer');
const passport = require('passport');
const bcrypt = require('bcrypt');
const Offer = require('../models/offer');
//const razo = require('../config/razo')

function generateOTP(length) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

function calculateDiscountedPrice(product, value) {
    const discountedPrice = product.Price - (product.Price * (value / 100));
    return discountedPrice;
}



const razorpay = new Razorpay({
    key_id: process.env.razorpay_key_id,
    key_secret: process.env.razorpay_key_secret
});




exports.landingProducts = async (req, res ) => {
    try {

        const products = await Product.find({});
        if (!req.session.userId) {
            res.render('user/landingpage', { products });
        }


    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.renderOTPVerificationPage = async (req, res , next) => {
    try {

        res.render('user/otp-verification', { successMessage: 'OTP sent successfully. Please check your email.' });


    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.verifyOTP = async (req, res , next) => {
    const { otp } = req.body;


    try {

        const otpEntry = await Otp.findOne({ otp: otp });

        if (!otpEntry) {
            return res.render('user/otp-verification', { error: 'Entered OTP does not match. Please try again.' });
        }

        const wallet = new Wallet({
            User_id: req.session.userId,
            Balance: 0
        });


        await wallet.save();

        req.session.destroy();


        res.render('user/user-login', { successMessage: 'OTP verified successfully. You can now login.' });

    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.resendOTP = async (req, res , next) => {
    try {
        const otp = generateOTP(6);

        const newOtp = new Otp({
            otp
        });

        await newOtp.save();

        console.log(otp);
        const user = await User.findById(req.session.userId);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_EMAIL,
                pass: 'eqblzrkihvmrlnva'
            }
        });

        const mailOptions = {
            from: process.env.MY_EMAIL,
            to: user.email,
            subject: 'Digit Mart',
            text: otp.toString(),
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending OTP email:', error);
            } else {
                console.log('OTP email sent:', info.response);

                res.redirect('/user/otp-verification');
            }
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.signUp = async (req, res , next) => {
    const { name, email, phoneNumber, password } = req.body;

    try {

        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
            return res.render('user/user-signup', { error: 'User with this email already exists' });
        }


        const existingPhoneUser = await User.findOne({ phoneNumber });

        if (existingPhoneUser) {
            return res.render('user/user-signup', { error: 'User with this phone number already exists' });
        }


        const otp = generateOTP(6);

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            blocked: false
        });


        await newUser.save();

        req.session.userId = newUser._id;

        console.log(otp)
        const newOtp = new Otp({
            otp
        });

        await newOtp.save();

        const col = newUser;
        console.log(col)


        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_EMAIL,
                pass: 'eqblzrkihvmrlnva'
            }
        });

        var mailOptions = {
            from: process.env.MY_EMAIL,
            to: email,
            subject: 'Digit Mart',
            text: otp,
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {

                console.log('OTP email sent:', info.response);

                res.redirect('/user/otp-verification');

            }
        });



    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.register = async (req, res , next) => {
    try {
        passport.Authenticator("google", {
            successRedirect: "/user/homepage",
            failureRedirect: "/user/signup"
        })
    } catch (e) {
        console.log(e)
    }
}


exports.signIn = async (req, res , next) => {

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email, blocked: false });


        if (user) {

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {

                req.session.userId = user._id;
                return res.redirect('/user/homepage');
            } else {

                return res.render('user/user-login', { error: 'password not matching' });
            }
        } else {
           
            if(await User.findOne({ email, blocked: true }) && await User.findOne({ email })){
                
                return res.render('user/user-login', { error: 'User with this email was blocked by admin' });   
            }
           
            return res.render('user/user-login', { error: 'User with this email does not exist' });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.logOut = async (req, res , next) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
            res.send("Error")
        } else {
            res.render('user/user-login', { successMessage: 'Logout successful' })
        }
    })
};


exports.renderProduct = async (req, res , next) => {
    try {
        const page = req.query.page || 1;
        const limit = 3;
        const skip = (page - 1) * limit;
        const products = await Product.find({ Deleted: false }).skip(skip).limit(limit);
        const categories = await Category.find({ Deleted: false });
        const totalProducts = await Product.countDocuments({ Deleted: false });

        const currentDate = new Date();
        const activeOffers = await Offer.find({
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate }
        });

        for (const product of products) {

            let categoryOffer = 0;
            let productOffer = 0;

            const category = await Category.findById(product.Category_id);

            const categoryOfferExist = activeOffers.find(offer => offer.type === 'category' && offer.name === category.name);
            if (categoryOfferExist) {
                categoryOffer = categoryOfferExist.value;

            }

            const productOfferExist = activeOffers.find(offer => offer.type === 'product' && offer.name === product.Product_name);
            if (productOfferExist) {
                productOffer = productOfferExist.value;

            }

            const totalDiscount = Math.max(categoryOffer, productOffer);


            product.Discount = calculateDiscountedPrice(product, totalDiscount);
            await product.save();

        }

        const totalPages = Math.ceil(totalProducts / limit);
        const currentPage = Math.min(page, totalPages);

        res.render('user/products', { products, currentPage, totalPages, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.renderProductDetails = async (req, res , next) => {
    try {
        const productId = req.params.productId;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }
        const relatedProducts = await Product.find({ Category_id: { $in: product.Category_id }, Deleted: false })
            .skip(1)
            .limit(2)
            .select('Product_name');



        res.render('user/product-details', { product, relatedProducts });
    } catch (err) {
        console.error(err);
        next(err);
    }
};







exports.submitReview = async (req, res , next) => {
    const productId = req.params.productId;
    const { review } = req.body;

    try {

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }


        product.Review.push(review);


        await product.save();

        res.redirect(`/user/product/${productId}`);
    } catch (err) {
        console.error(err);
        next(err);
    }
};







/////////////////////////////////////////


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

//////////////////


exports.getUserOrders = async (req, res , next) => {
    try {

        const orders = (await Order.find({ User_id: req.session.userId }).populate('Products.Product')).reverse();

        res.render('user/orders', { orders });
    } catch (err) {
        next(err);
    }
};



exports.getOrderDetails = async (req, res , next) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('Products.Product');
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('user/orderDetails', { order });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.renderCreateOrderForm = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const currentDate = new Date();

       
        const address = await Address.findOne({ User_id: userId });
           
      
        const cart = await Cart.findOne({ User_id: userId }).populate('Items.Product');

       
        const coupons = await Coupon.find({ 
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate }
        });

       
        const wallet = await Wallet.findOne({ User_id: req.session.userId });

        
        const ordersWithCoupon = await Order.find({ User_id: userId, Coupon_id: { $exists: true } });

        
        const appliedCouponIds = ordersWithCoupon.map(order => order.Coupon_id);

       
        const availableCoupons = coupons.filter(coupon => !appliedCouponIds.includes(coupon._id));
  
        const products = cart.Items.map(item => ({
            product: item.Product,
            quantity: item.Quantity
        }));

  
        res.render('user/createOrder', { address, cart, products, wallet, coupons: availableCoupons });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.createOrder = async (req, res , next) => {

    try {

        const { addressType, street, city, pincode, state, paymentType } = req.body;
        const userId = req.session.userId;
        const coup = req.session.couponNum;
        const wallet = await Wallet.findOne({ User_id: userId })


        if (!addressType) {
            return res.status(400).send('Address type is required');
        }

        const addresses = await Address.findOne({ User_id: userId });
        if (!addresses && !addressType) {
            return res.status(404).send('Addresses not found');
        }

        let selectedAddress;
        if (addressType === 'home') {
            selectedAddress = addresses.Home_address;
        } else if (addressType === 'office') {
            selectedAddress = addresses.Office_address;
        } else if (addressType === 'additional') {
            selectedAddress = addresses.New_address;
        } else if (addressType === 'new') {

            if (!street || !city || !pincode || !state) {
                return res.status(400).send('New address fields are required');
            }


            selectedAddress = {
                Street: street,
                City: city,
                Pincode: pincode,
                State: state
            }
        } else {
            return res.status(400).send('Invalid address type');
        }


        const cart = await Cart.findOne({ User_id: userId });
        if (!cart || cart.Items.length === 0) {
            return res.status(404).send('Cart is empty');
        }


        const coupon = await Coupon.findOne({ Coupons: coup });

        if (coupon) {
            var discountedPrice = (coupon.Discount_amount / 100) * cart.TotalAmount;
        }

      
        const order = new Order({
            User_id: userId,
            Delivery_date: new Date(),
            Address: selectedAddress,
            Products: cart.Items,
            Total_amount: coupon ? cart.TotalAmount - discountedPrice : cart.TotalAmount,
            Status: 'Pending',
            Coupon_id: coupon ? coupon._id : null
        });



        await order.save();



        if (paymentType == 'razo') {


            const razorpayOrder = razorpay.orders.create({
                amount: order.Total_amount * 100,
                currency: 'INR',
                receipt: 'order_receipt_' + order._id,
                payment_capture: 1
            });

            if (razorpayOrder) {


                order.Payment_method = 'Razorpay';
                await order.save();


                for (const item of cart.Items) {
                    const product = await Product.findById(item.Product);
                    if (!product) {
                        return res.status(404).send('Product not found');
                    }

                    if (product.Quantity < item.Quantity) {
                        return res.status(400).send(`Insufficient quantity available for ${product.Product_name}`);
                    }
                    product.Quantity -= item.Quantity;
                    product.Popularity += item.Quantity;

                    await product.save();

                    await Category.findByIdAndUpdate(product.Category_id, {
                        $inc: { sellcount: item.Quantity }
                    });
                }

                await Cart.findOneAndDelete({ User_id: userId });

                res.render('user/success-pay', { order, razorpay });

            }

            else {

                order.Paid = 'Failed';
                order.Payment_method = 'Razorpay';
                await order.save();
                console.log("order failed(razorpay)")

            }

        }
        else if (paymentType == 'wallet') {



            for (const item of cart.Items) {
                const product = await Product.findById(item.Product);
                if (!product) {
                    return res.status(404).send('Product not found');
                }

                if (product.Quantity < item.Quantity) {
                    return res.status(400).send(`Insufficient quantity available for ${product.Product_name}`);
                }
                product.Quantity -= item.Quantity;
                product.Popularity += item.Quantity;

                await product.save();

                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: item.Quantity }
                });
            }

            order.Paid = 'Success';

            order.Payment_method = 'Wallet';

            await order.save();


           
            wallet.History.push({
                amount: order.Total_amount,
                status: 'Withdrawal',
                oldBalance: wallet.Balance
            });
            wallet.Balance -= order.Total_amount;

            await wallet.save();


            await Cart.findOneAndDelete({ User_id: userId });

            const orders = (await Order.find({ User_id: req.session.userId }).populate('Products.Product')).reverse()

            res.render('user/orders', { successMessage: 'Order placed successfully!', orders });

        }


        else {


            for (const item of cart.Items) {
                const product = await Product.findById(item.Product);
                if (!product) {
                    return res.status(404).send('Product not found');
                }

                if (product.Quantity < item.Quantity) {
                    return res.status(400).send(`Insufficient quantity available for ${product.Product_name}`);
                }
                product.Quantity -= item.Quantity;
                product.Popularity += item.Quantity;

                await product.save();

                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: item.Quantity }
                });
            }

            order.Paid = 'Pending';

            order.Payment_method = 'COD';

            await order.save();

            await Cart.findOneAndDelete({ User_id: userId });

            const orders = (await Order.find({ User_id: req.session.userId }).populate('Products.Product')).reverse()

            res.render('user/orders', { successMessage: 'Order placed successfully!', orders });

        }


    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.verify = async (req, res , next) => {
    try {
        const { id } = req.body

        const verifyPayment = await Order.findOneAndUpdate({ _id: id }, { $set: { Paid: "Success" } })

        if (verifyPayment) {
            return res.json({ success: true, message: "Order Placed" })
        } else {
            await Order.findOneAndUpdate({ _id: id }, { $set: { Paid: "Pending" } })
            return res.json({ success: false, message: "Failed" })
        }

    } catch (error) {
        console.error(err);
        next(err);
    }

}


exports.paymentRetry = async (req, res , next) => {
    const { orderId, totalAmount } = req.params;

    res.render('user/repayment', { orderId, razorpay, totalAmount });
}




exports.cancelOrder = async (req, res , next) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.User_id.toString() !== req.session.userId) {
            return res.status(403).send('Unauthorized');
        }
        
        const productsToRestore = [];

        for (const item of order.Products) {
            const product = await Product.findById(item.Product);
            if (!product) {
                return res.status(404).send(`Product with ID ${item.Product} not found`);
            }
            
          
            item.Status = 'Cancelled';

         
            product.Quantity += item.Quantity;
            if(product.Popularity > 0 && product.Popularity >= item.Quantity ){
                product.Popularity -= item.Quantity;
            }
           

            await product.save();

            const soldQuantity = item.Quantity;

            // await Category.findByIdAndUpdate(product.Category_id, {
            //     $inc: { sellcount: -soldQuantity }
            // }); 

            const category = await Category.findById(product.Category_id);

            if (category && category.sellcount > 0) {
                const decrementAmount = Math.min(category.sellcount, soldQuantity); 
                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: -decrementAmount }
                });
            }
            
            productsToRestore.push({ productId: product._id, quantity: item.Quantity });
        }

        order.Status = 'Cancelled';
        await order.save(); 

        let wallet = await Wallet.findOne({ User_id: req.session.userId });
        if (!wallet) {
            wallet = new Wallet({
                User_id: req.session.userId,
                Balance: order.Total_amount,
                History: [{
                    amount: order.Total_amount,
                    status: 'Deposit',
                    oldBalance: 0
                }]
            });
        } else {
            wallet.History.push({
                amount: order.Total_amount,
                status: 'Deposit',
                oldBalance: wallet.Balance
            });
            wallet.Balance += order.Total_amount;
        }

        await wallet.save(); 

        res.redirect('/user/orders');

    } catch (err) {
        console.error(err.message);
        next(err);
    }
};





exports.cancelEachProduct = async (req, res , next) => {
    const { orderId, productId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.User_id.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const productIndex = order.Products.findIndex(p => p.Product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in order' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cancelledProduct = order.Products[productIndex];
        cancelledProduct.Status = 'Cancelled';
        product.Quantity += cancelledProduct.Quantity;
        product.Popularity -= cancelledProduct.Quantity;
        await product.save();

        const category = await Category.findById(product.Category_id);

            if (category && category.sellcount > 0) {
                const decrementAmount = Math.min(category.sellcount, cancelledProduct.Quantity); 
                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: -decrementAmount }
                });
            }

        // await Category.findByIdAndUpdate(product.Category_id, {
        //     $inc: { sellcount: -cancelledProduct.Quantity }
        // });

        let allCancelled = true;
        order.Products.forEach(product => {
            if (product.Status !== 'Cancelled') {
                allCancelled = false;
            }
        });

        if (allCancelled) {
            order.Status = 'Cancelled';
        }

        await order.save();

        const wallet = await Wallet.findOne({ User_id: req.session.userId });
        if (!wallet) {
            wallet = new Wallet({ 
                User_id: req.session.userId,
                 Balance: cancelledProduct.Amount,
                 History: [{
                amount: cancelledProduct.Amount,
                status: 'Deposit',
                oldBalance: 0
            }] });
        } else {
            wallet.History.push({
                amount: cancelledProduct.Amount,
                status: 'Deposit',
                oldBalance: wallet.Balance
            });
            wallet.Balance += cancelledProduct.Amount;

        }
        await wallet.save();

        res.json({ message: 'Product canceled successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server Error' });
    }
};



exports.returnOrder = async (req, res , next) => {
    const orderId = req.params.orderId;


    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.User_id.toString() !== req.session.userId) {
            return res.status(403).send('Unauthorized');
        }


        const productsToRestore = [];


        for (const item of order.Products) {
            const product = await Product.findById(item.Product);
            if (!product) {
                return res.status(404).send(`Product with ID ${item.Product} not found`);
            }

            item.Status = 'Returned'

            product.Quantity += item.Quantity;
            product.Popularity -= item.Quantity;
            await product.save();

            const soldQuantity = item.Quantity;

            const category = await Category.findById(product.Category_id);

            if (category && category.sellcount > 0) {
                const decrementAmount = Math.min(category.sellcount, soldQuantity); 
                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: -decrementAmount }
                });
            }

            // await Category.findByIdAndUpdate(product.Category_id, {
            //     $inc: { sellcount: -soldQuantity }
            // });

            productsToRestore.push({ productId: product._id, quantity: item.Quantity });
        }


        order.Status = 'Returned';

        await order.save();

        const wallet = await Wallet.findOne({ User_id: req.session.userId });

        if (!wallet) {
            wallet = new Wallet({
                User_id: req.session.userId,
                Balance: order.Total_amount,
                History: [{
                    amount: order.Total_amount,
                    status: 'Deposit',
                    oldBalance: 0
                }]
            });
            await wallet.save();
        } else {
            wallet.History.push({
                amount: order.Total_amount,
                status: 'Deposit',
                oldBalance: wallet.Balance
            });
            wallet.Balance += order.Total_amount;

            await wallet.save();

        }

        res.redirect('/user/orders');

    } catch (err) {
        console.error(err.message);
        next(err);
    }
};


exports.returnEachProduct = async (req, res , next) => {
    const { orderId, productId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.User_id.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const productIndex = order.Products.findIndex(p => p.Product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in order' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const returnedProduct = order.Products[productIndex];
        order.Products[productIndex].Status = 'Returned';
        product.Quantity += returnedProduct.Quantity;
        product.Popularity -= returnedProduct.Quantity;
        await product.save();

        const category = await Category.findById(product.Category_id);

            if (category && category.sellcount > 0) {
                const decrementAmount = Math.min(category.sellcount, returnedProduct.Quantity); 
                await Category.findByIdAndUpdate(product.Category_id, {
                    $inc: { sellcount: -decrementAmount }
                });
            }

        // await Category.findByIdAndUpdate(product.Category_id, {
        //     $inc: { sellcount: -returnedProduct.Quantity }
        // });

        let allReturned = true;
        order.Products.forEach(product => {
            if (product.Status !== 'Returned') {
                allReturned = false;
            }
        });

        if (allReturned) {
            order.Status = 'Returned';
        }

        await order.save();

        const wallet = await Wallet.findOne({ User_id: req.session.userId });
        if (!wallet) {
            wallet = new Wallet({ User_id: req.session.userId, Balance: returnedProduct.Amount,
                History: [{
                    amount:  returnedProduct.Amount,
                    status: 'Deposit',
                    oldBalance: 0
                }]   
             });
        } else {
            wallet.History.push({
                amount: returnedProduct.Amount,
                status: 'Deposit',
                oldBalance: wallet.Balance
            });
            wallet.Balance += returnedProduct.Amount;

        }
        await wallet.save();

        res.json({ message: 'Product returned successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server Error' });
    }
};


///////////////////////////////////






exports.searchProductsByName = async (req, res , next) => {
    try {
        const searchQuery = req.query.name;

        const products = await Product.find({ Product_name: { $regex: searchQuery, $options: 'i' } });
        const categories = await Category.find({ Deleted: false });
        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.getProductsByPopularity = async (req, res , next) => {
    try {

        const products = await Product.find({ Deleted: false }).sort({ Popularity: -1 })
        const categories = await Category.find({ Deleted: false });

        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getProductsByPriceLowToHigh = async (req, res , next) => {
    try {


        const products = await Product.find({ Deleted: false }).sort({ Price: 1 })
        const categories = await Category.find({ Deleted: false });

        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




exports.getProductsByPriceHighToLow = async (req, res , next) => {
    try {


        const products = await Product.find({ Deleted: false }).sort({ Price: -1 })
        const categories = await Category.find({ Deleted: false });


        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getProductsByRatings = async (req, res , next) => {
    try {

        const products = await Product.find({ Deleted: false }).sort({ Rating: -1 })
        const categories = await Category.find({ Deleted: false });

        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getFeaturedProducts = async (req, res , next) => {
    try {

        const products = await Product.find({ Featured: true, Deleted: false })
        const categories = await Category.find({ Deleted: false });


        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getNewArrivals = async (req, res , next) => {
    try {

        const products = await Product.find({ Deleted: false }).sort({ createdAt: -1 })
        const categories = await Category.find({ Deleted: false });


        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getProductsAlphabetically = async (req, res , next) => {
    try {


        const products = await Product.aggregate([
            { $match: { Deleted: false } },
            { $addFields: { product_name_lower: { $toLower: "$Product_name" } } },
            { $sort: { product_name_lower: 1 } },
            { $project: { product_name_lower: 0 } }
        ]);

        const categories = await Category.find({ Deleted: false });

        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getProductsDeAlphabetically = async (req, res , next) => {
    try {


        const products = await Product.aggregate([
            { $match: { Deleted: false } },
            { $addFields: { product_name_lower: { $toLower: "$Product_name" } } },
            { $sort: { product_name_lower: -1 } },
            { $project: { product_name_lower: 0 } }
        ]);
        const categories = await Category.find({ Deleted: false });


        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getProductsByCategory = async (req, res , next) => {
    try {
        const categoryId = req.params.categoryId;
        const products = await Product.find({ Category_id: categoryId, Deleted: false });
        const categories = await Category.find({ Deleted: false });
        res.render('user/products', { products, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

/////////////////////


exports.addToWishlist = async (req, res , next) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        let wishlist = await Wishlist.findOne({ User_id: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                User_id: userId,
                Items: [{ Product: productId }]
            });
            await wishlist.save();
            return res.json({ message: 'Product added to wishlist' });
        } else {
            const productExists = wishlist.Items.some(item => item.Product.toString() === productId);
            if (!productExists) {
                wishlist.Items.push({ Product: productId });
                await wishlist.save();
                return res.json({ success:true, message: 'Product added to wishlist' });
            } else {
                return res.status(400).json({ success:false, message: 'Product already in wishlist' });
            }
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.removeFromWishlist = async (req, res , next) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        const wishlist = await Wishlist.findOne({ User_id: userId });
        if (wishlist) {
            wishlist.Items = wishlist.Items.filter(item => item.Product.toString() !== productId);
            await wishlist.save();
            res.status(200).json({ message: 'Product removed from wishlist' });
        } else {
            res.status(404).json({ error: 'Wishlist not found' });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.listProductsInWishlist = async (req, res , next) => {
    const userId = req.session.userId;
    try {
        const wishlist = await Wishlist.findOne({ User_id: userId }).populate('Items.Product');

        res.render('user/wishlist', { wishlist });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


///////////////////

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