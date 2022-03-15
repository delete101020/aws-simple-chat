import { handlerPath } from '@libs/handler-resolver';

const authHandler = {
  name: 'WS_${self:service}auth_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.authHandler`,
};

const connectHandler = {
  name: 'WS_${self:service}_connect_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.connectHandler`,
  events: [
    {
      websocket: {
        route: '$connect',
        authorizer: {
          name: 'authHandler',
          identitySource: ['route.request.querystring.token'],
        },
      },
    },
  ],
};

const disconnectHandler = {
  name: 'WS_${self:service}_disconnect_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.disconnectHandler`,
  events: [
    {
      websocket: {
        route: '$disconnect',
      },
    },
  ],
};

const defaultHandler = {
  name: 'WS_${self:service}_default_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.defaultHandler`,
  events: [
    {
      websocket: {
        route: '$default',
      },
    },
  ],
};

export { authHandler, connectHandler, disconnectHandler, defaultHandler };
