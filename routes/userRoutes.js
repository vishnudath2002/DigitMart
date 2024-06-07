const express = require('express');
// const passport = require('passport');
const userController = require('../controllers/userController');
const userProfile = require('../controllers/userProfile');
const userCart = require('../controllers/userCart');
const userCoupon = require('../controllers/userCoupon');
const userOrder = require('../controllers/userOrder');
const userWishlist = require('../controllers/userWishlist');
const userWallet = require('../controllers/userWallet');



const auth = require('../middlewares/userauth');
//const authorize = require('../middlewares/authorizationMiddleware');
const router = express.Router();

router.get('/', userController.landingProducts);


router.get('/signin', (req, res) => { 
  if(!req.session.userId){
    res.render("user/user-login")
  }
});
router.post('/signin', userController.signIn);


// router.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/user/signup' }),
//   function(req, res) {
//     res.redirect('/user/homepage');
//   }
// );

router.get('/signup', (req, res) => {
  if(!req.session.userId){
    res.render("user/user-signup")
  } 
  });
  
router.post('/signup', userController.signUp)
router.get('/otp-verification', userController.renderOTPVerificationPage);
router.get('/logout',userController.logOut);
router.post('/verify', userController.verifyOTP);
router.get('/resend-otp', userController.resendOTP);
router.get('/homepage', auth, (req, res) => { res.render('user/homepage'); });
router.get('/product',auth, userController.renderProduct);
router.get('/product/:productId', auth,userController.renderProductDetails);


router.post('/apply-coupon',auth, userCoupon.applyCoupon);
router.post('/remove-coupon',auth, userCoupon.removeCoupon);


router.get('/profile', auth, userProfile.getUserProfile);
router.get('/edit-profile', auth, userProfile.getEditProfile);
router.post('/edit-profile', auth, userProfile.updateUserProfile);
router.get('/change-password',auth, userProfile.renderChangePasswordForm);
router.post('/change-password',auth, userProfile.changePassword);

router.get('/addresses', auth, userProfile.getUserAddresses);
router.get('/addresses/new', auth,userProfile.getAddAddresses );
router.post('/addresses', auth,userProfile.addUserAddress);
router.get('/addresses/add', auth, (req, res) => { res.render('user/new-address'); } );
router.post('/add-address', userProfile.addNewAddress);
router.get('/addresses/edit/:type',  userProfile.getEditAddresses );
router.post('/addresses/:addressId', userProfile.updateUserAddress );
router.get('/addresses/delete/:type', userProfile.deleteAddress);




router.get('/cart', auth, userCart.listProductsInCart);
router.post('/add-to-cart/:productId', auth, userCart.addToCart);
router.post('/increment/:productId', userCart.incrementQuantity);
router.post('/decrement/:productId', userCart.decrementQuantity);
router.post('/cart/:productId', auth, userCart.removeFromCart);


router.get('/orders', auth, userOrder.getUserOrders);
router.get('/orders/:id', userOrder.getOrderDetails);
router.get('/order/create',auth, userOrder.renderCreateOrderForm);
router.post('/orders/repayment/:orderId/:totalAmount',userOrder.paymentRetry)
router.post('/order/verify',userOrder.verify)
router.post('/order/create',auth, userOrder.createOrder);
router.post('/orders/:orderId/cancel', auth, userOrder.cancelOrder);
router.post('/orders/:orderId/:productId/cancelEach', auth, userOrder.cancelEachProduct);
router.post('/orders/:orderId/Return', auth, userOrder.returnOrder);
router.post('/orders/:orderId/:productId/ReturnEach', auth, userOrder.returnEachProduct);




router.get('/products/search', userController.searchProductsByName);
router.get('/products/popularity',auth, userController.getProductsByPopularity);
router.get('/products/price-low-to-high',auth, userController.getProductsByPriceLowToHigh);
router.get('/products/price-high-to-low',auth, userController.getProductsByPriceHighToLow);
router.get('/products/ratings',auth, userController.getProductsByRatings);
router.get('/products/featured',auth, userController.getFeaturedProducts);
router.get('/products/new-arrivals',auth, userController.getNewArrivals);
router.get('/products/alphabetical',auth, userController.getProductsAlphabetically);
router.get('/products/de-alphabetical',auth, userController.getProductsDeAlphabetically);
router.get('/products/category/:categoryId',auth, userController.getProductsByCategory);


router.post('/add-to-wishlist/:productId', auth, userWishlist.addToWishlist);
router.post('/wishlist/:productId', auth, userWishlist.removeFromWishlist);
router.get('/wishlist', auth, userWishlist.listProductsInWishlist);

router.get('/wallet',auth,userWallet.viewWallet);
router.post('/wallet/add', auth, userWallet.addMoneyToWallet);
router.post('/wallet/withdraw', auth, userWallet.withdrawMoneyFromWallet);


module.exports = router;
