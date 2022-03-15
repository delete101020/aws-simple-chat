import { ChatMessageFormat, ChatRecordType, RoomType } from '@core/constants';
import { ObjectType } from '@libs/query-builder';

export interface IBaseChat extends ObjectType {
  chatId?: string;
  chatKey?: string;
  type: ChatRecordType;
  createdAt?: number;
  updatedAt?: number;
}

export interface IChatProfile extends IBaseChat {
  type: ChatRecordType.PROFILE;
  userId?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: string;
  lastSeenAt?: number;
  groupRoomIds?: string[]; // For fast-access list of joined rooms
  privateRoomIds?: string[]; // For fast-access list of joined rooms
  supportRoomIds?: string[]; // For fast-access list of joined rooms
}

export interface IChatRoom extends IBaseChat {
  type: ChatRecordType.ROOM;
  name?: string;
  memberIds?: string[];
  allMemberIds?: string[]; // use in case of leaving room
  userId?: string; // creator
  roomType?: RoomType;
  latestMessage?: IChatMessage;
}

export interface IChatMember extends IBaseChat {
  type: ChatRecordType.MEMBER;
  userId?: string;
  isOwner?: boolean; // fast checking if user is owner
}

export interface IChatMessage extends IBaseChat {
  type: ChatRecordType.MESSAGE;
  message?: string;
  format?: ChatMessageFormat;
  userId?: string; // sender
  metadata?: any;
}

export type ChatRecord = IChatProfile | IChatRoom | IChatMember | IChatMessage;

/**
 * using Discriminated Unions to reduce code duplication
 * in every interface, add a type property to the interface
 * and create a union type for the interface to be used
 */
export default class Chat {
  private readonly _chat: ChatRecord;

  constructor(data: ChatRecord) {
    this._chat = {
      createdAt: Date.now(),
      ...data,
    };
  }

  public getEntityMappings(): ChatRecord {
    return this._chat;
  }
}
