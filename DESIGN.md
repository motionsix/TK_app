---
name: TK EASY STORE
description: ระบบร้านค้าสหกรณ์โรงเรียน สะอาด เรียบ น่าเชื่อถือ บนมือถือเป็นหลัก
colors:
  brand-blue: "#0056b3"
  brand-dark: "#003d80"
  brand-yellow: "#ffc107"
  brand-green: "#10b981"
  ink: "#1e293b"
  body: "#334155"
  muted: "#64748b"
  surface: "#ffffff"
  canvas: "#f8fafc"
  border: "#e2e8f0"
typography:
  display:
    fontFamily: "Prompt, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Prompt, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Prompt, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Prompt, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.surface}"
  chip-accent:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.brand-dark}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: TK EASY STORE

## 1. Overview

**Creative North Star: "เคาน์เตอร์สหกรณ์ที่ไว้ใจได้ (The Trusted Co-op Counter)"**

ระบบนี้คือเคาน์เตอร์ร้านสหกรณ์โรงเรียนในรูปแบบดิจิทัล: เป็นระเบียบ อ่านง่าย และซื่อตรงเรื่องตัวเลข เหมือนพนักงานสหกรณ์ที่สุภาพและทำงานเร็ว ผู้ซื้อส่วนใหญ่เป็นนักเรียนที่หยิบมือถือขึ้นมาใช้ช่วงพักสั้นๆ ดังนั้นทุกอย่างต้องชัดในแตะเดียว — ราคา สต็อก ปุ่มสั่งซื้อ ยอดหุ้น/ปันผล ฝั่งแอดมินคือเครื่องมือทำงานที่เน้นความหนาแน่นของข้อมูลที่อ่านสบายและการกระทำที่รวดเร็ว

โทนหลักคือสีน้ำเงินสหกรณ์ที่ดูน่าเชื่อถือแบบสถาบัน ตัดด้วยสีเหลืองเป็นจุดเน้นที่อบอุ่นและเป็นมิตร ความรู้สึก "สนุก" มาจากความลื่นไหลและความชัดเจน ไม่ใช่จากสีสันจัดจ้านหรือลูกเล่นแบบของเล่นเด็ก

ระบบนี้ **ปฏิเสธ**: gradient text, glassmorphism เกินจำเป็น, การ์ดมุมโค้งเว่อร์ (24px ขึ้นไป), การ์ดไอคอน+หัวข้อ+ข้อความซ้ำๆ เหมือนกันทั้งหน้า, eyebrow ตัวพิมพ์ใหญ่เล็กๆ เหนือทุกหัวข้อ, หน้าตาแบบ SaaS template และตัวอักษรสีเทาจางบนพื้นจางจนอ่านยาก

**Key Characteristics:**
- Mobile-first ฝั่งผู้ซื้อ, density-first ฝั่งแอดมิน
- น้ำเงินคือเสียงหลัก เหลืองคือจุดเน้นที่ใช้อย่างประหยัด
- ตัวเลขเรื่องเงิน (ราคา/หุ้น/ปันผล) เด่นและซื่อตรงเสมอ
- ความสม่ำเสมอของ component สำคัญกว่าความเซอร์ไพรส์

## 1.1 Theming (Light / Dark)

ระบบใช้ **semantic tokens** เป็นตัวขับสีทั้งหมด เพื่อรองรับโหมดสว่าง/มืดและความสม่ำเสมอข้ามหน้า

