import { AlarmRuleType } from './dto/create-alarm.dto';

export interface Alarm {
  id: string;
  productName: string;
  productUrl?: string;
  searchQuery: string;
  initialPrice: number | null;
  currentPrice: number | null;
  ruleType: AlarmRuleType;
  targetPrice?: number;
  percentageDrop?: number;
  targetChatIds: string[];
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}
