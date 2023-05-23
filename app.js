
//jshint esversion:6
require('dotenv').config();
const encrypt = require("mongoose-encryption");
const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: " our little secret. ",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////mongo connection //////////////////////////
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema(
    {
        email:
        {
            type: String,
            require: [true, "please enter email id"]
        },

        password:
        {
            type: String,
            require: [true, "please enter the passwod "]
        },
        googleId:
        {
            type: String,
            require: [true, "please enter the passwod "]
        }
    }
);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});



 

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        
        res.redirect("/secrets");
    });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, function (accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
}));


//////////////////////////////////////////////////// level 5 security (cookies security  ) ////// 


///////////////////get 
app.get("/", function (req, res) {

    res.render("home");
});

///// use for google authentication when user  choose go with google 
app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/register", function (req, res) {

    res.render("register");
});


app.get("/login", function (req, res) {

    res.render("login");
});


app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
});
///////////////////////////////////////// post 


app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.render("secrets");
            });
        }
    })

});



app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.render("secrets");
            });
        }
    });


});

app.listen(3000, function () {
    console.log("app is listening on 3000 port ");
})