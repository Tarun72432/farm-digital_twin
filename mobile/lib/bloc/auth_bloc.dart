import 'package:flutter_bloc/flutter_bloc.dart';
import '../services/api_service.dart';

// EVENTS
abstract class AuthEvent {}
class AuthCheckEvent extends AuthEvent {}
class AuthLoginEvent extends AuthEvent {
  final String username;
  final String password;
  AuthLoginEvent({required this.username, required this.password});
}
class AuthLogoutEvent extends AuthEvent {}

// STATES
abstract class AuthState {}
class AuthInitialState extends AuthState {}
class AuthLoadingState extends AuthState {}
class AuthAuthenticatedState extends AuthState {
  final String username;
  final String role;
  AuthAuthenticatedState({required this.username, required this.role});
}
class AuthUnauthenticatedState extends AuthState {}
class AuthErrorState extends AuthState {
  final String message;
  AuthErrorState({required this.message});
}

// BLOC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiService _apiService = ApiService();

  AuthBloc() : super(AuthInitialState()) {
    on<AuthCheckEvent>((event, emit) async {
      emit(AuthLoadingState());
      final isAuth = await _apiService.isAuthenticated();
      if (isAuth) {
        final username = await _apiService.getUsername() ?? 'User';
        final role = await _apiService.getUserRole() ?? 'FIELD_OPERATOR';
        emit(AuthAuthenticatedState(username: username, role: role));
      } else {
        emit(AuthUnauthenticatedState());
      }
    });

    on<AuthLoginEvent>((event, emit) async {
      emit(AuthLoadingState());
      final loginData = await _apiService.login(event.username, event.password);
      if (loginData != null) {
        final username = loginData['username'] ?? event.username;
        final role = loginData['role'] ?? 'FIELD_OPERATOR';
        emit(AuthAuthenticatedState(username: username, role: role));
      } else {
        emit(AuthErrorState(message: 'Invalid username or password.'));
      }
    });

    on<AuthLogoutEvent>((event, emit) async {
      emit(AuthLoadingState());
      await _apiService.logout();
      emit(AuthUnauthenticatedState());
    });
  }
}
