import { authAPI } from './modules/auth.js';
import { menuAPI } from './modules/menus.js';
import { auditAPI } from './modules/audits.js';
import { roleAPI } from './modules/roles.js';
import { backupAPI } from './modules/backups.js';
import { zoneAPI } from './modules/zones.js';
import { regionAPI } from './modules/regions.js';
import { officeAPI } from './modules/offices.js';
import { divisionAPI } from './modules/divisions.js';
import { employeeAPI } from './modules/employees.js';
import { productAPI } from './modules/products.js';
import { permissionAPI } from './modules/permissions.js';
import { productCategoryAPI } from './modules/product-categories.js';
import { userAPI } from './modules/users.js';
import { orderAPI } from './modules/orders.js';
import { taskAPI } from './modules/tasks.js';
import { itemAPI } from './modules/items.js';
import { paymentAPI } from './modules/payments.js';
import { stockOpnameAPI } from './modules/stock-opnames.js';
import { stockMovementAPI } from './modules/stock-movements.js';
import { supplierAPI } from './modules/suppliers.js';
import { config } from './config.js';
import { cashFlowAPI } from './modules/cash-flows.js';
import { purchaseOrderAPI } from './modules/purchase-orders.js';
import { workOrderAPI } from './modules/work-orders.js';
import { pettyCashAPI } from './modules/petty-cash.js';
import { pettyCashRequestsAPI } from './modules/petty-cash-requests.js';
import { transactionCategoryAPI } from './modules/transaction-categories.js';

// Initialize the API namespace
export const zentra = {
    ...authAPI,
    ...menuAPI,
    ...auditAPI,
    ...roleAPI,
    ...backupAPI,
    ...zoneAPI,
    ...regionAPI,
    ...officeAPI,
    ...divisionAPI,
    ...employeeAPI,
    ...productAPI,
    ...permissionAPI,
    ...productCategoryAPI,
    ...userAPI,
    ...orderAPI,
    ...taskAPI,
    ...itemAPI,
    ...paymentAPI,
    ...stockOpnameAPI,
    ...stockMovementAPI,
    ...supplierAPI,
    ...cashFlowAPI,
    ...purchaseOrderAPI,
    ...workOrderAPI,
    ...pettyCashAPI,
    ...pettyCashRequestsAPI,
    ...transactionCategoryAPI,
    config,
};

// Export to window object for global access
window.zentra = zentra;

export default zentra; 