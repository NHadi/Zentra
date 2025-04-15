package handlers

import (
	"net/http"
	"zentra/internal/application"
	"zentra/internal/domain/user"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UserResponse represents the user response structure
// @Description User response model
type UserResponse struct {
	ID        string `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Username  string `json:"username" example:"john.doe"`
	Email     string `json:"email" example:"john.doe@example.com"`
	RoleID    int    `json:"role_id" example:"1"`
	CreatedAt string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy string `json:"created_by" example:"admin"`
	UpdatedAt string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy string `json:"updated_by" example:"admin"`
	TenantID  int    `json:"tenant_id" example:"1"`
}

// CreateUserRequest represents the request structure for creating a user
// @Description Create user request model
type CreateUserRequest struct {
	Username string `json:"username" binding:"required" example:"john.doe"`
	Email    string `json:"email" binding:"required,email" example:"john.doe@example.com"`
	Password string `json:"password" binding:"required" example:"securepassword123"`
	RoleID   int    `json:"role_id" binding:"required" example:"1"`
}

// UpdateUserRequest represents the request structure for updating a user
// @Description Update user request model
type UpdateUserRequest struct {
	Username string `json:"username" binding:"required" example:"john.doe"`
	Email    string `json:"email" binding:"required,email" example:"john.doe@example.com"`
}

func ToUserResponse(user *user.User) UserResponse {
	return UserResponse{
		ID:        user.ID.String(),
		Username:  user.Username,
		Email:     user.Email,
		RoleID:    user.RoleID,
		CreatedAt: user.CreatedAt.String(),
		CreatedBy: user.CreatedBy,
		UpdatedAt: user.UpdatedAt.String(),
		UpdatedBy: user.UpdatedBy,
		TenantID:  user.TenantID,
	}
}

func ToUserResponses(users []user.User) []UserResponse {
	response := make([]UserResponse, len(users))
	for i, u := range users {
		response[i] = ToUserResponse(&u)
	}
	return response
}

// @Summary Create a new user
// @Description Create a new user with the provided details
// @Tags User
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param user body CreateUserRequest true "User Data"
// @Success 201 {object} UserResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users [post]
func CreateUser(service *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		user, err := service.CreateUser(req.Username, req.Email, req.Password, req.RoleID, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, ToUserResponse(user))
	}
}

// @Summary Get a user by ID
// @Description Get user details by ID
// @Tags User
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{id} [get]
func GetUser(service *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		user, err := service.GetUserByID(id, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}

		c.JSON(http.StatusOK, ToUserResponse(user))
	}
}

// @Summary Get all users
// @Description Get a list of all users
// @Tags User
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} UserResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users [get]
func GetUsers(service *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		users, err := service.FindAll(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, ToUserResponses(users))
	}
}

// @Summary Update a user
// @Description Update an existing user with new details
// @Tags User
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Param user body UpdateUserRequest true "User Data"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{id} [put]
func UpdateUser(service *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var req UpdateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		user, err := service.UpdateUser(id, req.Username, req.Email, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, ToUserResponse(user))
	}
}

// @Summary Delete a user
// @Description Delete an existing user
// @Tags User
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{id} [delete]
func DeleteUser(service *application.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.DeleteUser(id, c.Request.Context()); err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "User deleted successfully"})
	}
}
