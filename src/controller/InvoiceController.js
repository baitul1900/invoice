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

            if (!inventoryItem) {
                return res.status(404).json({ error: `Product with ID ${inventoryId} not found` });
            }

            if (inventoryItem.userId.toString() !== userId) {
                return res.status(403).json({ error: `Product ID ${inventoryId} does not belong to the user` });
            }

            const total = inventoryItem.price * inventoryItem.quantity;
            totalAmount += total;

            invoiceProducts.push({
                inventoryId: inventoryItem._id,
                name: inventoryItem.name,
                description: inventoryItem.description,
                quantity: inventoryItem.quantity,
                price: inventoryItem.price,
                image: inventoryItem.image,
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

        // Aggregation pipeline to get the invoice details along with user details
        const invoices = await Invoice.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
                $project: {
                    _id: 1,
                    user: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                    },
                    products: 1,
                    totalAmount: 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
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
                $project: {
                    _id: 1,
                    user: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                    },
                    products: 1,
                    totalAmount: 1,
                    createdAt: 1,
                },
            },
        ]);

        if (!invoiceDetails.length) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        console.log('Invoice Details:', invoiceDetails[0]); // Log the details for debugging
        return res.status(200).json(invoiceDetails[0]);
    } catch (error) {
        console.error('Error viewing invoice:', error);
        return res.status(500).json({ error: 'Failed to view invoice' });
    }
};






// Controller function to handle printing an invoice
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
                $project: {
                    _id: 1,
                    user: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                    },
                    products: 1,
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


const deleteInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Check if the provided ID is a valid MongoDB ObjectID
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        // Find and delete the invoice
        const invoice = await Invoice.findByIdAndDelete(invoiceId);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {createInvoice, viewInvoice, printInvoice, invoiceListByUser, deleteInvoice}