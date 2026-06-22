import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'product_offers' })
@Index(['query', 'providerId', 'url'], { unique: true })
export class ProductOfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 240 })
  query: string;

  @Column({ type: 'varchar', length: 80 })
  providerId: string;

  @Column({ type: 'varchar', length: 120 })
  providerName: string;

  @Column({ type: 'varchar', length: 320 })
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  price: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  previousPrice: string | null;

  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
