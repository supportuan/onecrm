/** Login + app appearance themes (switchable). */

export const LOGIN_BG_THEMES = [
  {
    id: 'brand',
    label: 'Brand',
    ui: 'light',
    /** Royal blue + crimson + white — ONECRM / ApplyUniNow logo palette */
    base: '#eaf2fc',
    highlight: '#fcfcfc',
    secondary: '#134790',
    noiseScale: 5.8,
    speed: 0.09,
    distortion: 0.05,
    gloss: 0.42,
    grain: 0.055,
    bloom: 0.24,
    vignette: 0.26,
    accentGradient: 'linear-gradient(105deg, #2a5fb3 0%, #134790 52%, #072f6d 100%)',
    fluidColor: '#072f6d',
    fluidRainbow: true,
    fallbackGradient:
      'radial-gradient(ellipse 48% 72% at 18% 32%, rgba(19, 71, 144, 0.55) 0%, transparent 60%), radial-gradient(ellipse 38% 55% at 78% 28%, rgba(78, 127, 204, 0.38) 0%, transparent 58%), radial-gradient(ellipse 42% 50% at 72% 78%, rgba(213, 11, 28, 0.22) 0%, transparent 55%), linear-gradient(165deg, #fcfcfc 0%, #eaf2fc 48%, #d2e2f7 100%)',
    swatch: 'linear-gradient(135deg, #134790, #0b3987 55%, #d50b1c)',
    logoBox: '#eaf2fc',
    app: {
      brand: '#134790',
      brandHover: '#0b3987',
      brandSoft: '#eaf2fc',
      brandPage: '#f8fafc',
      brandAccent: '#d50b1c',
      brandAccentHover: '#b2101a',
      wavePrimary: '#134790',
      waveSecondary: '#4e7fcc',
      accentGradient: 'linear-gradient(105deg, #2a5fb3 0%, #134790 52%, #072f6d 100%)',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    ui: 'light',
    base: '#ebe6ff',
    highlight: '#f5f0ff',
    secondary: '#7357e8',
    noiseScale: 5.2,
    speed: 0.12,
    distortion: 0.06,
    gloss: 0.55,
    grain: 0.04,
    bloom: 0.35,
    vignette: 0.28,
    accentGradient: 'linear-gradient(105deg, #1677ff 0%, #7357e8 52%, #d946ef 100%)',
    fluidColor: '#4c1d95',
    fluidRainbow: true,
    fallbackGradient:
      'radial-gradient(ellipse 45% 70% at 22% 35%, rgba(91, 140, 255, 0.55) 0%, transparent 60%), radial-gradient(ellipse 40% 65% at 52% 40%, rgba(139, 108, 240, 0.5) 0%, transparent 58%), radial-gradient(ellipse 42% 68% at 78% 32%, rgba(232, 121, 249, 0.42) 0%, transparent 55%), linear-gradient(180deg, #f5f0ff 0%, #ebe6ff 55%, #e8e0ff 100%)',
    swatch: 'linear-gradient(135deg, #1677ff, #7357e8 50%, #d946ef)',
    logoBox: '#eee8ff',
    /** App chrome tokens applied via CSS variables */
    app: {
      brand: '#5b5ce2',
      brandHover: '#7c3aed',
      brandSoft: '#f0efff',
      brandPage: '#f7f8fd',
      brandAccent: '#e31837',
      brandAccentHover: '#c4142f',
      wavePrimary: '#7357e8',
      waveSecondary: '#1677ff',
      accentGradient: 'linear-gradient(105deg, #1677ff 0%, #7357e8 52%, #d946ef 100%)',
    },
  },
  {
    id: 'mist',
    label: 'Mist',
    ui: 'light',
    /** Teal palette: #fff → #d4e9ea → … → #008081 (light) / #000 → … → #008081 (dark) */
    base: '#d4e9ea',
    highlight: '#ffffff',
    secondary: '#008081',
    noiseScale: 6.5,
    speed: 0.08,
    distortion: 0.045,
    gloss: 0.35,
    grain: 0.085,
    bloom: 0.18,
    vignette: 0.22,
    accentGradient: 'linear-gradient(105deg, #4da7a6 0%, #2b9595 48%, #008081 100%)',
    fluidColor: '#008081',
    fluidRainbow: true,
    fallbackGradient:
      'radial-gradient(ellipse 70% 50% at 50% 40%, #4da7a6 0%, #d4e9ea 55%, #ffffff 100%)',
    swatch: 'linear-gradient(135deg, #aad5d4, #4da7a6 50%, #008081)',
    logoBox: '#d4e9ea',
    app: {
      brand: '#008081',
      brandHover: '#006b6b',
      brandSoft: '#d4e9ea',
      brandPage: '#f4fafa',
      brandAccent: '#d50b1c',
      brandAccentHover: '#b2101a',
      wavePrimary: '#4da7a6',
      waveSecondary: '#2b9595',
      accentGradient: 'linear-gradient(105deg, #4da7a6 0%, #2b9595 48%, #008081 100%)',
    },
  },
];

export const LOGIN_MIST_THEME = LOGIN_BG_THEMES.find((t) => t.id === 'mist');
export const LOGIN_BRAND_THEME = LOGIN_BG_THEMES.find((t) => t.id === 'brand');
export const DEFAULT_LOGIN_THEME_ID = 'brand';

/** Apply theme CSS variables on <html> so the whole app updates. */
export function applyAppearanceTheme(themeOrId) {
  if (typeof document === 'undefined') return;
  const theme =
    typeof themeOrId === 'string'
      ? LOGIN_BG_THEMES.find((t) => t.id === themeOrId) || LOGIN_BG_THEMES[0]
      : themeOrId;
  const app = theme?.app;
  if (!app) return;

  const root = document.documentElement;
  root.dataset.appearance = theme.id;
  root.style.setProperty('--brand', app.brand);
  root.style.setProperty('--brand-hover', app.brandHover);
  root.style.setProperty('--brand-soft', app.brandSoft);
  root.style.setProperty('--brand-page', app.brandPage);
  if (app.brandAccent) root.style.setProperty('--brand-accent', app.brandAccent);
  if (app.brandAccentHover) root.style.setProperty('--brand-accent-hover', app.brandAccentHover);
  root.style.setProperty('--ui-wave-primary', app.wavePrimary);
  root.style.setProperty('--ui-wave-secondary', app.waveSecondary);
  root.style.setProperty('--ui-accent-gradient', app.accentGradient);
}
