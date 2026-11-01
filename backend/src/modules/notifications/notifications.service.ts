import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../database/entities.entity';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly repository: NotificationsRepository) {}
  async notify(userId: string, title: string, content: string) {
    try {
      return await this.repository.create({ userId, title, content });
    } catch {
      this.logger.error('Failed to create in-app notification');
      return null;
    }
  }
  async notifyOfficers(title: string, content: string) {
    try {
      return await this.repository.notifyRole(UserRole.OFFICER, title, content);
    } catch {
      this.logger.error('Failed to create officer notifications');
      return null;
    }
  }
  list(userId: string, page: number, limit: number) {
    return this.repository.list(userId, page, limit);
  }
  async markRead(id: string, userId: string) {
    const notification = await this.repository.findForUser(id, userId);
    if (!notification) throw new NotFoundException('Notification not found');
    notification.readAt ??= new Date();
    return this.repository.save(notification);
  }
}
