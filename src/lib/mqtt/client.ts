import mqtt, { MqttClient, IClientOptions } from "mqtt";

export class MQTTClient {
  public client?: MqttClient;
  private options: IClientOptions;

  constructor() {
    this.options = {
      host: process.env.MQTT_ADDRESS,
      protocol: "mqtt",
      protocolVersion: 5,
      port: parseInt(process.env.MQTT_PORT!),
      connectTimeout: 1e3,
      reconnectPeriod: 1e3,
    };
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect("", this.options);

      this.client.on("connect", () => {
        // Logger.info(`MQTT client connected`);
        resolve();
      });

      this.client.on("disconnect", () => {
        // Logger.error(`MQTT client disconnected`);
      });

      this.client.on("error", (err) => {
        // Logger.error(`MQTT client failed to connect`);
        reject(err);
      });
    });
  }

  public publish(topic: string, message: any) {
    this.client?.publish(topic, message);
  }
}