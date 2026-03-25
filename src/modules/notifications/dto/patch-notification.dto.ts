import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchNotificationDto {
  @ApiProperty({
    description: 'Mark the notification as read or unread',
    example: true,
  })
  @IsBoolean()
  isRead: boolean;
}
