package routes

import (
	"zentra/internal/middleware"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupRoutes initializes all routes for the application
func SetupRoutes(router *gin.RouterGroup, services *services.Services) {

	// Protected routes with tenant
	protected := router.Group("")
	protected.Use(middleware.AuthMiddleware(services.UserService))
	protected.Use(middleware.TenantMiddleware())
	protected.Use(middleware.AuditContext())
	{
		SetupMenuRoutes(protected, services.MenuService)
		SetupUserRoutes(protected, services.UserService)
		SetupRoleRoutes(protected, services.RoleService)
		SetupPermissionRoutes(protected, services.PermissionService)
		SetupAuditRoutes(protected, services.AuditService)
		SetupBackupRoutes(protected, services.BackupService)
		SetupZoneRoutes(protected, services.ZoneService)
		SetupRegionRoutes(protected, services.RegionService)
		SetupOfficeRoutes(protected, services.OfficeService)
		SetupDivisionRoutes(protected, services.DivisionService)
		SetupEmployeeRoutes(protected, services.EmployeeService, services.DivisionService)
		SetupProductRoutes(protected, services.ProductService, services.ProductCategoryService, services.ProductImageService)
		SetupProductCategoryRoutes(protected, services.ProductCategoryService)
		SetupOrderRoutes(protected, services.OrderService)
		SetupPaymentRoutes(protected, services.PaymentService)
		SetupTaskRoutes(protected, services.TaskService)
		SetupSupplierRoutes(protected, services.SupplierService)
		SetupCustomerRoutes(protected, services.CustomerService)

		// New inventory routes
		SetupItemRoutes(protected, services.ItemService)
		SetupStockOpnameRoutes(protected, services.StockOpnameService)
		SetupStockMovementRoutes(protected, services.StockMovementService)
		SetupAccountingRoutes(protected, services)
	}
}
