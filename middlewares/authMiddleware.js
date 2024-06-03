
const authenticate = (req, res, next) => {
    if (req.session.adminId) {
        next(); 
    } else {
       return res.redirect('/admin/signin'); 
    }
};

module.exports = authenticate;
