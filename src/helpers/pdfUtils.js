const pdf = require('html-pdf');

// Function to generate HTML for the invoice
const generateInvoiceHTML = (invoice) => {
    let productsHTML = '';
    invoice.productDetails.forEach((product, index) => {
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

    return `
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body {
                    margin: 20px;
                    font-family: 'Roboto', sans-serif;
                }
                h1, h2, h3, p {
                    margin: 0;
                    padding: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .invoice-id {
                    font-weight: bold;
                }
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }
                .signature-box {
                    width: 200px;
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 10px;
                }
                .total-amount {
                    text-align: right;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <div>
                    <div class="invoice-id">Invoice ID: ${invoice._id}</div>
                    <div>${new Date(invoice.createdAt).toLocaleDateString()}</div>
                </div>
                <h1>Invoice</h1>
            </div>
            <p>User: ${invoice.user.name} (${invoice.user.email})</p>
            <table>
                <thead>
                    <tr>
                        <th>Serial No</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            <div class="total-amount">
                <p>Total Amount: ${invoice.totalAmount}</p>
            </div>
            <div class="signatures">
                <div class="signature-box">Customer Signature</div>
                <div class="signature-box">User Signature</div>
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
