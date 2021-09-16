import mongoose from 'mongoose';
const accessoriesSchema = mongoose.Schema({
    name: String,
    seller: String,
    description: String,
    image: String,
    likes: [{
        userid: String,
        createdAt: {
            type: Date,
            default: new Date()
        }
    }],
    size: [String],
    shipping: String,
    color: String,
    category: String, 
    inStock: Number, 
    price: Number, 
    createdAt: {
        type: Date,
        default: new Date()
    },
    user: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
});

const AccessoriesModel = mongoose.model('accessories', accessoriesSchema);
export default AccessoriesModel;
