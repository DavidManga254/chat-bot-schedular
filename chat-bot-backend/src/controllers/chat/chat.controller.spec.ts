import { Test, TestingModule } from '@nestjs/testing';
import { ChatControllerController } from './chat.controller';

describe('ChatControllerController', () => {
  let controller: ChatControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatControllerController],
    }).compile();

    controller = module.get<ChatControllerController>(ChatControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
