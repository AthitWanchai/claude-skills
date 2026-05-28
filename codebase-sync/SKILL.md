---
name: "codebase-sync"
description: "Codebase intelligence + design-system enforcement ในตัวเดียว — wiki แบบ lazy (ประหยัด token) + บังคับกฎ design system (ห้าม hardcode สี, ห้ามสร้าง component ซ้ำ, confirm ก่อนแก้). รองรับทุก stack ทุก AI tool"
---

# Codebase Sync

ระบบเดียวที่ทำ 2 อย่าง:
1. **Wiki (ความรู้)** — เข้าใจโค้ดแบบ lazy, on-demand, ประหยัด token
2. **Rules (บังคับ)** — design system, กันสร้างของซ้ำ, กัน hardcode สี, confirm ก่อนแก้

`wiki/index.md` = ศูนย์กลาง routing ทั้งความรู้และกฎ
Root `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` = auto-load → กฎบังคับ inline + ชี้ไป wiki

---

## Global Rules (STRICT — ใช้ทุกโหมด)

- เริ่มที่ `wiki/index.md` เสมอ — เป็น router
- **ห้าม scan ทั้ง wiki / ทั้ง project** — โหลดสูงสุด 2-3 ไฟล์ต่อ task
- แต่ละ note = 300-800 tokens
- อัปเดตไฟล์เดิม > สร้างใหม่
- ห้ามข้อมูลซ้ำข้ามไฟล์
- **Confirm ก่อนแก้ทุกครั้ง** — แสดงรายการ → รอ OK → ค่อยเขียน
- Output: return เฉพาะไฟล์ที่เปลี่ยน + header `### file: path`

---

## Modes (auto-detect จาก intent)

### 1) BUILD — `/codebase-sync` ครั้งแรก

สร้างระบบทั้งหมด **โดยไม่อ่าน source ทั้งโปรเจค**

1. **Scan** (รัน script ถ้ามี Bun/Node — ไม่ใช้ token):
   ```bash
   bun ~/.claude/skills/codebase-sync/scripts/scan-project.ts
   bun ~/.claude/skills/codebase-sync/scripts/extract-tokens.ts [css] [tailwind.config]
   ```
   ถ้าไม่มี → อ่าน `package.json` + glob paths เอง (ดูขั้นตอนใน scan-project.ts)

2. อ่าน **3 component ตัวอย่าง** + **1 style file** + (ถ้ามี backend) **1 route** เท่านั้น

3. แสดงสรุป stack/components/tokens → **รอ confirm**

4. สร้างไฟล์ (ตาม `templates/`):
   - `wiki/index.md` — router: File Map (notes) + ลิงก์ rules + glossary
   - `wiki/rules.md` — **design system เต็ม** (tokens, components, patterns, backend)
   - `wiki/glossary.md` — canonical names (Button, ไม่ใช่ Btn/CustomButton)
   - `wiki/overview.md` — architecture (จาก folder structure)
   - `wiki/todos.md` — เปล่า (รัน LINT เพื่อ scan)
   - `wiki/log.md` — append-only
   - **root** `CLAUDE.md` `AGENTS.md` `GEMINI.md` — กฎบังคับ inline + ชี้ wiki

5. เสนอติดตั้ง auto-sync hook (ดู "Auto-sync Hook" ด้านล่าง)

### 2) UPDATE — เพิ่ม/แก้ component, token, หรือถูก hook เตือน

1. เปิด `wiki/index.md` → หา topic ที่กระทบ
2. แก้ **เฉพาะไฟล์นั้น** — ห้าม rewrite ทั้ง wiki
3. ถ้า component/token เปลี่ยน → อัปเดต `wiki/rules.md` + root rule files ให้ตรง
4. append `wiki/log.md` สั้นๆ
5. ถ้า cross-note dependency → อัปเดต "Used By" ของ note ที่มีอยู่

### 3) QUERY — ถามเรื่องไฟล์/โค้ด

1. เปิด `wiki/index.md` → เลือกไฟล์ที่เกี่ยว (≤2-3)
2. Status ✅ → อ่าน note แทน source
3. Status ⬜ → อ่าน source + สร้าง note (300-800 tokens) + อัปเดต index
4. Status ⚠️ (stale) → แจ้งก่อนตอบ
5. ขาดข้อมูล → บอก "insufficient information" อย่าเดา

### 4) LINT — ตรวจสุขภาพ wiki + rules

1. หา duplicate / inconsistency / stale (เทียบ git timestamp)
2. ตรวจ `wiki/rules.md` ตรงกับ component จริงไหม (มี component ใหม่ที่ยังไม่ลง?)
3. scan `TODO|FIXME|HACK` → อัปเดต `wiki/todos.md`
4. แก้ in-place เฉพาะที่จำเป็น + อัปเดต index ถ้า routing เปลี่ยน

---

## Auto-sync Hook (ทำครั้งเดียว — กัน rules stale)

หลัง BUILD เสนอติดตั้ง pre-commit hook:
1. copy `scripts/check-design-sync.js` + `scripts/setup-hooks.js` เข้าโปรเจค
2. `package.json` → `"scripts": { "prepare": "node scripts/setup-hooks.js" }`
3. รัน `node scripts/setup-hooks.js`

**ผล:** ทุก `git commit` → hook เช็ค component/CSS variable ใหม่กว่า rules ไหม → เตือนให้รัน `/codebase-sync`
ไม่ใช้ token, ไม่บล็อก commit, ทีม clone + `bun install` ได้ hook อัตโนมัติ (ไม่ต้อง husky)

---

## File Roles

| ไฟล์ | หน้าที่ | โหลดเมื่อ |
|---|---|---|
| `wiki/index.md` | router (topic → file) + ลิงก์กฎ | ทุก task (เริ่มที่นี่) |
| `wiki/rules.md` | design system เต็ม (บังคับ) | ก่อนแก้ UI |
| `wiki/glossary.md` | canonical names | ตอนตั้งชื่อ |
| `wiki/notes/*.md` | ความรู้ atomic 1 ไฟล์/1 source | on-demand |
| `wiki/overview.md` | architecture | ตอนเข้าใจภาพรวม |
| `wiki/log.md` | changelog | append เท่านั้น |
| root `CLAUDE/AGENTS/GEMINI.md` | กฎบังคับ inline + pointer | AI auto-load |

---

## Token Budget

| งาน | ไฟล์ | Token |
|---|---|---|
| BUILD | package.json + 3 comp + 1 css + 1 route | ~1,400 |
| QUERY | index + 1-2 notes | ~600 |
| UPDATE | index + 1-2 ไฟล์ | ~500 |
| Hook (commit) | 0 — Node script | **0** |

---

## หมายเหตุ
- ไม่มี backend → ลบ Backend section ทุกไฟล์
- ไม่มี dark mode → ลบ dark: rules
- Vue/Svelte → ปรับ syntax ใน rules.md
- แทนที่ codebase-map + design-sync เดิม (รวมเป็นตัวนี้)
