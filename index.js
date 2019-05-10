const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");

app.listen(3002, () => {
    console.log("running on 3002...");
});

app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.render("index");
});

mongoose.connect("mongodb+srv://Tony:1234@myfirstdb-1slkm.gcp.mongodb.net/test?retryWrites=true");
let con = mongoose.connection;

Grid.mongo = mongoose.mongo;
let gfs = Grid(con.db, mongoose.mongo);

let storage = GridFsStorage({
    gfs: gfs,
    filename: function(req, file, cb){
        let datetimestamp = Date.now();
        cb(null, file.filename + "-" + datetimestamp+"."+file.originalname.split(".")[file.originalname.split(".").length -1]);
    },
    metadata: function(req, file, cb){
        cb(null, {
            originalname: file.originalname
        });
    },
    root: "ctFiles"
});

let upload = multer({
    storage: storage
}).single("file");

app.post("/upload", (req, res) => {
    upload(req, res, () => {
        if(err){
            res.json({
                error_code: 1,
                err_desc: err
            });
        }
        res.json({
            error_code: 0,
            err_desc: null
        });
    });
});

app.get("/file/:filename", (req, res) => {
    gfs.collection("ctFiles");
    gfs.files.find({
        filename: req.params.filename
    }).toArray((err, files) => {
        if(!files || files.length === 0){
            return res.status(404).json({
                responseCode: 1,
                responseMessage: "error"
            });
        }

        let readstream = gfs.createReadStream({
            filename: files[0].filename,
            root: "ctFiles"
        });
        
        res.set("Content-Type", files[0].contentType);

        return readstream.pipe(res);
    });
});

