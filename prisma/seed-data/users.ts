import { hash } from "bcryptjs";
import type { UserRole } from "@prisma/client";

export type SeedDepartment = {
  id: string;
  name: string;
};

export type SeedUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  departmentId: string | null;
};

export type SeedUsersResult = {
  users: SeedUser[];
  departmentManagers: { id: string; managerId: string }[];
};

const departmentNames = [
  "Roads & Highways",
  "Electricity & Lighting",
  "Water & Sewage",
  "Waste Management",
  "Parks & Public Spaces",
] as const;

const staffNames = [
  "Aminul Islam",
  "Rafiq Uddin",
  "Mahmud Hasan",
  "Sajjad Hossain",
  "Imran Kabir",
  "Shakil Ahmed",
  "Rashedul Alam",
  "Fahim Rahman",
  "Tanvir Hossain",
  "Suman Das",
  "Jamal Uddin",
  "Nayeem Chowdhury",
  "Sohel Rana",
  "Arif Hossain",
  "Mizanur Rahman",
  "Biplob Sarker",
  "Kamal Ahmed",
  "Ruhul Amin",
  "Shuvo Roy",
  "Nasir Uddin",
] as const;

const citizenNames = [
  "Nusrat Jahan",
  "Farhan Ahmed",
  "Samira Islam",
  "Rezaul Karim",
  "Tania Sultana",
  "Sabbir Hossain",
  "Maliha Rahman",
  "Asif Mahmud",
  "Sadia Afrin",
  "Shahriar Kabir",
  "Rumana Akter",
  "Nabil Hasan",
] as const;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateSeedUsers(
  departments: readonly SeedDepartment[],
): Promise<SeedUsersResult> {
  const departmentByName = new Map(departments.map((department) => [department.name, department]));
  const missingDepartments = departmentNames.filter((name) => !departmentByName.has(name));

  if (missingDepartments.length > 0) {
    throw new Error(`Missing seed departments: ${missingDepartments.join(", ")}`);
  }

  const password = process.env.SEED_DEFAULT_PASSWORD || "Password123!";
  const passwordHash = await hash(password, 10);
  const users: SeedUser[] = [
    {
      id: "seed-user-admin",
      name: "CivicPulse Administrator",
      email: "demo.admin@civicpulse.local",
      passwordHash,
      role: "ADMIN",
      departmentId: null,
    },
  ];
  const departmentManagers: SeedUsersResult["departmentManagers"] = [];
  const managerByDepartment = new Map<string, SeedUser>();
  const staffByDepartment = new Map<string, SeedUser[]>();

  for (const [departmentIndex, departmentName] of departmentNames.entries()) {
    const department = departmentByName.get(departmentName);

    if (!department) {
      throw new Error(`Missing seed department: ${departmentName}`);
    }

    const slug = slugify(departmentName);
    const manager: SeedUser = {
      id: `seed-user-manager-${slug}`,
      name: departmentIndex === 0 ? "Demo Department Manager" : `${departmentName} Manager`,
      email:
        departmentIndex === 0
          ? "demo.manager@civicpulse.local"
          : `manager.${slug}@civicpulse.local`,
      passwordHash,
      role: "MANAGER",
      departmentId: department.id,
    };

    users.push(manager);
    managerByDepartment.set(departmentName, manager);
    departmentManagers.push({ id: department.id, managerId: manager.id });
  }

  for (const [staffIndex, name] of staffNames.entries()) {
    const departmentName = departmentNames[staffIndex % departmentNames.length];
    const department = departmentByName.get(departmentName);

    if (!department) {
      throw new Error(`Missing seed department: ${departmentName}`);
    }

    const slug = slugify(departmentName);
    const staff: SeedUser = {
      id: `seed-user-staff-${slug}-${String(staffIndex + 1).padStart(2, "0")}`,
      name: staffIndex === 0 ? "Demo Maintenance Staff" : name,
      email:
        staffIndex === 0
          ? "demo.staff@civicpulse.local"
          : `staff.${String(staffIndex + 1).padStart(2, "0")}@civicpulse.local`,
      passwordHash,
      role: "STAFF",
      departmentId: department.id,
    };

    users.push(staff);
    const departmentStaff = staffByDepartment.get(departmentName) ?? [];
    departmentStaff.push(staff);
    staffByDepartment.set(departmentName, departmentStaff);
  }

  for (const [citizenIndex, name] of citizenNames.entries()) {
    users.push({
      id: `seed-user-citizen-${String(citizenIndex + 1).padStart(2, "0")}`,
      name: citizenIndex === 0 ? "Demo Citizen" : name,
      email:
        citizenIndex === 0
          ? "demo.citizen@civicpulse.local"
          : `citizen.${String(citizenIndex + 1).padStart(2, "0")}@civicpulse.local`,
      passwordHash,
      role: "CITIZEN",
      departmentId: null,
    });
  }

  for (const departmentName of departmentNames) {
    if (!managerByDepartment.has(departmentName) || (staffByDepartment.get(departmentName)?.length ?? 0) < 4) {
      throw new Error(`Seed department must have a manager and four staff: ${departmentName}`);
    }
  }

  return { users, departmentManagers };
}
