import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'data/models/farm_model.dart';
import 'data/models/tree_model.dart';
import 'data/models/pipeline_model.dart';
import 'data/models/valve_model.dart';
import 'data/models/pump_model.dart';
import 'data/models/tank_model.dart';
import 'data/models/infrastructure_model.dart';
import 'data/models/sync_item_model.dart';
import 'bloc/auth_bloc.dart';
import 'bloc/sync_bloc.dart';
import 'bloc/mapping_bloc.dart';
import 'ui/login_screen.dart';
import 'ui/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive
  await Hive.initFlutter();

  // Register Adapters
  Hive.registerAdapter(FarmModelAdapter());
  Hive.registerAdapter(TreeModelAdapter());
  Hive.registerAdapter(PipelineModelAdapter());
  Hive.registerAdapter(ValveModelAdapter());
  Hive.registerAdapter(PumpModelAdapter());
  Hive.registerAdapter(TankModelAdapter());
  Hive.registerAdapter(InfrastructureModelAdapter());
  Hive.registerAdapter(SyncItemModelAdapter());

  // Open Boxes
  await Hive.openBox<FarmModel>('farms');
  await Hive.openBox<TreeModel>('trees');
  await Hive.openBox<PipelineModel>('pipelines');
  await Hive.openBox<ValveModel>('valves');
  await Hive.openBox<PumpModel>('pumps');
  await Hive.openBox<TankModel>('tanks');
  await Hive.openBox<InfrastructureModel>('infrastructures');
  await Hive.openBox<SyncItemModel>('sync_queue');

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc()..add(AuthCheckEvent()),
        ),
        BlocProvider<SyncBloc>(
          create: (context) => SyncBloc()..add(SyncLoadQueueEvent()),
        ),
        BlocProvider<MappingBloc>(
          create: (context) => MappingBloc(),
        ),
      ],
      child: MaterialApp(
        title: 'Farm Twin Collector',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF10B981),
            secondary: Colors.teal,
            surface: Color(0xFF1E293B),
            background: Color(0xFF0F172A),
            error: Colors.redAccent,
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1E293B),
            elevation: 0,
            iconTheme: IconThemeData(color: Colors.white),
            titleTextStyle: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          cardTheme: const CardThemeData(
            color: Color(0xFF1E293B),
            elevation: 2,
          ),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Colors.white, fontFamily: 'Inter'),
            bodyMedium: TextStyle(color: Color(0xFF94A3B8), fontFamily: 'Inter'),
          ),
        ),
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthInitialState || state is AuthLoadingState) {
          return const Scaffold(
            backgroundColor: Color(0xFF0F172A),
            body: const Center(
              child: CircularProgressIndicator(color: Color(0xFF10B981)),
            ),
          );
        } else if (state is AuthAuthenticatedState) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
