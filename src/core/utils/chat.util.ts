import { v4 as uuidV4 } from 'uuid';
import { ChatRecordType, RoomType } from '@core/constants';

export const getRoomId = (type: RoomType, participantIds: string[] = []) => {
  switch (type) {
    case RoomType.ONE_TO_ONE:
      if (participantIds.length !== 2)
        throw Error('Invalid number of participants');

      return `${participantIds[0]}_${participantIds[1]}`;

    case RoomType.GROUP:
      return uuidV4();

    case RoomType.SUPPORT:
      if (!participantIds.length) throw Error('Invalid number of participants');
      return participantIds[0];
  }
};

export const getChatKey = (type: ChatRecordType, objectId?: string) => {
  switch (type) {
    case ChatRecordType.PROFILE:
      return `profile`;

    case ChatRecordType.ROOM:
      return `config`;

    case ChatRecordType.MEMBER:
      return `member_${objectId}`;

    case ChatRecordType.MESSAGE:
      return `message_${new Date().getTime()}_${uuidV4()}`;
  }
};
