---
target: all pages
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-01T16-47-27Z
slug: react-app-client-src-pages-all-pages
---
# Critique — ทุกหน้า (Customer + Admin)

ขอบเขต: ทุกหน้าใน `react-app/client/src` — ฝั่งลูกค้า (Home, Login, Register, Cart, Checkout, Thankyou, MyOrders, PublicLayout) และฝั่งแอดมิน (Dashboard, Products, Users, Orders, OrderView, Dividend, Loyverse, AdminLayout)

## Design Health Score (รวมทั้งแอป)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | ฝั่งลูกค้ามี skeleton/live แล้ว แต่ตารางแอดมินไม่มี loading state เลย (ขึ้นตารางว่างก่อน) |
| 2 | Match System / Real World | 4 | ภาษาไทยเป็นธรรมชาติทั้งแอป |
| 3 | User Control and Freedom | 3 | modal มี cancel/X, มี confirm ก่อนลบ; Dividend search ไม่มีปุ่มล้าง |
| 4 | Consistency and Standards | 2 | แอดมินใช้ปุ่ม ad-hoc (rounded-full bg-emerald/red/amber) + อิโมจิปนไอคอน + cyan ใน header |
| 5 | Error Prevention | 3 | Swal confirm ก่อน destructive, phone pattern, qty clamp |
| 6 | Recognition Rather Than Recall | 3 | nav/ป้ายชัด แต่ปุ่มจัดการแอดมินเป็นอิโมจิล้วน (👁️✔✖🗑️) พึ่ง title |
| 7 | Flexibility and Efficiency | 2 | ไม่มี keyboard shortcut/bulk action; Dividend search ต้องกดส่ง |
| 8 | Aesthetic and Minimalist | 3 | ลูกค้าสะอาด; แอดมินมีอิโมจิรก + การ์ดเรทดำๆ ดูยัด |
| 9 | Error Recovery | 3 | Swal error มีข้อความ, OrderView/Checkout มี error state |
| 10 | Help and Documentation | 2 | มี contextual help บางจุด (รูปแบบ CSV, helper Checkout, คำอธิบาย Loyverse) |
| **Total** | | **27/40** | **Acceptable** (ฝั่งลูกค้าดึงขึ้น แอดมินดึงลง) |

## Anti-Patterns Verdict
**LLM:** ฝั่งลูกค้า **ไม่ดูเป็น AI slop** — สะอาด มีลำดับชั้น โทนแบรนด์ชัด แต่ฝั่งแอดมินมี tell แบบ "งานรีบ": **อิโมจิเป็นปุ่ม/หัวข้อ** (📋💰📦👁️✔✖🗑️🖨️⬅️) และลิงก์ **cyan-300** ใน header (cyan-on-dark เป็น tell คลาสสิก) — ทั้งคู่ขัดกับ PRODUCT.md ที่ห้ามอิโมจิ/สีนอกแบรนด์

**Deterministic scan (detector):** **0 จุด ทั้งทรี** ✅ (detector ไม่จับอิโมจิ/cyan ตรงๆ จึงเป็นข้อสังเกตจาก LLM)

**Visual overlays:** ไม่มี — เซสชันนี้ไม่มี browser automation

## Overall Impression
แอปนี้ "เล่าสองเสียง": **เส้นทางลูกค้าเหมือนสินค้าจริง** (สะอาด น่าเชื่อถือ มี reassurance ตอน checkout) แต่ **แดชบอร์ดแอดมินเหมือน prototype** — อิโมจิเป็นปุ่ม, ปุ่มสไตล์ไม่ตรงกัน, ตารางไม่มี loading โอกาสใหญ่สุดคือ **ยกฝั่งแอดมินให้ขึ้นมาอยู่มาตรฐานเดียวกับฝั่งลูกค้า** แล้วคะแนนรวมจะกระโดด

## What's Working
- **เส้นทางลูกค้า (Home → Cart → Checkout)** สะอาด ลำดับชั้นชัด; Checkout มี reassurance (สิทธิประโยชน์สมาชิก + confirm dialog) ดีมาก
- **Contextual help** โผล่ถูกที่: รูปแบบคอลัมน์ CSV ในหน้านำเข้า, helper เวลานัดรับใน Checkout, คำอธิบายการล็อกอินใน Loyverse
- **Error prevention แน่น**: confirm ก่อนลบ/ยกเลิกทุกจุด, pattern เบอร์โทร, clamp จำนวนตามสต็อก
- **Detector สะอาด 0 จุดทั้งแอป** — ไม่มี gradient text/side-tab/AI palette หลงเหลือ

## Priority Issues

