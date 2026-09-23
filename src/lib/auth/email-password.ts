/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;

const previewResetRef = globalThis as typeof globalThis & {
  __sanctumPreviewResetLinks__?: Map<string, string>;
};

function previewResetLinks() {
  previewResetRef.__sanctumPreviewResetLinks__ ??= new Map();
  return previewResetRef.__sanctumPreviewResetLinks__;
}

export function takePreviewResetUrl(email: string): string | null {
  const key = email.trim().toLowerCase();
  const url = previewResetLinks().get(key) ?? null;
  if (url) previewResetLinks().delete(key);
  return url;
}

function stashPreviewResetUrl(email: string, url: string) {
  previewResetLinks().set(email.trim().toLowerCase(), url);
}

function escapeHtml(value: string) {
  const amp = ["&", "amp;"].join("");
  const lt = ["&", "lt;"].join("");
  const gt = ["&", "gt;"].join("");
  const quot = ["&", "quot;"].join("");
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return amp;
    if (char === "<") return lt;
    if (char === ">") return gt;
    if (char === '"') return quot;
    return "&#39;";
  });
}

function resetEmailCopy(name: string, url: string) {
  const who = name.trim() || "there";
  const safeWho = escapeHtml(who);
  const safeUrl = escapeHtml(url);
  const text = [
    `Hi ${who},`,
    "",
    "Someone asked to reset the Sanctum password for this email.",
    "Use this link to choose a new one. It expires in one hour.",
    "",
    url,
    "",
    "If you did not ask for this, you can ignore the email — your password stays the same.",
  ].join("\n");
  const html = [
    "<!doctype html>",
    "<html>",
    '  <body style="font-family: Georgia, serif; background:#0c0a0b; color:#f3ece6; padding:32px;">',
    '    <div style="max-width:480px;margin:0 auto;background:#1c1718;border:1px solid rgba(243,236,230,0.12);padding:28px;">',
    '      <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#c4b4a8;margin:0 0 16px;">Sanctum</p>',
    '      <h1 style="font-size:28px;margin:0 0 12px;">Reset your password</h1>',
    `      <p style="line-height:1.5;color:#d7cbc2;">Hi ${safeWho}. Someone asked to reset the Sanctum password for this email. The link below expires in one hour.</p>`,
    `      <p style="margin:24px 0;"><a href="${safeUrl}" style="display:inline-block;background:#c4a484;color:#1c1718;text-decoration:none;padding:12px 18px;">Choose a new password</a></p>`,
    `      <p style="font-size:13px;color:#c4b4a8;line-height:1.5;">If the button does not work, paste this into your browser:<br/>${safeUrl}</p>`,
    '      <p style="font-size:13px;color:#c4b4a8;">If you did not ask for this, ignore the email. Your password stays the same.</p>',
    "    </div>",
    "  </body>",
    "</html>",
  ].join("\n");
  return { subject: "Reset your Sanctum password", text, html };
}

function parseFrom(raw: string) {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (!match) return { email: raw, name: "Sanctum" };
  return { name: match[1].trim().replace(/^"|"$/g, "") || "Sanctum", email: match[2].trim() };
}

async function sendResetEmail(to: string, name: string, url: string) {
  const { subject, text, html } = resetEmailCopy(name, url);
  const fromRaw = process.env.EMAIL_FROM?.trim() || "Sanctum <noreply@mail.sanctum.app>";
  const from = parseFrom(fromRaw);

  const resend = process.env.RESEND_API_KEY?.trim();
  if (resend) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${from.name} <${from.email}>`,
        to,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) console.error("[reset-password] Resend failed", await res.text());
    return;
  }

  const sendgrid = process.env.SENDGRID_API_KEY?.trim();
  if (sendgrid) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgrid}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from.email, name: from.name },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });
    if (!res.ok) console.error("[reset-password] SendGrid failed", await res.text());
    return;
  }

  console.warn("[reset-password] No RESEND_API_KEY or SENDGRID_API_KEY set; reset email was not sent.");
}

export async function sendResetPassword(
  data: { user: { email: string; name: string }; url: string; token: string },
  _request?: Request,
) {
  let appUrl = data.url;
  try {
    const parsed = new URL(data.url);
    appUrl = `${parsed.origin}/reset-password?token=${encodeURIComponent(data.token)}`;
  } catch {
    appUrl = data.url;
  }
  stashPreviewResetUrl(data.user.email, appUrl);
  try {
    await sendResetEmail(data.user.email, data.user.name || "there", appUrl);
  } catch (error) {
    console.error("[reset-password] send failed", error);
  }
}
