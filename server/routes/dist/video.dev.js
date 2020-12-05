"use strict";

var express = require('express');

var router = express.Router();

var multer = require('multer');

var ffmpeg = require('fluent-ffmpeg');

var path = require('path');

var _require = require("../models/Video"),
    Video = _require.Video;

var _require2 = require("../models/Subscriber"),
    Subscriber = _require2.Subscriber;

var _require3 = require("../middleware/auth"),
    auth = _require3.auth;

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function filename(req, file, cb) {
    cb(null, "".concat(Date.now(), "_").concat(file.originalname));
  }
});
var upload = multer({
  storage: storage,
  fileFilter: function fileFilter(req, file, cb) {
    var ext = path.extname(file.originalname);

    if (ext !== '.mp4') {
      return cb(res.status(400).end('only mp4 is allowed'), false);
    }

    cb(null, true);
  }
}).single("file"); //=================================
//             VIDEO
//=================================

router.post("/uploadfiles", function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.json({
        success: false,
        err: err
      });
    }

    return res.json({
      success: true,
      filePath: res.req.file.path,
      fileName: res.req.file.filename
    });
  });
});
router.post("/thumbnail", function (req, res) {
  var thumbsFilePath = "";
  var fileDuration = "";
  ffmpeg.ffprobe(req.body.filePath, function (err, metadata) {
    console.dir(metadata);
    console.log(metadata.format.duration);
    fileDuration = metadata.format.duration;
  });
  ffmpeg(req.body.filePath).on('filenames', function (filenames) {
    console.log('Will generate ' + filenames.join(', '));
    thumbsFilePath = "uploads/thumbnails/" + filenames[0];
  }).on('end', function () {
    console.log('Screenshots taken');
    return res.json({
      success: true,
      thumbsFilePath: thumbsFilePath,
      fileDuration: fileDuration
    });
  }).screenshots({
    // Will take screens at 20%, 40%, 60% and 80% of the video
    count: 3,
    folder: 'uploads/thumbnails',
    size: '320x240',
    // %b input basename ( filename w/o extension )
    filename: 'thumbnail-%b.png'
  });
});
router.get("/getVideos", function (req, res) {
  Video.find().populate('writer').exec(function (err, videos) {
    if (err) return res.status(400).send(err);
    res.status(200).json({
      success: true,
      videos: videos
    });
  });
});
router.post("/uploadVideo", function (req, res) {
  var video = new Video(req.body);
  video.save(function (err, video) {
    if (err) return res.status(400).json({
      success: false,
      err: err
    });
    return res.status(200).json({
      success: true
    });
  });
});
router.post("/getVideo", function (req, res) {
  Video.findOne({
    "_id": req.body.videoId
  }).populate('writer').exec(function (err, video) {
    if (err) return res.status(400).send(err);
    res.status(200).json({
      success: true,
      video: video
    });
  });
});
router.post("/getSubscriptionVideos", function (req, res) {
  //Need to find all of the Users that I am subscribing to From Subscriber Collection 
  Subscriber.find({
    'userFrom': req.body.userFrom
  }).exec(function (err, subscribers) {
    if (err) return res.status(400).send(err);
    var subscribedUser = [];
    subscribers.map(function (subscriber, i) {
      subscribedUser.push(subscriber.userTo);
    }); //Need to Fetch all of the Videos that belong to the Users that I found in previous step. 

    Video.find({
      writer: {
        $in: subscribedUser
      }
    }).populate('writer').exec(function (err, videos) {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        success: true,
        videos: videos
      });
    });
  });
});
module.exports = router;