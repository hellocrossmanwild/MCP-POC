import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../src/types.js";

const mockQuery = vi.fn();
vi.mock("../../src/db.js", () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
}));

const mockVerifyIdToken = vi.fn();

vi.mock("google-auth-library", () => {
  class MockOAuth2Client {
    verifyIdToken = mockVerifyIdToken;
  }
  return { OAuth2Client: MockOAuth2Client };
});

const { verifyGoogleToken, isUserAllowed, validateUser, authMiddleware } = await import(
  "../../src/auth.js"
);

beforeEach(() => {
  mockQuery.mockReset();
  mockVerifyIdToken.mockReset();
  vi.restoreAllMocks();
});

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    headers: {},
    ...overrides,
  } as AuthenticatedRequest;
}

describe("verifyGoogleToken", () => {
  it("returns user from Google ID token when valid", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: "user@example.com",
        name: "Test User",
        picture: "https://photo.url",
      }),
    });

    const result = await verifyGoogleToken("valid-token");

    expect(result).toEqual({
      email: "user@example.com",
      name: "Test User",
      picture: "https://photo.url",
    });
  });

  it("returns null when payload has no email", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ name: "No Email" }),
    });

    const result = await verifyGoogleToken("token-no-email");
    expect(result).toBeNull();
  });

  it("falls back to userinfo endpoint when ID token verification fails", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid token"));

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: "fallback@example.com", name: "Fallback" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyGoogleToken("access-token");

    expect(result).toEqual({
      email: "fallback@example.com",
      name: "Fallback",
      picture: undefined,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: "Bearer access-token" } }
    );

    vi.unstubAllGlobals();
  });

  it("returns null when both ID token and userinfo fail", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid"));

    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyGoogleToken("bad-token");
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns null when userinfo fetch throws", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid"));

    const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyGoogleToken("bad-token");
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });
});

describe("isUserAllowed", () => {
  it("returns true when email is in allowed_users table", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ email: "user@example.com" }] });

    const result = await isUserAllowed("user@example.com");

    expect(result).toBe(true);
    expect(mockQuery.mock.calls[0][1]).toEqual(["user@example.com"]);
  });

  it("returns false when email is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await isUserAllowed("unknown@example.com");
    expect(result).toBe(false);
  });

  it("lowercases email before querying", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await isUserAllowed("USER@EXAMPLE.COM");

    expect(mockQuery.mock.calls[0][1]).toEqual(["user@example.com"]);
  });
});

describe("validateUser", () => {
  it("returns allowed:true with email for valid allowed user", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: "allowed@example.com" }),
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ email: "allowed@example.com" }] });

    const result = await validateUser("valid-token");

    expect(result).toEqual({ allowed: true, email: "allowed@example.com" });
  });

  it("returns allowed:false when user is not in allowlist", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: "denied@example.com" }),
    });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await validateUser("valid-token");

    expect(result).toEqual({ allowed: false, email: "denied@example.com" });
  });

  it("returns allowed:false when token verification fails", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Bad"));

    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false });
    vi.stubGlobal("fetch", mockFetch);

    const result = await validateUser("bad-token");

    expect(result).toEqual({ allowed: false });
    vi.unstubAllGlobals();
  });
});

describe("authMiddleware", () => {
  it("returns 401 when no Authorization header present", () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header does not start with Bearer", () => {
    const req = createMockReq({
      headers: { authorization: "Basic abc123" } as Record<string, string>,
    });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("authenticates with valid API key and sets userEmail", () => {
    const req = createMockReq({
      headers: { authorization: "Bearer test-api-key-for-unit-tests" } as Record<string, string>,
    });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userEmail).toBe("api-key-user");
  });

  it("rejects invalid API key and falls through to OAuth", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Bad"));
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false });
    vi.stubGlobal("fetch", mockFetch);

    const req = createMockReq({
      headers: { authorization: "Bearer wrong-key" } as Record<string, string>,
    });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });

  it("sets WWW-Authenticate header on 401 responses", () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      "WWW-Authenticate",
      expect.stringContaining("Bearer")
    );
  });
});
