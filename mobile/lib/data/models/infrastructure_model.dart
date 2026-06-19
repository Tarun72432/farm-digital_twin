import 'package:hive/hive.dart';

part 'infrastructure_model.g.dart';

@HiveType(typeId: 6)
class InfrastructureModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId;

  @HiveField(2)
  final String name;

  @HiveField(3)
  final String type; // BUILDING, ROAD, STORAGE, FENCE, PANEL, SOURCE

  @HiveField(4)
  final String? status;

  @HiveField(5)
  final String geometryType; // 'Point', 'LineString', 'Polygon'

  @HiveField(6)
  final List<dynamic> coordinates; // List of coordinates

  @HiveField(7)
  final String? photoUrl;

  @HiveField(8)
  final String? localPhotoPath;

  @HiveField(9)
  final int? serverId;

  InfrastructureModel({
    required this.id,
    required this.farmId,
    required this.name,
    required this.type,
    this.status,
    required this.geometryType,
    required this.coordinates,
    this.photoUrl,
    this.localPhotoPath,
    this.serverId,
  });

  Map<String, dynamic> toJson() {
    dynamic coords = coordinates;
    if (geometryType == 'Polygon') {
      // GeoJSON Polygon coordinates must be double nested e.g., [ [ [lng, lat], ... ] ]
      List<List<double>> boundaryCoords = coordinates.cast<List<double>>();
      List<List<double>> closedCoords = List.from(boundaryCoords);
      if (closedCoords.isNotEmpty &&
          (closedCoords.first[0] != closedCoords.last[0] ||
              closedCoords.first[1] != closedCoords.last[1])) {
        closedCoords.add(closedCoords.first);
      }
      coords = [closedCoords];
    } else if (geometryType == 'LineString') {
      coords = coordinates.cast<List<double>>();
    } else {
      // Point
      coords = coordinates.cast<double>();
    }
    return {
      'farmId': farmId,
      'name': name,
      'type': type,
      'status': status ?? 'ACTIVE',
      'geometry': {
        'type': geometryType,
        'coordinates': coords
      },
      'photoUrl': photoUrl
    };
  }

  InfrastructureModel copyWith({
    String? photoUrl,
    int? serverId,
  }) {
    return InfrastructureModel(
      id: id,
      farmId: farmId,
      name: name,
      type: type,
      status: status,
      geometryType: geometryType,
      coordinates: coordinates,
      photoUrl: photoUrl ?? this.photoUrl,
      localPhotoPath: localPhotoPath,
      serverId: serverId ?? this.serverId,
    );
  }
}
