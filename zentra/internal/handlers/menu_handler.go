package handlers

import (
	"net/http"
	"strconv"
	"time"
	"zentra/internal/application"
	"zentra/internal/domain/menu"

	"github.com/gin-gonic/gin"
)

// MenuResponse represents the menu item response structure
// @Description Menu item response model
type MenuResponse struct {
	ID        int            `json:"id" example:"1"`
	Name      string         `json:"name" example:"Dashboard"`
	URL       string         `json:"url" example:"/dashboard"`
	Icon      string         `json:"icon" example:"ni ni-chart-bar-32"`
	ParentID  *int           `json:"parent_id" example:"0"`
	Sort      int            `json:"sort" example:"1"`
	Children  []MenuResponse `json:"children,omitempty"`
	CreatedAt time.Time      `json:"created_at" example:"2024-01-01T12:00:00Z"`
	CreatedBy string         `json:"created_by" example:"john.doe@example.com"`
	TenantID  int            `json:"tenant_id" example:"1"`
}

// CreateMenuRequest represents the request structure for creating a menu
// @Description Create menu request model
type CreateMenuRequest struct {
	Name     string `json:"name" binding:"required" example:"Dashboard"`
	URL      string `json:"url" example:"/dashboard"`
	Icon     string `json:"icon" example:"ni ni-chart-bar-32"`
	ParentID *int   `json:"parent_id" example:"0"`
	Sort     int    `json:"sort" example:"1"`
}

// UpdateMenuRequest represents the request structure for updating a menu
// @Description Update menu request model
type UpdateMenuRequest struct {
	Name     string `json:"name" binding:"required" example:"Dashboard"`
	URL      string `json:"url" example:"/dashboard"`
	Icon     string `json:"icon" example:"ni ni-chart-bar-32"`
	ParentID *int   `json:"parent_id" example:"0"`
	Sort     int    `json:"sort" example:"1"`
}

func toMenuResponse(menu menu.Menu) MenuResponse {
	children := make([]MenuResponse, 0)
	if menu.Children != nil {
		for _, child := range menu.Children {
			children = append(children, toMenuResponse(*child))
		}
	}

	return MenuResponse{
		ID:        menu.ID,
		Name:      menu.Name,
		URL:       menu.URL,
		Icon:      menu.Icon,
		ParentID:  menu.ParentID,
		Sort:      menu.Sort,
		Children:  children,
		CreatedAt: menu.CreatedAt,
		CreatedBy: menu.CreatedBy,
		TenantID:  menu.TenantID,
	}
}

// @Summary Create a new menu
// @Description Create a new menu item
// @Tags Menu
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param menu body CreateMenuRequest true "Menu Data"
// @Success 201 {object} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus [post]
func CreateMenu(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateMenuRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		menu, err := service.CreateMenu(req.Name, req.URL, req.Icon, req.ParentID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toMenuResponse(*menu))
	}
}

// @Summary Update a menu
// @Description Update an existing menu item
// @Tags Menu
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Menu ID"
// @Param menu body UpdateMenuRequest true "Menu Data"
// @Success 200 {object} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Menu not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus/{id} [put]
func UpdateMenu(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid menu ID"})
			return
		}

		var req UpdateMenuRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		menu, err := service.UpdateMenu(id, req.Name, req.URL, req.Icon, req.ParentID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toMenuResponse(*menu))
	}
}

// @Summary Delete a menu
// @Description Delete an existing menu item
// @Tags Menu
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Menu ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Menu not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus/{id} [delete]
func DeleteMenu(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid menu ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Menu deleted successfully"})
	}
}

// @Summary Get a menu by ID
// @Description Get menu details by ID
// @Tags Menu
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Menu ID"
// @Success 200 {object} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Menu not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus/{id} [get]
func GetMenu(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid menu ID"})
			return
		}

		menu, err := service.GetMenuByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Menu not found"})
			return
		}

		c.JSON(http.StatusOK, toMenuResponse(*menu))
	}
}

// @Summary Get all menus
// @Description Get all menu items
// @Tags Menu
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus [get]
func GetAllMenus(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		menus, err := service.GetAllMenus(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]MenuResponse, len(menus))
		for i, m := range menus {
			response[i] = toMenuResponse(m)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get menus by role
// @Description Get menu items by role ID
// @Tags Menu
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param role_id query int true "Role ID" example:"1"
// @Success 200 {array} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus/by-role [get]
func GetMenusByRole(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleIDStr := c.Query("role_id")
		roleID, err := strconv.Atoi(roleIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid role ID"})
			return
		}

		menus, err := service.GetMenusByRoleID(roleID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]MenuResponse, len(menus))
		for i, m := range menus {
			response[i] = toMenuResponse(m)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get menus by user
// @Description Get menu items by user ID
// @Tags Menu
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param user_id path string true "User ID" example:"123e4567-e89b-12d3-a456-426614174000"
// @Success 200 {array} MenuResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /menus/by-user/{user_id} [get]
func GetMenusByUser(service *application.MenuService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "User ID is required"})
			return
		}

		menus, err := service.GetMenusByUserID(userID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]MenuResponse, len(menus))
		for i, m := range menus {
			response[i] = toMenuResponse(m)
		}

		c.JSON(http.StatusOK, response)
	}
}
