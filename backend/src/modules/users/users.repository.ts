import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../database/entities.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async list(page: number, limit: number, role?: string, search?: string) {
    const qb = this.users
      .createQueryBuilder('account')
      .leftJoin('students', 'student', 'student.user_id = account.id')
      .leftJoin('officers', 'officer', 'officer.user_id = account.id')
      .leftJoin('supervisors', 'supervisor', 'supervisor.user_id = account.id')
      .leftJoin('enterprise_reps', 'enterprise_rep', 'enterprise_rep.user_id = account.id')
      .leftJoin('enterprises', 'enterprise', 'enterprise.id = enterprise_rep.enterprise_id')
      .select([
        'account.id',
        'account.email',
        'account.role',
        'account.status',
        'account.createdAt',
        'account.updatedAt',
      ])
      .addSelect(
        'COALESCE(student.full_name, officer.full_name, supervisor.full_name, enterprise_rep.full_name)',
        'display_name',
      )
      .addSelect('student.student_code', 'student_code')
      .addSelect('COALESCE(student.phone, enterprise_rep.phone)', 'phone')
      .addSelect('student.major', 'major')
      .addSelect('supervisor.department', 'department')
      .addSelect('enterprise_rep.enterprise_id', 'enterprise_id')
      .addSelect('enterprise.name', 'enterprise_name')
      .orderBy('account.createdAt', 'DESC')
      .addOrderBy('account.id', 'DESC');
    if (role) qb.andWhere('account.role = :role', { role });
    if (search?.trim())
      qb.andWhere(
        '(account.email ILIKE :search OR student.full_name ILIKE :search OR officer.full_name ILIKE :search OR supervisor.full_name ILIKE :search OR enterprise_rep.full_name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    // Fetch entities and their joined profile columns from the same paginated query.
    // getRawMany with skip/take on a joined query does not paginate the raw profile rows.
    const [{ entities, raw }, total] = await Promise.all([
      qb
        .clone()
        .skip((page - 1) * limit)
        .take(limit)
        .getRawAndEntities(),
      qb.clone().getCount(),
    ]);
    const profilesByUserId = new Map(raw.map((row) => [row.account_id, row]));
    return {
      items: entities.map((user) => this.publicAccount(user, profilesByUserId.get(user.id) ?? {})),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async find(id: string) {
    const rows = await this.dataSource.query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at AS "createdAt", u.updated_at AS "updatedAt",
       COALESCE(s.full_name, o.full_name, sp.full_name, er.full_name) AS "displayName",
       s.student_code AS "studentCode", COALESCE(s.phone, er.phone) AS "phone", s.major AS "major",
       sp.department AS "department", er.enterprise_id AS "enterpriseId", e.name AS "enterpriseName"
       FROM users u LEFT JOIN students s ON s.user_id=u.id LEFT JOIN officers o ON o.user_id=u.id
       LEFT JOIN supervisors sp ON sp.user_id=u.id LEFT JOIN enterprise_reps er ON er.user_id=u.id
       LEFT JOIN enterprises e ON e.id=er.enterprise_id WHERE u.id=$1`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      profile: {
        fullName: row.displayName,
        studentCode: row.studentCode,
        phone: row.phone,
        major: row.major,
        department: row.department,
        enterpriseId: row.enterpriseId,
        enterpriseName: row.enterpriseName,
      },
    };
  }

  findEntity(id: string) {
    return this.users.findOne({ where: { id } });
  }
  save(user: User) {
    return this.users.save(user);
  }
  transaction<T>(work: (manager: import('typeorm').EntityManager) => Promise<T>) {
    return this.dataSource.transaction(work);
  }

  private publicAccount(user: User, raw: Record<string, unknown>) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        fullName: raw.display_name ?? null,
        studentCode: raw.student_code ?? null,
        phone: raw.phone ?? null,
        major: raw.major ?? null,
        department: raw.department ?? null,
        enterpriseId: raw.enterprise_id ?? null,
        enterpriseName: raw.enterprise_name ?? null,
      },
    };
  }
}
