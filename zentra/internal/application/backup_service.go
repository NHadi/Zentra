package application

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
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

	// Create backup directory if it doesn't exist
	backupDir := "./backup"
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create backup directory: %v", err)
	}

	// Generate backup filename
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("db_backup_%s_%s.dump", timestamp, uuid.New().String()[:8])

	// Create backup using pg_dump inside the container
	cmd := exec.Command("docker", "exec", "postgres_db", "pg_dump",
		"-U", s.cfg.DBUser,
		"-F", "c",
		"-b",
		"-v",
		"-f", fmt.Sprintf("/app/backup/%s", filename),
		s.cfg.DBName)

	if output, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("failed to create backup: %v, output: %s", err, output)
	}

	// Get file size from within the container using Linux stat command
	cmd = exec.Command("docker", "exec", "postgres_db", "stat",
		"--format=%s", // Use Linux stat format specifier for size
		fmt.Sprintf("/app/backup/%s", filename))

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to get backup file size: %v, output: %s", err, output)
	}

	// Parse the file size
	var fileSize int64
	_, err = fmt.Sscanf(string(output), "%d", &fileSize)
	if err != nil {
		return nil, fmt.Errorf("failed to parse file size: %v", err)
	}

	// Create backup record
	backupRecord := &backup.Backup{
		FileName: filename,
		Size:     fileSize,
	}
	backupRecord.TenantID = userCtx.TenantID
	backupRecord.CreatedBy = userCtx.Username
	backupRecord.UpdatedBy = userCtx.Username

	if err := s.repo.Create(ctx, backupRecord); err != nil {
		// Clean up backup file
		cleanupCmd := exec.Command("docker", "exec", "postgres_db", "rm", fmt.Sprintf("/app/backup/%s", filename))
		cleanupCmd.Run() // Ignore cleanup errors
		return nil, fmt.Errorf("failed to save backup record: %v", err)
	}

	return backupRecord, nil
}

