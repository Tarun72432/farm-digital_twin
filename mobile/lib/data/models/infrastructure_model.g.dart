// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'infrastructure_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class InfrastructureModelAdapter extends TypeAdapter<InfrastructureModel> {
  @override
  final int typeId = 6;

  @override
  InfrastructureModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return InfrastructureModel(
      id: fields[0] as String,
      farmId: fields[1] as String,
      name: fields[2] as String,
      type: fields[3] as String,
      status: fields[4] as String?,
      geometryType: fields[5] as String,
      coordinates: (fields[6] as List).cast<dynamic>(),
      photoUrl: fields[7] as String?,
      localPhotoPath: fields[8] as String?,
      serverId: fields[9] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, InfrastructureModel obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.farmId)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.type)
      ..writeByte(4)
      ..write(obj.status)
      ..writeByte(5)
      ..write(obj.geometryType)
      ..writeByte(6)
      ..write(obj.coordinates)
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
      other is InfrastructureModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
