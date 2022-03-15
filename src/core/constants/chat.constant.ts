export enum ChatRecordType {
  PROFILE = 'profile',
  ROOM = 'room',
  MEMBER = 'member',
  MESSAGE = 'message',
}

export enum RoomType {
  ONE_TO_ONE = 'one-to-one',
  GROUP = 'group',
  SUPPORT = 'support',
}

export enum ChatMessageFormat {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  UNSENT = 'unsent', // for unsent/removed messages
  LOG = 'log', // for log messages: change room, add member, remove member, etc.
}

export enum ChatAction {
  CREATE_ONE_TO_ONE_ROOM = 'create-one-to-one-room',
  CREATE_SUPPORT_ROOM = 'create-support-room',
  CREATE_GROUP_ROOM = 'create-group-room',

  /** GROUP ONLY */
  ADD_MEMBER = 'add-member',
  REMOVE_MEMBER = 'remove-member',
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  /** GROUP ONLY */

  GET_ROOMS = 'get-rooms',
  GET_ROOM_DETAILS = 'get-room-details',
  UPDATE_ROOM_DETAILS = 'update-room-details',
  GET_ROOM_MEMBERS = 'get-room-members',

  GET_MESSAGES = 'get-messages',
  SEND_MESSAGE = 'send-message',
  REPLY_MESSAGE = 'reply-message',
  UPDATE_MESSAGE = 'update-message',
  DELETE_MESSAGE = 'delete-message',
}
