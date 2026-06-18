import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  static String get defaultBaseUrl => 'http://13.203.86.187';

  // Set the base URL. Note: 10.0.2.2 is the standard loopback IP for Android Emulator pointing to host machine localhost.
  // We will configure a dynamic baseUrl fallback.
  String _baseUrl = defaultBaseUrl;

  final Dio dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final FlutterSecureStorage secureStorage = const FlutterSecureStorage();

  ApiService._internal() {
    dio.options.baseUrl = _baseUrl;
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await secureStorage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  void updateBaseUrl(String url) {
    _baseUrl = url;
    dio.options.baseUrl = _baseUrl;
  }

  String get baseUrl => _baseUrl;

  Future<Map<String, dynamic>?> login(String username, String password) async {
    try {
      final response = await dio.post('/api/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200 && response.data != null) {
        final token = response.data['accessToken'] ?? response.data['token'];
        final role = response.data['role'] ?? 'FIELD_OPERATOR';
        if (token != null) {
          await secureStorage.write(key: 'auth_token', value: token);
          await secureStorage.write(key: 'user_role', value: role);
          await secureStorage.write(key: 'username', value: username);
          return response.data;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    await secureStorage.delete(key: 'auth_token');
    await secureStorage.delete(key: 'user_role');
    await secureStorage.delete(key: 'username');
  }

  Future<bool> isAuthenticated() async {
    final token = await secureStorage.read(key: 'auth_token');
    return token != null;
  }

  Future<String?> getUserRole() async {
    return await secureStorage.read(key: 'user_role');
  }

  Future<String?> getUsername() async {
    return await secureStorage.read(key: 'username');
  }
}
