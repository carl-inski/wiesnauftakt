export function basisUrl(): string {
  const explizit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explizit) return explizit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const verwaltungsUrl = (token: string) => `${basisUrl()}/reservierung/${token}`;
export const tischUrl = (tischId: string) => `${basisUrl()}/tisch/${tischId}`;
