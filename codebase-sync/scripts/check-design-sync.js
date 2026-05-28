#!/usr/bin/env node
/**
 * check-design-sync.js
 * Pre-commit / predev guard — เตือน (หรืออัปเดต) เมื่อ component หรือ CSS variable
 * ใหม่กว่า DESIGN_SYSTEM.md
 *
 * Usage:
 *   node check-design-sync.js          # warn only (exit 0 เสมอ ไม่บล็อก)
 *   node check-design-sync.js --strict # exit 1 ถ้า stale (ใช้ใน CI)
 *
 * ไม่เรียก AI / ไม่ใช้ token — เป็น Node script ล้วน ทำงาน offline ได้
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const DESIGN_FILE = path.join(ROOT, 'DESIGN_SYSTEM.md');

// ── helpers ──────────────────────────────────

function walk(dir, exts, ignore, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (ignore.some((ig) => full.includes(ig))) continue;
    if (e.isDirectory()) {
      walk(full, exts, ignore, acc);
    } else if (exts.some((ext) => e.name.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

function mtime(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

// ── main ─────────────────────────────────────

function main() {
  if (!fs.existsSync(DESIGN_FILE)) {
    console.log('ℹ️  ยังไม่มี DESIGN_SYSTEM.md — รัน /design-sync เพื่อสร้างครั้งแรก');
    process.exit(0);
  }

  const designMtime = mtime(DESIGN_FILE);

  const ignore = [
    'node_modules',
    `${path.sep}.next${path.sep}`,
    `${path.sep}.git${path.sep}`,
    `${path.sep}dist${path.sep}`,
    `${path.sep}build${path.sep}`,
    '.test.',
    '.spec.',
    '.stories.',
  ];

  // 1. component files
  const componentDirs = ['app', 'src', 'shared', 'features', 'components'];
  let components = [];
  for (const d of componentDirs) {
    const dir = path.join(ROOT, d);
    if (fs.existsSync(dir)) {
      components.push(...walk(dir, ['.tsx', '.jsx', '.vue', '.svelte'], ignore));
    }
  }
  components = components.filter(
    (f) => f.includes('component') || f.includes(`${path.sep}ui${path.sep}`) || f.includes('_components')
  );

  // 2. style files (globals.css ฯลฯ) — แก้ปัญหา CSS variable เปลี่ยน
  let styles = [];
  for (const d of [ROOT, ...componentDirs.map((d) => path.join(ROOT, d))]) {
    if (fs.existsSync(d)) {
      styles.push(
        ...walk(d, ['.css'], ignore).filter((f) =>
          /globals\.css|global\.css|variables\.css|tokens\.css|theme\.css/.test(f)
        )
      );
    }
  }

  const watched = [...new Set([...components, ...styles])];
  const stale = watched.filter((f) => mtime(f) > designMtime);

  if (stale.length === 0) {
    console.log('✅ DESIGN_SYSTEM.md เป็นปัจจุบัน');
    process.exit(0);
  }

  const rel = (f) => path.relative(ROOT, f);
  console.log('\x1b[33m%s\x1b[0m', '⚠️  DESIGN_SYSTEM.md อาจล้าสมัย');
  console.log('   ไฟล์ที่เปลี่ยนหลัง sync ล่าสุด:');
  for (const f of stale.slice(0, 10)) {
    const tag = f.endsWith('.css') ? '[css]' : '[component]';
    console.log(`     ${tag} ${rel(f)}`);
  }
  if (stale.length > 10) console.log(`     ... และอีก ${stale.length - 10} ไฟล์`);
  console.log('   → รัน \x1b[36m/design-sync\x1b[0m เพื่ออัปเดต\n');

  process.exit(STRICT ? 1 : 0);
}

main();
