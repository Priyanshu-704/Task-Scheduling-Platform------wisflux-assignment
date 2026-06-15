import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSession } from './user-session.entity';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { Activity } from './activity.entity';
import { Notification } from './notification.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password?: string; // Exclude password from default SELECT queries

  @Column()
  name!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  isVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  ownedWorkspaces!: Workspace[];

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  memberships!: WorkspaceMember[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks!: Task[];

  @OneToMany(() => Task, (task) => task.creator)
  createdTasks!: Task[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => Activity, (activity) => activity.performer)
  activities!: Activity[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => AuditLog, (audit) => audit.user)
  auditLogs!: AuditLog[];
}
