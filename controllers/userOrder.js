const Category = require('../models/category');
const Address = require('../models/address');
const Order = require('../models/order');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');
const Wallet = require('../models/wallet')
const Razorpay = require('razorpay');


const razorpay = new Razorpay({
    key_id: process.env.razorpay_key_id,
    key_secret: process.env.razorpay_key_secret
});


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
