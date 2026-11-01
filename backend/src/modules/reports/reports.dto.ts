import { ApiProperty } from '@nestjs/swagger';

export class ReportMetadataResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) profileId!: string;
  @ApiProperty() version!: number;
  @ApiProperty() originalName!: string;
  @ApiProperty({
    enum: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  })
  mimeType!: string;
  @ApiProperty({ type: 'string', example: '1048576' }) sizeBytes!: string;
  @ApiProperty({ format: 'date-time' }) submittedAt!: Date;
  @ApiProperty() isLate!: boolean;
}

export class ReportPageResponseDto {
  @ApiProperty({ type: [ReportMetadataResponseDto] }) items!: ReportMetadataResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
