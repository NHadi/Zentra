package handlers

import (
	"net/http"
	"sort"
	"strings"
	"zentra/internal/application"
	"zentra/internal/domain/appcontext"
	"zentra/internal/infrastructure/jwt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string         `json:"token"`
	User  UserResponse   `json:"user"`
	Menus []MenuResponse `json:"menus"`
}

// @Summary User login
// @Description Authenticate user with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Login Credentials"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/login [post]
func Login(userService *application.UserService, menuService *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		user, err := userService.ValidateCredentials(req.Email, req.Password, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid credentials"})
			return
		}

		// Generate JWT token
		token, err := jwt.GenerateAccessToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate token"})
			return
		}

		// Set up temporary context for menu retrieval
		userCtx := &appcontext.UserContext{
			Username: user.Username,
			TenantID: user.TenantModel.TenantID,
		}
		c.Set(appcontext.UserContextKey, userCtx)

		// Get menus for the user's role with tenant
		menus, err := menuService.GetMenusByRoleID(user.RoleID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve menus"})
			return
		}

		// Build menu hierarchy
		menuMap := make(map[int]MenuResponse)
		var rootMenus []MenuResponse

		// First pass: create all menu responses and store in map
		for _, m := range menus {
			menuResp := toMenuResponse(m)
			menuMap[m.ID] = menuResp
		}

		// Second pass: organize children and preserve sorting
		type menuWithSort struct {
			menu MenuResponse
			sort int
		}

		// Collect and sort root menus
		var rootMenuItems []menuWithSort
		for _, m := range menus {
			if m.ParentID == nil {
				if menuResp, exists := menuMap[m.ID]; exists {
					rootMenuItems = append(rootMenuItems, menuWithSort{menu: menuResp, sort: m.Sort})
				}
			}
		}

		// Sort root menus by Sort field
		sort.SliceStable(rootMenuItems, func(i, j int) bool {
			if rootMenuItems[i].sort == rootMenuItems[j].sort {
				return rootMenuItems[i].menu.ID < rootMenuItems[j].menu.ID
			}
			return rootMenuItems[i].sort < rootMenuItems[j].sort
		})

		// Build children for each menu while preserving sort order
		for _, m := range menus {
			if m.ParentID != nil {
				if parent, exists := menuMap[*m.ParentID]; exists {
					childCopy := menuMap[m.ID]
					parent.Children = append(parent.Children, childCopy)
					// Sort children by Sort field
					sort.SliceStable(parent.Children, func(i, j int) bool {
						if parent.Children[i].Sort == parent.Children[j].Sort {
							return parent.Children[i].ID < parent.Children[j].ID
						}
						return parent.Children[i].Sort < parent.Children[j].Sort
					})
					menuMap[*m.ParentID] = parent
				}
			}
		}

		// Build final root menus array in sorted order
		rootMenus = make([]MenuResponse, len(rootMenuItems))
		for i, item := range rootMenuItems {
			rootMenus[i] = item.menu
		}

		c.JSON(http.StatusOK, LoginResponse{
			Token: token,
			User:  ToUserResponse(user),
			Menus: rootMenus,
		})
	}
}

func RefreshToken(userService *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshToken := c.GetHeader("Authorization")
		if refreshToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token is required"})
			return
		}

		refreshToken = strings.TrimPrefix(refreshToken, "Bearer ")

		// Validate refresh token and get user data
		tokenUser, err := jwt.ValidateRefreshToken(refreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
			return
		}

		// Get user from database to verify existence
		user, err := userService.GetUserByID(uuid.Must(uuid.Parse(tokenUser.UserID)), c.Request.Context())
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		// Generate new access token
		accessToken, err := jwt.GenerateAccessToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate token"})
			return
		}

		// Generate new refresh token
		newRefreshToken, err := jwt.GenerateRefreshToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  accessToken,
			"refresh_token": newRefreshToken,
			"token_type":    "Bearer",
		})
	}
}
