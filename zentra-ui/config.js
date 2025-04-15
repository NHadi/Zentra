const config = {
    development: {
        apiUrl: process.env.API_URL || 'https://dev.zentra.badamigroups.com',
        eshopUrl: process.env.ESHOP_URL || 'https://dev.eshop.badamigroups.com',
        pgAdminUrl: process.env.PGADMIN_URL || 'https://dev.pgadmin.badamigroups.com'
    },
    staging: {
        apiUrl: process.env.API_URL || 'https://staging.zentra.badamigroups.com',
        eshopUrl: process.env.ESHOP_URL || 'https://staging.eshop.badamigroups.com',
        pgAdminUrl: process.env.PGADMIN_URL || 'https://staging.pgadmin.badamigroups.com'
    },
    production: {
        apiUrl: process.env.API_URL || 'https://zentra.badamigroups.com',
        eshopUrl: process.env.ESHOP_URL || 'https://eshop.badamigroups.com',
        pgAdminUrl: process.env.PGADMIN_URL || 'https://pgadmin.badamigroups.com'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 