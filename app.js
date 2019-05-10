const express = require("express");
const path = require("path");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const formidable = require("formidable");

const port = process.env.PORT || 5000;
const app = express();
app.listen(port, () => {
    console.log("running on 5000...");
});
//Middelware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

const mongoURI = "mongodb+srv://Tony:1234@myfirstdb-1slkm.gcp.mongodb.net/test?retryWrites=true";
const conn = mongoose.createConnection(mongoURI);

//init gfs
let gfs;
conn.once("open", () => {
    //init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});

//init storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                // const filename = buf.toString("hex") + path.extname(file.originalname);
                const filename = file.originalname;
                const fileInfo = {
                    filename: filename,
                    bucketName: "uploads"
                };
                resolve(fileInfo);
            });
        });
    },
});
const upload = multer({ storage });

//@route GET /
//load form
app.get("/", (req, res) => {
    // res.render("index");
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            res.render("index", { files: false });
        } else {
            files.map(file => {
                if (file.contentType === "image/jpeg" || file.contentType === "img/png" || file.contentType === "image/png") {
                    file.isImage = true;
                    // file.isAudio = false;
                } else if (file.contentType === "audio/mp3") {
                    // file.isAudio = true;
                    file.isImage = false;
                } else {
                    file.isImage = false;
                    // file.isAudio = false;
                }
            });
            res.render("index", { files: files });
        }
    });
});

//@route POST /upload
app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect("/");
    
});

//@route GET /file
app.get("/files/", (req, res) => {
    gfs.files.find().toArray((err, files) => {
        //check if files
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }

        return res.json(files);
    });
});

//@route GET /file/:filename
app.get("/files/:filename", (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }
        // res.set('Content-Type', file.contentType);
        // res.set('Content-Disposition', "inline; filename=" + file.filename);
        // let read_stream = gfs.createReadStream({ filename: file.filename });
        // read_stream.pipe(res);
        return res.json(file);
    });
});

//@route GET /file/:id
app.get("/id/:id", (req, res) => {
    gfs.files.findOne({ _id: req.params.id }, (err, file) => {
        //check if files
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }

        return res.json(file);
    });
});

//@route GET /image/:filename
//display image
app.get("/image/:filename", (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }
        //check if image
        if (file.contentType === "image/jpeg" || file.contentType === "img/png" || file.contentType === "image/png") {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: "not an image"
            });
        }
    });
});


//@route GET /audio/:filename
app.get("/audio/:filename", (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //check if files
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }
        //check if image
        if (file.contentType === "audio/mp3") {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: "not an audio"
            });
        }
    });
});

//@route DELETE /file:id
//@desc DELETE file
app.delete("/files/:id", (req, res) => {
    gfs.remove({ _id: req.params.id, root: "uploads" }, (err, GridFsStorage) => {
        if (err) {
            return res.status(404).json({ err: err });
        }
        res.redirect("/");
    });
})

