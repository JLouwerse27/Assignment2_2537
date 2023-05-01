const express = require("express");

const port = process.env.PORT || 3001;

const app = express();

app.get("/", (req, res) => {
    res.send("<h1>Joseph's website</h1>");
});

app.get("/about", (req, res) => {
    var color = req.query.color;

    res.send("<h1 style='color:" + color + ";'>Joseph Louwerse</h1>");
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

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("<img src='/mike.avif' style='width:250px;'> <br/>"
    + "404 Error. <br/> Hey, pal. Looks like you've found yourself in a bit of a situation here. The page you're looking for? Yeah, it's not here. Not anymore, at least. These things happen, you know, like a half measure gone wrong."

    + "Now, I've seen my fair share of messes, but this one? It's not so bad. Just take a step back, gather yourself, and give it another shot. You might even find what you're looking for."
    
    + "In the meantime, do yourself a favor and click that little button down there. It'll take you back to safety - a place where things make sense. And remember, kid: No more half measures."
    
    + "<br/> <button> Go Back Home </button>");
})

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});
