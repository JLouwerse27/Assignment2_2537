
require("./utils.js");

require('dotenv').config();
const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3005;//Childish Gambino

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

var {database} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.get("/", (req, res) => {

    var email = req.body.email;
    var password = req.body.password;

    var usershtml = "";
    if (req.session.authenticated) {
        var loggedhtml = `
        <form action='/members' method='get'>
            <button>Go to members area</button>
        </form>
        <form action='/logout' method='get'>
            <button>Log out</button>
        </form>
        `;

        res.send(loggedhtml);
        return;
    } else {

        var notloggedhtml = `
        <form action='/signup' method='get'>
            <button>Sign up</button>
        </form>
        <form action='/login' method='get'>
            <button>Log in</button>
        </form>
        `;
        res.send(notloggedhtml);
    }
});

app.get("/members",  (req, res) => {

    var name = req.session.name;
    var html;

    if (req.session.authenticated) {
        html = `Hello, ` + name;
    } else {
        html = `not auth`;
    }

    
    // var rand  = Math.random() * 3 + 1;

    // if (rand == 1){
    //     html += "<img src='/breaking-bad-walter-white.gif' style='width:250px;'>";
    // } else if (rand == 2){
    //     html += "<img src='/breaking-bad-walter-white.gif' style='width:250px;'>";
    // } else if (rand == 3){
    //     html += "<img src='/breaking-bad-walter-white.gif' style='width:250px;'>";
    // }
    
    res.send(html);
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get("/signup", (req, res) => {
    var html = `
    create user
    <form action='/submitsignup' method='post'>
    <input name='name' type='text' placeholder='name'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});


app.post('/redirectToSignup', (req,res) => {
    res.redirect('/signup');
});

app.post('/submitsignup', async (req,res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object(
		{
            name: Joi.string().alphanum().max(20).required(),
			email: Joi.string().alphanum().max(20).required(),
			password: Joi.string().max(20).required()
		});
	
	const validationResult = schema.validate({name, email, password});
    
	if (validationResult.error != null) {
	//    console.log(validationResult.error);
       var badhtml = validationResult.error.message;

	   badhtml += "<form action='/redirectToSignup' method='post'>"
        + "<button> Try again</button>"
        + "</form>";
       res.send(badhtml);
	   return;
   }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
	
	await userCollection.insertOne({name: name, email: email, password: hashedPassword});
	console.log("Inserted user");


    //If the email and passwords match store the user's name in a session
    req.session.authenticated = true;
    req.session.name = name;
    // and log the user in (redirect to /members).
    res.redirect("/members");
    // var html = "successfully created user";
    // res.send(html);


    // var html;

    // if (!name) {
    //     html = "name is required";
    //     html += "<form action='/redirectToSignup' method='post'>"
    //     + "<button> Try again</button>"
    //     + "</form>";
    //     res.send(html);
    //     return;
    // }else if (!email) {
    //     html = "email is required";
    //     html += "<form action='/redirectToSignup' method='post'>"
    //     + "<button> Try again</button>"
    //     + "</form>";
    //     res.send(html);
    //     return;
    // }else if (!password) {
    //     html = "password is required";
    //     html += "<form action='/redirectToSignup' method='post'>"
    //     + "<button> Try again</button>"
    //     + "</form>";
    //     res.send(html);
    //     return;
    // }else {
    //     res.send("Thanks for subscribing with your email: "+email);
    // }

    // var hashedPassword = bcrypt.hashSync(password, saltRounds);


});

app.get('/login', (req,res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});


app.get("/about", (req, res) => {
    var color = req.query.color;

    res.send("<h1 style='color:" + color + ";'>Joseph Louwerse is a cool guy!</h1>");
});

app.get('/meme/:id', (req, res) => {
    var meme = req.params.id;

    if (meme == 1) {
        res.send(
            "Walt: <br/> <img src='/breaking-bad-walter-white.gif' style='width:250px;'>"
        );
    } else if (meme == 2) {
        res.send(
            "Undertime Slopper: <br/> <img src='/i-love-undertime-slopper-undertime.gif' style='width:250px;'>"
        );
    } else if (meme == 3) {
      res.send("Undertime Slopper Again: <br/> <img src='/undertime-slopper-undertime.gif' style='width:250px;'>");
    } else if (meme == 4) {
        res.send("Corecore: <br/> <img src='/corecore.webp' style='width:250px;'>");
    } else {
        res.send("Invalid meme id: " + meme);
    }
});



app.post('/loggingin', async (req,res) => {
    //var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().max(20).required();
	const validationResult = schema.validate(email);
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/login");
	   return;
	}

	const result = await userCollection.find({email: email}).project({email: 1, password: 1, _id: 1}).toArray();

	console.log(result);
	if (result.length != 1) {
		console.log("user not found");
		res.redirect("/login");
		return;
	}
	if (await bcrypt.compare(password, result[0].password)) {
		console.log("correct password");
		req.session.authenticated = true;
		req.session.email = email;
		req.session.cookie.maxAge = expireTime;

		res.redirect('/loggedIn');
		return;
	}
	else {
		console.log("incorrect password");
		res.redirect("/login");
		return;
	}
});

app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var html = 
    "You are logged in!"
    + " <form action='/redirectToHome' method='post'>"
    + "<button>Go Back Home </button>"
    + "</form>";
    res.send(html);
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
    var html = "<img src='/mike.avif' style='width:250px;'> <br/>"
    + "404 Error. <br/> Hey, pal. Looks like you've found yourself in a bit of a situation here. The page you're looking for? Yeah, it's not here. Not anymore, at least. These things happen, you know, like a half measure gone wrong."

    + "Now, I've seen my fair share of messes, but this one? It's not so bad. Just take a step back, gather yourself, and give it another shot. You might even find what you're looking for."
    
    + "In the meantime, do yourself a favor and click that little button down there. It'll take you back to safety - a place where things make sense. And remember, kid: No more half measures."
    
    + "List of commands: /, /contact, /meme/:id, /signup, /login, /loggedin, /about"

    + " <form action='/redirectToHome' method='post'>"
    + "<button>Go Back Home </button>"
    + "</form>"
	res.send(html);
})

app.post('/redirectToHome', (req,res) => {
    res.redirect('/');
});


app.listen(port, () => {
    console.log("Node application listening on port " + port);
});
