import 'package:hive/hive.dart';

part 'pump_model.g.dart';

@HiveType(typeId: 4)
class PumpModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId;

  @HiveField(2)
  final String name;

  @HiveField(3)
  final double? capacity;

  @HiveField(4)
  final double? powerRating;

  @HiveField(5)
  final String? manufacturer;

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

  PumpModel({
    required this.id,
    required this.farmId,
    required this.name,
    this.capacity,
    this.powerRating,
    this.manufacturer,
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
      'powerRating': powerRating,
      'manufacturer': manufacturer,
      'status': status ?? 'ACTIVE',
      'geometry': {
        'type': 'Point',
        'coordinates': [geometry[0], geometry[1]]
      },
      'photoUrl': photoUrl
    };
  }

  PumpModel copyWith({
    String? photoUrl,
    int? serverId,
  }) {
    return PumpModel(
      id: id,
      farmId: farmId,
      name: name,
      capacity: capacity,
      powerRating: powerRating,
      manufacturer: manufacturer,
      status: status,
      geometry: geometry,
      photoUrl: photoUrl ?? this.photoUrl,
      localPhotoPath: localPhotoPath,
      serverId: serverId ?? this.serverId,
    );
  }
}
