import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

describe('Main Application', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
