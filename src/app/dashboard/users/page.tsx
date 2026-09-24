import type { Metadata } from "next";
import { UsersClient } from "@/components/user/users-client";

export const metadata: Metadata = {
  title: "Users | GSTTax",
  description: "Manage user accounts and access permissions",
};

export default function UsersPage() {
  return <UsersClient />;
}
