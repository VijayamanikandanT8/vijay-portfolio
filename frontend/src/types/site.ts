export interface SiteInfo {
  siteName: string;
  name: string;
  nickname: string;
  heroTag: string;
  heroDescription: string;
  subhead: string;
  email: string;
  location: string;
  availability: string;
  heroWave: string;
  heroIntroLabel: string;
  roleHighlight: string;
  roleSuffix: string;
  badgeStackLine: string;
  badgeRoleLine: string;
  buildingNote: string;
  taglineSmall: string;
  taglineBig: string;
}

export interface TechItem {
  label: string;
  icon: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarInfo {
  logoLeft: string;
  logoText: string;
  logoRight: string;
  links: NavLink[];
  statusText: string;
}

export interface AboutHighlight {
  icon: string;
  label: string;
}

export interface AboutStat {
  value: number;
  suffix: string;
  label: string;
}

export interface AboutInfo {
  eyebrow: string;
  headingLead: string;
  headingHighlight: string;
  paragraphs: string[];
  highlights: AboutHighlight[];
  stats: AboutStat[];
  monogram: string;
  orbitLabels: string[];
  quote: string;
}

export interface SiteData {
  site: SiteInfo;
  navbar: NavbarInfo;
  techStack: TechItem[];
  floatingCards: string[];
  bootLines: string[];
  about: AboutInfo;
}
