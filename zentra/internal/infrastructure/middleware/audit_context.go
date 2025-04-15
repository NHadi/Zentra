package middleware

import (
	"zentra/internal/domain/appcontext"
	"zentra/internal/infrastructure/jwt"

	"github.com/gin-gonic/gin"
)

const (
	UserContextKey = "user_context"
)

type UserContext struct {
	Username string
	TenantID int
}

// AuditContext middleware extracts user information from JWT token and stores it in context
func AuditContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from JWT token
		tokenString := c.GetHeader("Authorization")
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		claims, err := jwt.ValidateToken(tokenString)
		if err == nil {
			// Get tenant ID from Gin context
			tenantID, exists := c.Get("tenant_id")
			if !exists {
				tenantID = claims.TenantID
			}

			userContext := &appcontext.UserContext{
				Username: claims.Username,
				TenantID: tenantID.(int),
			}
			c.Set(appcontext.UserContextKey, userContext)
		}

		c.Next()
	}
}
