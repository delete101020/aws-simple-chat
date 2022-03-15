import { ApiGatewayManagementApi } from 'aws-sdk';
import { PostToConnectionRequest } from 'aws-sdk/clients/apigatewaymanagementapi';
import {
  LOCAL_WEBSOCKET_API_ENDPOINT,
  WEBSOCKET_API_ENDPOINT,
} from '@core/constants';

export default class ApiGatewayConnector {
  private _endpoint: string;
  private static _instance: ApiGatewayConnector;
  private _apiGateway: ApiGatewayManagementApi;

  constructor() {
    this._endpoint = process.env.IS_OFFLINE
      ? LOCAL_WEBSOCKET_API_ENDPOINT
      : WEBSOCKET_API_ENDPOINT;
    this._apiGateway = new ApiGatewayManagementApi({
      endpoint: this._endpoint,
    });
  }

  public static getInstance() {
    if (!ApiGatewayConnector._instance) {
      ApiGatewayConnector._instance = new ApiGatewayConnector();
    }

    return ApiGatewayConnector._instance;
  }

  /** =================================================================== */

  async postToConnection(params: PostToConnectionRequest) {
    return await this._apiGateway.postToConnection(params).promise();
  }
}
