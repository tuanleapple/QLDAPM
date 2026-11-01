import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountStatus, Notification, User, UserRole } from '../../database/entities.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}
  create(input: Pick<Notification, 'userId' | 'title' | 'content'>) {
    return this.notifications.save(this.notifications.create(input));
  }
  async notifyRole(role: UserRole, title: string, content: string) {
    const recipients = await this.users.find({
      where: { role, status: AccountStatus.ACTIVE },
      select: { id: true },
    });
    if (recipients.length)
      await this.notifications.insert(recipients.map(({ id }) => ({ userId: id, title, content })));
  }
  async list(userId: string, page: number, limit: number) {
    const [items, total] = await this.notifications.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  findForUser(id: string, userId: string) {
    return this.notifications.findOne({ where: { id, userId } });
  }
  save(notification: Notification) {
    return this.notifications.save(notification);
  }
}
