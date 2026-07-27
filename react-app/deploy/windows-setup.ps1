<#
  TK EASY STORE — Windows Server deploy/update script
  -----------------------------------------------------
  ทำอัตโนมัติ: clone/pull โค้ด -> build client -> install server deps
              -> สร้าง .env (สุ่ม JWT_SECRET ให้) -> ตั้ง Windows Service (NSSM)
              -> ทดสอบ health endpoint
  รันซ้ำได้ (idempotent): ครั้งแรก = ติดตั้ง, ครั้งถัดไป = อัปเดต+restart

  วิธีใช้ (เปิด PowerShell แบบ Run as Administrator):
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
      .\windows-setup.ps1

  สิ่งที่ต้องทำเองแยก (สคริปต์นี้ไม่ทำให้):
    - ติดตั้ง Node.js 20 LTS (.msi จาก nodejs.org) และ Git
    - IIS reverse proxy + URL Rewrite + ARR  (ดูไฟล์ iis-web.config)
    - SSL ด้วย win-acme  /  ชี้ DNS โดเมนมาที่ server
#>

$ErrorActionPreference = 'Stop'

# ───────────── ตั้งค่าได้ตรงนี้ ─────────────
$RepoUrl     = 'https://github.com/motionsix/TK_app.git'
$InstallDir  = 'C:\apps\tkstore'          # ที่เก็บโค้ด (repo root)
$ServiceName = 'TKEasy'                    # ชื่อ Windows Service
$Port        = 3001                        # พอร์ตที่ Node ฟัง (ภายใน)
$NssmDir     = 'C:\nssm'
$NssmUrl     = 'https://nssm.cc/release/nssm-2.24.zip'
# ────────────────────────────────────────────

$ServerDir = Join-Path $InstallDir 'react-app\server'
$ClientDir = Join-Path $InstallDir 'react-app\client'
$LogDir    = Join-Path $InstallDir 'logs'

function Info($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "    [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "    [!] $m" -ForegroundColor Yellow }

# 0) ตรวจสิทธิ์ Administrator (จำเป็นสำหรับสร้าง service)
$admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $admin) { throw 'ต้องเปิด PowerShell แบบ "Run as Administrator"' }

# 1) ตรวจว่ามี node / npm / git
Info 'ตรวจเครื่องมือที่จำเป็น (node, npm, git)'
foreach ($tool in 'node','npm','git') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "ไม่พบ '$tool' — ติดตั้งก่อน (Node.js 20 LTS จาก nodejs.org และ Git for Windows)"
  }
}
Ok ("node " + (node -v) + " / git " + ((git --version) -replace 'git version ',''))

# 2) clone (ครั้งแรก) หรือ pull (อัปเดต)
if (Test-Path (Join-Path $InstallDir '.git')) {
  Info 'พบ repo เดิม -> git pull'
  Push-Location $InstallDir
  git pull --ff-only
  Pop-Location
} else {
  Info "clone โค้ดจาก $RepoUrl"
  New-Item -ItemType Directory -Force -Path (Split-Path $InstallDir) | Out-Null
  git clone $RepoUrl $InstallDir
}
Ok 'ได้โค้ดล่าสุดแล้ว'

# 3) สร้าง .env ถ้ายังไม่มี (สุ่ม JWT_SECRET ให้)
$envFile = Join-Path $ServerDir '.env'
if (-not (Test-Path $envFile)) {
  Info 'ยังไม่มี .env -> สร้างใหม่ + สุ่ม JWT_SECRET'
  $secret = node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  $envContent = @"
PORT=$Port
NODE_ENV=production
JWT_SECRET=$secret
JWT_EXPIRES=7d
LOYVERSE_TOKEN=
LOYVERSE_STORE_ID=
"@
  # เขียนแบบ UTF-8 ไม่มี BOM (กัน dotenv อ่านบรรทัดแรกเพี้ยน)
  [System.IO.File]::WriteAllText($envFile, $envContent, (New-Object System.Text.UTF8Encoding($false)))
  Ok ".env สร้างแล้วที่ $envFile (ไปเติม LOYVERSE_TOKEN ภายหลังได้)"
} else {
  Warn ".env มีอยู่แล้ว -> ข้าม (ไม่ทับของเดิม)"
}

# 4) build หน้าเว็บ (client -> dist)
Info 'build หน้าเว็บ (client)'
Push-Location $ClientDir
cmd /c "npm install"
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npm install (client) ล้มเหลว' }
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npm run build (client) ล้มเหลว' }
Pop-Location
Ok 'build เสร็จ -> client\dist'

# 5) ติดตั้ง dependency ฝั่ง server (production)
Info 'ติดตั้ง dependency ฝั่ง server'
Push-Location $ServerDir
cmd /c "npm install --omit=dev"
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  throw @'
npm install (server) ล้มเหลว — มักเกิดจาก better-sqlite3 compile ไม่ได้บน Windows
แก้: ติดตั้ง Python 3 (จาก python.org ติ๊ก Add to PATH) + Visual Studio Build Tools
     (workload "Desktop development with C++") แล้วรันสคริปต์นี้ใหม่
'@
}
Pop-Location
Ok 'server dependencies พร้อม'

# 6) เตรียม NSSM
if (-not (Test-Path (Join-Path $NssmDir 'nssm.exe'))) {
  Info 'ดาวน์โหลด NSSM'
  New-Item -ItemType Directory -Force -Path $NssmDir | Out-Null
  $zip = Join-Path $env:TEMP 'nssm.zip'
  Invoke-WebRequest -Uri $NssmUrl -OutFile $zip
  $tmp = Join-Path $env:TEMP 'nssm_extract'
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $tmp
  $exe = Get-ChildItem $tmp -Recurse -Filter 'nssm.exe' |
         Where-Object { $_.FullName -match 'win64' } | Select-Object -First 1
  Copy-Item $exe.FullName (Join-Path $NssmDir 'nssm.exe') -Force
  Ok 'ติดตั้ง NSSM แล้ว'
}
$nssm = Join-Path $NssmDir 'nssm.exe'
$node = (Get-Command node).Source

# 7) สร้าง/อัปเดต Windows Service
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$startupFile = Join-Path $ServerDir 'src\index.js'
$exists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $exists) {
  Info "สร้าง Windows Service '$ServiceName'"
  & $nssm install $ServiceName $node $startupFile
  & $nssm set $ServiceName AppDirectory $ServerDir
  & $nssm set $ServiceName Start SERVICE_AUTO_START
  & $nssm set $ServiceName AppStdout (Join-Path $LogDir 'out.log')
  & $nssm set $ServiceName AppStderr (Join-Path $LogDir 'err.log')
  & $nssm start $ServiceName
  Ok 'service สร้างและสตาร์ตแล้ว'
} else {
  Info "พบ service '$ServiceName' เดิม -> restart"
  & $nssm restart $ServiceName
  Ok 'restart แล้ว'
}

# 8) ทดสอบ health
Info 'ทดสอบ /api/health'
Start-Sleep -Seconds 3
try {
  $r = Invoke-WebRequest -UseBasicParsing "http://localhost:$Port/api/health" -TimeoutSec 8
  Ok ("health -> " + $r.Content)
} catch {
  Warn "เรียก health ไม่สำเร็จ: $($_.Exception.Message)"
  Warn "ดู log ที่ $LogDir\err.log"
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " เสร็จขั้นแอป! Node รันที่ http://localhost:$Port" -ForegroundColor Green
Write-Host " ขั้นต่อไป (ทำมือ): IIS reverse proxy + SSL — ดู deploy\iis-web.config" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
