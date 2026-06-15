import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

function parseEnv() {
  const envPath = path.join(__dirname, '../../.env');
  const envConfig: { [key: string]: string } = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        envConfig[match[1]] = value;
      }
    }
  }
  return envConfig;
}

async function seed() {
  const env = parseEnv();
  
  const host = env.DB_HOST || 'localhost';
  const port = parseInt(env.DB_PORT || '5432', 10);
  const user = env.DB_USERNAME || 'postgres';
  const password = env.DB_PASSWORD || 'postgres';
  const database = env.DB_DATABASE || 'task_platform';

  console.log(`Connecting to database ${database} on ${host}:${port} as ${user}...`);

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    await client.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('The users table does not exist. Please start the backend server first to auto-generate the schema via TypeORM.');
      process.exit(1);
    }

    console.log('Clearing old data from database...');
    // Order matters for foreign keys
    await client.query('TRUNCATE TABLE notifications, reminders, comments, activities, tasks, projects, workspace_members, workspaces, user_sessions, users CASCADE;');
    console.log('Database cleared.');

    // Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const memberPasswordHash = await bcrypt.hash('Member@123', salt);

    const adminId = randomUUID();
    const janeId = randomUUID();
    const johnId = randomUUID();

    console.log('Seeding users...');
    await client.query(`
      INSERT INTO users (id, email, password, name, "isVerified", "createdAt", "updatedAt")
      VALUES 
        ($1, 'admin@gmail.com', $2, 'Admin User', true, NOW(), NOW()),
        ($3, 'jane.doe@gmail.com', $4, 'Jane Doe', true, NOW(), NOW()),
        ($5, 'john.smith@gmail.com', $4, 'John Smith', true, NOW(), NOW())
    `, [adminId, adminPasswordHash, janeId, memberPasswordHash, johnId]);

    // Workspaces
    console.log('Seeding workspaces...');
    const acmeWorkspaceId = randomUUID();
    const starkWorkspaceId = randomUUID();

    await client.query(`
      INSERT INTO workspaces (id, name, slug, "ownerId", "createdAt", "updatedAt")
      VALUES 
        ($1, 'Acme Development', 'acme-dev', $2, NOW(), NOW()),
        ($3, 'Stark Industries', 'stark-ind', $4, NOW(), NOW())
    `, [acmeWorkspaceId, adminId, starkWorkspaceId, janeId]);

    // Workspace Members
    console.log('Seeding workspace members...');
    await client.query(`
      INSERT INTO workspace_members ("workspaceId", "userId", role, "createdAt", "updatedAt")
      VALUES 
        ($1, $2, 'ADMIN', NOW(), NOW()), -- Admin owns Acme
        ($1, $3, 'MEMBER', NOW(), NOW()), -- Jane in Acme
        ($1, $4, 'MEMBER', NOW(), NOW()), -- John in Acme
        ($5, $3, 'ADMIN', NOW(), NOW()), -- Jane owns Stark
        ($5, $2, 'MEMBER', NOW(), NOW()) -- Admin in Stark
    `, [acmeWorkspaceId, adminId, janeId, johnId, starkWorkspaceId]);

    // Projects
    console.log('Seeding projects...');
    const webProjId = randomUUID();
    const marketingProjId = randomUUID();
    const starkProjId = randomUUID();

    await client.query(`
      INSERT INTO projects (id, "workspaceId", name, description, status, "createdAt", "updatedAt")
      VALUES 
        ($1, $2, 'Web Application Refactoring', 'Migrate the legacy codebase to React 19 and NestJS with micro-services architecture.', 'ACTIVE', NOW(), NOW()),
        ($3, $2, 'Q4 Marketing Strategy', 'Plan and execute marketing events, newsletters, and social outreach campaigns.', 'ACTIVE', NOW(), NOW()),
        ($4, $5, 'Arc Reactor Optimization', 'Iterate on the clean energy generator core to achieve 300% efficiency gain.', 'ACTIVE', NOW(), NOW())
    `, [webProjId, acmeWorkspaceId, marketingProjId, starkProjId, starkWorkspaceId]);

    // Tasks
    console.log('Seeding tasks...');
    const taskDbId = randomUUID();
    const taskAuthId = randomUUID();
    const taskPromId = randomUUID();
    const taskCicdId = randomUUID();
    const taskArcId = randomUUID();

    // Set due dates
    const dueIn3Days = new Date();
    dueIn3Days.setDate(dueIn3Days.getDate() + 3);
    const dueIn7Days = new Date();
    dueIn7Days.setDate(dueIn7Days.getDate() + 7);
    const dueIn14Days = new Date();
    dueIn14Days.setDate(dueIn14Days.getDate() + 14);

    await client.query(`
      INSERT INTO tasks (id, "workspaceId", "projectId", "parentTaskId", title, description, status, priority, "assignedTo", "dueDate", "createdBy", "completedAt", labels, attachments, version, "createdAt", "updatedAt")
      VALUES 
        -- Task 1: DB Migration (DONE)
        ($1, $2, $3, NULL, 'Database Migration to PostgreSQL', 'Migrate database schemas and seed initial values.', 'DONE', 'HIGH', $4, NOW(), $5, NOW(), '{"database", "infra"}', '[]', 1, NOW(), NOW()),
        -- Task 2: JWT Auth (IN_PROGRESS)
        ($6, $2, $3, NULL, 'Implement JWT Authentication Flow', 'Integrate access token, refresh token, and cookie rotation mechanism.', 'IN_PROGRESS', 'CRITICAL', $5, $7, $5, NULL, '{"security", "backend"}', '[]', 1, NOW(), NOW()),
        -- Task 3: Prometheus (TODO)
        ($8, $2, $3, NULL, 'Set up Prometheus Monitoring', 'Expose metric endpoints in NestJS and create dashboard.', 'TODO', 'MEDIUM', $4, $9, $5, NULL, '{"monitoring"}', '[]', 1, NOW(), NOW()),
        -- Task 4: CI/CD Setup (BLOCKED)
        ($10, $2, $3, NULL, 'Setup CI/CD Pipeline', 'Implement GitHub actions to build Docker images and push to registry.', 'BLOCKED', 'HIGH', $11, $12, $5, NULL, '{"devops"}', '[]', 1, NOW(), NOW()),
        -- Task 5: Stark project task
        ($13, $14, $15, NULL, 'Simulate Thermal Overload', 'Run computer simulations of the core at 150 gigawatts.', 'TODO', 'CRITICAL', $4, $7, $4, NULL, '{"physics", "simulation"}', '[]', 1, NOW(), NOW())
    `, [
      taskDbId, acmeWorkspaceId, webProjId, johnId, adminId, // Task 1
      taskAuthId, dueIn7Days, // Task 2
      taskPromId, dueIn3Days, // Task 3
      taskCicdId, johnId, dueIn14Days, // Task 4
      taskArcId, starkWorkspaceId, starkProjId // Task 5
    ]);

    // Subtasks of JWT Auth
    console.log('Seeding subtasks...');
    const subtaskDtoId = randomUUID();
    const subtaskGuardId = randomUUID();

    await client.query(`
      INSERT INTO tasks (id, "workspaceId", "projectId", "parentTaskId", title, description, status, priority, "assignedTo", "dueDate", "createdBy", "completedAt", labels, attachments, version, "createdAt", "updatedAt")
      VALUES 
        ($1, $2, $3, $4, 'Define Login/Signup DTOs', 'Create request DTOs and configure validation rules.', 'DONE', 'MEDIUM', $5, NULL, $5, NOW(), '{"backend"}', '[]', 1, NOW(), NOW()),
        ($6, $2, $3, $4, 'Write Unit Tests for Auth Guard', 'Ensure jwt-auth guard allows public endpoints and blocks unauthenticated requests.', 'TODO', 'HIGH', $7, NULL, $5, NULL, '{"testing"}', '[]', 1, NOW(), NOW())
    `, [
      subtaskDtoId, acmeWorkspaceId, webProjId, taskAuthId, adminId, // Subtask 1
      subtaskGuardId, janeId // Subtask 2
    ]);

    // Comments
    console.log('Seeding comments...');
    await client.query(`
      INSERT INTO comments (id, "taskId", "userId", message, "createdAt", "updatedAt")
      VALUES 
        ($1, $2, $3, 'The authentication flow should also include refresh token rotation for enhanced security.', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
        ($4, $2, $5, 'Agreed. I am implementing token rotation using Redis to track active sessions.', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
        ($6, $7, $8, 'Blocked until we receive credentials for the staging AWS environment.', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
    `, [
      randomUUID(), taskAuthId, janeId,
      randomUUID(), adminId,
      randomUUID(), taskCicdId, johnId
    ]);

    // Activities
    console.log('Seeding activities...');
    await client.query(`
      INSERT INTO activities (id, "workspaceId", "entityType", "entityId", action, "performedBy", "createdAt")
      VALUES 
        ($1, $2, 'TASK', $3, 'TASK_CREATED', $4, NOW() - INTERVAL '1 day'),
        ($5, $2, 'TASK', $3, 'TASK_ASSIGNED', $4, NOW() - INTERVAL '23 hours'),
        ($6, $2, 'TASK', $3, 'TASK_COMPLETED', $7, NOW() - INTERVAL '12 hours'),
        ($8, $2, 'COMMENT', $9, 'COMMENT_ADDED', $10, NOW() - INTERVAL '2 hours')
    `, [
      randomUUID(), acmeWorkspaceId, taskDbId, adminId,
      randomUUID(),
      randomUUID(), johnId,
      randomUUID(), taskAuthId, janeId
    ]);

    // Notifications
    console.log('Seeding notifications...');
    await client.query(`
      INSERT INTO notifications (id, "userId", type, title, message, "isRead", "createdAt")
      VALUES 
        ($1, $2, 'COMMENT_ADDED', 'New comment on authentication flow', 'Jane Doe commented on: Implement JWT Authentication Flow', false, NOW() - INTERVAL '2 hours'),
        ($3, $2, 'TASK_ASSIGNED', 'Task assigned to you', 'You have been assigned to: Implement JWT Authentication Flow', false, NOW() - INTERVAL '7 hours'),
        ($4, $5, 'TASK_ASSIGNED', 'Task assigned to you', 'Admin User assigned you to: Database Migration to PostgreSQL', true, NOW() - INTERVAL '23 hours')
    `, [
      randomUUID(), adminId,
      randomUUID(),
      randomUUID(), johnId
    ]);

    // Reminders
    console.log('Seeding reminders...');
    const reminderDate = new Date(dueIn7Days);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before due date

    await client.query(`
      INSERT INTO reminders (id, "taskId", "scheduledAt", status, "createdAt")
      VALUES 
        ($1, $2, $3, 'PENDING', NOW())
    `, [
      randomUUID(), taskAuthId, reminderDate
    ]);

    console.log('Seeding complete! Everything has been populated successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
