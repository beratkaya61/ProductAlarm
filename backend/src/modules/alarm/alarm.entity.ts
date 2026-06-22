import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AlarmRuleType } from './dto/create-alarm.dto';

@Entity({ name: 'alarms' })
export class AlarmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 240 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productUrl: string | null;

  @Column({ type: 'varchar', length: 240, default: '' })
  searchQuery: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  initialPrice: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  currentPrice: string | null;

  @Column({ type: 'enum', enum: AlarmRuleType })
  ruleType: AlarmRuleType;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  targetPrice: string | null;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  percentageDrop: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  targetChatIds: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  triggeredAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
