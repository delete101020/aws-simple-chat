# Serverless - AWS Simple Chat - TypeScript

This project has been generated using the `aws-nodejs-typescript` template from the [Serverless framework](https://www.serverless.com/).

For detailed instructions, please refer to the [documentation](https://www.serverless.com/framework/docs/providers/aws/).

## Installation/deployment instructions

Depending on your preferred package manager, follow the instructions below to deploy your project.

> **Requirements**: NodeJS `lts/fermium (v.14.15.0)`. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

### Using NPM

- Run `npm i` to install the project dependencies
- Run `npx sls deploy` to deploy this stack to AWS

## Test your service

### Locally

In order to test the function locally, run the following command:

- `sls dynamodb install` to install DynamoDB local

## Features

### Common

#### 1. Ping

Send a ping every 10 minutes to keep connection alive

```json
{
  "action": "ping"
}
```

#### 2. Echo

Just for test

```json
{
  "action": "echo",
  "data": {
    "message": "Hello World!!!"
  }
}
```

### Chat

I. Room

1. Create one-to-one room

```json
{
  "route": "chat",
  "action": "create-one-to-one-room",
  "data": {
    "partnerId": "{{otherUserId}}"
  }
}
```

2. Create group room

```json
{
  "route": "chat",
  "action": "create-group-room",
  "data": {
    "participantIds": ["{{otherUserId}}"]
  }
}
```

3. Create support room

```json
{
  "route": "chat",
  "action": "create-support-room"
}
```

4. Get list rooms (one-to-one & group)

```json
{
  "route": "chat",
  "action": "get-rooms",
  "data": {
    "options": {
      "sorted": true,
      "limit": 10,
      "exclusiveStartKey": null
    }
  }
}
```

5. Get room details

```json
{
  "route": "chat",
  "action": "get-room-details",
  "data": {
    "roomId": "{{roomId}}"
  }
}
```

6. Update room details (`name` only)

```json
{
  "route": "chat",
  "action": "update-room-details",
  "data": {
    "roomId": "{{roomId}}",
    "name": "{{name}}"
  }
}
```

7. Add member (`group` room only)

```json
{
  "route": "chat",
  "action": "add-member",
  "data": {
    "roomId": "{{roomId}}",
    "participantIds": ["{{newMemberId}}"]
  }
}
```

8. Remove member (`group` room only)

```json
{
  "route": "chat",
  "action": "remove-member",
  "data": {
    "roomId": "{{roomId}}",
    "removeUserId": "{{removeUserId}}"
  }
}
```

9. Leave room (`group` room only)

```json
{
  "route": "chat",
  "action": "leave-room",
  "data": {
    "roomId": "{{roomId}}"
  }
}
```

II. Messages

1. Get messages

```json
{
  "route": "chat",
  "action": "get-messages",
  "data": {
    "roomId": "{{roomId}}",
    "options": {
      "sorted": true,
      "limit": 10,
      "exclusiveStartKey": null
    }
  }
}
```

2. Send message

```json
{
  "route": "chat",
  "action": "send-message",
  "data": {
    "roomId": "{{roomId}}",
    "messageData": {
      "message": "{{message}}",
      "format": "{{format}}",
      "metadata": {{metadata}}
    }
  }
}
```

3. Update message

```json
{
  "route": "chat",
  "action": "update-message",
  "data": {
    "roomId": "{{roomId}}",
    "messageId": "{{messageId}}",
    "messageData": {
      "message": "{{message}}",
      "format": "{{format}}",
      "metadata": {{metadata}}
    }
  }
}
```

4. Unsent message

```json
{
  "route": "chat",
  "action": "delete-message",
  "data": {
    "roomId": "{{roomId}}",
    "messageId": "{{messageId}}"
  }
}
```
