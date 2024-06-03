
const Admin = require('../models/admin'); 


const authorize = async (req, res, next) => {
    try {
      
        if (!req.session.adminId) {
            return res.status(401).send('Unauthorized'); 
        }

       
        const admin = await Admin.findById(req.session.adminId);

        
        if (!admin) {
            return res.status(401).send('Unauthorized'); 
        }

       
        if (admin.role !== 'admin') {
            return res.status(403).send('Forbidden'); 
        }

      
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
};

module.exports = authorize;
