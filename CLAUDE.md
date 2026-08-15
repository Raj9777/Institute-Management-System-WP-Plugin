# Project Rules — Institute Management System (WordPress Plugin)

## What this is
A commercial WordPress plugin, distributed as a zip, sold with a license key.
Each customer (an institute) installs it on their own WordPress site. All data
lives in that site's own MySQL database via custom tables. No central database,
no multi-tenant scoping — one install = one institute.

## Absolute rules — never violate

1. **Prefix everything.** Functions, classes, hooks, options, and DB tables all
   use an `ims_` (or similarly distinctive) prefix. This plugin runs alongside
   whatever else the customer has installed — collisions are not acceptable.
2. **Custom DB tables via `$wpdb`, created with `dbDelta()`** in the activation
   hook — not custom post types for financial/relational data. Table names:
   `{$wpdb->prefix}ims_students`, `ims_payments`, etc.
3. **Every write uses `$wpdb->prepare()`.** No string-concatenated SQL, ever.
4. **Never hard-delete business records.** Add a `deleted_at` column, soft-delete.
5. **Financial rows are immutable.** `ims_payments`, `ims_expenses`,
   `ims_invoices` are insert-only. Corrections are new reversal rows.
6. **Sequence numbers** (receipt, roll, invoice) allocated inside a DB
   transaction with row locking, so two staff submitting at the same moment on
   two desktops never collide.
7. **Custom roles, not `administrator`.** Register `ims_super_admin`,
   `ims_admin`, `ims_accountant`, `ims_front_desk`, `ims_teacher`,
   `ims_read_only` via `add_role()` on activation, each with its own
   capabilities (e.g. `ims_manage_finances`, `ims_manage_users`). Never gate
   plugin features on the WordPress `administrator` role directly — the site's
   WP admin and the institute's IMS Super Admin are not necessarily the same
   person.
8. **Every capability check happens server-side**, in the REST API permission
   callback or AJAX handler — never trust what the JS UI hides.
9. **REST API under a dedicated namespace** (`ims/v1`), authenticated via
   WordPress's own cookie + nonce for logged-in users. No parallel auth system.
10. **Clean activation/deactivation/uninstall.** Deactivate must not delete data.
    Uninstall (via `uninstall.php`) deletes plugin tables and options only after
    an explicit confirmation step — never silently on every deactivate.
11. **No inline secrets.** License-check API URL is fine as a constant; never
    ship a customer's or your own credentials in the plugin code.

## Stack
- Backend: PHP, WordPress Plugin API, `$wpdb`, WP REST API, WP Cron
  (for backups/exports — no real cron access assumed).
- Frontend: React SPA mounted into a WordPress admin page (`add_menu_page`),
  built with `@wordpress/scripts` (wraps Vite/webpack, matches core WP tooling)
  or a plain Vite build enqueued as a script — pick one in the kickoff response.
  Communicates with the `ims/v1` REST namespace using `wp.apiFetch`, which
  handles the nonce automatically.
- Theme: light theme, custom-styled admin page — NOT the default wp-admin look.
  See design brief in Section 6. The plugin should not look like a stock
  WordPress screen; it should look like the standalone app it's replacing.
- PWA: optional, and only meaningful if the customer's own site is accessed
  over HTTPS (required either way for WP). Treat as a later phase.

## Style
- PSR-12-ish PHP. One class per resource under `includes/` (`class-students.php`
  handles the students REST controller and DB access, etc.).
- Every REST response: standard WP REST shape, `WP_REST_Response` with
  `{ ok: bool, data, error: { code, message } }` in the body for consistency
  with error handling on the frontend.
- React: functional components, hooks, one API-calls file per resource.

## When unsure
Ask before inventing. Do not assume server cron is available — use WP Cron
(`wp_schedule_event`) and note that it only fires on site visits unless the
customer sets up a real system cron hitting `wp-cron.php`, which you should
recommend to them in the plugin's own settings screen.


## Front-end app shell rules

- The plugin's primary UI lives at a dedicated front-end URL, not inside
  wp-admin. wp-admin is not part of the staff-facing product.
- That URL renders a bare HTML document (no theme header/footer/sidebar) —
  implemented via `template_include` or a registered page template, not by
  fighting the active theme's markup with CSS overrides.
- Users holding only IMS custom roles (no `edit_posts`, no `manage_options`,
  etc.) must be redirected away from `/wp-admin/` back to the front-end app on
  every admin request — hook `admin_init` (or `current_screen`) and check the
  user's capabilities, allowing only `wp-admin/admin-ajax.php` and
  `wp-admin/admin-post.php` through (some plugin internals may need them).
- Login on the front-end app page uses the plugin's own styled form calling
  `wp_signon()` server-side — never redirect to `wp-login.php`.
- The launch button/shortcode must not appear (or must show a clear "Staff
  Login" state) for anonymous visitors — it should never look like a public
  feature of the institute's website to a random visitor, since it's an
  internal tool.