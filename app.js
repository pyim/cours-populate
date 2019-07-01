const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const methodeOverride = require("method-override");
const path = require("path");
const sharp = require("sharp")

// Upload image
const multer = require("multer")
const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, './public/uploads')
    },

    filename: function(req, file, cb) {

        const ext = path.extname(file.originalname);
        const date = Date.now();

       cb(null, date + '-' + file.originalname)
       // cb(null, file.originalname + '-' + date + ext)
    }


})

const upload = multer({ 
                        storage: storage,
                        limits: {
                            fileSize: 8 * 2048 * 2048,
                            files: 1,
                        },
                        fileFilter : function (req, file, cb) {
                            if(
                                file.mimetype === "image/png" ||
                                file.mimetype === "image/jpg" ||
                                file.mimetype === "image/jpeg" ||
                                file.mimetype === "image/gif"
                            ) {
                                cb(null, true)  
                            } else
                             cb(new Error('Le fichier doit être au format png, jpg, jpeg ou gif.'))
      }

})
// const upload = multer({ dest: 'uploads/' })

// Express 
const port = 1981;
const app = express();

// Express Static
app.use(express.static("public"))


// Method-override
app.use(methodeOverride("_method"));

// Handlebars
app.engine('hbs', exphbs({defaultLayout: 'main', extname: 'hbs'}));
app.set('view engine', 'hbs')

// BodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));


// MongoDB
mongoose.connect("mongodb://localhost:27017/boutiqueGame", { useNewUrlParser: true})

const productSchema = {
    title: String,
    content: String,
    price: Number,
    cover: {
        name: String,
        originalName : String,
        path: String,
        urlSharp : String,
        createAt: Date
    }
};

const Product = mongoose.model("product", productSchema)


// Routes
app.route("/")
.get((req,res) => {
    // MyModel.find({ name: 'john', age: { $gte: 18 }}, function (err, docs) {});
    Product.find(function(err, produit) {
        if(!err) {
            res.render("index", {
                product : produit
            })
        } else {
            res.send(err)
        }
    })
})
.post(upload.single("cover"), (req, res)=> {

    const file = req.file;
    console.log(file)

    sharp(file.path)
    .resize( 200)
    .webp({ quality: 80})
    .rotate(90)
    .toFile('./public/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp" , (err, info) => { });

    const newProduct = new Product({
        title: req.body.title,
        content: req.body.content,
        price: req.body.price
    });

    if(file) {
        newProduct.cover = {
            name: file.filename,
            originalName : file.originalname,
            //path: "uploads/" + filename 
            path: file.path.replace("public", ""),
            urlSharp : '/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp",
            createAt: Date.now(),
        }
    }



    newProduct.save(function(err){
        if(!err) {
            res.send("save ok !")
        }
        else {
            res.send(err)
        }
    })
    
})
.delete(function(req,res){
    Product.deleteMany(function(err){
        if(!err) {
            res.send("All delete")
        }
        else {
            res.send(err)
        }
    })
})



// Route édition
app.route("/:id")
.get(function(req,res) {
    // Adventure.findOne({ type: 'iphone' }, function (err, adventure) {});
    Product.findOne(
        {_id : req.params.id},
        function(err, produit){
            if(!err) {
                res.render("edition", {
                    _id: produit.id,
                    title: produit.title,
                    content:produit.content,
                    price:produit.price,
                    cover : produit.cover.urlSharp
                })
            } else {
                res.send("err")
            }
        }
    )
})
.put(upload.single("cover"),function(req, res) {

    const file = req.file;
    sharp(file.path)
    .resize( 200)
    .webp({ quality: 80})
    .rotate(90)
    .toFile('./public/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp" , (err, info) => { });




    Product.update(
        //condition
            {_id: req.params.id},
        // update
            {
                title: req.body.title,
                content: req.body.content,
                price: req.body.price,
                cover : {
                    name: file.filename,
                    originalName : file.originalname,
                    //path: "uploads/" + filename 
                    path: file.path.replace("public", ""),
                    urlSharp : '/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp",
                    createAt: Date.now(),
                }
            },
        // option
        {multi:true},
        // exec
        function(err){
            if(!err) {
                res.send("Update OK !")
            }
            else {
                res.send(err)
            }
        }
    )
})
.delete(function(req, res){
    Product.deleteOne(
        {_id: req.params.id},
        function(err) {
            if(!err){
                res.send("product delete")
            }
            else {
                res.send(err)
            }
        }
    )
})






app.listen(port, function() {
    console.log(`Ecoute le port ${port}, lancé à : ${new Date().toLocaleString()}`);
    
})