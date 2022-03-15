import {
  AttributeValue,
  BatchGetItemOutput,
  GetItemOutput,
  UpdateItemOutput,
} from 'aws-sdk/clients/dynamodb';
import { QueryType } from '@core/connectors/dynamodb.connector';
import {
  ChatMessageFormat,
  ChatRecordType,
  CHAT_ERROR_MESSAGES,
  DYNAMODB_CHAT_TABLE,
  DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI,
  DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI_PARTITION_KEY,
  DYNAMODB_CHAT_TABLE_PARTITION_KEY,
  DYNAMODB_CHAT_TABLE_SORT_KEY,
  RoomType,
} from '@core/constants';
import {
  ComparisonOperator,
  DynamoDBQueryBuilder,
  UpdateFunction,
} from '@libs/query-builder';
import { getChatKey, getRoomId } from '@core/utils/chat.util';
import {
  IChatMember,
  IChatMessage,
  IChatProfile,
  IChatRoom,
} from '@models/chat.model';
import { removeDuplicates } from '@core/utils/other.util';

type CheckUserInRoomResult = {
  isRoomMember: boolean;
  isRoomOwner?: boolean;
  member: IChatMember;
};

const SELECTED_ROOM_IDS = {
  [RoomType.GROUP]: 'groupRoomIds',
  [RoomType.ONE_TO_ONE]: 'privateRoomIds',
  [RoomType.SUPPORT]: 'supportRoomIds',
};

export class ChatService {
  private static _instance: ChatService;

  public static getInstance() {
    if (!ChatService._instance) {
      ChatService._instance = new ChatService();
    }

    return ChatService._instance;
  }

  /** =================== PROFILE ================== */

