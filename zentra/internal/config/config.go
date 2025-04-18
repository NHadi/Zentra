package config

import (
	"log"
	"os"
	"strconv"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBPort             string
	JWTSecret          string
	JWTRefreshSecret   string
	CorsAllowedOrigins string
}

var (
	config *Config
	once   sync.Once
)

func GetConfig() *Config {
	once.Do(func() {
		var err error
		config, err = LoadConfig()
		if err != nil {
			panic(err)
		}
	})
	return config
}

func LoadConfig() (*Config, error) {
	// Try to load .env file, but don't fail if it doesn't exist
	_ = godotenv.Load()

	// Get current working directory for debugging
	wd, err := os.Getwd()
	if err != nil {
		log.Printf("Error getting working directory: %v", err)
	} else {
		log.Printf("Current working directory: %s", wd)
	}

	// Log environment variables for debugging
	log.Printf("POSTGRES_HOST: %s", os.Getenv("POSTGRES_HOST"))
	log.Printf("POSTGRES_PORT: %s", os.Getenv("POSTGRES_PORT"))
	log.Printf("POSTGRES_DB: %s", os.Getenv("POSTGRES_DB"))
	log.Printf("POSTGRES_USER: %s", os.Getenv("POSTGRES_USER"))

	// Default CORS origins include both production and local development URLs
	defaultCorsOrigins := "http://localhost:3000,http://localhost:3001," +
		"https://bisnisqu.badamigroups.com,https://eshop.badamigroups.com," +
		"https://dev.bisnisqu.badamigroups.com,https://dev.eshop.badamigroups.com," +
		"https://staging.bisnisqu.badamigroups.com,https://staging.eshop.badamigroups.com"

	return &Config{
		DBHost:             getEnv("POSTGRES_HOST", "localhost"),
		DBUser:             getEnv("POSTGRES_USER", "zentra_admin"),
		DBPassword:         getEnv("POSTGRES_PASSWORD", "zentra_admin_123@#$"),
		DBName:             getEnv("POSTGRES_DB", "zentra_production_managament"),
		DBPort:             getEnv("POSTGRES_PORT", "5432"),
		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key"),
		JWTRefreshSecret:   getEnv("JWT_REFRESH_SECRET", "your-refresh-secret-key"),
		CorsAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", defaultCorsOrigins),
	}, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func (c *Config) GetDBPortInt() int {
	port, err := strconv.Atoi(c.DBPort)
	if err != nil {
		return 5432 // default postgres port if conversion fails
	}
	return port
}

func (c *Config) GetServerPort() string {
	port := getEnv("SERVER_PORT", "8080")
	return ":" + port
}
