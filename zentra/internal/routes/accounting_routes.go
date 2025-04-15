package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupAccountingRoutes initializes accounting-related routes
func SetupAccountingRoutes(router *gin.RouterGroup, services *services.Services) {
	// Transaction Categories
	categories := router.Group("/transaction-categories")
	{
		categories.POST("", handlers.CreateTransactionCategory(services.TransactionCategoryService))
		categories.GET("/:id", handlers.GetTransactionCategory(services.TransactionCategoryService))
		categories.GET("", handlers.GetAllTransactionCategories(services.TransactionCategoryService))
		categories.PUT("/:id", handlers.UpdateTransactionCategory(services.TransactionCategoryService))
		categories.DELETE("/:id", handlers.DeleteTransactionCategory(services.TransactionCategoryService))
	}

	// Cash Flow routes
	cashFlow := router.Group("/cash-flows")
	{
		cashFlow.POST("", handlers.CreateCashFlow(services.CashFlowService))
		cashFlow.GET("/:id", handlers.GetCashFlow(services.CashFlowService, services.TransactionCategoryService))
		cashFlow.GET("", handlers.GetAllCashFlows(services.CashFlowService, services.TransactionCategoryService))
		cashFlow.PUT("/:id", handlers.UpdateCashFlow(services.CashFlowService))
		cashFlow.DELETE("/:id", handlers.DeleteCashFlow(services.CashFlowService))
	}

	// Purchase Orders
	purchaseOrders := router.Group("/purchase-orders")
	{
		purchaseOrders.POST("", handlers.CreatePurchaseOrder(services.PurchaseOrderService))
		purchaseOrders.GET("/:id", handlers.GetPurchaseOrder(services.PurchaseOrderService))
		purchaseOrders.GET("", handlers.GetAllPurchaseOrders(services.PurchaseOrderService))
		purchaseOrders.PUT("/:id", handlers.UpdatePurchaseOrder(services.PurchaseOrderService))
		purchaseOrders.DELETE("/:id", handlers.DeletePurchaseOrder(services.PurchaseOrderService))
	}

	// Work Orders (SPK)
	workOrders := router.Group("/work-orders")
	{
		workOrders.POST("", handlers.CreateWorkOrder(services.WorkOrderService))
		workOrders.GET("/:id", handlers.GetWorkOrder(services.WorkOrderService))
		workOrders.GET("", handlers.GetAllWorkOrders(services.WorkOrderService))
		workOrders.PUT("/:id", handlers.UpdateWorkOrder(services.WorkOrderService))
		workOrders.DELETE("/:id", handlers.DeleteWorkOrder(services.WorkOrderService))
		workOrders.POST("/:id/complete", handlers.CompleteWorkOrder(services.WorkOrderService))
		workOrders.POST("/:id/cancel", handlers.CancelWorkOrder(services.WorkOrderService))

		// Work Order Tasks
		workOrders.POST("/:id/tasks", handlers.CreateWorkOrderTask(services.WorkOrderService))
		workOrders.PUT("/:id/tasks/:taskId", handlers.UpdateWorkOrderTask(services.WorkOrderService))
		workOrders.DELETE("/:id/tasks/:taskId", handlers.DeleteWorkOrderTask(services.WorkOrderService))

		// Work Order Items
		workOrders.POST("/:id/items", handlers.CreateWorkOrderItem(services.WorkOrderService))
		workOrders.PUT("/:id/items/:itemId", handlers.UpdateWorkOrderItem(services.WorkOrderService))
		workOrders.DELETE("/:id/items/:itemId", handlers.DeleteWorkOrderItem(services.WorkOrderService))
	}

	// Petty Cash Management (Kas Kecil)
	pettyCash := router.Group("/petty-cash")
	{
		// Master Petty Cash (Kas Kecil)
		pettyCash.POST("", handlers.CreatePettyCash(services.PettyCashService))
		pettyCash.GET("/:id", handlers.GetPettyCash(services.PettyCashService))
		pettyCash.GET("", handlers.GetAllPettyCash(services.PettyCashService))
		pettyCash.PUT("/:id", handlers.UpdatePettyCash(services.PettyCashService))
		pettyCash.DELETE("/:id", handlers.DeletePettyCash(services.PettyCashService))

		// Summary/Recapitulation (Rekapitulasi)
		pettyCash.GET("/summary", handlers.GetPettyCashSummary(services.PettyCashService))

		// Transactions (Transaksi)
		transactions := pettyCash.Group("/transactions")
		{
			transactions.POST("", handlers.CreatePettyCashRequest(services.PettyCashRequestService))
			transactions.GET("/:id", handlers.GetPettyCashRequest(services.PettyCashRequestService))
			transactions.GET("", handlers.GetAllPettyCashRequests(services.PettyCashRequestService))
			transactions.PUT("/:id", handlers.UpdatePettyCashRequest(services.PettyCashRequestService))
			transactions.DELETE("/:id", handlers.DeletePettyCashRequest(services.PettyCashRequestService))
			transactions.POST("/:id/approve", handlers.ApprovePettyCashRequest(services.PettyCashRequestService))
			transactions.POST("/:id/reject", handlers.RejectPettyCashRequest(services.PettyCashRequestService))
		}

		// Categories (Kategori Transaksi)
		categories := pettyCash.Group("/categories")
		{
			categories.POST("", handlers.CreateTransactionCategory(services.TransactionCategoryService))
			categories.GET("/:id", handlers.GetTransactionCategory(services.TransactionCategoryService))
			categories.GET("", handlers.GetAllTransactionCategories(services.TransactionCategoryService))
			categories.PUT("/:id", handlers.UpdateTransactionCategory(services.TransactionCategoryService))
			categories.DELETE("/:id", handlers.DeleteTransactionCategory(services.TransactionCategoryService))
		}
	}
	// Petty Cash Requests
	pettyCashRequests := router.Group("/petty-cash-requests")
	{
		pettyCashRequests.POST("", handlers.CreatePettyCashRequest(services.PettyCashRequestService))
		pettyCashRequests.GET("/:id", handlers.GetPettyCashRequest(services.PettyCashRequestService))
		pettyCashRequests.GET("", handlers.GetAllPettyCashRequests(services.PettyCashRequestService))
		pettyCashRequests.PUT("/:id", handlers.UpdatePettyCashRequest(services.PettyCashRequestService))
		pettyCashRequests.DELETE("/:id", handlers.DeletePettyCashRequest(services.PettyCashRequestService))
		pettyCashRequests.POST("/:id/approve", handlers.ApprovePettyCashRequest(services.PettyCashRequestService))
		pettyCashRequests.POST("/:id/reject", handlers.RejectPettyCashRequest(services.PettyCashRequestService))
	}
}
