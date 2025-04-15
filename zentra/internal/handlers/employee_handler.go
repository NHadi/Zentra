package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/division"
	"zentra/internal/domain/employee"

	"github.com/gin-gonic/gin"
)

// DivisionInfo represents the division information in employee response
type DivisionInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"ADMIN"`
	Description string `json:"description" example:"Administration department"`
}

// EmployeeResponse represents the employee response structure
// @Description Employee response model
type EmployeeResponse struct {
	ID         int           `json:"id" example:"1"`
	Name       string        `json:"name" example:"Alice Johnson"`
	Email      string        `json:"email" example:"alice.johnson@email.com"`
	Phone      string        `json:"phone" example:"123-456-7890"`
	DivisionID int           `json:"division_id" example:"1"`
	Division   *DivisionInfo `json:"division,omitempty"`
	CreatedAt  string        `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy  string        `json:"created_by" example:"admin"`
	UpdatedAt  string        `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy  string        `json:"updated_by" example:"admin"`
	TenantID   int           `json:"tenant_id" example:"1"`
}

// CreateEmployeeRequest represents the request structure for creating an employee
// @Description Create employee request model
type CreateEmployeeRequest struct {
	Name       string `json:"name" binding:"required" example:"Alice Johnson"`
	Email      string `json:"email" binding:"required,email" example:"alice.johnson@email.com"`
	Phone      string `json:"phone" example:"123-456-7890"`
	DivisionID int    `json:"DivisionID" binding:"required" example:"1"`
}

// UpdateEmployeeRequest represents the request structure for updating an employee
// @Description Update employee request model
type UpdateEmployeeRequest struct {
	Name       string `json:"name" binding:"required" example:"Alice Johnson"`
	Email      string `json:"email" binding:"required,email" example:"alice.johnson@email.com"`
	Phone      string `json:"phone" example:"123-456-7890"`
	DivisionID int    `json:"DivisionID" binding:"required" example:"1"`
}

func toEmployeeResponse(e *employee.Employee, d *division.Division) EmployeeResponse {
	response := EmployeeResponse{
		ID:         e.ID,
		Name:       e.Name,
		Email:      e.Email,
		Phone:      e.Phone,
		DivisionID: e.DivisionID,
		CreatedAt:  e.CreatedAt.String(),
		CreatedBy:  e.CreatedBy,
		UpdatedAt:  e.UpdatedAt.String(),
		UpdatedBy:  e.UpdatedBy,
		TenantID:   e.TenantID,
	}

	if d != nil {
		response.Division = &DivisionInfo{
			ID:          d.ID,
			Name:        d.Name,
			Description: d.Description,
		}
	}

	return response
}

// @Summary Create a new employee
// @Description Create a new employee with the provided details
// @Tags Employee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param employee body CreateEmployeeRequest true "Employee Data"
// @Success 201 {object} EmployeeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees [post]
func CreateEmployee(service *application.EmployeeService, divisionService *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateEmployeeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if email already exists
		existing, err := service.FindByEmail(req.Email, c)
		if err == nil && existing != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Email already exists"})
			return
		}

		// Check if division exists
		division, err := divisionService.FindByID(req.DivisionID, c)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		employee := &employee.Employee{
			Name:       req.Name,
			Email:      req.Email,
			Phone:      req.Phone,
			DivisionID: req.DivisionID,
		}

		if err := service.Create(employee, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created employee
		createdEmployee, err := service.FindByID(employee.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created employee"})
			return
		}

		c.JSON(http.StatusCreated, toEmployeeResponse(createdEmployee, division))
	}
}

// @Summary Get an employee by ID
// @Description Get employee details by ID
// @Tags Employee
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Employee ID"
// @Success 200 {object} EmployeeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Employee not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees/{id} [get]
func GetEmployee(service *application.EmployeeService, divisionService *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid employee ID"})
			return
		}

		employee, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Employee not found"})
			return
		}

		division, err := divisionService.FindByID(employee.DivisionID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch division details"})
			return
		}

		c.JSON(http.StatusOK, toEmployeeResponse(employee, division))
	}
}

// @Summary Get all employees
// @Description Get all employees
// @Tags Employee
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} EmployeeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees [get]
func GetAllEmployees(service *application.EmployeeService, divisionService *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		employees, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]EmployeeResponse, len(employees))
		for i, e := range employees {
			division, err := divisionService.FindByID(e.DivisionID, c)
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch division details"})
				return
			}
			response[i] = toEmployeeResponse(&e, division)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update an employee
// @Description Update an existing employee with new details
// @Tags Employee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Employee ID"
// @Param employee body UpdateEmployeeRequest true "Employee Data"
// @Success 200 {object} EmployeeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Employee not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees/{id} [put]
func UpdateEmployee(service *application.EmployeeService, divisionService *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid employee ID"})
			return
		}

		var req UpdateEmployeeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if email already exists for a different employee
		existing, err := service.FindByEmail(req.Email, c)
		if err == nil && existing != nil && existing.ID != id {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Email already exists"})
			return
		}

		// Check if division exists
		division, err := divisionService.FindByID(req.DivisionID, c)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		employee, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Employee not found"})
			return
		}

		employee.Name = req.Name
		employee.Email = req.Email
		employee.Phone = req.Phone
		employee.DivisionID = req.DivisionID

		if err := service.Update(employee, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated employee
		updatedEmployee, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated employee"})
			return
		}

		c.JSON(http.StatusOK, toEmployeeResponse(updatedEmployee, division))
	}
}

// @Summary Delete an employee
// @Description Delete an existing employee
// @Tags Employee
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Employee ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Employee not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees/{id} [delete]
func DeleteEmployee(service *application.EmployeeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid employee ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Employee deleted successfully"})
	}
}

// @Summary Get employees by division
// @Description Get all employees for a specific division
// @Tags Employee
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param division_id query int true "Division ID" example:"1"
// @Success 200 {array} EmployeeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /employees/by-division [get]
func GetEmployeesByDivision(service *application.EmployeeService, divisionService *application.DivisionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		divisionID, err := strconv.Atoi(c.Query("division_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		// Check if division exists
		division, err := divisionService.FindByID(divisionID, c)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid division ID"})
			return
		}

		employees, err := service.FindByDivisionID(divisionID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]EmployeeResponse, len(employees))
		for i, e := range employees {
			response[i] = toEmployeeResponse(&e, division)
		}

		c.JSON(http.StatusOK, response)
	}
}
