import type {
  IssueCategory,
  IssuePriority,
  IssueStatus,
  Prisma,
  TaskStatus,
} from "@prisma/client";
import type { SeedDepartment, SeedUser } from "./users";

export type SeedLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const categories = [
  "ROAD_DAMAGE",
  "STREETLIGHT",
  "DRAINAGE",
  "FOOTPATH",
  "WASTE_MANAGEMENT",
  "PUBLIC_INFRASTRUCTURE",
] satisfies readonly IssueCategory[];

const statuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] satisfies readonly IssueStatus[];

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] satisfies readonly IssuePriority[];

const departmentByCategory: Record<IssueCategory, string> = {
  ROAD_DAMAGE: "Roads & Highways",
  STREETLIGHT: "Electricity & Lighting",
  DRAINAGE: "Water & Sewage",
  FOOTPATH: "Roads & Highways",
  WASTE_MANAGEMENT: "Waste Management",
  PUBLIC_INFRASTRUCTURE: "Parks & Public Spaces",
};

const issueDetails: Record<IssueCategory, { title: string; descriptions: string[] }> = {
  ROAD_DAMAGE: {
    title: "Damaged road surface",
    descriptions: [
      "A pothole has formed in the carriageway and is forcing vehicles to swerve into adjacent traffic.",
      "The road surface is broken and uneven, creating a hazard for buses, motorcycles, and pedestrians.",
      "Recent wear has left a deep depression in the road that collects water after rain.",
    ],
  },
  STREETLIGHT: {
    title: "Streetlight not working",
    descriptions: [
      "The streetlight has remained unlit after dark, leaving this stretch of the road poorly illuminated.",
      "A roadside lamp is flickering intermittently and does not provide reliable lighting at night.",
      "Several pedestrians reported that the light near this junction has gone out.",
    ],
  },
  DRAINAGE: {
    title: "Blocked drainage channel",
    descriptions: [
      "Water is not draining through the roadside channel and is pooling across the walkway.",
      "The drain appears blocked with debris, causing water to back up during rainfall.",
      "Standing water and a strong odor are coming from the covered drain near this location.",
    ],
  },
  FOOTPATH: {
    title: "Footpath needs repair",
    descriptions: [
      "Loose and broken paving blocks make the footpath difficult to use for pedestrians.",
      "A section of the footpath has sunk and creates a trip hazard, especially for older residents.",
      "The walkway is damaged and its uneven surface is obstructing accessible passage.",
    ],
  },
  WASTE_MANAGEMENT: {
    title: "Uncollected waste in public area",
    descriptions: [
      "Household waste has accumulated at the roadside and has not been collected on schedule.",
      "An informal dumping spot is spreading onto the footpath and needs clearing.",
      "Waste containers are overflowing, leaving refuse on the adjacent street.",
    ],
  },
  PUBLIC_INFRASTRUCTURE: {
    title: "Public park facility damaged",
    descriptions: [
      "A public-space fixture is damaged and should be inspected before someone is injured.",
      "The park's seating and nearby public facilities need maintenance.",
      "A damaged fixture in this public area has been reported by nearby visitors.",
    ],
  },
};

type SeedUsersAndDepartments = {
  departments: readonly SeedDepartment[];
  users: readonly SeedUser[];
  locations: readonly SeedLocation[];
};

function requireRecord<T>(record: T | undefined, label: string): T {
  if (!record) {
    throw new Error(`Missing seed record: ${label}`);
  }

  return record;
}

