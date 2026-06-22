import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export enum AlarmRuleType {
  TargetPrice = 'TARGET_PRICE',
  PercentageDrop = 'PERCENTAGE_DROP',
}

export class CreateAlarmDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  productUrl?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialPrice?: number;

  @IsEnum(AlarmRuleType)
  ruleType: AlarmRuleType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  percentageDrop?: number;

  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  targetChatIds: string[];
}
