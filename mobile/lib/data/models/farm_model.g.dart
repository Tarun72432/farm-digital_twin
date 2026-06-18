// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farm_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class FarmModelAdapter extends TypeAdapter<FarmModel> {
  @override
  final int typeId = 0;

  @override
  FarmModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FarmModel(
      id: fields[0] as String,
      name: fields[1] as String,
      ownerName: fields[2] as String,
      description: fields[3] as String?,
      status: fields[4] as String?,
      boundary: (fields[5] as List)
          .map((dynamic e) => (e as List).cast<double>())
          .toList(),
      serverId: fields[6] as int?,
      areaHectares: fields[7] as double?,
    );
  }

  @override
  void write(BinaryWriter writer, FarmModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.ownerName)
      ..writeByte(3)
      ..write(obj.description)
      ..writeByte(4)
      ..write(obj.status)
      ..writeByte(5)
      ..write(obj.boundary)
      ..writeByte(6)
      ..write(obj.serverId)
      ..writeByte(7)
      ..write(obj.areaHectares);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FarmModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
