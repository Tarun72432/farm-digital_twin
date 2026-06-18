package com.company.farmdigitaltwin.gis;

import org.locationtech.jts.geom.*;

public class GisUtils {

    private static final GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double EARTH_RADIUS = 6378137.0; // In meters

    /**
     * Calculates the area of a JTS Polygon in Hectares (1 Hectare = 10,000 sq meters).
     * Uses local transverse projection (Mercator-based tangent plane) centered on the polygon centroid.
     */
    public static double calculateAreaInHectares(Polygon polygon) {
        if (polygon == null || polygon.isEmpty()) {
            return 0.0;
        }

        Point centroid = polygon.getCentroid();
        double centerLat = centroid.getY();
        double centerLatRad = Math.toRadians(centerLat);

        // Project exterior ring
        Coordinate[] extCoords = polygon.getExteriorRing().getCoordinates();
        Coordinate[] projExtCoords = new Coordinate[extCoords.length];
        for (int i = 0; i < extCoords.length; i++) {
            projExtCoords[i] = projectCoordinate(extCoords[i], centerLatRad);
        }
        LinearRing projShell = factory.createLinearRing(projExtCoords);

        // Project holes
        LinearRing[] projHoles = new LinearRing[polygon.getNumInteriorRing()];
        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            Coordinate[] holeCoords = polygon.getInteriorRingN(i).getCoordinates();
            Coordinate[] projHoleCoords = new Coordinate[holeCoords.length];
            for (int j = 0; j < holeCoords.length; j++) {
                projHoleCoords[j] = projectCoordinate(holeCoords[j], centerLatRad);
            }
            projHoles[i] = factory.createLinearRing(projHoleCoords);
        }

        Polygon projPolygon = factory.createPolygon(projShell, projHoles);
        double areaSqMeters = projPolygon.getArea();
        
        return areaSqMeters / 10000.0;
    }

    /**
     * Calculates the length of a JTS LineString in meters.
     * Uses local transverse projection centered on the centroid.
     */
    public static double calculateLengthInMeters(LineString line) {
        if (line == null || line.isEmpty()) {
            return 0.0;
        }

        Point centroid = line.getCentroid();
        double centerLat = centroid.getY();
        double centerLatRad = Math.toRadians(centerLat);

        Coordinate[] coords = line.getCoordinates();
        Coordinate[] projCoords = new Coordinate[coords.length];
        for (int i = 0; i < coords.length; i++) {
            projCoords[i] = projectCoordinate(coords[i], centerLatRad);
        }

        LineString projLine = factory.createLineString(projCoords);
        return projLine.getLength();
    }

    private static Coordinate projectCoordinate(Coordinate coord, double centerLatRad) {
        double latRad = Math.toRadians(coord.y);
        double lngRad = Math.toRadians(coord.x);
        
        // Simple Transverse Mercator tangent plane projection
        double x = EARTH_RADIUS * lngRad * Math.cos(centerLatRad);
        double y = EARTH_RADIUS * latRad;
        
        return new Coordinate(x, y);
    }
}
