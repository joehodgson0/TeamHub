import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Fetches and caches the CSRF token for the current page session
let csrfTokenCache: string | null = null;
async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    const data = await res.json();
    csrfTokenCache = data.csrfToken || "";
    return csrfTokenCache;
  } catch {
    return "";
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isMutating = method !== "GET" && method !== "HEAD";
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (isMutating) {
    headers["X-CSRF-Token"] = await getCsrfToken();
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});
