package middleware

import (
	"fmt"
	"time"
	"zentra/internal/config"
	"zentra/internal/domain/common"
	"zentra/internal/domain/user"
	jwtpkg "zentra/internal/infrastructure/jwt"

	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
)

func GenerateAccessToken(user *user.User) (string, error) {
	claims := &jwtpkg.Claims{
		UserID:   user.ID.String(),
		TenantID: user.TenantModel.TenantID,
		Username: user.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 3).Unix(), // 3 hour expiry
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.GetConfig().JWTSecret)
}

func GenerateRefreshToken(user *user.User) (string, error) {
	claims := &jwtpkg.Claims{
		UserID:   user.ID.String(),
		TenantID: user.TenantModel.TenantID,
		Username: user.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days expiry
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.GetConfig().JWTRefreshSecret)
}

func ValidateToken(tokenString string) (*jwtpkg.Claims, error) {
	return jwtpkg.ValidateToken(tokenString)
}

func ValidateRefreshToken(tokenString string) (*jwtpkg.Claims, error) {
	return jwtpkg.ValidateToken(tokenString)
}

func ExtractTokenMetadata(claims *jwtpkg.Claims) (*user.User, error) {
	userID := uuid.Must(uuid.Parse(fmt.Sprint(claims.UserID)))

	return &user.User{
		ID:       userID,
		Username: claims.Username,
		TenantModel: common.TenantModel{
			TenantID: claims.TenantID,
		},
	}, nil
}