export function generateSeedIssues({
  departments,
  users,
  locations,
}: SeedUsersAndDepartments): Prisma.IssueCreateInput[] {
  if (departments.length !== 5) {
    throw new Error(`Expected 5 seed departments, received ${departments.length}`);
  }

  if (locations.length !== 30) {
    throw new Error(`Expected 30 seed locations, received ${locations.length}`);
  }

  const departmentByName = new Map(departments.map((department) => [department.name, department]));
  const citizenUsers = users.filter((user) => user.role === "CITIZEN");
  const admins = users.filter((user) => user.role === "ADMIN");

  if (citizenUsers.length === 0 || admins.length === 0) {
    throw new Error("Seed issues require at least one citizen and one admin");
  }

  const generatedAt = new Date();
  const result: Prisma.IssueCreateInput[] = [];

  for (let index = 0; index < 108; index += 1) {
    const category = categories[index % categories.length];
    const status = statuses[Math.floor(index / 18)];
    const details = issueDetails[category];
    const departmentName = departmentByCategory[category];
    const department = requireRecord(departmentByName.get(departmentName), departmentName);
    const manager = requireRecord(
      users.find((user) => user.role === "MANAGER" && user.departmentId === department.id),
      `manager for ${departmentName}`,
    );
    const staffMembers = users.filter(
      (user) => user.role === "STAFF" && user.departmentId === department.id,
    );
    const staff = requireRecord(staffMembers[index % Math.max(staffMembers.length, 1)], `staff for ${departmentName}`);
    const location = requireRecord(locations[index % locations.length], `location ${index % 30}`);
    const reporter = citizenUsers[index % citizenUsers.length];
    const issueCreatedAt = new Date(generatedAt.getTime() - (120 - index) * 24 * 60 * 60 * 1000);
    const statusIndex = statuses.indexOf(status);
    const imageNumber = (index % 6) + 1;
    const history = statuses.slice(0, statusIndex + 1).map((toStatus, transitionIndex) => {
      const actor =
        transitionIndex === 0
          ? reporter
          : toStatus === "IN_PROGRESS"
            ? staff
            : manager;

      return {
        actor: { connect: { id: actor.id } },
        fromStatus: transitionIndex === 0 ? null : statuses[transitionIndex - 1],
        toStatus,
        note:
          transitionIndex === 0
            ? "Issue submitted by a citizen."
            : `Issue moved to ${toStatus.toLowerCase().replace(/_/g, " ")}.`,
        createdAt: new Date(issueCreatedAt.getTime() + transitionIndex * 4 * 60 * 60 * 1000),
      };
    });
    const resolvedAt =
      status === "RESOLVED" || status === "CLOSED"
        ? new Date(issueCreatedAt.getTime() + 4 * 4 * 60 * 60 * 1000)
        : undefined;
    const tasks: Prisma.TaskCreateWithoutIssueInput[] = [];

    if (statusIndex >= statuses.indexOf("ASSIGNED")) {
      const taskStatus: TaskStatus =
        status === "ASSIGNED"
          ? "PENDING"
          : status === "IN_PROGRESS"
            ? "IN_PROGRESS"
            : "COMPLETED";
      const taskCreatedAt = new Date(issueCreatedAt.getTime() + 2 * 4 * 60 * 60 * 1000);
      const updates = [
        {
          author: { connect: { id: staff.id } },
          note: "Work order received; crew checked the reported location.",
          createdAt: new Date(taskCreatedAt.getTime() + 60 * 60 * 1000),
        },
      ];

      if (taskStatus === "IN_PROGRESS" || taskStatus === "COMPLETED") {
        updates.push({
          author: { connect: { id: staff.id } },
          note: "Repair work is underway and the affected area has been inspected.",
          createdAt: new Date(taskCreatedAt.getTime() + 6 * 60 * 60 * 1000),
        });
      }

      if (taskStatus === "COMPLETED") {
        updates.push({
          author: { connect: { id: staff.id } },
          note: "Work is complete and the location is ready for manager review.",
          createdAt: new Date(taskCreatedAt.getTime() + 12 * 60 * 60 * 1000),
        });
      }

      if (status === "IN_PROGRESS" && index % 3 === 0) {
        tasks.push({
          id: `seed-task-${String(index + 1).padStart(3, "0")}-rejected`,
          assignee: { connect: { id: staff.id } },
          assignedBy: { connect: { id: manager.id } },
          status: "REJECTED",
          dueAt: new Date(taskCreatedAt.getTime() + 5 * 24 * 60 * 60 * 1000),
          reviewNote: "Completion evidence was insufficient; follow-up work is required.",
          createdAt: taskCreatedAt,
          updates: {
            create: [
              {
                author: { connect: { id: staff.id } },
                note: "Initial repair attempt submitted for review.",
                createdAt: new Date(taskCreatedAt.getTime() + 8 * 60 * 60 * 1000),
              },
            ],
          },
        });
      }

      tasks.push({
        id: `seed-task-${String(index + 1).padStart(3, "0")}`,
        assignee: { connect: { id: staff.id } },
        assignedBy: { connect: { id: manager.id } },
        status: taskStatus,
        dueAt: new Date(taskCreatedAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        completionPhotoUrls:
          taskStatus === "COMPLETED" ? [`/images/seed/completion-${imageNumber}.jpg`] : [],
        createdAt: taskCreatedAt,
        updates: { create: updates },
      });
    }

    const feedback =
      status === "RESOLVED" || status === "CLOSED"
        ? {
            create: {
              reporter: { connect: { id: reporter.id } },
              rating: 3 + (index % 3),
              comment:
                index % 2 === 0
                  ? "The issue was addressed. Thank you for the update."
                  : "The repair has improved the area for local residents.",
              createdAt: new Date(issueCreatedAt.getTime() + 6 * 4 * 60 * 60 * 1000),
            },
          }
        : undefined;

    result.push({
      id: `seed-issue-${String(index + 1).padStart(3, "0")}`,
      title: `${details.title} near ${location.name}`,
      description: details.descriptions[Math.floor(index / categories.length) % details.descriptions.length],
      category,
      priority: priorities[index % priorities.length],
      status,
      imageUrls: [`/images/seed/issue-${imageNumber}.jpg`],
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      createdAt: issueCreatedAt,
      ...(resolvedAt ? { resolvedAt } : {}),
      department: { connect: { id: department.id } },
      location: { connect: { id: location.id } },
      reporter: { connect: { id: reporter.id } },
      ...(status !== "SUBMITTED"
        ? {
            verifiedBy: { connect: { id: manager.id } },
            verifiedAt: new Date(issueCreatedAt.getTime() + 4 * 60 * 60 * 1000),
          }
        : {}),
      history: { create: history },
      ...(tasks.length > 0 ? { tasks: { create: tasks } } : {}),
      ...(feedback ? { feedback } : {}),
    });
  }

  return result;
}
