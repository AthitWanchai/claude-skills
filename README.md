# claude-skills

คอลเลกชัน Claude Code Skills สำหรับทีม — ช่วยลด token, บังคับ design system, และทำให้ทุกคนในทีมทำงานไปในทิศทางเดียวกัน

A collection of Claude Code Skills for teams — reduces token usage, enforces design systems, and keeps everyone aligned.

---

## Skills ที่มี / Available Skills

| Skill | Command | คำอธิบาย / Description |
|---|---|---|
| [codebase-sync](./codebase-sync/) | `/codebase-sync` | Wiki ความรู้โค้ด (lazy, ประหยัด token) + บังคับกฎ design system ในตัวเดียว / Codebase wiki + design-system enforcement in one |

---

## วิธีติดตั้ง / Installation

### 1. Clone repo นี้
```bash
git clone https://github.com/AthitWanchai/claude-skills.git
```

### 2. Copy สกิลที่ต้องการไปไว้ที่ `~/.claude/skills/`

**macOS / Linux:**
```bash
cp -r claude-skills/codebase-sync ~/.claude/skills/
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse claude-skills\codebase-sync $env:USERPROFILE\.claude\skills\
```

### 3. Restart Claude Code แล้วใช้งานได้เลย

---

## วิธีใช้งาน / Usage

### `/codebase-sync`

รันที่ root ของโปรเจค — มี 4 โหมด (auto-detect จาก intent):

| โหมด | เมื่อไหร่ | ทำอะไร |
|---|---|---|
| **BUILD** | ครั้งแรก | scan project → สร้าง `wiki/` + root rule files |
| **UPDATE** | เพิ่ม/แก้ component, token | อัปเดตเฉพาะไฟล์ที่กระทบ |
| **QUERY** | ถามเรื่องไฟล์/โค้ด | อ่าน note (≤2-3 ไฟล์) ตอบ |
| **LINT** | ตรวจสุขภาพ | หา duplicate/stale + scan TODO |

ไฟล์ที่สร้าง:
```
wiki/
  index.md       ← router (ความรู้ + กฎ) — เริ่มที่นี่เสมอ
  rules.md       ← design system เต็ม (บังคับ)
  glossary.md    ← canonical component names
  overview.md    ← architecture
  notes/*.md     ← ความรู้ราย-ไฟล์ (lazy, on-demand)
  todos.md       ← TODO/FIXME
  log.md         ← changelog
CLAUDE.md / AGENTS.md / GEMINI.md   ← root, auto-load → กฎบังคับ + ชี้ wiki
```

**รองรับทุก stack:** Next.js, Nuxt, Vite, Remix, SvelteKit, Vue, React, Tailwind, MUI, Chakra ฯลฯ
**ใช้ได้กับทุกโปรเจค** — ไม่ hardcode path ใดๆ

---

## สองหน้าที่ในตัวเดียว / Two Jobs, One Skill

| | Wiki (ความรู้) | Rules (บังคับ) |
|---|---|---|
| ตอบ | "โค้ดนี้ทำอะไร" | "เขียนยังไงให้ถูกกฎ" |
| Output | `wiki/notes/*.md` | `wiki/rules.md` + root rule files |
| โหลด | on-demand (ประหยัด token) | auto-load (CLAUDE.md ฯลฯ) |

`wiki/index.md` เชื่อมทั้งสองเข้าด้วยกัน — เริ่มที่นี่ ได้ทั้งความรู้และกฎ

---

## Auto-sync Hook (กัน rules stale)

`/codebase-sync` ติดตั้ง pre-commit hook ให้ — **ไม่ต้องใช้ husky**

```
developer เพิ่ม component / แก้ CSS var
        ↓ git commit
hook เช็ค: ไฟล์ใหม่กว่า wiki/rules.md ไหม?
        ↓ ถ้าใช่
เตือนให้รัน /codebase-sync (ไม่บล็อก commit)
```

- ✅ ไม่ใช้ token / ทำงาน offline (Node script ล้วน — เครดิตหมดก็ทำงาน)
- ✅ ทีม clone + `bun install` → hook ติดอัตโนมัติ (ผ่าน `prepare` script)
- ✅ เช็คทั้ง component และ CSS variable

**ติดตั้งเอง:**
```json
// package.json
"scripts": { "prepare": "node scripts/setup-hooks.js" }
```
แล้ว copy `scripts/check-design-sync.js` + `scripts/setup-hooks.js` เข้าโปรเจค

---

## ทำไมต้องใช้ / Why Use This

| ปัญหา | แก้ด้วย |
|---|---|
| AI สร้าง component ซ้ำ | `wiki/rules.md` + `glossary.md` บอกของที่มี |
| AI hardcode สี | design tokens inline ใน root rule files |
| AI แต่ละตัว generate ไม่เหมือนกัน | ทุกตัว share rule files เดียวกัน |
| AI แก้เลยไม่ถามก่อน | บังคับ confirm ก่อน edit |
| อ่านทั้งโปรเจคเปลือง token | wiki lazy — โหลด ≤2-3 ไฟล์/task |
| เปลี่ยน component แล้วลืม sync | hook เตือนตอน commit |

---

## Commit ไฟล์ไหนขึ้น Git

```
wiki/              ✅ commit — ความรู้ + กฎ shared
CLAUDE.md          ✅ commit — Claude Code
AGENTS.md          ✅ commit — Codex
GEMINI.md          ✅ commit — Gemini
```
ทีม pull → ได้ทั้งความรู้และกฎทันที ไม่ต้อง setup เพิ่ม

---

## Contributing

```
your-skill-name/
  SKILL.md       ← frontmatter: name + description + workflow
  scripts/       ← TypeScript/JS scripts (optional)
  templates/     ← output templates (optional)
```
