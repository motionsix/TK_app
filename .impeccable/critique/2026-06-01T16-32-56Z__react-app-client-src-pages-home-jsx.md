---
target: storefront Home
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-06-01T16-32-56Z
slug: react-app-client-src-pages-home-jsx
---
# Critique — Storefront Home (`react-app/client/src/pages/Home.jsx`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | โหลดสินค้าใช้ข้อความเปล่าๆ แทนทั้งกริด ไม่มี skeleton; ค้นหา/เปลี่ยนหมวดไม่มีตัวบอกสถานะระหว่างดึง |
| 2 | Match System / Real World | 4 | ภาษาไทยเป็นธรรมชาติ ใช้คำ/ไอคอนที่คุ้นเคย (ตะกร้า, คงเหลือ) |
| 3 | User Control and Freedom | 3 | ไม่มีปุ่มล้างคำค้น/ล้างตัวกรอง; ค้นหาต้องกด Enter |
| 4 | Consistency and Standards | 3 | หน้า Home สม่ำเสมอหลังรีดีไซน์ แต่บางหน้ายังต่าง (violet, side-tab) |
| 5 | Error Prevention | 3 | จำนวน clamp ตามสต็อก, กันกดซื้อตอนยังไม่ล็อกอิน |
| 6 | Recognition Rather Than Recall | 4 | สินค้ามีรูป/หมวด/สต็อกครบ เห็นตัวเลือกชัด |
| 7 | Flexibility and Efficiency | 2 | ไม่มี keyboard shortcut, ไม่มี live search, ไม่มี bulk |
| 8 | Aesthetic and Minimalist Design | 4 | สะอาด ลำดับชั้นชัด (รูป→ชื่อ→ราคา→สต็อก→CTA) |
| 9 | Error Recovery | 3 | error เพิ่มตะกร้าแจ้งด้วย Swal; empty state มีคำแนะนำ |
| 10 | Help and Documentation | 2 | ไม่มี help/คำอธิบายใดๆ (ร้านง่ายๆ อาจไม่จำเป็นมาก) |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment:** หน้า Home **ไม่ดูเป็น AI slop** หลังรีดีไซน์ — ไม่มี gradient text, มุมโค้งคุมที่ 16–24px, ราคาเป็นสีเข้มหนักแน่น (ไม่ใช่แดง), ตัด animation เด้งซ้ำทุกการ์ดและอิโมจิลอยออกแล้ว hero gradient เป็นสีแบรนด์ (น้ำเงิน→กรมท่า) ซึ่งตั้งใจ ไม่ใช่ม่วง/ฟ้า-นีออนที่เป็น tell

**Deterministic scan (detector):** หน้า Home **สะอาด 0 จุด** แต่สแกนทั้ง pages/components เจอ 3 จุดในหน้าอื่น:
- `admin/Loyverse.jsx:152,161` — ai-color-palette (สีม่วง violet ในการ์ด "ผูกแอดมิน")
- `MyOrders.jsx:103` — side-tab accent (`border-l-4` แถบสีข้างการ์ด)

**Visual overlays:** ไม่มี (เซสชันนี้ไม่มี browser automation) — ใช้การรีวิวจากซอร์สแทน

## Overall Impression
หน้า Home แข็งแรงด้านความสะอาดและลำดับชั้น จุดที่ฉุดคะแนนคือ **สถานะระหว่างโหลด/ค้นหา** ที่ยังดิบ (ข้อความเปล่าแทนทั้งกริด ทำให้จอกระพริบ/เด้ง โดยเฉพาะบนมือถือ) โอกาสใหญ่สุดคือทำ feedback ตอนค้นหา/โหลดให้ลื่นและไม่ทำให้กริดหายทั้งหน้า

## What's Working
- **ลำดับชั้นการ์ดสินค้าชัด**: รูป → หมวด → ชื่อ → ราคาเด่น → สต็อก → ปุ่ม อ่านปราดเดียวรู้เรื่อง
- **ตัวเลขเงินเด่นและซื่อตรง** ตาม Money-Is-Loud Rule; สถานะสต็อกสื่อด้วยข้อความ+สี (ไม่พึ่งสีอย่างเดียว)
- **โทนสะอาด มืออาชีพ** คุมมุมโค้ง/เงา/ปุ่มสม่ำเสมอผ่านคลาสกลาง

