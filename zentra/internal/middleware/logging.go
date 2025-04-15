package middleware

import (
	"bytes"
	"io"
	"time"
	"zentra/internal/infrastructure/logging"

	"github.com/gin-gonic/gin"
)

type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func LoggingMiddleware(logger *logging.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Read request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Capture response
		w := &responseWriter{body: &bytes.Buffer{}, ResponseWriter: c.Writer}
		c.Writer = w

		// Process request
		c.Next()

		// Log request and response
		duration := time.Since(start)
		fields := map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     c.Writer.Status(),
			"duration":   duration.String(),
			"client_ip":  c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		}

		if len(requestBody) > 0 {
			fields["request_body"] = string(requestBody)
		}
		if w.body.Len() > 0 {
			fields["response_body"] = w.body.String()
		}

		// Log errors if any
		if len(c.Errors) > 0 {
			logger.Error("Request failed", fields, c.Errors.Last().Err)
		} else {
			logger.Info("Request completed", fields)
		}
	}
}
