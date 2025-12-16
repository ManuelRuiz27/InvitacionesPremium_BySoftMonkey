import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class StaffService {
  async login() {
    throw new NotImplementedException(
      'Staff login flow pending implementation',
    );
  }
}
