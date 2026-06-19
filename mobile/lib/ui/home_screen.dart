import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/sync_bloc.dart';
import '../data/models/farm_model.dart';
import '../data/models/tree_model.dart';
import '../data/models/pipeline_model.dart';
import '../data/models/valve_model.dart';
import '../data/models/pump_model.dart';
import '../data/models/tank_model.dart';
import '../data/models/infrastructure_model.dart';
import 'map_screen.dart';
import 'sync_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load initial sync queue status
    context.read<SyncBloc>().add(SyncLoadQueueEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B), // Slate 800
        title: const Text('Farm Twin Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: () {
              context.read<AuthBloc>().add(AuthLogoutEvent());
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          )
        ],
      ),
      body: MultiValueListenableBuilder(
        listenables: [
          Hive.box<FarmModel>('farms').listenable(),
          Hive.box<TreeModel>('trees').listenable(),
          Hive.box<PipelineModel>('pipelines').listenable(),
          Hive.box<ValveModel>('valves').listenable(),
          Hive.box<PumpModel>('pumps').listenable(),
          Hive.box<TankModel>('tanks').listenable(),
          Hive.box<InfrastructureModel>('infrastructures').listenable(),
        ],
        builder: (context, boxes, _) {
          final farmCount = Hive.box<FarmModel>('farms').length;
          final treeCount = Hive.box<TreeModel>('trees').length;
          final pipelineCount = Hive.box<PipelineModel>('pipelines').length;
          final pointCount = Hive.box<ValveModel>('valves').length +
              Hive.box<PumpModel>('pumps').length +
              Hive.box<TankModel>('tanks').length;
          final infraCount = Hive.box<InfrastructureModel>('infrastructures').length;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Greetings banner
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    String username = 'Field Operator';
                    String role = 'FIELD_OPERATOR';
                    if (state is AuthAuthenticatedState) {
                      username = state.username;
                      role = state.role;
                    }
                    return Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF064E3B), Color(0xFF022C22)], // Deep Emerald to Dark Teal
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.15)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.05),
                            blurRadius: 15,
                            spreadRadius: 2,
                          )
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                role.replaceAll('_', ' '),
                                style: const TextStyle(
                                  color: Color(0xFF34D399),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                username,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.06),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withOpacity(0.1)),
                            ),
                            child: const Icon(
                              Icons.admin_panel_settings,
                              color: Color(0xFF34D399),
                              size: 28,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Sync Queue Stats Card
                BlocBuilder<SyncBloc, SyncState>(
                  builder: (context, syncState) {
                    final hasPending = syncState.pendingCount > 0;
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const SyncScreen()),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: hasPending ? Colors.amber.withOpacity(0.3) : Colors.white.withOpacity(0.05),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Sync Queue Status',
                                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Icon(
                                      hasPending ? Icons.sync_problem : Icons.cloud_done,
                                      color: hasPending ? Colors.amber : const Color(0xFF10B981),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      hasPending 
                                          ? '${syncState.pendingCount} Changes Pending' 
                                          : 'All Assets Synced',
                                      style: TextStyle(
                                        color: hasPending ? Colors.amber : const Color(0xFF10B981),
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    )
                                  ],
                                ),
                                if (hasPending) ...[
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Tap card to view details/errors',
                                    style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontStyle: FontStyle.italic),
                                  ),
                                ]
                              ],
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: hasPending ? Colors.amber : const Color(0xFF334155),
                                foregroundColor: hasPending ? Colors.black : Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: syncState.isSyncing
                                  ? null
                                  : () {
                                      if (hasPending) {
                                        context.read<SyncBloc>().add(SyncTriggerEvent());
                                      } else {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(builder: (_) => const SyncScreen()),
                                        );
                                      }
                                    },
                              child: syncState.isSyncing
                                  ? const SizedBox(
                                      height: 18,
                                      width: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : Text(hasPending ? 'Sync Now' : 'View Logs'),
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Local Inventory Summary Grid
                const Text(
                  'Offline Inventory Cache',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.5,
                  children: [
                    _buildStatCard(Icons.landscape, 'Farms', farmCount, const Color(0xFF10B981)),
                    _buildStatCard(Icons.forest, 'Trees', treeCount, Colors.teal),
                    _buildStatCard(Icons.linear_scale, 'Pipelines', pipelineCount, Colors.lightBlue),
                    _buildStatCard(Icons.palette, 'Valves/Pumps', pointCount, Colors.indigoAccent),
                    _buildStatCard(Icons.business, 'Infrastructure', infraCount, Colors.amber),
                  ],
                ),
                const SizedBox(height: 24),

                // Primary Action Button: Open Mapping Screen
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const MapScreen()),
                    );
                  },
                  icon: const Icon(Icons.map, color: Colors.white),
                  label: const Text(
                    'Open GIS Mapping Tool',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String label, int count, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF1E293B), const Color(0xFF0F172A).withOpacity(0.5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: accentColor, size: 20),
              ),
              Text(
                '$count',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              )
            ],
          ),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          )
        ],
      ),
    );
  }
}

// Simple Helper Widget to listen to multiple listenables
class MultiValueListenableBuilder extends StatelessWidget {
  final List<ValueListenable> listenables;
  final Widget Function(BuildContext, List<dynamic>, Widget?) builder;
  final Widget? child;

  const MultiValueListenableBuilder({
    super.key,
    required this.listenables,
    required this.builder,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return _build(context, 0, []);
  }

  Widget _build(BuildContext context, int index, List<dynamic> values) {
    if (index == listenables.length) {
      return builder(context, values, child);
    }
    return ValueListenableBuilder(
      valueListenable: listenables[index],
      builder: (ctx, value, _) {
        return _build(context, index + 1, [...values, value]);
      },
    );
  }
}
