
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/user');
const bodyparser = require("body-parser");
const session = require("express-session");
const cookieParser = require('cookie-parser'); 
const passport = require('passport'); 
const { v4: uuidv4 } = require("uuid");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');



const noche = require('nocache')


const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
 
const app = express();

const port = process.env.PORT || 3000;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }))

app.set('view engine', 'ejs');


app.use(noche())
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());
app.use(session({
    secret: uuidv4(), 
    resave: false,
    saveUninitialized: true,
}));


// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: 'http://localhost:3000/user/auth/google/callback'
// },
// async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;


//     let user = await User.findOne({ email });

//     if (user) {
        
//         user.name = profile.displayName || user.name; 
//         await user.save();
//     } else {
        
//         const name = profile.displayName || profile.name.familyName + ' ' + profile.name.givenName || 'Unknown';
//         user = new User({
//             name: name,
//             email: email,
//             phoneNumber: 0, 
//             password: 'password', 
//             Otp_number: 0 
//         });
//         await user.save();
//     }

//     done(null, user);
// } catch (error) {
//     done(error);
// }
// }));

// passport.serializeUser((user, done)=> {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//       const user = await User.findById(id);
//       done(null, user);
//   } catch (error) {
//       done(error);
//   }
// });

mongoose.connect('mongodb+srv://vishnudathm2002:HaMrRklzbp0MCfaP@cluster0.g3v88ap.mongodb.net/DigitMart', {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
  // useCreateIndex: true,
  // useFindAndModify: false 
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});


app.get('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// 404 error handler
app.use(notFoundHandler);

// 500 error handler
app.use(errorHandler);






app.listen(port, ()=>{ console.log(`Lostening to the server on http://localhost:${port}`)});