// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pipeline_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PipelineModelAdapter extends TypeAdapter<PipelineModel> {
  @override
  final int typeId = 2;

  @override
  PipelineModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PipelineModel(
      id: fields[0] as String,
      farmId: fields[1] as String,
      name: fields[2] as String,
      diameter: fields[3] as double?,
      material: fields[4] as String?,
      status: fields[5] as String?,
      geometry: (fields[6] as List)
          .map((dynamic e) => (e as List).cast<double>())
          .toList(),
      lengthMeters: fields[7] as double?,
      serverId: fields[8] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, PipelineModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.farmId)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.diameter)
      ..writeByte(4)
      ..write(obj.material)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.geometry)
      ..writeByte(7)
      ..write(obj.lengthMeters)
      ..writeByte(8)
      ..write(obj.serverId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PipelineModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
