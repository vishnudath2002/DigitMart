const express = require('express');
// const passport = require('passport');
const userController = require('../controllers/userController');
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
router.post('/apply-coupon',auth, userController.applyCoupon);
router.post('/remove-coupon',auth, userController.removeCoupon);


router.get('/profile', auth, userController.getUserProfile);


router.get('/addresses', auth, userController.getUserAddresses);
router.get('/addresses/new', auth,userController.getAddAddresses );
router.post('/addresses', auth, userController.addUserAddress);
router.get('/addresses/add', auth, (req, res) => { res.render('user/new-address'); } );
router.post('/add-address', userController.addNewAddress);
router.get('/addresses/edit/:type',  userController.getEditAddresses );
router.post('/addresses/:addressId', userController.updateUserAddress );
router.get('/addresses/delete/:type', userController.deleteAddress);
// router.get('/addresses/delete',  userController.deleteUserAddress );



router.get('/cart', auth, userController.listProductsInCart);
router.post('/add-to-cart/:productId', auth, userController.addToCart);
router.post('/increment/:productId', userController.incrementQuantity);
router.post('/decrement/:productId', userController.decrementQuantity);
router.post('/cart/:productId', auth, userController.removeFromCart);


router.get('/orders', auth, userController.getUserOrders);
router.get('/orders/:id', userController.getOrderDetails);



router.get('/order/create',auth, userController.renderCreateOrderForm);
router.post('/orders/repayment/:orderId/:totalAmount',userController.paymentRetry)
router.post('/order/verify',userController.verify)

router.post('/order/create',auth, userController.createOrder);
router.post('/orders/:orderId/cancel', auth, userController.cancelOrder);
router.post('/orders/:orderId/:productId/cancelEach', auth, userController.cancelEachProduct);

router.post('/orders/:orderId/Return', auth, userController.returnOrder);
router.post('/orders/:orderId/:productId/ReturnEach', auth, userController.returnEachProduct);




router.get('/edit-profile', auth, userController.getEditProfile);
router.post('/edit-profile', auth, userController.updateUserProfile);
router.get('/change-password',auth, userController.renderChangePasswordForm);
router.post('/change-password',auth, userController.changePassword);



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


router.post('/add-to-wishlist/:productId', auth, userController.addToWishlist);
router.post('/wishlist/:productId', auth, userController.removeFromWishlist);
router.get('/wishlist', auth, userController.listProductsInWishlist);

router.get('/wallet',auth,userController.viewWallet);
router.post('/wallet/add', auth, userController.addMoneyToWallet);
router.post('/wallet/withdraw', auth, userController.withdrawMoneyFromWallet);

module.exports = router;
