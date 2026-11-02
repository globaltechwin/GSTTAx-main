export async function requestLogout(sendRequest: typeof fetch = fetch): Promise<void> {
  let response: Response;
  try {
    response = await sendRequest("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new Error("Network error while signing out. Check your connection and try again.");
  }

  let result: { success?: boolean; error?: string } | null = null;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const payload = body as Record<string, unknown>;
      result = {
        success: typeof payload.success === "boolean" ? payload.success : undefined,
        error: typeof payload.error === "string" ? payload.error : undefined,
      };
    }
  } catch {
    if (response.ok) throw new Error("The server returned an invalid sign-out response.");
  }

  if (!response.ok) {
    throw new Error(
      result?.error || `Sign out failed (HTTP ${response.status}). Please try again.`
    );
  }
  if (result?.success !== true) {
    throw new Error(result?.error || "The server could not confirm sign out.");
  }
}
