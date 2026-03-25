import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubmissionStatus } from 'generated/prisma/enums';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New submission status',
    enum: SubmissionStatus,
  })
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;
}
