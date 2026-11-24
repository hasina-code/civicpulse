import { coordinatesSchema } from "../../shared/validators/common.schema";

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEGREES_PER_RADIAN = 180 / Math.PI;
const RADIANS_PER_DEGREE = Math.PI / 180;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LongitudeRange {
  min: number;
  max: number;
}

export interface GeoBoundingBox {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  crossesAntimeridian: boolean;
  longitudeRanges: LongitudeRange[];
}

function assertValidRadius(radiusMeters: number): void {
  if (!Number.isFinite(radiusMeters) || radiusMeters < 0) {
    throw new RangeError("Radius must be a finite, non-negative number");
  }
}

function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

export function haversineDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const start = coordinatesSchema.parse(from);
  const end = coordinatesSchema.parse(to);
  const startLatitude = start.latitude * RADIANS_PER_DEGREE;
  const endLatitude = end.latitude * RADIANS_PER_DEGREE;
  const latitudeDifference = endLatitude - startLatitude;
  const longitudeDifference =
    (end.longitude - start.longitude) * RADIANS_PER_DEGREE;
  const latitudeTerm = Math.sin(latitudeDifference / 2) ** 2;
  const longitudeTerm =
    Math.cos(startLatitude) *
    Math.cos(endLatitude) *
    Math.sin(longitudeDifference / 2) ** 2;
  const haversine = Math.min(1, Math.max(0, latitudeTerm + longitudeTerm));

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function getBoundingBox(
  center: Coordinates,
  radiusMeters: number,
): GeoBoundingBox {
  const point = coordinatesSchema.parse(center);
  assertValidRadius(radiusMeters);

  const latitudeRadians = point.latitude * RADIANS_PER_DEGREE;
  const angularRadius = radiusMeters / EARTH_RADIUS_METERS;
  const minLatitudeRadians = Math.max(
    -Math.PI / 2,
    latitudeRadians - angularRadius,
  );
  const maxLatitudeRadians = Math.min(
    Math.PI / 2,
    latitudeRadians + angularRadius,
  );
  const minLatitude = minLatitudeRadians * DEGREES_PER_RADIAN;
  const maxLatitude = maxLatitudeRadians * DEGREES_PER_RADIAN;
  const includesPole =
    minLatitudeRadians <= -Math.PI / 2 ||
    maxLatitudeRadians >= Math.PI / 2 ||
    angularRadius >= Math.PI;

  if (includesPole) {
    return {
      minLatitude,
      maxLatitude,
      minLongitude: -180,
      maxLongitude: 180,
      crossesAntimeridian: false,
      longitudeRanges: [{ min: -180, max: 180 }],
    };
  }

  const longitudeRadius =
    Math.asin(
      Math.min(
        1,
        Math.sin(angularRadius) / Math.cos(latitudeRadians),
      ),
    ) * DEGREES_PER_RADIAN;
  const west = normalizeLongitude(point.longitude - longitudeRadius);
  const east = normalizeLongitude(point.longitude + longitudeRadius);
  const crossesAntimeridian = west > east;

  return {
    minLatitude,
    maxLatitude,
    minLongitude: west,
    maxLongitude: east,
    crossesAntimeridian,
    longitudeRanges: crossesAntimeridian
      ? [
          { min: west, max: 180 },
          { min: -180, max: east },
        ]
      : [{ min: west, max: east }],
  };
}
