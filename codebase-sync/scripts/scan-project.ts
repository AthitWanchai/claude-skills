/**
 * scan-project.ts
 * Scans the current project and outputs a JSON summary of:
 * - Stack (from package.json)
 * - Components (glob all component files)
 * - Design tokens (from CSS/style files)
 * - Backend patterns (if detected)
 *
 * Usage: bun scan-project.ts [project-root]
 *        npx ts-node scan-project.ts [project-root]
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, relative, extname } from 'path';
import { glob } from 'glob';

const projectRoot = resolve(process.argv[2] || process.cwd());

// ────────────────────────────────────────────
// 1. Read package.json
// ────────────────────────────────────────────

function detectStack(pkg: any) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const detect = (map: Record<string, string>) =>
    Object.entries(map).find(([key]) => deps[key])?.[1] ?? null;

  return {
    framework: detect({
      next: 'Next.js',
      nuxt: 'Nuxt',
      '@remix-run/react': 'Remix',
      '@sveltejs/kit': 'SvelteKit',
      '@angular/core': 'Angular',
    }) ?? (deps['react'] ? 'React (Vite/CRA)' : deps['vue'] ? 'Vue (Vite)' : 'Unknown'),

    css: detect({
      tailwindcss: 'Tailwind CSS',
      '@mui/material': 'MUI',
      '@chakra-ui/react': 'Chakra UI',
      'styled-components': 'styled-components',
      '@emotion/react': 'Emotion',
      'unocss': 'UnoCSS',
    }) ?? 'CSS Modules / plain CSS',

    state: detect({
      zustand: 'Zustand',
      redux: 'Redux',
      '@reduxjs/toolkit': 'Redux Toolkit',
      jotai: 'Jotai',
      recoil: 'Recoil',
      pinia: 'Pinia',
    }) ?? 'None detected',

    backend: detect({
      elysia: 'Elysia',
      express: 'Express',
      fastify: 'Fastify',
      '@trpc/server': 'tRPC',
      hono: 'Hono',
    }) ?? null,

    orm: detect({
      'drizzle-orm': 'Drizzle ORM',
      '@prisma/client': 'Prisma',
      typeorm: 'TypeORM',
      sequelize: 'Sequelize',
    }) ?? null,

    animation: detect({
      'framer-motion': 'Framer Motion',
      '@vueuse/motion': 'VueUse Motion',
      'motion': 'Motion',
      'gsap': 'GSAP',
    }) ?? null,

    validation: detect({
      '@sinclair/typebox': 'TypeBox',
      zod: 'Zod',
      valibot: 'Valibot',
      yup: 'Yup',
    }) ?? null,

    uiLib: detect({
      'lucide-react': 'Lucide React',
      '@heroicons/react': 'Heroicons',
      '@radix-ui/react-icons': 'Radix UI',
      'react-icons': 'React Icons',
    }) ?? null,

    name: pkg.name ?? 'unknown-project',
    version: pkg.version ?? '0.0.0',
  };
}

// ────────────────────────────────────────────
// 2. Glob components
// ────────────────────────────────────────────

async function findComponents() {
  const patterns = [
    '**/components/**/*.{tsx,vue,svelte,jsx}',
    '**/_components/**/*.{tsx,vue,svelte,jsx}',
    '**/ui/**/*.{tsx,vue,svelte,jsx}',
    '**/elements/**/*.{tsx,vue,svelte,jsx}',
    '**/widgets/**/*.{tsx,vue,svelte,jsx}',
  ];

  const ignore = [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd: projectRoot, ignore, absolute: true });
    files.push(...found);
  }

  // Deduplicate
  const unique = [...new Set(files)].map(f => relative(projectRoot, f));

  // Group by category
  const groups: Record<string, string[]> = {
    sharedUI: [],
    feature: [],
    pageSpecific: [],
    layout: [],
    other: [],
  };

  for (const f of unique) {
    if (f.includes('shared/components/ui') || f.includes('src/components/ui')) {
      groups.sharedUI.push(f);
    } else if (f.includes('features/') || f.includes('_components')) {
      groups.feature.push(f);
    } else if (f.includes('layout')) {
      groups.layout.push(f);
    } else {
      groups.other.push(f);
    }
  }

  return { total: unique.length, groups, files: unique };
}

// ────────────────────────────────────────────
// 3. Find style files
// ────────────────────────────────────────────

async function findStyleFiles() {
  const patterns = [
    '**/globals.css',
    '**/global.css',
    '**/variables.css',
    '**/tokens.css',
    '**/theme.css',
    'tailwind.config.{js,ts,cjs,mjs}',
    'uno.config.{js,ts}',
  ];

  const ignore = ['**/node_modules/**', '**/.next/**', '**/dist/**'];
  const files: string[] = [];

  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd: projectRoot, ignore, absolute: true });
    files.push(...found);
  }

  return [...new Set(files)].map(f => relative(projectRoot, f));
}

// ────────────────────────────────────────────
// 4. Find backend files
// ────────────────────────────────────────────

async function findBackendFiles() {
  const patterns = [
    'backend/modules/*/index.ts',
    'src/routes/**/*.ts',
    'server/routes/**/*.ts',
    'api/**/*.ts',
  ];

  const ignore = ['**/node_modules/**'];
  const files: string[] = [];

  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd: projectRoot, ignore, absolute: true });
    files.push(...found);
  }

  return [...new Set(files)].map(f => relative(projectRoot, f)).slice(0, 5);
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────

async function main() {
  const pkgPath = resolve(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(`❌ package.json not found at: ${projectRoot}`);
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const stack = detectStack(pkg);
  const components = await findComponents();
  const styleFiles = await findStyleFiles();
  const backendFiles = await findBackendFiles();

  const result = {
    projectRoot,
    stack,
    components,
    styleFiles,
    backendFiles,
    hasBackend: !!stack.backend,
    hasDarkMode: styleFiles.some(f => f.includes('globals') || f.includes('variables')),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
