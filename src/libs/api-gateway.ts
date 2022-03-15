import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
  PolicyDocument,
} from 'aws-lambda';
import type { FromSchema } from 'json-schema-to-ts';
import { ConnectionService } from '@services/connection.service';
import { ERROR_MESSAGES } from '@core/constants/errors.constant';

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & {
  body: FromSchema<S>;
};
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;

const formatJSONResponse = (response: Record<string, unknown>) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): { principalId: string; policyDocument: PolicyDocument } => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};

const generateAllow = (principalId: string, methodArn: string) => {
  return generatePolicy(principalId, 'Allow', methodArn);
};

const generateDeny = (principalId: string, methodArn: string) => {
  return generatePolicy(principalId, 'Deny', methodArn);
};

const getConnectionId = (event: APIGatewayProxyEvent) => {
  return event.requestContext.connectionId;
};

const getPrincipalId = async (event: APIGatewayProxyEvent) => {
  let userId: unknown;

  if (process.env.IS_OFFLINE) {
    if (event.queryStringParameters) {
      userId = event?.queryStringParameters?.userId;
    } else {
      const connectionId = getConnectionId(event);
      const connectionService = ConnectionService.getInstance();
      const connection = await connectionService.getConnectionById(
        connectionId
      );
      userId = connection?.userId;
    }
  } else {
    userId = event?.requestContext?.authorizer?.principalId;
  }

  if (!userId) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  return userId as string;
};

export {
  formatJSONResponse,
  generateAllow,
  generateDeny,
  getConnectionId,
  getPrincipalId,
};
