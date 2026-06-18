// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'valve_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ValveModelAdapter extends TypeAdapter<ValveModel> {
  @override
  final int typeId = 3;

  @override
  ValveModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ValveModel(
      id: fields[0] as String,
      farmId: fields[1] as String,
      valveNumber: fields[2] as String,
      type: fields[3] as String?,
      zone: fields[4] as String?,
      status: fields[5] as String?,
      geometry: (fields[6] as List).cast<double>(),
      photoUrl: fields[7] as String?,
      localPhotoPath: fields[8] as String?,
      serverId: fields[9] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, ValveModel obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.farmId)
      ..writeByte(2)
      ..write(obj.valveNumber)
      ..writeByte(3)
      ..write(obj.type)
      ..writeByte(4)
      ..write(obj.zone)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.geometry)
      ..writeByte(7)
      ..write(obj.photoUrl)
      ..writeByte(8)
      ..write(obj.localPhotoPath)
      ..writeByte(9)
      ..write(obj.serverId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ValveModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
