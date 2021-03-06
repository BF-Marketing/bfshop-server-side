import mongoose from 'mongoose';
import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import accessoriesModel from './models/accessoriesModel.js';
import clothingModel from './models/clothingModel.js';
import shoesModel from './models/shoesModel.js';
import { submitedProductValidation, orderProductValidation } from './middlewares/customMiddlewares.js';
import { generateInvoice } from './functions.js';
import dotenv from 'dotenv';
dotenv.config()

const app = express();

// Middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('images'))
app.use(fileUpload())
app.use('/submitproduct', submitedProductValidation)
app.use('/submitorder', orderProductValidation)

// gets all products from the database
app.get('/all-products', async (req, res) => {
    const accessoriesinfo = await accessoriesModel.find({});
    const clothinginfo = await clothingModel.find({});
    const shoesinfo = await shoesModel.find({});
    res.send([accessoriesinfo, clothinginfo, shoesinfo]);
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

// registers which user liked a particular product
app.put("/likedproduct", (req, res) => {
    switch(req.body.category){
        case "T-shirts":
        case "Pants":
            clothingModel.findByIdAndUpdate(req.body.productId, {likes: parseInt(req.body.incrementLike)}, (error) => {
                !error ? res.end("Product updated") : null; 
            })
            break;
        case "Sneakers":
        case "Boots":
            shoesModel.findByIdAndUpdate(req.body.productId, {likes: parseInt(req.body.incrementLike)}, (error) => {
                !error ? res.end("Product updated") : null; 
            })
            break;
        default:
            accessoriesModel.findByIdAndUpdate(req.body.productId, {likes: parseInt(req.body.incrementLike)}, (error) => {
                !error ? res.end("Product updated") : null; 
            })
    }
});

// submits an order
app.post('/submitorder', (req, res) => {
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
app.post('/submitproduct', (req, res) => {
    req.body.price = parseFloat(req.body.price);
    req.body.inStock = parseInt(req.body.inStock);
    req.body.likes = 0;
    req.body.size = typeof(req.body.size) === 'string' ? [req.body.size] : req.body.size;
    
    const productImage = req.files.image;
    const dateSent = new Date().getTime();
    const newName = dateSent + productImage.name.split(".")[0] + "." + productImage.name.split(".").pop();

    if(!fs.existsSync(`images/${req.body.seller}`)){ fs.mkdirSync(`images/${req.body.seller}`) }
    
    const createDocument = {...req.body, seller: `${req.body.seller}`, image: `${process.env.HOST_URL}/${req.body.seller}/${newName}`};

    // moves file to a folder with the user's id & add data to database 
    productImage.mv(path.resolve(path.dirname(''),'images', req.body.seller, newName), (error) => {  
        if(error){
            res.json({message: 'Error: something happened. Try reloading the page'});
        }
        else{
            if(req.body.category === "T-shirts" || req.body.category === "Pants"){
                clothingModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({message: 'Error: something happened. Try reloading the page'})
                    : res.json({message: 'Product submitted', newProduct: newProduct});
                })
            }
            else if(req.body.category === "Sneakers" || req.body.category === "Boots"){
                shoesModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({message: 'Error: something happened. Try reloading the page'})
                    : res.json({message: 'Product submitted', newProduct: newProduct});
                })
            }
            else if(req.body.category === "Watches" || req.body.category === "Bracelets"){
                accessoriesModel.create(createDocument, (error, newProduct) => {
                    error ? res.json({message: 'Error: something happened. Try reloading the page'})
                    : res.json({message: 'Product submitted', newProduct: newProduct});
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