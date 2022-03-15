export interface IConnection {
  connectionId: string;
  userId: string;
  createdAt: number;
}

export default class Connection {
  private readonly _connection: IConnection;

  constructor(connectionId: string, userId: string) {
    this._connection = {
      connectionId,
      userId,
      createdAt: Date.now(),
    };
  }

  public getEntityMappings(): IConnection {
    return this._connection;
  }
}
