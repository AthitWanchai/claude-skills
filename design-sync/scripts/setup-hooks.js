#!/usr/bin/env node
/**
 * setup-hooks.js
 * ติดตั้ง git pre-commit hook อัตโนมัติ — ไม่ต้องใช้ husky
 *
 * รันตอน `bun install` / `npm install` ผ่าน package.json "prepare" script
 * ทำให้ทีมทุกคนได้ hook โดยไม่ต้อง setup เอง
 *
 * ปลอดภัย: ถ้าไม่ใช่ git repo หรือมี hook อยู่แล้วที่ไม่ใช่ของเรา → ข้ามไป ไม่ทับ
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GIT_DIR = path.join(ROOT, '.git');
const HOOK_DIR = path.join(GIT_DIR, 'hooks');
const HOOK_FILE = path.join(HOOK_DIR, 'pre-commit');
const MARKER = '# design-sync-hook';

function main() {
  if (!fs.existsSync(GIT_DIR)) {
    // ไม่ใช่ git repo — ข้าม (เช่นตอนติดตั้งเป็น dependency)
    process.exit(0);
  }

  if (!fs.existsSync(HOOK_DIR)) {
    fs.mkdirSync(HOOK_DIR, { recursive: true });
  }

  const hookScript = `#!/bin/sh
${MARKER}
# Auto-installed by design-sync. แก้ไขได้ แต่อย่าลบบรรทัด marker ด้านบน
node scripts/check-design-sync.js
exit 0
`;

  if (fs.existsSync(HOOK_FILE)) {
    const existing = fs.readFileSync(HOOK_FILE, 'utf-8');
    if (existing.includes(MARKER)) {
      // hook ของเราอยู่แล้ว — อัปเดตเนื้อหา
      fs.writeFileSync(HOOK_FILE, hookScript, { mode: 0o755 });
      console.log('✅ design-sync pre-commit hook อัปเดตแล้ว');
    } else {
      // มี hook อื่นอยู่ — ไม่ทับ แค่เตือน
      console.log('⚠️  มี pre-commit hook อยู่แล้ว — ข้ามการติดตั้ง design-sync hook');
      console.log('   เพิ่มเองได้: node scripts/check-design-sync.js');
    }
  } else {
    fs.writeFileSync(HOOK_FILE, hookScript, { mode: 0o755 });
    console.log('✅ design-sync pre-commit hook ติดตั้งแล้ว');
  }

  process.exit(0);
}

main();
