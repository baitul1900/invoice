const pdf = require('html-pdf');

// Function to generate HTML for the invoice
const generateInvoiceHTML = (invoice) => {
    let productsHTML = '';

    // Iterate over the products array in the invoice
    if (Array.isArray(invoice.products)) {
        invoice.products.forEach((product, index) => {
            productsHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>${product.price}</td>
                    <td>${product.quantity * product.price}</td>
                </tr>
            `;
        });
    } else {
        productsHTML = '<tr><td colspan="5">No products found.</td></tr>';
    }

    return `
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+Hj7K5DaBTClw5I1a/ykD2GJvGJT/" crossorigin="anonymous">
        </head>
        <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body {
                    margin: 20px;
                    font-family: 'Roboto', sans-serif;
                }
            </style>
        <body class="container my-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 class="fw-bold">Invoice ID: ${invoice._id}</h5>
                    <p>${new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <h1>Invoice</h1>
            </div>
            <p>User: ${invoice.user.name} (${invoice.user.email})</p>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Product Name</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Price</th>
                        <th scope="col">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            <div class="text-end mt-3">
                <p class="fw-bold">Total Amount: ${invoice.totalAmount}</p>
            </div>
            <div class="mt-5 d-flex ">
                <div class="col-12 text-center">
                    <p class="border-top pt-3 me-5 pe-5">Customer Signature <span class="ms-5 ps-5">User Signature</span></p>
                    
                </div>
            </div>
        </body>
        </html>
    `;
};

// Function to generate PDF from HTML
const generatePDF = (html, callback) => {
    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm'
        }
    };
    pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
            return callback(err);
        }
        callback(null, buffer);
    });
};

module.exports = {
    generateInvoiceHTML,
    generatePDF,
};
