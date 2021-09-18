import mongoose from 'mongoose';
import express from 'express';
import expreSession from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config()

import accessoriesModel from './models/accessoriesModel.js';
import clothingModel from './models/clothingModel.js';
import shoesModel from './models/shoesModel.js';
import userModel from './models/userModel.js';
import { loginValidation, registerValidation, submitedProductValidation, orderProductValidation, verifyUserAuth } from './middlewares/customMiddlewares.js';
import { generateInvoice } from './functions.js';

const app = express();
const mongoDBsession = MongoDBStore(expreSession);
const store = new mongoDBsession({
    uri: process.env.MONGODB_URI, 
    collection: process.env.MONGODB_SESSION_COLLECTION
});

// Middleware
app.use(cors({origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('images'))
app.use(fileUpload())
app.use('/login', loginValidation)
app.use('/register', registerValidation)
app.use('/submitproduct', submitedProductValidation)
app.use('/submitorder', orderProductValidation)

app.use(expreSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: parseInt(process.env.COOKIE_MAX_AGE), secure: true },
    store: store
}));

// gets all products from the database
app.get('/all-products', async (req, res) => {
    const accessoriesinfo = await accessoriesModel.find({});
    const clothinginfo = await clothingModel.find({});
    const shoesinfo = await shoesModel.find({});  
    if(req.session.status && req.session.status.auth){
        res.json({auth: true, id: req.session.status.id, username: req.session.status.username, products: [accessoriesinfo, clothinginfo, shoesinfo] });
    }
    else{
        res.json({auth: false, products: [accessoriesinfo, clothinginfo, shoesinfo]});
    }
});

// search for product based on user input
app.get('/search', async (req, res) => {
    const userinput = req.query.item.replace(/[^a-zA-Z ]/g, "").trim();
    const accessoriesinfo = await accessoriesModel.find({name: { $regex: '.*' + userinput + '.*', $options: 'i' }});
    const clothinginfo = await clothingModel.find({name: { $regex: '.*' + userinput + '.*', $options: 'i' }});
    const shoesinfo = await shoesModel.find({name: { $regex: '.*' + userinput + '.*', $options: 'i' }});

    const compiledResult = [];
    accessoriesinfo.forEach(each => compiledResult.push(each));
    clothinginfo.forEach(each => compiledResult.push(each));
    shoesinfo.forEach(each => compiledResult.push(each));

    res.send(compiledResult);
});

// logs a user in
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    userModel.findOne({username: username}, (error, user) => {
        if(error){
            res.json({auth: false, message: 'Error: something happened. Try reloading the page'});
        }
        else{
            if(user){
                bcrypt.compare(password, user.password, (error, same) =>{
                    if(error){
                        res.json({auth: false, message: 'Error: something happened. Try reloading the page'});
                    }
                    else{
                        if(same){
                            req.session.status = {auth: true, id: user._id.toString(), username: user.username};
                            res.json(req.session.status);
                        }
                        else{
                            res.json({auth: false, message: 'Wrong password'});
                        }
                    }
                })
            }
            else{
                res.json({auth: false, message: 'User does not exist'});
            }
        }
    });
});

// registers a user
app.post('/register', (req, res) => {
    const { email } = req.body;
    userModel.findOne({email: email}, (error, user) => {
        if(error){
            res.json({auth: false, message: 'Error: something happened. Try reloading the page'});
        }
        else{
            if(!user){
                userModel.create(req.body, (error, user) => {
                    if(error){
                        res.json({auth: false, message: 'Error: something happened. Try reloading the page'});
                    }
                    else{
                        req.session.status = {auth: true, id: user._id.toString(), username: user.username};
                        res.json(req.session.status);
                    }
                })
            }
            else{
                res.json({auth: false, message: 'There is already a user with the same email'});
            }
        }
    });
});

// logs user out
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if(!err){
            res.json({auth: false, message: "logged out" })
        }        
    });
});

// registers which user liked a particular product
app.put("/likedproduct", (req, res) => {
    switch(req.body.category){
        case "T-shirts":
        case "Pants":
            clothingModel.findByIdAndUpdate(req.body.productId, {$addToSet: {likes: {userid: req.body.userid} }}, (error, product) => {
                !error ? res.end("Product updated") : null; 
            })
            break;
        case "Sneakers":
        case "Boots":
            shoesModel.findByIdAndUpdate(req.body.productId, {$addToSet: {likes: {userid: req.body.userid} }}, (error, product) => {
                !error ? res.end("Product updated") : null;
            })
            break;
        default:
            accessoriesModel.findByIdAndUpdate(req.body.productId, {$addToSet: {likes: {userid: req.body.userid} }}, (error, product) => {
                !error ? res.end("Product updated") : null;
            })
    }
});

// submits an order
app.post('/submitorder', verifyUserAuth, (req, res) => {
    req.body.productList = JSON.parse(req.body.productList);
    const todayDate = new Date();
    function responseCallback(cb_result){ res.send(cb_result) }

    req.body.date = `${todayDate.getMonth()}/${todayDate.getDay()}/${todayDate.getFullYear()}`;
    req.body.dateMilisecs = new Date().getTime();

    if(!fs.existsSync(`./receipts/${new Date().getTime()}RECEIPT${req.body.lastName}.pdf`)){ 
        generateInvoice(req.body, responseCallback);
    }
})

// submits a product
app.post('/submitproduct', verifyUserAuth, (req, res) => {
    req.body.price = parseFloat(req.body.price);
    req.body.inStock = parseInt(req.body.inStock);
    req.body.size = typeof(req.body.size) === 'string' ? [req.body.size] : req.body.size;
    
    const productImage = req.files.image;
    const newName = new Date().getTime() + productImage.name.split(".")[0] + "." + productImage.name.split(".").pop();

    if(!fs.existsSync(`images/${req.session.status.id}`)){ fs.mkdirSync(`images/${req.session.status.id}`) }
    
    const createDocument = {...req.body, seller: req.session.status.username, likes: [], image: `${process.env.HOST_URL}${req.session.status.id}/${newName}`};

    // moves file to a folder with the user's id & add data to database 
    productImage.mv(path.resolve(path.dirname(''),'images', req.session.status.id, newName), (error) => {  
        if(error){
            res.json({auth: true, message: 'Error: something happened. Try reloading the page'});
        }
        else{
            if(req.body.category === "T-shirts" || req.body.category === "Pants"){
                clothingModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({auth: true, message: 'Error: something happened. Try reloading the page'})
                    : res.json({auth: true, message: 'Product submitted', newProduct: newProduct});
                })
            }
            else if(req.body.category === "Sneakers" || req.body.category === "Boots"){
                shoesModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({auth: true, message: 'Error: something happened. Try reloading the page'})
                    : res.json({auth: true, message: 'Product submitted', newProduct: newProduct});
                })
            }
            else if(req.body.category === "Watches" || req.body.category === "Bracelets"){
                accessoriesModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({auth: true, message: 'Error: something happened. Try reloading the page'})
                    : res.json({auth: true, message: 'Product submitted', newProduct: newProduct});
                });
            }
        }        
    });
}); 

const PORT = process.env.PORT || 5000;
mongoose.connect(`${process.env.MONGODB_URI}`, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => {
        console.log('Connected to MongoDB database...');
        return app.listen({port: PORT});
    }).then(res => {
        console.log(`Server running at ${PORT}`);
    })
    .catch(err => {
        console.error(err)
    })