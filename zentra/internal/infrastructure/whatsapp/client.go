package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Client struct {
	apiKey     string
	numberKey  string
	apiBaseURL string
}

type WatzapRequest struct {
	APIKey    string `json:"api_key"`
	NumberKey string `json:"number_key"`
	PhoneNo   string `json:"phone_no"`
	Message   string `json:"message"`
}

type WatzapResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
}

// NewClient creates a new WhatsApp client using watzap.id
func NewClient() *Client {
	return &Client{
		apiKey:     os.Getenv("WATZAP_API_KEY"),
		numberKey:  os.Getenv("WATZAP_NUMBER_KEY"),
		apiBaseURL: "https://api.watzap.id/v1/send_message",
	}
}

// SendMessage sends a WhatsApp message using watzap.id API
func (c *Client) SendMessage(to string, templateName string, params []string) error {
	// Format the message based on the template and parameters
	message := c.formatMessage(templateName, params)

	// Format phone number
	toNumber := formatPhoneNumber(to)

	// Prepare request body
	reqBody := WatzapRequest{
		APIKey:    c.apiKey,
		NumberKey: c.numberKey,
		PhoneNo:   toNumber,
		Message:   message,
	}

	// Convert request to JSON
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	// Create request
	req, err := http.NewRequest("POST", c.apiBaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	// Log the response (for debugging)
	log.Printf("Watzap Response: %s", string(body))

	// Parse response
	var watzapResp WatzapResponse
	if err := json.Unmarshal(body, &watzapResp); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	// Check response status
	if !watzapResp.Status {
		return fmt.Errorf("failed to send WhatsApp message: %s", watzapResp.Message)
	}

	return nil
}

// formatMessage creates the message text based on the template and parameters
func (c *Client) formatMessage(templateName string, params []string) string {
	var message string

	switch templateName {
	case "order_pending":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been received and is pending confirmation.\n\nOrder Details:\n- Status: Pending\n- Date: %s\n\nAdditional Info: %s",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_confirmed":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been confirmed and will be processed soon.\n\nOrder Details:\n- Status: Confirmed\n- Date: %s\n\nAdditional Info: %s",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_in_production":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s is now in production.\n\nOrder Details:\n- Status: In Production\n- Date: %s\n\nAdditional Info: %s\n\nWe'll keep you updated on the progress!",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_quality_check":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s is undergoing quality inspection.\n\nOrder Details:\n- Status: Quality Check\n- Date: %s\n\nAdditional Info: %s\n\nWe ensure your order meets our quality standards!",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_ready":
		message = fmt.Sprintf("Hello %s!\n\nGreat news! Your order #%s is ready for delivery.\n\nOrder Details:\n- Status: Ready for Delivery\n- Date: %s\n\nAdditional Info: %s\n\nWe'll contact you shortly to arrange delivery.",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_delivered":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been delivered.\n\nOrder Details:\n- Status: Delivered\n- Date: %s\n\nAdditional Info: %s\n\nWe hope you're satisfied with our service!",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	case "order_cancelled":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been cancelled.\n\nOrder Details:\n- Status: Cancelled\n- Date: %s\n\nReason: %s",
			params[0], params[1], time.Now().Format("02 Jan 2006 15:04"), params[2])

	default:
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s status has been updated.\n\nOrder Details:\n- Status: %s\n- Date: %s\n\nAdditional Info: %s",
			params[0], params[1], params[2], time.Now().Format("02 Jan 2006 15:04"), params[3])
	}

	// Add company signature
	message += "\n\nThank you for choosing us!\nVomo Team"

	return message
}

// formatPhoneNumber ensures the phone number is in the correct format
func formatPhoneNumber(phone string) string {
	// Remove any non-numeric characters except +
	var numbers []rune
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			numbers = append(numbers, r)
		}
	}

	// Convert to string
	cleanNumber := string(numbers)

	// Ensure number starts with country code
	if strings.HasPrefix(cleanNumber, "08") {
		cleanNumber = "62" + cleanNumber[1:] // Convert 08xx to 62xx
	} else if !strings.HasPrefix(cleanNumber, "62") {
		cleanNumber = "62" + cleanNumber
	}

	return cleanNumber
}
