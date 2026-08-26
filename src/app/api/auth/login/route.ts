import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  clearRateLimit,
  createSessionToken,
  rateLimit,
  timingSafeEqual,
} from "@/lib/session";

export const runtime = "nodejs";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || expected === "CHANGE_ME") {
    return NextResponse.json(
      {
        error:
          "The prototype is not configured. APP_PASSWORD is missing on the server.",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil((limit.retryAfterSeconds ?? 60) / 60)} minutes.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 60) } },
    );
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Enter the password." }, { status: 400 });
  }

  if (!(await timingSafeEqual(password, expected))) {
    // Same message regardless of why, so the response reveals nothing.
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  clearRateLimit(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), SESSION_COOKIE_OPTIONS);
  return response;
}
