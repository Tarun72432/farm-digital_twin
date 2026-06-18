import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/sync_bloc.dart';
import '../data/models/sync_item_model.dart';
import 'package:intl/intl.dart';

class SyncScreen extends StatefulWidget {
  const SyncScreen({super.key});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  @override
  void initState() {
    super.initState();
    context.read<SyncBloc>().add(SyncLoadQueueEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Synchronization Queue', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF10B981)),
            onPressed: () {
              context.read<SyncBloc>().add(SyncLoadQueueEvent());
            },
          )
        ],
      ),
      body: BlocBuilder<SyncBloc, SyncState>(
        builder: (context, state) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary card
              Container(
                padding: const EdgeInsets.all(20),
                color: const Color(0xFF1E293B),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${state.pendingCount} Pending Uploads',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sequential queue (FIFO order)',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onPressed: state.isSyncing || state.pendingCount == 0
                          ? null
                          : () {
                              context.read<SyncBloc>().add(SyncTriggerEvent());
                            },
                      icon: state.isSyncing
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                            )
                          : const Icon(Icons.cloud_upload, color: Colors.white),
                      label: Text(
                        state.isSyncing ? 'Syncing...' : 'Sync Now',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),

              if (state.errorMessage != null)
                Container(
                  color: Colors.redAccent.withOpacity(0.2),
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          state.errorMessage!,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),

              // Queue List
              Expanded(
                child: state.queue.isEmpty
                    ? const Center(
                        child: Text(
                          'No offline operations recorded.',
                          style: TextStyle(color: Color(0xFF64748B)),
                        ),
                      )
                    : ListView.builder(
                        itemCount: state.queue.length,
                        itemBuilder: (ctx, index) {
                          final item = state.queue[index];
                          return _buildQueueItem(item);
                        },
                      ),
              ),

              // Danger Zone Clear Cache button
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextButton.icon(
                  style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                  icon: const Icon(Icons.delete_sweep),
                  label: const Text('Clear Local Database Cache'),
                  onPressed: () => _confirmClearCache(context),
                ),
              )
            ],
          );
        },
      ),
    );
  }

  Widget _buildQueueItem(SyncItemModel item) {
    Color statusColor = Colors.grey;
    IconData statusIcon = Icons.hourglass_empty;

    if (item.status == 'COMPLETED') {
      statusColor = const Color(0xFF10B981);
      statusIcon = Icons.check_circle_outline;
    } else if (item.status == 'FAILED') {
      statusColor = Colors.redAccent;
      statusIcon = Icons.error_outline;
    } else if (item.status == 'SYNCING') {
      statusColor = Colors.blueAccent;
      statusIcon = Icons.sync;
    } else {
      statusColor = Colors.amber;
      statusIcon = Icons.hourglass_top;
    }

    final dateStr = DateFormat('yyyy-MM-dd HH:mm:ss').format(item.createdAt);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      item.entityType.toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    item.action,
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ],
              ),
              Row(
                children: [
                  Icon(statusIcon, color: statusColor, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    item.status,
                    style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Local ID: ${item.localId}',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontFamily: 'monospace'),
          ),
          Text(
            'Created: $dateStr',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
          ),
          if (item.localPhotoPath != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.image, size: 14, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Photo: ${item.localPhotoPath!.split('/').last}',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
                )
              ],
            )
          ],
          if (item.errorMessage != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.05),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.redAccent.withOpacity(0.15)),
              ),
              child: Text(
                'Error: ${item.errorMessage}',
                style: const TextStyle(color: Colors.redAccent, fontSize: 11),
              ),
            )
          ],
        ],
      ),
    );
  }

  void _confirmClearCache(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Reset Database Cache?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will permanently delete all offline assets and synchronization items on this device. Proceed?',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              context.read<SyncBloc>().add(SyncClearQueueEvent());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Database Cache cleared.')),
              );
            },
            child: const Text('Confirm Reset'),
          )
        ],
      ),
    );
  }
}
