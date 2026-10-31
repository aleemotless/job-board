// Host-based routing. Caddy forwards the original Host header, so:
//   admin.limitlezz.online/*           -> app/admin/*  (admin dashboard)
//   admin-staging.limitlezz.online/*   -> app/admin/*  (staging admin dashboard)
//   joblezz(-staging).limitlezz.online -> app/*        (user-facing site)
// First DNS label is "admin" or "admin-<env>" (e.g. admin.localhost, admin-staging.example.com).
export function isAdminHost(host: string) {
  const label = host.split(".")[0];
  return label === "admin" || label.startsWith("admin-");
}
