package com.company.farmdigitaltwin.gis;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

import java.io.IOException;

public class GeometrySerializer extends JsonSerializer<Geometry> {

    @Override
    public void serialize(Geometry value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }

        gen.writeStartObject();
        if (value instanceof Point) {
            Point point = (Point) value;
            gen.writeStringField("type", "Point");
            gen.writeFieldName("coordinates");
            writeCoordinate(point.getCoordinate(), gen);
        } else if (value instanceof LineString) {
            LineString lineString = (LineString) value;
            gen.writeStringField("type", "LineString");
            gen.writeFieldName("coordinates");
            writeCoordinates(lineString.getCoordinates(), gen);
        } else if (value instanceof Polygon) {
            Polygon polygon = (Polygon) value;
            gen.writeStringField("type", "Polygon");
            gen.writeFieldName("coordinates");
            gen.writeStartArray();
            writeCoordinates(polygon.getExteriorRing().getCoordinates(), gen);
            // Write interior rings (holes) if any exist
            for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
                writeCoordinates(polygon.getInteriorRingN(i).getCoordinates(), gen);
            }
            gen.writeEndArray();
        } else {
            gen.writeStringField("type", "Unknown");
            gen.writeNullField("coordinates");
        }
        gen.writeEndObject();
    }

    private void writeCoordinate(Coordinate coord, JsonGenerator gen) throws IOException {
        gen.writeStartArray();
        gen.writeNumber(coord.x); // Longitude
        gen.writeNumber(coord.y); // Latitude
        gen.writeEndArray();
    }

    private void writeCoordinates(Coordinate[] coords, JsonGenerator gen) throws IOException {
        gen.writeStartArray();
        for (Coordinate coord : coords) {
            writeCoordinate(coord, gen);
        }
        gen.writeEndArray();
    }
}
