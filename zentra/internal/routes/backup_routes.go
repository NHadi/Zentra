package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupBackupRoutes(router *gin.RouterGroup, backupService services.BackupService) {
	backupHandler := handlers.NewBackupHandler(backupService)

	backup := router.Group("/backups")
	{
		backup.POST("", backupHandler.CreateBackup)
		backup.GET("", backupHandler.ListBackups)
		backup.POST("/:id/restore", backupHandler.RestoreBackup)
		backup.DELETE("/:id", backupHandler.DeleteBackup)
	}
}
