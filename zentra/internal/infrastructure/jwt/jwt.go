package jwt

import (
	"fmt"
	"time"
	"zentra/internal/domain/common"
	"zentra/internal/domain/user"

	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
)

var (
	jwtSecret        []byte
	jwtRefreshSecret []byte
)

// Claims represents the JWT claims structure
type Claims struct {
	UserID   string `json:"user_id"`
	TenantID int    `json:"tenant_id"`
	Username string `json:"username"`
	jwt.StandardClaims
}

// SetSecrets sets the JWT secrets for token signing and validation
func SetSecrets(secret, refreshSecret string) {
	jwtSecret = []byte(secret)
	jwtRefreshSecret = []byte(refreshSecret)
}

func GenerateAccessToken(user *user.User) (string, error) {
	claims := &Claims{
		UserID:   user.ID.String(),
		TenantID: user.TenantModel.TenantID,
		Username: user.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 1).Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func GenerateRefreshToken(user *user.User) (string, error) {
	claims := &Claims{
		UserID:   user.ID.String(),
		TenantID: user.TenantModel.TenantID,
		Username: user.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtRefreshSecret)
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtRefreshSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid refresh token: %v", err)
	}

	return claims, nil
}

func extractUserFromClaims(claims jwt.MapClaims) (*user.User, error) {
	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return nil, fmt.Errorf("user_id not found in token")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid user_id format")
	}

	tenantID, ok := claims["tenant_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("tenant_id not found in token")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return nil, fmt.Errorf("username not found in token")
	}

	return &user.User{
		ID:       userID,
		Username: username,
		TenantModel: common.TenantModel{
			TenantID: int(tenantID),
		},
	}, nil
}
