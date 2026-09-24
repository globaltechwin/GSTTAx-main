import { prisma } from "@/lib/db";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
    sidebarAccess: string[];
  };
}

export async function authenticate(username: string, password: string): Promise<AuthResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  if (user.status !== "active") {
    return { success: false, error: "Account is inactive" };
  }

  if (user.password !== password) {
    return { success: false, error: "Invalid username or password" };
  }

  return {
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      sidebarAccess: user.sidebarAccess ? JSON.parse(user.sidebarAccess) : [],
    },
  };
}
