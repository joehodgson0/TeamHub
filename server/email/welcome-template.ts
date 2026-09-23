const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character] || character);

export function buildWelcomeEmail(firstName: string | null | undefined, applicationUrl: string) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const text = `${greeting}

Welcome to TeamHub. Your account is ready.

TeamHub helps coaches and parents keep teams, events, availability, dependants and payments in one place.

Get started: ${applicationUrl}/dashboard
Open the TeamHub app: teamhub://

If you joined using a team invitation, return to that invitation link to finish joining your team.

TeamHub`;

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto">
    <h1 style="color:#2563eb">Welcome to TeamHub</h1>
    <p>${escapeHtml(greeting)}</p>
    <p>Your account is ready. TeamHub helps coaches and parents keep teams, events, availability, dependants and payments in one place.</p>
    <p style="margin:28px 0"><a href="${applicationUrl}/dashboard" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Open TeamHub</a></p>
    <p><a href="teamhub://" style="color:#2563eb">Open the TeamHub app</a></p>
    <p>If you joined using a team invitation, return to that invitation link to finish joining your team.</p>
    <p>TeamHub</p>
  </div>`;

  return { subject: "Welcome to TeamHub", text, html };
}
