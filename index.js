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
            "Walt: <img src='/breaking-bad-walter-white.gif' style='width:250px;'>"
        );
    } else if (meme == 2) {
        res.send(
            "Undertime Slopper: <img src='/i-love-undertime-slopper-undertime.gif' style='width:250px;'>"
        );
    } else if (meme == 3) {
      res.send("Undertime Slopper Again: <img src='/undertime-slopper-undertime.gif' style='width:250px;'>");
    } else if (meme == 4) {
        res.send("Corecore: <img src='/corecore.webp' style='width:250px;'>");
    } else {
        res.send("Invalid meme id: " + meme);
    }
});

app.use(express.static(__dirname + "/public"));

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});
