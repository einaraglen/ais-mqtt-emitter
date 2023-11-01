import EventEmitter from "events";
import { AISStream, Payload as AISPayload } from "./AISStream";
import { BarentsWatch, Payload as BarentsPayload } from "./BarentsWatch";
import { AISHub, Payload as AISHubPayload } from "./AISHub";

export const NavigationalStatus = {
  0: "Underway using engine",
  1: "At anchor",
  2: "Not nunder command",
  3: "Restricted maneuverability",
  4: "Constrained by her draught",
  5: "Moored",
  6: "Aground",
  7: "Engaged in fishing",
  8: "Underway sailing",
  9: "not_in_use",
  10: "not_in_use",
  11: "Power-driven vessel towing astern",
  12: "Power-driven vessel pushing ahead or towing alongside",
  13: "not_in_use",
  14: "Transmitting search and rescue signal",
  15: "ais_test",
};

export type Payload = {
  source: string;
  name: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  cog: number;
  sog: number;
  rot: number;
  head: number;
  navigation_status: number;
  status: string;
  timestamp: Date;
};

export class AISReceiver {
  public static readonly PRECISION = 7;

  private barentsStream: BarentsWatch;
  private aisStream: AISStream;
  private aisHubStream: AISHub;

  public on: (data: Payload) => void;

  constructor() {
    this.barentsStream = new BarentsWatch();
    this.aisStream = new AISStream();
    this.aisHubStream = new AISHub();
    this.consumers();
  }

  private listenBarentsWatch = (data: BarentsPayload) => {
    try {
      this.on(BarentsWatch.convert(data));
    } catch (err) {
      console.log("Failed to convert BarentsWatch data");
    }
  };

  private listenAISStream = (data: AISPayload) => {
    try {
      this.on(AISStream.convert(data));
    } catch (err) {
      console.log("Failed to convert AISStream data");
    }
  };

  private listenAISHubStream = (data: AISHubPayload) => {
    try {
      this.on(AISHub.convert(data));
    } catch (err) {
      console.log("Failed to convert AISHub data");
    }
  };

  private consumers = () => {
    this.barentsStream.on = this.listenBarentsWatch;
    this.aisStream.on = this.listenAISStream;
    this.aisHubStream.on = this.listenAISHubStream;
  };
}
