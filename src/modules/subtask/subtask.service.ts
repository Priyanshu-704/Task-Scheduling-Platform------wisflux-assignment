import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface TaskNode {
  id: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: Date | null;
  createdAt: Date;
  subTasks?: TaskNode[];
}

@Injectable()
export class SubtaskService {
  constructor(private readonly dataSource: DataSource) {}

  // Get full descendant tree for a given task
  async getTaskTree(
    taskId: string,
    workspaceId: string,
  ): Promise<TaskNode | null> {
    // Check if task exists and belongs to workspace first
    const taskCheck = await this.dataSource.query(
      `SELECT id FROM tasks WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL`,
      [taskId, workspaceId],
    );
    if (taskCheck.length === 0) {
      throw new NotFoundException('Task not found in this workspace');
    }

    // CTE to recursively fetch all descendants (including self)
    const flatTasks = await this.dataSource.query(
      `
      WITH RECURSIVE subtask_tree AS (
        SELECT id, "parentTaskId", title, description, status, priority, "assignedTo", "dueDate", "createdAt"
        FROM tasks
        WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL
        UNION ALL
        SELECT t.id, t."parentTaskId", t.title, t.description, t.status, t.priority, t."assignedTo", t."dueDate", t."createdAt"
        FROM tasks t
        INNER JOIN subtask_tree st ON t."parentTaskId" = st.id
        WHERE t."deletedAt" IS NULL
      )
      SELECT * FROM subtask_tree;
      `,
      [taskId, workspaceId],
    );

    return this.buildTree(flatTasks, taskId);
  }

  // Get flat list of all descendants (subtasks of subtasks, etc.)
  async getDescendants(taskId: string, workspaceId: string): Promise<any[]> {
    const taskCheck = await this.dataSource.query(
      `SELECT id FROM tasks WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL`,
      [taskId, workspaceId],
    );
    if (taskCheck.length === 0) {
      throw new NotFoundException('Task not found in this workspace');
    }

    // Fetch all descendants excluding self
    return this.dataSource.query(
      `
      WITH RECURSIVE subtask_tree AS (
        SELECT id, "parentTaskId", title, description, status, priority, "assignedTo", "dueDate", "createdAt"
        FROM tasks
        WHERE "parentTaskId" = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL
        UNION ALL
        SELECT t.id, t."parentTaskId", t.title, t.description, t.status, t.priority, t."assignedTo", t."dueDate", t."createdAt"
        FROM tasks t
        INNER JOIN subtask_tree st ON t."parentTaskId" = st.id
        WHERE t."deletedAt" IS NULL
      )
      SELECT * FROM subtask_tree ORDER BY "createdAt" ASC;
      `,
      [taskId, workspaceId],
    );
  }

  // Get path from this task up to the root parent task
  async getAncestors(taskId: string, workspaceId: string): Promise<any[]> {
    const taskCheck = await this.dataSource.query(
      `SELECT id FROM tasks WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL`,
      [taskId, workspaceId],
    );
    if (taskCheck.length === 0) {
      throw new NotFoundException('Task not found in this workspace');
    }

    // Fetch all ancestors excluding self
    return this.dataSource.query(
      `
      WITH RECURSIVE task_ancestors AS (
        SELECT t.id, t."parentTaskId", t.title, t.description, t.status, t.priority, t."assignedTo", t."dueDate", t."createdAt"
        FROM tasks t
        WHERE t.id = (SELECT "parentTaskId" FROM tasks WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL) AND t."deletedAt" IS NULL
        UNION ALL
        SELECT t.id, t."parentTaskId", t.title, t.description, t.status, t.priority, t."assignedTo", t."dueDate", t."createdAt"
        FROM tasks t
        INNER JOIN task_ancestors ta ON ta.id = t."parentTaskId"
        WHERE t."deletedAt" IS NULL
      )
      SELECT * FROM task_ancestors ORDER BY "createdAt" DESC;
      `,
      [taskId, workspaceId],
    );
  }

  private buildTree(flatTasks: any[], rootId: string): TaskNode | null {
    const taskMap = new Map<string, TaskNode & { subTasks: TaskNode[] }>();

    flatTasks.forEach((task) => {
      taskMap.set(task.id, {
        id: task.id,
        parentTaskId: task.parentTaskId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        subTasks: [],
      });
    });

    let root: TaskNode | null = null;

    taskMap.forEach((task) => {
      if (task.id === rootId) {
        root = task;
      }
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        taskMap.get(task.parentTaskId)!.subTasks.push(task);
      }
    });

    return root;
  }
}
