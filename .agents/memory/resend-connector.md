---
name: Resend connector behavior
description: Replit-specific behavior of the attached Resend connector and its restricted credential.
---

Use the attached Replit Resend connector for application email rather than requesting or storing a separate API key. A send-only connector credential may return an authorization error for domain-management endpoints while email delivery still works.

**Why:** The connected TeamHub credential successfully sent transactional email but rejected domain listing as a restricted send-only key. Replit's connector SDK also resolves a default connector host when no explicit connector-host variable is present.

**How to apply:** Test delivery with the email endpoint, not a domain-list request. Treat a restricted-key error from domain management as expected unless sending itself fails.