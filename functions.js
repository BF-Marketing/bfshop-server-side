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
        // logo/image was converted in base64
        logo: "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",
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
            console.log(err);
            responseCallback(false);
        }
        else{
            responseCallback(true);

            // Deletes receipt pdf file after sending it through email
            try{
                fs.unlinkSync(filepath)
            }  
            catch(err){
                console.log(err);
            }
        }
    })
}
