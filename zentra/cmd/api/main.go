// @title           Vomo API
// @version         1.0
// @description     Vomo backend API documentation
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      ${SWAGGER_HOST}
// @BasePath  /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @schemes https
// @produce application/json
// @consumes application/json

package main

import (
	"context"
	"log"
	"os"
	"strings"
	"zentra/docs"
	_ "zentra/docs"
	"zentra/internal/config"
	"zentra/internal/handlers"
	"zentra/internal/infrastructure/jwt"
	"zentra/internal/infrastructure/logging"
	"zentra/internal/infrastructure/postgres"
	"zentra/internal/middleware"
	"zentra/internal/routes"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Read environment variables
	swaggerHost := os.Getenv("SWAGGER_HOST")
	if swaggerHost == "" {
		swaggerHost = "localhost:8080" // Default value for local development
	}

	// Replace ${SWAGGER_HOST} placeholder in Swagger docs
	docs.SwaggerInfo.Host = strings.ReplaceAll(docs.SwaggerInfo.Host, "${SWAGGER_HOST}", swaggerHost)

	// Initialize logger
	logger, err := logging.NewLogger(
		[]string{"http://localhost:9200"},
		"",
		"",
		"zentra-logs",
	)
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}

	// Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Error("Failed to load config", nil, err)
		os.Exit(1)
	}

	// Initialize JWT secrets
	jwt.SetSecrets(cfg.JWTSecret, cfg.JWTRefreshSecret)

	db, err := postgres.NewConnection(
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.GetDBPortInt(),
	)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize services
	appServices := services.NewServices(db, cfg)

	// Ensure upload directory exists
	if err := os.MkdirAll("uploads/products", 0755); err != nil {
		logger.Error("Failed to create upload directory", nil, err)
		os.Exit(1)
	}

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(middleware.LoggingMiddleware(logger))

	// Add gin context to request context
	r.Use(func(c *gin.Context) {
		ctx := context.WithValue(c.Request.Context(), "gin_context", c)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	})

	// Setup CORS middleware
	r.Use(func(c *gin.Context) {
		allowedOrigins := strings.Split(cfg.CorsAllowedOrigins, ",")
		origin := c.Request.Header.Get("Origin")

		// Check if the origin is allowed
		for _, allowed := range allowedOrigins {
			if allowed == "*" || allowed == origin {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, x-environment, x-tenant-id")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Authorization, x-environment, x-tenant-id")
		c.Writer.Header().Set("Access-Control-Max-Age", "3600")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Serve static files from uploads directory
	r.Static("/uploads", "./uploads")

	// Add services to Gin context
	r.Use(func(c *gin.Context) {
		c.Set("userService", appServices.UserService)
		c.Next()
	})

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Setup middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	// health check endpoint
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service is healthy",
			"auth":    "verified",
		})
	})
	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(appServices.UserService))

	// Public routes
	r.POST("/api/auth/login", handlers.Login(appServices.UserService, appServices.MenuService))
	r.POST("/api/auth/refresh", handlers.RefreshToken(appServices.UserService))

	// API routes group
	routes.SetupRoutes(protected, appServices)

	// Start Server
	port := cfg.GetServerPort()
	logger.Info("Server starting", map[string]interface{}{
		"port": port,
	})
	if err := r.Run(port); err != nil {
		logger.Error("Server failed to start", nil, err)
		os.Exit(1)
	}
}
