// Backend/internal/domain/permission/constants.go

package permission

// Permission modules
const (
	MODULE_ACCESS_MANAGEMENT = "ACCESS_MANAGEMENT"
	MODULE_MASTER_DATA       = "MASTER_DATA"
	MODULE_TRANSACTION       = "TRANSACTION"
	MODULE_INVENTORY         = "INVENTORY"
	MODULE_ACCOUNTING        = "ACCOUNTING"
	MODULE_SYSTEM            = "SYSTEM"
)

// Permission actions
const (
	ACTION_VIEW    = "VIEW"    // For reading/viewing data
	ACTION_CREATE  = "CREATE"  // For creating new records
	ACTION_UPDATE  = "UPDATE"  // For updating existing records
	ACTION_DELETE  = "DELETE"  // For deleting records
	ACTION_APPROVE = "APPROVE" // For approval workflows
	ACTION_EXPORT  = "EXPORT"  // For exporting data
	ACTION_IMPORT  = "IMPORT"  // For importing data
)
