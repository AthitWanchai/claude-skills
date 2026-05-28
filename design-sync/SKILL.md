---
name: "design-sync"
description: "สแกน project แล้ว generate/sync ไฟล์กฎ DESIGN_SYSTEM.md, CLAUDE.md, AGENTS.md, GEMINI.md ให้ตรงกับสถานะปัจจุบันของโค้ด — ใช้ได้กับทุก stack และทุก project"
---

# Design Sync — Project Rules Generator

## หลักการ
- อ่าน `package.json` → รู้ stack จริง ไม่เดา
- Glob หา component ทุกตัวในโปรเจค (ไม่ hardcode path)
- อ่าน style/CSS files → extract design tokens จริง
- ถ้าไฟล์กฎมีอยู่แล้ว → merge ไม่ overwrite
- ถ้ายังไม่มี → generate จากศูนย์
- **ต้องแสดงรายการและรอยืนยันก่อน write ทุกครั้ง**

---

## Commands

### `/design-sync` — Full Scan + Generate/Update

**ขั้นตอน 1 — อ่าน package.json**

อ่าน `package.json` (root) แล้ว detect:

```
Framework  : next | nuxt | vite+react | vite+vue | cra | remix | sveltekit | ...
CSS        : tailwindcss | @mui/material | @chakra-ui | styled-components | css-modules | unocss | ...
State      : zustand | redux | jotai | recoil | pinia | ...
Backend    : elysia | express | fastify | trpc | hono | ...
ORM        : drizzle-orm | prisma | typeorm | ...
Animation  : framer-motion | @vueuse/motion | motion | ...
Validation : typebox | zod | valibot | yup | ...
UI Lib     : lucide-react | @heroicons | radix-ui | shadcn | ...
```

ถ้าไม่พบ key → ระบุ "ไม่พบ / ไม่ใช้"

---

**ขั้นตอน 2 — Glob หา Components ทั้งหมด**

Glob pattern ที่ต้องรัน (ทั้งหมด):
```
**/components/**/*.{tsx,vue,svelte,jsx}
**/_components/**/*.{tsx,vue,svelte,jsx}
**/ui/**/*.{tsx,vue,svelte,jsx}
**/elements/**/*.{tsx,vue,svelte,jsx}
**/widgets/**/*.{tsx,vue,svelte,jsx}
**/composables/**/*.{ts,js}        ← Vue
**/hooks/**/*.{ts,js}              ← React custom hooks
```

ยกเว้น: `node_modules/`, `.next/`, `dist/`, `*.test.*`, `*.spec.*`, `*.stories.*`, `index.ts` ที่เป็น re-export เท่านั้น

จัดกลุ่มผลลัพธ์:
```
Shared UI    : shared/components/ui/ หรือ src/components/ui/
Feature      : features/*/components/ หรือ app/*/_components/
Page-specific: app/*/page*.tsx ที่ไม่ใช่ component
Layout       : **/layout/**
```

อ่านเฉพาะ **3 ไฟล์ตัวอย่าง** จาก Shared UI เพื่อเข้าใจ pattern (import path, prop pattern, variant pattern) — ไม่อ่านทั้งหมด

---

**ขั้นตอน 3 — หา Style Files + Extract Design Tokens**

Glob หาไฟล์เหล่านี้:
```
**/globals.css
**/global.css
**/variables.css
**/tokens.css
**/theme.css
tailwind.config.{js,ts,cjs,mjs}
uno.config.{js,ts}
```

จาก CSS files → extract:
- CSS Custom Properties (`--variable-name: value`)
- จัดกลุ่มตาม prefix: `--bg-*`, `--text-*`, `--border-*`, `--status-*`

จาก tailwind.config → extract:
- `theme.extend.colors` → color tokens
- `theme.extend.fontFamily` → fonts
- `theme.extend.fontSize` → typography scale

---

**ขั้นตอน 4 — หา Backend Patterns (ถ้ามี)**

ถ้า detect Elysia / Express / Fastify / Hono ใน package.json:
- Glob `backend/modules/*/index.ts` หรือ `src/routes/**/*.ts`
- อ่าน **1 ไฟล์ตัวอย่าง** เพื่อเข้าใจ response format และ auth pattern

ถ้าไม่มี backend ใน project → ข้ามขั้นตอนนี้

---

**ขั้นตอน 5 — อ่านไฟล์กฎที่มีอยู่**

