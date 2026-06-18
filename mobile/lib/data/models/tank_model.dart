import 'package:hive/hive.dart';

part 'tank_model.g.dart';

@HiveType(typeId: 5)
class TankModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId;

  @HiveField(2)
  final String name;

  @HiveField(3)
  final double? capacity;

  @HiveField(4)
  final String? material;

  @HiveField(5)
  final double? height;

  @HiveField(6)
  final String? status;

  @HiveField(7)
  final List<double> geometry; // [lng, lat]

  @HiveField(8)
  final String? photoUrl;

  @HiveField(9)
  final String? localPhotoPath;

  @HiveField(10)
  final int? serverId;

  TankModel({
    required this.id,
    required this.farmId,
    required this.name,
    this.capacity,
    this.material,
    this.height,
    this.status,
    required this.geometry,
    this.photoUrl,
    this.localPhotoPath,
    this.serverId,
  });

  Map<String, dynamic> toJson(int resolvedFarmId) {
    return {
      'farmId': resolvedFarmId,
      'name': name,
      'capacity': capacity,
      'material': material,
      'height': height,
      'status': status ?? 'ACTIVE',
      'geometry': {
        'type': 'Point',
        'coordinates': [geometry[0], geometry[1]]
      },
      'photoUrl': photoUrl
    };
  }

  TankModel copyWith({
    String? photoUrl,
    int? serverId,
  }) {
    return TankModel(
      id: id,
      farmId: farmId,
      name: name,
      capacity: capacity,
      material: material,
      height: height,
      status: status,
      geometry: geometry,
      photoUrl: photoUrl ?? this.photoUrl,
      localPhotoPath: localPhotoPath,
      serverId: serverId ?? this.serverId,
    );
  }
}
