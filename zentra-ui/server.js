const express = require('express');
const path = require('path');
const config = require('./config');
const app = express();
const port = process.env.PORT || 3000;

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log('Starting server with NODE_ENV:', process.env.NODE_ENV);

// Function to inject configuration into HTML
function injectConfig(html, env) {
    const config = {
        local: {
            API_URL: process.env.API_URL || 'http://localhost:8080',
            ESHOP_URL: process.env.ESHOP_URL || 'http://localhost:3001',
            PGADMIN_URL: process.env.PGADMIN_URL || 'http://localhost:5050',
            ENVIRONMENT: 'local'
        },
        development: {
            API_URL: process.env.API_URL || 'https://dev.zentra.badamigroups.com',
            ESHOP_URL: process.env.ESHOP_URL || 'https://dev.eshop.badamigroups.com',
            PGADMIN_URL: process.env.PGADMIN_URL || 'https://dev.pgadmin.badamigroups.com',
            ENVIRONMENT: 'development'
        },
        staging: {
            API_URL: process.env.API_URL || 'https://staging.zentra.badamigroups.com',
            ESHOP_URL: process.env.ESHOP_URL || 'https://staging.eshop.badamigroups.com',
            PGADMIN_URL: process.env.PGADMIN_URL || 'https://staging.pgadmin.badamigroups.com',
            ENVIRONMENT: 'staging'
        },
        production: {
            API_URL: process.env.API_URL || 'https://zentra.badamigroups.com',
            ESHOP_URL: process.env.ESHOP_URL || 'https://eshop.badamigroups.com',
            PGADMIN_URL: process.env.PGADMIN_URL || 'https://pgadmin.badamigroups.com',
            ENVIRONMENT: 'production'
        }
    };

    const currentConfig = config[env];
    const configScript = `<script>window.APP_CONFIG = ${JSON.stringify(currentConfig)};</script>`;
    return html.replace('</head>', `${configScript}</head>`);
}

// Serve static files from the Frontend directory
app.use(express.static(path.join(__dirname)));

// Handle HTML files with configuration injection
app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    if (!require('fs').existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    let html = require('fs').readFileSync(filePath, 'utf8');
    html = injectConfig(html, process.env.NODE_ENV);
    res.send(html);
});

// Special handling for component requests to return 404 if not found
app.get('/components/*', (req, res, next) => {
    const filePath = path.join(__dirname, req.path);
    if (!require('fs').existsSync(filePath)) {
        return res.status(404).send('Component not found');
    }
    next();
});

// Handle all other routes by serving index.html with configuration
app.get('*', (req, res) => {
    // Skip if the request is for a static file
    if (req.path.includes('.')) {
        return res.sendFile(path.join(__dirname, req.path));
    }
    // For all other routes, serve index.html with configuration
    let html = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    html = injectConfig(html, process.env.NODE_ENV);
    res.send(html);
});

app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log('Configuration:', config);
}); 