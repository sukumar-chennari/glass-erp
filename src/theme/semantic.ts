/**
 * SEMANTIC DESIGN TOKENS
 * Maps raw palette tokens to meaningful UI roles.
 * Components import from here — never directly from tokens.ts.
 * Changing an alias here propagates everywhere automatically.
 */

import { colorPalette, shadow, borderRadius, spacing, typography, zIndex } from './tokens';

export const color = {
  // ── Brand ──────────────────────────────────────────────────────────
  primary:        colorPalette.purple500,
  primaryHover:   colorPalette.purple600,
  primaryActive:  colorPalette.purple700,
  primarySubtle:  colorPalette.purple50,
  primaryBorder:  colorPalette.purple200,

  accent:         colorPalette.teal500,
  accentHover:    colorPalette.teal600,
  accentSubtle:   colorPalette.teal50,

  // ── Backgrounds ────────────────────────────────────────────────────
  bgPage:         colorPalette.gray100,   // page canvas — PDF light gray
  bgSurface:      colorPalette.white,     // cards, panels
  bgSurfaceHover: colorPalette.gray50,
  bgInput:        colorPalette.white,
  bgInputHover:   colorPalette.gray50,
  bgDisabled:     colorPalette.gray100,

  // ── Text ───────────────────────────────────────────────────────────
  textPrimary:    colorPalette.gray900,
  textSecondary:  colorPalette.gray600,
  textMuted:      colorPalette.gray400,
  textDisabled:   colorPalette.gray300,
  textOnPrimary:  colorPalette.white,
  textInverse:    colorPalette.white,
  textLink:       colorPalette.purple500,
  textLinkHover:  colorPalette.purple700,

  // ── Borders ────────────────────────────────────────────────────────
  border:         colorPalette.gray200,
  borderStrong:   colorPalette.gray300,
  borderFocus:    colorPalette.purple500,
  borderInput:    colorPalette.gray200,

  // ── Status — semantic (used for badges, alerts, KPIs) ──────────────
  successText:    colorPalette.green700,
  successBg:      colorPalette.green50,
  successBorder:  colorPalette.green100,

  warningText:    colorPalette.amber500,
  warningBg:      colorPalette.amber50,
  warningBorder:  colorPalette.amber100,

  dangerText:     colorPalette.red700,
  dangerBg:       colorPalette.red50,
  dangerBorder:   colorPalette.red100,

  infoText:       colorPalette.blue700,
  infoBg:         colorPalette.blue50,
  infoBorder:     colorPalette.blue100,

  neutralText:    colorPalette.gray600,
  neutralBg:      colorPalette.gray100,
  neutralBorder:  colorPalette.gray200,

  coralText:      colorPalette.coral700,
  coralBg:        colorPalette.coral50,

  // ── Sidebar (dark shell) ────────────────────────────────────────────
  sidebarBg:           colorPalette.sidebarBg,
  sidebarBorder:       colorPalette.sidebarBorder,
  sidebarText:         'rgba(255,255,255,0.65)',
  sidebarTextHover:    'rgba(255,255,255,0.90)',
  sidebarTextActive:   colorPalette.white,
  sidebarActiveItemBg: 'rgba(127,119,221,0.20)',
  sidebarActiveBorder: colorPalette.purple500,
  sidebarIconColor:    'rgba(255,255,255,0.45)',
  sidebarLabelColor:   'rgba(255,255,255,0.30)',
  sidebarHoverBg:      colorPalette.sidebarHover,

  // ── Header ─────────────────────────────────────────────────────────
  headerBg:     colorPalette.white,
  headerBorder: colorPalette.gray200,

  // ── Overlay ────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const radius = borderRadius;
export const space  = spacing;
export const type   = typography;
export const depth  = shadow;
export const layer  = zIndex;

export type ColorToken   = keyof typeof color;
export type SpacingToken = keyof typeof space;
export type ShadowToken  = keyof typeof depth;
