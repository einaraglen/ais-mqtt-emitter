import WebSocket from "ws";
import { AISReceiver, NavigationalStatus, Payload as ConvertedPayload } from "./AISReceiver";

export type Payload = {
  MessageType: string;
  MetaData: {
    MMSI: number;
    MMSI_String: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
  Message: {
    PositionReport: {
      Cog: number;
      CommunicationState: number;
      Latitude: number;
      Longitude: number;
      MessageID: number;
      NavigationalStatus: number;
      PositionAccuracy: false;
      Raim: boolean;
      RateOfTurn: number;
      RepeatIndicator: number;
      Sog: number;
      Spare: number;
      SpecialManoeuvreIndicator: number;
      Timestamp: number;
      TrueHeading: number;
      UserID: number;
      Valid: boolean;
    };
  };
};

export class AISStream {
  private socket: WebSocket;
  public on: (data: Payload) => void;

  constructor() {
    this.connect().then(() => {
      this.subscribe();
      this.listen();
    });
  }

  private connect = () => {
    return new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.socket.onopen = () => {
        resolve();
      };

      this.socket.onclose = () => {
        reject();
      };
    });
  };

  private subscribe = () => {
    this.socket.send(
      JSON.stringify({
        Apikey: process.env.AIS_STREAM_SECRET,
        BoundingBoxes: [
          [
            [-90, -180],
            [90, 180],
          ],
        ],
        FilterMessageTypes: ["PositionReport"],
      })
    );
  };

  private listen = () => {
    this.socket.onmessage = (event: any) => {
      const payload: Payload = JSON.parse(event.data);
      this.on(payload);
    };
  };

  public static compress = (data: Payload) => {
    return [
      data.MetaData.ShipName.trim(),
      data.MetaData.MMSI,
      +data.Message.PositionReport.Latitude.toFixed(AISReceiver.PRECISION),
      +data.Message.PositionReport.Longitude.toFixed(AISReceiver.PRECISION),
      data.Message.PositionReport.Cog || 0,
      data.Message.PositionReport.Sog || 0,
      data.Message.PositionReport.TrueHeading || 0,
      data.Message.PositionReport.RateOfTurn || 0,
      data.Message.PositionReport.NavigationalStatus,
      new Date(data.MetaData.time_utc).getTime(),
    ];
  };

  public static convert = (data: Payload) => {
    return {
      name: data.MetaData.ShipName.trim(),
      mmsi: data.MetaData.MMSI.toString(),
      latitude: +data.Message.PositionReport.Latitude.toFixed(AISReceiver.PRECISION),
      longitude: +data.Message.PositionReport.Longitude.toFixed(AISReceiver.PRECISION),
      cog: data.Message.PositionReport.Cog || 0,
      sog: data.Message.PositionReport.Sog || 0,
      head: data.Message.PositionReport.TrueHeading || 0,
      rot: data.Message.PositionReport.RateOfTurn || 0,
      navigation_status: data.Message.PositionReport.NavigationalStatus,
      status: NavigationalStatus[data.Message.PositionReport.NavigationalStatus],
      timestamp: new Date(data.MetaData.time_utc),
    };
  };
}
