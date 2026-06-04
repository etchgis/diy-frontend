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
      backgroundColor: '#343E48',
      textColor: '#ffffff',
      siAccentColor: '#F7941D',
      nycAccentColor: '#94B6E5',
      showSIFerry: true,
      showNYCFerry: true,
      maxRows: 4,
    },
    {
      id: 'ferryhawks-sir-schedule',
      type: 'ferryhawks-sir-schedule',
      position: 'prepend',
      duration: 20,
      title: 'STATEN ISLAND RAILWAY',
      backgroundColor: '#343E48',
      textColor: '#ffffff',
      accentColor: '#94B6E5',
      maxRows: 5,
    },
    {
      id: 'ferryhawks-watch-party-countdown',
      type: 'ferryhawks-watch-party-countdown',
      position: 'prepend',
      duration: 30,
      eventTime: '2026-06-29T00:00:00-04:00',
      backgroundColor: '#343E48',
      textColor: '#ffffff',
      accentColor: '#d9782d',
    },
  ],
};
