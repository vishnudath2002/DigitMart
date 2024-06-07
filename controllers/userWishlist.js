const Wishlist = require('../models/wishlist')





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
