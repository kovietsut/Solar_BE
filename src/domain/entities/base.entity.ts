import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  updatedAt: Date | null;

  @ApiProperty({ required: false })
  createdBy: string | null;

  @ApiProperty({ required: false })
  updatedBy: string | null;

  @ApiProperty()
  isDeleted: boolean;
}
