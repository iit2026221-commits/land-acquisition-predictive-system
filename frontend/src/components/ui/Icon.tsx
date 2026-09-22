type IconName = 'grid' | 'folder' | 'map' | 'layers' | 'chart' | 'shield' | 'bell' | 'database' | 'users' | 'clipboard' | 'settings' | 'search' | 'sun' | 'moon' | 'menu' | 'close' | 'arrow' | 'trend' | 'alert' | 'activity' | 'chevron'

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    folder: 'M3 6h7l2 2h9v10H3z',
    map: 'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
    chart: 'M4 19V5M4 19h17M8 16v-4M12 16V8M16 16v-6M20 16v-9',
    shield: 'M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    database: 'M4 6c0-2 4-3 8-3s8 1 8 3-4 3-8 3-8-1-8-3zM4 6v6c0 2 4 3 8 3s8-1 8-3V6M4 12v6c0 2 4 3 8 3s8-1 8-3v-6',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    clipboard: 'M9 5h6M9 3h6v4H9zM5 5H3v16h18V5h-2M7 11h10M7 15h7',
    settings: 'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.7 1.7 0 000 2.4l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 00-2.4 0 1.7 1.7 0 00-.5 1.2v.3h-3v-.3a1.7 1.7 0 00-2.9-1.2 1.7 1.7 0 00-2.4 0l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 000-2.4 1.7 1.7 0 00-1.2-.5h-.3v-3h.3a1.7 1.7 0 001.2-2.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 002.4 0 1.7 1.7 0 00.5-1.2V3h3v.3a1.7 1.7 0 002.9 1.2 1.7 1.7 0 002.4 0l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 000 2.4 1.7 1.7 0 001.2.5h.3v3h-.3a1.7 1.7 0 00-1.2 2.5z',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
    sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    moon: 'M20 15.2A8 8 0 018.8 4 8 8 0 1020 15.2z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'M6 6l12 12M18 6L6 18',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    trend: 'M4 16l5-5 4 3 7-8M15 6h5v5',
    alert: 'M12 3l9 17H3zM12 9v4M12 17h.01',
    activity: 'M3 12h4l2-6 4 12 2-6h6',
    chevron: 'M9 18l6-6-6-6',
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}
