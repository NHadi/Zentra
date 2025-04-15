package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/division"

	"github.com/gin-gonic/gin"
)

// EmployeeInfo represents the employee information in division response
type EmployeeInfo struct {
	ID    int    `json:"id" example:"1"`
	Name  string `json:"name" example:"John Doe"`
	Email string `json:"email" example:"john@example.com"`
	Phone string `json:"phone" example:"+1234567890"`
}

// DivisionResponse represents the division response structure
// @Description Division response model
type DivisionResponse struct {
	ID          int            `json:"id" example:"1"`
	Name        string         `json:"name" example:"ADMIN"`
	Description string         `json:"description" example:"Administration department"`
	CreatedAt   string         `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string         `json:"created_by" example:"admin"`
	UpdatedAt   string         `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string         `json:"updated_by" example:"admin"`
	TenantID    int            `json:"tenant_id" example:"1"`
	Employees   []EmployeeInfo `json:"employees,omitempty"`
}

// CreateDivisionRequest represents the request structure for creating a division
// @Description Create division request model
type CreateDivisionRequest struct {
	Name        string `json:"name" binding:"required" example:"ADMIN"`
	Description string `json:"description" example:"Administration department"`
}

// UpdateDivisionRequest represents the request structure for updating a division
// @Description Update division request model
type UpdateDivisionRequest struct {
	Name        string `json:"name" binding:"required" example:"ADMIN"`
	Description string `json:"description" example:"Administration department"`
}

// UpdateDivisionEmployeesRequest represents the request structure for updating division employees
// @Description Update division employees request model
type UpdateDivisionEmployeesRequest struct {
	EmployeeIDs []int `json:"employee_ids" binding:"required" example:"1,2,3"`
}

func toDivisionResponse(d *division.Division) DivisionResponse {
	response := DivisionResponse{
		ID:          d.ID,
		Name:        d.Name,
		Description: d.Description,
		CreatedAt:   d.CreatedAt.String(),
		CreatedBy:   d.CreatedBy,
		UpdatedAt:   d.UpdatedAt.String(),
		UpdatedBy:   d.UpdatedBy,
		TenantID:    d.TenantID,
	}

	// Convert employees if they exist
	if d.Employees != nil {
		response.Employees = make([]EmployeeInfo, len(d.Employees))
		for i, emp := range d.Employees {
			response.Employees[i] = EmployeeInfo{
				ID:    emp.ID,
				Name:  emp.Name,
				Email: emp.Email,
				Phone: emp.Phone,
			}
		}
	}

	return response
}

// @Summary Create a new division
// @Description Create a new division with the provided details
// @Tags Division
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param division body CreateDivisionRequest true "Division Data"
// @Success 201 {object} DivisionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions [post]
func CreateDivision(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateDivisionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		division := &division.Division{
			Name:        req.Name,
			Description: req.Description,
		}

		if err := service.Create(division, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created division
		createdDivision, err := service.FindByID(division.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created division"})
			return
		}

		c.JSON(http.StatusCreated, toDivisionResponse(createdDivision))
	}
}

// @Summary Get a division by ID
// @Description Get division details by ID
// @Tags Division
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Division ID"
// @Success 200 {object} DivisionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Division not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions/{id} [get]
func GetDivision(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		division, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Division not found"})
			return
		}

		c.JSON(http.StatusOK, toDivisionResponse(division))
	}
}

// @Summary Get all divisions
// @Description Get all divisions
// @Tags Division
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} DivisionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions [get]
func GetAllDivisions(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		divisions, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]DivisionResponse, len(divisions))
		for i, d := range divisions {
			response[i] = toDivisionResponse(&d)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a division
// @Description Update an existing division with new details
// @Tags Division
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Division ID"
// @Param division body UpdateDivisionRequest true "Division Data"
// @Success 200 {object} DivisionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Division not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions/{id} [put]
func UpdateDivision(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		var req UpdateDivisionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		division, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Division not found"})
			return
		}

		division.Name = req.Name
		division.Description = req.Description

		if err := service.Update(division, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated division
		updatedDivision, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated division"})
			return
		}

		c.JSON(http.StatusOK, toDivisionResponse(updatedDivision))
	}
}

// @Summary Delete a division
// @Description Delete an existing division
// @Tags Division
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Division ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Division not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions/{id} [delete]
func DeleteDivision(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Division deleted successfully"})
	}
}

// @Summary Update division employees
// @Description Update the list of employees assigned to a division
// @Tags Division
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Division ID"
// @Param request body UpdateDivisionEmployeesRequest true "Employee IDs"
// @Success 200 {object} DivisionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Division not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /divisions/{id}/employees [post]
func UpdateDivisionEmployees(service *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		var req UpdateDivisionEmployeesRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Update division employees
		if err := service.UpdateEmployees(id, req.EmployeeIDs, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated division
		updatedDivision, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated division"})
			return
		}

		c.JSON(http.StatusOK, toDivisionResponse(updatedDivision))
	}
}
