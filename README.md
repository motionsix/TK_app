# TK EASY STORE

ระบบร้านค้าสหกรณ์โรงเรียนออนไลน์ (โรงเรียนตราษตระการคุณ) — เลือกซื้อสินค้า ดูสต็อกเรียลไทม์
ตรวจสอบหุ้น/เงินปันผล และมีหลังบ้าน (admin) สำหรับจัดการสินค้า คำสั่งซื้อ และเชื่อมต่อ Loyverse POS

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
| --- | --- |
| Front-end | React 19 + Vite + Tailwind CSS + React Router + Axios |
| Back-end | Node.js + Express + better-sqlite3 (SQLite) |
| Auth/ความปลอดภัย | JWT, bcrypt, express-rate-limit |
| POS | Loyverse API (อ่านข้อมูลทางเดียว + ซิงค์อัตโนมัติ) |

---

## สิ่งที่ต้องมีก่อน (Prerequisites)

- **Node.js 20 LTS** (แนะนำ) — รุ่นนี้มี prebuilt binary ของ `better-sqlite3` ทำให้ติดตั้งได้โดยไม่ต้องมี Python/Build Tools
- **Git**
- เครื่องมือเขียนโค้ด เช่น VS Code

> ตรวจเวอร์ชัน: `node -v` (ควรขึ้น v20.x)

---

## โครงสร้างโปรเจกต์

```
school_coop_full/
└─ react-app/
   ├─ client/   # React (Vite) — หน้าเว็บ
   └─ server/   # Node/Express — API + ฐานข้อมูล SQLite
```

---

## วิธีติดตั้งสำหรับ Dev (เครื่องใหม่)

### 1) Clone โปรเจกต์

```bash
git clone https://github.com/motionsix/TK_app.git
cd TK_app
```

### 2) ตั้งค่า Back-end (server)

```bash
cd react-app/server
npm install
```

สร้างไฟล์ `.env` จากตัวอย่าง แล้วเติมค่า:

```bash
# คัดลอกไฟล์ตัวอย่าง
copy .env.example .env       # Windows (PowerShell/CMD)
# cp .env.example .env       # macOS / Linux
```

สิ่งที่ **ต้องตั้งอย่างน้อย** คือ `JWT_SECRET` (เซิร์ฟเวอร์จะไม่ยอมสตาร์ตถ้าไม่ตั้ง หรือสั้นกว่า 32 ตัวอักษร)
สร้างค่าสุ่มด้วยคำสั่ง:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

นำค่าที่ได้ไปใส่ใน `.env` ที่บรรทัด `JWT_SECRET=`

รันเซิร์ฟเวอร์ (โหมด dev, รีโหลดอัตโนมัติ):

```bash
npm run dev
```

- API จะรันที่ **http://localhost:3001**
- ไฟล์ฐานข้อมูล SQLite จะถูกสร้างอัตโนมัติที่ `react-app/server/data/tk_easy.sqlite` พร้อมตารางตาม schema (ไม่ต้องตั้งค่าฐานข้อมูลเอง)

### 3) ตั้งค่า Front-end (client)

เปิด **เทอร์มินัลใหม่อีกหน้าต่าง** (ให้ server รันค้างไว้):

```bash
cd react-app/client
npm install
npm run dev
```

- เว็บจะรันที่ **http://localhost:5173**
- Vite ตั้ง proxy `/api` และ `/uploads` ไปที่เซิร์ฟเวอร์ `:3001` ให้แล้ว (ไม่ต้องตั้ง CORS)

### 4) สร้างบัญชีผู้ดูแลระบบ (admin)

ฐานข้อมูลใหม่ยังไม่มีบัญชี admin — สร้างด้วยสคริปต์ (รันในโฟลเดอร์ `react-app/server`):

```bash
node src/reset-password.js <username> <password>
```

ตัวอย่าง: `node src/reset-password.js admin 12345678`
จากนั้นเข้าสู่ระบบที่หน้าเว็บด้วย username/password นั้น แล้วเข้าหลังบ้านได้ที่เมนู Admin

