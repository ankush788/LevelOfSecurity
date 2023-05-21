
//jshint esversion:6
const encrypt = require("mongoose-encryption");
const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

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
    }


);

///////encryption come before model 

const secret = "ThisIsOurEncryptionTool";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema);

//////////////////////////////////////////////////// level 2 security ////// 


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


///////////////////////////////////////// post 
app.post("/register", function (req, res) {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password

    });

    //// this moongoose encryption encrypt or decrypt one object at time so cann't use "insertMany" but use "save()" method
    async function addUser() {
        try {
            await newUser.save();
            console.log("register sucessfuly");
            res.render("secrets");
        }
        catch (err) {
            console.log(err);
        }
    }

    addUser();
});

app.post("/login", function (req, res) {
    async function auth() {
        try {
            const value = await User.findOne({ email: req.body.username });
            if (value) {
                if (value.password === req.body.password) {
                    res.render("secrets");
                }

                else {
                    res.send("<h1>Incorrect password</h1>");
                }
            }

            else {
                res.send("<h1>User not found</h1>");
            }
        }

        catch (err) {
            console.log(err);
        }
    }

    auth();
});

app.listen(3000, function () {
    console.log("app is listening on 3000 port ");
})