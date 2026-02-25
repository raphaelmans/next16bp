/**
 * Shared branded HTML email template for all KudosCourts notification emails.
 * Design tokens match the auth templates (supabase/templates/magic_link.html).
 */

export interface EmailTemplateParams {
  preheader: string;
  headerSubtitle: string;
  title: string;
  bodyLines: string[];
  ctaText?: string;
  ctaUrl?: string;
  statusBadge?: {
    label: string;
    color: "success" | "destructive" | "warning";
  };
  greeting?: string;
  detailRows?: { label: string; value: string }[];
  footerNote?: string;
  secondaryText?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  success: { bg: "#DCFCE7", text: "#16A34A" },
  destructive: { bg: "#FEE2E2", text: "#DC2626" },
  warning: { bg: "#FEF3C7", text: "#CA8A04" },
};

const FONT_HEADING =
  "'Outfit', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
const FONT_BODY =
  "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderBrandedEmailHtml(params: EmailTemplateParams): string {
  const {
    preheader,
    headerSubtitle,
    title,
    bodyLines,
    ctaText,
    ctaUrl,
    statusBadge,
    greeting,
    detailRows,
    footerNote,
    secondaryText,
  } = params;

  const badgeHtml = statusBadge
    ? (() => {
        const colors =
          STATUS_COLORS[statusBadge.color] ?? STATUS_COLORS.success;
        return `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;">
              <tr>
                <td style="background:${colors.bg}; border-radius:6px; padding:6px 14px;">
                  <span style="font-family:${FONT_BODY}; font-size:13px; font-weight:600; color:${colors.text};">
                    ${escapeHtml(statusBadge.label)}
                  </span>
                </td>
              </tr>
            </table>`;
      })()
    : "";

  const bodyHtml = bodyLines
    .map((line) => {
      if (line === "") {
        return '<div style="height:12px;"></div>';
      }
      return `<p style="margin:0 0 6px 0; font-size:15px; line-height:1.6; color:#44403C;">${escapeHtml(line)}</p>`;
    })
    .join("\n            ");

  const ctaHtml =
    ctaText && ctaUrl
      ? `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0 0;">
              <tr>
                <td bgcolor="#0D9488" style="border-radius:8px;">
                  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block; padding:12px 18px; font-family:${FONT_HEADING}; font-size:14px; font-weight:600; line-height:1; color:#FFFFFF; text-decoration:none;">
                    ${escapeHtml(ctaText)}
                  </a>
                </td>
              </tr>
            </table>

            <hr style="border:none; border-top:1px solid #E7E5E4; margin:20px 0;" />

            <p style="margin:0; font-size:12px; line-height:1.5; color:#78716C;">
              Trouble with the button? Copy and paste this link into your browser:
            </p>
            <p style="margin:8px 0 0 0; font-size:12px; line-height:1.5; word-break:break-all;">
              <a href="${escapeHtml(ctaUrl)}" style="color:#0F766E; text-decoration:underline;">${escapeHtml(ctaUrl)}</a>
            </p>`
      : "";

  const greetingHtml = greeting
    ? `<p style="margin:0 0 4px 0; font-size:15px; line-height:1.6; color:#57534E;">${escapeHtml(greeting)}</p>`
    : "";

  const detailRowsHtml =
    detailRows && detailRows.length > 0
      ? `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0 0 0; border:1px solid #E7E5E4; border-radius:8px; border-collapse:separate; overflow:hidden;">
              ${detailRows
                .map(
                  (row, i) =>
                    `<tr>
                  <td style="padding:10px 14px; font-family:${FONT_BODY}; font-size:13px; font-weight:600; color:#78716C; white-space:nowrap; width:1%;${i > 0 ? " border-top:1px solid #E7E5E4;" : ""}">${escapeHtml(row.label)}</td>
                  <td style="padding:10px 14px; font-family:${FONT_BODY}; font-size:14px; color:#1A1917;${i > 0 ? " border-top:1px solid #E7E5E4;" : ""}">${escapeHtml(row.value)}</td>
                </tr>`,
                )
                .join("\n              ")}
            </table>`
      : "";

  const footerNoteHtml = footerNote
    ? `<p style="margin:16px 0 0 0; font-size:13px; line-height:1.5; color:#57534E;">${escapeHtml(footerNote)}</p>`
    : "";

  const secondaryTextHtml = secondaryText
    ? `<p style="margin:8px 0 0 0; font-size:12px; line-height:1.5; color:#A8A29E;">${escapeHtml(secondaryText)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:#FAFAF9;">
  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF9; margin:0; padding:0; width:100%;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px; background:#FFFFFF; border:1px solid #E7E5E4; border-radius:12px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:0;">
              <div style="background:#0D9488; padding:20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 12px 0 0; vertical-align:middle;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 375 375" style="display:block;" role="img" aria-label="KudosCourts"><g fill="#FFFFFF" transform="translate(99.067 280.163)"><path d="M 124.1875 0 L 52.4375 -92.328125 L 121.921875 -177.125 L 170.59375 -177.125 L 92.328125 -85.046875 L 92.328125 -101.109375 L 173.109375 0 Z M 17.0625 0 L 17.0625 -177.125 L 56.453125 -177.125 L 56.453125 0 Z"/></g></svg>
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-family:${FONT_HEADING}; font-size:18px; font-weight:700; line-height:1.2; letter-spacing:-0.02em; color:#FFFFFF;">
                        KudosCourts
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="font-family:${FONT_BODY}; font-size:13px; line-height:1.5; color:rgba(255,255,255,0.88); margin-top:6px;">
                  ${escapeHtml(headerSubtitle)}
                </div>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px; font-family:${FONT_BODY}; color:#1A1917;">
              ${greetingHtml}
              <h1 style="margin:0 0 16px 0; font-family:${FONT_HEADING}; font-size:20px; font-weight:700; line-height:1.25; letter-spacing:-0.02em; color:#1A1917;">
                ${escapeHtml(title)}
              </h1>
              ${badgeHtml}
              ${bodyHtml}
              ${detailRowsHtml}
              ${ctaHtml}
              ${footerNoteHtml}
              ${secondaryTextHtml}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:14px 0 0 0; font-family:${FONT_BODY}; font-size:12px; line-height:1.5; color:#78716C;">
          KudosCourts
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
