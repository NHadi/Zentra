package application

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
	"zentra/internal/config"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/backup"

	"github.com/google/uuid"
)

type BackupService struct {
	repo backup.Repository
	cfg  *config.Config
}

func NewBackupService(repo backup.Repository, cfg *config.Config) *BackupService {
	return &BackupService{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *BackupService) CreateBackup(ctx context.Context) (*backup.Backup, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Get backup directory from environment variable or use default
	backupDir := os.Getenv("BACKUP_PATH")
	if backupDir == "" {
		backupDir = "/backups"
	}

	// Generate backup filename with tenant ID for isolation
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("tenant_%d_backup_%s_%s.dump", userCtx.TenantID, timestamp, uuid.New().String()[:8])
	backupPath := filepath.Join(backupDir, filename)

	// Create backup using pg_dump directly (not inside container)
	cmd := exec.Command("pg_dump",
		"-h", s.cfg.DBHost,
		"-U", s.cfg.DBUser,
		"-F", "c", // Custom format
		"-b", // Include large objects
		"-v", // Verbose
		"-f", backupPath,
		s.cfg.DBName)

	// Set PGPASSWORD environment variable
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", s.cfg.DBPassword))

	if output, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("failed to create backup: %v, output: %s", err, output)
	}

	// Get file info
	fileInfo, err := os.Stat(backupPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get backup file info: %v", err)
	}

	// Create backup record
	backupRecord := &backup.Backup{
		FileName: filename,
		Size:     fileInfo.Size(),
	}
	backupRecord.TenantID = userCtx.TenantID
	backupRecord.CreatedBy = userCtx.Username
	backupRecord.UpdatedBy = userCtx.Username

	if err := s.repo.Create(ctx, backupRecord); err != nil {
		// Clean up backup file
		os.Remove(backupPath) // Ignore cleanup errors
		return nil, fmt.Errorf("failed to save backup record: %v", err)
	}

	return backupRecord, nil
}

func (s *BackupService) RestoreBackup(ctx context.Context, backupID int) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Get backup directory from environment variable or use default
	backupDir := os.Getenv("BACKUP_PATH")
	if backupDir == "" {
		backupDir = "/backups"
	}

	// Get backup record and verify tenant ownership
	backupRecord, err := s.repo.FindByID(ctx, backupID)
	if err != nil {
		return fmt.Errorf("failed to find backup: %v", err)
	}

	// Double-check tenant ownership
	if backupRecord.TenantID != userCtx.TenantID {
		return fmt.Errorf("unauthorized: backup belongs to a different tenant")
	}

	backupPath := filepath.Join(backupDir, backupRecord.FileName)

	// Verify backup file exists
	if _, err := os.Stat(backupPath); err != nil {
		return fmt.Errorf("backup file not found: %v", err)
	}

	// Create a temporary backup of current state
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	tempBackupFile := fmt.Sprintf("tenant_%d_pre_restore_%s.dump", userCtx.TenantID, timestamp)
	tempBackupPath := filepath.Join(backupDir, tempBackupFile)

	// Create temporary backup
	tempCmd := exec.Command("pg_dump",
		"-h", s.cfg.DBHost,
		"-U", s.cfg.DBUser,
		"-F", "c",
		"-b",
		"-v",
		"-f", tempBackupPath,
		s.cfg.DBName)

	tempCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", s.cfg.DBPassword))

	if output, err := tempCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to create safety backup: %v, output: %s", err, output)
	}

	// Terminate existing connections
	terminateCmd := exec.Command("psql",
		"-h", s.cfg.DBHost,
		"-U", s.cfg.DBUser,
		"-d", "postgres",
		"-c", fmt.Sprintf("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%s' AND pid <> pg_backend_pid();", s.cfg.DBName))

	terminateCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", s.cfg.DBPassword))

	if output, err := terminateCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to terminate connections: %v, output: %s", err, output)
	}

	// Restore from backup
	restoreCmd := exec.Command("pg_restore",
		"-h", s.cfg.DBHost,
		"-U", s.cfg.DBUser,
		"-d", s.cfg.DBName,
		"-v",
		"--clean",
		"--if-exists",
		"--no-owner",
		"--no-privileges",
		"--exclude-table-data='backup'",
		backupPath)

	restoreCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", s.cfg.DBPassword))

	if output, err := restoreCmd.CombinedOutput(); err != nil {
		// Log the failed restore attempt
		fmt.Printf("Restore failed, attempting rollback. Error: %v\nOutput: %s\n", err, output)

		// Attempt rollback
		rollbackCmd := exec.Command("pg_restore",
			"-h", s.cfg.DBHost,
			"-U", s.cfg.DBUser,
			"-d", s.cfg.DBName,
			"-v",
			"--clean",
			"--if-exists",
			"--no-owner",
			"--no-privileges",
			"--exclude-table-data='backup'",
			tempBackupPath)

		rollbackCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", s.cfg.DBPassword))

		if rollbackOutput, rollbackErr := rollbackCmd.CombinedOutput(); rollbackErr != nil {
			return fmt.Errorf("CRITICAL: restore failed and rollback failed. Safety backup preserved at %s. "+
				"Restore error: %v, output: %s. Rollback error: %v, output: %s",
				tempBackupFile, err, output, rollbackErr, rollbackOutput)
		}

		return fmt.Errorf("restore failed but system was rolled back successfully. Error: %v, output: %s", err, output)
	}

	// Clean up temporary backup file
	os.Remove(tempBackupPath) // Ignore cleanup errors

	return nil
}

func (s *BackupService) ListBackups(ctx context.Context) ([]backup.Backup, error) {
	return s.repo.FindAll(ctx)
}

func (s *BackupService) DeleteBackup(ctx context.Context, backupID int) error {
	// Get backup directory from environment variable or use default
	backupDir := os.Getenv("BACKUP_PATH")
	if backupDir == "" {
		backupDir = "/backups"
	}

	// Get backup record
	backupRecord, err := s.repo.FindByID(ctx, backupID)
	if err != nil {
		return fmt.Errorf("failed to find backup: %v", err)
	}

	// Delete backup file
	backupPath := filepath.Join(backupDir, backupRecord.FileName)
	if err := os.Remove(backupPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete backup file: %v", err)
	}

	// Delete backup record
	if err := s.repo.Delete(ctx, backupID); err != nil {
		return fmt.Errorf("failed to delete backup record: %v", err)
	}

	return nil
}