  async createProfile(
    userId: string,
    profileData: { [key: string]: unknown } = {}
  ) {
    try {
      // Check if profile exists
      const profile = await this._checkProfileExists(userId);
      if (profile) return profile;

      // If not exists, create new profile
      const now = new Date().getTime();
      const item: IChatProfile = {
        chatId: userId,
        chatKey: getChatKey(ChatRecordType.PROFILE),
        type: ChatRecordType.PROFILE,
        ...profileData,
        createdAt: now,
        updatedAt: now,

        groupRoomIds: [],
        privateRoomIds: [],
        supportRoomIds: [],
      };
      const query = new DynamoDBQueryBuilder(QueryType.PUT_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key(item);
      await query.execute();

      return item;
    } catch (error) {
      throw error;
    }
  }

  async addRoomToProfile(userId: string, roomId: string, roomType: RoomType) {
    try {
      let profile = await this._checkProfileExists(userId);
      // If not exists, create new profile
      if (!profile) profile = await this.createProfile(userId);

      const { chatId, chatKey } = profile;
      const query = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId, chatKey })
        .functionUpdateFields([
          {
            attributeName: SELECTED_ROOM_IDS[roomType],
            updateFunction: UpdateFunction.LIST_APPEND,
            attributeValue: [roomId] as AttributeValue,
          },
        ]);
      await query.execute();
    } catch (error) {
      throw error;
    }
  }

  // Only for group rooms
  async removeRoomFromProfile(userId: string, roomId: string) {
    try {
      const profile = await this._checkProfileExists(userId);
      if (!profile) throw new Error(CHAT_ERROR_MESSAGES.PROFILE_NOT_FOUND);

      const { groupRoomIds = [] } = profile;
      const updatedRoomIds = groupRoomIds.filter(
        (groupRoomId) => groupRoomId !== roomId
      );
      const query = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: userId, chatKey: getChatKey(ChatRecordType.PROFILE) })
        .updateFields({
          groupRoomIds: updatedRoomIds,
        });
      await query.execute();
    } catch (error) {
      throw error;
    }
  }

  /** ==================== ROOM ==================== */

  async createOneToOneRoom(participantIds: string[]) {
    try {
      // Check room exists, return if exists
      const existRoom = await this._checkPrivateRoomExists(participantIds);
      if (existRoom) return existRoom;

      // If not exists, create new room
      const roomId = getRoomId(RoomType.ONE_TO_ONE, participantIds);
      const now = new Date().getTime();

      // Create room record
      const room: IChatRoom = {
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.ROOM),
        type: ChatRecordType.ROOM,
        memberIds: participantIds,
        allMemberIds: participantIds,
        userId: participantIds[0], // creator
        roomType: RoomType.ONE_TO_ONE,
        createdAt: now,
        updatedAt: now,
      };

      // Create member records
      const members: IChatMember[] = participantIds.map((userId) => ({
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.MEMBER, userId),
        type: ChatRecordType.MEMBER,
        userId,
        isOwner: true,
        createdAt: now,
        updatedAt: now,
      }));

      const query = new DynamoDBQueryBuilder(QueryType.BATCH_WRITE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .keys([room, ...members]);
      await query.execute();

      // Add room to profile
      await Promise.all([
        this.addRoomToProfile(participantIds[0], roomId, RoomType.ONE_TO_ONE),
        this.addRoomToProfile(participantIds[1], roomId, RoomType.ONE_TO_ONE),
      ]);

      return room;
    } catch (error) {
      throw error;
    }
  }

  async createSupportRoom(userId: string) {
    try {
      // Check room exists
      const existRoom = await this._checkSupportRoomExists(userId);

      // If exists, return existing room
      if (existRoom) return existRoom;

      // If not exists, create new room
      const roomId = getRoomId(RoomType.SUPPORT, [userId]);
      const now = new Date().getTime();

      // Create room record
      const room: IChatRoom = {
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.ROOM),
        type: ChatRecordType.ROOM,
        memberIds: [userId],
        allMemberIds: [userId],
        userId,
        roomType: RoomType.SUPPORT,
        createdAt: now,
        updatedAt: now,
      };

      // Create member records
      const member: IChatMember = {
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.MEMBER, userId),
        type: ChatRecordType.MEMBER,
        userId,
        isOwner: true,
        createdAt: now,
        updatedAt: now,
      };

      const query = new DynamoDBQueryBuilder(QueryType.BATCH_WRITE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .keys([room, member]);
      await query.execute();

      // Add room to profile
      await this.addRoomToProfile(userId, roomId, RoomType.SUPPORT);

      return room;
    } catch (error) {
      throw error;
    }
  }

  async createGroupRoom(participantIds = []) {
    try {
      const creatorId = participantIds[0];

      const roomId = getRoomId(RoomType.GROUP);
      const now = new Date().getTime();

      // Create room record
      const room: IChatRoom = {
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.ROOM),
        type: ChatRecordType.ROOM,
        memberIds: participantIds,
        allMemberIds: participantIds,
        userId: creatorId,
        roomType: RoomType.GROUP,
        createdAt: now,
        updatedAt: now,
      };

      // Create member records
      const members: IChatMember[] = participantIds.map((userId) => ({
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.MEMBER, userId),
        type: ChatRecordType.MEMBER,
        userId,
        isOwner: userId === creatorId,
        createdAt: now,
        updatedAt: now,
      }));

      const query = new DynamoDBQueryBuilder(QueryType.BATCH_WRITE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .keys([room, ...members]);
      await query.execute();

      // Add room to profile
      await Promise.all(
        participantIds.map((userId) =>
          this.addRoomToProfile(userId, roomId, RoomType.GROUP)
        )
      );

      return room;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param input
   * @param input.roomId
   * @param input.userId - User id of the user who is adding others
   * @param input.participantIds - User ids of the users to be added
   */
  async addMember({
    roomId,
    actorId,
    participantIds,
  }: {
    roomId: string;
    actorId: string;
    participantIds: string[];
  }) {
    try {
      // Get room details
      const room = await this.getRoomDetails(roomId);
      if (!room) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_FOUND);
      if (room.roomType !== RoomType.GROUP)
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_GROUP);

      const { memberIds: roomMemberIds, allMemberIds } = room;
      // Check if user is room member
      if (!roomMemberIds.includes(actorId))
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      // Exclude existing members
      const newParticipantIds = participantIds.filter(
        (participantId) => !roomMemberIds.includes(participantId)
      );

      // Create member records
      const now = new Date().getTime();
      const newMembers: IChatMember[] = newParticipantIds.map(
        (newParticipantId) => ({
          chatId: roomId,
          chatKey: getChatKey(ChatRecordType.MEMBER, newParticipantId),
          type: ChatRecordType.MEMBER,
          userId: newParticipantId,
          isOwner: false,
          createdAt: now,
          updatedAt: now,
        })
      );

      const addMembersQuery = new DynamoDBQueryBuilder(
        QueryType.BATCH_WRITE_ITEM
      )
        .tableName(DYNAMODB_CHAT_TABLE)
        .keys(newMembers);
      await addMembersQuery.execute();

      // Add room to profile
      await Promise.all(
        newParticipantIds.map((userId) =>
          this.addRoomToProfile(userId, roomId, room.roomType)
        )
      );

      // Update room member ids
      const updateRoomQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: roomId, chatKey: getChatKey(ChatRecordType.ROOM) })
        .updateFields({
          memberIds: [...roomMemberIds, ...newParticipantIds],
          allMemberIds: removeDuplicates([
            ...allMemberIds,
            ...newParticipantIds,
          ]),
        });
      const updateRoomResult =
        (await updateRoomQuery.execute()) as UpdateItemOutput;

      return updateRoomResult.Attributes as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  async removeMember({
    roomId,
    actorId,
    removeUserId,
  }: {
    roomId: string;
    actorId: string;
    removeUserId: string;
  }) {
    try {
      // Get room details
      const room = await this.getRoomDetails(roomId);
      if (!room) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_FOUND);
      if (room.roomType !== RoomType.GROUP)
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_GROUP);

      const { memberIds: roomMemberIds } = room;
      // Check if actor is room member
      if (!roomMemberIds.includes(actorId))
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      // Remove member
      const removeMemberQuery = new DynamoDBQueryBuilder(QueryType.DELETE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          chatId: roomId,
          chatKey: getChatKey(ChatRecordType.MEMBER, removeUserId),
        });
      await removeMemberQuery.execute();

      // Remove room from profile
      await this.removeRoomFromProfile(removeUserId, roomId);

      // Update room member ids
      const updateRoomQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: roomId, chatKey: getChatKey(ChatRecordType.ROOM) })
        .updateFields({
          memberIds: roomMemberIds.filter(
            (memberId) => memberId !== removeUserId
          ),
        });
      const updatedRoomResult =
        (await updateRoomQuery.execute()) as UpdateItemOutput;

      return updatedRoomResult.Attributes as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  async joinRoom() {}

  async leaveRoom(roomId: string, userId: string) {
    try {
      // Get room details
      const room = await this.getRoomDetails(roomId);
      if (!room) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_FOUND);
      if (room.roomType !== RoomType.GROUP)
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_GROUP);

      const { memberIds: roomMemberIds } = room;
      // Check if user is room member
      if (!roomMemberIds.includes(userId))
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      // Remove user from room
      const removeMemberQuery = new DynamoDBQueryBuilder(QueryType.DELETE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          chatId: roomId,
          chatKey: getChatKey(ChatRecordType.MEMBER, userId),
        });
      await removeMemberQuery.execute();

      // Remove room from profile
      await this.removeRoomFromProfile(userId, roomId);

      // Update room member ids
      const updateRoomQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: roomId, chatKey: getChatKey(ChatRecordType.ROOM) })
        .updateFields({
          memberIds: roomMemberIds.filter((memberId) => memberId !== userId),
        });
      const updatedRoomResult =
        (await updateRoomQuery.execute()) as UpdateItemOutput;

      return updatedRoomResult.Attributes as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  async getRooms(
    userId: string,
    options: {
      sorted?: boolean;
      limit?: number;
      exclusiveStartKey?: {
        [x: string]: unknown;
      };
    } = { sorted: true, limit: 10, exclusiveStartKey: null }
  ) {
    try {
      // Get profile to get rooms
      const profile = await this._checkProfileExists(userId);
      if (!profile) throw new Error(CHAT_ERROR_MESSAGES.PROFILE_NOT_FOUND);

      // Get rooms
      const { groupRoomIds = [], privateRoomIds = [] } = profile;

      const query = new DynamoDBQueryBuilder(QueryType.QUERY)
        .tableName(DYNAMODB_CHAT_TABLE)
        .index(DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI)
        .key({
          [DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI_PARTITION_KEY]: getChatKey(
            ChatRecordType.ROOM
          ),
        })
        .conditionFilterFields({
          keyName: DYNAMODB_CHAT_TABLE_PARTITION_KEY,
          comparisonOperator: ComparisonOperator.IN,
          attributeValueList: [
            ...groupRoomIds,
            ...privateRoomIds,
          ] as AttributeValue[], // Only private and group rooms
        })
        .scanIndexForward(options.sorted)
        .limit(options.limit)
        .exclusiveStartKey(options.exclusiveStartKey);
      const result = await query.execute();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getRoomDetails(roomId: string) {
    try {
      const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          chatId: roomId,
          chatKey: getChatKey(ChatRecordType.ROOM),
        });
      const result = (await query.execute()) as GetItemOutput;

      return result?.Item as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param input object
   * @param input.roomId
   * @param input.updateData Only allow to update room name
   * @param input.userId Room member
   */
  async updateRoomDetails({
    roomId,
    updateData,
    userId,
  }: {
    roomId: string;
    updateData: {
      name?: string;
      latestMessage?: IChatMessage;
      updatedAt?: number;
    };
    userId: string;
  }) {
    try {
      const { isRoomMember } = await this._checkRoomMember(roomId, userId);
      if (!isRoomMember) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      const updateRoomQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          chatId: roomId,
          chatKey: getChatKey(ChatRecordType.ROOM),
        })
        .updateFields(updateData);

      const updateRoomResult =
        (await updateRoomQuery.execute()) as UpdateItemOutput;

      return updateRoomResult.Attributes as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMembers(roomId: string) {
    try {
      // Extract room members from room details
      // If needed, query all records with prefix member_ of roomId
      const room = await this.getRoomDetails(roomId);
      if (!room) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_FOUND);

      const { memberIds = [] } = room;
      return memberIds;
    } catch (error) {
      throw error;
    }
  }

  /** ==================== MESSAGE ==================== */

  async getMessages(
    roomId: string,
    options: {
      sorted?: boolean;
      limit?: number;
      exclusiveStartKey?: {
        [x: string]: unknown;
      };
    },
    userId: string
  ) {
    try {
      // Check if user in room
      const check = await this._checkRoomMember(roomId, userId);
      if (!check) throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      // Get messages
      const query = new DynamoDBQueryBuilder(QueryType.QUERY)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          [DYNAMODB_CHAT_TABLE_PARTITION_KEY]: roomId,
        })
        .sortKeyCondition({
          keyName: DYNAMODB_CHAT_TABLE_SORT_KEY,
          comparisonOperator: ComparisonOperator.BEGINS_WITH,
          attributeValueList: [ChatRecordType.MESSAGE as AttributeValue],
        })
        .scanIndexForward(options.sorted)
        .limit(options.limit)
        .exclusiveStartKey(options.exclusiveStartKey);
      const result = await query.execute();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    messageData: {
      message: string;
      format: ChatMessageFormat;
      metadata: { [x: string]: unknown };
    }
  ) {
    try {
      // Check user in room
      const check = await this._checkRoomMember(roomId, senderId);
      if (!check.isRoomMember)
        throw new Error(CHAT_ERROR_MESSAGES.ROOM_NOT_MEMBER);

      // Create message record
      const now = new Date().getTime();

      const message: IChatMessage = {
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.MESSAGE),
        type: ChatRecordType.MESSAGE,
        userId: senderId,
        ...messageData,
        createdAt: now,
        updatedAt: now,
      };

      const query = new DynamoDBQueryBuilder(QueryType.PUT_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key(message);
      await query.execute();

      return message;
    } catch (error) {
      throw error;
    }
  }

  async replyMessage() {}

  async updateMessage({
    roomId,
    messageId,
    userId,
    messageData,
  }: {
    roomId: string;
    messageId: string;
    userId: string;
    messageData: {
      message: string;
      format: ChatMessageFormat;
      metadata: Record<string, unknown>;
    };
  }) {
    try {
      // Check if user is message owner
      const { isMessageOwner } = await this._checkUserIsMessageOwner(
        roomId,
        messageId,
        userId
      );
      if (!isMessageOwner)
        throw new Error(CHAT_ERROR_MESSAGES.MESSAGE_NOT_OWNER);

      // Update message record
      const updateMessageQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: roomId, chatKey: messageId })
        .updateFields({
          ...messageData,
          isEdited: true,
          updatedAt: new Date().getTime(),
        });
      const updateMessageResult =
        (await updateMessageQuery.execute()) as UpdateItemOutput;

      return updateMessageResult.Attributes as IChatMessage;
    } catch (error) {
      throw error;
    }
  }

  async deleteMessage({
    roomId,
    messageId,
    userId,
  }: {
    roomId: string;
    messageId: string;
    userId: string;
  }) {
    try {
      // Check if user is message owner
      const { isMessageOwner } = await this._checkUserIsMessageOwner(
        roomId,
        messageId,
        userId
      );
      if (!isMessageOwner)
        throw new Error(CHAT_ERROR_MESSAGES.MESSAGE_NOT_OWNER);

      // Update message record
      const removeMessageQuery = new DynamoDBQueryBuilder(QueryType.UPDATE_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({ chatId: roomId, chatKey: messageId })
        .updateFields({
          message: '',
          format: ChatMessageFormat.UNSENT,
          metadata: {},
          isDeleted: true,
          updatedAt: new Date().getTime(),
        });
      const removeMessageResult =
        (await removeMessageQuery.execute()) as UpdateItemOutput;

      return removeMessageResult.Attributes as IChatMessage;
    } catch (error) {
      throw error;
    }
  }

  /** =================================================================== */

  /**
   * Check if user has profile
   *
   * @param userId - User id
   * @returns User profile if exists, otherwise null
   */
  private async _checkProfileExists(userId: string) {
    try {
      const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM)
        .tableName(DYNAMODB_CHAT_TABLE)
        .key({
          chatId: userId,
          chatKey: getChatKey(ChatRecordType.PROFILE),
        });
      const result = (await query.execute()) as GetItemOutput;

      return result?.Item as IChatProfile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if two users are in the same room
   *
   * @param userIds - User ids
   * @returns Private room if exists, otherwise null
   */
  private async _checkPrivateRoomExists(userIds: string[]) {
    try {
      if (userIds.length !== 2) {
        throw new Error(
          CHAT_ERROR_MESSAGES.PRIVATE_ROOM_INVALID_NUMBER_OF_MEMBERS
        );
      }

      const TABLE_NAME = DYNAMODB_CHAT_TABLE;
      const query = new DynamoDBQueryBuilder(QueryType.BATCH_GET_ITEM);
      query
        .tableName(TABLE_NAME)
        .key({
          chatId: `${userIds[0]}_${userIds[1]}`,
          chatKey: getChatKey(ChatRecordType.ROOM),
        })
        .key({
          chatId: `${userIds[1]}_${userIds[0]}`,
          chatKey: getChatKey(ChatRecordType.ROOM),
        });
      const result = (await query.execute()) as BatchGetItemOutput;
      const { [TABLE_NAME]: items } = result.Responses;

      if (!items.length) return null;
      if (items.length > 1)
        throw new Error(CHAT_ERROR_MESSAGES.PRIVATE_ROOM_INVALID_ROOM_COUNT);

      return items[0] as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has support room
   *
   * @param userId - User id
   * @returns Support room if exists, otherwise null
   */
  private async _checkSupportRoomExists(userId: string) {
    try {
      const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM);
      query.tableName(DYNAMODB_CHAT_TABLE).key({
        chatId: getRoomId(RoomType.SUPPORT, [userId]),
        chatKey: getChatKey(ChatRecordType.ROOM),
      });
      const result = (await query.execute()) as GetItemOutput;

      return result?.Item as IChatRoom;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is in room
   *
   * @param {string} roomId
   * @param {string} userId
   * @returns {CheckUserInRoomResult} The result of the check
   */

  private async _checkRoomMember(
    roomId: string,
    userId: string
  ): Promise<CheckUserInRoomResult> {
    try {
      const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM);
      query.tableName(DYNAMODB_CHAT_TABLE).key({
        chatId: roomId,
        chatKey: getChatKey(ChatRecordType.MEMBER, userId),
      });
      const result = (await query.execute()) as GetItemOutput;

      const member = result?.Item as IChatMember;
      return {
        isRoomMember: !!member,
        isRoomOwner: member?.isOwner as boolean,
        member: member,
      };
    } catch (error) {
      throw error;
    }
  }

  private async _checkUserIsMessageOwner(
    roomId: string,
    messageId: string,
    userId: string
  ) {
    try {
      const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM);
      query.tableName(DYNAMODB_CHAT_TABLE).key({
        chatId: roomId,
        chatKey: messageId,
      });
      const result = (await query.execute()) as GetItemOutput;

      const message = result?.Item as IChatMessage;
      if (!message) throw new Error(CHAT_ERROR_MESSAGES.MESSAGE_NOT_FOUND);

      return { isMessageOwner: message?.userId === userId, message };
    } catch (error) {
      throw error;
    }
  }
}
