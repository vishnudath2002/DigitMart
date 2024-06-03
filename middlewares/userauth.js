const User = require('../models/user');



const auth = async(req, res, next) => {
    const user = await User.findOne({_id:req.session.userId,blocked:false}) 

    if (user?.blocked==false) { 
        next(); 
    } else {
        
        return res.render('user/user-login')
        
    }
};


module.exports = auth;
