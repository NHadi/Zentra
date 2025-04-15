package middleware

import (
	"context"
	"net/http"
	"strings"
	"zentra/internal/application"
	"zentra/internal/domain/appcontext"
	"zentra/internal/infrastructure/jwt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware handles JWT authentication and loads user permissions
func AuthMiddleware(userService *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a fresh context with the existing request context as parent
		reqCtx := c.Request.Context()

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Extract the token from the Authorization header
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate the token
		claims, err := jwt.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user ID from claims
		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		// Create initial context with basic claims info
		initialCtx := &appcontext.UserContext{
			Username: claims.Username,
			TenantID: claims.TenantID,
		}

		// Set initial context
		reqCtx = context.WithValue(reqCtx, appcontext.UserContextKey, initialCtx)
		c.Request = c.Request.WithContext(reqCtx)

		// Get user from database to verify existence and get current data
		user, err := userService.GetUserByID(userID, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Verify that the user's tenant matches the claims
		if user.TenantID != claims.TenantID {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: tenant mismatch"})
			c.Abort()
			return
		}

		// Create the final user context with verified data
		userCtx := &appcontext.UserContext{
			Username: user.Username,
			TenantID: user.TenantID,
		}

		// Set the verified context
		c.Set(appcontext.UserContextKey, userCtx)
		reqCtx = context.WithValue(reqCtx, appcontext.UserContextKey, userCtx)
		c.Request = c.Request.WithContext(reqCtx)

		// Get user permissions
		permissions, err := userService.GetUserPermissions(userID, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user permissions"})
			c.Abort()
			return
		}

		// Set permissions in both contexts
		c.Set("userPermissions", permissions)
		c.Set("userID", userID)
		reqCtx = context.WithValue(reqCtx, "userPermissions", permissions)
		reqCtx = context.WithValue(reqCtx, "userID", userID)
		c.Request = c.Request.WithContext(reqCtx)

		c.Next()
	}
}
