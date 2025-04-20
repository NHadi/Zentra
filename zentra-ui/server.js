const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const app = express();
const port = process.env.PORT || 3000;

// Function to detect environment from hostname
function detectEnvironment() {
    const hostname = process.env.HOSTNAME || 'localhost';

    if (hostname.includes('staging.')) {
        return 'staging';
    } else if (hostname.includes('dev.')) {
        return 'development';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'local';
    } else if (hostname === 'zentra.badamigroups.com' || 
               hostname === 'eshop.badamigroups.com' || 
               hostname === 'bisnisqu.badamigroups.com') {
        return 'production';
    }
    
    return process.env.NODE_ENV || 'development';
}

// Ensure NODE_ENV is set based on hostname
process.env.NODE_ENV = detectEnvironment();

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
    
    // Ensure the config script is injected before the closing head tag
    if (html.includes('</head>')) {
        return html.replace('</head>', `${configScript}</head>`);
    } else {
        return html.replace('<body', `<body>${configScript}`);
    }
}

// Serve static files from the Frontend directory
app.use(express.static(path.join(__dirname)));

// Middleware to inject configuration into HTML responses
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        console.log(`[Request] Processing HTML file: ${req.path}`);
        const filePath = path.join(__dirname, req.path);
        if (fs.existsSync(filePath)) {
            console.log(`[Request] File exists: ${filePath}`);
            let html = fs.readFileSync(filePath, 'utf8');
            console.log(`[Request] File content length: ${html.length}`);
            html = injectConfig(html, process.env.NODE_ENV);
            console.log(`[Request] Injected config into HTML`);
            res.send(html);
        } else {
            console.log(`[Request] File not found: ${filePath}`);
            next();
        }
    } else {
        next();
    }
});

// Handle all other routes by serving index.html with configuration
app.get('*', (req, res) => {
    // Skip if the request is for a static file
    if (req.path.includes('.')) {
        console.log(`[Request] Serving static file: ${req.path}`);
        return res.sendFile(path.join(__dirname, req.path));
    }
    // For all other routes, serve index.html with configuration
    console.log(`[Request] Serving index.html for route: ${req.path}`);
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    html = injectConfig(html, process.env.NODE_ENV);
    res.send(html);
});

app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log('Configuration:', config);
}); 