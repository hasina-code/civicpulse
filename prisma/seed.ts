import { PrismaClient } from "@prisma/client";
import { departments } from "./seed-data/departments";
import { generateSeedIssues } from "./seed-data/issues";
import { locations } from "./seed-data/locations";
import { generateSeedUsers } from "./seed-data/users";

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function seed(): Promise<void> {
  await prisma.$transaction(
    async (transaction) => {
      await transaction.systemConfig.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          cityName: "Dhaka",
          defaultLatitude: 23.8103,
          defaultLongitude: 90.4125,
          slaHoursLow: 168,
          slaHoursMedium: 72,
          slaHoursHigh: 24,
          slaHoursCritical: 8,
          duplicateRadiusMeters: 50,
          dispatchPolicy: "CATEGORY",
          reminderIntervalMinutes: 60,
        },
        update: {
          cityName: "Dhaka",
          defaultLatitude: 23.8103,
          defaultLongitude: 90.4125,
          slaHoursLow: 168,
          slaHoursMedium: 72,
          slaHoursHigh: 24,
          slaHoursCritical: 8,
          duplicateRadiusMeters: 50,
          dispatchPolicy: "CATEGORY",
          reminderIntervalMinutes: 60,
        },
      });

      const seededDepartments = await Promise.all(
        departments.map((department) =>
          transaction.department.upsert({
            where: { name: department.name },
            create: {
              id: `seed-department-${slugify(department.name)}`,
              ...department,
            },
            update: {
              description: department.description,
              isActive: true,
            },
          }),
        ),
      );

      const seededLocations = await Promise.all(
        locations.map((location, index) =>
          transaction.location.upsert({
            where: { id: `seed-location-${String(index + 1).padStart(2, "0")}` },
            create: {
              id: `seed-location-${String(index + 1).padStart(2, "0")}`,
              ...location,
            },
            update: {
              ...location,
            },
          }),
        ),
      );

      const { users: userSeeds, departmentManagers } =
        await generateSeedUsers(seededDepartments);
      const seededUsers = await Promise.all(
        userSeeds.map(({ id, ...user }) =>
          transaction.user.upsert({
            where: { id },
            create: { id, ...user },
            update: user,
          }),
        ),
      );

      await Promise.all(
        departmentManagers.map(({ id, managerId }) =>
          transaction.department.update({
            where: { id },
            data: { managerId },
          }),
        ),
      );

      const issueSeeds = generateSeedIssues({
        departments: seededDepartments,
        locations: seededLocations,
        users: seededUsers,
      });

      for (let index = 0; index < issueSeeds.length; index += 1) {
        const issue = issueSeeds[index];

        if (!issue) {
          throw new Error(`Missing generated seed issue at index ${index}`);
        }

        await transaction.issue.upsert({
          where: {
            id: `seed-issue-${String(index + 1).padStart(3, "0")}`,
          },
          create: issue,
          update: {},
        });
      }
    },
    {
      maxWait: 10_000,
      timeout: 300_000,
    },
  );

  console.info("CivicPulse database seed completed.");
}

seed()
  .catch((error: unknown) => {
    console.error("CivicPulse database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
