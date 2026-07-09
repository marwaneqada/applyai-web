export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type MeResponse = {
  data: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type FieldErrors = Record<string, string>;

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
};

function getApiBaseUrl() {
  const configuredUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

  return configuredUrl.endsWith("/api")
    ? configuredUrl.slice(0, -"/api".length)
    : configuredUrl;
}

const API_BASE_URL = getApiBaseUrl();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string");
  }

  return undefined;
}

function safeFieldMessage(field: string, message: string | undefined, status: number) {
  if (field === "name") {
    return "Enter your name.";
  }

  if (field === "email") {
    const lowerMessage = message?.toLowerCase() ?? "";

    if (lowerMessage.includes("taken") || lowerMessage.includes("already")) {
      return "That email is already registered.";
    }

    if (status === 422 && lowerMessage.includes("credential")) {
      return "We could not verify those details.";
    }

    return "Enter a valid email address.";
  }

  if (field === "password") {
    return "Use at least 8 characters.";
  }

  return undefined;
}

function normalizeFieldErrors(payload: unknown, status: number): FieldErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {};
  }

  return Object.entries(payload.errors).reduce<FieldErrors>((errors, [field, value]) => {
    const message = firstString(value);
    const safeMessage = safeFieldMessage(field, message, status);

    if (safeMessage) {
      errors[field] = safeMessage;
    }

    return errors;
  }, {});
}

function messageForStatus(status: number, payload: unknown) {
  const hasFieldErrors =
    isRecord(payload) && isRecord(payload.errors) && Object.keys(payload.errors).length > 0;

  if (hasFieldErrors) {
    return "Please check the highlighted fields.";
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 422) {
    return "We could not verify those details. Please try again.";
  }

  if (status >= 500) {
    return "ApplyAI is having trouble responding right now. Please try again shortly.";
  }

  if (status === 404) {
    return "This ApplyAI action is not available right now. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

export class ApiError extends Error {
  fieldErrors: FieldErrors;
  status: number;

  constructor({
    fieldErrors = {},
    message,
    status,
  }: {
    fieldErrors?: FieldErrors;
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export async function apiRequest<T>(
  path: string,
  { body, headers, token, ...options }: ApiRequestOptions = {},
) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: requestBody,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : undefined;

  if (!response.ok) {
    throw new ApiError({
      fieldErrors: normalizeFieldErrors(payload, response.status),
      message: messageForStatus(response.status, payload),
      status: response.status,
    });
  }

  return payload as T;
}

export function loginRequest(payload: LoginRequest) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    body: payload,
    method: "POST",
  });
}

export function registerRequest(payload: RegisterRequest) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    body: payload,
    method: "POST",
  });
}

export async function currentUserRequest(token: string) {
  const response = await apiRequest<MeResponse>("/api/me", {
    method: "GET",
    token,
  });

  return response.data;
}

export function logoutRequest(token: string) {
  return apiRequest<{ message?: string }>("/api/auth/logout", {
    method: "POST",
    token,
  });
}