> ดูรายชื่อ admin ที่มีอยู่: `node src/reset-password.js` (ไม่ใส่อาร์กิวเมนต์)

---

## ตัวแปรใน .env (server)

| ตัวแปร | จำเป็น | คำอธิบาย |
| --- | --- | --- |
| `PORT` | - | พอร์ตของ API (ค่าเริ่มต้น 3001) |
| `JWT_SECRET` | ✅ | รหัสลับเข้ารหัสโทเคน ต้องสุ่มเอง ยาว ≥ 32 ตัวอักษร |
| `JWT_EXPIRES` | - | อายุโทเคน (เช่น `7d`) |
| `SQLITE_FILE` | - | ตำแหน่งไฟล์ฐานข้อมูล (เว้นว่าง = `data/tk_easy.sqlite`) |
| `CLIENT_ORIGIN` | - | origin ของหน้าเว็บสำหรับ CORS (dev: `http://localhost:5173`) |
| `LOYVERSE_TOKEN` | - | Access Token ของ Loyverse (เว้นว่าง = ปิดการเชื่อมต่อ) |
| `LOYVERSE_STORE_ID` | - | จำกัดสต็อกเฉพาะสาขา (เว้นว่าง = รวมทุกสาขา) |
| `LOYVERSE_SYNC_MINUTES` | - | รอบซิงค์สินค้าอัตโนมัติ (นาที, ค่าเริ่มต้น 30, ใส่ `0` = ปิด) |

> ⚠️ ห้าม commit ไฟล์ `.env` จริง — ถูกใส่ใน `.gitignore` แล้ว ใช้ `.env.example` เป็นแม่แบบ

---

## คำสั่งที่ใช้บ่อย

| ที่ | คำสั่ง | ทำอะไร |
| --- | --- | --- |
| server | `npm run dev` | รัน API โหมด dev (auto-reload) |
| server | `npm start` | รัน API โหมดปกติ |
| server | `node src/reset-password.js ...` | สร้าง/รีเซ็ตรหัส admin |
| client | `npm run dev` | รันเว็บ dev (พอร์ต 5173) |
| client | `npm run build` | build เว็บไปที่ `client/dist` |
| client | `npm run lint` | ตรวจ ESLint |

---

## Build สำหรับใช้งานจริง (production)

1. build หน้าเว็บ: ในโฟลเดอร์ `react-app/client` รัน `npm run build` → ได้ `client/dist`
2. รันเซิร์ฟเวอร์: ในโฟลเดอร์ `react-app/server` รัน `npm start`
   - เมื่อมีโฟลเดอร์ `client/dist` อยู่ เซิร์ฟเวอร์ Express จะเสิร์ฟหน้าเว็บที่ build ไว้จาก origin เดียวกัน (เปิดที่ `http://localhost:3001` ได้เลย ไม่ต้องรัน client แยก)
3. ตั้งค่า `.env` บนเครื่องจริงให้ครบ (โดยเฉพาะ `JWT_SECRET` และ `LOYVERSE_TOKEN` ถ้าจะเชื่อม POS)

---

## หมายเหตุ

- การเชื่อมต่อ Loyverse เป็นแบบ **อ่านอย่างเดียว** (ดึงสินค้า/สต็อก/ลูกค้าเข้ามา) ไม่มีการเขียนกลับไป Loyverse
- ระบบซิงค์สินค้าอัตโนมัติทุก `LOYVERSE_SYNC_MINUTES` นาที — การกดซิงค์/ซิงค์อัตโนมัติจะ **เขียนทับสต็อกในเว็บด้วยค่าจาก Loyverse** (Loyverse คือแหล่งข้อมูลหลัก)
- ถ้าติดตั้ง `better-sqlite3` แล้วเจอ error เรื่อง Python/Build Tools แปลว่า Node.js ไม่ใช่รุ่น 20 — ให้สลับมาใช้ Node.js 20 LTS
