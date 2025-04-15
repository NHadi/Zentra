package handlers

// ErrorResponse represents a standard error response
// @Description Standard error response model
type ErrorResponse struct {
	Error string `json:"error" example:"Invalid request parameters"`
}

// SuccessResponse represents a standard success response
// @Description Standard success response model
type SuccessResponse struct {
	Message string `json:"message" example:"Operation completed successfully"`
}
