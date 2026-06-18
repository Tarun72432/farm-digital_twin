import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import '../services/gps_service.dart';

// EVENTS
abstract class MappingEvent {}
class MapStartTrackingEvent extends MappingEvent {
  final String geometryType; // 'Polygon' or 'LineString'
  MapStartTrackingEvent({required this.geometryType});
}
class MapStopTrackingEvent extends MappingEvent {}
class MapAddPointEvent extends MappingEvent {
  final double latitude;
  final double longitude;
  MapAddPointEvent({required this.latitude, required this.longitude});
}
class MapClearTrackingEvent extends MappingEvent {}
class MapSelectFarmEvent extends MappingEvent {
  final String farmId;
  MapSelectFarmEvent({required this.farmId});
}

// STATES
class MappingState {
  final bool isTracking;
  final String? geometryType;
  final List<List<double>> trackedPoints; // List of [lng, lat]
  final String? activeFarmId;

  MappingState({
    required this.isTracking,
    this.geometryType,
    required this.trackedPoints,
    this.activeFarmId,
  });

  factory MappingState.initial() {
    return MappingState(
      isTracking: false,
      geometryType: null,
      trackedPoints: [],
      activeFarmId: null,
    );
  }

  MappingState copyWith({
    bool? isTracking,
    String? geometryType,
    List<List<double>>? trackedPoints,
    String? activeFarmId,
  }) {
    return MappingState(
      isTracking: isTracking ?? this.isTracking,
      geometryType: geometryType ?? this.geometryType,
      trackedPoints: trackedPoints ?? this.trackedPoints,
      activeFarmId: activeFarmId ?? this.activeFarmId,
    );
  }
}

// BLOC
class MappingBloc extends Bloc<MappingEvent, MappingState> {
  final GpsService _gpsService = GpsService();
  StreamSubscription<Position>? _gpsSubscription;

  MappingBloc() : super(MappingState.initial()) {
    on<MapStartTrackingEvent>((event, emit) async {
      await _gpsSubscription?.cancel();
      emit(state.copyWith(
        isTracking: true,
        geometryType: event.geometryType,
        trackedPoints: [],
      ));

      // Get current position as starting point
      try {
        final pos = await _gpsService.getCurrentPosition();
        final points = List<List<double>>.from(state.trackedPoints);
        points.add([pos.longitude, pos.latitude]);
        emit(state.copyWith(trackedPoints: points));
      } catch (_) {}

      // Listen to coordinates stream from GPS
      _gpsSubscription = _gpsService.getPositionStream().listen((Position position) {
        add(MapAddPointEvent(
          latitude: position.latitude,
          longitude: position.longitude,
        ));
      });
    });

    on<MapAddPointEvent>((event, emit) {
      if (state.isTracking || state.geometryType != null) {
        final points = List<List<double>>.from(state.trackedPoints);
        // Avoid duplicate consecutive points
        if (points.isEmpty || 
            points.last[0] != event.longitude || 
            points.last[1] != event.latitude) {
          points.add([event.longitude, event.latitude]);
          emit(state.copyWith(trackedPoints: points));
        }
      }
    });

    on<MapStopTrackingEvent>((event, emit) async {
      await _gpsSubscription?.cancel();
      _gpsSubscription = null;
      emit(state.copyWith(isTracking: false));
    });

    on<MapClearTrackingEvent>((event, emit) async {
      await _gpsSubscription?.cancel();
      _gpsSubscription = null;
      emit(state.copyWith(
        isTracking: false,
        geometryType: null,
        trackedPoints: [],
      ));
    });

    on<MapSelectFarmEvent>((event, emit) {
      emit(state.copyWith(activeFarmId: event.farmId));
    });
  }

  @override
  Future<void> close() {
    _gpsSubscription?.cancel();
    return super.close();
  }
}
