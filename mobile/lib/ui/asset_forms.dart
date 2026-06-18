import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/farm_model.dart';
import '../data/models/tree_model.dart';
import '../data/models/pipeline_model.dart';
import '../data/models/valve_model.dart';
import '../data/models/pump_model.dart';
import '../data/models/tank_model.dart';
import '../data/models/infrastructure_model.dart';
import '../data/models/sync_item_model.dart';
import '../services/camera_service.dart';
import '../bloc/sync_bloc.dart';
import 'package:hive/hive.dart';

class AssetForms {
  static String _generateId() {
    return DateTime.now().microsecondsSinceEpoch.toString();
  }

  static Future<void> showFarmDialog(
    BuildContext context,
    List<List<double>> boundary,
    VoidCallback onSuccess,
  ) async {
    final nameController = TextEditingController();
    final ownerController = TextEditingController();
    final descController = TextEditingController();
    String status = 'ACTIVE';

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Map New Farm', style: TextStyle(color: Colors.white)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Farm Name',
                  labelStyle: TextStyle(color: Color(0xFF64748B)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: const Color(0xFF10B981))),
                ),
              ),
              TextField(
                controller: ownerController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Owner Name',
                  labelStyle: TextStyle(color: Color(0xFF64748B)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: const Color(0xFF10B981))),
                ),
              ),
              TextField(
                controller: descController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Description',
                  labelStyle: TextStyle(color: Color(0xFF64748B)),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: const Color(0xFF10B981))),
                ),
              ),
              DropdownButtonFormField<String>(
                value: status,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Status',
                  labelStyle: TextStyle(color: Color(0xFF64748B)),
                ),
                items: ['ACTIVE', 'INACTIVE', 'MAINTENANCE']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) status = val;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            onPressed: () async {
              if (nameController.text.isEmpty || ownerController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Farm Name and Owner Name are required.')),
                );
                return;
              }

              final localId = _generateId();
              final farm = FarmModel(
                id: localId,
                name: nameController.text,
                ownerName: ownerController.text,
                description: descController.text,
                status: status,
                boundary: boundary,
              );

              // 1. Save to local box
              await Hive.box<FarmModel>('farms').put(localId, farm);

              // 2. Queue for upload
              final syncItem = SyncItemModel(
                id: _generateId(),
                action: 'CREATE',
                entityType: 'Farm',
                localId: localId,
                payload: farm.toJson(),
                status: 'PENDING',
                createdAt: DateTime.now(),
              );
              await Hive.box<SyncItemModel>('sync_queue').put(syncItem.id, syncItem);

              context.read<SyncBloc>().add(SyncLoadQueueEvent());
              Navigator.pop(ctx);
              onSuccess();
            },
            child: const Text('Save Farm'),
          ),
        ],
      ),
    );
  }

  static Future<void> showTreeDialog(
    BuildContext context,
    List<double> location,
    String farmId,
    VoidCallback onSuccess,
  ) async {
    final numberController = TextEditingController();
    final speciesController = TextEditingController(text: 'Moringa oleifera');
    final ageController = TextEditingController();
    final notesController = TextEditingController();
    String healthStatus = 'HEALTHY';
    String? localPhotoPath;

    final cameraService = CameraService();

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Map Tree', style: TextStyle(color: Colors.white)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: numberController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Tree Tag Number',
                    labelStyle: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
                TextField(
                  controller: speciesController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Species',
                    labelStyle: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
                TextField(
                  controller: ageController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Age (months)',
                    labelStyle: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
                DropdownButtonFormField<String>(
                  value: healthStatus,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Health Status'),
                  items: ['HEALTHY', 'STRESSED', 'DISEASED', 'DEAD']
                      .map((h) => DropdownMenuItem(value: h, child: Text(h)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) healthStatus = val;
                  },
                ),
                TextField(
                  controller: notesController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Notes'),
                ),
                const SizedBox(height: 15),
                localPhotoPath != null
                    ? Image.file(File(localPhotoPath!), height: 100)
                    : const Text('No Photo Captured', style: TextStyle(color: Colors.grey)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
                  onPressed: () async {
                    final path = await cameraService.capturePhoto();
                    if (path != null) {
                      setState(() {
                        localPhotoPath = path;
                      });
                    }
                  },
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Capture Photo'),
                )
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              onPressed: () async {
                if (numberController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Tree number is required')),
                  );
                  return;
                }

                final localId = _generateId();
                final tree = TreeModel(
                  id: localId,
                  farmId: farmId,
                  treeNumber: numberController.text,
                  species: speciesController.text,
                  age: int.tryParse(ageController.text),
                  healthStatus: healthStatus,
                  location: location,
                  localPhotoPath: localPhotoPath,
                  notes: notesController.text,
                );

                await Hive.box<TreeModel>('trees').put(localId, tree);

                final syncItem = SyncItemModel(
                  id: _generateId(),
                  action: 'CREATE',
                  entityType: 'Tree',
                  localId: localId,
                  payload: tree.toJson(0), // Temp serverId 0, resolved in sync
                  localPhotoPath: localPhotoPath,
                  status: 'PENDING',
                  createdAt: DateTime.now(),
                );
                await Hive.box<SyncItemModel>('sync_queue').put(syncItem.id, syncItem);

                context.read<SyncBloc>().add(SyncLoadQueueEvent());
                Navigator.pop(ctx);
                onSuccess();
              },
              child: const Text('Save Tree'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showPipelineDialog(
    BuildContext context,
    List<List<double>> geometry,
    String farmId,
    VoidCallback onSuccess,
  ) async {
    final nameController = TextEditingController();
    final diameterController = TextEditingController();
    final materialController = TextEditingController(text: 'PVC');
    String status = 'ACTIVE';

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Map Pipeline Routing', style: TextStyle(color: Colors.white)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Pipeline Identifier'),
              ),
              TextField(
                controller: diameterController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Diameter (mm)'),
              ),
              TextField(
                controller: materialController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Material'),
              ),
              DropdownButtonFormField<String>(
                value: status,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Operating Status'),
                items: ['ACTIVE', 'LEAKING', 'CLOGGED', 'UNDER_MAINTENANCE']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) status = val;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            onPressed: () async {
              if (nameController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Pipeline identifier is required')),
                );
                return;
              }

              final localId = _generateId();
              final pipeline = PipelineModel(
                id: localId,
                farmId: farmId,
                name: nameController.text,
                diameter: double.tryParse(diameterController.text),
                material: materialController.text,
                status: status,
                geometry: geometry,
              );

              await Hive.box<PipelineModel>('pipelines').put(localId, pipeline);

              final syncItem = SyncItemModel(
                id: _generateId(),
                action: 'CREATE',
                entityType: 'Pipeline',
                localId: localId,
                payload: pipeline.toJson(0),
                status: 'PENDING',
                createdAt: DateTime.now(),
              );
              await Hive.box<SyncItemModel>('sync_queue').put(syncItem.id, syncItem);

              context.read<SyncBloc>().add(SyncLoadQueueEvent());
              Navigator.pop(ctx);
              onSuccess();
            },
            child: const Text('Save Pipeline'),
          )
        ],
      ),
    );
  }

  static Future<void> showPointAssetDialog(
    BuildContext context,
    String type, // 'Valve', 'Pump', 'Tank'
    List<double> geometry,
    String farmId,
    VoidCallback onSuccess,
  ) async {
    final nameController = TextEditingController();
    final detailController1 = TextEditingController(); // Type for Valve, HP for Pump, Material for Tank
    final detailController2 = TextEditingController(); // Zone for Valve, Capacity for Pump/Tank
    final detailController3 = TextEditingController(); // Height for Tank
    String status = 'ACTIVE';
    String? localPhotoPath;
    final cameraService = CameraService();

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: Text('Map $type Pin', style: const TextStyle(color: Colors.white)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(labelText: '$type Identifier / Name'),
                ),
                if (type == 'Valve') ...[
                  TextField(
                    controller: detailController1,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Valve Type (e.g. SOLENOID, GATE)'),
                  ),
                  TextField(
                    controller: detailController2,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Irrigation Zone Name'),
                  ),
                ] else if (type == 'Pump') ...[
                  TextField(
                    controller: detailController1,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Power Rating (HP)'),
                  ),
                  TextField(
                    controller: detailController2,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Flow Capacity (L/hr)'),
                  ),
                ] else if (type == 'Tank') ...[
                  TextField(
                    controller: detailController1,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Tank Material (e.g. PLASTIC, STEEL)'),
                  ),
                  TextField(
                    controller: detailController2,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Storage Capacity (Liters)'),
                  ),
                  TextField(
                    controller: detailController3,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Height (meters)'),
                  ),
                ],
                DropdownButtonFormField<String>(
                  value: status,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Operational Status'),
                  items: ['ACTIVE', 'OFFLINE', 'FAULTY', 'MAINTENANCE']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) status = val;
                  },
                ),
                const SizedBox(height: 15),
                localPhotoPath != null
                    ? Image.file(File(localPhotoPath!), height: 100)
                    : const Text('No Photo Captured', style: TextStyle(color: Colors.grey)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
                  onPressed: () async {
                    final path = await cameraService.capturePhoto();
                    if (path != null) {
                      setState(() {
                        localPhotoPath = path;
                      });
                    }
                  },
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Capture Photo'),
                )
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              onPressed: () async {
                if (nameController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('$type identifier is required')),
                  );
                  return;
                }

                final localId = _generateId();
                if (type == 'Valve') {
                  final valve = ValveModel(
                    id: localId,
                    farmId: farmId,
                    valveNumber: nameController.text,
                    type: detailController1.text,
                    zone: detailController2.text,
                    status: status,
                    geometry: geometry,
                    localPhotoPath: localPhotoPath,
                  );
                  await Hive.box<ValveModel>('valves').put(localId, valve);
                  await Hive.box<SyncItemModel>('sync_queue').put(
                    _generateId(),
                    SyncItemModel(
                      id: _generateId(),
                      action: 'CREATE',
                      entityType: 'Valve',
                      localId: localId,
                      payload: valve.toJson(0),
                      localPhotoPath: localPhotoPath,
                      status: 'PENDING',
                      createdAt: DateTime.now(),
                    ),
                  );
                } else if (type == 'Pump') {
                  final pump = PumpModel(
                    id: localId,
                    farmId: farmId,
                    name: nameController.text,
                    powerRating: double.tryParse(detailController1.text),
                    capacity: double.tryParse(detailController2.text),
                    status: status,
                    geometry: geometry,
                    localPhotoPath: localPhotoPath,
                  );
                  await Hive.box<PumpModel>('pumps').put(localId, pump);
                  await Hive.box<SyncItemModel>('sync_queue').put(
                    _generateId(),
                    SyncItemModel(
                      id: _generateId(),
                      action: 'CREATE',
                      entityType: 'Pump',
                      localId: localId,
                      payload: pump.toJson(0),
                      localPhotoPath: localPhotoPath,
                      status: 'PENDING',
                      createdAt: DateTime.now(),
                    ),
                  );
                } else if (type == 'Tank') {
                  final tank = TankModel(
                    id: localId,
                    farmId: farmId,
                    name: nameController.text,
                    material: detailController1.text,
                    capacity: double.tryParse(detailController2.text),
                    height: double.tryParse(detailController3.text),
                    status: status,
                    geometry: geometry,
                    localPhotoPath: localPhotoPath,
                  );
                  await Hive.box<TankModel>('tanks').put(localId, tank);
                  await Hive.box<SyncItemModel>('sync_queue').put(
                    _generateId(),
                    SyncItemModel(
                      id: _generateId(),
                      action: 'CREATE',
                      entityType: 'Tank',
                      localId: localId,
                      payload: tank.toJson(0),
                      localPhotoPath: localPhotoPath,
                      status: 'PENDING',
                      createdAt: DateTime.now(),
                    ),
                  );
                }

                context.read<SyncBloc>().add(SyncLoadQueueEvent());
                Navigator.pop(ctx);
                onSuccess();
              },
              child: const Text('Save Asset'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showInfrastructureDialog(
    BuildContext context,
    String geometryType,
    List<dynamic> coordinates,
    String farmId,
    VoidCallback onSuccess,
  ) async {
    final nameController = TextEditingController();
    String type = 'BUILDING';
    String status = 'ACTIVE';

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Map Infrastructure Asset', style: TextStyle(color: Colors.white)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Infrastructure Name'),
              ),
              DropdownButtonFormField<String>(
                value: type,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Infrastructure Type'),
                items: ['BUILDING', 'ROAD', 'STORAGE', 'FENCE', 'PANEL', 'SOURCE']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) type = val;
                },
              ),
              DropdownButtonFormField<String>(
                value: status,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Operating Status'),
                items: ['ACTIVE', 'UNDER_CONSTRUCTION', 'CLOSED']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) status = val;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.redAccent)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            onPressed: () async {
              if (nameController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Infrastructure name is required')),
                );
                return;
              }

              final localId = _generateId();
              final infra = InfrastructureModel(
                id: localId,
                farmId: farmId,
                name: nameController.text,
                type: type,
                status: status,
                geometryType: geometryType,
                coordinates: coordinates,
              );

              await Hive.box<InfrastructureModel>('infrastructures').put(localId, infra);

              final syncItem = SyncItemModel(
                id: _generateId(),
                action: 'CREATE',
                entityType: 'Infrastructure',
                localId: localId,
                payload: infra.toJson(0),
                status: 'PENDING',
                createdAt: DateTime.now(),
              );
              await Hive.box<SyncItemModel>('sync_queue').put(syncItem.id, syncItem);

              context.read<SyncBloc>().add(SyncLoadQueueEvent());
              Navigator.pop(ctx);
              onSuccess();
            },
            child: const Text('Save Infrastructure'),
          )
        ],
      ),
    );
  }
}
