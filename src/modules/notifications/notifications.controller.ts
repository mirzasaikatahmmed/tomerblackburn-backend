import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PatchNotificationDto } from './dto/patch-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get recent activities (notifications)',
    description: 'Returns recent activity logs to show as notifications',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of activities to return (default 10, max 50)',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    type: Boolean,
    description: 'Filter by read status: true = read only, false = unread only',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent activities retrieved successfully',
  })
  async getRecentActivities(
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : NaN;
    const take =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;

    const readFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    const activities = await this.prisma.activityLog.findMany({
      where: {
        entityType: { in: ['submission', 'contact_us'] },
        ...(readFilter !== undefined && { isRead: readFilter }),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return activities;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update notification read status',
    description: 'Mark a notification as read or unread',
  })
  @ApiParam({ name: 'id', description: 'Notification (activity log) ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async patch(@Param('id') id: string, @Body() dto: PatchNotificationDto) {
    const activity = await this.prisma.activityLog.findFirst({
      where: {
        id,
        entityType: { in: ['submission', 'contact_us'] },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const updated = await this.prisma.activityLog.update({
      where: { id },
      data: { isRead: dto.isRead },
    });

    return updated;
  }
}
