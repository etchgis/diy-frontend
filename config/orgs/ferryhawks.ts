export interface OrgCustomSlide {
  id: string;
  type: string;
  position?: 'prepend' | 'append';
  duration?: number;
  [key: string]: any;
}

export interface OrgConfig {
  orgId: string;
  name: string;
  diyShortcode?: string;
  customSlides: OrgCustomSlide[];
}

export const ferryhawksConfig: OrgConfig = {
  orgId: 'ferryhawks',
  name: 'Staten Island FerryHawks',
  diyShortcode: "BQMHXD", 
  customSlides: [
    {
      id: 'ferryhawks-ferry-schedule',
      type: 'ferryhawks-ferry-schedule',
      position: 'prepend',
      duration: 30,
      title: 'FERRIES FROM ST. GEORGE',
      backgroundColor: '#0D1B2A',
      textColor: '#ffffff',
      siAccentColor: '#F7941D',
      nycAccentColor: '#00A5CE',
      showSIFerry: true,
      showNYCFerry: true,
      maxRows: 4,
    },
    {
      id: 'ferryhawks-watch-party-countdown',
      type: 'ferryhawks-watch-party-countdown',
      position: 'prepend',
      duration: 30,
      eventTime: '2026-06-15T14:00:00-04:00',
      eventTitle: 'FIFA World Cup Watch Party',
      eventSubtitle: 'FerryHawks Stadium',
      teamA: 'USA',
      teamB: 'TBD',
      backgroundColor: '#1a2e4a',
      textColor: '#ffffff',
      accentColor: '#e8b400',
      logoUrl: '/ferryhawks/logo.png',
    },
  ],
};
