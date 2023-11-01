import { URLSearchParams } from "url";
import { AISReceiver, NavigationalStatus, Payload as ConvertedPayload } from "./AISReceiver";

export type Payload = {
  courseOverGround: number;
  latitude: number;
  longitude: number;
  name: string;
  rateOfTurn: number;
  shipType: number;
  speedOverGround: number;
  trueHeading: number;
  navigationalStatus: number;
  mmsi: number;
  msgtime: string;
};

export class BarentsWatch {
  public on: (data: Payload) => void;

  constructor () {
    this.connect();
  }

  private connect = async () => {
    const token = await this.token();
    const res = await fetch("https://live.ais.barentswatch.no/v1/combined", { headers: { Authorization: `Bearer ${token}` } });

    for await (const chunk of this.parseJSONStream(res.body)) {
        this.on(chunk);
    }
  };

  private parseJSONStream = async function* (stream: ReadableStream<Uint8Array>) {
    for await (const line of this.readLines(stream.getReader())) {
      const trimmedLine = line.trim().replace(/,$/, "");

      if (trimmedLine !== "{" && trimmedLine !== "}") {
        yield JSON.parse(trimmedLine) as Payload;
      }
    }
  };

  private readLines = async function* (reader: ReadableStreamDefaultReader<Uint8Array>) {
    const textDecoder = new TextDecoder();
    let partOfLine = "";
    for await (const chunk of this.readChunks(reader)) {
      const chunkText = textDecoder.decode(chunk);
      const chunkLines = chunkText.split("\n");
      if (chunkLines.length === 1) {
        partOfLine += chunkLines[0];
      } else if (chunkLines.length > 1) {
        yield partOfLine + chunkLines[0];
        for (let i = 1; i < chunkLines.length - 1; i++) {
          yield chunkLines[i];
        }
        partOfLine = chunkLines[chunkLines.length - 1];
      }
    }
  };

  private readChunks = (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    return {
      async *[Symbol.asyncIterator]() {
        let readResult = await reader.read();
        while (!readResult.done) {
          yield readResult.value;
          readResult = await reader.read();
        }
      },
    };
  };

  private token = async () => {
    const form = new URLSearchParams({
      client_id: process.env.BARENTS_WATCH_CLIENT,
      client_secret: process.env.BARENTS_WATCH_SECRET,
      scope: "ais",
      grant_type: "client_credentials",
    });

    const res = await fetch("https://id.barentswatch.no/connect/token", { method: "POST", body: form });

    const body = await res.json();
    return body.access_token as string;
  };

  public static convert = (data: Payload): ConvertedPayload => {
    return {
      source: "barentswatch.no",
      name: data.name.trim(),
      mmsi: data.mmsi.toString(),
      latitude: +data.latitude.toFixed(AISReceiver.PRECISION),
      longitude: +data.longitude.toFixed(AISReceiver.PRECISION),
      cog: data.courseOverGround || 0,
      sog: data.speedOverGround || 0,
      head: data.trueHeading || 0,
      rot: data.rateOfTurn || 0,
      navigation_status: data.navigationalStatus,
      status: NavigationalStatus[data.navigationalStatus],
      timestamp: new Date(data.msgtime),
    }
  }
}
