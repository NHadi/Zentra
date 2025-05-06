package logging

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
)

type Logger struct {
	client *elasticsearch.Client
	index  string
}

func NewLogger(addresses []string, username, password, index string) (*Logger, error) {
	cfg := elasticsearch.Config{
		Addresses: addresses,
		Username:  username,
		Password:  password,
	}

	client, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("error creating elasticsearch client: %w", err)
	}

	return &Logger{
		client: client,
		index:  index,
	}, nil
}

// shouldSkipLogging returns true if the message should not be logged
func shouldSkipLogging(msg string, fields map[string]interface{}) bool {
	// Skip health check messages
	if msg == "Service is healthy" {
		return true
	}

	// Check if it's a health check API call
	if fields != nil {
		if path, ok := fields["path"].(string); ok {
			if path == "/api/health" {
				return true
			}
		}
	}

	return false
}

func (l *Logger) Info(msg string, fields map[string]interface{}) error {
	if shouldSkipLogging(msg, fields) {
		return nil
	}
	return l.log("info", msg, fields, nil)
}

func (l *Logger) Error(msg string, fields map[string]interface{}, err error) error {
	if shouldSkipLogging(msg, fields) {
		return nil
	}
	if fields == nil {
		fields = make(map[string]interface{})
	}
	if err != nil {
		fields["error"] = err.Error()
	}
	return l.log("error", msg, fields, err)
}

func (l *Logger) log(level, msg string, fields map[string]interface{}, err error) error {
	doc := map[string]interface{}{
		"@timestamp": time.Now().UTC(),
		"level":      level,
		"message":    msg,
		"fields":     fields,
	}

	data, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("error marshaling log entry: %w", err)
	}

	_, err = l.client.Index(
		l.index,
		strings.NewReader(string(data)),
		l.client.Index.WithContext(context.Background()),
		l.client.Index.WithRefresh("true"),
	)

	return err
}
