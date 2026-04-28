import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentStatus } from './document-status.enum';

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_email', type: 'varchar', length: 320 })
  userEmail: string;

  @Column({ name: 'user_filename', type: 'varchar', length: 255 })
  userFilename: string;

  @Index({ unique: true })
  @Column({ name: 's3_filename', type: 'varchar', length: 255 })
  s3Filename: string;

  @Column({ name: 's3_bucket', type: 'varchar', length: 255 })
  s3Bucket: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.Pending,
  })
  status: DocumentStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'indexed_at', type: 'timestamptz', nullable: true })
  indexedAt: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
