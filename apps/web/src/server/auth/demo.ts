import "server-only";

/**
 * Demo sign-in signs in as the seeded Northwind owner with a known password. It exists
 * for local development, CI and preview deploys of seeded databases. Never set
 * DEMO_SIGN_IN on production.
 */
export function demoSignInEnabled(): boolean {
  return process.env.DEMO_SIGN_IN === "true";
}
