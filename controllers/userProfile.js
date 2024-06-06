const User = require('../models/user');
const Address = require('../models/address');
const bcrypt = require('bcrypt');






exports.getUserProfile = async (req, res , next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('user/profile', { user });
    } catch (err) {
        next(err);
    }
};

exports.getUserAddresses = async (req, res , next) => {
    try {

        const address = await Address.find({ User_id: req.session.userId });


        if (!address) {
           
            return res.status(404).send('User not found');
        }


        res.render('user/addresses', { address });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.getAddAddresses = async (req, res , next) => {
    try {
        
        const address = await Address.find({ User_id: req.session.userId });

       
        if (!address) {
        
            return res.status(404).send('address not found');
        }
        
        res.render('user/add-address', { address });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.addUserAddress = async (req, res , next) => {
    try {
        const {
            billingAddressLine1,
            billingCity,
            billingPincode,
            billingState,
            shippingAddressLine1,
            shippingCity,
            shippingPincode,
            shippingState
        } = req.body;

        const userId = req.session.userId;

        const existingAddress = await Address.findOne({ User_id: userId });

        if (existingAddress) {
            if (!existingAddress.Home_address || !existingAddress.Home_address.Street) {
                existingAddress.Home_address = {
                    Street: billingAddressLine1,
                    City: billingCity,
                    Pincode: billingPincode,
                    State: billingState
                };
            }

            if (!existingAddress.Office_address || !existingAddress.Office_address.Street) {
                existingAddress.Office_address = {
                    Street: shippingAddressLine1,
                    City: shippingCity,
                    Pincode: shippingPincode,
                    State: shippingState
                };
            }

            await existingAddress.save();
        } else {
            const newAddress = new Address({
                User_id: userId,
                Home_address: {
                    Street: billingAddressLine1,
                    City: billingCity,
                    Pincode: billingPincode,
                    State: billingState
                },
                Office_address: {
                    Street: shippingAddressLine1,
                    City: shippingCity,
                    Pincode: shippingPincode,
                    State: shippingState
                }
            });

            await newAddress.save();
        }

        res.redirect('/user/addresses');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.addNewAddress = async (req, res , next) => {
    try {
        const { billingAddressLine1, billingCity, billingPincode, billingState } = req.body;

        const userId = req.session.userId;

        if (!billingAddressLine1 || !billingCity || !billingPincode || !billingState) {
            return res.status(400).send('All fields are required');
        }

        const newAddress = {
            Street: billingAddressLine1,
            City: billingCity,
            Pincode: billingPincode,
            State: billingState
        };

        let address = await Address.findOne({ User_id: userId });

        if (!address) {
            address = new Address({ User_id: userId });
        }


        const homeAddress = address.Home_address;
        const officeAddress = address.Office_address;


        address.New_address = newAddress;


        await address.save();


        address.Home_address = homeAddress;
        address.Office_address = officeAddress;


        res.redirect('/user/addresses');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.getEditAddresses = async (req, res , next) => {
    try {
        const { type }  = req.params
        console.log(type)
        const address = await Address.find({ User_id: req.session.userId });

        if (address.length === 0) {
            return res.status(404).send('Address not found');
        }

        res.render('user/edit-address', { address , type });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.updateUserAddress = async (req, res , next) => {
    try {
        const {
            billingAddressLine1,
            billingCity,
            billingPincode,
            billingState,
            shippingAddressLine1,
            shippingCity,
            shippingPincode,
            shippingState,
            newAddressLine1,
            newCity,
            newPincode,
            newState
        } = req.body;

        const updateData = {
            User_id: req.session.userId,
        };

        if (billingAddressLine1 || billingCity || billingPincode || billingState) {
            updateData.Home_address = {
                Street: billingAddressLine1,
                City: billingCity,
                Pincode: billingPincode,
                State: billingState
            };
        }

        if (shippingAddressLine1 || shippingCity || shippingPincode || shippingState) {
            updateData.Office_address = {
                Street: shippingAddressLine1,
                City: shippingCity,
                Pincode: shippingPincode,
                State: shippingState
            };
        }

        if (newAddressLine1 || newCity || newPincode || newState) {
            updateData.New_address = {
                Street: newAddressLine1,
                City: newCity,
                Pincode: newPincode,
                State: newState
            };
        }

        await Address.findByIdAndUpdate(req.params.addressId, updateData);

        res.redirect('/user/addresses');
    } catch (err) {
        next(err);
    }
};



exports.deleteAddress = async (req, res , next) => {
    const { type } = req.params;  
    const userId = req.session.userId;


    try {
        const updateQuery = {};
        if (type === 'home') {
            updateQuery.Home_address = 1;
        } else if (type === 'office') {
            updateQuery.Office_address = 1;
        } else if (type === 'additional') {
            updateQuery.New_address = 1;
        } else {
            return res.status(400).send('Invalid address type');
        }

        await Address.updateOne(
            { User_id: userId },
            { $unset: updateQuery }
        );

        res.redirect('/user/addresses');
    } catch (err) {
        console.error(err);
        next(err);
    }
};






exports.getEditProfile = async (req, res , next) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('user/edit-profile', { user });
    } catch (err) {
        next(err);
    }
};


exports.updateUserProfile = async (req, res , next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found. Try again.' });
        }

        user.set(req.body);
        await user.save();

        res.status(200).json({ successMessage: 'Profile updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
};


exports.renderChangePasswordForm = (req, res) => {
    res.render('user/change-password');
};


exports.changePassword = async (req, res , next) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;


        if (newPassword !== confirmNewPassword) {
            return res.render('user/profile', { error: 'New password and confirm password do not match', user });
        }


        const user = await User.findById(req.session.userId);


        if (!user) {
            return res.render('user/profile', { error: 'User not found', user });
        }


        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.render('user/profile', { error: 'Current password and New password are same' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        return res.render('user/change-password', { user, successMessage: 'Password updated successfully.' });

    } catch (err) {
        console.error(err);
        next(err);
    }
};
