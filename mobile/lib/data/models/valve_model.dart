import 'package:hive/hive.dart';

part 'valve_model.g.dart';

@HiveType(typeId: 3)
class ValveModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId;

  @HiveField(2)
  final String valveNumber;

  @HiveField(3)
  final String? type;

  @HiveField(4)
  final String? zone;

  @HiveField(5)
  final String? status;

  @HiveField(6)
  final List<double> geometry; // [lng, lat]

  @HiveField(7)
  final String? photoUrl;

  @HiveField(8)
  final String? localPhotoPath;

  @HiveField(9)
  final int? serverId;

  ValveModel({
    required this.id,
    required this.farmId,
    required this.valveNumber,
    this.type,
    this.zone,
    this.status,
    required this.geometry,
    this.photoUrl,
    this.localPhotoPath,
    this.serverId,
  });

  Map<String, dynamic> toJson(int resolvedFarmId) {
    return {
      'farmId': resolvedFarmId,
      'valveNumber': valveNumber,
      'type': type ?? 'MANUAL',
      'zone': zone,
      'status': status ?? 'ACTIVE',
      'geometry': {
        'type': 'Point',
        'coordinates': [geometry[0], geometry[1]]
      },
      'photoUrl': photoUrl
    };
  }

  ValveModel copyWith({
    String? photoUrl,
    int? serverId,
  }) {
    return ValveModel(
      id: id,
      farmId: farmId,
      valveNumber: valveNumber,
      type: type,
      zone: zone,
      status: status,
      geometry: geometry,
      photoUrl: photoUrl ?? this.photoUrl,
      localPhotoPath: localPhotoPath,
      serverId: serverId ?? this.serverId,
    );
  }
}
