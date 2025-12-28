//Helper to wrap path data in a standard 16x16 SVG container
const wrap = (content: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    ${content}
</svg>`;

export const ICONS = {
    cpu: (color: string) => wrap(`
        <rect x="4" y="4" width="8" height="8" fill="none" stroke="${color}" stroke-width="1.5" rx="1"/>
        <rect x="6" y="6" width="4" height="4" fill="${color}"/>
        <line x1="2" y1="5" x2="4" y2="5" stroke="${color}" stroke-width="1"/>
        <line x1="2" y1="8" x2="4" y2="8" stroke="${color}" stroke-width="1"/>
        <line x1="2" y1="11" x2="4" y2="11" stroke="${color}" stroke-width="1"/>
        <line x1="12" y1="5" x2="14" y2="5" stroke="${color}" stroke-width="1"/>
        <line x1="12" y1="8" x2="14" y2="8" stroke="${color}" stroke-width="1"/>
        <line x1="12" y1="11" x2="14" y2="11" stroke="${color}" stroke-width="1"/>
        <line x1="5" y1="2" x2="5" y2="4" stroke="${color}" stroke-width="1"/>
        <line x1="8" y1="2" x2="8" y2="4" stroke="${color}" stroke-width="1"/>
        <line x1="11" y1="2" x2="11" y2="4" stroke="${color}" stroke-width="1"/>
        <line x1="5" y1="12" x2="5" y2="14" stroke="${color}" stroke-width="1"/>
        <line x1="8" y1="12" x2="8" y2="14" stroke="${color}" stroke-width="1"/>
        <line x1="11" y1="12" x2="11" y2="14" stroke="${color}" stroke-width="1"/>
    `),
    gpu: (color: string) => wrap(`
        <rect x="3" y="5" width="10" height="6" fill="none" stroke="${color}" stroke-width="1.5" rx="0.5"/>
        <rect x="5" y="7" width="2" height="2" fill="${color}"/>
        <rect x="9" y="7" width="2" height="2" fill="${color}"/>
        <line x1="1" y1="6" x2="3" y2="6" stroke="${color}" stroke-width="1"/>
        <line x1="1" y1="8" x2="3" y2="8" stroke="${color}" stroke-width="1"/>
        <line x1="1" y1="10" x2="3" y2="10" stroke="${color}" stroke-width="1"/>
        <rect x="13" y="7" width="2" height="2" fill="${color}"/>
        <path d="M 5 11 L 5 13 L 11 13 L 11 11" stroke="${color}" stroke-width="1" fill="none"/>
        <line x1="7" y1="13" x2="7" y2="14" stroke="${color}" stroke-width="1"/>
        <line x1="9" y1="13" x2="9" y2="14" stroke="${color}" stroke-width="1"/>
    `),
    ram: (color: string) => wrap(`
        <rect x="2" y="5" width="12" height="7" fill="none" stroke="${color}" stroke-width="1.5" rx="0.5"/>
        <rect x="4" y="7" width="1.5" height="3" fill="${color}"/>
        <rect x="7.25" y="7" width="1.5" height="3" fill="${color}"/>
        <rect x="10.5" y="7" width="1.5" height="3" fill="${color}"/>
        <line x1="3" y1="12" x2="3" y2="13" stroke="${color}" stroke-width="1"/>
        <line x1="13" y1="12" x2="13" y2="13" stroke="${color}" stroke-width="1"/>
        <line x1="6" y1="12" x2="6" y2="13" stroke="${color}" stroke-width="1"/>
        <line x1="10" y1="12" x2="10" y2="13" stroke="${color}" stroke-width="1"/>
        <line x1="4" y1="3" x2="4" y2="5" stroke="${color}" stroke-width="1"/>
        <line x1="8" y1="3" x2="8" y2="5" stroke="${color}" stroke-width="1"/>
        <line x1="12" y1="3" x2="12" y2="5" stroke="${color}" stroke-width="1"/>
    `),
    storage: (color: string) => wrap(`
        <ellipse cx="8" cy="4" rx="5" ry="2" fill="none" stroke="${color}" stroke-width="1.5"/>
        <path d="M 3 4 L 3 12 C 3 13.1 5.2 14 8 14 C 10.8 14 13 13.1 13 12 L 13 4" fill="none" stroke="${color}" stroke-width="1.5"/>
        <ellipse cx="8" cy="8" rx="5" ry="1.5" fill="none" stroke="${color}" stroke-width="1"/>
        <ellipse cx="8" cy="12" rx="5" ry="2" fill="${color}" opacity="0.3"/>
        <circle cx="11" cy="6" r="0.8" fill="${color}"/>
        <circle cx="11" cy="10" r="0.8" fill="${color}"/>
    `),
    temp: (color: string) => wrap(`
        <path d="M 7 2 L 7 9 C 5.5 9.5 5 10.5 5 11.5 C 5 13 6.3 14 8 14 C 9.7 14 11 13 11 11.5 C 11 10.5 10.5 9.5 9 9 L 9 2 Z" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8" cy="11.5" r="2" fill="${color}"/>
        <line x1="8" y1="9" x2="8" y2="4" stroke="${color}" stroke-width="2"/>
        <line x1="10" y1="4" x2="10.5" y2="4" stroke="${color}" stroke-width="0.8"/>
        <line x1="10" y1="6" x2="10.5" y2="6" stroke="${color}" stroke-width="0.8"/>
        <line x1="10" y1="8" x2="10.5" y2="8" stroke="${color}" stroke-width="0.8"/>
    `),
};