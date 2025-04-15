package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// PermissionChecker creates a middleware that checks if the user has the required permission
func PermissionChecker(permissionCode string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		_, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Get user roles and their permissions from context
		userPermissions, exists := c.Get("userPermissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User permissions not found"})
			c.Abort()
			return
		}

		permissions, ok := userPermissions.([]string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid permission data format"})
			c.Abort()
			return
		}

		// Check if user has the required permission
		hasPermission := false
		for _, p := range permissions {
			if p == permissionCode {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermissions is a variadic function that checks for multiple permissions (ANY match)
func RequirePermissions(permissionCodes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userPermissions, exists := c.Get("userPermissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User permissions not found"})
			c.Abort()
			return
		}

		permissions, ok := userPermissions.([]string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid permission data format"})
			c.Abort()
			return
		}

		// Check if user has ANY of the required permissions
		hasPermission := false
		for _, required := range permissionCodes {
			for _, userPerm := range permissions {
				if userPerm == required {
					hasPermission = true
					break
				}
			}
			if hasPermission {
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}
