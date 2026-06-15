import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { User } from './user.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  entityType: string; // TASK | PROJECT | WORKSPACE | COMMENT

  @Column()
  entityId: string;

  @Column()
  action: string; // e.g. TASK_CREATED, TASK_UPDATED, TASK_COMPLETED

  @Column()
  performedBy: string;

  @ManyToOne(() => User, (user) => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performedBy' })
  performer: User;

  @CreateDateColumn()
  createdAt: Date;
}
