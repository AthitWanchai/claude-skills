/**
 * extract-tokens.ts
 * Reads CSS/style files and extracts design tokens:
 * - CSS Custom Properties (--variable: value)
 * - Tailwind theme tokens (colors, fonts, fontSize)
 *
 * Usage: bun extract-tokens.ts [css-file] [tailwind-config]
 *        npx ts-node extract-tokens.ts [css-file] [tailwind-config]
 *
 * Output: JSON with grouped tokens
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

interface TokenGroup {
  bg: Record<string, string>;
  text: Record<string, string>;
  border: Record<string, string>;
  status: Record<string, string>;
  brand: Record<string, string>;
  other: Record<string, string>;
}

interface ExtractResult {
  cssVars: TokenGroup;
  tailwindColors: Record<string, any>;
  fonts: Record<string, string[]>;
  fontSizes: Record<string, string>;
  darkMode: boolean;
  rawVars: Record<string, string>;
}

// ────────────────────────────────────────────
// CSS Custom Properties
// ────────────────────────────────────────────

function extractCssVars(css: string): ExtractResult['cssVars'] & { raw: Record<string, string>; darkMode: boolean } {
  const varRegex = /--([\w-]+)\s*:\s*([^;}\n]+)/g;
  const raw: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(css)) !== null) {
    raw[`--${match[1]}`] = match[2].trim();
  }

  const darkMode = css.includes('.dark') || css.includes('[data-theme="dark"]');

  // Group by prefix
  const groups: TokenGroup = { bg: {}, text: {}, border: {}, status: {}, brand: {}, other: {} };

  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith('--bg')) groups.bg[key] = val;
    else if (key.startsWith('--text')) groups.text[key] = val;
    else if (key.startsWith('--border')) groups.border[key] = val;
    else if (key.startsWith('--status')) groups.status[key] = val;
    else if (key.startsWith('--brand') || key.startsWith('--primary')) groups.brand[key] = val;
    else groups.other[key] = val;
  }

  return { ...groups, raw, darkMode };
}

// ────────────────────────────────────────────
// Tailwind Config (JS eval-free: regex parse)
// ────────────────────────────────────────────

function extractTailwindTokens(content: string) {
  const colors: Record<string, any> = {};
  const fonts: Record<string, string[]> = {};
  const fontSizes: Record<string, string> = {};

  // Extract color keys from extend.colors
  const colorSection = content.match(/colors\s*:\s*\{([^}]+)\}/s);
  if (colorSection) {
    const keyRegex = /['"]?([\w-]+)['"]?\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = keyRegex.exec(colorSection[1])) !== null) {
      colors[m[1]] = '...';
    }
  }

  // Extract fontFamily keys
  const fontSection = content.match(/fontFamily\s*:\s*\{([^}]+)\}/s);
  if (fontSection) {
    const pairs = fontSection[1].matchAll(/['"]?([\w-]+)['"]?\s*:\s*\[([^\]]+)\]/g);
    for (const pair of pairs) {
      fonts[pair[1]] = pair[2].split(',').map(s => s.trim().replace(/['"]/g, ''));
    }
  }

  // Extract fontSize keys
  const sizeSection = content.match(/fontSize\s*:\s*\{([^}]+)\}/s);
  if (sizeSection) {
    const pairs = sizeSection[1].matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g);
    for (const pair of pairs) {
      fontSizes[pair[1]] = pair[2];
    }
  }

  return { colors, fonts, fontSizes };
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────

async function main() {
  const cssPath = process.argv[2];
  const twPath = process.argv[3];

  const result: Partial<ExtractResult> = {
    cssVars: { bg: {}, text: {}, border: {}, status: {}, brand: {}, other: {} },
    tailwindColors: {},
    fonts: {},
    fontSizes: {},
    darkMode: false,
    rawVars: {},
  };

  if (cssPath && existsSync(cssPath)) {
    const css = readFileSync(cssPath, 'utf-8');
    const extracted = extractCssVars(css);
    result.cssVars = {
      bg: extracted.bg,
      text: extracted.text,
      border: extracted.border,
      status: extracted.status,
      brand: extracted.brand,
      other: extracted.other,
    };
    result.rawVars = extracted.raw;
    result.darkMode = extracted.darkMode;
  }

  if (twPath && existsSync(twPath)) {
    const content = readFileSync(twPath, 'utf-8');
    const tw = extractTailwindTokens(content);
    result.tailwindColors = tw.colors;
    result.fonts = tw.fonts;
    result.fontSizes = tw.fontSizes;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
