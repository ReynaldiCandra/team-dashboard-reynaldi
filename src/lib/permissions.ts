// Single source of truth untuk role-based feature access (mobile & desktop)

export const ROLE_ALLOWED: Record<string, string[]> = {
  head_manager: ["home","leads","wa","schedule","profile","leaderboard","reports","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report","goals","activity"],
  manager:      ["home","leads","wa","schedule","profile","leaderboard","reports","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report"],
  staff:        ["home","leads","wa","schedule","profile","kpi","tasks","broadcast","promo","guide","ai-marketing","daily-report"],
};

export function getAllowedTabs(role: string): string[] {
  return ROLE_ALLOWED[role] ?? ROLE_ALLOWED.staff;
}

export function canAccessTab(role: string, tab: string): boolean {
  return getAllowedTabs(role).includes(tab);
}
