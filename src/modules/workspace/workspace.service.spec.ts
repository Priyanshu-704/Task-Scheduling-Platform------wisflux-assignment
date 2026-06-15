import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { UsersService } from '../users/users.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepo: any;
  let memberRepo: any;
  let usersService: any;
  let cacheService: any;
  let auditService: any;
  let notificationService: any;
  let realtimeGateway: any;
  let dataSource: any;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn((entity, data) => data),
      save: jest.fn((entity, data) =>
        Promise.resolve({ id: 'workspace-123', ...data }),
      ),
    },
  };

  beforeEach(async () => {
    workspaceRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    memberRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
    };
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    auditService = {
      log: jest.fn(),
    };
    notificationService = {
      createAndSendNotification: jest.fn(),
    };
    realtimeGateway = {
      sendMemberJoined: jest.fn(),
    };
    dataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(WorkspaceMember), useValue: memberRepo },
        { provide: UsersService, useValue: usersService },
        { provide: CacheService, useValue: cacheService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RealtimeGateway, useValue: realtimeGateway },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkspace', () => {
    it('should create a workspace and set owner as ADMIN', async () => {
      workspaceRepo.findOne.mockResolvedValue(null); // Slug is unique

      const result = await service.createWorkspace(
        'owner-id',
        'Acme Corp',
        'acme-corp',
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Acme Corp');
      expect(result.slug).toBe('acme-corp');
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'WORKSPACE_CREATE',
        'owner-id',
        expect.any(Object),
      );
    });

    it('should throw ConflictException if slug exists', async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createWorkspace('owner-id', 'Acme Corp', 'acme-corp'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return cached workspace if hit', async () => {
      const cachedWorkspace = { id: 'workspace-123', name: 'Cached Workspace' };
      cacheService.get.mockResolvedValue(cachedWorkspace);

      const result = await service.findById('workspace-123');

      expect(result).toEqual(cachedWorkspace);
      expect(workspaceRepo.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from DB, cache and return if miss', async () => {
      cacheService.get.mockResolvedValue(null);
      const dbWorkspace = {
        id: 'workspace-123',
        name: 'DB Workspace',
        slug: 'db-workspace',
      };
      workspaceRepo.findOne.mockResolvedValue(dbWorkspace);

      const result = await service.findById('workspace-123');

      expect(result).toEqual(dbWorkspace);
      expect(workspaceRepo.findOne).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'workspace:id:workspace-123',
        dbWorkspace,
        3600,
      );
    });

    it('should throw NotFoundException if workspace not found in DB', async () => {
      cacheService.get.mockResolvedValue(null);
      workspaceRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('workspace-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('inviteMember', () => {
    it('should successfully invite a user', async () => {
      const workspace = {
        id: 'workspace-123',
        name: 'Acme Corp',
        slug: 'acme',
      };
      const user = { id: 'user-456', email: 'user@example.com', name: 'User' };

      jest.spyOn(service, 'findById').mockResolvedValue(workspace as any);
      usersService.findByEmail.mockResolvedValue(user);
      usersService.findById.mockResolvedValue(user);
      memberRepo.findOne.mockResolvedValue(null); // Not already a member
      memberRepo.save.mockResolvedValue({
        id: 'member-id',
        workspaceId: 'workspace-123',
        userId: 'user-456',
        role: 'MEMBER',
      });

      const result = await service.inviteMember(
        'workspace-123',
        'performer-id',
        'user@example.com',
        'MEMBER',
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-456');
      expect(realtimeGateway.sendMemberJoined).toHaveBeenCalled();
      expect(notificationService.createAndSendNotification).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'WORKSPACE_INVITE',
        'performer-id',
        expect.any(Object),
      );
    });
  });
});
