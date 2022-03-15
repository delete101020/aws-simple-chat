import ApiGatewayConnector from '@core/connectors/api-gateway.connector';
import { ConnectionService } from '@services/connection.service';

export default class ApiGatewayService {
  private static _instance: ApiGatewayService;
  private _apiGatewayConnector: ApiGatewayConnector;

  constructor() {
    this._apiGatewayConnector = ApiGatewayConnector.getInstance();
  }

  public static getInstance() {
    if (!ApiGatewayService._instance) {
      ApiGatewayService._instance = new ApiGatewayService();
    }

    return ApiGatewayService._instance;
  }

  /** =================================================================== */

  async sendMessageToConnection(
    connectionId: string,
    data: Record<string, unknown>
  ) {
    return await this._apiGatewayConnector.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(data),
    });
  }

  async sendMessageToUser(userId: string, data: Record<string, unknown>) {
    const connectionService = ConnectionService.getInstance();
    const connections = await connectionService.getConnections(userId);
    const connectionIds = connections.map(
      (connection) => connection.connectionId as string
    );

    return await Promise.all(
      connectionIds.map((connectionId) => {
        this._apiGatewayConnector.postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(data),
        });
      })
    );
  }

  async sendMessageToUsers(userIds: string[], data: Record<string, unknown>) {
    return await Promise.all(
      userIds.map(async (userId) => this.sendMessageToUser(userId, data))
    );
  }
}
