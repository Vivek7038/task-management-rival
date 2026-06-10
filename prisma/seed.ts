import { PrismaClient, Role, Status, Priority, Action } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REGULAR_USER = {
  email: "user@taskmanager.dev",
  password: "User1234!",
  name: "Alice User",
  role: Role.USER,
};

const ADMIN_USER = {
  email: "admin@taskmanager.dev",
  password: "Admin1234!",
  name: "Bob Admin",
  role: Role.ADMIN,
};

async function main() {
  console.log("Seeding database...");

  const regularUser = await prisma.user.upsert({
    where: { email: REGULAR_USER.email },
    update: {},
    create: {
      email: REGULAR_USER.email,
      passwordHash: await bcrypt.hash(REGULAR_USER.password, 12),
      name: REGULAR_USER.name,
      role: REGULAR_USER.role,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: {},
    create: {
      email: ADMIN_USER.email,
      passwordHash: await bcrypt.hash(ADMIN_USER.password, 12),
      name: ADMIN_USER.name,
      role: ADMIN_USER.role,
    },
  });

  // Seed sample tasks for the regular user (idempotent via title+userId check)
  const sampleTasks = [
    {
      title: "Finish API endpoints",
      description: "Implement CRUD route handlers for tasks resource.",
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Write README",
      description: "Document setup instructions and trade-offs.",
      status: Status.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Set up Neon database",
      description: "Configure Neon project, connection strings, and run migrations.",
      status: Status.DONE,
      priority: Priority.LOW,
      dueDate: null,
    },
  ];

  for (const taskData of sampleTasks) {
    const existing = await prisma.task.findFirst({
      where: { userId: regularUser.id, title: taskData.title },
    });

    if (!existing) {
      const task = await prisma.task.create({
        data: { ...taskData, userId: regularUser.id },
      });

      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          actorId: regularUser.id,
          action: Action.CREATED,
          metadata: { title: task.title },
        },
      });
    }
  }

  console.log("\nSeeded credentials:");
  console.log("  Regular user:");
  console.log(`    Email:    ${REGULAR_USER.email}`);
  console.log(`    Password: ${REGULAR_USER.password}`);
  console.log("  Admin user:");
  console.log(`    Email:    ${ADMIN_USER.email}`);
  console.log(`    Password: ${ADMIN_USER.password}`);
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
