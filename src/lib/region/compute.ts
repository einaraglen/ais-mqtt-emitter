import { regions_small } from "./regions";

export class Region {
  public static compute = (latitude: number, longitude: number) => {
    for (const region in regions_small) {
      const [minLat, minLon, maxLat, maxLon] = regions_small[region];
      if (latitude >= minLat && latitude <= maxLat && longitude >= minLon && longitude <= maxLon) {
        return region;
      }
    }

    return "UNK";
  };
}
