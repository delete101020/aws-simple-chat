import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import type { FromSchema } from 'json-schema-to-ts';
import { ChatAction, ChatMessageFormat } from '@core/constants';
import {
  formatJSONResponse,
  getConnectionId,
  getPrincipalId,
} from '@libs/api-gateway';
import ApiGatewayService from '@core/services/api-gateway.service';
import { ChatService } from '@services/chat.service';
import {
  ADD_MEMBER_SCHEMA,
  CREATE_GROUP_ROOM_SCHEMA,
  CREATE_ONE_TO_ONE_ROOM_SCHEMA,
  DELETE_MESSAGE_SCHEMA,
  GET_MESSAGES_SCHEMA,
  GET_ROOMS_SCHEMA,
  GET_ROOM_DETAILS_SCHEMA,
  LEAVE_ROOM_SCHEMA,
  REMOVE_MEMBER_SCHEMA,
  SEND_MESSAGE_SCHEMA,
  UPDATE_MESSAGE_SCHEMA,
  UPDATE_ROOM_DETAILS_SCHEMA,
} from './schemas';

type CreateOneToOneRoom = FromSchema<typeof CREATE_ONE_TO_ONE_ROOM_SCHEMA>;
type CreateGroupRoom = FromSchema<typeof CREATE_GROUP_ROOM_SCHEMA>;
type GetRooms = FromSchema<typeof GET_ROOMS_SCHEMA>;
type GetRoomDetails = FromSchema<typeof GET_ROOM_DETAILS_SCHEMA>;
type UpdateRoomDetails = FromSchema<typeof UPDATE_ROOM_DETAILS_SCHEMA>;
type AddMember = FromSchema<typeof ADD_MEMBER_SCHEMA>;
type RemoveMember = FromSchema<typeof REMOVE_MEMBER_SCHEMA>;
type LeaveRoom = FromSchema<typeof LEAVE_ROOM_SCHEMA>;
type GetMessages = FromSchema<typeof GET_MESSAGES_SCHEMA>;
type SendMessage = FromSchema<typeof SEND_MESSAGE_SCHEMA>;
type UpdateMessage = FromSchema<typeof UPDATE_MESSAGE_SCHEMA>;
type DeleteMessage = FromSchema<typeof DELETE_MESSAGE_SCHEMA>;

// type Combined = CreateOneToOneRoom &
//   GetRoomDetails &
//   UpdateRoomDetails &
//   GetMessages &
//   SendMessage &
//   UpdateMessage &
//   DeleteMessage & { [key: string]: unknown };

// type KeysMatching<T, U> = {
//   [K in keyof T]: K extends keyof U ? K : never;
// }[keyof T];

// type SelectedDataType<T> = Pick<Combined, KeysMatching<Combined, T>>;

