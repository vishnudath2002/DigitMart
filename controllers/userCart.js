const Product = require('../models/product');
const Cart = require('../models/cart');
const mongoose = require('mongoose');








exports.listProductsInCart = async (req, res , next) => {
    try {
        const user_id = req.session.userId;


        const cart = await Cart.findOne({ User_id: user_id });

        if (!cart) {
            return res.render('user/cart', { products: [] });
        }


        const productIds = cart.Items.map(item => item.Product);
        const products = await Product.find({ _id: { $in: productIds } });


        const cartProducts = cart.Items.map(item => {
            const product = products.find(p => p._id.toString() === item.Product.toString());
            return {
                product,
                quantity: item.Quantity
            };
        });

        res.render('user/cart', { products: cartProducts, cart });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.addToCart = async (req, res , next) => {
    try {
        const { productId } = req.params;
        let { quantity } = req.body;
        quantity = parseInt(quantity);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (quantity > product.Quantity) {
            return res.status(400).json({ error: 'Requested quantity exceeds max quantity' });
        }

        const user_id = req.session.userId;
        let cart = await Cart.findOne({ User_id: user_id });

        let discountOrPrice = (product.Price === product.Discount || product.Discount === 0) ? product.Price : product.Discount;
        const amount = discountOrPrice * quantity;

        if (!cart) {
            cart = new Cart({
                User_id: user_id,
                Items: [{ Product: productId, Quantity: Math.min(quantity, product.Quantity), Amount: amount }],
                TotalAmount: amount
            });
        } else {
            const existingItem = cart.Items.find(item => item.Product.equals(productId));

            if (existingItem) {
                const totalQuantity = existingItem.Quantity + quantity;
                if (totalQuantity > 10) {
                    return res.status(400).json({ error: 'Requested quantity exceeds max quantity' });
                }

                existingItem.Quantity = Math.min(totalQuantity, product.Quantity);
                return res.status(200).json({ message: 'Product already in cart' });
            } else {
                cart.Items.push({ Product: productId, Quantity: Math.min(quantity, product.Quantity), Amount: discountOrPrice });
            }

            cart.TotalAmount = cart.Items.reduce((total, item) => total + (item.Amount * item.Quantity), 0);
        }

        await cart.save();
        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};


exports.incrementQuantity = async (req, res, next) => {
    const productId = req.params.productId;

    try {
        const cart = await Cart.findOne({ User_id: req.session.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.Items.findIndex(item => item.Product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        const product = await Product.findOne({ _id: productId, Deleted: false });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const currentQuantityInCart = cart.Items[itemIndex].Quantity;

        if (currentQuantityInCart < 10 && currentQuantityInCart < product.Quantity) {
            cart.Items[itemIndex].Quantity++;
            cart.TotalAmount += cart.Items[itemIndex].Amount;
            await cart.save();
            return res.json({ message: 'Quantity incremented', cart });
        } else if (currentQuantityInCart >= 10) {
            return res.status(400).json({ message: 'Cannot exceed 10 items per product' });
        } else {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.decrementQuantity = async (req, res, next) => {
    const productId = req.params.productId;

    try {
        const cart = await Cart.findOne({ User_id: req.session.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.Items.findIndex(item => item.Product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        if (cart.Items[itemIndex].Quantity > 1) {
            cart.Items[itemIndex].Quantity--;
            cart.TotalAmount -= cart.Items[itemIndex].Amount;
            await cart.save();
            return res.json({ message: 'Quantity decremented', cart });
        } else {
            return res.status(400).json({ message: 'Cannot have less than 1 item' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};





exports.removeFromCart = async (req, res , next) => {
    try {
        const { productId } = req.params;
        const user_id = req.session.userId;

        const cart = await Cart.findOne({ User_id: user_id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemToRemove = cart.Items.find(item => item.Product.toString() === productId);
        if (!itemToRemove) {
            return res.status(404).json({ error: 'Item not found in the cart' });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(404).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const itemAmount = itemToRemove.Quantity * itemToRemove.Amount;
        cart.TotalAmount -= itemAmount;
        cart.Items = cart.Items.filter(item => item.Product.toString() !== productId);

        await cart.save();
        res.status(200).json({ message: 'Product removed from cart', cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};


