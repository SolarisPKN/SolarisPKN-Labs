// src/data/projects.ts
export interface Project {
  id: string;                // slug (ej. "cloud-infrastructure")
  type: 'software' | 'infrastructure' | 'network' | 'automation' | 'hardware' | 'game';
  status: 'operational' | 'online' | 'tracking' | 'development' | 'maintenance';
  technologies: string[];
  metrics: {
    label: string;           // Se traducirá con i18n en el componente
    value: string | number;
    icon?: string;
  }[];
  links?: {
    github?: string;
    docs?: string;
    live?: string;
  };
  details?: {
    architecture?: string;
    features?: string[];
    uptime?: string;
    lastUpdated?: string;
  };
  // Campos bilingües
  name: {
    es: string;
    en: string;
  };
  shortDescription: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
}

export const projects: Project[] = [
  {
    id: 'cloud-infrastructure',
    type: 'infrastructure',
    status: 'operational',
    name: {
      es: 'Infraestructura Cloud SolarisPKN',
      en: 'SolarisPKN Cloud Infrastructure',
    },
    shortDescription: {
      es: 'Infraestructura basada en Cloudflare para SolarisPKN Labs.',
      en: 'Cloudflare-powered infrastructure for SolarisPKN Labs.',
    },
    description: {
      es: 'Infraestructura completa basada en Cloudflare que soporta todos los servicios de SolarisPKN Labs, incluyendo DNS, TLS, DNSSEC, y optimización de rendimiento.',
      en: 'Complete Cloudflare-based infrastructure supporting all SolarisPKN Labs services, including DNS, TLS, DNSSEC, and performance optimization.',
    },
    technologies: ['Cloudflare', 'DNS', 'TLS 1.3', 'DNSSEC', 'Astro', 'Cloudflare Pages'],
    metrics: [
      { label: 'Requests', value: '12.4K', icon: '🌐' },
      { label: 'Response', value: '142ms', icon: '⚡' },
      { label: 'Availability', value: '99.9%', icon: '🛡' },
    ],
    links: {
      live: 'https://labs.solarispkn.com.ar',
      docs: 'https://labs.solarispkn.com.ar/arquitectura',
    },
    details: {
      architecture: 'Distributed edge network with Cloudflare Workers and Pages.',
      features: ['Global CDN', 'Automatic SSL', 'DDoS Protection', 'Load Balancing'],
      uptime: '99.99%',
      lastUpdated: '2026-07-20',
    },
  },
  {
    id: 'minecraft-server',
    type: 'game',
    status: 'online',
    name: {
      es: 'Servidor Minecraft Moddeado',
      en: 'Minecraft Modded Server',
    },
    shortDescription: {
      es: 'Servidor Minecraft con más de 350 mods.',
      en: 'A heavily modded Minecraft server.',
    },
    description: {
      es: 'Servidor Minecraft con más de 350 mods, optimizado para rendimiento y estabilidad en un entorno Docker con Linux.',
      en: 'Minecraft server with over 350 mods, optimized for performance and stability in a Dockerized Linux environment.',
    },
    technologies: ['Linux', 'Java', 'Docker', 'Networking', 'Modded'],
    metrics: [
      { label: 'Players', value: '4', icon: '👥' },
      { label: 'Mods', value: '350+', icon: '🧩' },
      { label: 'TPS', value: '20', icon: '⚡' },
      { label: 'Memory', value: '9.2GB', icon: '🧠' },
    ],
    links: {
      github: 'https://github.com/SolarisPKN/minecraft-server',
    },
    details: {
      architecture: 'Dockerized Java server with custom network bridge.',
      features: ['Automated backups', 'Whitelist management', 'Performance monitoring'],
      uptime: '99.8%',
      lastUpdated: '2026-07-20',
    },
  },
  // Agregá más proyectos...
];