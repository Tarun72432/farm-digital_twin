import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../bloc/mapping_bloc.dart';
import '../services/gps_service.dart';
import '../data/models/farm_model.dart';
import '../data/models/tree_model.dart';
import '../data/models/pipeline_model.dart';
import '../data/models/valve_model.dart';
import '../data/models/pump_model.dart';
import '../data/models/tank_model.dart';
import '../data/models/infrastructure_model.dart';
import '../data/models/sync_item_model.dart';
import '../bloc/sync_bloc.dart';
import 'asset_forms.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  final GpsService _gpsService = GpsService();
  LatLng _initialLocation = const LatLng(11.5034, 78.2345); // Mock Moringa Farm Plantation coordinate
  String? _selectedDrawingMode; // 'Farm', 'Pipeline', 'Tree', 'Valve', 'Pump', 'Tank', 'Infrastructure'
  String? _selectedInfraGeom; // 'Point', 'LineString', 'Polygon'
  bool _quickAutoSave = true; // Default to true for fast walk-and-pin mapping without dialogs

  @override
  void initState() {
    super.initState();
    _focusOnCurrentLocation();
  }

  Future<void> _focusOnCurrentLocation() async {
    try {
      final pos = await _gpsService.getCurrentPosition();
      final latLng = LatLng(pos.latitude, pos.longitude);
      _mapController.move(latLng, 16);
      setState(() {
        _initialLocation = latLng;
      });
    } catch (_) {}
  }

  void _showMarkerInfo(BuildContext context, String title, String snippet) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                snippet,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'Dismiss',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final mappingBloc = context.read<MappingBloc>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('GIS Asset Mapping', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: Color(0xFF10B981)),
            onPressed: _focusOnCurrentLocation,
          )
        ],
      ),
      body: BlocBuilder<MappingBloc, MappingState>(
        builder: (context, mapState) {
          return Stack(
            children: [
              // Free Leaflet Map
              _buildMap(mapState),

              // Drawing Status / GPS walking indicator banner
              if (mapState.isTracking)
                Positioned(
                  top: 16,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10)],
                    ),
                    child: Row(
                      children: [
                        const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'GPS Tracking Active: Walk boundary to log points (${mapState.trackedPoints.length} points logged)',
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.stop, color: Colors.white, size: 24),
                          onPressed: () {
                            mappingBloc.add(MapStopTrackingEvent());
                            _saveTrackedAsset(mapState);
                          },
                        )
                      ],
                    ),
                  ),
                ),

              // Mode selectors & Farm dropdown selection panel
              Positioned(
                bottom: 24,
                left: 16,
                right: 16,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Active Farm selector dropdown (required for child assets)
                    _buildActiveFarmSelector(mapState),
                    const SizedBox(height: 12),
                    // Action controls panel
                    _buildControlsPanel(mapState),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMap(MappingState mapState) {
    return ValueListenableBuilder(
      valueListenable: Hive.box<FarmModel>('farms').listenable(),
      builder: (context, Box<FarmModel> farmBox, _) {
        return ValueListenableBuilder(
          valueListenable: Hive.box<TreeModel>('trees').listenable(),
          builder: (context, Box<TreeModel> treeBox, _) {
            return ValueListenableBuilder(
              valueListenable: Hive.box<PipelineModel>('pipelines').listenable(),
              builder: (context, Box<PipelineModel> pipeBox, _) {
                return ValueListenableBuilder(
                  valueListenable: Hive.box<ValveModel>('valves').listenable(),
                  builder: (context, Box<ValveModel> valveBox, _) {
                    return ValueListenableBuilder(
                      valueListenable: Hive.box<PumpModel>('pumps').listenable(),
                      builder: (context, Box<PumpModel> pumpBox, _) {
                        return ValueListenableBuilder(
                          valueListenable: Hive.box<TankModel>('tanks').listenable(),
                          builder: (context, Box<TankModel> tankBox, _) {
                            return ValueListenableBuilder(
                              valueListenable: Hive.box<InfrastructureModel>('infrastructures').listenable(),
                              builder: (context, Box<InfrastructureModel> infraBox, _) {
                                // Accumulate all markers, polygons, polylines
                                final List<Polygon> polygons = [];
                                final List<Polyline> polylines = [];
                                final List<Marker> markers = [];

                                // 1. Draw existing Farms
                                for (var farm in farmBox.values) {
                                  if (farm.boundary.isNotEmpty) {
                                    polygons.add(Polygon(
                                      points: farm.boundary.map((p) => LatLng(p[1], p[0])).toList(),
                                      color: const Color(0xFF10B981).withOpacity(0.15),
                                      borderColor: const Color(0xFF10B981),
                                      borderStrokeWidth: 2,
                                      isFilled: true,
                                    ));
                                  }
                                }

                                // 2. Draw existing Pipelines
                                for (var pipe in pipeBox.values) {
                                  if (pipe.geometry.isNotEmpty) {
                                    polylines.add(Polyline(
                                      points: pipe.geometry.map((p) => LatLng(p[1], p[0])).toList(),
                                      color: Colors.lightBlue,
                                      strokeWidth: 4,
                                    ));
                                  }
                                }

                                // 3. Draw active tracing polyline/polygon in progress
                                if (mapState.trackedPoints.isNotEmpty) {
                                  final traceLatLngs = mapState.trackedPoints
                                      .map((p) => LatLng(p[1], p[0]))
                                      .toList();

                                  if (mapState.geometryType == 'Polygon') {
                                    polygons.add(Polygon(
                                      points: traceLatLngs,
                                      color: Colors.amber.withOpacity(0.25),
                                      borderColor: Colors.amber,
                                      borderStrokeWidth: 3,
                                      isFilled: true,
                                    ));
                                  } else if (mapState.geometryType == 'LineString') {
                                    polylines.add(Polyline(
                                      points: traceLatLngs,
                                      color: Colors.amber,
                                      strokeWidth: 4,
                                    ));
                                  }
                                }

                                // 4. Draw existing trees
                                for (var tree in treeBox.values) {
                                  markers.add(Marker(
                                    point: LatLng(tree.location[1], tree.location[0]),
                                    width: 40,
                                    height: 40,
                                    child: GestureDetector(
                                      onTap: () => _showMarkerInfo(
                                        context,
                                        'Tree ${tree.treeNumber}',
                                        '${tree.species} • ${tree.healthStatus}',
                                      ),
                                      child: const Icon(
                                        Icons.forest,
                                        color: Color(0xFF10B981),
                                        size: 24,
                                      ),
                                    ),
                                  ));
                                }

                                // 5. Draw point assets (Valves, Pumps, Tanks)
                                for (var valve in valveBox.values) {
                                  markers.add(Marker(
                                    point: LatLng(valve.geometry[1], valve.geometry[0]),
                                    width: 40,
                                    height: 40,
                                    child: GestureDetector(
                                      onTap: () => _showMarkerInfo(
                                        context,
                                        'Valve ${valve.valveNumber}',
                                        'Zone: ${valve.zone} • Status: ${valve.status}',
                                      ),
                                      child: const Icon(
                                        Icons.adjust,
                                        color: Colors.amber,
                                        size: 24,
                                      ),
                                    ),
                                  ));
                                }

                                for (var pump in pumpBox.values) {
                                  markers.add(Marker(
                                    point: LatLng(pump.geometry[1], pump.geometry[0]),
                                    width: 40,
                                    height: 40,
                                    child: GestureDetector(
                                      onTap: () => _showMarkerInfo(
                                        context,
                                        pump.name,
                                        'Pump • Capacity: ${pump.capacity} L/h • Status: ${pump.status}',
                                      ),
                                      child: const Icon(
                                        Icons.flash_on,
                                        color: Colors.deepPurpleAccent,
                                        size: 24,
                                      ),
                                    ),
                                  ));
                                }

                                for (var tank in tankBox.values) {
                                  markers.add(Marker(
                                    point: LatLng(tank.geometry[1], tank.geometry[0]),
                                    width: 40,
                                    height: 40,
                                    child: GestureDetector(
                                      onTap: () => _showMarkerInfo(
                                        context,
                                        tank.name,
                                        'Tank • Capacity: ${tank.capacity} L • Status: ${tank.status}',
                                      ),
                                      child: const Icon(
                                        Icons.opacity,
                                        color: Colors.blue,
                                        size: 24,
                                      ),
                                    ),
                                  ));
                                }

                                // 6. Draw existing Infrastructures
                                for (var infra in infraBox.values) {
                                  if (infra.geometryType == 'Point') {
                                    markers.add(Marker(
                                      point: LatLng(infra.coordinates[1], infra.coordinates[0]),
                                      width: 40,
                                      height: 40,
                                      child: GestureDetector(
                                        onTap: () => _showMarkerInfo(
                                          context,
                                          infra.name,
                                          '${infra.type} • Status: ${infra.status}',
                                        ),
                                        child: const Icon(
                                          Icons.business,
                                          color: Colors.orange,
                                          size: 24,
                                        ),
                                      ),
                                    ));
                                  } else if (infra.geometryType == 'LineString') {
                                    final coords = infra.coordinates.cast<List<double>>();
                                    polylines.add(Polyline(
                                      points: coords.map((c) => LatLng(c[1], c[0])).toList(),
                                      color: Colors.orange,
                                      strokeWidth: 4,
                                    ));
                                  } else if (infra.geometryType == 'Polygon') {
                                    final coords = infra.coordinates.cast<List<double>>();
                                    polygons.add(Polygon(
                                      points: coords.map((c) => LatLng(c[1], c[0])).toList(),
                                      color: Colors.orange.withOpacity(0.15),
                                      borderColor: Colors.orange,
                                      borderStrokeWidth: 2,
                                      isFilled: true,
                                    ));
                                  }
                                }

                                return FlutterMap(
                                  mapController: _mapController,
                                  options: MapOptions(
                                    initialCenter: _initialLocation,
                                    initialZoom: 16,
                                    onTap: (tapPosition, latLng) => _handleMapTap(latLng, mapState),
                                  ),
                                  children: [
                                    TileLayer(
                                      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                                      userAgentPackageName: 'com.company.farmdigitaltwin',
                                    ),
                                    TileLayer(
                                      urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                                      userAgentPackageName: 'com.company.farmdigitaltwin',
                                    ),
                                    PolygonLayer(polygons: polygons),
                                    PolylineLayer(polylines: polylines),
                                    MarkerLayer(markers: markers),
                                  ],
                                );
                              },
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildActiveFarmSelector(MappingState mapState) {
    return ValueListenableBuilder(
      valueListenable: Hive.box<FarmModel>('farms').listenable(),
      builder: (context, Box<FarmModel> farmBox, _) {
        final List<FarmModel> farms = farmBox.values.toList();
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              hint: const Text('Select Active Farm Context', style: TextStyle(color: Colors.white70)),
              value: mapState.activeFarmId,
              dropdownColor: const Color(0xFF1E293B),
              style: const TextStyle(color: Colors.white),
              isExpanded: true,
              items: farms.map((f) {
                return DropdownMenuItem<String>(
                  value: f.id,
                  child: Text(f.name),
                );
              }).toList(),
              onChanged: (farmId) {
                if (farmId != null) {
                  context.read<MappingBloc>().add(MapSelectFarmEvent(farmId: farmId));
                }
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildControlsPanel(MappingState mapState) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Select Drawing Mode',
            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8.0,
            runSpacing: 8.0,
            children: [
              _buildModeChip('Farm Boundary (Polygon)', 'Farm', Icons.landscape),
              _buildModeChip('Pipeline Path (LineString)', 'Pipeline', Icons.linear_scale),
              _buildModeChip('Moringa Tree (Point)', 'Tree', Icons.forest),
              _buildModeChip('Valve (Point)', 'Valve', Icons.adjust),
              _buildModeChip('Pump (Point)', 'Pump', Icons.flash_on),
              _buildModeChip('Tank (Point)', 'Tank', Icons.opacity),
              _buildModeChip('Infrastructure', 'Infrastructure', Icons.business),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0),
            child: Divider(color: Colors.white12),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pin Asset at Current GPS Location',
                style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Quick Auto-Save',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  const SizedBox(width: 4),
                  Switch(
                    value: _quickAutoSave,
                    activeColor: const Color(0xFF10B981),
                    onChanged: (val) {
                      setState(() {
                        _quickAutoSave = val;
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildQuickGpsPinButton('Tree', Icons.forest, const Color(0xFF10B981), mapState),
                const SizedBox(width: 8),
                _buildQuickGpsPinButton('Valve', Icons.adjust, Colors.amber, mapState),
                const SizedBox(width: 8),
                _buildQuickGpsPinButton('Pump', Icons.flash_on, Colors.deepPurpleAccent, mapState),
                const SizedBox(width: 8),
                _buildQuickGpsPinButton('Tank', Icons.opacity, Colors.blue, mapState),
                const SizedBox(width: 8),
                _buildQuickGpsPinButton('Infrastructure', Icons.business, Colors.orange, mapState),
              ],
            ),
          ),
          if (_selectedDrawingMode != null) ...[
            const SizedBox(height: 12),
            if (_selectedDrawingMode == 'Infrastructure') ...[
              const Text('Select Geometry Type:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('Point'),
                    selected: _selectedInfraGeom == 'Point',
                    onSelected: (val) => setState(() => _selectedInfraGeom = val ? 'Point' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('LineString'),
                    selected: _selectedInfraGeom == 'LineString',
                    onSelected: (val) => setState(() => _selectedInfraGeom = val ? 'LineString' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Polygon'),
                    selected: _selectedInfraGeom == 'Polygon',
                    onSelected: (val) => setState(() => _selectedInfraGeom = val ? 'Polygon' : null),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // Drawing Action tools depending on type
            Row(
              children: [
                if (_drawingModeIsSpatialTrace()) ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                      onPressed: mapState.isTracking
                          ? null
                          : () {
                              context.read<MappingBloc>().add(
                                MapStartTrackingEvent(
                                  geometryType: _selectedDrawingMode == 'Farm' || _selectedInfraGeom == 'Polygon'
                                      ? 'Polygon'
                                      : 'LineString',
                                ),
                              );
                            },
                      icon: const Icon(Icons.directions_walk, color: Colors.white),
                      label: const Text('Start Walk (GPS)', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (mapState.trackedPoints.isNotEmpty)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.amber),
                      onPressed: () {
                        context.read<MappingBloc>().add(MapStopTrackingEvent());
                        _saveTrackedAsset(mapState);
                      },
                      child: const Text('Save Draw', style: TextStyle(color: Colors.black)),
                    ),
                ] else ...[
                  const Expanded(
                    child: Text(
                      'Tap on map to pin coordinates & fill asset details.',
                      style: TextStyle(color: Colors.amber, fontSize: 12),
                    ),
                  )
                ],
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear, color: Colors.redAccent),
                  onPressed: () {
                    context.read<MappingBloc>().add(MapClearTrackingEvent());
                    setState(() {
                      _selectedDrawingMode = null;
                      _selectedInfraGeom = null;
                    });
                  },
                )
              ],
            )
          ]
        ],
      ),
    );
  }

  Widget _buildModeChip(String label, String mode, IconData icon) {
    final isSelected = _selectedDrawingMode == mode;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        avatar: Icon(icon, size: 16, color: isSelected ? Colors.black : const Color(0xFF10B981)),
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          context.read<MappingBloc>().add(MapClearTrackingEvent());
          setState(() {
            _selectedDrawingMode = selected ? mode : null;
            _selectedInfraGeom = null;
          });
        },
      ),
    );
  }

  bool _drawingModeIsSpatialTrace() {
    if (_selectedDrawingMode == 'Farm' || _selectedDrawingMode == 'Pipeline') return true;
    if (_selectedDrawingMode == 'Infrastructure' &&
        (_selectedInfraGeom == 'LineString' || _selectedInfraGeom == 'Polygon')) return true;
    return false;
  }

  void _handleMapTap(LatLng latLng, MappingState mapState) {
    if (_selectedDrawingMode == null) return;

    if (_drawingModeIsSpatialTrace()) {
      // Tap to draw manual coordinates
      context.read<MappingBloc>().add(MapAddPointEvent(
        latitude: latLng.latitude,
        longitude: latLng.longitude,
      ));
    } else {
      // Point drops: Tree, Valve, Pump, Tank, Point Infrastructure
      if (mapState.activeFarmId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an active farm context first.')),
        );
        return;
      }
      _savePointAsset(latLng, mapState.activeFarmId!);
    }
  }

  void _savePointAsset(LatLng latLng, String farmId) {
    if (_quickAutoSave) {
      _autoSavePointAsset(latLng, _selectedDrawingMode!, farmId);
      return;
    }

    final location = [latLng.longitude, latLng.latitude];
    final onSuccess = () {
      setState(() {
        _selectedDrawingMode = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Asset pinned successfully!')),
      );
    };

    switch (_selectedDrawingMode) {
      case 'Tree':
        AssetForms.showTreeDialog(context, location, farmId, onSuccess);
        break;
      case 'Valve':
      case 'Pump':
      case 'Tank':
        AssetForms.showPointAssetDialog(context, _selectedDrawingMode!, location, farmId, onSuccess);
        break;
      case 'Infrastructure':
        if (_selectedInfraGeom == 'Point') {
          AssetForms.showInfrastructureDialog(context, 'Point', location, farmId, onSuccess);
        }
        break;
    }
  }

  void _saveTrackedAsset(MappingState mapState) {
    if (mapState.trackedPoints.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draw at least 2 points to save.')),
      );
      return;
    }

    final onSuccess = () {
      context.read<MappingBloc>().add(MapClearTrackingEvent());
      setState(() {
        _selectedDrawingMode = null;
        _selectedInfraGeom = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Spatial asset saved successfully!')),
      );
    };

    if (_selectedDrawingMode == 'Farm') {
      AssetForms.showFarmDialog(context, mapState.trackedPoints, onSuccess);
    } else if (_selectedDrawingMode == 'Pipeline') {
      if (mapState.activeFarmId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an active farm context first.')),
        );
        return;
      }
      AssetForms.showPipelineDialog(context, mapState.trackedPoints, mapState.activeFarmId!, onSuccess);
    } else if (_selectedDrawingMode == 'Infrastructure') {
      if (mapState.activeFarmId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an active farm context first.')),
        );
        return;
      }
      AssetForms.showInfrastructureDialog(
        context,
        _selectedInfraGeom!,
        mapState.trackedPoints,
        mapState.activeFarmId!,
        onSuccess,
      );
    }
  }

  Widget _buildQuickGpsPinButton(String label, IconData icon, Color color, MappingState mapState) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: color.withOpacity(0.4)),
        ),
      ),
      onPressed: () => _captureAssetAtCurrentLocation(label, mapState),
      icon: Icon(icon, size: 16, color: color),
      label: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }

  Future<void> _captureAssetAtCurrentLocation(String type, MappingState mapState) async {
    if (mapState.activeFarmId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an active farm context first.')),
      );
      return;
    }

    try {
      // Show loading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
              ),
              SizedBox(width: 12),
              Text('Acquiring precise GPS location...'),
            ],
          ),
          duration: Duration(seconds: 2),
        ),
      );

      final position = await _gpsService.getCurrentPosition();
      final latLng = LatLng(position.latitude, position.longitude);
      
      // Move map to the current captured position
      _mapController.move(latLng, 18);

      // Trigger the asset forms dialog
      setState(() {
        _selectedDrawingMode = type;
        if (type == 'Infrastructure') {
          _selectedInfraGeom = 'Point'; // Default to point infrastructure for current location pin
        }
      });
      if (!mounted) return;
      _savePointAsset(latLng, mapState.activeFarmId!);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('GPS Error: ${e.toString()}'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _autoSavePointAsset(LatLng latLng, String type, String farmId) async {
    final localId = DateTime.now().microsecondsSinceEpoch.toString();
    dynamic model;
    Map<String, dynamic> payload = {};

    switch (type) {
      case 'Tree':
        final box = Hive.box<TreeModel>('trees');
        final count = box.length;
        model = TreeModel(
          id: localId,
          farmId: farmId,
          treeNumber: 'T-${count + 1}',
          species: 'Moringa oleifera',
          age: 0,
          healthStatus: 'HEALTHY',
          notes: 'Quick mapped via GPS',
          location: [latLng.longitude, latLng.latitude],
        );
        await box.put(localId, model);
        payload = model.toJson();
        break;
      case 'Valve':
        final box = Hive.box<ValveModel>('valves');
        final count = box.length;
        model = ValveModel(
          id: localId,
          farmId: farmId,
          valveNumber: 'V-${count + 1}',
          type: 'BALL',
          zone: 'Zone A',
          status: 'OPERATIONAL',
          geometry: [latLng.longitude, latLng.latitude],
        );
        await box.put(localId, model);
        payload = model.toJson();
        break;
      case 'Pump':
        final box = Hive.box<PumpModel>('pumps');
        final count = box.length;
        model = PumpModel(
          id: localId,
          farmId: farmId,
          name: 'Pump #${count + 1}',
          capacity: 5000.0,
          powerRating: 2.0,
          status: 'OPERATIONAL',
          geometry: [latLng.longitude, latLng.latitude],
        );
        await box.put(localId, model);
        payload = model.toJson();
        break;
      case 'Tank':
        final box = Hive.box<TankModel>('tanks');
        final count = box.length;
        model = TankModel(
          id: localId,
          farmId: farmId,
          name: 'Tank #${count + 1}',
          capacity: 10000.0,
          material: 'Plastic',
          height: 3.0,
          status: 'OPERATIONAL',
          geometry: [latLng.longitude, latLng.latitude],
        );
        await box.put(localId, model);
        payload = model.toJson();
        break;
      case 'Infrastructure':
        final box = Hive.box<InfrastructureModel>('infrastructures');
        final count = box.length;
        model = InfrastructureModel(
          id: localId,
          farmId: farmId,
          name: 'Infra #${count + 1}',
          type: 'General',
          geometryType: 'Point',
          coordinates: [latLng.longitude, latLng.latitude],
          status: 'OPERATIONAL',
        );
        await box.put(localId, model);
        payload = model.toJson();
        break;
    }

    if (model != null) {
      // Create sync item
      final syncItem = SyncItemModel(
        id: DateTime.now().microsecondsSinceEpoch.toString() + '_sync',
        action: 'CREATE',
        entityType: type,
        localId: localId,
        payload: payload,
        status: 'PENDING',
        createdAt: DateTime.now(),
      );
      await Hive.box<SyncItemModel>('sync_queue').put(syncItem.id, syncItem);

      if (mounted) {
        context.read<SyncBloc>().add(SyncLoadQueueEvent());
        setState(() {
          _selectedDrawingMode = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$type auto-saved successfully!'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }
}
