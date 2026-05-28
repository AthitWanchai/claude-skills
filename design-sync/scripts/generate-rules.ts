/**
 * generate-rules.ts
 * Reads scan-project.ts + extract-tokens.ts output (JSON) and
 * generates rule files using templates/.
 *
 * Usage:
 *   bun scan-project.ts | bun generate-rules.ts
 *   # or pass JSON file:
 *   bun generate-rules.ts --scan scan-result.json --tokens token-result.json --out ./
 *
 * Output: DESIGN_SYSTEM.md, CLAUDE.md, AGENTS.md, GEMINI.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const scanFile = getArg('--scan');
const tokenFile = getArg('--tokens');
const outDir = resolve(getArg('--out') ?? process.cwd());
const today = new Date().toISOString().split('T')[0];

// ────────────────────────────────────────────
// Read input
// ────────────────────────────────────────────

let scan: any = {};
let tokens: any = {};

if (scanFile && existsSync(scanFile)) {
  scan = JSON.parse(readFileSync(scanFile, 'utf-8'));
} else {
  // Read from stdin
  try {
    const stdin = readFileSync('/dev/stdin', 'utf-8');
    scan = JSON.parse(stdin);
  } catch {
    console.error('❌ No scan data. Pipe from scan-project.ts or use --scan flag.');
    process.exit(1);
  }
}

if (tokenFile && existsSync(tokenFile)) {
  tokens = JSON.parse(readFileSync(tokenFile, 'utf-8'));
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const s = scan.stack ?? {};
const projectName = s.name ?? 'Project';

function stackTable() {
  const rows = [
    ['Framework', s.framework ?? '-'],
    ['CSS', s.css ?? '-'],
    ['State', s.state ?? '-'],
    ['Animation', s.animation ?? 'ไม่ใช้'],
    ['Backend', s.backend ?? 'Frontend only'],
    ['ORM', s.orm ?? '-'],
    ['Validation', s.validation ?? '-'],
    ['UI Icons', s.uiLib ?? '-'],
  ];
  return rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n');
}

function cssVarsBlock() {
  const vars = tokens.rawVars ?? {};
  if (Object.keys(vars).length === 0) return 'ไม่พบ CSS Custom Properties — ใช้ Tailwind default colors';

  const cv = tokens.cssVars ?? {};
  const lines: string[] = [];

  if (Object.keys(cv.bg ?? {}).length) {
    lines.push('Background : ' + Object.keys(cv.bg).map(k => `var(${k})`).join(' | '));
  }
  if (Object.keys(cv.text ?? {}).length) {
    lines.push('Text       : ' + Object.keys(cv.text).map(k => `var(${k})`).join(' | '));
  }
  if (Object.keys(cv.border ?? {}).length) {
    lines.push('Border     : ' + Object.keys(cv.border).map(k => `var(${k})`).join(' | '));
  }
  if (Object.keys(cv.status ?? {}).length) {
    lines.push('Status     : ' + Object.keys(cv.status).slice(0, 4).map(k => `var(${k})`).join(' | ') + ' ...');
  }

  return lines.join('\n');
}

function componentTable() {
  const groups = scan.components?.groups ?? {};
  const sharedUI: string[] = groups.sharedUI ?? [];
  if (sharedUI.length === 0) return 'ไม่พบ Shared UI components';

  const rows = sharedUI.slice(0, 15).map(f => {
    const name = f.split('/').pop()?.replace(/\.(tsx|vue|svelte|jsx)$/, '') ?? f;
    return `| ${name} | \`${f}\` | \`<${name} />\` |`;
  });

  return `| Component | File | Usage |\n|---|---|---|\n${rows.join('\n')}`;
}

function featureComponents() {
  const groups = scan.components?.groups ?? {};
  const feature: string[] = [...(groups.feature ?? []), ...(groups.other ?? [])];
  if (feature.length === 0) return 'ไม่พบ';
  return feature.slice(0, 10).map(f => `- \`${f}\``).join('\n');
}

function sharedImportPath() {
  const files: string[] = scan.components?.groups?.sharedUI ?? [];
  if (files.length === 0) return 'components/ui';
  const first = files[0];
  return first.split('/').slice(0, -1).join('/');
}

function backendSection() {
  if (!scan.hasBackend) return '';
  return `
---

## Backend Conventions

### Response format — ทุก route ต้อง return แบบนี้
\`\`\`ts
{ success: true, data: result }
{ success: true, data: result, message: 'บันทึกสำเร็จ' }
{ success: false, error: { code: 'SNAKE_CASE_CODE', message: '...' } }
{ success: true, data: { items, total, page, limit, totalPages } }
\`\`\`

Backend: **${s.backend}** ${s.orm ? `| ORM: **${s.orm}**` : ''}
`;
}

// ────────────────────────────────────────────
// Read existing rule files (merge)
// ────────────────────────────────────────────

function readExisting(filename: string): string {
  const p = join(outDir, filename);
  return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}

function extractManualSection(content: string, marker: string): string {
  const start = content.indexOf(`<!-- MANUAL:${marker}:START -->`);
  const end = content.indexOf(`<!-- MANUAL:${marker}:END -->`);
  if (start === -1 || end === -1) return '';
  return content.slice(start, end + `<!-- MANUAL:${marker}:END -->`.length);
}

// ────────────────────────────────────────────
// Generate files
// ────────────────────────────────────────────

function generateDesignSystem(): string {
  const darkNote = tokens.darkMode
    ? `- Default คือ dark (\`<html class="dark">\`)\n- ใส่ \`dark:\` prefix ทุกครั้งที่กำหนดสี\n- ใช้ CSS var แทน hardcode — สลับ light/dark อัตโนมัติ`
    : 'ยังไม่มี dark mode';

  return `# ${projectName} — Design System & UI Rules

> อ่านไฟล์นี้ก่อนเขียน UI ทุกครั้ง — ห้ามสร้าง component หรือ style ใหม่โดยไม่เช็คที่นี่ก่อน
> Last synced: ${today} | Stack: ${s.framework ?? '-'} + ${s.css ?? '-'}

---

## Stack
| Layer | Technology |
|---|---|
${stackTable()}

---

## Design Tokens — ห้าม hardcode สี

\`\`\`
${cssVarsBlock()}
\`\`\`

### Dark Mode
${darkNote}

---

## Components

### Shared UI — import จาก \`${sharedImportPath()}\`

${componentTable()}

### Feature / Page Components
${featureComponents()}

---

## Patterns

### Card
\`\`\`tsx
<div className="border border-slate-100 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-sm">
\`\`\`

### Table
\`\`\`tsx
<div className="datatable-container"><table className="datatable">...</table></div>
\`\`\`

### Animation
${s.animation ? `\`\`\`tsx\nimport { motion } from '${s.animation === 'Framer Motion' ? 'framer-motion' : 'motion'}';\n<motion.div>  // interactive element\n<div className="animate-fade-in">  // page fade\n\`\`\`` : 'ไม่ใช้ animation library'}
${backendSection()}
---

## ❌ ห้ามทำ — ✅ ให้ทำแทน

| ❌ ห้าม | ✅ ให้ทำ |
|---|---|
| hardcode สี \`#ffffff\` | ใช้ CSS var หรือ Tailwind token |
| \`<button className="...">\` เอง | ใช้ component จาก shared UI |
| \`<input className="...">\` เอง | ใช้ component จาก shared UI |
| สร้าง component ใหม่ | เช็ค shared UI ก่อน |
`;
}

function generateClaudeMd(): string {
  const importPath = sharedImportPath();
  return `## RULES — อ่านก่อนทำทุกอย่าง

### ⚠️ ยืนยันก่อนแก้เสมอ — ห้ามลงมือโดยไม่ได้รับอนุญาต
ก่อนแก้ไขไฟล์ใดๆ ต้องทำตามขั้นตอนนี้ทุกครั้ง:
1. วิเคราะห์ว่าจะแก้อะไรบ้าง
2. แสดงรายการเป็น bullet list ชัดๆ (แก้ไฟล์ไหน ทำอะไร)
3. รอผู้ใช้ยืนยันก่อน แล้วค่อยลงมือแก้

> เหตุผล: ป้องกันเข้าใจผิด ลด token ที่เสียไปกับการแก้ซ้ำ

### ก่อนแก้ไฟล์ใดๆ ตรวจสอบ 3 ข้อนี้ก่อนเสมอ:
1. มี component ที่ทำสิ่งนี้อยู่แล้วใน \`${importPath}\` ไหม?
2. ใช้ CSS variable/token หรือ hardcode สี?
${tokens.darkMode ? '3. มี `dark:` variant ทุกครั้งที่ใช้สีขาว/เทาไหม?' : '3. ใช้ design token ที่กำหนดไว้ไหม?'}

---

## Design Tokens — ห้าม hardcode
\`\`\`
${cssVarsBlock()}
\`\`\`

## Components — import จาก \`${importPath}\` เสมอ ห้ามสร้างเอง
${componentTable()}

## Card Pattern
\`\`\`tsx
<div className="border border-slate-100 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-sm">
\`\`\`

## Table
\`\`\`tsx
<div className="datatable-container"><table className="datatable">...</table></div>
\`\`\`
${backendSection()}
## Codebase Wiki
wiki อยู่ที่ \`wiki/\` — ดู \`wiki/index.md\` ก่อนเสมอ
- Status ✅ → อ่าน note แทนไฟล์ต้นทาง
- Status ⬜ → สร้าง note ก่อนตอบ
- Status ⚠️ → แจ้งผู้ใช้ก่อน
- โหลดสูงสุด 2-3 ไฟล์ต่อคำถาม

---

## อัปเดตเมื่อมีการเปลี่ยนแปลง
ถ้าแก้ไขสิ่งเหล่านี้ → อัปเดต \`CLAUDE.md\` และ \`DESIGN_SYSTEM.md\` ทันที:
- เพิ่ม component ใหม่ใน \`${importPath}\`
- เพิ่ม CSS variable/token ใหม่
- เปลี่ยน card/button/input/table pattern
${scan.hasBackend ? '- เปลี่ยน backend response format' : ''}
`;
}

function generateAgentsMd(): string {
  const importPath = sharedImportPath();
  return `## MANDATORY: Read before starting

### ⚠️ Confirm before editing — never edit without approval
Before modifying any file, you MUST:
1. Analyze what needs to change
2. List every change as bullet points (which file, what action)
3. Wait for user confirmation, then proceed

> Reason: Prevents misunderstanding and reduces wasted tokens from rework.

---

**Read \`DESIGN_SYSTEM.md\` before writing any UI, component, or CSS.**

**Update \`DESIGN_SYSTEM.md\` immediately when you:**
- Add a new component to \`${importPath}\`
- Add a new CSS variable or design token
- Change any pattern (card / button / input / table)
- Change any font or typography token
${scan.hasBackend ? '- Change backend response format' : ''}

> If not updated — next session AI will read stale rules and revert to old patterns.

---

## Codebase Wiki
Wiki at \`wiki/\`. Always check \`wiki/index.md\` first.
- ✅ = read note instead of source
- ⬜ = create note on-demand before answering
- ⚠️ = warn user note may be stale
Max 2-3 files per query.
`;
}

// ────────────────────────────────────────────
// Write output
// ────────────────────────────────────────────

const files = [
  { name: 'DESIGN_SYSTEM.md', content: generateDesignSystem() },
  { name: 'CLAUDE.md', content: generateClaudeMd() },
  { name: 'AGENTS.md', content: generateAgentsMd() },
  { name: 'GEMINI.md', content: generateAgentsMd() }, // same as AGENTS.md
];

for (const f of files) {
  const outPath = join(outDir, f.name);
  writeFileSync(outPath, f.content, 'utf-8');
  console.log(`✅ ${f.name}`);
}

console.log(`\n📁 Output: ${outDir}`);
console.log(`📦 Stack: ${s.framework} + ${s.css}`);
console.log(`🧩 Components: ${scan.components?.total ?? 0} files`);
console.log(`🎨 CSS Vars: ${Object.keys(tokens.rawVars ?? {}).length} variables`);
