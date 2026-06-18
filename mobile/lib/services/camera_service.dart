import 'package:image_picker/image_picker.dart';

class CameraService {
  static final CameraService _instance = CameraService._internal();
  factory CameraService() => _instance;

  final ImagePicker _picker = ImagePicker();

  CameraService._internal();

  /// Capture a new photo using the device camera.
  Future<String?> capturePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 70, // Compress to 70% quality to optimize offline uploads
        maxWidth: 1024,
        maxHeight: 1024,
      );
      return photo?.path;
    } catch (e) {
      return null;
    }
  }

  /// Choose a photo from the device gallery.
  Future<String?> pickPhotoFromGallery() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      return photo?.path;
    } catch (e) {
      return null;
    }
  }
}
