import { PartialType } from '@nestjs/swagger';
import { CreateBuildingTypeFieldDto } from './create-building-type-field.dto';

export class UpdateBuildingTypeFieldDto extends PartialType(
  CreateBuildingTypeFieldDto,
) {}
