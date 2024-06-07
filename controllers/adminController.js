const Admin = require('../models/admin');
const User = require('../models/user');
const Category = require('../models/category');
const Product = require('../models/product');
const Order = require('../models/order');
const Offer = require('../models/offer');
const Coupon = require('../models/coupon');
const Wallet = require('../models/wallet')
const ExcelJS = require('exceljs');




exports.signIn = async (req, res,next) => {
    

    try {
        const { email, Password } = req.body;
        const admin = await Admin.findOne({ Email: email });


 if (admin && admin.Password === Password) {
         req.session.adminId = admin._id;


            res.redirect('/admin/dashboard');
         } else {
            if(admin.Email === email){
                res.render('admin/signin', { error: 'wrong email' });
            }
            else{
                res.render('admin/signin', { error: 'wrong password' });
            }
         
   }
    } catch (err) {
        console.error(err);
    next(err);
    }
};


exports.logOut = async (req, res,next) => {
    req.session.destroy(function (err) {
         if (err) {
            console.log(err);
              res.send("Error")
        } else {
        res.render('admin/signin', { success: "Logout successful" })
    }
    })
};


exports.renderDashboard = async (req, res,next) => {
    try {

        const today = new Date();

        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()) + 1);
          const startOfMonth = new Date(today.getFullYear(), 0, 1);
           const endOfMonth = new Date(today.getFullYear(), 11, 31);

        const monthlyOrders = await Order.find({
            Delivery_date: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const monthTotalAmount = monthlyOrders.reduce((total, order) => total + order.Total_amount, 0);

        const monthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        monthlyOrders.forEach(order => {
              const orderMonth = new Date(order.Delivery_date).getMonth();
            monthly[orderMonth] += order.Total_amount;
        });

        const monthData  = JSON.stringify(monthly)

    
        const orders = await Order.find({
            Delivery_date: { $gte: startOfWeek, $lt: endOfWeek }
        });

         const sellCount = orders.length;

       const orderAmountsPerDay = [0, 0, 0, 0, 0, 0, 0];    
        const weekTotalAmount = orders.reduce((total, order) => total + order.Total_amount, 0);;      
        orders.forEach(order => {
            const orderDay = new Date(order.Delivery_date).getDay();
        orderAmountsPerDay[orderDay] += order.Total_amount;
        }); 
        
        
    
        const categories = await Category.find({ Deleted: false }).sort({ sellcount: -1 }).limit(3);
    const products = await Product.find({ Deleted: false }).populate('Category_id').sort({ Popularity: -1 }).limit(5);
        const users = await User.find();
        const userCount = users.length;    
     const data =JSON.stringify(orderAmountsPerDay);

        
        res.render('admin/dashboard', {  sellCount , userCount , weekTotalAmount, monthTotalAmount , categories , products ,   data , monthData });

    } catch (err) {
        console.error(err);
    next(err);
}
};



exports.listUsers = async (req, res,next) => {
    
 
try {
    const page = Number(req.query.page) || 1; 
    const limit = 4; 
      const skip = (page - 1) * limit; 
        const users = await User.find().skip(skip).limit(limit);
      const totalUsers = await User.countDocuments(); 
        const totalPages = Math.ceil(totalUsers / limit); 
        res.render('admin/users', { users, totalPages, currentPage: page });
      } catch (err) {
        console.error(err);
          next(err);
      }
};



exports.toggleBlockUser = async (req, res,next) => {

    

 try {
     const userId = req.params.id;
        const user = await User.findById(userId);
         if (!user) {
            console.error(`User with ID ${userId} not found`);
            return res.status(404).send('User not found');
        }


        user.blocked = !user.blocked;
    await user.save();

        res.redirect('/admin/users');
    } catch (err) {
     console.error(err);
        next(err);
    }
};



///////////////////////////////////////



