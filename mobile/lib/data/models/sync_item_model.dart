import 'package:hive/hive.dart';

part 'sync_item_model.g.dart';

@HiveType(typeId: 7)
class SyncItemModel extends HiveObject {
  @HiveField(0)
  final String id; // UUID

  @HiveField(1)
  final String action; // 'CREATE', 'UPDATE', 'DELETE'

  @HiveField(2)
  final String entityType; // 'Farm', 'Tree', 'Pipeline', 'Valve', 'Pump', 'Tank', 'Infrastructure'

  @HiveField(3)
  final String localId; // UUID of local model in its box

  @HiveField(4)
  final Map<dynamic, dynamic> payload; // Dynamic Map containing model details

  @HiveField(5)
  final String? localPhotoPath; // Local photo path if image upload is required

  @HiveField(6)
  final String status; // 'PENDING', 'SYNCING', 'FAILED', 'COMPLETED'

  @HiveField(7)
  final String? errorMessage;

  @HiveField(8)
  final DateTime createdAt;

  SyncItemModel({
    required this.id,
    required this.action,
    required this.entityType,
    required this.localId,
    required this.payload,
    this.localPhotoPath,
    required this.status,
    this.errorMessage,
    required this.createdAt,
  });

  SyncItemModel copyWith({
    String? status,
    String? errorMessage,
    Map<dynamic, dynamic>? payload,
  }) {
    return SyncItemModel(
      id: id,
      action: action,
      entityType: entityType,
      localId: localId,
      payload: payload ?? this.payload,
      localPhotoPath: localPhotoPath,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt,
    );
  }

  String get endpoint {
    switch (entityType) {
      case 'Farm':
        return '/api/farms';
      case 'Tree':
        return '/api/trees';
      case 'Pipeline':
        return '/api/pipelines';
      case 'Valve':
        return '/api/valves';
      case 'Pump':
        return '/api/pumps';
      case 'Tank':
        return '/api/tanks';
      case 'Infrastructure':
        return '/api/infrastructure';
      default:
        throw Exception('Unknown entity type: $entityType');
    }
  }
}
