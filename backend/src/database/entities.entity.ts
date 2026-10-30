import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'STUDENT',
  OFFICER = 'OFFICER',
  SUPERVISOR = 'SUPERVISOR',
  ENTERPRISE_REP = 'ENTERPRISE_REP',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}
export enum ProfileStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export enum FormType {
  ENTERPRISE = 'ENTERPRISE',
  SUPERVISOR_PROCESS = 'SUPERVISOR_PROCESS',
  SUPERVISOR_REPORT = 'SUPERVISOR_REPORT',
}
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 320 }) email!: string;
  @Column({ name: 'password_hash', length: 255, select: false }) passwordHash!: string;
  @Column({ type: 'enum', enum: UserRole }) role!: UserRole;
  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;
  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshTokenHash!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @OneToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ name: 'student_code', length: 50, unique: true }) studentCode!: string;
  @Column({ name: 'full_name', length: 200 }) fullName!: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) major!: string | null;
}

@Entity('officers')
export class Officer {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @OneToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ name: 'full_name', length: 200 }) fullName!: string;
}

@Entity('supervisors')
export class Supervisor {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @OneToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ name: 'full_name', length: 200 }) fullName!: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) department!: string | null;
}

@Entity('enterprises')
@Unique(['name'])
export class Enterprise {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 255 }) name!: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) address!: string | null;
  @Column({ type: 'varchar', length: 50, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) website!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('enterprise_reps')
export class EnterpriseRep {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @OneToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ name: 'enterprise_id', type: 'uuid' }) enterpriseId!: string;
  @ManyToOne(() => Enterprise, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise!: Enterprise;
  @Column({ name: 'full_name', length: 200 }) fullName!: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) phone!: string | null;
}

@Entity('internship_periods')
@Index(['startDate', 'endDate'])
export class InternshipPeriod {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 }) name!: string;
  @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @Column({ name: 'end_date', type: 'date' }) endDate!: string;
  @Column({ name: 'registration_open_at', type: 'timestamptz' }) registrationOpenAt!: Date;
  @Column({ name: 'registration_close_at', type: 'timestamptz' }) registrationCloseAt!: Date;
  @Column({ name: 'report_deadline', type: 'timestamptz', nullable: true })
  reportDeadline!: Date | null;
  @Column({ default: true }) active!: boolean;
}

@Entity('internship_profiles')
@Unique(['studentId', 'periodId'])
export class InternshipProfile {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'student_id', type: 'uuid' }) studentId!: string;
  @ManyToOne(() => Student, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student!: Student;
  @Column({ name: 'period_id', type: 'uuid' }) periodId!: string;
  @ManyToOne(() => InternshipPeriod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'period_id' })
  period!: InternshipPeriod;
  @Column({ name: 'enterprise_id', type: 'uuid', nullable: true }) enterpriseId!: string | null;
  @ManyToOne(() => Enterprise, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise!: Enterprise | null;
  @Column({ name: 'supervisor_id', type: 'uuid', nullable: true }) supervisorId!: string | null;
  @ManyToOne(() => Supervisor, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'supervisor_id', referencedColumnName: 'userId' })
  supervisor!: Supervisor | null;
  @Column({ length: 255 }) title!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ type: 'enum', enum: ProfileStatus, default: ProfileStatus.DRAFT })
  status!: ProfileStatus;
  @Column({ name: 'last_status_reason', type: 'text', nullable: true }) lastStatusReason!:
    string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('status_histories')
export class StatusHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @ManyToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column({ name: 'from_status', type: 'enum', enum: ProfileStatus, nullable: true })
  fromStatus!: ProfileStatus | null;
  @Column({ name: 'to_status', type: 'enum', enum: ProfileStatus }) toStatus!: ProfileStatus;
  @Column({ name: 'changed_by', type: 'uuid' }) changedBy!: string;
  @Column({ type: 'text', nullable: true }) reason!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('progress_updates')
export class ProgressUpdate {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @ManyToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column({ name: 'report_period', length: 100 }) reportPeriod!: string;
  @Column({ type: 'text' }) content!: string;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @ManyToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column({ name: 'author_id', type: 'uuid' }) authorId!: string;
  @Column({ type: 'text' }) content!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('reports')
@Unique(['profileId', 'version'])
export class Report {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @ManyToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column() version!: number;
  @Column({ name: 'storage_name', length: 255 }) storageName!: string;
  @Column({ name: 'original_name', length: 255 }) originalName!: string;
  @Column({ name: 'mime_type', length: 100 }) mimeType!: string;
  @Column({ name: 'size_bytes', type: 'bigint' }) sizeBytes!: string;
  @Column({ name: 'submitted_at', type: 'timestamptz' }) submittedAt!: Date;
  @Column({ name: 'is_late', default: false }) isLate!: boolean;
}

@Entity('criteria')
@Unique(['periodId', 'formType', 'code'])
export class Criteria {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'period_id', type: 'uuid' }) periodId!: string;
  @ManyToOne(() => InternshipPeriod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'period_id' })
  period!: InternshipPeriod;
  @Column({ type: 'enum', enum: FormType }) formType!: FormType;
  @Column({ length: 50 }) code!: string;
  @Column({ length: 255 }) name!: string;
  @Column({ type: 'numeric', precision: 8, scale: 5 }) weight!: string;
  @Column({ default: true }) active!: boolean;
}

@Entity('evaluation_forms')
@Unique(['profileId', 'formType'])
export class EvaluationForm {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @ManyToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column({ name: 'form_type', type: 'enum', enum: FormType }) formType!: FormType;
  @Column({ name: 'evaluator_id', type: 'uuid' }) evaluatorId!: string;
  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.DRAFT })
  status!: SubmissionStatus;
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true }) submittedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('evaluation_details')
export class EvaluationDetail {
  @PrimaryColumn({ name: 'form_id', type: 'uuid' }) formId!: string;
  @ManyToOne(() => EvaluationForm, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'form_id' })
  form!: EvaluationForm;
  @PrimaryColumn({ name: 'criteria_id', type: 'uuid' }) criteriaId!: string;
  @ManyToOne(() => Criteria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'criteria_id' })
  criteria!: Criteria;
  @Column({ type: 'numeric', precision: 4, scale: 2 }) score!: string;
  @Column({ type: 'text', nullable: true }) comment!: string | null;
}

@Entity('results')
@Unique(['profileId'])
export class Result {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId!: string;
  @OneToOne(() => InternshipProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile!: InternshipProfile;
  @Column({ name: 'enterprise_score', type: 'numeric', precision: 5, scale: 2 })
  enterpriseScore!: string;
  @Column({ name: 'supervisor_process_score', type: 'numeric', precision: 5, scale: 2 })
  supervisorProcessScore!: string;
  @Column({ name: 'supervisor_report_score', type: 'numeric', precision: 5, scale: 2 })
  supervisorReportScore!: string;
  @Column({ name: 'total_score', type: 'numeric', precision: 5, scale: 2 }) totalScore!: string;
  @Column({ name: 'is_finalized', default: false }) isFinalized!: boolean;
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt!: Date | null;
  @Column({ name: 'finalized_by', type: 'uuid', nullable: true }) finalizedBy!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ length: 255 }) title!: string;
  @Column({ type: 'text' }) content!: string;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId!: string | null;
  @Column({ length: 100 }) action!: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) resource!: string | null;
  @Column({ name: 'resource_id', type: 'uuid', nullable: true }) resourceId!: string | null;
  @Column({ type: 'jsonb', nullable: true }) metadata!: Record<string, unknown> | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