## Priority Issues

- **[P1] ค้นหา/กรองไม่มี feedback และต้องกด Enter**
  - **Why:** ผู้ใช้ (โดยเฉพาะมือถือ) พิมพ์แล้วเหมือนไม่มีอะไรเกิดขึ้น และไม่มีปุ่มล้างคำค้น/ล้างตัวกรอง
  - **Fix:** ทำ live search แบบ debounce, เพิ่มปุ่มล้าง (×), แสดงจำนวนผลลัพธ์
  - **Suggested command:** `$impeccable harden`

- **[P1] สถานะโหลดแทนที่กริดทั้งหน้า**
  - **Why:** ตอนเปลี่ยนหมวด/ค้นหา กริดหายกลายเป็นข้อความ "กำลังโหลดสินค้า..." จอกระพริบและ scroll เด้ง
  - **Fix:** ใช้ skeleton cards คงโครงกริดไว้ หรือ overlay จางๆ บนกริดเดิม
  - **Suggested command:** `$impeccable harden`

- **[P2] สีม่วง (violet) ในการ์ด "ผูกแอดมิน" = AI palette tell**
  - **Why:** detector จับว่าเป็นสีที่เป็น tell และหลุดจากพาเลตแบรนด์ (น้ำเงิน/เหลือง/เขียว)
  - **Fix:** เปลี่ยนเป็นสีแบรนด์ (เช่น น้ำเงิน หรือเทาเข้ม)
  - **Suggested command:** `$impeccable colorize`

- **[P2] `border-l-4` แถบสีข้างการ์ดใน MyOrders = side-tab ban**
  - **Why:** แถบสีข้างหนาเป็น tell ของ AI ตาม Absolute bans
  - **Fix:** ใช้ขอบเต็ม/พื้นสีจาง/ไอคอนนำ แทนแถบข้าง
  - **Suggested command:** `$impeccable polish`

- **[P2] `<select>` หมวดหมู่ไม่มี label (a11y)**
  - **Why:** screen reader ไม่รู้บริบท; first-timer ต้องเดา
  - **Fix:** ใส่ `aria-label`/label ที่มองเห็น
  - **Suggested command:** `$impeccable audit`

## Persona Red Flags

**Casey (มือถือ ใช้นิ้วโป้ง):** ค้นหาต้องกด Enter; ตอนโหลดกริดหายทั้งจอทำให้เสียตำแหน่ง scroll; แถบกรอง sticky (`top-[95px]`) ตัดมาแข็งๆ อาจซ้อนบนจอเล็ก. ปุ่มใส่ตะกร้าอยู่กลางการ์ด แตะถนัด (ผ่าน)

**Jordan (มือใหม่):** `<select>` หมวดไม่มี label; นอกนั้นการกระทำแรกชัดเจน (เลือกสินค้า → ใส่ตะกร้า) ภายใน 5 วินาที

**Sam (a11y):** รูปมี alt=ชื่อสินค้า, qty มี aria-label, ปุ่มมี focus ring; ค้าง: select ไม่มี label, สถานะโหลดไม่ประกาศให้ screen reader

## Minor Observations
- hero icon (bi-shop) เป็น decoration ที่จางพอดี ไม่รบกวน
- low stock ใช้ทั้งข้อความ "เหลือน้อย" + สีเหลือง (ดี ไม่พึ่งสีอย่างเดียว)
- offset sticky เป็นค่าตายตัว `top-[95px]` ผูกกับความสูง header — เปราะถ้า header เปลี่ยน

## Questions to Consider
- ถ้าค้นหาเป็น live + คงกริดไว้ จะลดความรู้สึก "สะดุด" บนมือถือได้แค่ไหน?
- ควรมีแถบหมวดหมู่แบบ chip (แตะเลือก) แทน `<select>` เพื่อให้เห็นตัวเลือกทั้งหมดไหม?
- เวอร์ชันที่ "มั่นใจ" ของหน้านี้ ปุ่มใส่ตะกร้าควรเด่นกว่านี้บนมือถือไหม (sticky bottom)?
