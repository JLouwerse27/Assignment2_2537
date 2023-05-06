
require('dotenv').config();
const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3003;//Childish Gambino

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)


//Users and Passwords (in memory 'database')
var users = []; 

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@joescluster1.frlz0mu.mongodb.net/?retryWrites=true&w=majority`,
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
    var html = `
    <form action='/signup' method='get'>
        <button>Sign up</button>
    </form>
    <form action='/login' method='get'>
        <button>Log in</button>
    </form>
    `;
    res.send(html);
});

app.get("/signup", (req, res) => {
    var html = `
    signup dummy text
    `;
    res.send(html);
});

app.get("/login", (req, res) => {
    var html = `
    login dummy text
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

app.get('/contact', (req,res) => {
    var missingEmail = req.query.missing;
    var html = `
        email address:
        <form action='/submitEmail' method='post'>
            <input name='email' type='text' placeholder='email'>
            <button>Submit</button>
        </form>
    `;
    if (missingEmail) {
        html += "<br> email is required";
    }
    res.send(html);
});

app.post('/submitEmail', (req,res) => {
    var email = req.body.email;
    if (!email) {
        res.redirect('/contact?missing=1');
    }
    else {
        res.send("Thanks for subscribing with your email: "+email);
    }
});

app.get('/createUser', (req,res) => {
    var html = `
    create user
    <form action='/submitUser' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.get('/login', (req,res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.post('/submitUser', (req,res) => {
    var username = req.body.username;
    //var email = req.body.email;
    var password = req.body.password;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({ username: username, password: hashedPassword });

    console.log(users);

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        usershtml += "<li>" + users[i].username + ": " + users[i].password + "</li>";
    }

    var html = "<ul>" + usershtml + "</ul>";
    res.send(html);
});

app.post('/loggingin', (req,res) => {
    var username = req.body.username;
    var password = req.body.password;

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;

                res.redirect('/loggedIn');
                return;
            }
        }
    }

    //user and password combination not found
    res.redirect("/login");
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
