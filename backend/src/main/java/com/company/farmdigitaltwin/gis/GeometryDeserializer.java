package com.company.farmdigitaltwin.gis;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import org.locationtech.jts.geom.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class GeometryDeserializer extends JsonDeserializer<Geometry> {

    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public Geometry deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node == null || node.isNull()) {
            return null;
        }

        JsonNode typeNode = node.get("type");
        if (typeNode == null) {
            throw new IOException("Missing 'type' field in GeoJSON geometry");
        }
        
        String type = typeNode.asText();
        JsonNode coordinatesNode = node.get("coordinates");
        if (coordinatesNode == null) {
            throw new IOException("Missing 'coordinates' field in GeoJSON geometry");
        }

        switch (type) {
            case "Point":
                return parsePoint(coordinatesNode);
            case "LineString":
                return parseLineString(coordinatesNode);
            case "Polygon":
                return parsePolygon(coordinatesNode);
            default:
                throw new IOException("Unsupported geometry type: " + type);
        }
    }

    private Point parsePoint(JsonNode node) throws IOException {
        if (!node.isArray() || node.size() < 2) {
            throw new IOException("Invalid coordinates for Point. Expected [lng, lat]");
        }
        double lng = node.get(0).asDouble();
        double lat = node.get(1).asDouble();
        return geometryFactory.createPoint(new Coordinate(lng, lat));
    }

    private LineString parseLineString(JsonNode node) throws IOException {
        if (!node.isArray()) {
            throw new IOException("Invalid coordinates for LineString. Expected array of coordinates");
        }
        Coordinate[] coordinates = parseCoordinates(node);
        return geometryFactory.createLineString(coordinates);
    }

    private Polygon parsePolygon(JsonNode node) throws IOException {
        if (!node.isArray() || node.isEmpty()) {
            throw new IOException("Invalid coordinates for Polygon. Expected nested arrays");
        }
        // A polygon contains an outer ring and optional inner rings (holes)
        LinearRing shell = geometryFactory.createLinearRing(parseCoordinates(node.get(0)));
        
        LinearRing[] holes = null;
        if (node.size() > 1) {
            holes = new LinearRing[node.size() - 1];
            for (int i = 1; i < node.size(); i++) {
                holes[i - 1] = geometryFactory.createLinearRing(parseCoordinates(node.get(i)));
            }
        }
        
        return geometryFactory.createPolygon(shell, holes);
    }

    private Coordinate[] parseCoordinates(JsonNode node) throws IOException {
        List<Coordinate> coordinates = new ArrayList<>();
        for (JsonNode coordNode : node) {
            if (coordNode.isArray() && coordNode.size() >= 2) {
                double lng = coordNode.get(0).asDouble();
                double lat = coordNode.get(1).asDouble();
                coordinates.add(new Coordinate(lng, lat));
            } else {
                throw new IOException("Invalid coordinate node in array");
            }
        }
        return coordinates.toArray(new Coordinate[0]);
    }
}
