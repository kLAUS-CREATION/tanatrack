import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectChangeDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
