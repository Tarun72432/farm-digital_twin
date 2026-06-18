import 'package:hive/hive.dart';

part 'farm_model.g.dart';

@HiveType(typeId: 0)
class FarmModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String ownerName;

  @HiveField(3)
  final String? description;

  @HiveField(4)
  final String? status;

  @HiveField(5)
  final List<List<double>> boundary; // List of [lng, lat]

  @HiveField(6)
  final int? serverId;

  @HiveField(7)
  final double? areaHectares;

  FarmModel({
    required this.id,
    required this.name,
    required this.ownerName,
    this.description,
    this.status,
    required this.boundary,
    this.serverId,
    this.areaHectares,
  });

  Map<String, dynamic> toJson() {
    // Standard JTS Polygon coordinates expect double nested lists: [[[lng, lat], [lng, lat], ...]]
    // Ensure polygon is closed (last point matches first point)
    List<List<double>> closedBoundary = List.from(boundary);
    if (closedBoundary.isNotEmpty &&
        (closedBoundary.first[0] != closedBoundary.last[0] ||
            closedBoundary.first[1] != closedBoundary.last[1])) {
      closedBoundary.add(closedBoundary.first);
    }
    return {
      'name': name,
      'ownerName': ownerName,
      'description': description,
      'status': status,
      'boundary': {
        'type': 'Polygon',
        'coordinates': [
          closedBoundary.map((p) => [p[0], p[1]]).toList()
        ]
      }
    };
  }

  FarmModel copyWith({
    int? serverId,
    double? areaHectares,
  }) {
    return FarmModel(
      id: id,
      name: name,
      ownerName: ownerName,
      description: description,
      status: status,
      boundary: boundary,
      serverId: serverId ?? this.serverId,
      areaHectares: areaHectares ?? this.areaHectares,
    );
  }
}
