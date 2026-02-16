/**
 * @file Authentication middleware supporting Google OAuth 2.0 and API key auth.
 * Protects MCP endpoints with an email allowlist stored in the `allowed_users` table.
 * Used by index.ts to gate access to SSE/Streamable HTTP transports.
 */

import { OAuth2Client } from "google-auth-library";
import { pool } from "./db.js";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./types.js";
import { getBaseUrl } from "./types.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

const oauthClient = new OAuth2Client(googleClientId);

/** Verified Google user info extracted from an ID token or userinfo endpoint. */
interface GoogleUser {
  email: string;
  name?: string;
  picture?: string;
}

/** Raw JSON shape returned by Google's userinfo v3 endpoint. */
interface UserInfoResponse {
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Google auth token and extracts user info.
 * Tries ID token verification first (faster, offline). On failure, falls back
 * to calling the Google userinfo endpoint (handles access tokens).
 *
 * @param token - Google ID token or access token.
 * @returns Verified user info, or `null` on any verification failure (never throws).
 */
export async function verifyGoogleToken(token: string): Promise<GoogleUser | null> {
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return null;
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as UserInfoResponse;
      if (!data.email) return null;
      return { email: data.email, name: data.name, picture: data.picture };
    } catch {
      return null;
    }
  }
}

/**
 * Checks whether an email is on the allowlist in the `allowed_users` table.
 * Comparison is case-insensitive (lowercased before query).
 *
 * @param email - Email address to check.
 * @returns `true` if the email exists in `allowed_users`.
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT email FROM allowed_users WHERE email = $1",
    [email.toLowerCase()]
  );
  return result.rows.length > 0;
}

/**
 * Combines token verification and allowlist check into a single call.
 *
 * @param token - Google auth token to verify.
 * @returns `{ allowed: true, email }` if valid and on allowlist, `{ allowed: false }` otherwise.
 */
export async function validateUser(token: string): Promise<{ allowed: boolean; email?: string }> {
  const user = await verifyGoogleToken(token);
  if (!user?.email) {
    return { allowed: false };
  }
  const allowed = await isUserAllowed(user.email);
  return { allowed, email: user.email };
}

/**
 * Express middleware that enforces authentication on protected routes.
 *
 * Auth flow:
 * 1. If no `Authorization: Bearer <token>` header → 401 with `WWW-Authenticate` header.
 * 2. If token matches `MCP_API_KEY` env var → sets `userEmail` to `"api-key-user"` and passes through.
 * 3. Otherwise validates as Google OAuth token against the allowlist.
 *    - Valid + allowed → sets `userEmail` to verified email and calls `next()`.
 *    - Valid + not allowed → 403 "Access denied".
 *    - Invalid token → 401 "Invalid token".
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    const baseUrl = getBaseUrl(req);
    res.status(401)
      .set("WWW-Authenticate", `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`)
      .json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  const apiKey = process.env.MCP_API_KEY;
  if (apiKey && token === apiKey) {
    req.userEmail = "api-key-user";
    next();
    return;
  }

  validateUser(token)
    .then(({ allowed, email }) => {
      if (!allowed) {
        res.status(403).json({ error: "Access denied. Your email is not on the allowed list." });
        return;
      }
      req.userEmail = email;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Invalid token" });
    });
}
