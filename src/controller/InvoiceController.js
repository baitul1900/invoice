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


  


const viewInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Check if the invoice ID is valid
        if (!invoiceID) {
            return res.status(400).json({ error: 'Invalid invoice ID' });
        }

        // Aggregation pipeline to get the invoice details along with user and product details
        const invoiceDetails = await Invoice.aggregate([
            { $match: { _id: invoiceID } },
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
                    from: 'inventories',
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
        if (!invoiceID) {
            return res.status(400).json({ error: 'Invalid invoice ID' });
        }

        // Aggregation pipeline to get the invoice details along with user and product details
        const invoiceDetails = await Invoice.aggregate([
            { $match: { _id: invoiceID } },
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
                    from: 'inventories',
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



module.exports = {createInvoice, viewInvoice, printInvoice}