import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlarmEntity } from './alarm.entity';
import { Alarm } from './alarm.types';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { AlarmRuleType } from './dto/create-alarm.dto';

@Injectable()
export class AlarmService {
  constructor(
    @InjectRepository(AlarmEntity)
    private readonly alarmRepository: Repository<AlarmEntity>,
  ) {}

  async createAlarm(dto: CreateAlarmDto): Promise<Alarm> {
    if (dto.ruleType === AlarmRuleType.TargetPrice && dto.targetPrice === undefined) {
      throw new BadRequestException('targetPrice is required for TARGET_PRICE rule');
    }
    if (dto.ruleType === AlarmRuleType.PercentageDrop && dto.percentageDrop === undefined) {
      throw new BadRequestException('percentageDrop is required for PERCENTAGE_DROP rule');
    }

    const alarm = this.alarmRepository.create({
      productName: dto.productName,
      productUrl: dto.productUrl ?? null,
      searchQuery: dto.searchQuery?.trim() || dto.productName.trim(),
      initialPrice: dto.initialPrice === undefined ? null : dto.initialPrice.toString(),
      currentPrice: null,
      ruleType: dto.ruleType,
      targetPrice: dto.targetPrice?.toString() ?? null,
      percentageDrop: dto.percentageDrop?.toString() ?? null,
      targetChatIds: dto.targetChatIds,
      isActive: true,
      triggeredAt: null,
    });

    return this.toAlarm(await this.alarmRepository.save(alarm));
  }

  async findAll(): Promise<Alarm[]> {
    const alarms = await this.alarmRepository.find({
      order: { createdAt: 'DESC' },
    });
    return alarms.map((alarm) => this.toAlarm(alarm));
  }

  async findActive(): Promise<Alarm[]> {
    const alarms = await this.alarmRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    return alarms.map((alarm) => this.toAlarm(alarm));
  }

  async updatePrice(id: string, currentPrice: number): Promise<void> {
    await this.alarmRepository.update(id, { currentPrice: currentPrice.toString() });
  }

  async setInitialPrice(id: string, initialPrice: number, productUrl?: string): Promise<void> {
    await this.alarmRepository.update(id, {
      initialPrice: initialPrice.toString(),
      currentPrice: initialPrice.toString(),
      productUrl: productUrl ?? null,
    });
  }

  async markTriggered(id: string): Promise<void> {
    await this.alarmRepository.update(id, {
      isActive: false,
      triggeredAt: new Date(),
    });
  }

  shouldTrigger(alarm: Alarm, currentPrice: number): boolean {
    if (alarm.ruleType === AlarmRuleType.TargetPrice) {
      return currentPrice <= (alarm.targetPrice ?? 0);
    }

    if (alarm.initialPrice === null) {
      return false;
    }

    const dropRate = ((alarm.initialPrice - currentPrice) / alarm.initialPrice) * 100;
    return dropRate >= (alarm.percentageDrop ?? Number.POSITIVE_INFINITY);
  }

  private toAlarm(entity: AlarmEntity): Alarm {
    return {
      id: entity.id,
      productName: entity.productName,
      productUrl: entity.productUrl ?? undefined,
      searchQuery: entity.searchQuery,
      initialPrice: entity.initialPrice === null ? null : Number(entity.initialPrice),
      currentPrice: entity.currentPrice === null ? null : Number(entity.currentPrice),
      ruleType: entity.ruleType,
      targetPrice: entity.targetPrice === null ? undefined : Number(entity.targetPrice),
      percentageDrop: entity.percentageDrop === null ? undefined : Number(entity.percentageDrop),
      targetChatIds: entity.targetChatIds ?? [],
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      triggeredAt: entity.triggeredAt?.toISOString(),
    };
  }
}
