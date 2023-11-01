import { schedule } from "node-cron";
import { AISReceiver, NavigationalStatus, Payload as ConvertedPayload } from "./AISReceiver";

type Message = {
    ERROR: boolean,
    USERNAME: string,
    FORMAT: string,
    ERROR_MESSAGE: string
}

export type Payload = {
  MMSI: number;
  TIME: string;
  LONGITUDE: number;
  LATITUDE: number;
  COG: number;
  SOG: number;
  HEADING: number;
  ROT: number;
  NAVSTAT: number;
  IMO: number;
  NAME: string;
  CALLSIGN: string;
  TYPE: number;
  A: number;
  B: number;
  C: number;
  D: number;
  DRAUGHT: number;
  DEST: string;
  ETA: string;
};

export class AISHub {
  private url = `https://data.aishub.net/ws.php?username=${process.env.AIS_HUB_SECRET}&format=1&output=json&compress=0&interval=1`
  public on: (data: Payload) => void;

  constructor() {
    this.start();
  }

  private request = () => {
    fetch(this.url)
      .then((res) => res.json())
      .then((res) => this.emitter(res))
      .catch((err) => console.log(err));
  };

  private emitter = async (payload: any) => {
    const [message, data]: [Message, Payload[]] = payload;

    if (message.ERROR) {
        return console.log("AISHub Error:", message.ERROR_MESSAGE)
    }

    for (const line of data) {
        this.on(line)
        await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  private start = () => {
    schedule("*/2 * * * *", this.request);
  };

  public static convert = (data: Payload): ConvertedPayload => {
    return {
      source: "aishub.net",
      name: data.NAME.trim(),
      mmsi: data.MMSI.toString(),
      latitude: +data.LATITUDE.toFixed(AISReceiver.PRECISION),
      longitude: +data.LONGITUDE.toFixed(AISReceiver.PRECISION),
      cog: data.COG || 0,
      sog: data.SOG || 0,
      head: data.HEADING || 0,
      rot: data.ROT || 0,
      navigation_status: data.NAVSTAT,
      status: NavigationalStatus[data.NAVSTAT],
      timestamp: new Date(data.TIME),
    }
  }
}
