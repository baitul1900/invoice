const Invoice  = require('../models/InvoiceModel');
const userModel = require('../models/userModel');
const mongoose = require('mongoose');
const inventoryModel = require('../models/InventoryModel');
const {generateInvoiceHTML, generatePDF} = require('../helpers/pdfUtils');

let invoiceID = new mongoose.Types.ObjectId;
const createInvoice = async (req, res) => {
    try {
        const { userId, inventoryIds } = req.body;

        // Fetch user details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let totalAmount = 0;
        const invoiceProducts = [];

        for (const inventoryId of inventoryIds) {
            const inventoryItem = await inventoryModel.findById(inventoryId);

            if (!inventoryItem || inventoryItem.userId.toString() !== userId) {
                return res.status(400).json({ error: `Product ID ${inventoryId} not found or does not belong to the user` });
            }

            const total = inventoryItem.price * inventoryItem.quantity;
            totalAmount += total;

            invoiceProducts.push({
                inventoryId,
                total,
            });

            // Remove the inventory item
            await inventoryModel.findByIdAndDelete(inventoryId);
        }

        // Create the invoice
        const invoice = new Invoice({
            userId,
            products: invoiceProducts,
            totalAmount,
        });

        await invoice.save();

        return res.status(200).json({ message: 'Invoice created successfully', invoice });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return res.status(500).json({ error: 'Failed to create invoice' });
    }
};

// Fetch invoice list for a user
const invoiceListByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Aggregation pipeline to get the invoice details along with user and product details
        const invoices = await Invoice.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },  // Match invoices for the given user ID
            {
                $lookup: {
                    from: 'users',  // Lookup the user collection
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },  // Unwind the user array to a single object
            {
                $lookup: {
                    from: 'inventories',  // Lookup the inventory collection
                    localField: 'products.inventoryId',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $unwind: {
                    path: '$productDetails',
                    preserveNullAndEmptyArrays: true,  // Preserve the empty arrays
                },
            },
            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    products: { $push: { inventoryId: '$products.inventoryId', total: '$products.total', product: '$productDetails' } },
                    totalAmount: { $first: '$totalAmount' },
                    createdAt: { $first: '$createdAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                    },
                    products: {
                        inventoryId: 1,
                        total: 1,
                        product: {
                            _id: 1,
                            name: 1,
                            description: 1,
                            price: 1,
                            image: 1,
                        },
                    },
                    totalAmount: 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },  // Sort invoices by creation date, newest first
        ]);

        if (invoices.length === 0) {
            return res.status(404).json({ error: 'No invoices found for this user' });
        }

        return res.status(200).json({ status: 'success', data: invoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};



  


const viewInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Check if the invoice ID is valid
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ error: 'Invalid invoice ID' });
        }

        // Aggregation pipeline to get the invoice details along with user and product details
        const invoiceDetails = await Invoice.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(invoiceId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'inventories',  // Assuming the inventory collection name is 'inventories'
                    localField: 'products.inventoryId',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $unwind: {
                    path: '$productDetails',
                    preserveNullAndEmptyArrays: true,  // Preserve the empty arrays
                },
            },
            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    products: { $push: { inventoryId: '$products.inventoryId', total: '$products.total', product: '$productDetails' } },
                    totalAmount: { $first: '$totalAmount' },
                    createdAt: { $first: '$createdAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                    },
                    products: {
                        inventoryId: 1,
                        total: 1,
                        product: {
                            _id: 1,
                            name: 1,
                            description: 1,
                            price: 1,
                            image: 1,
                        },
                    },
                    totalAmount: 1,
                    createdAt: 1,
                },
            },
        ]);

        if (!invoiceDetails.length) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        return res.status(200).json(invoiceDetails[0]);
    } catch (error) {
        console.error('Error viewing invoice:', error);
        return res.status(500).json({ error: 'Failed to view invoice' });
    }
};



const printInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Check if the provided ID is a valid MongoDB ObjectID
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ error: 'Invalid invoice ID' });
        }

        // Aggregation pipeline to get the invoice details along with user and product details
        const invoiceDetails = await Invoice.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(invoiceId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'inventories',  // Assuming the inventory collection name is 'inventories'
                    localField: 'products.inventoryId',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1,
                    },
                    products: {
                        inventoryId: 1,
                        quantity: 1,
                        total: 1,
                    },
                    productDetails: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        price: 1,
                        quantity: 1,
                        image: 1,
                    },
                    totalAmount: 1,
                    createdAt: 1,
                },
            },
        ]);

        if (!invoiceDetails.length) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = invoiceDetails[0];
        const html = generateInvoiceHTML(invoice);

        // Generate PDF from HTML using the utility function
        generatePDF(html, (err, buffer) => {
            if (err) {
                console.error('Error generating PDF:', err);
                return res.status(500).json({ error: 'Failed to generate PDF' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);
            return res.send(buffer);
        });
    } catch (error) {
        console.error('Error printing invoice:', error);
        return res.status(500).json({ error: 'Failed to print invoice' });
    }
};




module.exports = {createInvoice, viewInvoice, printInvoice, invoiceListByUser}