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

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function req(method, endpoint, token, body) {
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

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER || 'internship_app',
    password: process.env.DATABASE_PASSWORD || 'change_me',
    database: process.env.DATABASE_NAME || 'internship_management',
  });
  await client.connect();

  console.log('--- 1. Resetting & Seeding Test Database (Section 1.7) ---');
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

  // Create Enterprises
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

  // Supervisors (Lecturers): GV01, GV02
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

  // Enterprise Reps (Host organizations): DV01, DV02
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

  // Create active Internship Period
  const periodRes = await client.query(
    `INSERT INTO internship_periods (name, start_date, end_date, registration_open_at, registration_close_at, report_deadline, active)
     VALUES ($1, '2026-09-01', '2026-12-31', '2026-08-01T00:00:00Z', '2026-12-31T23:59:59Z', '2026-12-20T23:59:59Z', true)
     RETURNING id`,
    ['Học kỳ 261 (2026 - 2027)'],
  );
  const periodId = periodRes.rows[0].id;

  console.log('Seeded Period ID:', periodId);
  console.log('--- 2. Running Automated Checks for Increment 1 Test Cases ---');

  const log = [];
  function record(tcId, passed, actual, note = '') {
    log.push({ tcId, passed, actual, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId}: ${actual} ${note ? '(' + note + ')' : ''}`);
  }

  // FR1 Tests
  const loginSv01 = await req('POST', '/auth/login', null, { email: 'sv01@hcmut.edu.vn', password: 'Password123!' });
  record('TC-FR1-01 (API)', loginSv01.status === 200 && loginSv01.data?.user?.role === 'STUDENT', `HTTP ${loginSv01.status}, role=${loginSv01.data?.user?.role}`);
  const tokenSv01 = loginSv01.data?.accessToken;

  const loginCb01 = await req('POST', '/auth/login', null, { email: 'cb01@hcmut.edu.vn', password: 'Password123!' });
  const loginCb02 = await req('POST', '/auth/login', null, { email: 'cb02@hcmut.edu.vn', password: 'Password123!' });
  const loginGv01 = await req('POST', '/auth/login', null, { email: 'gv01@hcmut.edu.vn', password: 'Password123!' });
  const loginDv01 = await req('POST', '/auth/login', null, { email: 'dv01@fpt.com', password: 'Password123!' });
  const loginSv02 = await req('POST', '/auth/login', null, { email: 'sv02@hcmut.edu.vn', password: 'Password123!' });
  const loginSv03 = await req('POST', '/auth/login', null, { email: 'sv03@hcmut.edu.vn', password: 'Password123!' });
  const loginSv04 = await req('POST', '/auth/login', null, { email: 'sv04@hcmut.edu.vn', password: 'Password123!' });

  const tokenCb01 = loginCb01.data?.accessToken;
  const tokenCb02 = loginCb02.data?.accessToken;
  const tokenGv01 = loginGv01.data?.accessToken;
  const tokenDv01 = loginDv01.data?.accessToken;
  const tokenSv02 = loginSv02.data?.accessToken;
  const tokenSv03 = loginSv03.data?.accessToken;
  const tokenSv04 = loginSv04.data?.accessToken;

  record(
    'TC-FR1-02 (API)',
    loginCb01.data?.user?.role === 'OFFICER' && loginGv01.data?.user?.role === 'SUPERVISOR' && loginDv01.data?.user?.role === 'ENTERPRISE_REP',
    `CB01=${loginCb01.data?.user?.role}, GV01=${loginGv01.data?.user?.role}, DV01=${loginDv01.data?.user?.role}`,
  );

  const wrongPw = await req('POST', '/auth/login', null, { email: 'sv01@hcmut.edu.vn', password: 'WrongPassword!' });
  record('TC-FR1-03 (API)', wrongPw.status === 401, `HTTP ${wrongPw.status}: ${JSON.stringify(wrongPw.data?.message)}`);

  const nonExistent = await req('POST', '/auth/login', null, { email: 'khongtontai@hcmut.edu.vn', password: 'Password123!' });
  record('TC-FR1-04 (API)', nonExistent.status === 401 && nonExistent.data?.message === 'Invalid credentials', `HTTP ${nonExistent.status}: ${nonExistent.data?.message}`);

  const emptyLogin = await req('POST', '/auth/login', null, { email: '', password: '' });
  record('TC-FR1-05 (API)', emptyLogin.status === 400, `HTTP ${emptyLogin.status}: ${JSON.stringify(emptyLogin.data?.message)}`);

  const unauthOfficer = await req('GET', '/internships/dashboard/officer', null);
  record('TC-FR1-07 (API)', unauthOfficer.status === 401, `HTTP ${unauthOfficer.status}`);

  const svAccessOfficer = await req('GET', '/internships/dashboard/officer', tokenSv01);
  record('TC-FR1-08 (API)', svAccessOfficer.status === 403, `HTTP ${svAccessOfficer.status}`);

  // Check DB password hash (TC-FR1-10)
  const dbUser = await client.query(`SELECT password_hash FROM users WHERE email = 'sv01@hcmut.edu.vn'`);
  const hashVal = dbUser.rows[0].password_hash;
  record('TC-FR1-10', hashVal.includes(':') && !hashVal.includes('Password123!'), `Stored scrypt salt:hash (${hashVal.slice(0, 24)}...)`);

  // FR2 Tests
  const createSv01 = await req('POST', '/internships/profiles', tokenSv01, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Thực tập Backend Developer',
    position: 'Backend Developer Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
    description: 'Phát triển REST API với NestJS và PostgreSQL',
  });
  const profSv01Id = createSv01.data?.id;
  const submitSv01 = await req('POST', `/internships/profiles/${profSv01Id}/submit`, tokenSv01);
  record('TC-FR2-01 (API)', createSv01.status === 201 && submitSv01.status === 201 && submitSv01.data?.status === 'SUBMITTED', `Created & Submitted, status=${submitSv01.data?.status}`);

  // TC-FR2-02
  const createIncomplete = await req('POST', '/internships/profiles', tokenSv04, {
    periodId,
    title: 'Draft thiếu trường',
  });
  const profSv04Id = createIncomplete.data?.id;
  const submitIncomplete = await req('POST', `/internships/profiles/${profSv04Id}/submit`, tokenSv04);
  record('TC-FR2-02 (API)', submitIncomplete.status === 400, `HTTP ${submitIncomplete.status}: ${submitIncomplete.data?.message}`);

  // TC-FR2-04
  await req('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, {
    enterpriseId: ent1Id,
    position: 'QA Intern',
    internshipStartAt: '2026-11-15',
    internshipEndAt: '2026-10-01',
  });
  const submitBadDates = await req('POST', `/internships/profiles/${profSv04Id}/submit`, tokenSv04);
  record('TC-FR2-04 (API)', submitBadDates.status === 400, `HTTP ${submitBadDates.status}: ${submitBadDates.data?.message}`);

  // TC-FR2-05
  const pos255 = 'A'.repeat(255);
  const pos256 = 'A'.repeat(256);
  const patch255 = await req('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, { position: pos255 });
  const patch256 = await req('PATCH', `/internships/profiles/${profSv04Id}`, tokenSv04, { position: pos256 });
  record('TC-FR2-05 (API)', patch255.status === 200 && patch256.status === 400, `255 chars -> HTTP ${patch255.status}; 256 chars -> HTTP ${patch256.status}`);

  await req('DELETE', `/internships/profiles/${profSv04Id}`, tokenSv04);

  // TC-FR2-06
  const dupSv01 = await req('POST', '/internships/profiles', tokenSv01, {
    periodId,
    enterpriseId: ent1Id,
    position: 'Duplicate Intern',
  });
  record('TC-FR2-06 (API)', dupSv01.status === 400, `HTTP ${dupSv01.status}: ${dupSv01.data?.message}`);

  // TC-FR2-07
  const editSubmitted = await req('PATCH', `/internships/profiles/${profSv01Id}`, tokenSv01, {
    position: 'Updated Position While Submitted',
  });
  record('TC-FR2-07 (API)', editSubmitted.status === 200, `HTTP ${editSubmitted.status}: ${editSubmitted.data?.message}`);

  // Create & submit profiles for SV02 and SV03
  const createSv02 = await req('POST', '/internships/profiles', tokenSv02, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Thực tập Frontend Developer',
    position: 'Frontend Developer Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const profSv02Id = createSv02.data?.id;
  await req('POST', `/internships/profiles/${profSv02Id}/submit`, tokenSv02);

  const createSv03 = await req('POST', '/internships/profiles', tokenSv03, {
    periodId,
    enterpriseId: ent2Id,
    title: 'Thực tập UI/UX Designer',
    position: 'UI/UX Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const profSv03Id = createSv03.data?.id;
  await req('POST', `/internships/profiles/${profSv03Id}/submit`, tokenSv03);

  // TC-FR1-09
  const svApproveSv02 = await req('PATCH', `/internships/profiles/${profSv02Id}/review`, tokenSv01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  record('TC-FR1-09 (API)', svApproveSv02.status === 403, `HTTP ${svApproveSv02.status}`);

  // TC-FR2-09
  const sv01ReadSv02 = await req('GET', `/internships/profiles/${profSv02Id}`, tokenSv01);
  record('TC-FR2-09 (API)', sv01ReadSv02.status === 403, `HTTP ${sv01ReadSv02.status}: ${sv01ReadSv02.data?.message}`);

  // TC-FR2-11
  const createXss = await req('POST', '/internships/profiles', tokenSv04, {
    periodId,
    enterpriseId: ent1Id,
    title: '<script>alert(1)</script>',
    position: 'Security Intern',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  const xssId = createXss.data?.id;
  record('TC-FR2-11 (API)', createXss.status === 201 && createXss.data?.title === '<script>alert(1)</script>', `Stored safely as plain text JSON`);
  await req('DELETE', `/internships/profiles/${xssId}`, tokenSv04);

  // TC-FR2-12
  const cbCreateProfile = await req('POST', '/internships/profiles', tokenCb01, {
    periodId,
    enterpriseId: ent1Id,
    position: 'Officer Test',
  });
  record('TC-FR2-12 (API)', cbCreateProfile.status === 403, `HTTP ${cbCreateProfile.status}`);

  // TC-FR2-13
  const createVn = await req('POST', '/internships/profiles', tokenSv04, {
    periodId,
    enterpriseId: ent1Id,
    title: 'Công ty TNHH Phần mềm Đà Nẵng',
    position: 'Kỹ sư Phần mềm',
    internshipStartAt: '2026-09-15',
    internshipEndAt: '2026-12-15',
  });
  record('TC-FR2-13 (API)', createVn.status === 201 && createVn.data?.title === 'Công ty TNHH Phần mềm Đà Nẵng', `UTF-8 preserved: ${createVn.data?.title}`);
  await req('POST', `/internships/profiles/${createVn.data?.id}/submit`, tokenSv04);
  const profSv04SubId = createVn.data?.id;

  // FR3 Tests
  const listPending = await req('GET', '/internships/profiles?status=SUBMITTED', tokenCb01);
  record('TC-FR3-01 (API)', listPending.status === 200 && listPending.data?.total >= 3, `HTTP 200, total SUBMITTED=${listPending.data?.total}`);

  const detailSv01 = await req('GET', `/internships/profiles/${profSv01Id}`, tokenCb01);
  record('TC-FR3-02 (API)', detailSv01.status === 200 && detailSv01.data?.id === profSv01Id, `HTTP 200, position=${detailSv01.data?.position}`);

  const approveSv01 = await req('PATCH', `/internships/profiles/${profSv01Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  record('TC-FR3-03 (API)', approveSv01.status === 200 && approveSv01.data?.status === 'APPROVED', `Status=${approveSv01.data?.status}, supervisorId=${approveSv01.data?.supervisorId}`);

  await req('PATCH', `/internships/profiles/${profSv03Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv02Id,
  });

  // TC-FR2-08
  const editApproved = await req('PATCH', `/internships/profiles/${profSv01Id}`, tokenSv01, {
    position: 'Try Edit After Approved',
  });
  record('TC-FR2-08 (API)', editApproved.status === 400, `HTTP ${editApproved.status}: ${editApproved.data?.message}`);

  // TC-FR3-05
  const rejectNoReason = await req('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb01, {
    status: 'REJECTED',
    reason: '   ',
  });
  record('TC-FR3-05 (API)', rejectNoReason.status === 400, `HTTP ${rejectNoReason.status}: ${rejectNoReason.data?.message}`);

  // TC-FR3-04
  const rejectWithReason = await req('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb01, {
    status: 'REJECTED',
    reason: 'Thiếu thông tin người hướng dẫn',
  });
  record('TC-FR3-04 (API)', rejectWithReason.status === 200 && rejectWithReason.data?.status === 'REJECTED' && rejectWithReason.data?.lastStatusReason === 'Thiếu thông tin người hướng dẫn', `Status=${rejectWithReason.data?.status}, reason=${rejectWithReason.data?.lastStatusReason}`);

  // TC-FR3-06
  const approveAgain = await req('PATCH', `/internships/profiles/${profSv01Id}/review`, tokenCb01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  record('TC-FR3-06 (API)', approveAgain.status === 400, `HTTP ${approveAgain.status}: ${approveAgain.data?.message}`);

  // TC-FR3-07
  const gvReview = await req('PATCH', `/internships/profiles/${profSv02Id}/review`, tokenGv01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  const dvReview = await req('PATCH', `/internships/profiles/${profSv02Id}/review`, tokenDv01, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  record('TC-FR3-07 (API)', gvReview.status === 403 && dvReview.status === 403, `GV01 -> ${gvReview.status}, DV01 -> ${dvReview.status}`);

  // TC-FR3-08
  const cb02Review = await req('PATCH', `/internships/profiles/${profSv04SubId}/review`, tokenCb02, {
    status: 'APPROVED',
    supervisorId: gv01Id,
  });
  record('TC-FR3-08 (API)', cb02Review.status === 400, `Second review blocked: HTTP ${cb02Review.status} (${cb02Review.data?.message})`);

  // TC-FR3-09
  const editAfterRejected = await req('PATCH', `/internships/profiles/${profSv04SubId}`, tokenSv04, {
    position: 'Updated After Rejected',
  });
  record('TC-FR3-09 (API)', editAfterRejected.status === 200, `HTTP ${editAfterRejected.status}: ${editAfterRejected.data?.message}`);

  // TC-FR3-10
  const sv01WithHistory = await req('GET', `/internships/profiles/${profSv01Id}`, tokenCb01);
  const hist = sv01WithHistory.data?.statusHistory || [];
  const approveEntry = hist.find((h) => h.toStatus === 'APPROVED');
  record('TC-FR3-10 (API)', !!approveEntry && approveEntry.changedBy === cb01Id && !!approveEntry.createdAt, `changedBy=${approveEntry?.changedBy}, createdAt=${approveEntry?.createdAt}`);

  // TC-FR3-11
  const searchRes = await req('GET', '/internships/profiles?status=APPROVED&search=Minh', tokenCb01);
  const searchEmpty = await req('GET', '/internships/profiles?search=KhongCoSinhVienNay999', tokenCb01);
  record('TC-FR3-11 (API)', searchRes.status === 200 && searchRes.data?.total === 1 && searchEmpty.data?.total === 0, `Search 'Minh' -> ${searchRes.data?.total}, Search nonexistent -> ${searchEmpty.data?.total}`);

  // FR4 Tests
  const prog1 = await req('POST', `/progress/profiles/${profSv01Id}/updates`, tokenSv01, {
    reportPeriod: 'Tuần 1',
    work: 'Tìm hiểu quy trình dự án và cài đặt môi trường phát triển',
    outcome: 'Hoàn thành cấu hình Docker và NestJS local',
    difficulties: 'Chưa quen cấu trúc monorepo',
  });
  await req('POST', `/progress/profiles/${profSv01Id}/updates`, tokenSv01, {
    reportPeriod: 'Tuần 2',
    work: 'Thiết kế schema cơ sở dữ liệu và viết migration',
    outcome: 'Hoàn thành 19 bảng dữ liệu trên PostgreSQL',
    difficulties: 'Không có',
  });
  await req('POST', `/progress/profiles/${profSv01Id}/updates`, tokenSv01, {
    reportPeriod: 'Tuần 3',
    work: 'Xây dựng API xác thực và phân quyền RBAC',
    outcome: 'Đạt 100% unit test cho module Auth',
    difficulties: 'Không có',
  });
  record('TC-FR4-01 (API)', prog1.status === 201 && !!prog1.data?.id, `Created progress update id=${prog1.data?.id}`);

  const progEmpty = await req('POST', `/progress/profiles/${profSv01Id}/updates`, tokenSv01, {
    reportPeriod: 'Tuần 4',
    work: '',
    outcome: '',
  });
  record('TC-FR4-02 (API)', progEmpty.status === 400, `HTTP ${progEmpty.status}: ${JSON.stringify(progEmpty.data?.message)}`);

  const progSv02 = await req('POST', `/progress/profiles/${profSv02Id}/updates`, tokenSv02, {
    reportPeriod: 'Tuần 1',
    work: 'Thử cập nhật khi chưa duyệt',
    outcome: 'Kết quả',
  });
  record('TC-FR4-03 (API)', progSv02.status === 400, `HTTP ${progSv02.status}: ${progSv02.data?.message}`);

  const listProgSv01 = await req('GET', `/progress/profiles/${profSv01Id}/updates`, tokenSv01);
  record('TC-FR4-04 (API)', listProgSv01.status === 200 && listProgSv01.data?.total === 3, `Total updates=${listProgSv01.data?.total}`);

  const editProg1 = await req('PATCH', `/progress/updates/${prog1.data?.id}`, tokenSv01, {
    reportPeriod: 'Tuần 1',
    work: 'Tìm hiểu quy trình dự án, cài đặt môi trường (Đã cập nhật)',
    outcome: 'Hoàn thành cấu hình Docker, NestJS và PostgreSQL',
    difficulties: 'Đã giải quyết',
  });
  record('TC-FR4-05 (API)', editProg1.status === 200 && editProg1.data?.work.includes('(Đã cập nhật)'), `HTTP ${editProg1.status}, updated work`);

  const cbViewProg = await req('GET', `/progress/profiles/${profSv01Id}/updates`, tokenCb01);
  record('TC-FR4-06 (API)', cbViewProg.status === 200 && cbViewProg.data?.total === 3, `HTTP 200, total=${cbViewProg.data?.total}`);

  const gv01ViewSv01 = await req('GET', `/progress/profiles/${profSv01Id}/updates`, tokenGv01);
  record('TC-FR4-07 (API)', gv01ViewSv01.status === 200 && gv01ViewSv01.data?.total === 3, `HTTP 200, total=${gv01ViewSv01.data?.total}`);

  const gv01ViewSv03 = await req('GET', `/progress/profiles/${profSv03Id}/updates`, tokenGv01);
  record('TC-FR4-08 (API)', gv01ViewSv03.status === 403, `HTTP ${gv01ViewSv03.status}: ${gv01ViewSv03.data?.message}`);

  const sv02ViewSv01 = await req('GET', `/progress/profiles/${profSv01Id}/updates`, tokenSv02);
  record('TC-FR4-09 (API)', sv02ViewSv01.status === 403, `HTTP ${sv02ViewSv01.status}: ${sv02ViewSv01.data?.message}`);

  const over10k = await req('POST', `/progress/profiles/${profSv01Id}/updates`, tokenSv01, {
    reportPeriod: 'Tuần 4',
    work: 'X'.repeat(10001),
    outcome: 'OK',
  });
  record('TC-FR4-10 (API)', over10k.status === 400, `HTTP ${over10k.status}: ${JSON.stringify(over10k.data?.message)}`);

  // TC-NFR-01: Performance test with 500 registrations
  console.log('--- 3. Running TC-NFR-01 (500 registrations performance test) ---');
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

  const perfRes = await req('GET', '/internships/profiles?page=1&limit=100', tokenCb01);
  record(
    'TC-NFR-01 (API)',
    perfRes.status === 200 && perfRes.elapsedMs < 3000 && perfRes.data?.total >= 500,
    `Total records=${perfRes.data?.total}, Response time=${perfRes.elapsedMs}ms (< 3000ms threshold)`,
  );

  await client.query(`DELETE FROM internship_profiles WHERE student_id = ANY($1::uuid[])`, [bulkUserIds]);
  await client.query(`DELETE FROM students WHERE user_id = ANY($1::uuid[])`, [bulkUserIds]);
  await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [bulkUserIds]);

  await client.end();
  console.log('--- Completed Automated Test Suite & Cleaned Bulk Records ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

