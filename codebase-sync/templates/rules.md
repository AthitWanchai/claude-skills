# {{PROJECT_NAME}} — Design System & UI Rules

> อ่านไฟล์นี้ก่อนเขียน UI ทุกครั้ง — ห้ามสร้าง component หรือ style ใหม่โดยไม่เช็คที่นี่ก่อน
> Last synced: {{DATE}} | Stack: {{FRAMEWORK}} + {{CSS}}

---

## Stack
| Layer | Technology |
|---|---|
| Framework | {{FRAMEWORK}} |
| CSS | {{CSS}} |
| State | {{STATE}} |
| Animation | {{ANIMATION}} |
| Backend | {{BACKEND}} |
| ORM | {{ORM}} |

---

## Design Tokens — ห้าม hardcode สี

```
{{CSS_VARS}}
```

### Dark Mode
{{DARK_MODE_RULES}}

---

## Components

### Shared UI — import จาก `{{IMPORT_PATH}}`

{{COMPONENT_TABLE}}

### Feature / Page Components
{{FEATURE_COMPONENTS}}

---

## Patterns

### Card
```tsx
{{CARD_PATTERN}}
```

### Table
```tsx
{{TABLE_PATTERN}}
```

### Animation
{{ANIMATION_PATTERN}}

---

{{BACKEND_SECTION}}

## ❌ ห้ามทำ — ✅ ให้ทำแทน

| ❌ ห้าม | ✅ ให้ทำ |
|---|---|
| hardcode สี `#ffffff` | ใช้ CSS var หรือ Tailwind token |
| `<button className="...">` เอง | ใช้ component จาก shared UI |
| `<input className="...">` เอง | ใช้ component จาก shared UI |
| สร้าง component ใหม่ | เช็ค shared UI ก่อน |
