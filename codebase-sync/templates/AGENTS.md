## MANDATORY: Read before starting

### ⚠️ Confirm before editing — never edit without approval
Before modifying any file, you MUST:
1. Analyze what needs to change
2. List every change as bullet points (which file, what action)
3. Wait for user confirmation, then proceed

> Reason: Prevents misunderstanding and reduces wasted tokens from rework.

---

## Codebase Wiki — start at `wiki/index.md` (router)
- Design system rules → `wiki/rules.md` (read before writing any UI/CSS)
- Component naming → `wiki/glossary.md` (canonical names — never invent variants)
- Understanding files: ✅ read note | ⬜ create note first | ⚠️ warn if stale
- Max 2-3 files per task — never scan the whole wiki/project

**Update `wiki/rules.md` (run `/codebase-sync`) immediately when you:**
- Add a new component to `{{IMPORT_PATH}}`
- Add a new CSS variable or design token
- Change any pattern (card / button / input / table)
{{BACKEND_UPDATE_RULE}}

> If not updated — next session AI reads stale rules and reverts to old patterns.