เช็คว่ามีไฟล์เหล่านี้ไหม:
- `DESIGN_SYSTEM.md`
- `CLAUDE.md`
- `AGENTS.md`
- `GEMINI.md`

ถ้ามี → อ่านและ **เก็บ manual rules** ที่ผู้ใช้เขียนเองไว้ก่อน (จะ merge กลับเข้าไป)
ถ้าไม่มี → จะ generate ใหม่ทั้งหมด

---

**ขั้นตอน 6 — แสดงรายการและรอยืนยัน**

แสดงสรุปสิ่งที่พบ และรายการไฟล์ที่จะสร้าง/อัปเดต:

```
📦 Stack ที่พบ:
  Framework : Next.js 15 (App Router)
  CSS       : Tailwind CSS 4
  State     : Zustand
  Backend   : Elysia
  ORM       : Drizzle ORM
  Animation : Framer Motion

🧩 Components ที่พบ: 24 ไฟล์
  Shared UI    : 18 ไฟล์ (shared/components/ui/)
  Feature      : 4 ไฟล์
  Page-specific: 2 ไฟล์

🎨 Design Tokens ที่พบ:
  CSS Variables: 22 ตัว
  Colors       : 8 กลุ่ม
  Fonts        : Prompt, Inter (public) | Sarabun (admin)

📝 ไฟล์ที่จะ{สร้าง/อัปเดต}:
  - [ ] DESIGN_SYSTEM.md  ← {สร้างใหม่ / อัปเดต section: Components, Tokens}
  - [ ] CLAUDE.md         ← {สร้างใหม่ / merge กับที่มีอยู่}
  - [ ] AGENTS.md         ← {สร้างใหม่ / merge กับที่มีอยู่}
  - [ ] GEMINI.md         ← {สร้างใหม่ / merge กับที่มีอยู่}

ยืนยันดำเนินการไหมครับ?
```

**รอการยืนยันก่อน ห้าม write ก่อนได้รับ OK**

---

**ขั้นตอน 7 — Generate ไฟล์**

หลังได้รับการยืนยัน ให้ generate ไฟล์ตาม template ด้านล่าง

---

## Templates

### DESIGN_SYSTEM.md

```markdown
# {ProjectName} — Design System & UI Rules

> อ่านไฟล์นี้ก่อนเขียน UI ทุกครั้ง — ห้ามสร้าง component หรือ style ใหม่โดยไม่เช็คที่นี่ก่อน
> Last synced: {date} | Stack: {framework} + {css}

---

## Stack
| Layer | Technology |
|---|---|
| Framework | {framework + version} |
| CSS | {css solution} |
| State | {state management} |
| Animation | {animation lib หรือ "ไม่ใช้"} |
| Backend | {backend หรือ "Frontend only"} |
| ORM | {orm หรือ "-"} |

---

## Fonts
{generate จากข้อมูลที่พบ}

---

## Design Tokens — ห้าม hardcode สี
{generate CSS variables ที่พบจริงจาก globals.css}

### Dark Mode
{ถ้าพบ .dark class ใน CSS → อธิบาย dark mode pattern}
{ถ้าไม่พบ → "ยังไม่มี dark mode"}

---

## Components

### Shared UI — import จาก {import path ที่พบจริง}

| Component | File | Usage |
|---|---|---|
| Button | {path} | `<Button variant="...">` |
| Input | {path} | `<Input label="..." />` |

### Feature Components
{list feature-specific components}

### Page Components
{list page-specific components}

---

## Patterns

### Card
{pattern จริงที่พบ หรือ standard pattern ตาม CSS solution}

### Table
{datatable pattern ที่พบ หรือ standard HTML table}

### Animation
{framer-motion / CSS animation / ไม่ใช้}

---

## Backend Conventions
{ถ้ามี backend → generate จากข้อมูลที่พบ}
{ถ้าไม่มี → ลบ section นี้ออก}

---

## ❌ ห้ามทำ — ✅ ให้ทำแทน
{generate จาก design tokens และ components ที่พบจริง}
```

---

### CLAUDE.md

