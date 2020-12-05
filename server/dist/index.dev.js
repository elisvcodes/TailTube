"use strict";

var express = require("express");

var app = express();

var bodyParser = require("body-parser");

var cookieParser = require("cookie-parser");

var config = require("./config/key"); // const mongoose = require("mongoose");
// mongoose
//   .connect(config.mongoURI, { useNewUrlParser: true })
//   .then(() => console.log("DB connected"))
//   .catch(err => console.error(err));


var mongoose = require("mongoose");

var connect = mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('MongoDB Connected...');
})["catch"](function (err) {
  return console.log(err);
});
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/users', require('./routes/users'));
app.use('/api/video', require('./routes/video'));
app.use('/api/subscribe', require('./routes/subscribe'));
app.use('/api/comment', require('./routes/comment'));
app.use('/api/like', require('./routes/like')); //use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client

app.use('/uploads', express["static"]('uploads')); // Serve static assets if in production

if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express["static"]("client/build")); // index.html for all page routes

  app.get("*", function (req, res) {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Server Running at ".concat(port));
});