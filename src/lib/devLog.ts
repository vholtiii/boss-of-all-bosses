/**
 * Dev-only logging. No-ops in production builds so shipped consoles stay clean
 * while local debugging keeps the same breadcrumbs.
 */
const isDev = (() => {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
})();

export function devLog(...args: unknown[]): void {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}
