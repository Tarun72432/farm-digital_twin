import 'dart:io';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import 'api_service.dart';
import '../data/models/farm_model.dart';
import '../data/models/tree_model.dart';
import '../data/models/pipeline_model.dart';
import '../data/models/valve_model.dart';
import '../data/models/pump_model.dart';
import '../data/models/tank_model.dart';
import '../data/models/infrastructure_model.dart';
import '../data/models/sync_item_model.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;

  final ApiService _apiService = ApiService();

  SyncService._internal();

  /// Perform synchronization of all pending queue items in chronological order.
  Future<void> syncPendingQueue() async {
    final queueBox = Hive.box<SyncItemModel>('sync_queue');
    final pendingItems = queueBox.values
        .where((item) => item.status == 'PENDING' || item.status == 'FAILED')
        .toList();

    // Sort items by creation time to ensure parent dependencies are created first
    pendingItems.sort((a, b) => a.createdAt.compareTo(b.createdAt));

    for (var item in pendingItems) {
      try {
        // Update status to syncing
        await item.save();
        final updatedItem = item.copyWith(status: 'SYNCING');
        await queueBox.put(item.id, updatedItem);

        // 1. Check and handle photo uploads
        String? photoUrl = updatedItem.payload['photoUrl'];
        if (updatedItem.localPhotoPath != null &&
            updatedItem.localPhotoPath!.isNotEmpty) {
          final file = File(updatedItem.localPhotoPath!);
          if (await file.exists()) {
            final fileName = file.path.split('/').last;
            final formData = FormData.fromMap({
              'file': await MultipartFile.fromFile(
                file.path,
                filename: fileName,
              ),
            });

            final uploadResponse = await _apiService.dio.post(
              '/api/assets/upload',
              data: formData,
            );

            if (uploadResponse.statusCode == 200 &&
                uploadResponse.data != null) {
              photoUrl = uploadResponse.data['url'];
            } else {
              throw Exception('Photo upload failed with status ${uploadResponse.statusCode}');
            }
          }
        }

        // 2. Resolve relational dependencies (farmId mapping from local UUID to server integer ID)
        final Map<String, dynamic> resolvedPayload = Map<String, dynamic>.from(updatedItem.payload);
        if (photoUrl != null) {
          resolvedPayload['photoUrl'] = photoUrl;
        }

        if (resolvedPayload.containsKey('farmId')) {
          final farmIdVal = resolvedPayload['farmId'];
          // If farmId is a non-numeric UUID, lookup the serverId
          if (farmIdVal is String) {
            final farmBox = Hive.box<FarmModel>('farms');
            final farm = farmBox.values.firstWhere(
              (f) => f.id == farmIdVal,
              orElse: () => throw Exception('Referenced farm $farmIdVal not found locally.'),
            );

            if (farm.serverId == null) {
              throw Exception('Parent Farm ${farm.name} is not synced yet. Postponing child asset.');
            }
            resolvedPayload['farmId'] = farm.serverId;
          }
        }

        // 3. Post/Put to REST API
        Response response;
        if (updatedItem.action == 'CREATE') {
          response = await _apiService.dio.post(
            updatedItem.endpoint,
            data: resolvedPayload,
          );
        } else if (updatedItem.action == 'UPDATE') {
          // Retrieve local model serverId to use for PUT URL
          final serverId = await _getServerId(updatedItem.entityType, updatedItem.localId);
          if (serverId == null) {
            throw Exception('Cannot update: server ID not found for ${updatedItem.entityType} ${updatedItem.localId}');
          }
          response = await _apiService.dio.put(
            '${updatedItem.endpoint}/$serverId',
            data: resolvedPayload,
          );
        } else {
          throw Exception('Unsupported action: ${updatedItem.action}');
        }

        if (response.statusCode == 200 || response.statusCode == 201) {
          final int serverId = response.data['id'];
          
          // 4. Update the local Hive model with its serverId and optional details
          await _updateLocalModel(
            updatedItem.entityType,
            updatedItem.localId,
            serverId,
            response.data,
            photoUrl,
          );

          // Mark sync item as completed
          final completedItem = updatedItem.copyWith(
            status: 'COMPLETED',
            errorMessage: null,
          );
          await queueBox.put(item.id, completedItem);
        } else {
          throw Exception('API error: ${response.statusMessage}');
        }
      } catch (e) {
        // Log sync failure details and pause sync queue execution
        final failedItem = item.copyWith(
          status: 'FAILED',
          errorMessage: e.toString(),
        );
        await queueBox.put(item.id, failedItem);
        break; // Stop sync queue loop when a step fails to maintain relationship integrity
      }
    }
  }

  /// Get the server ID of a local asset entity.
  Future<int?> _getServerId(String entityType, String localId) async {
    switch (entityType) {
      case 'Farm':
        return Hive.box<FarmModel>('farms').get(localId)?.serverId;
      case 'Tree':
        return Hive.box<TreeModel>('trees').get(localId)?.serverId;
      case 'Pipeline':
        return Hive.box<PipelineModel>('pipelines').get(localId)?.serverId;
      case 'Valve':
        return Hive.box<ValveModel>('valves').get(localId)?.serverId;
      case 'Pump':
        return Hive.box<PumpModel>('pumps').get(localId)?.serverId;
      case 'Tank':
        return Hive.box<TankModel>('tanks').get(localId)?.serverId;
      case 'Infrastructure':
        return Hive.box<InfrastructureModel>('infrastructures').get(localId)?.serverId;
      default:
        return null;
    }
  }

  /// Update the locally stored Hive entity with server-calculated properties.
  Future<void> _updateLocalModel(
    String entityType,
    String localId,
    int serverId,
    Map<String, dynamic> serverData,
    String? photoUrl,
  ) async {
    switch (entityType) {
      case 'Farm':
        final box = Hive.box<FarmModel>('farms');
        final current = box.get(localId);
        if (current != null) {
          final double? area = serverData['areaHectares'] != null 
              ? (serverData['areaHectares'] as num).toDouble() 
              : null;
          await box.put(localId, current.copyWith(
            serverId: serverId,
            areaHectares: area,
          ));
        }
        break;
      case 'Tree':
        final box = Hive.box<TreeModel>('trees');
        final current = box.get(localId);
        if (current != null) {
          await box.put(localId, current.copyWith(
            serverId: serverId,
            photoUrl: photoUrl ?? current.photoUrl,
          ));
        }
        break;
      case 'Pipeline':
        final box = Hive.box<PipelineModel>('pipelines');
        final current = box.get(localId);
        if (current != null) {
          final double? length = serverData['lengthMeters'] != null 
              ? (serverData['lengthMeters'] as num).toDouble() 
              : null;
          await box.put(localId, current.copyWith(
            serverId: serverId,
            lengthMeters: length,
          ));
        }
        break;
      case 'Valve':
        final box = Hive.box<ValveModel>('valves');
        final current = box.get(localId);
        if (current != null) {
          await box.put(localId, current.copyWith(
            serverId: serverId,
            photoUrl: photoUrl ?? current.photoUrl,
          ));
        }
        break;
      case 'Pump':
        final box = Hive.box<PumpModel>('pumps');
        final current = box.get(localId);
        if (current != null) {
          await box.put(localId, current.copyWith(
            serverId: serverId,
            photoUrl: photoUrl ?? current.photoUrl,
          ));
        }
        break;
      case 'Tank':
        final box = Hive.box<TankModel>('tanks');
        final current = box.get(localId);
        if (current != null) {
          await box.put(localId, current.copyWith(
            serverId: serverId,
            photoUrl: photoUrl ?? current.photoUrl,
          ));
        }
        break;
      case 'Infrastructure':
        final box = Hive.box<InfrastructureModel>('infrastructures');
        final current = box.get(localId);
        if (current != null) {
          await box.put(localId, current.copyWith(
            serverId: serverId,
            photoUrl: photoUrl ?? current.photoUrl,
          ));
        }
        break;
    }
  }

  /// Reset/Clear local DB caches.
  Future<void> clearAllBoxes() async {
    await Hive.box<FarmModel>('farms').clear();
    await Hive.box<TreeModel>('trees').clear();
    await Hive.box<PipelineModel>('pipelines').clear();
    await Hive.box<ValveModel>('valves').clear();
    await Hive.box<PumpModel>('pumps').clear();
    await Hive.box<TankModel>('tanks').clear();
    await Hive.box<InfrastructureModel>('infrastructures').clear();
    await Hive.box<SyncItemModel>('sync_queue').clear();
  }
}
