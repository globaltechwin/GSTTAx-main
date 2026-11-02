# GSTTax ERP — Correction Notes

This ZIP is based on the project archive supplied in this conversation. Existing colors, Tailwind classes, sidebar patterns, and the overall Admin portal layout were retained; changes focus on functional fixes rather than a redesign.

## Changes made

1. Replaced the generic arbitrary key/value Settings screen with structured settings fields for all 13 existing categories while keeping the existing card, left navigation, typography, and primary-button styling.
2. Fixed the settings save request to use the scope-specific endpoint (`/api/settings` for workspace settings and `/api/superadmin/settings` for platform settings).
3. Added server-side allowlists for setting keys per category in both Settings APIs.
4. Added discard-unsaved-changes behavior and clear loading, success, and error states.
5. Updated shared business-page breadcrumbs and invoice links to remain within the current portal (`/dashboard/...` or `/superadmin/...`) instead of routing Superadmin users back to Admin pages.
6. Added a read-only Workspace Explorer at `/superadmin/admins/[adminId]`, with a server-authorized API endpoint that returns workspace-scoped company, customer/vendor, invoice, purchase, user, referral, and recent activity data. Workspace counts use database count queries rather than the capped display lists.
7. Added a “View workspace” link to the Admin Workspaces table.
8. Sanitized `.env.example` so it contains placeholders rather than the previously embedded token and database password.

## Important limits

- The Settings API persists category values in the existing platform/workspace settings tables. Some preferences (for example scheduled backup frequency, integration activation, and security-policy preferences) are explicitly described as preferences and are not represented as fully integrated external services or runtime enforcement unless the application already supports that behavior.
- The ZIP does not contain real `.env` files, dependencies, `.next`, `.git`, or editor/AI-agent skill folders.
- Automated typecheck, lint, and production build could not be completed in this environment because dependency installation did not finish before the execution timeout. Please run the verification commands locally before using the changes in production.
- Back up the local database and project before replacing files. No database migration is required for these changes.
