package services

import (
	"zentra/internal/application"
	"zentra/internal/config"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/product"
	"zentra/internal/infrastructure/postgres"

	"gorm.io/gorm"
)

// Type aliases for services
type MenuService = *application.MenuService
type UserService = *application.UserService
type RoleService = *application.RoleService
type PermissionService = *application.PermissionService
type AuditService = *audit.Service
type BackupService = *application.BackupService
type ProductService = *application.ProductService
type ProductCategoryService = *application.ProductCategoryService
type OrderService = *application.OrderService
type PaymentService = *application.PaymentService
type TaskService = *application.TaskService
type ItemService = *application.ItemService
type StockOpnameService = *application.StockOpnameService
type StockMovementService = *application.StockMovementService
type SupplierService = *application.SupplierService

// Services holds all the application services
type Services struct {
	MenuService            *application.MenuService
	UserService            *application.UserService
	RoleService            *application.RoleService
	PermissionService      *application.PermissionService
	AuditService           *audit.Service
	BackupService          *application.BackupService
	ZoneService            *application.ZoneService
	RegionService          *application.RegionService
	OfficeService          *application.OfficeService
	DivisionService        *application.DivisionService
	EmployeeService        *application.EmployeeService
	ProductService         *application.ProductService
	ProductCategoryService *application.ProductCategoryService
	ProductImageService    product.ProductImageService
	OrderService           *application.OrderService
	PaymentService         *application.PaymentService
	TaskService            *application.TaskService
	ItemService            *application.ItemService
	StockOpnameService     *application.StockOpnameService
	StockMovementService   *application.StockMovementService
	SupplierService        *application.SupplierService
	ChannelService         *application.ChannelService

	// Accounting Services
	TransactionCategoryService *application.TransactionCategoryService
	CashFlowService            *application.CashFlowService
	PurchaseOrderService       *application.PurchaseOrderService
	PettyCashService           *application.PettyCashService
	PettyCashRequestService    *application.PettyCashRequestService
	WorkOrderService           *application.WorkOrderService
}

func NewServices(db *gorm.DB, cfg *config.Config) *Services {
	// Initialize repositories
	menuRepo := postgres.NewMenuRepository(db)
	userRepo := postgres.NewUserRepository(db)
	roleRepo := postgres.NewRoleRepository(db)
	permissionRepo := postgres.NewPermissionRepository(db)
	auditRepo := postgres.NewAuditRepository(db)
	backupRepo := postgres.NewBackupRepository(db)
	zoneRepo := postgres.NewZoneRepository(db)
	regionRepo := postgres.NewRegionRepository(db)
	officeRepo := postgres.NewOfficeRepository(db)
	divisionRepo := postgres.NewDivisionRepository(db)
	employeeRepo := postgres.NewEmployeeRepository(db)
	productRepo := postgres.NewProductRepository(db)
	productCategoryRepo := postgres.NewProductCategoryRepository(db)
	productImageRepo := postgres.NewProductImageRepository(db)
	orderRepo := postgres.NewOrderRepository(db)
	paymentRepo := postgres.NewPaymentRepository(db)
	taskRepo := postgres.NewTaskRepository(db)
	itemRepo := postgres.NewItemRepository(db)
	stockOpnameRepo := postgres.NewStockOpnameRepository(db)
	stockMovementRepo := postgres.NewStockMovementRepository(db)
	supplierRepo := postgres.NewSupplierRepository(db)
	channelRepo := postgres.NewChannelRepository(db)

	// Initialize accounting repositories
	transactionCategoryRepo := postgres.NewTransactionCategoryRepository(db)
	cashFlowRepo := postgres.NewCashFlowRepository(db)
	purchaseOrderRepo := postgres.NewPurchaseOrderRepository(db)
	pettyCashRepo := postgres.NewPettyCashRepository(db)
	pettyCashRequestRepo := postgres.NewPettyCashRequestRepository(db)
	workOrderRepo := postgres.NewWorkOrderRepository(db)

	// Initialize audit service first as it's needed by other services
	auditService := audit.NewService(auditRepo)

	// Initialize all other services
	menuService := application.NewMenuService(menuRepo, auditService)
	userService := application.NewUserService(userRepo, auditService)
	roleService := application.NewRoleService(roleRepo, permissionRepo, auditService)
	permissionService := application.NewPermissionService(permissionRepo, auditService)
	backupService := application.NewBackupService(backupRepo, cfg)
	zoneService := application.NewZoneService(zoneRepo, regionRepo, officeRepo, auditService)
	regionService := application.NewRegionService(regionRepo, zoneRepo, auditService)
	officeService := application.NewOfficeService(officeRepo, auditService, zoneRepo)
	divisionService := application.NewDivisionService(divisionRepo, auditService)
	employeeService := application.NewEmployeeService(employeeRepo, auditService)
	productService := application.NewProductService(productRepo, auditService)
	productCategoryService := application.NewProductCategoryService(productCategoryRepo, auditService)
	productImageService := application.NewProductImageService(productImageRepo, productRepo)
	orderService := application.NewOrderService(orderRepo, auditService)
	paymentService := application.NewPaymentService(paymentRepo, auditService)
	taskService := application.NewTaskService(taskRepo, auditService)
	itemService := application.NewItemService(itemRepo, auditService)
	stockOpnameService := application.NewStockOpnameService(stockOpnameRepo, auditService)
	stockMovementService := application.NewStockMovementService(stockMovementRepo, auditService)
	supplierService := application.NewSupplierService(supplierRepo, auditService)
	channelService := application.NewChannelService(channelRepo, auditService)

	// Initialize accounting services
	transactionCategoryService := application.NewTransactionCategoryService(transactionCategoryRepo, auditService)
	cashFlowService := application.NewCashFlowService(cashFlowRepo, auditService)
	purchaseOrderService := application.NewPurchaseOrderService(purchaseOrderRepo, supplierService, itemService, auditService)
	pettyCashService := application.NewPettyCashService(pettyCashRepo, auditService, officeRepo, divisionRepo, channelRepo)
	pettyCashRequestService := application.NewPettyCashRequestService(pettyCashRequestRepo, auditService, transactionCategoryRepo, employeeRepo)
	workOrderService := application.NewWorkOrderService(workOrderRepo, auditService)

	return &Services{
		MenuService:            menuService,
		UserService:            userService,
		RoleService:            roleService,
		PermissionService:      permissionService,
		AuditService:           auditService,
		BackupService:          backupService,
		ZoneService:            zoneService,
		RegionService:          regionService,
		OfficeService:          officeService,
		DivisionService:        divisionService,
		EmployeeService:        employeeService,
		ProductService:         productService,
		ProductCategoryService: productCategoryService,
		ProductImageService:    productImageService,
		OrderService:           orderService,
		PaymentService:         paymentService,
		TaskService:            taskService,
		ItemService:            itemService,
		StockOpnameService:     stockOpnameService,
		StockMovementService:   stockMovementService,
		SupplierService:        supplierService,
		ChannelService:         channelService,

		// Accounting Services
		TransactionCategoryService: transactionCategoryService,
		CashFlowService:            cashFlowService,
		PurchaseOrderService:       purchaseOrderService,
		PettyCashService:           pettyCashService,
		PettyCashRequestService:    pettyCashRequestService,
		WorkOrderService:           workOrderService,
	}
}
