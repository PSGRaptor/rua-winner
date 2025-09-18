// packages/core/src/heatmap.ts
export type HeatmapMode = 'Player' | 'DataScientist';

/**
 * Map a normalized value [0..1] to an rgba() color string
 * - Player mode:   Red(cold) -> Green(hot)
 * - DataScientist: Blue(cold) -> Red(hot)
 */
export function mapHeatColor(value: number, mode: HeatmapMode = 'Player'): string {
    const v = Math.max(0, Math.min(1, value));
    if (mode === 'DataScientist') {
        // #2B6CB0 (blue) -> #E53E3E (red)
        const a = hex('#2B6CB0'), b = hex('#E53E3E');
        return rgba(lerp(a, b, v));
    }
    // Player: #E53E3E (red) -> #38A169 (green)
    const a = hex('#E53E3E'), b = hex('#38A169');
    return rgba(lerp(a, b, v));
}

function hex(h: string) {
    const c = h.replace('#', '');
    return {
        r: parseInt(c.slice(0, 2), 16),
        g: parseInt(c.slice(2, 4), 16),
        b: parseInt(c.slice(4, 6), 16),
        a: 255,
    };
}

function lerp(a: { r: number; g: number; b: number; a: number }, b: { r: number; g: number; b: number; a: number }, t: number) {
    const L = (x: number, y: number) => Math.round(x + (y - x) * t);
    return { r: L(a.r, b.r), g: L(a.g, b.g), b: L(a.b, b.b), a: L(a.a, b.a) };
}

function rgba(c: { r: number; g: number; b: number; a: number }) {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
}
