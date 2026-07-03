import AsyncStorage from "@react-native-async-storage/async-storage";

const COOKIE_KEY = "maya_session_cookie";

let _baseUrl: string | null = null;
let _onUnauthorized: (() => void) | null = null;
let _onNetworkError: (() => void) | null = null;

export function setApiBaseUrl(url: string) {
  _baseUrl = url;
}

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export function setNetworkErrorHandler(fn: () => void) {
  _onNetworkError = fn;
}

function getBaseUrl(): string {
  if (_baseUrl) return _baseUrl;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "http://localhost:80";
}

async function getStoredCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
}

async function storeCookie(cookie: string) {
  try {
    await AsyncStorage.setItem(COOKIE_KEY, cookie);
  } catch {}
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(COOKIE_KEY);
  } catch {}
}

async function apiFetch(
  path: string,
  options: RequestInit & { _skipUnauthorized?: boolean } = {},
): Promise<Response> {
  const { _skipUnauthorized, ...fetchOptions } = options;
  const base = getBaseUrl();
  const url = `${base}/api${path}`;
  const cookie = await getStoredCookie();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (cookie) {
    headers["Cookie"] = cookie;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include",
    });
  } catch (err) {
    _onNetworkError?.();
    throw err;
  }

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const sessionPart = setCookie.split(";")[0];
    if (sessionPart) {
      await storeCookie(sessionPart);
    }
  }

  if (response.status === 401 && !_skipUnauthorized) {
    await clearSession();
    _onUnauthorized?.();
  }

  return response;
}

export async function pingServer(): Promise<boolean> {
  const base = getBaseUrl();
  try {
    await fetch(`${base}/api/auth/me`, { method: "HEAD" });
    return true;
  } catch {
    return false;
  }
}

export type ShipmentStatus =
  | "pending"
  | "collected"
  | "at_warehouse"
  | "customs_clearance"
  | "in_transit"
  | "arrived"
  | "delivered";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface Shipment {
  id: number;
  trackingId: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  senderName: string;
  receiverName: string;
  weight: string | number;
  cost: string | number;
  description: string | null;
  notes: string | null;
  paid: boolean;
  serviceType: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = "pending" | "reviewing" | "quoted" | "closed";

export interface Inquiry {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string | null;
  productDetails: string;
  images: string | null;
  productLink: string | null;
  quantity: number | null;
  estimatedCost: number | null;
  status: InquiryStatus;
  adminNotes: string | null;
  createdAt: string;
}

export interface InquiryFollowup {
  id: number;
  inquiryId: number;
  userId: number | null;
  message: string;
  createdAt: string;
}

export const api = {
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    return data;
  },

  async logout(): Promise<void> {
    await apiFetch("/auth/logout", {
      method: "POST",
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    await clearSession();
  },

  async getCurrentUser(): Promise<User | null> {
    const res = await apiFetch("/auth/me", { _skipUnauthorized: true } as RequestInit & {
      _skipUnauthorized: boolean;
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const data = await res.json();
    return data.user ?? null;
  },

  async listShipments(params?: { status?: string; search?: string }): Promise<Shipment[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await apiFetch(`/shipments${query}`);
    if (!res.ok) throw new Error("Failed to load shipments");
    return res.json();
  },

  async getShipment(id: number): Promise<Shipment> {
    const res = await apiFetch(`/shipments/${id}`);
    if (!res.ok) throw new Error("Failed to load shipment");
    return res.json();
  },

  async trackShipment(trackingId: string): Promise<Shipment> {
    const res = await apiFetch(`/shipments/track/${trackingId}`);
    if (!res.ok) throw new Error("Shipment not found");
    return res.json();
  },

  async registerOtp(body: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ message: string }> {
    const res = await apiFetch("/auth/register-otp", {
      method: "POST",
      body: JSON.stringify(body),
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    return data;
  },

  async registerVerify(body: {
    email: string;
    otp: string;
  }): Promise<{ user: User }> {
    const res = await apiFetch("/auth/register-verify", {
      method: "POST",
      body: JSON.stringify(body),
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed");
    return data;
  },

  async createInquiry(body: {
    name: string;
    email: string;
    phone?: string;
    productDetails: string;
    productLink?: string;
    quantity?: number;
    estimatedCost?: number;
    images?: Array<{ name: string; dataUrl: string }>;
  }): Promise<void> {
    const res = await apiFetch("/inquiries", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Submission failed");
    }
  },

  async updateShipment(
    id: number,
    body: { status?: ShipmentStatus; notes?: string },
  ): Promise<Shipment> {
    const res = await apiFetch(`/shipments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    return data;
  },

  async listMyInquiries(): Promise<Inquiry[]> {
    const res = await apiFetch("/inquiries/mine");
    if (!res.ok) throw new Error("Failed to load inquiries");
    return res.json();
  },

  async listInquiryFollowups(inquiryId: number): Promise<InquiryFollowup[]> {
    const res = await apiFetch(`/inquiries/${inquiryId}/followups`);
    if (!res.ok) throw new Error("Failed to load follow-ups");
    return res.json();
  },

  async createInquiryFollowup(inquiryId: number, message: string): Promise<InquiryFollowup> {
    const res = await apiFetch(`/inquiries/${inquiryId}/followups`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to send follow-up");
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  },

  async resetPassword(body: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
      _skipUnauthorized: true,
    } as RequestInit & { _skipUnauthorized: boolean });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Reset failed");
    return data;
  },
};
