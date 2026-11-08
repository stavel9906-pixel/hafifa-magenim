import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'drones' })
@Check('CHK_drones_latitude_range', '"latitude" BETWEEN -90 AND 90')
@Check('CHK_drones_longitude_range', '"longitude" BETWEEN -180 AND 180')
export class Drone {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_drones' })
  id: string;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Index('IDX_drones_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
