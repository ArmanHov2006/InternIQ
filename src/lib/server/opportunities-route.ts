export const resolveDiscoveryScope = (
  request: Request
): "latest_shortlist" | "active_discovered" | null => {
  const scope = new URL(request.url).searchParams.get("discovery_scope");
  return scope === "latest_shortlist" || scope === "active_discovered" ? scope : null;
};