export const chatHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
) => {
  const body = JSON.parse(event.body || '{}');
  const action = body.action;
  const data = body.data;

  switch (action) {
    case ChatAction.CREATE_ONE_TO_ONE_ROOM: {
      const userId = await getPrincipalId(event);
      const { partnerId } = <CreateOneToOneRoom>data;
      const participantIds = [userId, partnerId];

      const chatService = ChatService.getInstance();
      const room = await chatService.createOneToOneRoom(participantIds);

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(participantIds, {
        action,
        data: room,
      });

      break;
    }

    case ChatAction.CREATE_SUPPORT_ROOM: {
      const userId = await getPrincipalId(event);

      const chatService = ChatService.getInstance();
      const room = await chatService.createSupportRoom(userId);

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUser(userId, {
        action,
        data: room,
      });

      break;
    }

    case ChatAction.CREATE_GROUP_ROOM: {
      const userId = await getPrincipalId(event);
      const { participantIds = [] } = <CreateGroupRoom>data;

      const chatService = ChatService.getInstance();
      const room = await chatService.createGroupRoom([
        userId,
        ...participantIds,
      ]);

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUser(userId, {
        action,
        data: room,
      });

      break;
    }

    // Group only
    case ChatAction.ADD_MEMBER: {
      const userId = await getPrincipalId(event);
      const { roomId, participantIds = [] } = <AddMember>data;

      const chatService = ChatService.getInstance();
      const updatedRoom = await chatService.addMember({
        roomId,
        actorId: userId,
        participantIds,
      });

      // Broadcast to room members
      const { memberIds: roomMemberIds } = updatedRoom;

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action: ChatAction.UPDATE_ROOM_DETAILS,
        data: updatedRoom,
      });

      break;
    }

    // Group only
    case ChatAction.REMOVE_MEMBER: {
      const userId = await getPrincipalId(event);
      const { roomId, removeUserId } = <RemoveMember>data;

      const chatService = ChatService.getInstance();
      const updatedRoom = await chatService.removeMember({
        roomId,
        actorId: userId,
        removeUserId,
      });

      // Broadcast to room members
      const { memberIds: roomMemberIds } = updatedRoom;
      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action: ChatAction.UPDATE_ROOM_DETAILS,
        data: updatedRoom,
      });

      break;
    }

    // Group only
    case ChatAction.JOIN_ROOM: {
      break;
    }

    // Group only
    case ChatAction.LEAVE_ROOM: {
      const userId = await getPrincipalId(event);
      const { roomId } = <LeaveRoom>data;

      const chatService = ChatService.getInstance();
      const updatedRoom = await chatService.leaveRoom(roomId, userId);

      // Broadcast to room members
      const { memberIds: roomMemberIds } = updatedRoom;
      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action: ChatAction.UPDATE_ROOM_DETAILS,
        data: updatedRoom,
      });

      break;
    }

    case ChatAction.GET_ROOMS: {
      const userId = await getPrincipalId(event);
      const { options } = <GetRooms>data;

      const chatService = ChatService.getInstance();
      const result = await chatService.getRooms(userId, options);

      const connectionId = getConnectionId(event);
      const apiGatewayService = ApiGatewayService.getInstance();

      await apiGatewayService.sendMessageToConnection(connectionId, {
        action,
        data: result,
      });

      break;
    }

    case ChatAction.GET_ROOM_DETAILS: {
      const { roomId } = <GetRoomDetails>data;

      const chatService = ChatService.getInstance();
      const room = await chatService.getRoomDetails(roomId);

      const connectionId = getConnectionId(event);
      const apiGatewayService = ApiGatewayService.getInstance();

      await apiGatewayService.sendMessageToConnection(connectionId, {
        action,
        data: room,
      });

      break;
    }

    case ChatAction.UPDATE_ROOM_DETAILS: {
      const userId = await getPrincipalId(event);
      const { roomId, ...updateData } = <UpdateRoomDetails>data;

      const chatService = ChatService.getInstance();
      const updatedRoom = await chatService.updateRoomDetails({
        roomId,
        updateData,
        userId,
      });

      // Broadcast to room members
      const { memberIds: roomMemberIds } = updatedRoom;

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action,
        data: updatedRoom,
      });

      break;
    }

    case ChatAction.GET_ROOM_MEMBERS: {
      break;
    }

    case ChatAction.GET_MESSAGES: {
      const userId = await getPrincipalId(event);
      const { roomId, options } = <GetMessages>data;

      const chatService = ChatService.getInstance();
      const messages = await chatService.getMessages(roomId, options, userId);

      const connectionId = getConnectionId(event);
      const apiGatewayService = ApiGatewayService.getInstance();

      await apiGatewayService.sendMessageToConnection(connectionId, {
        action,
        data: messages,
      });

      break;
    }

    case ChatAction.SEND_MESSAGE: {
      const userId = await getPrincipalId(event);
      const {
        roomId,
        messageData: { message, format, metadata },
      } = <SendMessage>data;

      const chatService = ChatService.getInstance();
      const newMessage = await chatService.sendMessage(roomId, userId, {
        message,
        format: format as ChatMessageFormat,
        metadata,
      });

      const updatedRoom = await chatService.updateRoomDetails({
        roomId,
        updateData: {
          latestMessage: newMessage,
          updatedAt: newMessage.createdAt,
        },
        userId,
      });

      // Broadcast to room's members
      const { memberIds: roomMemberIds } = updatedRoom;

      const apiGatewayService = ApiGatewayService.getInstance();
      await Promise.all([
        apiGatewayService.sendMessageToUsers(roomMemberIds, {
          action,
          data: newMessage,
        }),
        apiGatewayService.sendMessageToUsers(roomMemberIds, {
          action: ChatAction.UPDATE_ROOM_DETAILS,
          data: updatedRoom,
        }),
      ]);

      break;
    }

    case ChatAction.REPLY_MESSAGE: {
      break;
    }

    case ChatAction.UPDATE_MESSAGE: {
      const userId = await getPrincipalId(event);
      const {
        roomId,
        messageId,
        messageData: { message, format, metadata },
      } = <UpdateMessage>data;

      const chatService = ChatService.getInstance();
      const updatedMessage = await chatService.updateMessage({
        roomId,
        messageId,
        userId,
        messageData: {
          message,
          format: format as ChatMessageFormat,
          metadata,
        },
      });

      // Broadcast to room's members
      const room = await chatService.getRoomDetails(roomId);
      const { memberIds: roomMemberIds } = room;

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action,
        data: updatedMessage,
      });

      // Check if updated message is last message of room
      const isLatestMessage =
        room.latestMessage.chatKey === updatedMessage.chatKey;
      if (isLatestMessage) {
        const updatedRoom = await chatService.updateRoomDetails({
          roomId,
          updateData: {
            latestMessage: updatedMessage,
            updatedAt: updatedMessage.createdAt,
          },
          userId,
        });

        // Broadcast to room's members
        await apiGatewayService.sendMessageToUsers(roomMemberIds, {
          action: ChatAction.UPDATE_ROOM_DETAILS,
          data: updatedRoom,
        });
      }

      break;
    }

    case ChatAction.DELETE_MESSAGE: {
      const userId = await getPrincipalId(event);
      const { roomId, messageId } = <DeleteMessage>data;

      const chatService = ChatService.getInstance();
      const deletedMessage = await chatService.deleteMessage({
        roomId,
        messageId,
        userId,
      });

      // Broadcast to room's members
      const room = await chatService.getRoomDetails(roomId);
      const { memberIds: roomMemberIds } = room;

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUsers(roomMemberIds, {
        action,
        data: deletedMessage,
      });

      // Check if updated message is last message of room
      const isLatestMessage =
        room.latestMessage.chatKey === deletedMessage.chatKey;
      if (isLatestMessage) {
        const updatedRoom = await chatService.updateRoomDetails({
          roomId,
          updateData: {
            latestMessage: deletedMessage,
            updatedAt: deletedMessage.createdAt,
          },
          userId,
        });

        // Broadcast to room's members
        await apiGatewayService.sendMessageToUsers(roomMemberIds, {
          action: ChatAction.UPDATE_ROOM_DETAILS,
          data: updatedRoom,
        });
      }

      break;
    }

    default:
      throw Error('Invalid action');
  }

  return formatJSONResponse({});
};
