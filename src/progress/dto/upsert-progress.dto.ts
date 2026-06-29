import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProgressStatus } from '../../common/enums/progress-status.enum';

export class UpsertProgressDto {
  @IsOptional()
  @IsEnum(ProgressStatus)
  status?: ProgressStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}
