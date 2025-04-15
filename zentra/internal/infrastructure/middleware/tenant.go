package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := c.GetHeader("X-Tenant-ID")
		if tenantID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tenant ID is required"})
			c.Abort()
			return
		}
		c.Set("tenant_id", tenantID)
		c.Next()
	}
}