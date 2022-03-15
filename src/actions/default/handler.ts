import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayRequestAuthorizerHandler,
} from 'aws-lambda';
import {
  formatJSONResponse,
  generateAllow,
  getConnectionId,
  getPrincipalId,
} from '@libs/api-gateway';
import AuthService from '@core/services/auth';
import ApiGatewayService from '@core/services/api-gateway.service';
import { CommonAction, ERROR_MESSAGES } from '@core/constants';
import { ConnectionService } from '@services/connection.service';
import { ChatService } from '@services/chat.service';

export const authHandler: APIGatewayRequestAuthorizerHandler = async (
  event: APIGatewayRequestAuthorizerEvent
) => {
  const {
    methodArn,
    queryStringParameters: { token },
  } = event;
  if (!token) throw Error(ERROR_MESSAGES.UNAUTHORIZED);

  const authService = AuthService.getInstance();
  const payload = await authService.verifyToken(token);
  const { isValid, userId } = payload;
  if (!isValid) throw Error(ERROR_MESSAGES.UNAUTHORIZED);

  return generateAllow(userId, methodArn);
};

export const connectHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
) => {
  const {
    requestContext: { connectionId },
    queryStringParameters: { userId },
  } = event;

  const connectionService = ConnectionService.getInstance();
  await connectionService.createConnection(userId, connectionId);

  const chatService = ChatService.getInstance();
  await chatService.createProfile(userId);

  return formatJSONResponse({});
};

export const disconnectHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
) => {
  const {
    requestContext: { connectionId },
  } = event;

  const connectionService = ConnectionService.getInstance();
  await connectionService.deleteConnection(connectionId);

  return formatJSONResponse({ connectionId });
};

export const defaultHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
) => {
  const body = JSON.parse(event.body || '{}');
  const { action, data = {} } = body;

  switch (action) {
    case CommonAction.PING: {
      const connectionId = getConnectionId(event);
      const apiGatewayService = ApiGatewayService.getInstance();

      await apiGatewayService.sendMessageToConnection(connectionId, {
        message: CommonAction.PONG,
      });
      break;
    }

    case CommonAction.ECHO: {
      const userId = await getPrincipalId(event);

      const apiGatewayService = ApiGatewayService.getInstance();
      await apiGatewayService.sendMessageToUser(userId, {
        message: data.message,
      });
      break;
    }

    default:
      throw Error('Invalid action');
  }

  return formatJSONResponse({});
};
