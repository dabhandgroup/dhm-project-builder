"use client";

import { mockProfiles } from "@/lib/mock-data";

interface MockProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "admin" | "member";
  must_change_password: boolean;
  created_at: string;
}

interface UseUserReturn {
  user: { id: string; email: string } | null;
  profile: MockProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUser(): UseUserReturn {
  const mock = mockProfiles[0];

  return {
    user: { id: mock.id, email: mock.email },
    profile: {
      id: mock.id,
      full_name: mock.full_name,
      avatar_url: mock.avatar_url,
      role: mock.role,
      must_change_password: mock.must_change_password,
      created_at: mock.created_at,
    },
    isAdmin: mock.role === "admin",
    isLoading: false,
  };
}
