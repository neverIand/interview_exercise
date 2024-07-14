import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectID, ObjectId } from 'mongodb';
import { MessageData } from './message.data';
import { ChatMessageModel, ChatMessageSchema } from './models/message.model';

import { ConfigManagerModule } from '../configuration/configuration-manager.module';
import { getTestConfiguration } from '../configuration/configuration-manager.utils';
import { TagType } from '../conversation/models/CreateChatConversation.dto';

const id = new ObjectID('5fe0cce861c8ea54018385af');
const conversationId = new ObjectID();
const senderId = new ObjectID('5fe0cce861c8ea54018385af');
const sender2Id = new ObjectID('5fe0cce861c8ea54018385aa');
const sender3Id = new ObjectID('5fe0cce861c8ea54018385ab');

class TestMessageData extends MessageData {
  async deleteMany() {
    await this.chatMessageModel.deleteMany();
  }
}

describe('MessageData', () => {
  let messageData: TestMessageData;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigManagerModule],
          useFactory: () => {
            const databaseConfig = getTestConfiguration().database;
            return {
              uri: databaseConfig.connectionString,
            };
          },
        }),
        MongooseModule.forFeature([
          { name: ChatMessageModel.name, schema: ChatMessageSchema },
        ]),
      ],
      providers: [TestMessageData],
    }).compile();

    messageData = module.get<TestMessageData>(TestMessageData);
  });

  beforeEach(async () => {
    messageData.deleteMany();
  });

  afterEach(async () => {
    messageData.deleteMany();
  });

  it('should be defined', () => {
    expect(messageData).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(messageData.create).toBeDefined();
    });

    it('successfully creates a message', async () => {
      const conversationId = new ObjectID();
      const message = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
      );

      expect(message).toMatchObject({
        likes: [],
        resolved: false,
        deleted: false,
        reactions: [],
        text: 'Hello world',
        senderId: senderId,
        conversationId: conversationId,
        conversation: { id: conversationId.toHexString() },
        likesCount: 0,
        sender: { id: senderId.toHexString() },
      });
    });

    it('successfully creates a message with tags', async () => {
      const conversationId = new ObjectID();
      const message = await messageData.create(
        {
          conversationId,
          text: 'Hello world with tags',
          tags: [
            { id: 'tag1', type: TagType.subTopic },
            { id: 'tag2', type: TagType.subTopic },
          ],
        },
        senderId,
      );

      expect(message).toMatchObject({
        likes: [],
        resolved: false,
        deleted: false,
        reactions: [],
        text: 'Hello world with tags',
        senderId: senderId,
        conversationId: conversationId,
        conversation: { id: conversationId.toHexString() },
        likesCount: 0,
        sender: { id: senderId.toHexString() },
        tags: [
          { id: 'tag1', type: TagType.subTopic },
          { id: 'tag2', type: TagType.subTopic },
        ],
      });
    });
  });

  describe('get', () => {
    it('should be defined', () => {
      expect(messageData.getMessage).toBeDefined();
    });

    it('successfully gets a message', async () => {
      const conversationId = new ObjectID();
      const sentMessage = await messageData.create(
        { conversationId, text: 'Hello world' },
        senderId,
      );

      const gotMessage = await messageData.getMessage(
        sentMessage.id.toHexString(),
      );

      expect(gotMessage).toMatchObject(sentMessage);
    });
  });

  describe('delete', () => {
    it('successfully marks a message as deleted', async () => {
      const conversationId = new ObjectID();
      const message = await messageData.create(
        { conversationId, text: 'Message to delete' },
        senderId,
      );

      // Make sure that it started off as not deleted
      expect(message.deleted).toEqual(false);

      const deletedMessage = await messageData.delete(new ObjectID(message.id));
      expect(deletedMessage.deleted).toEqual(true);

      // And that is it now deleted
      const retrievedMessage = await messageData.getMessage(
        message.id.toHexString(),
      );
      expect(retrievedMessage.deleted).toEqual(true);
    });

    it('should throw an error when the message to delete does not exist', async () => {
      const nonExistentId = new ObjectID();

      await expect(async () => {
        await messageData.delete(nonExistentId);
      }).rejects.toThrow('The message to delete does not exist');
    });
  });

  describe('updateTags', () => {
    it('successfully updates tags for a message', async () => {
      const conversationId = new ObjectID();
      const oldTags = [{ id: 'tag1', type: TagType.subTopic }];
      const message = await messageData.create(
        {
          conversationId,
          text: 'Message with a tag',
          tags: oldTags,
        },
        senderId,
      );

      expect(message.tags).toEqual(oldTags);

      // expect(message.tags).toEqual(
      //   expect.arrayContaining([{ id: 'tag1', type: TagType.subTopic }]),
      // );

      const updatedTags = [
        { id: 'tag2', type: TagType.subTopic },
        { id: 'tag3', type: TagType.subTopic },
      ];

      const updatedMessage = await messageData.updateTags(
        new ObjectId(message.id),
        updatedTags,
      );

      // ! I'm pretty sure these two are equal but somehow I'm constantly getting `TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them` - various potential causes and solutions online, none of them applicable to my knowledge.
      // ! Workaround:
      expect(JSON.stringify(updatedMessage.tags)).toEqual(
        JSON.stringify(updatedTags),
      );

      // expect(updatedMessage.tags).toEqual(
      //   expect.arrayContaining(updatedTags),
      // );

      const retrievedMessage = await messageData.getMessage(
        message.id.toHexString(),
      );
      expect(retrievedMessage.tags).toEqual(updatedTags);
    });
  });
});
