const mongoose = require("mongoose");
const { Schema } = mongoose;


const inventoryData = new Schema({
    name: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: Number, // Assuming the product ID from the external API is a number
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
}, { versionKey: false, timestamps: true });

const inventoryModel = mongoose.model('Inventory', inventoryData);
module.exports = inventoryModel