func (s *BackupService) RestoreBackup(ctx context.Context, backupID int) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Get backup record and verify tenant ownership
	backupRecord, err := s.repo.FindByID(ctx, backupID)
	if err != nil {
		return fmt.Errorf("failed to find backup: %v", err)
	}

	// Double-check tenant ownership
	if backupRecord.TenantID != userCtx.TenantID {
		return fmt.Errorf("unauthorized: backup belongs to a different tenant")
	}

	// First verify file exists in container
	verifyCmd := exec.Command("docker", "exec", "postgres_db", "test", "-f", fmt.Sprintf("/app/backup/%s", backupRecord.FileName))
	if err := verifyCmd.Run(); err != nil {
		return fmt.Errorf("backup file not found in container: %s", backupRecord.FileName)
	}

	// Get file size from container
	cmd := exec.Command("docker", "exec", "postgres_db", "stat",
		"--format=%s",
		fmt.Sprintf("/app/backup/%s", backupRecord.FileName))

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to get backup file info: %v, output: %s", err, output)
	}

	// Parse the file size
	var fileSize int64
	_, err = fmt.Sscanf(string(output), "%d", &fileSize)
	if err != nil {
		return fmt.Errorf("failed to parse file size: %v", err)
	}

	// Verify file size matches record
	if fileSize != backupRecord.Size {
		return fmt.Errorf("backup file size mismatch: expected %d bytes, got %d bytes", backupRecord.Size, fileSize)
	}

	// Create a temporary backup of current state with timestamp and tenant info
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	tempBackupFile := fmt.Sprintf("pre_restore_backup_tenant_%d_%s.dump", userCtx.TenantID, timestamp)

	// Create temporary backup
	cmd = exec.Command("docker", "exec", "postgres_db", "pg_dump",
		"-U", s.cfg.DBUser,
		"-F", "c", // Custom format
		"-b", // Include large objects
		"-v", // Verbose
		"-f", fmt.Sprintf("/app/backup/%s", tempBackupFile),
		s.cfg.DBName)

	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to create safety backup: %v, output: %s", err, output)
	}

	// Verify safety backup was created in container
	verifyCmd = exec.Command("docker", "exec", "postgres_db", "test", "-f", fmt.Sprintf("/app/backup/%s", tempBackupFile))
	if err := verifyCmd.Run(); err != nil {
		return fmt.Errorf("failed to verify safety backup creation in container")
	}

	// Terminate existing connections with retry and timeout
	maxRetries := 3
	retryDelay := time.Second * 2
	timeout := time.Second * 10
	timeoutChan := time.After(timeout)

	for i := 0; i < maxRetries; i++ {
		done := make(chan bool)
		errChan := make(chan error)

		go func() {
			cmd = exec.Command("docker", "exec", "postgres_db", "psql",
				"-U", s.cfg.DBUser,
				"-d", "postgres", // Connect to postgres db to safely terminate connections
				"-c", fmt.Sprintf("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%s' AND pid <> pg_backend_pid();", s.cfg.DBName))

			if output, err := cmd.CombinedOutput(); err != nil {
				errChan <- fmt.Errorf("failed to terminate connections: %v, output: %s", err, output)
				return
			}
			done <- true
		}()

		select {
		case <-timeoutChan:
			return fmt.Errorf("timeout while trying to terminate database connections")
		case err := <-errChan:
			if i == maxRetries-1 {
				return fmt.Errorf("failed to terminate connections after %d attempts: %v", maxRetries, err)
			}
			time.Sleep(retryDelay)
			continue
		case <-done:
			break
		}
		break
	}

	// Verify no active connections except ours with timeout
	verifyDone := make(chan bool)
	verifyErr := make(chan error)

	go func() {
		cmd = exec.Command("docker", "exec", "postgres_db", "psql",
			"-U", s.cfg.DBUser,
			"-d", "postgres",
			"-t", // Tuple only output
			"-c", fmt.Sprintf("SELECT count(*) FROM pg_stat_activity WHERE datname = '%s' AND pid <> pg_backend_pid();", s.cfg.DBName))

		output, err := cmd.CombinedOutput()
		if err != nil {
			verifyErr <- fmt.Errorf("failed to verify connections: %v, output: %s", err, output)
			return
		}

		// Trim whitespace and parse the count
		countStr := strings.TrimSpace(string(output))
		count, err := strconv.Atoi(countStr)
		if err != nil {
			verifyErr <- fmt.Errorf("failed to parse connection count: %v, output: %s", err, output)
			return
		}

		if count > 0 {
			verifyErr <- fmt.Errorf("database still has %d active connections", count)
			return
		}
		verifyDone <- true
	}()

	select {
	case <-timeoutChan:
		return fmt.Errorf("timeout while verifying database connections")
	case err := <-verifyErr:
		return err
	case <-verifyDone:
		// Proceed with restore
	}

	// Attempt restore with progress logging
	cmd = exec.Command("docker", "exec", "postgres_db", "pg_restore",
		"-U", s.cfg.DBUser,
		"-d", s.cfg.DBName,
		"-v",
		"--clean",         // Clean (drop) database objects before recreating
		"--if-exists",     // Don't error if objects don't exist
		"--no-owner",      // Skip restoration of object ownership
		"--no-privileges", // Skip restoration of access privileges
		fmt.Sprintf("/app/backup/%s", backupRecord.FileName))

	if output, err := cmd.CombinedOutput(); err != nil {
		// Log the failed restore attempt
		fmt.Printf("Restore failed, attempting rollback. Error: %v\nOutput: %s\n", err, output)

		// Attempt to restore from temporary backup if restore fails
		rollbackCmd := exec.Command("docker", "exec", "postgres_db", "pg_restore",
			"-U", s.cfg.DBUser,
			"-d", s.cfg.DBName,
			"-v",
			"--clean",
			"--if-exists",
			"--no-owner",
			"--no-privileges",
			fmt.Sprintf("/app/backup/%s", tempBackupFile))

		if rollbackOutput, rollbackErr := rollbackCmd.CombinedOutput(); rollbackErr != nil {
			// Keep the safety backup file in case of complete failure
			return fmt.Errorf("CRITICAL: restore failed and rollback failed. Safety backup preserved at %s. "+
				"Restore error: %v, output: %s. Rollback error: %v, output: %s",
				tempBackupFile, err, output, rollbackErr, rollbackOutput)
		}

		return fmt.Errorf("restore failed but system was rolled back successfully. Error: %v, output: %s", err, output)
	}

	// Restore backup table data from safety backup
	restoreBackupTableCmd := exec.Command("docker", "exec", "postgres_db", "pg_restore",
		"-U", s.cfg.DBUser,
		"-d", s.cfg.DBName,
		"-v",
		"--data-only",    // Only restore data, not schema
		"--table=backup", // Only restore the backup table
		fmt.Sprintf("/app/backup/%s", tempBackupFile))

	if output, err := restoreBackupTableCmd.CombinedOutput(); err != nil {
		fmt.Printf("Warning: Failed to restore backup table data: %v\nOutput: %s\n", err, output)
		// Don't fail the restore if backup table restore fails
	}

	// Verify database is accessible after restore
	verifyAccessCmd := exec.Command("docker", "exec", "postgres_db", "psql",
		"-U", s.cfg.DBUser,
		"-d", s.cfg.DBName,
		"-c", "SELECT 1")

	if output, err := verifyAccessCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("database is not accessible after restore: %v, output: %s", err, output)
	}

	// Clean up temporary backup file only if everything succeeded
	cleanupCmd := exec.Command("docker", "exec", "postgres_db", "rm", fmt.Sprintf("/app/backup/%s", tempBackupFile))
	if err := cleanupCmd.Run(); err != nil {
		fmt.Printf("Warning: Failed to remove temporary backup file %s: %v\n", tempBackupFile, err)
	}

	return nil
}

func (s *BackupService) ListBackups(ctx context.Context) ([]backup.Backup, error) {
	return s.repo.FindAll(ctx)
}

func (s *BackupService) DeleteBackup(ctx context.Context, backupID int) error {
	// Get backup record
	backupRecord, err := s.repo.FindByID(ctx, backupID)
	if err != nil {
		return fmt.Errorf("failed to find backup: %v", err)
	}

	// Delete backup file
	backupPath := filepath.Join("./backup", backupRecord.FileName)
	if err := os.Remove(backupPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete backup file: %v", err)
	}

	// Delete backup record
	if err := s.repo.Delete(ctx, backupID); err != nil {
		return fmt.Errorf("failed to delete backup record: %v", err)
	}

	return nil
}
