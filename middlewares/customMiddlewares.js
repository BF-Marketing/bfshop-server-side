import dotenv from 'dotenv';
dotenv.config()

const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const submitedProductValidation = (req, res, next) => {
    if(req.files === null || req.files === undefined){
        return res.json({message: "Please, upload an image"});
    }
    else if(req.body.name === null || req.body.name === ""){
        return res.json({message: "Name cannot be empty"});
    }
    else if(req.body.seller === null || req.body.seller === ""){
        return res.json({message: "Seller cannot be empty"});
    }
    else if(req.body.description === null || req.body.description === ""){
        return res.json({message: "Description cannot be empty"});
    }
    else if(req.body.category === null || req.body.category === "" || req.body.category === "Choose category"){
        return res.json({message: "Choose a category"});
    }
    else if(req.body.size === undefined || req.body.size.length === 0 ){
        return res.json({message: "Size cannot be empty"});
    }
    else if(req.body.color === null || req.body.color === ""){
        return res.json({message: "Color cannot be empty"});
    }
    else if(req.body.price === null || parseFloat(req.body.price) === 0){
        return res.json({message: "Price cannot be empty"});
    }
    else if(req.body.inStock === null || parseFloat(req.body.inStock) === 0){
        return res.json({message: "Stock cannot be empty"});
    }
    else if(req.body.shipping === null || req.body.shipping === "" || req.body.shipping === "Shipping method"){
        return res.json({message: "Choose a shipping method"});
    }
    next()
}

export const orderProductValidation = (req, res, next) => {
    if(req.body.firstName === null || req.body.firstName === ""){
        return res.json({message: "First name cannot be empty"});
    }
    else if(req.body.lastName === null || req.body.lastName === ""){
        return res.json({message: "Last name cannot be empty"});
    }
    if(req.body.email === null || req.body.email === ""){
        return res.json({message: "Email cannot be empty"});
    }
    else if(!regex.test(req.body.email)){
        return res.json({message: "Email is not valid"});
    }
    else if(req.body.phoneNumber === null || req.body.phoneNumber === "" || parseInt(req.body.phoneNumber) === 0){
        return res.json({message: "Phone number cannot be empty"});
    }
    else if(req.body.address === null || req.body.address === ""){
        return res.json({message: "Address cannot be empty"});
    }
    else if(req.body.city === null || req.body.city === ""){
        return res.json({message: "City cannot be empty"});
    }
    else if(req.body.zipcode === null || req.body.zipcode === "" || parseInt(req.body.zipcode) === 0){
        return res.json({message: "Zipcode cannot be empty"});
    }
    else if(req.body.state === null || req.body.state === "" ){
        return res.json({message: "State cannot be empty"});
    }
    else if(req.body.country === null || req.body.country === ""){
        return res.json({message: "Country cannot be empty"});
    }
    else if(req.body.cardNumber === null || req.body.cardNumber === "" || parseInt(req.body.cardNumber) === 0){
        return res.json({message: "Card number cannot be empty"});
    }
    else if(req.body.cvc === null || req.body.cvc === ""){
        return res.json({message: "Card security code cannot be empty"});
    }
    else if(req.body.cardExp === null || req.body.cardExp === "" || req.body.cardExp === "2021-09"){
        return res.json({message: "Please, provide a card that expires after 09/2021"});
    }
    else if(req.body.total === undefined || req.body.total === null || req.body.total === "" || parseFloat(req.body.total) === 0){
        return res.json({message: "Total cannot be empty"});
    }
    else if(req.body.productList === undefined || req.body.productList === null || req.body.productList.length === 0){
        return res.json({message: "Please, add items to the cart"});
    }
    next()
}
