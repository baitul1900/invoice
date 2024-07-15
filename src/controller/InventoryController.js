const fetchProducts = require('../service/fetchProducts');
const uderModel = require('../models/InventoryModel');
const userModel = require('../models/userModel');
const inventoryModel = require('../models/InventoryModel');
const mongoose = require('mongoose');
const { date } = require('yup');

let userID = mongoose.Types.ObjectId;

const getProducts = async (req, res) => {
    try {
        const products = await fetchProducts();
        return res.status(200).json({ status: 'success', data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Failed to fetch products' });
    }
};


// adding product into inventory 
const addToInventory = async (req, res) => {
    try {
        const {userId, productId, name, quantity, price, description, image} = req.body;

         // Check if the user exists
         const user = await userModel.findOne({ _id: userId });
         if (!user) {
             return res.status(404).json({ error: 'User not found' });
         }
         
         // Check if the product exists
         const existingInventory = await inventoryModel.findOne({userId, productId});
         
         if(existingInventory) {
            // if product is already in inventory update the quantity
            existingInventory.quantity += quantity;
            await existingInventory.save();
            return res.status(200).json({ message: 'Product added to inventory' });
         } else {
            // then create a new inventory
            const inventory = new inventoryModel({userId, productId, name, quantity, price, description, image});
            await inventory.save();
            return res.status(200).json({ message: 'Product added to inventory' });
         }

         res.json({ message: 'Product added to inventory' });
    } catch (error) {
        console.error('Error adding product to inventory:', error);
        return res.status(500).json({ error: 'Failed to add product to inventory' });
    }
}
// end


// get list of inventory added by user 
const inventoryList = async (req, res) => {
    try {
        const {userId} = req.params;

        // find the item and aggrate
        const inventory = await inventoryModel.aggregate([
            {$match: { userId: userID }},
            // join opration here

            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },

            {
                $unwind: '$user'
            },

            {
                $project: {
                    _id: 0,
                    productId: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    quantity: 1,
                    userName: '$user.name',
                    userEmail: '$user.email',
                },
            }

        ])

        return res.status(200).json({ status: 'success', data: inventory });
    } catch (error) {
        console.error('Error in inventoryList:', error);
        return res.status(500).json({ error: 'Failed to get inventory list' });
    }
}



module.exports = {
    getProducts, 
    addToInventory,
    inventoryList
}