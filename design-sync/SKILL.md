---
name: "design-sync"
description: "สแกน project แล้ว generate/sync ไฟล์กฎ DESIGN_SYSTEM.md, CLAUDE.md, AGENTS.md, GEMINI.md ให้ตรงกับสถานะปัจจุบันของโค้ด — ใช้ได้กับทุก stack และทุก project"
---

# Design Sync

สแกน project → generate ไฟล์กฎ AI ให้ตรงกับโค้ดจริง
รองรับทุก stack: Next.js, Nuxt, Vite, Vue, Remix, SvelteKit, Tailwind, MUI, Chakra ฯลฯ

---

## `/design-sync` — Workflow

### ขั้นตอน 1 — Scan (scripts/scan-project.ts)

ถ้า project มี Bun/Node ติดตั้งอยู่ → รัน script จริง:
```bash
bun ~/.claude/skills/design-sync/scripts/scan-project.ts
```

ถ้าไม่มี → ทำด้วยตัวเองตามนี้:

1. อ่าน `package.json` → detect: framework, css, state, backend, orm, animation, validation, uiLib
2. Glob หา components (exclude `node_modules/`, `.next/`, `dist/`, `*.test.*`):
   - `**/components/**/*.{tsx,vue,svelte,jsx}`
   - `**/_components/**/*.{tsx,vue,svelte,jsx}`
   - `**/ui/**/*.{tsx,vue,svelte,jsx}`
3. Glob หา style files: `**/globals.css`, `**/variables.css`, `tailwind.config.*`
4. อ่านเฉพาะ **3 component ตัวอย่าง** จาก shared UI (ไม่อ่านทั้งหมด)
5. ถ้ามี backend → อ่าน **1 route ตัวอย่าง**

### ขั้นตอน 2 — Extract Tokens (scripts/extract-tokens.ts)

ถ้ารัน script ได้:
```bash
bun ~/.claude/skills/design-sync/scripts/extract-tokens.ts [globals.css] [tailwind.config.ts]
```

ถ้าไม่มี → อ่าน globals.css แล้ว extract CSS custom properties ด้วยตัวเอง
จัดกลุ่มตาม prefix: `--bg-*`, `--text-*`, `--border-*`, `--status-*`

### ขั้นตอน 3 — แสดงสรุปและรอยืนยัน

**ต้องแสดงก่อนเสมอ ห้าม write ก่อนได้รับ OK:**

```
📦 Stack ที่พบ:
  Framework : [ชื่อ]
  CSS       : [ชื่อ]
  State     : [ชื่อ]
  Backend   : [ชื่อ หรือ "ไม่มี"]

🧩 Components: [N] ไฟล์
  Shared UI    : [N] ไฟล์ ([path])
  Feature      : [N] ไฟล์

🎨 Design Tokens:
  CSS Variables: [N] ตัว
  Dark mode    : [มี/ไม่มี]

📝 ไฟล์ที่จะ [สร้างใหม่ / อัปเดต]:
  - [ ] DESIGN_SYSTEM.md
  - [ ] CLAUDE.md
  - [ ] AGENTS.md
  - [ ] GEMINI.md

ยืนยันดำเนินการไหมครับ?
```

### ขั้นตอน 4 — Generate (scripts/generate-rules.ts)

ถ้ารัน script ได้:
```bash
bun ~/.claude/skills/design-sync/scripts/generate-rules.ts \
  --scan scan-result.json \
  --tokens token-result.json \
  --out ./
```

ถ้าไม่มี → generate ตาม templates/ ด้วยตัวเอง โดย:
- ใช้ไฟล์จาก `~/.claude/skills/design-sync/templates/` เป็น base
- แทน `{{PLACEHOLDER}}` ด้วยข้อมูลจริงที่ scan ได้
- ถ้าไฟล์เดิมมีอยู่แล้ว → **merge manual rules ไม่ overwrite**

---

## ขั้นตอน 5 — Auto-sync Hook (ทำครั้งเดียว)

หลัง generate ไฟล์กฎเสร็จ ให้เสนอติดตั้ง pre-commit hook เพื่อกัน DESIGN_SYSTEM.md stale:

1. copy `scripts/check-design-sync.js` + `scripts/setup-hooks.js` เข้าโปรเจค
2. เพิ่มใน `package.json`:
   ```json
   "scripts": { "prepare": "node scripts/setup-hooks.js" }
   ```
3. รัน `node scripts/setup-hooks.js` ติดตั้ง hook ทันที

**ผล:** ทุกครั้งที่ `git commit` → hook เช็คว่า component หรือ CSS variable
ใหม่กว่า DESIGN_SYSTEM.md ไหม → เตือนให้รัน `/design-sync`
ไม่ใช้ token, ไม่บล็อก commit, ทีม clone แล้ว `bun install` ได้ hook อัตโนมัติ (ไม่ต้องใช้ husky)

---

## Token Budget

| ขั้นตอน | ไฟล์ที่อ่าน | Token |
|---|---|---|
| package.json | 1 | ~200 |
| Glob paths | 0 | ~100 |
| Sample components | 3 | ~600 |
| Style file | 1 | ~300 |
| Backend sample | 0-1 | ~200 |
| **รวม** | **6-7 ไฟล์** | **~1,400** |
| Hook ทุกวัน (commit) | 0 | **0 (Node script)** |

---

## หมายเหตุ

- อ่าน component ตัวอย่างแค่ 3 ไฟล์ — ไม่อ่านทั้งโปรเจค
- ถ้า project ไม่มี backend → ลบ Backend section ออกจากทุกไฟล์
- ถ้าไม่มี dark mode → ลบ dark: rules ออก
- รัน `/design-sync` ซ้ำได้ทุกครั้งที่ project เปลี่ยน
