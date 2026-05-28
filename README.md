# claude-skills

คอลเลกชัน Claude Code Skills สำหรับทีม — ช่วยลด token, บังคับ design system, และทำให้ทุกคนในทีมทำงานไปในทิศทางเดียวกัน

A collection of Claude Code Skills for teams — reduces token usage, enforces design systems, and keeps everyone aligned.

---

## Skills ที่มี / Available Skills

| Skill | Command | คำอธิบาย / Description |
|---|---|---|
| [design-sync](./design-sync/) | `/design-sync` | สแกน project แล้ว generate ไฟล์กฎ AI ให้อัตโนมัติ / Scans your project and auto-generates AI rule files |

---

## วิธีติดตั้ง / Installation

### 1. Clone repo นี้
```bash
git clone https://github.com/AthitWanchai/claude-skills.git
```

### 2. Copy สกิลที่ต้องการไปไว้ที่ `~/.claude/skills/`

**macOS / Linux:**
```bash
cp -r claude-skills/design-sync ~/.claude/skills/
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse claude-skills\design-sync $env:USERPROFILE\.claude\skills\
```

### 3. Restart Claude Code แล้วใช้งานได้เลย

---

## วิธีใช้งาน / Usage

### `/design-sync`

รันที่ root ของโปรเจคที่ต้องการ:

```
/design-sync
```

สกิลจะ:
1. รัน `scripts/scan-project.ts` → detect stack + glob components + extract tokens
2. แสดงสรุปสิ่งที่พบและรอยืนยัน
3. Generate/update ไฟล์เหล่านี้จาก `templates/`:
   - `DESIGN_SYSTEM.md` — single source of truth สำหรับทีม
   - `CLAUDE.md` — กฎสำหรับ Claude Code
   - `AGENTS.md` — กฎสำหรับ OpenAI Codex
   - `GEMINI.md` — กฎสำหรับ Gemini

**รองรับทุก stack:** Next.js, Nuxt, Vite, Remix, SvelteKit, Vue, React, Tailwind, MUI, Chakra ฯลฯ

**ใช้ได้กับทุกโปรเจค** — ไม่ hardcode path ใดๆ

---

## Auto-sync Hook (กัน DESIGN_SYSTEM.md stale)

เพื่อให้ไฟล์กฎไม่ล้าสมัยเมื่อเพิ่ม component หรือเปลี่ยน CSS variable
`/design-sync` ติดตั้ง pre-commit hook ให้อัตโนมัติ — **ไม่ต้องใช้ husky**

```
developer เพิ่ม component / แก้ CSS var
        ↓
git commit
        ↓
hook เช็ค: ไฟล์ใหม่กว่า DESIGN_SYSTEM.md ไหม?
        ↓
ถ้าใช่ → เตือนให้รัน /design-sync (ไม่บล็อก commit)
```

**คุณสมบัติ:**
- ✅ ไม่ใช้ token / ทำงาน offline (เป็น Node script ล้วน เครดิตหมดก็ทำงาน)
- ✅ ทีม clone repo + `bun install` → hook ติดอัตโนมัติ (ผ่าน `prepare` script)
- ✅ เช็คทั้ง component และ CSS variable (`globals.css`, `variables.css` ฯลฯ)
- ✅ ไม่บล็อก commit — แค่เตือน

**ติดตั้งเอง (ถ้าต้องการ):**
```json
// package.json
"scripts": { "prepare": "node scripts/setup-hooks.js" }
```
แล้ว copy `scripts/check-design-sync.js` + `scripts/setup-hooks.js` เข้าโปรเจค

---

## ทำไมต้องใช้ / Why Use This

| ปัญหา | แก้ด้วย |
|---|---|
| AI สร้าง component ซ้ำ ทั้งที่มีอยู่แล้ว | `DESIGN_SYSTEM.md` บอก component ที่มีครบ |
| AI hardcode สีแทนที่จะใช้ CSS variable | Design tokens ถูก inline ใน rule files |
| AI แต่ละคนในทีม generate style ไม่เหมือนกัน | ทุกคน share rule files เดียวกัน |
| AI ลงมือแก้เลยโดยไม่ถามก่อน | rule บังคับ confirm ก่อน edit ทุกครั้ง |
| เปลี่ยน component แล้วลืมอัปเดต rule | `/design-sync` sync ให้ตรงทุกครั้ง |

---

## Commit ไฟล์ไหนขึ้น Git / What to Commit

```
DESIGN_SYSTEM.md   ✅ commit — shared source of truth
CLAUDE.md          ✅ commit — สำหรับ Claude Code
AGENTS.md          ✅ commit — สำหรับ Codex
GEMINI.md          ✅ commit — สำหรับ Gemini
```

ทีมที่ pull repo จะได้กฎเดียวกันทันที โดยไม่ต้อง setup เพิ่ม

---

## Contributing

Pull requests ยินดีต้อนรับครับ — ถ้าอยากเพิ่มสกิลใหม่ สร้าง folder ใหม่ใน format:
```
your-skill-name/
  SKILL.md       ← frontmatter: name + description + workflow
  scripts/       ← TypeScript/JS scripts (optional)
  templates/     ← output templates (optional)
```
