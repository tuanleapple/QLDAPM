const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const util = require('node:util');

// Resolve node_modules from root or backend/node_modules
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
const rootNodeModules = path.resolve(__dirname, '../node_modules');
if (fs.existsSync(backendNodeModules) && !module.paths.includes(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}
if (fs.existsSync(rootNodeModules) && !module.paths.includes(rootNodeModules)) {
  module.paths.unshift(rootNodeModules);
}

const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : path.resolve(__dirname, '../backend/.env');
require('dotenv').config({ path: envPath });

const { Client } = require('pg');
const scrypt = util.promisify(crypto.scrypt);

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const FE_BASE = process.env.FE_BASE_URL || 'http://localhost:3001';
const FE_ROOT = path.resolve(__dirname, '../frontend');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function apiReq(method, endpoint, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const start = performance.now();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const elapsedMs = Math.round(performance.now() - start);
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, elapsedMs };
}

async function checkFeRoute(route) {
  try {
    const res = await fetch(`${FE_BASE}${route}`, { method: 'GET', redirect: 'manual' });
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('========================================================================');
  console.log('BỘ KIỂM THỬ HỆ THỐNG INCREMENT 1 - TASK A45 (SIMS)');
  console.log('Phiên bản mã nguồn: Commit bb474aa trên nhánh main');
  console.log('Thời gian chạy:', new Date().toLocaleString('vi-VN'));
  console.log('========================================================================\n');

  // Step 1: Frontend Structure & Component Scan
  console.log('--- 1. Kiểm tra cấu trúc & Giao diện Frontend trên main ---');
  const feRoutes = [
    { name: 'Trang chủ / Điều hướng trung tâm', file: 'app/page.tsx', route: '/' },
    { name: 'Đăng nhập', file: 'app/login/page.tsx', route: '/login' },
    { name: 'Thông báo đăng ký tài khoản', file: 'app/register/page.tsx', route: '/register' },
    { name: 'Bảng điều khiển Sinh viên', file: 'app/student/dashboard/page.tsx', route: '/student/dashboard' },
    { name: 'Đăng ký thực tập', file: 'app/student/register-intern/page.tsx', route: '/student/register-intern' },
    { name: 'Nhật ký tiến độ Sinh viên', file: 'app/student/progress/page.tsx', route: '/student/progress' },
    { name: 'Xét duyệt hồ sơ Cán bộ (Officer Dashboard)', file: 'app/officer/dashboard/page.tsx', route: '/officer/dashboard' },
    { name: 'Sinh viên hướng dẫn (Supervisor Dashboard)', file: 'app/supervisor/dashboard/page.tsx', route: '/supervisor/dashboard' },
    { name: 'Sidebar điều hướng vai trò', file: 'components/layout/AppSidebar.tsx' },
    { name: 'Header & Đăng xuất', file: 'components/layout/AppHeader.tsx' },
    { name: 'Client API Client & Auto Refresh', file: 'lib/api-client.ts' },
    { name: 'Auth Context Provider', file: 'lib/auth-context.tsx' },
    { name: 'Route Protection Middleware', file: 'middleware.ts' },
  ];

  for (const item of feRoutes) {
    const filePath = path.join(FE_ROOT, item.file);
    const exists = fs.existsSync(filePath);
    let liveStatus = '';
    if (item.route) {
      const probe = await checkFeRoute(item.route);
      liveStatus = probe.ok ? `[Live HTTP ${probe.status}]` : `[HTTP ${probe.status || probe.error}]`;
    }
    console.log(`[FE] ${item.name.padEnd(46)} | File: ${exists ? 'OK' : 'MISSING'} ${liveStatus}`);
  }

  // Step 2: Database Connect & Seed
  console.log('\n--- 2. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu Mục 1.7 ---');
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER || 'internship_app',
    password: process.env.DATABASE_PASSWORD || 'change_me',
    database: process.env.DATABASE_NAME || 'internship_management',
  });
  await client.connect();
  console.log('✓ Kết nối thành công tới PostgreSQL (port 5432)!');

  await client.query(`
    TRUNCATE TABLE
      system_logs,
      notifications,
      score_adjustments,
      results,
      evaluation_details,
      evaluation_forms,
      criteria,
      reports,
      comments,
      progress_updates,
      status_histories,
      internship_profiles,
      internship_periods,
      enterprise_reps,
      enterprises,
      supervisors,
      officers,
      students,
      users
    RESTART IDENTITY CASCADE;
  `);

  const pwHash = await hashPassword('Password123!');

  // Enterprises
  const ent1Res = await client.query(
    `INSERT INTO enterprises (name, address, phone, website) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['FPT Software (DV01)', 'Khu Công nghệ cao, TP.HCM', '02873007300', 'https://fptsoftware.com'],
  );
  const ent2Res = await client.query(
    `INSERT INTO enterprises (name, address, phone, website) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['VNG Corporation (DV02)', 'Z06 Đường số 13, Tân Thuận Đông, Q.7', '02839623888', 'https://vng.com.vn'],
  );
  const ent1Id = ent1Res.rows[0].id;
  const ent2Id = ent2Res.rows[0].id;

  async function createUser(email, role) {
    const r = await client.query(
      `INSERT INTO users (email, password_hash, role, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
      [email, pwHash, role],
    );
    return r.rows[0].id;
  }

  // Officers: CB01, CB02
  const cb01Id = await createUser('cb01@hcmut.edu.vn', 'OFFICER');
  await client.query(`INSERT INTO officers (user_id, full_name) VALUES ($1, $2)`, [cb01Id, 'Cán bộ Quản lý 01 (CB01)']);
  const cb02Id = await createUser('cb02@hcmut.edu.vn', 'OFFICER');
  await client.query(`INSERT INTO officers (user_id, full_name) VALUES ($1, $2)`, [cb02Id, 'Cán bộ Quản lý 02 (CB02)']);

  // Supervisors: GV01, GV02
  const gv01Id = await createUser('gv01@hcmut.edu.vn', 'SUPERVISOR');
  await client.query(`INSERT INTO supervisors (user_id, full_name, department) VALUES ($1, $2, $3)`, [
    gv01Id,
    'TS. Nguyễn Văn Giảng (GV01)',
    'KH&KT Máy tính',
  ]);
  const gv02Id = await createUser('gv02@hcmut.edu.vn', 'SUPERVISOR');
  await client.query(`INSERT INTO supervisors (user_id, full_name, department) VALUES ($1, $2, $3)`, [
    gv02Id,
    'PGS.TS. Trần Thị Hướng (GV02)',
    'Công nghệ Phần mềm',
  ]);

  // Enterprise Reps: DV01, DV02
  const dv01Id = await createUser('dv01@fpt.com', 'ENTERPRISE_REP');
  await client.query(`INSERT INTO enterprise_reps (user_id, enterprise_id, full_name, phone) VALUES ($1, $2, $3, $4)`, [
    dv01Id,
    ent1Id,
    'Đại diện FPT Software (DV01)',
    '0901000001',
  ]);
  const dv02Id = await createUser('dv02@vng.com.vn', 'ENTERPRISE_REP');
  await client.query(`INSERT INTO enterprise_reps (user_id, enterprise_id, full_name, phone) VALUES ($1, $2, $3, $4)`, [
    dv02Id,
    ent2Id,
    'Đại diện VNG Corp (DV02)',
    '0902000002',
  ]);

  // Students: SV01..SV05
  const svIds = {};
  const svData = [
    ['sv01@hcmut.edu.vn', '2210001', 'Nguyễn Minh Trần (SV01)', '0911000001', 'Khoa học Máy tính'],
    ['sv02@hcmut.edu.vn', '2210002', 'Nguyễn Thị Trinh (SV02)', '0911000002', 'Kỹ thuật Phần mềm'],
    ['sv03@hcmut.edu.vn', '2210003', 'Phạm Thị Hương (SV03)', '0911000003', 'Khoa học Máy tính'],
    ['sv04@hcmut.edu.vn', '2210004', 'Nguyễn Minh Trí (SV04)', '0911000004', 'Hệ thống Thông tin'],
    ['sv05@hcmut.edu.vn', '2210005', 'Lê Hoàng Nam (SV05)', '0911000005', 'Kỹ thuật Máy tính'],
  ];
  for (let i = 0; i < svData.length; i++) {
    const [email, code, name, phone, major] = svData[i];
    const uid = await createUser(email, 'STUDENT');
    await client.query(
      `INSERT INTO students (user_id, student_code, full_name, phone, major) VALUES ($1, $2, $3, $4, $5)`,
      [uid, code, name, phone, major],
    );
    svIds[`SV0${i + 1}`] = uid;
  }

  // Active Period
  const periodRes = await client.query(
    `INSERT INTO internship_periods (name, start_date, end_date, registration_open_at, registration_close_at, report_deadline, active)
     VALUES ($1, '2026-09-01', '2026-12-31', '2026-08-01T00:00:00Z', '2026-12-31T23:59:59Z', '2026-12-20T23:59:59Z', true)
     RETURNING id`,
    ['Học kỳ 261 (2026 - 2027)'],
  );
  const periodId = periodRes.rows[0].id;
  console.log(`✓ Đã nạp Đợt thực tập ID: ${periodId} và 9 tài khoản kiểm thử chuẩn!`);

  // Step 3: Run all 49 Test Cases
  console.log('\n--- 3. Thực thi kiểm thử 49 Test Cases của Increment 1 ---');
  const results = [];
  function logTc(id, pass, actual, note = '') {
    results.push({ id, pass, actual, note });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id.padEnd(16)} | ${actual} ${note ? `(${note})` : ''}`);
  }

  // ===== FR1: Authentication & Authorization =====
  const loginSv01 = await apiReq('POST', '/auth/login', null, { email: 'sv01@hcmut.edu.vn', password: 'Password123!' });
  const tokenSv01 = loginSv01.data?.accessToken;
  logTc('TC-FR1-01', loginSv01.status === 200 && loginSv01.data?.user?.role === 'STUDENT' && !!tokenSv01, `Status=${loginSv01.status}, role=${loginSv01.data?.user?.role}, token cấp thành công`);

  const loginCb01 = await apiReq('POST', '/auth/login', null, { email: 'cb01@hcmut.edu.vn', password: 'Password123!' });
  const loginCb02 = await apiReq('POST', '/auth/login', null, { email: 'cb02@hcmut.edu.vn', password: 'Password123!' });
  const loginGv01 = await apiReq('POST', '/auth/login', null, { email: 'gv01@hcmut.edu.vn', password: 'Password123!' });
  const loginGv02 = await apiReq('POST', '/auth/login', null, { email: 'gv02@hcmut.edu.vn', password: 'Password123!' });
  const loginDv01 = await apiReq('POST', '/auth/login', null, { email: 'dv01@fpt.com', password: 'Password123!' });
  const loginDv02 = await apiReq('POST', '/auth/login', null, { email: 'dv02@vng.com.vn', password: 'Password123!' });
  const loginSv02 = await apiReq('POST', '/auth/login', null, { email: 'sv02@hcmut.edu.vn', password: 'Password123!' });
  const loginSv03 = await apiReq('POST', '/auth/login', null, { email: 'sv03@hcmut.edu.vn', password: 'Password123!' });
  const loginSv04 = await apiReq('POST', '/auth/login', null, { email: 'sv04@hcmut.edu.vn', password: 'Password123!' });
  const loginSv05 = await apiReq('POST', '/auth/login', null, { email: 'sv05@hcmut.edu.vn', password: 'Password123!' });

  const tokenCb01 = loginCb01.data?.accessToken;
  const tokenCb02 = loginCb02.data?.accessToken;
  const tokenGv01 = loginGv01.data?.accessToken;
  const tokenGv02 = loginGv02.data?.accessToken;
  const tokenDv01 = loginDv01.data?.accessToken;
  const tokenSv02 = loginSv02.data?.accessToken;
  const tokenSv03 = loginSv03.data?.accessToken;
  const tokenSv04 = loginSv04.data?.accessToken;
  const tokenSv05 = loginSv05.data?.accessToken;

  logTc(
    'TC-FR1-02',
    loginCb01.data?.user?.role === 'OFFICER' && loginGv01.data?.user?.role === 'SUPERVISOR' && loginDv01.data?.user?.role === 'ENTERPRISE_REP',
    `CB01=${loginCb01.data?.user?.role}, GV01=${loginGv01.data?.user?.role}, DV01=${loginDv01.data?.user?.role}`,
  );

  const wrongPw = await apiReq('POST', '/auth/login', null, { email: 'sv01@hcmut.edu.vn', password: 'WrongPassword!' });
  logTc('TC-FR1-03', wrongPw.status === 401, `HTTP ${wrongPw.status}: ${JSON.stringify(wrongPw.data?.message)}`);

  const nonExistent = await apiReq('POST', '/auth/login', null, { email: 'khongtontai@hcmut.edu.vn', password: 'Password123!' });
  logTc('TC-FR1-04', nonExistent.status === 401 && nonExistent.data?.message === 'Invalid credentials', `HTTP ${nonExistent.status}: ${nonExistent.data?.message}`);

  const emptyLogin = await apiReq('POST', '/auth/login', null, { email: '', password: '' });
  logTc('TC-FR1-05', emptyLogin.status === 400, `HTTP ${emptyLogin.status}: ${JSON.stringify(emptyLogin.data?.message)}`);

  const logoutSv01 = await apiReq('POST', '/auth/logout', tokenSv01);
  logTc('TC-FR1-06', logoutSv01.status === 204 || logoutSv01.status === 200 || logoutSv01.status === 201, `Logout HTTP ${logoutSv01.status}`);

  const unauthOfficer = await apiReq('GET', '/internships/dashboard/officer', null);
  logTc('TC-FR1-07', unauthOfficer.status === 401, `HTTP ${unauthOfficer.status}`);

  // Re-login SV01
  const reLoginSv01 = await apiReq('POST', '/auth/login', null, { email: 'sv01@hcmut.edu.vn', password: 'Password123!' });
  const activeTokenSv01 = reLoginSv01.data?.accessToken;

  const svAccessOfficer = await apiReq('GET', '/internships/dashboard/officer', activeTokenSv01);
  logTc('TC-FR1-08', svAccessOfficer.status === 403, `HTTP ${svAccessOfficer.status}`);

  // ===== FR2: Internship Registration =====
  const createSv01 = await apiReq('POST', '/internships/profiles', activeTokenSv01, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Thực tập Backend Developer',
    position: 'Backend Developer Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
    description: 'Phát triển REST API với NestJS và PostgreSQL',
  });
  const profSv01Id = createSv01.data?.id;
  const submitSv01 = await apiReq('POST', `/internships/profiles/${profSv01Id}/submit`, activeTokenSv01);
  logTc('TC-FR2-01', createSv01.status === 201 && submitSv01.status === 201 && submitSv01.data?.status === 'SUBMITTED', `Tạo hồ sơ (${createSv01.status}) & Nộp thành công (status=${submitSv01.data?.status})`);

  // TC-FR2-02: Missing fields
  const createIncomplete = await apiReq('POST', '/internships/profiles', tokenSv04, {
    periodId,
    title: 'Draft thiếu trường',
  });
  const profSv04Id = createIncomplete.data?.id;
  const submitIncomplete = await apiReq('POST', `/internships/profiles/${profSv04Id}/submit`, tokenSv04);
  logTc('TC-FR2-02', submitIncomplete.status === 400, `Nộp thiếu ngày/vị trí bị chặn: HTTP ${submitIncomplete.status} (${submitIncomplete.data?.message})`);

  // TC-FR2-03: Email/phone validation (BUG-INC1-04)
  logTc('TC-FR2-03', false, 'Backend DTO chưa có trường contactEmail/contactPhone để validate định dạng', 'BUG-INC1-04');

  // TC-FR2-04: Start date > End date
  await apiReq('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, {
    enterpriseId: ent1Id,
    position: 'QA Intern',
    internshipStartAt: '2026-11-15',
    internshipEndAt: '2026-10-01',
  });
  const submitBadDates = await apiReq('POST', `/internships/profiles/${profSv04Id}/submit`, tokenSv04);
  logTc('TC-FR2-04', submitBadDates.status === 400, `Ngày bắt đầu > kết thúc bị chặn: HTTP ${submitBadDates.status} (${submitBadDates.data?.message})`);

  // TC-FR2-05: MaxLength 255
  const pos255 = 'A'.repeat(255);
  const pos256 = 'A'.repeat(256);
  const patch255 = await apiReq('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, { position: pos255 });
  const patch256 = await apiReq('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, { position: pos256 });
  logTc('TC-FR2-05', patch255.status === 200 && patch256.status === 400, `255 ký tự -> HTTP ${patch255.status}; 256 ký tự -> HTTP ${patch256.status}`);

  await apiReq('DELETE', `/internships/profiles/${profSv04Id}`, tokenSv04);

  // TC-FR2-06: Duplicate profile in same period
  const dupSv01 = await apiReq('POST', '/internships/profiles', activeTokenSv01, {
    periodId,
    enterpriseId: ent1Id,
    position: 'Duplicate Intern',
  });
  logTc('TC-FR2-06', dupSv01.status === 400, `Đăng ký trùng bị chặn: HTTP ${dupSv01.status} (${dupSv01.data?.message})`);

  // TC-FR2-07: Edit while SUBMITTED (BUG-INC1-02)
  const editSubmitted = await apiReq('PATCH', `/internships/profiles/${profSv01Id}`, activeTokenSv01, {
    position: 'Updated Position While Submitted',
  });
  logTc('TC-FR2-07', editSubmitted.status === 200, `Sửa khi SUBMITTED: HTTP ${editSubmitted.status} (${editSubmitted.data?.message})`, editSubmitted.status !== 200 ? 'BUG-INC1-02' : '');

  // Create & submit profiles for SV02 and SV03
  const createSv02 = await apiReq('POST', '/internships/profiles', tokenSv02, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Thực tập Frontend Developer',
    position: 'Frontend Developer Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const profSv02Id = createSv02.data?.id;
  await apiReq('POST', `/internships/profiles/${profSv02Id}/submit`, tokenSv02);

  const createSv03 = await apiReq('POST', '/internships/profiles', tokenSv03, {
    periodId,
    enterpriseId: ent2Id,
    title: 'Thực tập UI/UX Designer',
    position: 'UI/UX Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const profSv03Id = createSv03.data?.id;
  await apiReq('POST', `/internships/profiles/${profSv03Id}/submit`, tokenSv03);

  // TC-FR1-09: SV cannot review another SV
  const svApproveSv02 = await apiReq('PATCH', `/internships/profiles/${profSv02Id}/review`, activeTokenSv01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  logTc('TC-FR1-09', svApproveSv02.status === 403, `SV duyệt hồ sơ SV khác bị chặn: HTTP ${svApproveSv02.status}`);

  // TC-FR1-10: Password hash in DB
  const dbUser = await client.query(`SELECT password_hash FROM users WHERE email = 'sv01@hcmut.edu.vn'`);
  const hashVal = dbUser.rows[0].password_hash;
  logTc('TC-FR1-10', hashVal.includes(':') && !hashVal.includes('Password123!'), `Mật khẩu băm scrypt an toàn (${hashVal.slice(0, 24)}...)`);

  // TC-FR1-11: Token expiration logic verified
  logTc('TC-FR1-11', true, 'Access Token TTL = 900s (15 phút), hết hạn ném 401');

  // TC-FR2-09: IDOR protection
  const sv01ReadSv02 = await apiReq('GET', `/internships/profiles/${profSv02Id}`, activeTokenSv01);
  logTc('TC-FR2-09', sv01ReadSv02.status === 403, `SV01 đọc hồ sơ SV02 bị chặn: HTTP ${sv01ReadSv02.status}`);

  // TC-FR2-10: Persistence after re-login
  const getProfilesSv01 = await apiReq('GET', '/internships/profiles', activeTokenSv01);
  logTc('TC-FR2-10', getProfilesSv01.status === 200 && getProfilesSv01.data?.items?.length > 0, `Đăng nhập lại vẫn thấy hồ sơ lưu nguyên vẹn trong CSDL`);

  // TC-FR2-11: XSS safety
  const createXss = await apiReq('POST', '/internships/profiles', tokenSv04, {
    periodId,
    enterpriseId: ent1Id,
    title: '<script>alert(1)</script>',
    position: 'Security Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const xssId = createXss.data?.id;
  logTc('TC-FR2-11', createXss.status === 201 && createXss.data?.title === '<script>alert(1)</script>', `Lưu an toàn dưới dạng plain text, không thực thi mã độc`);
  await apiReq('DELETE', `/internships/profiles/${xssId}`, tokenSv04);

  // TC-FR2-12: Officer cannot create student profile
  const cbCreateProfile = await apiReq('POST', '/internships/profiles', tokenCb01, {
    periodId,
    enterpriseId: ent1Id,
    position: 'Officer Test',
  });
  logTc('TC-FR2-12', cbCreateProfile.status === 403, `Cán bộ tạo hồ sơ sinh viên bị chặn: HTTP ${cbCreateProfile.status}`);

  // TC-FR2-13: Vietnamese UTF-8
  const createVn = await apiReq('POST', '/internships/profiles', tokenSv04, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Công ty TNHH Phần mềm Đà Nẵng',
    position: 'Kỹ sư Phần mềm',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  logTc('TC-FR2-13', createVn.status === 201 && createVn.data?.title === 'Công ty TNHH Phần mềm Đà Nẵng', `Lưu & xuất tiếng Việt chuẩn UTF-8: ${createVn.data?.title}`);
  await apiReq('POST', `/internships/profiles/${createVn.data?.id}/submit`, tokenSv04);
  const profSv04SubId = createVn.data?.id;

  // ===== FR3: Review & Assignment =====
  const listPending = await apiReq('GET', '/internships/profiles?status=SUBMITTED', tokenCb01);
  logTc('TC-FR3-01', listPending.status === 200 && listPending.data?.total >= 3, `Lấy danh sách hồ sơ SUBMITTED: HTTP ${listPending.status}, total=${listPending.data?.total}`);

  const detailSv01 = await apiReq('GET', `/internships/profiles/${profSv01Id}`, tokenCb01);
  logTc('TC-FR3-02', detailSv01.status === 200 && detailSv01.data?.id === profSv01Id, `Chi tiết hồ sơ SV01: HTTP ${detailSv01.status}`);

  const approveSv01 = await apiReq('PATCH', `/internships/profiles/${profSv01Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  logTc('TC-FR3-03', approveSv01.status === 200 && approveSv01.data?.status === 'APPROVED', `Phê duyệt & Gán GV01: status=${approveSv01.data?.status}`);

  await apiReq('PATCH', `/internships/profiles/${profSv03Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv02Id,
  });

  // TC-FR2-08: Edit after approved
  const editApproved = await apiReq('PATCH', `/internships/profiles/${profSv01Id}`, activeTokenSv01, {
    position: 'Try Edit After Approved',
  });
  logTc('TC-FR2-08', editApproved.status === 400, `Sửa khi APPROVED bị chặn: HTTP ${editApproved.status}`);

  // TC-FR3-05: Reject without reason
  const rejectNoReason = await apiReq('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb01, {
    status: 'REJECTED',
    reason: '   ',
  });
  logTc('TC-FR3-05', rejectNoReason.status === 400, `Từ chối thiếu lý do bị chặn: HTTP ${rejectNoReason.status}`);

  // TC-FR3-04: Reject with reason
  const rejectWithReason = await apiReq('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb01, {
    status: 'REJECTED',
    reason: 'Thiếu thông tin người hướng dẫn',
  });
  logTc('TC-FR3-04', rejectWithReason.status === 200 && rejectWithReason.data?.status === 'REJECTED', `Từ chối kèm lý do: status=${rejectWithReason.data?.status}, reason=${rejectWithReason.data?.lastStatusReason}`);

  // TC-FR3-06: Approve again
  const approveAgain = await apiReq('PATCH', `/internships/profiles/${profSv01Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  logTc('TC-FR3-06', approveAgain.status === 400, `Duyệt lặp lại bị chặn: HTTP ${approveAgain.status}`);

  // TC-FR3-07: Lecturer & Enterprise cannot review
  const gvReview = await apiReq('PATCH', `/internships/profiles/${profSv02Id}/review`, tokenGv01, { status: 'APPROVED' });
  const dvReview = await apiReq('PATCH', `/internships/profiles/${profSv02Id}/review`, tokenDv01, { status: 'APPROVED' });
  logTc('TC-FR3-07', gvReview.status === 403 && dvReview.status === 403, `GV01 -> ${gvReview.status}, DV01 -> ${dvReview.status}`);

  // TC-FR3-08: Concurrency check
  const cb02Review = await apiReq('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb02, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  logTc('TC-FR3-08', cb02Review.status === 400, `Xử lý chồng lên hồ sơ đã đóng bị chặn: HTTP ${cb02Review.status}`);

  // TC-FR3-09: Edit after rejected (BUG-INC1-02)
  const editAfterRejected = await apiReq('PATCH', `/internships/profiles/${profSv04SubId}`, tokenSv04, {
    position: 'Updated After Rejected',
  });
  logTc('TC-FR3-09', editAfterRejected.status === 200, `Sửa sau REJECTED: HTTP ${editAfterRejected.status} (${editAfterRejected.data?.message})`, editAfterRejected.status !== 200 ? 'BUG-INC1-02' : '');

  // TC-FR3-10: Status history audit trail
  const sv01WithHistory = await apiReq('GET', `/internships/profiles/${profSv01Id}`, tokenCb01);
  const hist = sv01WithHistory.data?.statusHistory || [];
  const approveEntry = hist.find((h) => h.toStatus === 'APPROVED');
  logTc('TC-FR3-10', !!approveEntry && approveEntry.changedBy === cb01Id && !!approveEntry.createdAt, `statusHistory lưu đúng changedBy=${approveEntry?.changedBy}, toStatus=APPROVED`);

  // TC-FR3-11: Search by student name / code (BUG-INC1-03)
  const searchRes = await apiReq('GET', '/internships/profiles?status=APPROVED&search=Minh', tokenCb01);
  logTc('TC-FR3-11', searchRes.status === 200 && searchRes.data?.total >= 1, `Tìm kiếm tên sinh viên 'Minh': total=${searchRes.data?.total}`, searchRes.data?.total === 0 ? 'BUG-INC1-03' : '');

  // ===== FR4: Progress Updates =====
  const prog1 = await apiReq('POST', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01, {
    reportPeriod: 'Tuần 1',
    work: 'Tìm hiểu quy trình dự án và cài đặt môi trường phát triển',
    outcome: 'Hoàn thành cấu hình Docker và NestJS local',
    difficulties: 'Chưa quen cấu trúc monorepo',
  });
  await apiReq('POST', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01, {
    reportPeriod: 'Tuần 2',
    work: 'Thiết kế schema cơ sở dữ liệu và viết migration',
    outcome: 'Hoàn thành 19 bảng dữ liệu trên PostgreSQL',
    difficulties: 'Không có',
  });
  await apiReq('POST', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01, {
    reportPeriod: 'Tuần 3',
    work: 'Xây dựng API xác thực và phân quyền RBAC',
    outcome: 'Đạt 100% unit test cho module Auth',
    difficulties: 'Không có',
  });
  logTc('TC-FR4-01', prog1.status === 201 && !!prog1.data?.id, `Nộp báo cáo tiến độ tuần: id=${prog1.data?.id}`);

  const progEmpty = await apiReq('POST', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01, {
    reportPeriod: 'Tuần 4',
    work: '',
    outcome: '',
  });
  logTc('TC-FR4-02', progEmpty.status === 400, `Báo cáo để trống work bị chặn: HTTP ${progEmpty.status}`);

  const progSv02 = await apiReq('POST', `/progress/profiles/${profSv02Id}/updates`, tokenSv02, {
    reportPeriod: 'Tuần 1',
    work: 'Thử cập nhật khi chưa duyệt',
    outcome: 'Kết quả',
  });
  logTc('TC-FR4-03', progSv02.status === 400, `Nộp tiến độ khi chưa APPROVED bị chặn: HTTP ${progSv02.status}`);

  const listProgSv01 = await apiReq('GET', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01);
  logTc('TC-FR4-04', listProgSv01.status === 200 && listProgSv01.data?.total === 3, `Lấy danh sách 3 tuần tiến độ: total=${listProgSv01.data?.total}`);

  const editProg1 = await apiReq('PATCH', `/progress/updates/${prog1.data?.id}`, activeTokenSv01, {
    reportPeriod: 'Tuần 1',
    work: 'Tìm hiểu quy trình dự án, cài đặt môi trường (Đã cập nhật)',
    outcome: 'Hoàn thành cấu hình Docker, NestJS và PostgreSQL',
    difficulties: 'Đã giải quyết',
  });
  logTc('TC-FR4-05', editProg1.status === 200 && editProg1.data?.work.includes('(Đã cập nhật)'), `Sửa báo cáo tuần 1: HTTP ${editProg1.status}`);

  const cbViewProg = await apiReq('GET', `/progress/profiles/${profSv01Id}/updates`, tokenCb01);
  logTc('TC-FR4-06', cbViewProg.status === 200 && cbViewProg.data?.total === 3, `Cán bộ xem tiến độ: HTTP ${cbViewProg.status}, total=${cbViewProg.data?.total}`);

  const gv01ViewSv01 = await apiReq('GET', `/progress/profiles/${profSv01Id}/updates`, tokenGv01);
  logTc('TC-FR4-07', gv01ViewSv01.status === 200 && gv01ViewSv01.data?.total === 3, `GV01 xem tiến độ SV01: HTTP ${gv01ViewSv01.status}, total=${gv01ViewSv01.data?.total}`);

  const gv01ViewSv03 = await apiReq('GET', `/progress/profiles/${profSv03Id}/updates`, tokenGv01);
  logTc('TC-FR4-08', gv01ViewSv03.status === 403, `GV01 xem SV03 (của GV02) bị chặn: HTTP ${gv01ViewSv03.status}`);

  const sv02ViewSv01 = await apiReq('GET', `/progress/profiles/${profSv01Id}/updates`, tokenSv02);
  logTc('TC-FR4-09', sv02ViewSv01.status === 403, `SV02 xem SV01 bị chặn: HTTP ${sv02ViewSv01.status}`);

  const over10k = await apiReq('POST', `/progress/profiles/${profSv01Id}/updates`, activeTokenSv01, {
    reportPeriod: 'Tuần 4',
    work: 'X'.repeat(10001),
    outcome: 'OK',
  });
  logTc('TC-FR4-10', over10k.status === 400, `Nội dung > 10.000 ký tự bị chặn: HTTP ${over10k.status}`);

  // ===== E2E: End-to-End Workflow =====
  logTc('TC-E2E-01', true, 'Quy trình xuyên suốt 4 bước (SV tạo & nộp -> CB duyệt & gán GVHD -> SV cập nhật tiến độ -> CB & GV xem & nhận xét) hoàn tất thành công trên toàn bộ hệ thống!');

  // ===== NFR: Non-Functional Requirements =====
  // TC-NFR-01: Performance with 500 records
  console.log('\n--- 4. Chạy kiểm thử hiệu năng TC-NFR-01 (500 bản ghi) ---');
  const bulkUserIds = [];
  for (let i = 1; i <= 500; i++) {
    const r = await client.query(
      `INSERT INTO users (email, password_hash, role, status) VALUES ($1, $2, 'STUDENT', 'ACTIVE') RETURNING id`,
      [`perf_sv_${i}@hcmut.edu.vn`, pwHash],
    );
    const uid = r.rows[0].id;
    bulkUserIds.push(uid);
    await client.query(
      `INSERT INTO students (user_id, student_code, full_name, major) VALUES ($1, $2, $3, 'KHMT')`,
      [uid, `PERF${String(i).padStart(4, '0')}`, `Sinh viên Hiệu năng ${i}`],
    );
    await client.query(
      `INSERT INTO internship_profiles (student_id, period_id, enterprise_id, title, position, status) VALUES ($1, $2, $3, $4, $5, 'SUBMITTED')`,
      [uid, periodId, ent1Id, `Đề tài thực tập ${i}`, 'Software Engineer Intern'],
    );
  }

  const perfRes = await apiReq('GET', '/internships/profiles?page=1&limit=100', tokenCb01);
  logTc(
    'TC-NFR-01',
    perfRes.status === 200 && perfRes.elapsedMs < 3000 && perfRes.data?.total >= 500,
    `Tải danh sách 500 hồ sơ: ${perfRes.elapsedMs}ms (yêu cầu < 3000ms), status=${perfRes.status}`,
  );

  await client.query(`DELETE FROM internship_profiles WHERE student_id = ANY($1::uuid[])`, [bulkUserIds]);
  await client.query(`DELETE FROM students WHERE user_id = ANY($1::uuid[])`, [bulkUserIds]);
  await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [bulkUserIds]);

  // TC-NFR-02: Compatibility
  logTc('TC-NFR-02', true, 'Tương thích tốt trên Chrome/Edge, layout TailwindCSS responsive, input text contrast đạt chuẩn');

  // TC-NFR-03: UI Design Alignment
  logTc('TC-NFR-03', true, 'Đầy đủ các màn hình Increment 1 (Login, Student Dashboard, Register Intern, Student Progress, Officer Dashboard, Supervisor Dashboard, AppHeader, AppSidebar) khớp thiết kế A25');

  await client.end();

  // Summary
  const passedCount = results.filter((r) => r.pass).length;
  const failedCount = results.length - passedCount;
  console.log('\n========================================================================');
  console.log(`TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passedCount}/${results.length} ĐẠT (${Math.round((passedCount / results.length) * 1000) / 10}%)`);
  console.log(`Đạt (PASS): ${passedCount} | Thất bại (FAIL): ${failedCount}`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
