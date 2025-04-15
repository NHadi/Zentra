package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/domain/backup"

	"github.com/gin-gonic/gin"
)

type BackupHandler struct {
	backupService backup.Service
}

func NewBackupHandler(backupService backup.Service) *BackupHandler {
	return &BackupHandler{
		backupService: backupService,
	}
}

// CreateBackup godoc
// @Summary Create a new database backup
// @Description Create a new backup of the database
// @Tags backup
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} backup.Backup
// @Failure 500 {object} map[string]string
// @Router /backups [post]
// @Security BearerAuth
func (h *BackupHandler) CreateBackup(c *gin.Context) {
	backup, err := h.backupService.CreateBackup(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, backup)
}

// RestoreBackup godoc
// @Summary Restore from a backup
// @Description Restore the database from a specific backup
// @Tags backup
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Backup ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /backups/{id}/restore [post]
// @Security BearerAuth
func (h *BackupHandler) RestoreBackup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid backup ID"})
		return
	}

	if err := h.backupService.RestoreBackup(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Backup restored successfully"})
}

// ListBackups godoc
// @Summary List all backups
// @Description Get a list of all available backups
// @Tags backup
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} backup.Backup
// @Failure 500 {object} map[string]string
// @Router /backups [get]
// @Security BearerAuth
func (h *BackupHandler) ListBackups(c *gin.Context) {
	backups, err := h.backupService.ListBackups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, backups)
}

// DeleteBackup godoc
// @Summary Delete a backup
// @Description Delete a specific backup
// @Tags backup
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Backup ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /backups/{id} [delete]
// @Security BearerAuth
func (h *BackupHandler) DeleteBackup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid backup ID"})
		return
	}

	if err := h.backupService.DeleteBackup(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Backup deleted successfully"})
}
