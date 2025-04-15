package postgres

import (
    "fmt"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func NewConnection(host, user, password, dbname string, port int) (*gorm.DB, error) {
    dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
        host, user, password, dbname, port)
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}