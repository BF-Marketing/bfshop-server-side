import easyinvoice from "easyinvoice";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config()

export function generateInvoice(clientInfo, responseCallback){
    var data = {
        "documentTitle": "RECEIPT",
        "currency": "USD",
        "taxNotation": "vat",
        "marginTop": 25,
        "marginRight": 25,
        "marginLeft": 25,
        "marginBottom": 25,
        logo: fs.readFileSync('./logo/bfshop.png', 'base64'),
        "sender": {
            "company": "BF Shop",
            "address": "BFShop Street 123",
            "zip": "1234 BFS",
            "city": "BFShop town",
            "country": "BFShop country"
        },
        "client": {
            "company": `${clientInfo.firstName} ${clientInfo.lastName}`,
            "address": `${clientInfo.address}`,
            "zip": `${clientInfo.zipcode}`,
            "city": `${clientInfo.city}`,
            "country": `${clientInfo.country}`
        },
        "invoiceNumber": "2021.0001",
        "invoiceDate": `${clientInfo.date}`,
        "products": clientInfo.productList,
        "bottomNotice": "This a receipt of your order"
    };

    // The response will contain a base64 encoded PDF file
    easyinvoice.createInvoice(data, function (result) {
        const dir = './receipts';
        const fullpath = `./receipts/${clientInfo.dateMilisecs}RECEIPT${clientInfo.lastName}.pdf`;
        const filename = `${clientInfo.dateMilisecs}RECEIPT${clientInfo.lastName}.pdf`;
        if(!fs.existsSync(dir)){ fs.mkdirSync(dir); }

        fs.writeFileSync(fullpath, result.pdf, 'base64');
        emailSender(fullpath, filename, clientInfo.lastName, clientInfo.email, responseCallback);
    });
}

// sends email to client with its receipt order
function emailSender (filepath, filename, clientLastName, clientEmail, responseCallback) {
    // Generate test SMTP service account from ethereal.email
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.MY_EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    const options = {
        from: process.env.MY_EMAIL,
        to: `${clientEmail.trim()}`,
        subject: "BF SHOP Order receipt",
        text: `Dear ${clientLastName}, \nThis is a confirmation that you've made a purchase on BF Shop.\nYour receipt is attached to this email.\nBest Regards,\nBF Shop Sales Team`,
        attachments: [
            {filename: `${filename}`, path: `${filepath}`}
        ]
    }

    transporter.sendMail(options, function (err, info){
        if(err){
            responseCallback(false);
        }
        else{
            responseCallback(true);

            // Deletes receipt pdf file after sending it through email
            try{
                fs.unlinkSync(filepath)
            }  
            catch(err){}
        }
    })
}
