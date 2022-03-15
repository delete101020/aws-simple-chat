import { handlerPath } from '@libs/handler-resolver';

export default {
  name: 'WS_${self:service}_chat_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.chatHandler`,
  events: [
    {
      websocket: {
        route: 'chat',
      },
    },
  ],
};
