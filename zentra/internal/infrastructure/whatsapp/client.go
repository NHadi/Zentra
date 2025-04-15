package whatsapp

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type Client struct {
	accountSid   string
	authToken    string
	fromNumber   string
	isProduction bool
}

type TwilioResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// NewClient creates a new WhatsApp client using Twilio
func NewClient() *Client {
	return &Client{
		accountSid:   os.Getenv("TWILIO_ACCOUNT_SID"),
		authToken:    os.Getenv("TWILIO_AUTH_TOKEN"),
		fromNumber:   os.Getenv("TWILIO_WHATSAPP_NUMBER"),
		isProduction: os.Getenv("TWILIO_PRODUCTION_MODE") == "true",
	}
}

// SendMessage sends a WhatsApp message using Twilio's API
func (c *Client) SendMessage(to string, templateName string, params []string) error {
	// Format the message based on the template and parameters
	message := c.formatMessage(templateName, params)

	// Format phone numbers
	toNumber := formatPhoneNumber(to)

	// Validate phone number format
	if !strings.HasPrefix(toNumber, "+") {
		return fmt.Errorf("invalid phone number format. Number must start with country code (e.g., +62)")
	}

	// Create the request URL
	endpoint := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", c.accountSid)

	// Prepare form data
	data := url.Values{}
	data.Set("To", fmt.Sprintf("whatsapp:%s", toNumber)) // Use formatted number
	data.Set("From", fmt.Sprintf("whatsapp:%s", c.fromNumber))
	data.Set("Body", message)

	// Log the request details (for debugging)
	log.Printf("Sending WhatsApp message to: %s", toNumber)
	log.Printf("From number: %s", c.fromNumber)

	// Create request
	req, err := http.NewRequest("POST", endpoint, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.SetBasicAuth(c.accountSid, c.authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

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
	log.Printf("Twilio Response: %s", string(body))

	// Parse response
	var twilioResp TwilioResponse
	if err := json.Unmarshal(body, &twilioResp); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	// Check response status
	if resp.StatusCode != http.StatusCreated {
		// Handle specific error cases
		switch resp.StatusCode {
		case http.StatusForbidden:
			if !c.isProduction {
				// Only show sandbox join message in sandbox mode
				joinMessage := fmt.Sprintf("", c.fromNumber)
				return fmt.Errorf(joinMessage)
			}
			return fmt.Errorf("message rejected: %s", twilioResp.Message)
		case http.StatusUnauthorized:
			return fmt.Errorf("invalid Twilio credentials. Please check your Account SID and Auth Token")
		case http.StatusBadRequest:
			return fmt.Errorf("invalid request: %s", twilioResp.Message)
		default:
			return fmt.Errorf("failed to send WhatsApp message: %s", twilioResp.Message)
		}
	}

	return nil
}

// formatMessage creates the message text based on the template and parameters
func (c *Client) formatMessage(templateName string, params []string) string {
	var message string

	switch templateName {
	case "order_pending":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been received and is pending confirmation.\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_confirmed":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been confirmed and will be processed soon.\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_in_production":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s is now in production. We'll keep you updated!\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_quality_check":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s is undergoing quality inspection.\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_ready":
		message = fmt.Sprintf("Hello %s!\n\nGreat news! Your order #%s is ready for delivery.\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_delivered":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been delivered. We hope you're satisfied!\n\nAdditional Info: %s",
			params[0], params[1], params[2])

	case "order_cancelled":
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s has been cancelled.\n\nReason: %s",
			params[0], params[1], params[2])

	default:
		message = fmt.Sprintf("Hello %s!\n\nYour order #%s status has been updated to: %s.\n\nAdditional Info: %s",
			params[0], params[1], params[2], params[3])
	}

	// Add sandbox instructions only in sandbox mode
	if !c.isProduction {
		message += fmt.Sprintf("\n\nNote: If you haven't received this message, please:\n"+
			"1. Save this number: %s\n"+
			"2. Send this message: 'join plenty-drawn'\n"+
			"3. Wait for confirmation before retrying", c.fromNumber)
	}

	// Add company signature
	message += "\n\nThank you for choosing us!\nVomo Team"

	return message
}

// formatPhoneNumber ensures the phone number is in the correct format for Twilio
func formatPhoneNumber(phone string) string {
	// Remove any non-numeric characters except +
	var numbers []rune
	for i, r := range phone {
		if (r >= '0' && r <= '9') || (i == 0 && r == '+') {
			numbers = append(numbers, r)
		}
	}

	// Convert to string
	cleanNumber := string(numbers)

	// Ensure number starts with country code
	if !strings.HasPrefix(cleanNumber, "+") {
		// For Indonesian numbers
		if strings.HasPrefix(cleanNumber, "08") {
			cleanNumber = "+62" + cleanNumber[1:] // Convert 08xx to +62xx
		} else if strings.HasPrefix(cleanNumber, "62") {
			cleanNumber = "+" + cleanNumber
		} else if strings.HasPrefix(cleanNumber, "1") {
			cleanNumber = "+" + cleanNumber // US/Canada numbers
		} else {
			// Assume Indonesian number if no country code
			cleanNumber = "+62" + cleanNumber
		}
	}

	return cleanNumber
}
