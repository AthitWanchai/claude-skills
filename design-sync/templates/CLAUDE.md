## RULES — อ่านก่อนทำทุกอย่าง

### ⚠️ ยืนยันก่อนแก้เสมอ — ห้ามลงมือโดยไม่ได้รับอนุญาต
ก่อนแก้ไขไฟล์ใดๆ ต้องทำตามขั้นตอนนี้ทุกครั้ง:
1. วิเคราะห์ว่าจะแก้อะไรบ้าง
2. แสดงรายการเป็น bullet list ชัดๆ (แก้ไฟล์ไหน ทำอะไร)
3. รอผู้ใช้ยืนยันก่อน แล้วค่อยลงมือแก้

> เหตุผล: ป้องกันเข้าใจผิด ลด token ที่เสียไปกับการแก้ซ้ำ

### ก่อนแก้ไฟล์ใดๆ ตรวจสอบ 3 ข้อนี้ก่อนเสมอ:
1. มี component ที่ทำสิ่งนี้อยู่แล้วใน `{{IMPORT_PATH}}` ไหม?
2. ใช้ CSS variable/token หรือ hardcode สี?
3. {{DARK_MODE_CHECK}}

---

## Design Tokens — ห้าม hardcode
```
{{CSS_VARS}}
```

## Components — import จาก `{{IMPORT_PATH}}` เสมอ ห้ามสร้างเอง
{{COMPONENT_TABLE}}

## Card Pattern
```tsx
{{CARD_PATTERN}}
```

## Table
```tsx
{{TABLE_PATTERN}}
```

{{BACKEND_SECTION}}

## Codebase Wiki
wiki อยู่ที่ `wiki/` — ดู `wiki/index.md` ก่อนเสมอ
- Status ✅ → อ่าน note แทนไฟล์ต้นทาง
- Status ⬜ → สร้าง note ก่อนตอบ
- Status ⚠️ → แจ้งผู้ใช้ก่อน
- โหลดสูงสุด 2-3 ไฟล์ต่อคำถาม

---

## อัปเดตเมื่อมีการเปลี่ยนแปลง
ถ้าแก้ไขสิ่งเหล่านี้ → อัปเดต `CLAUDE.md` และ `DESIGN_SYSTEM.md` ทันที:
- เพิ่ม component ใหม่ใน `{{IMPORT_PATH}}`
- เพิ่ม CSS variable/token ใหม่
- เปลี่ยน card/button/input/table pattern
{{BACKEND_UPDATE_RULE}}
