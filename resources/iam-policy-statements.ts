import { AwsIamPolicyStatements } from '@serverless/typescript';

export default [
  {
    Effect: 'Allow',
    Action: ['execute-api:ManageConnections'],
    Resource: [
      'arn:aws:execute-api:${opt:region, self:provider.region}:*:**/@connections/*',
    ],
  },
  {
    Effect: 'Allow',
    Action: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:Scan',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:BatchGetItem',
      'dynamodb:BatchWriteItem',
    ],
    Resource: [
      'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_CONNECTION_TABLE}',
      'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_CONNECTION_TABLE}/index/*',
      'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_CHAT_TABLE}',
      'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_CHAT_TABLE}/index/*',
    ],
  },
] as AwsIamPolicyStatements;
