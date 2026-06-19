import 'package:hive/hive.dart';

part 'pipeline_model.g.dart';

@HiveType(typeId: 2)
class PipelineModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId; // Local UUID of the farm

  @HiveField(2)
  final String name;

  @HiveField(3)
  final double? diameter;

  @HiveField(4)
  final String? material;

  @HiveField(5)
  final String? status;

  @HiveField(6)
  final List<List<double>> geometry; // List of [lng, lat]

  @HiveField(7)
  final double? lengthMeters;

  @HiveField(8)
  final int? serverId;

  PipelineModel({
    required this.id,
    required this.farmId,
    required this.name,
    this.diameter,
    this.material,
    this.status,
    required this.geometry,
    this.lengthMeters,
    this.serverId,
  });

  Map<String, dynamic> toJson() {
    return {
      'farmId': farmId,
      'name': name,
      'diameter': diameter,
      'material': material,
      'status': status ?? 'ACTIVE',
      'geometry': {
        'type': 'LineString',
        'coordinates': geometry.map((p) => [p[0], p[1]]).toList()
      }
    };
  }

  PipelineModel copyWith({
    int? serverId,
    double? lengthMeters,
  }) {
    return PipelineModel(
      id: id,
      farmId: farmId,
      name: name,
      diameter: diameter,
      material: material,
      status: status,
      geometry: geometry,
      lengthMeters: lengthMeters ?? this.lengthMeters,
      serverId: serverId ?? this.serverId,
    );
  }
}
