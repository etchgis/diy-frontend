import { ferryhawksConfig, OrgConfig } from '@/config/orgs/ferryhawks';

const ORG_REGISTRY: Record<string, OrgConfig> = {
  ferryhawks: ferryhawksConfig,
};

export function getOrgConfig(shortcode: string): OrgConfig | null {
  return ORG_REGISTRY[shortcode] ?? null;
}

export function getOrgConfigByDiyShortcode(diyShortcode: string): OrgConfig | null {
  return Object.values(ORG_REGISTRY).find((c) => c.diyShortcode === diyShortcode) ?? null;
}

export function getAllOrgSlideIds(): Set<string> {
  const ids = new Set<string>();
  for (const config of Object.values(ORG_REGISTRY)) {
    for (const slide of config.customSlides) {
      ids.add(slide.id);
    }
  }
  return ids;
}
