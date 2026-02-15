import { OAuth2Client } from "google-auth-library";
import { pool } from "./db.js";
import { Request, Response, NextFunction } from "express";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

const oauthClient = new OAuth2Client(googleClientId);

interface GoogleUser {
  email: string;
  name?: string;
  picture?: string;
}

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
      const data = await res.json() as { email?: string; name?: string; picture?: string };
      if (!data.email) return null;
      return { email: data.email, name: data.name, picture: data.picture };
    } catch {
      return null;
    }
  }
}

export async function isUserAllowed(email: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT email FROM allowed_users WHERE email = $1",
    [email.toLowerCase()]
  );
  return result.rows.length > 0;
}

export async function validateUser(token: string): Promise<{ allowed: boolean; email?: string }> {
  const user = await verifyGoogleToken(token);
  if (!user?.email) {
    return { allowed: false };
  }
  const allowed = await isUserAllowed(user.email);
  return { allowed, email: user.email };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const apiKey = process.env.MCP_API_KEY;
  if (apiKey && token === apiKey) {
    (req as any).userEmail = "api-key-user";
    next();
    return;
  }

  validateUser(token)
    .then(({ allowed, email }) => {
      if (!allowed) {
        res.status(403).json({ error: "Access denied. Your email is not on the allowed list." });
        return;
      }
      (req as any).userEmail = email;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Invalid token" });
    });
}
