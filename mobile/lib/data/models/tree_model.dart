import 'package:hive/hive.dart';

part 'tree_model.g.dart';

@HiveType(typeId: 1)
class TreeModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String farmId; // Local UUID of the farm

  @HiveField(2)
  final String treeNumber;

  @HiveField(3)
  final String? species;

  @HiveField(4)
  final int? age;

  @HiveField(5)
  final String? healthStatus;

  @HiveField(6)
  final List<double> location; // [lng, lat]

  @HiveField(7)
  final String? photoUrl;

  @HiveField(8)
  final String? localPhotoPath;

  @HiveField(9)
  final String? notes;

  @HiveField(10)
  final int? serverId;

  TreeModel({
    required this.id,
    required this.farmId,
    required this.treeNumber,
    this.species,
    this.age,
    this.healthStatus,
    required this.location,
    this.photoUrl,
    this.localPhotoPath,
    this.notes,
    this.serverId,
  });

  Map<String, dynamic> toJson(int resolvedFarmId) {
    return {
      'farmId': resolvedFarmId,
      'treeNumber': treeNumber,
      'species': species ?? 'Moringa oleifera',
      'age': age,
      'healthStatus': healthStatus ?? 'HEALTHY',
      'location': {
        'type': 'Point',
        'coordinates': [location[0], location[1]]
      },
      'photoUrl': photoUrl,
      'notes': notes
    };
  }

  TreeModel copyWith({
    String? photoUrl,
    int? serverId,
  }) {
    return TreeModel(
      id: id,
      farmId: farmId,
      treeNumber: treeNumber,
      species: species,
      age: age,
      healthStatus: healthStatus,
      location: location,
      photoUrl: photoUrl ?? this.photoUrl,
      localPhotoPath: localPhotoPath,
      notes: notes,
      serverId: serverId ?? this.serverId,
    );
  }
}
