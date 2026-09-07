import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { EmailDeliveryStatus } from "@prisma/client";
import { logEmailDelivery } from "@/lib/email/log";
import { renderEmailHtml, renderEmailText, type EmailTemplatePayload } from "@/lib/email/templates";

export interface SendEmailOptions {
  to: string;
  subject: string;
  message: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
  tenantId?: string | null;
  template?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  status: "sent" | "not_configured" | "failed";
  providerId?: string;
}

// Resend rate-limits at roughly 2 requests/second. A bulk operation (e.g.
// importing 50+ staff at once, each triggering an onboarding email) fires
// those sends far faster than that if left unthrottled, so every request
// to Resend is funneled through this queue to space them out, with a retry
// on 429 as a second line of defense.
const MIN_SEND_INTERVAL_MS = 550;
const MAX_RATE_LIMIT_RETRIES = 3;
let sendQueueTail: Promise<void> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  // Tests mock fetch and never hit the real API, so the spacing delay would
  // only slow the suite down without protecting anything.
  if (process.env.VITEST) return fn();

  const result = sendQueueTail.then(fn, fn);
  sendQueueTail = result.then(
    () => new Promise((resolve) => setTimeout(resolve, MIN_SEND_INTERVAL_MS)),
    () => new Promise((resolve) => setTimeout(resolve, MIN_SEND_INTERVAL_MS)),
  );
  return result;
}

async function postToResendWithRetry(body: Record<string, unknown>): Promise<Response> {
  let response: Response;
  for (let attempt = 0; ; attempt++) {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 429 || attempt >= MAX_RATE_LIMIT_RETRIES) return response;
    const retryAfterSec = Number(response.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? retryAfterSec * 1000
      : 1000 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, Math.min(backoffMs, 10_000)));
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {
    to,
    subject,
    message,
    html,
    attachments,
    tenantId = null,
    template = "generic",
    metadata,
  } = options;

  const logStatus = async (status: EmailDeliveryStatus, extra?: { providerId?: string; errorMessage?: string }) => {
    await logEmailDelivery({
      tenantId,
      template,
      to,
      subject,
      status,
      providerId: extra?.providerId,
      errorMessage: extra?.errorMessage,
      metadata,
      bodyText: message,
      bodyHtml: html,
      attachments,
    });
  };

  if (!process.env.RESEND_API_KEY) {
    logger.warn("email.not_configured", { to, subject, template });
    await logStatus("NOT_CONFIGURED");
    return { status: "not_configured" };
  }

  try {
    const body: Record<string, unknown> = {
      from: process.env.FROM_EMAIL || "hi@anaxi.io",
      to: [to],
      subject,
      text: message,
    };
    if (html) body.html = html;
    if (attachments?.length) {
      body.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "utf8").toString("base64"),
      }));
    }

    const res = await throttled(() => postToResendWithRetry(body));

    const responseJson = res.ok
      ? ((await res.json().catch(() => ({}))) as { id?: string })
      : null;

    if (res.ok) {
      const providerId = responseJson?.id;
      logger.info("email.sent", { to, subject, template, providerId });
      await logStatus("SENT", { providerId });
      return { status: "sent", providerId };
    }

    const errorBody =
      typeof res.text === "function" ? await res.text().catch(() => "(unreadable)") : "(unreadable)";
    logger.error("email.failed", { to, subject, template, httpStatus: res.status, errorBody });
    await logStatus("FAILED", { errorMessage: errorBody.slice(0, 500) });
    return { status: "failed" };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("email.error", { to, subject, template, error: errorMessage });
    await logStatus("FAILED", { errorMessage });
    return { status: "failed" };
  }
}

/** Send using shared HTML + plain-text templates. */
export async function sendTemplatedEmail(options: {
  to: string;
  subject: string;
  schoolName: string;
  tenantId?: string | null;
  template: string;
  payload: EmailTemplatePayload;
  attachments?: Array<{ filename: string; content: string }>;
  metadata?: Record<string, unknown>;
}): Promise<SendEmailResult> {
  const text = renderEmailText({ schoolName: options.schoolName, payload: options.payload });
  const html = renderEmailHtml({
    schoolName: options.schoolName,
    subject: options.subject,
    payload: options.payload,
  });
  return sendEmail({
    to: options.to,
    subject: options.subject,
    message: text,
    html,
    attachments: options.attachments,
    tenantId: options.tenantId,
    template: options.template,
    metadata: options.metadata,
  });
}

/** Create a password-set token for a user (onboarding / invite). */
export async function createPasswordSetToken(userId: string, expiryHours = 72): Promise<string> {
  const crypto = await import("crypto");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function shouldSendUserEmail(
  userId: string,
  kind: "observations" | "meetings" | "leave" | "oncall" | "oncall_first_aid"
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      emailObservations: true,
      emailMeetings: true,
      emailLeave: true,
      receivesOnCallEmails: true,
      receivesFirstAidEmails: true,
    },
  });
  if (!user?.isActive) return false;
  switch (kind) {
    case "observations":
      return user.emailObservations;
    case "meetings":
      return user.emailMeetings;
    case "leave":
      return user.emailLeave;
    case "oncall":
      return user.receivesOnCallEmails;
    case "oncall_first_aid":
      return user.receivesFirstAidEmails;
    default:
      return true;
  }
}
