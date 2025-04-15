package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/channel"
)

type ChannelService struct {
	repo     channel.Repository
	auditSvc *audit.Service
}

func NewChannelService(repo channel.Repository, auditSvc *audit.Service) *ChannelService {
	return &ChannelService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

func (s *ChannelService) Create(channel *channel.Channel, ctx context.Context) error {
	if err := s.repo.Create(channel, ctx); err != nil {
		return err
	}
	return s.auditSvc.LogChange("channel", channel.ID, audit.ActionCreate, nil, channel, ctx)
}

func (s *ChannelService) FindByID(id int, ctx context.Context) (*channel.Channel, error) {
	return s.repo.FindByID(id, ctx)
}

func (s *ChannelService) FindAll(ctx context.Context) ([]channel.Channel, error) {
	return s.repo.FindAll(ctx)
}

func (s *ChannelService) Update(channel *channel.Channel, ctx context.Context) error {
	oldChannel, err := s.repo.FindByID(channel.ID, ctx)
	if err != nil {
		return err
	}
	if err := s.repo.Update(channel, ctx); err != nil {
		return err
	}
	return s.auditSvc.LogChange("channel", channel.ID, audit.ActionUpdate, oldChannel, channel, ctx)
}

func (s *ChannelService) Delete(id int, ctx context.Context) error {
	channel, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}
	return s.auditSvc.LogChange("channel", id, audit.ActionDelete, channel, nil, ctx)
}

func (s *ChannelService) FindByCode(code string, ctx context.Context) (*channel.Channel, error) {
	return s.repo.FindByCode(code, ctx)
}