```markdown
## RULES — อ่านก่อนทำทุกอย่าง

### ⚠️ ยืนยันก่อนแก้เสมอ — ห้ามลงมือโดยไม่ได้รับอนุญาต
ก่อนแก้ไขไฟล์ใดๆ ต้องทำตามขั้นตอนนี้ทุกครั้ง:
1. วิเคราะห์ว่าจะแก้อะไรบ้าง
2. แสดงรายการเป็น bullet list ชัดๆ (แก้ไฟล์ไหน ทำอะไร)
3. รอผู้ใช้ยืนยันก่อน แล้วค่อยลงมือแก้

> เหตุผล: ป้องกันเข้าใจผิด ลด token ที่เสียไปกับการแก้ซ้ำ

### ก่อนแก้ไฟล์ใดๆ ใน {src directories}
ตรวจสอบ 3 ข้อนี้ก่อนเสมอ:
1. มี component ที่ทำสิ่งนี้อยู่แล้วใน {shared component path} ไหม?
2. ใช้ {CSS solution} variable/token หรือ hardcode สี?
3. {ถ้ามี dark mode} มี dark: variant ทุกครั้งที่ใช้สีขาว/เทาไหม?

---

## Design Tokens — ห้าม hardcode
{inline tokens จาก DESIGN_SYSTEM.md}

## Fonts
{inline fonts จาก DESIGN_SYSTEM.md}

## Components
{inline component table จาก DESIGN_SYSTEM.md}

## Patterns
{inline patterns จาก DESIGN_SYSTEM.md}

---

{ถ้ามี backend}
## Backend Conventions
{inline backend conventions}

---

## Codebase Wiki
{ถ้า wiki/ มีอยู่ → ใส่ wiki rules}
{ถ้าไม่มี → ลบ section นี้}

---

## อัปเดตเมื่อมีการเปลี่ยนแปลง
ถ้าแก้ไขสิ่งเหล่านี้ → อัปเดต CLAUDE.md และ DESIGN_SYSTEM.md ทันที:
- เพิ่ม component ใหม่ใน {shared component path}
- เพิ่ม CSS variable/token ใหม่
- เปลี่ยน pattern หลัก (card/button/input/table)
{ถ้ามี backend} - เปลี่ยน backend response format
```

---

### AGENTS.md และ GEMINI.md

```markdown
## MANDATORY: Read before starting

### ⚠️ Confirm before editing — never edit without approval
Before modifying any file, you MUST:
1. Analyze what needs to change
2. List every change as bullet points (which file, what action)
3. Wait for user confirmation, then proceed

> Reason: Prevents misunderstanding and reduces wasted tokens from rework.

---

**Read `DESIGN_SYSTEM.md` before writing any UI, component, or CSS.**

**Update `DESIGN_SYSTEM.md` immediately when you:**
- Add a new component to {shared component path}
- Add a new CSS variable/token
- Change any pattern (card / button / input / table)
- Change any font or typography token
{ถ้ามี backend} - Change backend response format

> If not updated — next session AI will read stale rules and revert to old patterns.

---

## Codebase Wiki
Wiki at `wiki/`. Always check `wiki/index.md` first.
- ✅ = read note instead of source
- ⬜ = create note on-demand before answering
- ⚠️ = warn user note may be stale
Max 2-3 files per query.
```

---

## Token Budget

| ขั้นตอน | ไฟล์ที่อ่าน | Token โดยประมาณ |
|---|---|---|
| package.json | 1 | ~300 |
| Glob components | 0 (แค่ paths) | ~100 |
| Sample components | 3 | ~600 |
| Style files | 1-2 | ~400 |
| Backend sample | 1 | ~300 |
| Rule files เดิม | 2-4 | ~800 |
| **รวม** | **8-11 ไฟล์** | **~2,500** |

เป้าหมาย: ใช้ไม่เกิน 3,000 token ต่อการรัน 1 ครั้ง

---

## หมายเหตุ

- ห้ามอ่านไฟล์ component ทุกตัว — อ่านแค่ 3 ตัวอย่าง
- ห้าม overwrite manual rules ที่ผู้ใช้เขียนเอง — merge เสมอ
- ถ้า project ไม่มี backend → ลบ Backend Conventions section ออกจากทุกไฟล์
- ถ้า project ไม่มี dark mode → ลบ dark: rules ออก
- ถ้า project ใช้ Vue/Svelte → ปรับ syntax ใน template ให้ตรง (.vue SFC, etc.)
- รัน `/design-sync` ซ้ำได้ทุกครั้งที่ project เปลี่ยนแปลงมาก
