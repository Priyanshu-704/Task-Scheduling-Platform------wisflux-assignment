import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { Project } from './project.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Reminder } from './reminder.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Index()
  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Index()
  @Column({ nullable: true })
  parentTaskId: string;

  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks: Task[];

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Index()
  @Column({ default: 'TODO' }) // TODO, IN_PROGRESS, BLOCKED, DONE
  status: string;

  @Index()
  @Column({ default: 'MEDIUM' }) // LOW, MEDIUM, HIGH, CRITICAL
  priority: string;

  @Index()
  @Column({ nullable: true })
  assignedTo: string;

  @ManyToOne(() => User, (user) => user.assignedTasks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  @Index()
  @Column({ nullable: true })
  dueDate: Date;

  @Column()
  createdBy: string;

  @ManyToOne(() => User, (user) => user.createdTasks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  completedAt: Date;

  @Column('text', { array: true, nullable: true })
  labels: string[];

  @Column('jsonb', { nullable: true, default: [] })
  attachments: { name: string; url: string; size: number; mimeType: string }[];

  @VersionColumn()
  version: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => Reminder, (reminder) => reminder.task)
  reminders: Reminder[];
}
