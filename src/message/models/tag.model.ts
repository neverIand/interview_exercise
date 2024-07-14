import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TagType } from '../../conversation/models/CreateChatConversation.dto';

@Schema()
export class Tag {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: TagType; // TODO for now it uses the same enum with conversation
}

export type TagDocument = Tag & Document;
export const TagSchema = SchemaFactory.createForClass(Tag);
