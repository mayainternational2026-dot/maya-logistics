import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  },
}));

const { api, setApiBaseUrl, setUnauthorizedHandler } = await import("./api");

const COOKIE_KEY = "maya_session_cookie";

function mockResponse(opts: {
  ok: boolean;
  status: number;
  setCookie?: string;
  body?: unknown;
}): Response {
  return {
    ok: opts.ok,
    status: opts.status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "set-cookie" ? (opts.setCookie ?? null) : null,
    },
    json: () => Promise.resolve(opts.body ?? {}),
  } as unknown as Response;
}

describe("api session handling", () => {
  beforeEach(() => {
    store.clear();
    setApiBaseUrl("http://localhost:80");
    setUnauthorizedHandler(() => {});
  });

  it("stores the session cookie returned by a login response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        status: 200,
        setCookie: "maya_session=abc123; Path=/; HttpOnly",
        body: { user: { id: 1, name: "Test", email: "t@example.com", phone: "", role: "customer", createdAt: "" } },
      }),
    );

    await api.login("t@example.com", "password");

    expect(store.get(COOKIE_KEY)).toBe("maya_session=abc123");
  });

  it("sends a previously stored cookie on subsequent requests", async () => {
    store.set(COOKIE_KEY, "maya_session=abc123");
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({ ok: true, status: 200, body: [] }),
    );
    global.fetch = fetchMock;

    await api.listShipments();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers.Cookie).toBe("maya_session=abc123");
  });

  it("clears the stored session and triggers the unauthorized handler on a 401", async () => {
    store.set(COOKIE_KEY, "maya_session=abc123");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(api.listShipments()).rejects.toThrow();

    expect(store.has(COOKIE_KEY)).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not clear the stored session on non-401 errors", async () => {
    store.set(COOKIE_KEY, "maya_session=abc123");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 500, body: { error: "Server error" } }),
    );

    await expect(api.listShipments()).rejects.toThrow();

    expect(store.get(COOKIE_KEY)).toBe("maya_session=abc123");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("keeps a valid session cookie when getCurrentUser hits a transient server error", async () => {
    store.set(COOKIE_KEY, "maya_session=abc123");
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 500, body: { error: "Server error" } }),
    );

    const user = await api.getCurrentUser();

    expect(user).toBeNull();
    expect(store.get(COOKIE_KEY)).toBe("maya_session=abc123");
  });

  it("clears the session when getCurrentUser receives a real 401", async () => {
    store.set(COOKIE_KEY, "maya_session=abc123");
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 401, body: { error: "Unauthorized" } }),
    );

    const user = await api.getCurrentUser();

    expect(user).toBeNull();
    expect(store.has(COOKIE_KEY)).toBe(false);
  });
});
