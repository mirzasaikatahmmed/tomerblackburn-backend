import { PartialType } from '@nestjs/swagger';
import { CreateBuildingTypeDto } from './create-building-type.dto';

export class UpdateBuildingTypeDto extends PartialType(CreateBuildingTypeDto) {}
