const express = require('express');
const router = express.Router();

// import auh verification for oken helpp
const authVerify = require('../middlewares/authVerification');
const loginLimiter = require('../middlewares/loginlimiter');

// all imports about user 
const userController = require('../controller/userController');
// inventory controllerc
const {getProducts, addToInventory, inventoryList} = require('../controller/InventoryController');

// invoice controller 
const {createInvoice, viewInvoice, printInvoice, invoiceListByUser, deleteInvoice } = require('../controller/InvoiceController');




// User registration route
router.post('/user-registration', userController.userRegistration);

// User login route
router.post('/login',loginLimiter, userController.userLoginController);

// Get user profile route
router.get('/profile', authVerify, userController.profileDetails);

// Update user profile route
router.put('/profile', authVerify, userController.updateProfile);



// inventory controller

router.get('/products', getProducts);
router.post('/add-product', authVerify, addToInventory);
router.get('/inventory-list/:userId', authVerify, inventoryList);


// all invoice routes
router.post('/create-invoice', authVerify, createInvoice);
router.get('/view-invoice/:invoiceId', authVerify, viewInvoice);
router.get('/print-invoice/:invoiceId', authVerify, printInvoice);
router.get('/invoice-list/:userId', authVerify, invoiceListByUser);
router.delete('/invoice-delete/:invoiceId', authVerify, deleteInvoice);



























module.exports = router;