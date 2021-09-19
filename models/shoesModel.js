import mongoose from 'mongoose';
const shoesSchema = mongoose.Schema({
    name: String,
    seller: String,
    description: String,
    image: String,
    likes: Number,
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

const ShoesModel = mongoose.model('shoes', shoesSchema);
export default ShoesModel;
