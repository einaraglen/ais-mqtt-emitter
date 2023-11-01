import { AISStream } from "./lib/ais/AISStream"
import { MQTTClient } from "./lib/mqtt/client"
import { Region } from "./lib/region/compute"

export const run = () => {
    const client = new MQTTClient()

    client.connect().then(() => {
        const stream = new AISStream();

        stream.on = (data) => {
            const region = Region.compute(data.Message.PositionReport.Latitude, data.Message.PositionReport.Longitude)
            client.publish(`AIS/${region}/${data.MetaData.MMSI}`, JSON.stringify(AISStream.compress(data)))
        }
    })
}