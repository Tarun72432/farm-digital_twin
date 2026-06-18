// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pump_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PumpModelAdapter extends TypeAdapter<PumpModel> {
  @override
  final int typeId = 4;

  @override
  PumpModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PumpModel(
      id: fields[0] as String,
      farmId: fields[1] as String,
      name: fields[2] as String,
      capacity: fields[3] as double?,
      powerRating: fields[4] as double?,
      manufacturer: fields[5] as String?,
      status: fields[6] as String?,
      geometry: (fields[7] as List).cast<double>(),
      photoUrl: fields[8] as String?,
      localPhotoPath: fields[9] as String?,
      serverId: fields[10] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, PumpModel obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.farmId)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.capacity)
      ..writeByte(4)
      ..write(obj.powerRating)
      ..writeByte(5)
      ..write(obj.manufacturer)
      ..writeByte(6)
      ..write(obj.status)
      ..writeByte(7)
      ..write(obj.geometry)
      ..writeByte(8)
      ..write(obj.photoUrl)
      ..writeByte(9)
      ..write(obj.localPhotoPath)
      ..writeByte(10)
      ..write(obj.serverId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PumpModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
