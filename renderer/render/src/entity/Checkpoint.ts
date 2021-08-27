import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Checkpoint {
  @PrimaryColumn()
  firstKey!: string;

  @Column()
  videoFilename!: string;
}