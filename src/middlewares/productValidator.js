// middlewares/validators/productValidator.js
const { body } = require('express-validator');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify
const window = new JSDOM('').window;
const dompurify = DOMPurify(window);

const sanitizeDescription = (value) => dompurify.sanitize(value);

const productValidator = [
    body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
    body('description').customSanitizer(sanitizeDescription),
    body('subCategory').notEmpty().withMessage('Sub Category is required').isMongoId().withMessage('Sub Category must be a valid Mongo ID'),
];

module.exports = productValidator;