- **[P1] แอดมินใช้อิโมจิเป็นปุ่ม/หัวข้อ**
  - **Why:** ขัดแบรนด์ (PRODUCT.md ห้ามอิโมจิ), a11y พัง (screen reader อ่าน "eye/check mark"), เป้าแตะเล็ก, ดูไม่โปร — `Orders.jsx` (👁️✔✖🗑️), `OrderView.jsx` (⬅️🖨️📦), หัวข้อ `Orders/Dividend` (📋💰)
  - **Fix:** เปลี่ยนเป็น Bootstrap icon + `aria-label` และใช้ปุ่มกลาง `.btn-*`
  - **Suggested command:** `$impeccable polish`

- **[P1] ตารางแอดมินไม่มี loading state**
  - **Why:** `Users/Orders/Products/Dividend` ขึ้นตารางว่างก่อนข้อมูลมา และ empty state ("ยังไม่มี/ไม่พบ") เด้งระหว่างโหลด ทำให้สับสนว่า "ว่างจริง" หรือ "กำลังโหลด"
  - **Fix:** เพิ่ม skeleton/spinner และแยกสถานะ loading ออกจาก empty
  - **Suggested command:** `$impeccable harden`

- **[P2] ปุ่ม/คอนโทรลแอดมินสไตล์ไม่ตรงกัน**
  - **Why:** ใช้ ad-hoc `rounded-full bg-emerald/red/amber`, การ์ดเรทพื้นดำ, ปนกับ `.btn-primary` ทำให้ดูไม่เป็นระบบเดียว
  - **Fix:** รวมเป็น `.btn-primary`/`.btn-secondary` + token สีเดียวกัน
  - **Suggested command:** `$impeccable distill`

- **[P2] Dividend search ต้องกดส่ง (ไม่ live, ไม่มีปุ่มล้าง)**
  - **Why:** ปัญหาเดียวกับที่เพิ่งแก้ในหน้า Home แต่ยังค้างที่แอดมิน
  - **Fix:** debounce + ปุ่มล้าง
  - **Suggested command:** `$impeccable harden`

- **[P2] ลิงก์ Admin ใน header เป็น cyan-300 (นอกพาเลตแบรนด์)**
  - **Why:** cyan-on-dark เป็น AI tell และไม่ใช่สีแบรนด์ (น้ำเงิน/เหลือง/เขียว)
  - **Fix:** ใช้ brand-yellow/ขาว
  - **Suggested command:** `$impeccable colorize`

- **[P3] ตารางแอดมินไม่ scroll แนวนอนบนจอเล็ก**
  - **Why:** wrapper `overflow-hidden` ตัดตารางที่กว้างเกินบนมือถือ
  - **Fix:** ใช้ `overflow-x-auto`
  - **Suggested command:** `$impeccable adapt`

## Persona Red Flags

**Sam (a11y):** ปุ่มจัดการแอดมินเป็นอิโมจิล้วนใส่แค่ `title` (ไม่มี aria-label) → screen reader อ่านชื่ออิโมจิ; ตารางไม่ประกาศสถานะ loading; role badge มีทั้งสีและข้อความ (ผ่าน)

**Alex (power user / แอดมิน):** อนุมัติออเดอร์ทีละรายการ ไม่มี bulk action; ไม่มี keyboard shortcut; Dividend ค้นหาต้องกดส่ง — งานซ้ำๆ ช้า

**Casey (มือถือ):** เส้นทางลูกค้าใช้นิ้วโป้งได้ดี; แต่ถ้าแอดมินเปิดมือถือ ตารางจะล้น/ตัด

## Minor Observations
- `PublicLayout` header แน่นดี (โลโก้ TK + pill หุ้น/ปันผล) แต่ pill 2 อันอาจล้นบนจอแคบมาก
- `Dividend` การ์ดเรทพื้น `bg-slate-900` ตัดกับธีมสว่าง ดูเป็นเกาะแยก
- หลายปุ่ม destructive ใช้สีแดงสด (#ef4444/#dc3545) สลับกัน — รวมเป็นโทนเดียว

## Questions to Consider
- ถ้ายกฝั่งแอดมินให้ได้มาตรฐานเดียวกับลูกค้า (ปุ่ม/ไอคอน/loading) คะแนนรวมน่าจะขยับจาก 27 → ~32 — เริ่มที่ Orders ก่อนไหม (หน้าที่อิโมจิหนักสุด)?
- ออเดอร์ควรมี bulk action (อนุมัติหลายรายการ) ไหม?
- การ์ดเรทปันผลควรกลมกลืนธีมสว่าง หรือคงพื้นเข้มเพื่อเน้น?
