const User = require('../models/user');
const Category = require('../models/category');
const Product = require('../models/product');
const Otp = require('../models/otp');
const Wishlist = require('../models/wishlist')
const Wallet = require('../models/wallet')
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

