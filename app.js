
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
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github').Strategy;

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
            require: [true, "please enter the password "]
        },

        facebookId:
        {
            type: String,
            require: [true, "please enter the password "]
        },


        githubId:
        {
            type: String,
            require: [true, "please enter the password "]
        },
        secret:
        {
            type: String

        }

    }
);


//////////////////////plugin 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


/////////////////////////////////model 
const User = new mongoose.model("User", userSchema);


///////////////////////////////////////////////////strategy 
passport.use(User.createStrategy());


////////////////////serialiable and deserialiable 
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


///////////////////////////////connecting code 
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


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ githubId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));
//////////////////////////////////////////////////// level 6 security (cookies security and oauth   ) ////// 


///// use for google authentication when user  choose go with google 
app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/secrets');
    });


///// use for facebook authentication when user  choose go with facebook 
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/secrets');
    });


///// use for github authentication when user  choose go with github
app.get('/auth/github',
    passport.authenticate('github'));

app.get('/auth/github/secrets',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function (req, res) {

        res.redirect('/secrets');
    });


///////////////////get 
app.get("/", function (req, res) {

    res.render("home");
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

/////////////////secret
app.get("/secrets", function (req, res) {

    async function showSecrets() {
        try {
            const data = await User.find({ secret: { $exists: true } });

            res.render("secrets", { value: data });
        }
        catch (err) {
            console.log(err);
        }
    }

    showSecrets();
});

app.get("/logout", function (req, res) {
    res.redirect("/login");
});

app.get("/submit", function (req, res) {
    {
        if (req.isAuthenticated()) {
            res.render("submit");

        }
        else {
            res.redirect("/login");
        }
    }
});

app.get("/privacyPolicy", function (req, res) {
    res.render("privacyPolicy");
});


///////////////////////////////////////////////////////////post

app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
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
                res.redirect("/secrets");
            });
        }
    });


});


app.post("/submit", function (req, res) {

    async function posting() {
        try {
            const val = await User.findByIdAndUpdate(req.user.id, { $set: { secret: req.body.secret } });
            console.log("add secret sucessfully ");
            res.redirect("/secrets")
        }
        catch (err) {
            console.log(err);
        }

    }

    posting();
});
////////////////////////////

app.listen(3000, function () {
    console.log("app is listening on 3000 port ");
})