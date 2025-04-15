package appcontext

const (
	UserContextKey = "user_context"
)

type UserContext struct {
	Username string
	TenantID int
}
