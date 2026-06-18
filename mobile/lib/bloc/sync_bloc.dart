import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive/hive.dart';
import '../services/sync_service.dart';
import '../data/models/sync_item_model.dart';

// EVENTS
abstract class SyncEvent {}
class SyncLoadQueueEvent extends SyncEvent {}
class SyncTriggerEvent extends SyncEvent {}
class SyncClearQueueEvent extends SyncEvent {}

// STATES
class SyncState {
  final bool isSyncing;
  final int pendingCount;
  final List<SyncItemModel> queue;
  final String? errorMessage;

  SyncState({
    required this.isSyncing,
    required this.pendingCount,
    required this.queue,
    this.errorMessage,
  });

  factory SyncState.initial() {
    return SyncState(
      isSyncing: false,
      pendingCount: 0,
      queue: [],
    );
  }

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    List<SyncItemModel>? queue,
    String? errorMessage,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      queue: queue ?? this.queue,
      errorMessage: errorMessage,
    );
  }
}

// BLOC
class SyncBloc extends Bloc<SyncEvent, SyncState> {
  final SyncService _syncService = SyncService();

  SyncBloc() : super(SyncState.initial()) {
    on<SyncLoadQueueEvent>((event, emit) {
      final queueBox = Hive.box<SyncItemModel>('sync_queue');
      final list = queueBox.values.toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt)); // Newest first for list UI

      final pending = queueBox.values
          .where((item) => item.status == 'PENDING' || item.status == 'FAILED')
          .length;

      emit(state.copyWith(
        queue: list,
        pendingCount: pending,
      ));
    });

    on<SyncTriggerEvent>((event, emit) async {
      emit(state.copyWith(isSyncing: true, errorMessage: null));
      try {
        await _syncService.syncPendingQueue();
        
        // Reload queue after sync attempts
        final queueBox = Hive.box<SyncItemModel>('sync_queue');
        final list = queueBox.values.toList();
        list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        final pending = queueBox.values
            .where((item) => item.status == 'PENDING' || item.status == 'FAILED')
            .length;

        emit(state.copyWith(
          isSyncing: false,
          queue: list,
          pendingCount: pending,
        ));
      } catch (e) {
        emit(state.copyWith(
          isSyncing: false,
          errorMessage: e.toString(),
        ));
      }
    });

    on<SyncClearQueueEvent>((event, emit) async {
      emit(state.copyWith(isSyncing: true));
      await _syncService.clearAllBoxes();
      emit(SyncState.initial());
    });
  }
}