exports.createCategory = async (req, res,next) => {
    try {
        const { name, description } = req.body;

    const existingCategory = await Category.findOne({ name :{ $regex: name, $options: 'i' } });

          if (existingCategory) {
            const categories = await Category.find({ Deleted:false });
            return res.render('admin/category', { error: 'Category with this name already exists', categories });
        }

        const category = new Category({ name, description, Deleted: false });
        await category.save();

     const categories = await Category.find({ Deleted: false });
        res.render('admin/category',{success:'New Category Created',categories});

    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.listCategories = async (req, res,next) => {
try {
        const categories = await Category.find({ Deleted: false });
    res.render('admin/category', { categories });
      } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.listTopCategories = async (req, res,next) => {
    try {
    const categories = await Category.find({ Deleted: false }).sort({ sellcount: -1 }).limit(3);
        res.render('admin/category', { categories });
     } catch (err) {
        console.error(err);
     next(err);
    }
};


exports.renderEditCategoryForm = async (req, res,next) => {
    try {
     const categoryId = req.params.id
        const category = await Category.findById(categoryId);
         res.render('admin/edit-category', { category });
    } catch (err) {
    console.error(err);
        next(err);
    }
};


exports.updateCategory = async (req, res,next) => {
    try {
        const { name, description } = req.body;
     const cate = Category.findOne({ name })
        if(cate){
            const categories = await Category.find({});
            res.render('admin/category', { error: 'Category with this name already exists', categories });
        }
         
        await Category.findByIdAndUpdate(req.params.id, { name, description });
     res.redirect('/admin/categories');
    } catch (err) {
     console.error(err);
        next(err);
    }
};


exports.deleteCategory = async (req, res,next) => {
    try {
        const categoryId = req.params.id;
        await Category.findByIdAndUpdate( categoryId , { Deleted: true });
           res.redirect('/admin/categories');
    } catch (err) {
        console.error(err);
     next(err);
    }
};


/////////////////////////////////


exports.renderAddProductPage = async (req, res,next) => {
    try {
        const categories = await Category.find();

        res.render('admin/new-product', { categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.createProduct = async (req, res,next) => {

    const categories = await Category.find();  
    try {
      
        const { Price, Product_name, Tax, Quantity, Category_id, Description, Image, Rating, Feature } = req.body;
    
       
       
        const existingProduct = await Product.findOne({ Product_name:  { $regex: Product_name, $options: 'i' }});
        if (existingProduct) {
            return res.render('admin/new-product',{  failure : 'Product already exists' , categories});
        }

        const Featured = req.body.Featured === 'on';

    
        const product = new Product({
            Discount: 0,
            Price,
            Product_name,
            Tax,
            Quantity,
            Category_id,
            Description,
            Image,
            Rating,
            Feature,
            Deleted: false,
            Featured
        });

        await product.save();
        
        return res.render('admin/new-product',{  message: 'Product created successfully!' , categories});
    } catch (err) {
        console.error(err);
        next(err);
    } 
};



exports.listProducts = async (req, res,next) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        const skip = (page - 1) * limit;

        const products = await Product.find({ Deleted: false })
                                     .skip(skip)
                                     .limit(limit)
                                     .populate('Category_id');

   
        const totalProducts = await Product.countDocuments({ Deleted: false });
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', { products, totalPages, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.listTopProducts = async (req, res,next) => {
    try {
        const products = await Product.find({ Deleted: false }).populate('Category_id').sort({ Popularity: -1 }).limit(5);
        res.render('admin/products', { products });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.renderEditProductForm = async (req, res,next) => {
    try {
        const product = await Product.findById(req.params.id).populate('Category_id').exec();
        const categories = await Category.find();
        res.render('admin/edit-product', { product, categories });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.removeImage = async (req, res,next) => {
    try {
        const { productId } = req.params;
        const { imageName } = req.body;

  
        const product = await Product.findById(productId);


        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

  
        product.Image = product.Image.filter(image => image !== imageName);

   
        await product.save();

        res.status(200).json({ message: 'Image removed successfully.' });

    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateProduct = async (req, res,next) => {
    try {
        const { Price, Product_name, Tax, Quantity, Category_id, Description, Rating, Feature, Deleted, Popularity } = req.body;
        let { Image1, Image2, Image3 } = req.body;

        const featuresArray = Array.isArray(Feature) ? Feature : [Feature];

        const newImages = [Image1, Image2, Image3];
        const product = await Product.findById(req.params.id);

        
        for (let i = 0; i < newImages.length; i++) {
            if (newImages[i] && newImages[i] !== "") {
                product.Image[i] = newImages[i];
            }
        }

        await Product.findByIdAndUpdate(req.params.id, { 
            Price, 
            Product_name, 
            Tax, 
            Quantity, 
            Category_id, 
            Description, 
            Image: product.Image, 
            Rating, 
            Feature: featuresArray, 
            Deleted, 
            Popularity 
        });

        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.deleteProduct = async (req, res,next) => {
    try {

        await Product.findByIdAndUpdate(req.params.id, { Deleted: true });
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


////////////////


exports.listOrders = async (req, res,next) => {
    try {
        const perPage = 10; 
        const page = parseInt(req.query.page) || 1;

        const orders = await Order.find().sort({ _id: -1 }).skip((perPage * page) - perPage).limit(perPage);
        const count = await Order.countDocuments();

        const productNames = await Promise.all(orders.map(async (order) => {
            const productNames = await Promise.all(order.Products.map(async (product) => {
                const productName = await Product.findById(product.Product);
                return productName.Product_name;
            }));
            return productNames;
        }));

        res.render('admin/orders', {
            orders,
            productNames,
            currentPage: page,
            pages: Math.ceil(count / perPage)
        });

    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.getOrderDetails = async (req, res,next) => {
    try {
        const order = await Order.findById(req.params.id).populate({
            path: 'Products.Product',
            select: 'Product_name Price'
        });
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('admin/order-details', { order });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.generateDailyOrder = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const orders = await Order.find({
            Delivery_date: { $gte: startOfDay, $lt: endOfDay }
        });

        const productNames = await Promise.all(orders.map(async (order) => {
            const productNames = await Promise.all(order.Products.map(async (product) => {
                const productName = await Product.findById(product.Product);
                return productName.Product_name;
            }));
            return productNames;
        }));



        res.render('admin/orders', { orders, productNames });

    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.generateWeeklyOrder = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()) + 1);

        const orders = await Order.find({
            Delivery_date: { $gte: startOfWeek, $lt: endOfWeek }
        });


        const productNames = await Promise.all(orders.map(async (order) => {
            const productNames = await Promise.all(order.Products.map(async (product) => {
                const productName = await Product.findById(product.Product);
                return productName.Product_name;
            }));
            return productNames;
        }));



        res.render('admin/orders', { orders, productNames });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.generateYearlyOrder = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

        const orders = await Order.find({
            Delivery_date: { $gte: startOfYear, $lt: endOfYear }
        });


        const productNames = await Promise.all(orders.map(async (order) => {
            const productNames = await Promise.all(order.Products.map(async (product) => {
                const productName = await Product.findById(product.Product);
                return productName.Product_name;
            }));
            return productNames;
        }));



        res.render('admin/orders', { orders, productNames });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateOrderStatus = async (req, res,next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }
        

        order.Status = status;
        
     
        order.Products.forEach(product => {
            product.Status = status;
        });

       
        await order.save();


        res.redirect('/admin/orders');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateProductStatus = async (req, res,next) => {
    const { orderId, productId } = req.params;
    const { status } = req.body;
  
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
     
  
      const productIndex = order.Products.findIndex(p => p.Product.toString() === productId);
      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found in order' });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      const updatedProduct = order.Products[productIndex];
      updatedProduct.Status = status;
  
      if (status === 'Cancelled') {
        product.Quantity += updatedProduct.Quantity;
        product.Popularity -= updatedProduct.Quantity;
        await product.save();
  
        await Category.findByIdAndUpdate(product.Category_id, {
          $inc: { sellcount: -updatedProduct.Quantity }
        });
  
        const wallet = await Wallet.findOne({ User_id: order.User_id });
        if (!wallet) {
          wallet = new Wallet({ User_id: order.User_id, Balance: updatedProduct.Amount });
        } else {
          wallet.Balance += updatedProduct.Amount;
        }
        await wallet.save();
      }

      
  
      let allCancelled = true;
      let allDelivered = true;
      let allProcessing = true;
  
      order.Products.forEach(product => {
        if (product.Status !== 'Cancelled') {
          allCancelled = false;
        }
        if (product.Status !== 'Delivered') {
          allDelivered = false;
        }
        if (product.Status !== 'Processing') {
          allProcessing = false;
        }
      });
  
      if (allCancelled) {
        order.Status = 'Cancelled';
      } 
       if (allDelivered) {
        order.Status = 'Delivered';
      } 
       if (allProcessing) {
        order.Status = 'Processing';
      } 
  
      await order.save();
  
      res.redirect(`/admin/orders/${orderId}`);
    } catch (err) {
        console.error(err);
        next(err);
    }
  };
  


//////////////////////


exports.renderAddOfferPage = async (req, res,next) => {
    try {
        const categories = await Category.find();
        const products = await Product.find();

        res.render('admin/new-offer', { categories, products });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.createOffer = async (req, res,next) => {
    try {

        const { type, Discount, validFrom, validTo, product_name, Category_name } = req.body;

        const offer = new Offer({
            name: type == 'product' ? product_name : Category_name,
            type,
            value: Discount,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
        });

        await offer.save();


        res.redirect('/admin/offers');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.listOffers = async (req, res,next) => {
    try {

        const typeFilter = req.query.type;
        let query = {};
        if (typeFilter) {
            query.type = typeFilter;
        } else {
            query.type = 'product';
        }

        const offers = await Offer.find(query);

        res.render('admin/offers', { offers });

    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.renderEditOfferForm = async (req, res,next) => {
    try {
        const offers = await Offer.findById(req.params.id)

        res.render('admin/edit-offer', { offers });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateOffer = async (req, res,next) => {
    try {
        const { value, validFrom, validTo } = req.body;


        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        await Offer.findByIdAndUpdate(req.params.id, { value, validFrom, validTo });


       
        res.redirect('/admin/offers');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.deleteOffer = async (req, res,next) => {
    try {

        await Offer.findByIdAndDelete(req.params.id);

        res.redirect('/admin/offers');
    } catch (err) {
        console.error(err);
        next(err);
    }
};



//////////


exports.listReports = async (req, res,next) => {
   
    try {

        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

        req.session.start = startOfYear;
        req.session.end = endOfYear;

        const orders = await Order.find().populate('User_id').populate('Products.Product').populate('Coupon_id');
       
     

        const productNames = orders.map(order => {
            return order.Products.map(product => {
                return product.Product.Product_name;
            });
        });

        const salesCount = orders.length;

        const overallOrderAmount = orders.reduce((total, order) => total + order.Total_amount, 0);

        const overallDiscount = orders.reduce((totalDiscount, order) => {
            if (order.Coupon_id) {
                const couponDiscount = (order.Total_amount * order.Coupon_id.Discount_amount) / 100;
                return totalDiscount + couponDiscount;
            } else {
                return totalDiscount;
            }
        }, 0);

        res.render('admin/report', { orders, productNames, salesCount, overallOrderAmount, overallDiscount ,startDate: startOfYear, endDate: endOfYear  });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.generateDailyReport = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        req.session.start = startOfDay;
        req.session.end = endOfDay;

        const orders = await Order.find({
            Delivery_date: { $gte: startOfDay, $lt: endOfDay }
        }).populate('User_id').populate('Products.Product').populate('Coupon_id');

        const productNames = orders.map(order => {
            return order.Products.map(product => {
                return product.Product.Product_name;
            });
        });

        const salesCount = orders.length;

        const overallOrderAmount = orders.reduce((total, order) => total + order.Total_amount, 0);

        const overallDiscount = orders.reduce((totalDiscount, order) => {
            if (order.Coupon_id) {
                const couponDiscount = (order.Total_amount * order.Coupon_id.Discount_amount) / 100;
                return totalDiscount + couponDiscount;
            } else {
                return totalDiscount;
            }
        }, 0);

        res.render('admin/report', { orders, productNames, salesCount, overallOrderAmount, overallDiscount ,startDate: startOfDay, endDate: endOfDay  });

    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.generateWeeklyReport = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()) + 1);

        req.session.start = startOfWeek;
        req.session.end = endOfWeek;

        const orders = await Order.find({
            Delivery_date: { $gte: startOfWeek, $lt: endOfWeek }
        }).populate('User_id').populate('Products.Product').populate('Coupon_id');


        const productNames = orders.map(order => {
            return order.Products.map(product => {
                return product.Product.Product_name;
            });
        });

        const salesCount = orders.length;

        const overallOrderAmount = orders.reduce((total, order) => total + order.Total_amount, 0);


        const overallDiscount = orders.reduce((totalDiscount, order) => {
            if (order.Coupon_id) {
                const couponDiscount = (order.Total_amount * order.Coupon_id.Discount_amount) / 100;
                return totalDiscount + couponDiscount;
            } else {
                return totalDiscount;
            }
        }, 0);

        res.render('admin/report', { orders, productNames, salesCount, overallOrderAmount, overallDiscount ,startDate: startOfWeek, endDate: endOfWeek });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.generateYearlyReport = async (req, res,next) => {
    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

        req.session.start = startOfYear;
        req.session.end = endOfYear;


        const orders = await Order.find({
            Delivery_date: { $gte: startOfYear, $lt: endOfYear }
        }).populate('User_id').populate('Products.Product').populate('Coupon_id');


        const productNames = orders.map(order => {
            return order.Products.map(product => {
                return product.Product.Product_name;
            });
        });

        const salesCount = orders.length;

        const overallOrderAmount = orders.reduce((total, order) => total + order.Total_amount, 0);

        const overallDiscount = orders.reduce((totalDiscount, order) => {
            if (order.Coupon_id) {
                const couponDiscount = (order.Total_amount * order.Coupon_id.Discount_amount) / 100;
                return totalDiscount + couponDiscount;
            } else {
                return totalDiscount;
            }
        }, 0);

        res.render('admin/report', { orders, productNames, salesCount, overallOrderAmount, overallDiscount,startDate: startOfYear, endDate: endOfYear  });

    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.generateCustomReport = async (req, res,next) => {
    try {

        const { startDate, endDate } = req.query;
        const validStartDate = new Date(startDate);
        const validEndDate = new Date(endDate);

        req.session.start = validStartDate;
        req.session.end = validEndDate;

        if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Please use a valid date.' });
        }

        const orders = await Order.find({
            Delivery_date: { $gte: validStartDate, $lt: validEndDate }
        }).populate('User_id').populate('Products.Product');

        const productNames = orders.map(order => {
            return order.Products.map(product => {
                return product.Product.Product_name;
            });
        });

        const salesCount = orders.length;

        const overallOrderAmount = orders.reduce((total, order) => total + order.Total_amount, 0);

        const overallDiscount = await Promise.all(orders.map(async (order) => {
            if (!order.Coupon_id) {
                return 0;
            }
            const coupon = await Coupon.findById(order.Coupon_id); 
            if (!coupon) {
                return 0;
            }
            const discount = (order.Total_amount * coupon.Discount_amount) / 100;
            return discount;
        })).then(discounts => discounts.reduce((total, discount) => total + discount, 0));

        res.render('admin/report', { orders, productNames, salesCount, overallOrderAmount, overallDiscount,startDate: validStartDate, endDate: validEndDate  });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.downloadExcelReport = async (req, res,next) => {
    try {

        const orders = await Order.find().populate('User_id').populate('Products.Product');


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');


        worksheet.addRow([

            'User Name',
            'Product Name',
            'Price',
            'Quantity',
            'Discount',
            'Total Price',
            'Payment Method'
        ]);


        orders.forEach(order => {
            order.Products.forEach(product => {
                worksheet.addRow([

                    order.User_id.name,
                    product.Product.Product_name,
                    product.Product.Price,
                    product.Quantity,
                    product.Product.Discount,
                    order.Total_amount,
                    order.Payment_method
                ]);
            });
        });


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');


        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


////////////////////


exports.renderAddCouponsPage = async (req, res,next) => {
    try {

        res.render('admin/new-coupon');
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.createCoupons = async (req, res,next) => {
    try {
      const { number, amount, Minimum, validFrom, validTo } = req.body;
  
      const existingCoupon = await Coupon.findOne({ Coupons: number });
      if (existingCoupon) {
        return res.status(400).send({ error: 'Coupon with this number already exists' });
      }
  
      const coupon = new Coupon({ Coupons: number, Discount_amount: amount, Minimum_amount: Minimum, validFrom, validTo });
      await coupon.save();
      res.status(201).send({ message: 'Coupon added successfully!' });
    } catch (err) {
        console.error(err);
        next(err);
    }
  };

  

exports.listCoupons = async (req, res,next) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupon', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.renderEditCouponsForm = async (req, res,next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        res.render('admin/edit-coupon', { coupon });
    } catch (err) {
        console.error(err);
        next(err);
    }
};



exports.updateCoupon = async (req, res,next) => {
    try {
        const { couponId } = req.params;
        const { Coupons, Discount_amount, validFrom, validTo , Minimum_amount } = req.body;

       
        let coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found.' });
        }

       
        coupon.Coupons = Coupons;
        coupon.Discount_amount = Discount_amount;
        coupon.validFrom = validFrom;
        coupon.validTo = validTo;
        coupon.Minimum_amount = Minimum_amount;

       
        coupon = await coupon.save();

        
        res.redirect('/admin/coupons')
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.deleteCoupons = async (req, res,next ) => {
    try {

        await Coupon.findByIdAndDelete(req.params.id);
        res.redirect('/admin/coupons');
    } catch (err) {
        console.error(err);
        next(err);
    }
};

