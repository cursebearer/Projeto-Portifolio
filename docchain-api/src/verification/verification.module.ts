import { Module } from '@nestjs/common';
import { VerificationAttemptService } from './verification-attempt.service';
import { VerifyController } from './verify.controller';

@Module({
  controllers: [VerifyController],
  providers: [VerificationAttemptService],
  exports: [VerificationAttemptService],
})
export class VerificationModule {}
