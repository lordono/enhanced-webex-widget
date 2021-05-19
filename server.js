require("dotenv").config();

// import all necessary packages
const express = require("express");
const cors = require("cors");

const bodyParser = require("body-parser");

const path = require("path");
const app = express();

// parse application/json
app.use(bodyParser.json({ limit: "20mb" }));

// cors setup - no options
app.use(cors());

app.use(express.static(path.join(__dirname, "build")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

//load from router
const indexRouter = require("./mock/router");
app.use("/server", indexRouter);

app.listen(process.env.PORT || 5555);
