package handlers

// Response represents a generic response structure
type Response struct {
    Error   string      `json:"error,omitempty"`
    Message string      `json:"message,omitempty"`
    Data    interface{} `json:"data,omitempty"`
}