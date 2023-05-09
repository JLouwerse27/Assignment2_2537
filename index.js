require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = 3002;

const app = express();

const Joi = require("joi");

const expireTime = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var { database } = include("databaseConnection");

const userCollection = database.db(mongodb_database).collection("users");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret,
    },
});

app.use(
    session({
        secret: node_session_secret,
        store: mongoStore, //default is memory store
        saveUninitialized: false,
        resave: true,
    })
);

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.get("/", (req, res) => {
    res.render("index", {
        auth: req.session.authenticated,
        name: req.session.name,
    });
});

app.get("/members", (req, res) => {
    var name = req.session.name;
    var meme = Math.floor(Math.random() * 3 + 1);

    if (!req.session.authenticated) {
        res.redirect("/");
        return;
    }

    res.render("members", {
        name: name,
        meme: meme,
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/redirectToSignup", (req, res) => {
    res.redirect("/signup");
});

app.post("/submitsignup", async (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object({
        name: Joi.string().alphanum().max(20).required(),
        email: Joi.string().alphanum().max(20).required(),
        password: Joi.string().max(20).required(),
    });

    const validationResult = schema.validate({ name, email, password });

    if (validationResult.error != null) {
        console.log(validationResult.error);

        res.render("signupError", {
            errorMessage: validationResult.error.details[0].message,
        });

        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);

    await userCollection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
    });
    console.log("Inserted user");

    //If the email and passwords match store the user's name in a session
    req.session.authenticated = true;
    req.session.name = name;
    // and log the user in (redirect to /members).
    res.redirect("/members");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/loggingin", async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().max(20).required();
    const validationResult = schema.validate(email);

    //prob with validation: ex email 21 char long, missing email
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/login");
        return;
    }

    const result = await userCollection
        .find({ email: email })
        .project({ name: 1, email: 1, password: 1, _id: 1 })
        .toArray();

    if (result.length != 1) {
        console.log("user not found");
        res.render("loggingin", {
            errorMessage: "Invalid email/password combination",
        });
        return;
    }
    if (await bcrypt.compare(password, result[0].password)) {
        console.log("correct password");
        req.session.authenticated = true;
        req.session.email = email;
        req.session.name = result[0].name; // Set session 'name' to the 'name' field from the result
        req.session.cookie.maxAge = expireTime;

        //res.redirect("/loggedIn");
        res.redirect("/members");
        return;
    } else {
        console.log("Incorrect Password");
        res.render("loggingin", {
            errorMessage: `Invalid email/password combination`,
        });
        return;
    }
});

app.get("/loggedin", (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/login");
    }
    res.render("loggedin");
});

app.post("/redirectToHome", (req, res) => {
    res.redirect("/");
});

app.get("/nosql-injection", async (req, res) => {
    var email = req.query.email;

    if (!email) {
        res.send(
            `<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`
        );
        return;
    }
    console.log("user: " + email);

    const schema = Joi.string().max(20).required();
    const validationResult = schema.validate(email);

    //If we didn't use Joi to validate and check for a valid URL parameter below
    // we could run our userCollection.find and it would be possible to attack.
    // A URL parameter of user[$ne]=name would get executed as a MongoDB command
    // and may result in revealing information about all users or a successful
    // login without knowing the correct password.
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.send(
            "<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>"
        );
        return;
    }

    const result = await userCollection
        .find({ email: email })
        .project({ name: 1, email: 1, password: 1, _id: 1 })
        .toArray();

    console.log(result);

    res.send(`<h1>Hello ${email}</h1>`);
});

app.get("/about", (req, res) => {
    var color = req.query.color;

    res.send(
        "<h1 style='color:" + color + ";'>Joseph Louwerse is a cool guy!</h1>"
    );
});

app.get("/meme" /*/:id"*/, (req, res) => {
    // var meme = req.params.id;
    var meme = 1;

    if (meme == 1) {
        res.send(
            "Walt: <br/> <img src='/breaking-bad-walter-white.gif' style='width:250px;'>"
        );
    } else if (meme == 2) {
        res.send(
            "Undertime Slopper: <br/> <img src='/i-love-undertime-slopper-undertime.gif' style='width:250px;'>"
        );
    } else if (meme == 3) {
        res.send(
            "Undertime Slopper Again: <br/> <img src='/undertime-slopper-undertime.gif' style='width:250px;'>"
        );
    } else if (meme == 4) {
        res.send(
            "Corecore: <br/> <img src='/corecore.webp' style='width:250px;'>"
        );
    } else {
        res.send("Invalid meme id: " + meme);
    }
});

app.get("/admin", sessionValidation, /*, adminAuthorization,*/ async (req, res) => {
    const result = await userCollection
        .find()
        .project({ name: 1, _id: 1 })
        .toArray();

    res.render("admin", { users: result });
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
});
app.listen(port, () => {
    console.log("Node application listening on port " + port);
});
