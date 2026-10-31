<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI: always use shadcn/ui + the global theme

This project's UI is built on **shadcn/ui** (Radix base, `radix-nova` style — see `components.json`) themed by **`app/globals.css`** (Neo-Brutalist design system). Follow these rules for every UI change:

### Components
- **Reach for shadcn first.** Before writing a button, input, dialog, dropdown, card, table, badge, nav, etc., check `components/ui/`. If it is not there, add it: `npx shadcn@latest add <component>` (browse https://ui.shadcn.com/docs/components). Do not hand-roll a component shadcn already provides, and do not add another UI library.
- **Compose, don't fork.** Build feature components (e.g. `components/site-navbar.tsx`) out of `components/ui/*` primitives. Customize with `className` and, for reusable looks, by adding a variant to the component's `cva` config — not by copying the component.
- **Links that look like buttons/nav items** use `asChild` with `next/link`: `<Button asChild><Link href="/jobs">Jobs</Link></Button>`. Never nest `<a>` inside `<button>`.
- Merge classes with `cn` (`import { cn } from "cn"`), never string concatenation.
- Icons come from `lucide-react`.

### Styling
- **Only use theme tokens from `app/globals.css`.** Prefer semantic shadcn tokens: `bg-background`, `text-foreground`, `bg-card`, `bg-primary`/`text-primary-foreground`, `bg-secondary`, `bg-accent`, `bg-muted`/`text-muted-foreground`, `bg-destructive`, `border-border`, `ring-ring`. Brand tokens (`ink`, `paper`, `yellow`, `cobalt`, `green`, `pink`) are allowed only when no semantic token fits.
- **No raw Tailwind palette colors or hex values** (`bg-white`, `text-zinc-600`, `bg-blue-500`, `#fff`, …). If a color is missing, add a token to `globals.css` (`:root` + `@theme inline`) instead.
- Use the design-system utilities defined in `globals.css`: `brutal-box`, `brutal-hover`, `shadow-brutal{-sm,,-lg,-xl}`, `label-caps`, `grid-paper`, and fonts `font-display` / `font-sans` / `font-mono`.

### Don't break the theme
- **Never run `npx shadcn init` again** — it overwrites `app/globals.css` with stock neutral tokens. `shadcn add` is safe; after adding a component, confirm `git diff app/globals.css` is empty.
- Don't edit generated files in `components/ui/` for one-off tweaks; pass `className` instead. Edit them only for project-wide changes (e.g. a new size variant).

## Engineering standards (React / Next.js)

Prefer simple, explicit, idiomatic React and Next.js over clever abstractions. Optimize for the next developer reading the code. Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

### Starting a feature
- **Every new feature starts on its own branch.** Before changing any code, create one from the latest app code: `git switch -c feat/<short-name>` (e.g. `feat/mongodb-connection`). Never build a feature directly on `main` or on another feature's branch.

### Architecture: n-tier (handler → service → data)
All server-side logic is split into three layers. Each layer calls only the layer directly below it: never upward, never skipping one.

| Layer | Lives in | Owns | Must not |
|---|---|---|---|
| **Handler** | `page.tsx`, `*-loader.tsx`, `actions.ts`, `app/api/**/route.ts` | Reading the request (`params`, `searchParams`, `FormData`), input parsing via `lib/validation/*`, calling a service, mapping the result to a response (props for a view, `useActionState` state, `notFound()`, `redirect()`, HTTP status/headers), and `updateTag(...)` after mutations | Contain business rules, import `lib/data/*`, or touch `store` |
| **Service** | `lib/services/*` (one file per domain: `jobs.ts`, `applications.ts`, `candidates.ts`, `dashboard.ts`) | Business rules (e.g. "only open jobs accept applications"), orchestration across several data calls, and derived data (stats, counts, grouping, filtering, limits) | Know about HTTP or Next.js request APIs (`FormData`, `next/navigation`, `next/headers`, `Response`), import React, or touch `store` directly |
| **Data** | `lib/data/*` | Persistence only: CRUD and queries (including joins and default ordering) against `store` (later a real database), mapping storage rows to domain types from `types/`, and `"use cache"` + `cacheTag(...)` on reads | Contain business rules or call services |

- **Dependency direction:** handler → service → data. Views (`_components/*`, `components/*`) belong to none of these layers and import none of them.
- **Services take and return typed domain values** (`JobInput`, `Job`, …), never `FormData` or framework objects, so they can be called from any handler and unit-tested without Next.js.
- **Expected failures are return values, not exceptions.** A service returns a discriminated result (e.g. `{ ok: false, reason: "job-closed" }`) that the handler maps to form state, `notFound()` or an HTTP status. Throw only for genuinely unexpected errors.
- **Validation is split by kind:** input shape (required fields, lengths, file type) is parsed in the handler with `lib/validation/*`; rules that depend on stored state (job is open, status transition allowed) live in the service.
- **Caching:** reads are cached and tagged in the data layer. A service may add `"use cache"` + `cacheTag(...)` for an expensive derived result. Invalidation (`updateTag`) stays in the handler, since it only runs inside Server Actions.
- **Thin pass-throughs are fine.** If a service function only forwards to the data layer today, keep it anyway so handlers have a single entry point and rules have an obvious home later.
- Examples: `lib/services/jobs.ts` (`getOpenJob` hides closed jobs from the public site, `submitJob` saves public posts as closed), `lib/services/applications.ts` (`applyToJob` returns `{ ok: false, reason: "job-closed" }`), `lib/services/dashboard.ts` and `candidates.ts` (derived data).

### Structure
- Routes live in route groups: `app/(site)/*` (public site) and `app/(admin)/admin/*` (dashboard; reached via the admin subdomain, see `proxy.ts`).
- Feature-specific components sit next to their feature's route and `actions.ts` in a `_components/` folder (e.g. `app/(admin)/admin/jobs/_components/jobs-table.tsx` imports `../actions`). Components shared by several features of one route group go in that group's top `_components/` (e.g. `app/(admin)/admin/_components/status-badge.tsx`). Shared app components go in `components/`, shadcn primitives in `components/ui/`.
- **Naming:** files are kebab-case and named after their main export (`jobs-table.tsx` → `JobsTable`). Forms end in `-form` (`JobForm`, `ApplyForm`), fetchers in `-loader` (`EditJobLoader`). Server Actions are `verbNounAction` (`createJobAction`, `updateApplicationStatusAction`) and wrap the service function of the same name.
- **Pages and layouts define no components.** A `page.tsx`/`layout.tsx` only composes imported components; even a page-only helper (e.g. the async child rendered inside `<Suspense>`) gets its own file in `_components/`.
- **Validation uses zod.** Schemas live in `lib/schemas/*` (one file per domain); messages and limits come from `lib/config.ts`. Form parsing shared by several Server Actions lives in `lib/validation/*` (e.g. `parseJobForm`, used by both the admin and the public post-job actions): it builds an object from `FormData` (`formTextValues`), calls `schema.safeParse(...)`, and maps a failure to form state with `firstFieldErrors`. Always `safeParse`, never `parse`: invalid input is an expected result, not an exception. A single value is checked the same way, e.g. `applicationStatusSchema.safeParse(formData.get("status"))`.
- Handlers (pages, loaders, actions, route handlers) call `lib/services/*` only; services call `lib/data/*`; only `lib/data/*` touches `store`. See **Architecture** above. Keep data-layer signatures stable so the mock store can be swapped for a real database.
- Keep files and components small and single-purpose. Don't add a hook, util or component without a clear second use or clarity gain.

### Next.js (16, App Router, `cacheComponents` on)
- Read `node_modules/next/dist/docs/` before using an API. This version differs from older Next.js.
- **Server Components by default.** A component is a client component only when it needs state, effects, event handlers, context, or browser-only hooks (`useActionState`, `useFormStatus`, `usePathname`, …).
- **Client components are small leaves in `*.client.tsx` files** (every `"use client"` file has the suffix, and nothing else does). Server Components render them and pass server-rendered markup in as `children` or props, so the client bundle holds only the interactive part. Examples:
  - `components/form/action-form.client.tsx` holds `useActionState`; `JobForm` and `ApplyForm` are Server Components that render the card, headings, buttons and success message around it.
  - `components/layout/nav-link.client.tsx` and `sidebar-nav-link.client.tsx` read the active path (shared `useIsNavItemActive`); the menus around them (`nav-links.tsx`, `sidebar-nav.tsx`, `app-header.tsx`, `admin-sidebar.tsx`) render on the server.
- Never mark a whole view `"use client"` for one interactive piece; split that piece out instead. Props crossing into a client component must be serializable (data, Server Actions, JSX), never plain functions.
- Reads in `lib/data/*` (and expensive derived reads in `lib/services/*`) use `"use cache"` + `cacheTag(...)`. Every mutation's Server Action must call `updateTag(...)` for each tag it affects.
- Dynamic pages stay non-async and await `params` inside a `<Suspense>` child so the shell prerenders. Type pages with the generated `PageProps<"/route">` / `LayoutProps<"/route">`.
- Server Actions live in a colocated `actions.ts` with `"use server"`. Treat every `FormData` value as untrusted: parse and validate it on the server, return field errors via `useActionState` state, and never trust client-side checks.
- **Auth:** Server Actions are reachable as public POST endpoints from any host, so `proxy.ts` is routing, not security. `proxy.ts` blocks the admin host for anyone whose session JWT doesn't carry the `admin` role, but that only guards page requests. So every Server Action except sign-up/sign-in/sign-out starts with `await requireUser()` (`lib/auth.ts`), which redirects signed-out users to the sign-in page, and every admin action with `await requireAdmin()`. A user is an admin when their `role` in the `users` collection is `admin`.
- Use built-ins: `next/link`, `next/image`, `next/font`, the `metadata` export, and `loading`/`error`/`not-found` conventions. Never import secrets or server-only modules into Client Components.

### Forms
- Build forms from `components/form/*`: a Server Component renders `<ActionForm action={…} initialState={{}} initialValues={…} success={…}>` (the client part that owns `useActionState`) around `FormTextField`, `FormFileField`, `FormSelectField`, `FormError` and `FormSubmitButton`, placing its own `FieldGroup`/cards. A new control type gets a `FormXField` built on `FormField` + `useFormField` (label, hint, error and aria wiring), not its own copy. See `components/job-form.tsx` and `app/(site)/jobs/_components/apply-form.tsx`.
- **Every form goes through `ActionForm` (`useActionState`)**, including single-button forms (`ActionButton`) and the status buttons. Each Server Action returns its state: field errors (`errors`), a form-level `formError` (rendered by `<FormError />`, which every form includes), and the typed `values` to re-fill. Expected failures such as a record deleted meanwhile return `formError`; they never redirect silently or throw.
- **Live field errors:** pass `schema="<name>"` (a key of `FORM_SCHEMAS` in `lib/schemas/forms.ts`) to `ActionForm`. `useLiveValidation` re-runs that zod schema in the browser on blur, on change once a field shows an error, and on submit (blocking it while invalid). Errors appear in the same `FormField` slot as server errors and are linked to the control with `aria-describedby`. A new form's schema gets added to `FORM_SCHEMAS`.
- Validate every field again in the Server Action (`lib/validation/*`). Live validation, `accept`, `type="email"` and similar attributes are only UX.
- File uploads: check size and an extension allowlist on the server, and store/serve the content type *we* pick for that extension, never the browser-reported one. Serve user files from route handlers as `attachment` with `X-Content-Type-Options: nosniff`. The Server Action body limit is set in `next.config.ts` (`experimental.serverActions.bodySizeLimit`).

### Reusable components
Check here before writing markup; extend a component (a prop or a `cva` variant) instead of copying it.
- `components/ui/*`: shadcn primitives.
- `components/layout/*`: `AppHeader` (public site top bar), `SidebarNav` (server) + `SidebarNavLink` (client) for the admin sidebar (shadcn `Sidebar`, composed in `app/(admin)/_components/admin-sidebar.tsx`), `BrandLogo`, `Container` / `PageContainer` (the only place the page width and gutters are defined), `SiteFooter`, `NavLinks` (server) + `NavLink` (client), `ActivePathProvider` (client).
- `components/common/*`: `SectionHeader` (eyebrow, title, description, action; `level` 1 for the page `<h1>`, 2 for sections), `ButtonLink` (every link styled as a button), `BackLink`, `ActionButton` (single-button Server Action form, e.g. Delete), `DataTable` (column config plus `TwoLineCell`), `LabeledSection`, `MessageCard` (confirmations), `Notice` (empty and loading text).
- `components/form/*` (client leaves + `ActionForm`): see **Forms**. `components/job-form.tsx` is the shared admin/public job form.
- Feature views live next to their routes in `_components/` and compose the above, e.g. `JobList` (`layout="list" | "grid"`), `JobCard`, `StatusBadge`.
- A component's props type sits in the component's own file. Only types shared by several files go in `types/ui.ts` (generic UI) or `types/components.ts` (features).

### Configuration
- **Every tunable constant lives in `lib/config.ts`**: brand strings (`SITE`), nav items and `ADMIN_BASE_PATH`, page sizes, cache tags, status lists, validation limits, CV upload rules and the Server Action body limit. Don't declare module-level constants elsewhere; add them there and import them.
- Exceptions (they must stay put or aren't configuration): each page's `export const metadata`, `proxy.ts`'s `config.matcher`, `next/font` instances, React contexts, the mock `store`, and component-internal Tailwind class maps / `DataTable` column definitions.
- `lib/config.ts` is imported by `next.config.ts`, so it uses relative imports for runtime values.

### Separate data fetching from rendering
- **Service and data layers (`lib/services/*`, `lib/data/*`):** derived data (counts, stats, grouping, filtering, limits) lives in services; raw reads live in the data layer as cached, tagged functions. Cache tags live in `lib/config.ts`.
- **Fetchers: pages and `*-loader.tsx`** (handler layer). A static route's `page.tsx` is `async`, awaits a `lib/services` function and passes the result to views. On dynamic routes the page stays sync and renders `<XLoader params={params} />` inside `<Suspense>`. The loader awaits params, fetches, calls `notFound()` and renders the view. Fetchers contain no markup beyond composing views.
- **Views (`_components/*`, `components/*`):** plain synchronous components that render only their props. They never import `lib/services` or `lib/data`, or await anything. They may call pure display helpers from `lib/format/*` (e.g. `formatDate`, `formatCompanyLocation`) and bind Server Actions to forms. Anything that filters, counts, groups, sorts or parses stored data (e.g. splitting `requirements` into `requirementList` in `getOpenJob`) belongs in a service, which returns it ready to render; views only turn it into display text (labels, plurals, dates).
- Every view handles its own empty state, so a fetcher can hand it an empty list.
- Pages and views are built from shared components, never hand-written chrome. A `page.tsx` contains no raw HTML elements. See **Reusable components** below.

### Data flow: context, not prop drilling
- **Never forward props through a component that doesn't use them.** Props go directly from the component that owns the data to the one that consumes it (one level). If it would take more, use one of these:
- **Client trees: context + provider.** Put shared client state in a context with a typed `useX()` hook that throws outside its provider. See `components/form/action-form.client.tsx` (provides a form's `useActionState` errors/values; every field reads its own via `useFormField`) and `components/layout/active-path.client.tsx` (`ActivePathProvider` supplies the pathname to `NavLinks`). For a form's pending state use `useFormStatus` (`FormSubmitButton`), not context. Render with `<XContext value={…}>` (React 19), and keep the provider as low in the tree as possible.
- **Server trees: loader → view.** Server Components can't read context. The page or `*-loader.tsx` that fetches passes the data straight to the view that renders it (one level, see below). If a view nested deeper needs data, give it its own loader instead of threading props. `"use cache"` dedupes repeated reads.
- **Don't** wrap app-wide providers around the root layout for page-local state, and don't move ordinary single-consumer props into context.

### TypeScript
- `strict` is on. No `any`, no `as` casts on untrusted input. Narrow untrusted input with a zod schema's `safeParse` (e.g. `applicationStatusSchema` in `lib/schemas/application.ts`).
- **Domain types are inferred from zod schemas.** Each `types/<domain>.ts` exports `type X = z.infer<typeof xSchema>` from `lib/schemas/<domain>.ts` (with `import type`), so the runtime check and the type can't drift. Never hand-write a domain type that a schema could describe: add or extend a schema and infer it. Only UI and prop types zod can't describe (`ReactNode`, cva variants, form state) are written by hand.
- **Domain and shared types live in `types/`** (one file per domain: `job.ts`, `application.ts`, `candidate.ts`, `dashboard.ts`, `navigation.ts`, `components.ts`, `store.ts`, `ui.ts`), re-exported from `types/index.ts`. Import them with `import type { … } from "@/types"`. A type used by only one file (e.g. a component's props) is declared in that file as `type XProps = { … }` above the component. Move it to `types/` once a second file needs it. Built-in Next types (`PageProps`, `LayoutProps`, `Metadata`) are used directly.
- Status unions come from `as const` arrays in `lib/config.ts` (e.g. `APPLICATION_STATUSES`) wrapped in `z.enum(...)` in `lib/schemas/*`; the type is inferred from that schema.
- Handle `undefined` results explicitly (`notFound()`, empty states).

### UI states & accessibility
- Every data view handles loading (Suspense fallback), empty, error and success states.
- Use semantic HTML (`main`, `header`, `nav`, `section`, one `h1` per page) and shadcn `Field`/`FieldLabel`/`FieldError` for forms, with `aria-invalid` on invalid controls.
- Lists use stable keys (ids, not indexes).

### Before you finish
Run `npx tsc --noEmit`, `npm run lint` and `npm run build`, and fix anything your change introduced. Make focused changes, preserve existing behavior unless asked, and summarize decisions and open issues.
