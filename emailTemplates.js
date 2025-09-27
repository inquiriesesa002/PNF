// Professional Email Templates for Prime Net Farmer
// This file contains all email templates used in the system

const createVerificationEmailTemplate = (userName, code, email) => {
  const appName = process.env.APP_NAME || "Prime Net Farmer";
  const useInlineLogo = (process.env.APP_LOGO_INLINE || "").toLowerCase() === "true";
  const logoSrc = useInlineLogo
    ? "cid:app-logo"
    : (process.env.APP_LOGO_URL || "https://asap-nine-pi.vercel.app/logo.png"); // fallback to deployed logo
  const brandDark = "#166534"; // dark green
  const brandPrimary = "#FDE047"; // lemon yellow

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your verification code - ${appName}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height:1.5; color:#111827; background:#fafaf9; }
            .container { max-width:560px; margin:20px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06); }
            .header { background:linear-gradient(90deg, ${brandDark}, #22c55e); padding:24px; text-align:center; border-radius:12px 12px 0 0; }
            .logo-wrap { display:flex; align-items:center; justify-content:center; gap:12px; }
            .logo { width:48px; height:48px; border-radius:12px; object-fit:contain; background:#fff; padding:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
            .brand { color:#fff; font-size:20px; font-weight:800; text-shadow:0 1px 2px rgba(0,0,0,0.1); }
            .content { padding:32px; text-align:center; }
            .title { font-size:24px; font-weight:800; margin-bottom:12px; color:#166534; }
            .msg { font-size:16px; color:#374151; margin-bottom:24px; line-height:1.6; }
            .code { display:inline-block; font-family:'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; font-weight:900; letter-spacing:8px; padding:16px 24px; border-radius:12px; border:3px dashed ${brandPrimary}; background:linear-gradient(135deg, #fef3c7, #fde047); color:#166534; font-size:28px; box-shadow:0 4px 12px rgba(253, 224, 71, 0.3); }
            .note { margin-top:20px; font-size:14px; color:#6b7280; line-height:1.5; }
            .footer { padding:20px; background:linear-gradient(135deg, #f0fdf4, #dcfce7); text-align:center; border-top:1px solid #bbf7d0; }
            .footer p { color:#166534; font-size:14px; font-weight:600; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-wrap">
                    <img class="logo" src="${logoSrc}" alt="${appName} logo" />
                    <div class="brand">${appName}</div>
                </div>
            </div>
            <div class="content">
                <div class="title">Your verification code</div>
                <p class="msg">Hi ${userName || "there"}, use this code to verify your email.</p>
                <div class="code">${code}</div>
                <p class="note">Code expires in 10 minutes. If this wasn't you, ignore this email.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} ${appName}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textTemplate = `
${appName}

Your verification code: ${code}

Hi ${userName || "there"}, use this code to verify your email.
It expires in 10 minutes. If you didn't request this, ignore this email.
  `;

  return { htmlTemplate, textTemplate };
};

module.exports = {
  createVerificationEmailTemplate
};