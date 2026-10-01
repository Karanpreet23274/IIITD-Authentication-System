"use client";

import useSWR from "swr";
import { fetcher } from "@/components/ui";

export type Me = {
  identity: {
    fullName: string;
    firstName: string;
    email: string;
    rollNo: string | null;
    programme: string | null;
    batch: string | null;
    residence: "HOSTELLER" | "DAY_SCHOLAR" | null;
    hostelRoom: string | null;
    phone: string | null;
    profileAt: string | null;
    presence: "IN" | "OUT" | null;
    presenceAt: string | null;
    photoUrl: string | null;
  };
  credentials: {
    id: string;
    status: "ACTIVE" | "BLOCKED" | "REVOKED";
    statusReason: string | null;
    devices: { id: string; userAgent: string | null; createdAt: string }[];
    createdAt: string;
  }[];
  activeSession: { id: string; expiresAt: string; deviceId: string } | null;
};

export function useMe() {
  return useSWR<Me>("/api/student/me", fetcher);
}
