import { apiFetch } from "@/shared/lib/api-client";
import { LoginRequest, LoginResponse } from "../domain/types";

// fonction de connexion
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
