package middleware

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantIDStr := c.GetHeader("X-Tenant-ID")

		// Check if tenant ID is empty
		if tenantIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tenant ID is required"})
			c.Abort()
			return
		}

		// Convert tenant ID to integer
		tenantID, err := strconv.Atoi(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID format"})
			c.Abort()
			return
		}

		// Set the tenant ID in context as an integer
		c.Set("tenant_id", tenantID)

		// Continue if validation passes
		c.Next()
	}
}
