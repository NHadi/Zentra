package middleware

import (
	"zentra/internal/domain/appcontext"

	"context"

	"github.com/gin-gonic/gin"
)

// AuditContext middleware sets up the user context for audit trails
func AuditContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user context from the request context
		userCtx, exists := c.Get(appcontext.UserContextKey)
		if !exists {
			c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized - User context not found"})
			return
		}

		// Verify the user context is of the correct type
		uc, ok := userCtx.(*appcontext.UserContext)
		if !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized - Invalid user context type"})
			return
		}

		// Set in both gin context and request context
		c.Set(appcontext.UserContextKey, uc)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), appcontext.UserContextKey, uc))

		c.Next()
	}
}
