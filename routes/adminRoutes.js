const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorizationMiddleware');
const router = express.Router();


router.get('/signin', (req, res) => {
    if(!req.session.adminId){
        res.render('admin/signin');
      } 
 });
 
router.post('/signin', adminController.signIn);
router.get('/logout',adminController.logOut)
 

router.get('/dashboard', authenticate,adminController.renderDashboard );
router.get('/users', authenticate, adminController.listUsers);
router.post('/users/toggle-block/:id',  adminController.toggleBlockUser);



router.get('/categories', authenticate, adminController.listCategories);
router.get('/categories/top-categories', authenticate, adminController.listTopCategories);
router.post('/categories', authenticate, adminController.createCategory);
router.get('/categories/:id/edit', authenticate, adminController.renderEditCategoryForm);
router.post('/categories/:id', authenticate, adminController.updateCategory);
router.get('/categories/:id', authenticate, adminController.deleteCategory);



router.get('/products/new', authenticate,adminController.renderAddProductPage);
router.post('/products', authenticate, adminController.createProduct);
router.get('/products', authenticate, adminController.listProducts);
router.get('/products/top-products', authenticate, adminController.listTopProducts);
router.get('/products/:id/edit', authenticate, adminController.renderEditProductForm);
router.post('/products/:productId/remove-image', adminController.removeImage);
router.post('/products/:id', authenticate, adminController.updateProduct);
router.get('/products/:id', authenticate, adminController.deleteProduct);



router.get('/orders', authenticate, adminController.listOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.post('/orders/:orderId/products/:productId/status', adminController.updateProductStatus);
router.get('/orders/daily', authenticate, adminController.generateDailyOrder);
router.get('/orders/weekly', authenticate, adminController.generateWeeklyOrder);
router.get('/orders/yearly', authenticate, adminController.generateYearlyOrder);
router.post('/orders/:orderId/status', authenticate, adminController.updateOrderStatus);


router.get('/offers/new', authenticate,adminController.renderAddOfferPage);
router.post('/offers', authenticate, adminController.createOffer);
router.get('/offers', authenticate, adminController.listOffers);
router.get('/offers/:id/edit', authenticate, adminController.renderEditOfferForm);
router.post('/offers/:id', authenticate, adminController.updateOffer);
router.get('/offers/:id', authenticate, adminController.deleteOffer);


router.get('/reports', authenticate, adminController.listReports);
router.get('/reports/daily', authenticate, adminController.generateDailyReport);
router.get('/reports/weekly', authenticate, adminController.generateWeeklyReport);
router.get('/reports/yearly', authenticate, adminController.generateYearlyReport);
router.get('/reports/custom', authenticate, adminController.generateCustomReport);
router.get('/reports/download/excel', adminController.downloadExcelReport);


router.get('/coupons/new', authenticate,adminController.renderAddCouponsPage);
router.post('/coupons', authenticate, adminController.createCoupons);
router.get('/coupons', authenticate, adminController.listCoupons);
router.get('/coupons/:id/edit', authenticate, adminController.renderEditCouponsForm);
router.post('/coupons/:couponId', adminController.updateCoupon);
router.get('/coupons/:id', authenticate, adminController.deleteCoupons);





module.exports = router;
