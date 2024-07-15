const mongoose = require("mongoose");
const { Schema } = mongoose;

const userData = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
}, { versionKey: false, timestamps: true });

const userModel = mongoose.model('User', userData);

module.exports = userModel;