- ประกาศ token เป็น CSS variables ใน `index.css` (`--canvas`, `--surface`, `--surface-2`, `--ink`, `--body`, `--muted`, `--line`, `--accent`) แบบ RGB channels เพื่อให้ Tailwind ใช้ opacity modifier ได้
- Tailwind map เป็นคลาส semantic: `bg-canvas`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-body`, `text-muted`, `border-line`, `text-accent`
- **ห้าม hardcode** `bg-white` / `text-slate-*` / `bg-slate-*` บน UI element ที่ต้องสลับธีม ให้ใช้ token เสมอ; สีสถานะ (เขียว/แดง/เหลือง) ใส่ตัวแปร `dark:` กำกับ
- `darkMode: 'class'` — สลับด้วยคลาส `.dark` บน `<html>`; ค่าเริ่มต้นตามระบบ (`prefers-color-scheme`) และมี `ThemeToggle` ให้ override เก็บใน `localStorage('tk-theme')` มี inline script กัน FOUC ใน `index.html`
- แบรนด์น้ำเงิน/เหลือง/เขียวคงเดิมทั้งสองธีม; ในโหมดมืดลิงก์/ตัวเลขเน้นใช้ `dark:text-accent` (ฟ้าสว่างขึ้น) เพื่อคอนทราสต์
- Sidebar แอดมินและ header ร้านเป็นพื้นเข้มโดยตั้งใจทั้งสองธีม (คงเอกลักษณ์)

## 2. Colors

พาเลตน้ำเงินสถาบันที่จริงจังแต่ไม่แข็ง ตัดด้วยเหลืองอบอุ่นและเขียวสำหรับความสำเร็จ บนพื้นกลางสีเทาอ่อนเย็น

### Primary
- **Cooperative Blue** (#0056b3): สีหลักของแบรนด์ ใช้กับปุ่มหลัก ลิงก์ สถานะที่เลือกอยู่ และ header
- **Deep Navy** (#003d80): น้ำเงินเข้มสำหรับ gradient ของ header และสถานะ hover ของปุ่มหลัก

### Secondary
- **Friendly Yellow** (#ffc107): จุดเน้นที่อบอุ่น ใช้กับโลโก้ ป้ายยอดหุ้น และปุ่ม "เข้าสู่ระบบ" ใช้อย่างประหยัด (≤10% ของหน้าจอ)

### Tertiary
- **Success Green** (#10b981): ใช้กับสถานะสำเร็จ ยอดปันผล และตัวเลขสต็อกที่เพียงพอ

### Neutral
- **Ink** (#1e293b): หัวข้อและข้อความเน้น
- **Body** (#334155): ข้อความเนื้อหาหลัก (contrast ≥ 4.5:1 บนพื้นขาว/เทาอ่อน)
- **Muted** (#64748b): ข้อความรอง/คำอธิบาย ห้ามจางกว่านี้สำหรับเนื้อหาที่ต้องอ่าน
- **Surface** (#ffffff): พื้นการ์ดและแผง
- **Canvas** (#f8fafc): พื้นหลังหน้าจอ
- **Border** (#e2e8f0): เส้นขอบและเส้นแบ่ง

### Named Rules
**The Yellow-Is-Rare Rule.** เหลืองคือจุดเน้น ไม่ใช่พื้นหลัง ใช้กับ "สิ่งที่อยากให้ตาไปหยุด" เท่านั้น (โลโก้, ยอดหุ้น, CTA สำคัญ) ห้ามถมเหลืองเป็นบล็อกใหญ่
**The Money-Is-Loud Rule.** ตัวเลขเงินต้องเป็นหนึ่งในของที่เด่นที่สุดในการ์ด/แถวเสมอ ห้ามให้ราคา/ปันผลกลืนกับข้อความรอง

## 3. Typography

**Display / Body / Label Font:** Prompt (fallback: sans-serif)

**Character:** Prompt เป็นซานส์เซอริฟไทยที่กลม อ่านง่าย เป็นมิตร ใช้ตระกูลเดียวคุมทั้งระบบด้วยน้ำหนักตัวอักษร (300–800) ไม่ผสมฟอนต์อื่นเพื่อความเป็นระเบียบแบบ product UI

### Hierarchy
- **Display** (800, 1.875rem/30px, line-height 1.15, letter-spacing -0.02em): หัวเรื่องหน้า/ชื่อ section ใหญ่ (สเกล rem คงที่ ไม่ fluid)
- **Headline** (700, 1.25rem/20px, line-height 1.3): หัวการ์ด หัวแผง
- **Title** (600, 1.0625rem/17px, line-height 1.35): ชื่อสินค้า ชื่อรายการ
- **Body** (400, 1rem/16px, line-height 1.6): เนื้อหา จำกัดความกว้าง 65–75ch สำหรับ prose
- **Label** (600, 0.8125rem/13px, line-height 1.2): ป้าย ตัวเลขกำกับ badge (ตัวพิมพ์เล็กปกติ ไม่ใช่ ALL CAPS ยาว)

### Named Rules
**The One-Family Rule.** ใช้ Prompt ตระกูลเดียวทั้งระบบ สร้างลำดับชั้นด้วยน้ำหนัก+ขนาด ห้ามเพิ่มฟอนต์ display แยก

## 4. Elevation

ระบบใช้เงาแบบนุ่มและฟุ้งต่ำเพื่อยกการ์ดออกจากพื้น canvas เล็กน้อย ความลึกหลักมาจากการแยกชั้นสี (canvas เทาอ่อน → surface ขาว) มากกว่าเงาเข้ม เงาควรบอกลำดับชั้น ไม่ใช่การตกแต่ง

### Shadow Vocabulary
- **soft** (`box-shadow: 0 10px 30px rgba(2,32,71,0.06)`): เงาพักของการ์ดทั่วไป
- **card** (`box-shadow: 0 18px 40px rgba(2,32,71,0.08)`): การ์ดที่ต้องการเด่นขึ้น เช่น hover ของสินค้า
- **glow** (`box-shadow: 0 12px 28px rgba(0,86,179,0.35)`): เฉพาะปุ่มหลักสีน้ำเงิน เพื่อบอกว่าเป็น action สำคัญ

### Named Rules
**The No-Ghost-Card Rule.** ห้ามใส่ `border: 1px solid` คู่กับเงาฟุ้งกว้าง (blur ≥ 16px) บนการ์ด/ปุ่มเดียวกัน เลือกอย่างใดอย่างหนึ่ง: ขอบคมเส้นเดียว หรือเงานุ่มอย่างเดียว

## 5. Components

### Buttons
- **Shape:** มุมโค้งกลาง (12–16px) ปุ่มสั้น/แท็กใช้ pill ได้
- **Primary:** พื้นน้ำเงิน Cooperative Blue ตัวอักษรขาว หนา padding 12px 20px มีเงา glow
- **Hover / Focus:** เลื่อนขึ้นเล็กน้อย (-2px) เข้มขึ้นเป็น Deep Navy, focus ring น้ำเงินโปร่ง; transition 150–250ms
- **Secondary / Ghost:** พื้นโปร่ง/เทาอ่อน ตัวอักษร ink ขอบ border ใช้สำหรับ action รอง

### Chips
- **Style:** filter pill พื้นเทาอ่อน/ขาว ขอบ border; ตัวที่เลือกอยู่พื้นน้ำเงิน ตัวอักษรขาว
- **State:** มี default / selected ชัดเจน แตะง่าย (สูง ≥ 36px)

### Cards / Containers
- **Corner Style:** 16px (lg) — ห้ามเกิน 16px บนการ์ด
- **Background:** Surface ขาวบน Canvas เทาอ่อน
- **Shadow Strategy:** soft ตอนพัก, card ตอน hover (ดู Elevation)
- **Border:** เส้น border บางหรือไม่มี เลือกอย่างใดอย่างหนึ่งกับเงา
- **Internal Padding:** 16–24px (md–lg)

### Inputs / Fields
- **Style:** พื้น Canvas ขอบ 2px เทาอ่อน มุม 12px
- **Focus:** ขอบเปลี่ยนเป็นน้ำเงิน พื้นเป็นขาว ring น้ำเงินโปร่ง
- **Error / Disabled:** error ขอบ/ข้อความแดงพร้อมข้อความอธิบาย; disabled ลด opacity และปิด pointer

### Navigation
- **Style:** header น้ำเงิน gradient (blue→navy) ติดบนสุด (sticky) โลโก้ TK เหลือง ลิงก์ขาวโปร่ง hover เป็นเหลือง
- **Mobile:** ไอคอนอย่างเดียวบนจอเล็ก ป้ายข้อความซ่อนตาม breakpoint; badge ตะกร้าเป็นวงกลมแดง

## 6. Do's and Don'ts

### Do:
- **Do** ใช้ตัวอักษรเนื้อหาสี Body (#334155) ขึ้นไป ให้ contrast ≥ 4.5:1 เสมอ
- **Do** คุมมุมโค้งการ์ดไว้ที่ 16px และปุ่มที่ 12–16px (pill เฉพาะ tag/badge)
- **Do** ใช้เหลืองเป็นจุดเน้น ≤10% ของหน้าจอ ตาม The Yellow-Is-Rare Rule
- **Do** ทำให้ราคา/หุ้น/ปันผลเป็นของที่เด่นที่สุดในแต่ละการ์ด/แถว
- **Do** ใส่ทางเลือก `prefers-reduced-motion` ให้ทุก animation และ transition 150–250ms
- **Do** รักษา component vocabulary ให้เหมือนกันทุกหน้า (ปุ่ม/อินพุต/การ์ดหน้าตาเดียวกัน)

### Don't:
- **Don't** ใช้ gradient text (background-clip: text) เน้นด้วยน้ำหนัก/ขนาดแทน
- **Don't** ใช้ glassmorphism เป็นค่าเริ่มต้น
- **Don't** ใช้มุมโค้ง 24px ขึ้นไปบนการ์ด (rounded-3xl เดิมถือเป็น tell ต้องลดลง)
- **Don't** ใส่ border 1px คู่กับเงาฟุ้งกว้างบน element เดียวกัน (ghost-card)
- **Don't** ใช้ eyebrow ตัวพิมพ์ใหญ่เล็กๆ หรือเลขลำดับ 01/02/03 เหนือทุก section
- **Don't** วางการ์ดไอคอน+หัวข้อ+ข้อความขนาดเท่ากันซ้ำๆ ทั้งหน้าแบบ SaaS template
- **Don't** ใช้ตัวอักษรสีเทาจางบนพื้นจางจนอ่านยาก
