import { AwsLambdaEnvironment } from '@serverless/typescript';

export default {
  AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
  NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',

  DYNAMODB_CONNECTION_TABLE:
    '${self:service}-connections-${self:provider.stage}',
  DYNAMODB_CONNECTION_TABLE_PARTITION_KEY: 'connectionId',

  DYNAMODB_CONNECTION_TABLE_USER_GSI:
    '${self:service}-connections-user-gsi-${self:provider.stage}',
  DYNAMODB_CONNECTION_TABLE_USER_GSI_PARTITION_KEY: 'userId',

  DYNAMODB_CHAT_TABLE: '${self:service}-conversations-${self:provider.stage}',
  DYNAMODB_CHAT_TABLE_PARTITION_KEY: 'chatId',
  DYNAMODB_CHAT_TABLE_SORT_KEY: 'chatKey',

  DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI:
    '${self:service}-conversations-key-updated-gsi-${self:provider.stage}',
  DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI_PARTITION_KEY: 'chatKey',
  DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI_SORT_KEY: 'updatedAt',

  WEBSOCKET_API_ENDPOINT: {
    'Fn::Join': [
      '',
      [
        'https://',
        'Ref: WebsocketsApi',
        '.execute-api.',
        'Ref: AWS::Region',
        '.amazonaws.com/',
        '${self:provider.stage}',
      ],
    ],
  },
  LOCAL_WEBSOCKET_API_ENDPOINT: 'http://localhost:3001',
  LOCAL_DYNAMO_ENPOINT: 'http://localhost:${self:custom.dynamodb.start.port}',
} as AwsLambdaEnvironment;
