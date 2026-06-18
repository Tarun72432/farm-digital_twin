// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tree_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TreeModelAdapter extends TypeAdapter<TreeModel> {
  @override
  final int typeId = 1;

  @override
  TreeModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TreeModel(
      id: fields[0] as String,
      farmId: fields[1] as String,
      treeNumber: fields[2] as String,
      species: fields[3] as String?,
      age: fields[4] as int?,
      healthStatus: fields[5] as String?,
      location: (fields[6] as List).cast<double>(),
      photoUrl: fields[7] as String?,
      localPhotoPath: fields[8] as String?,
      notes: fields[9] as String?,
      serverId: fields[10] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, TreeModel obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.farmId)
      ..writeByte(2)
      ..write(obj.treeNumber)
      ..writeByte(3)
      ..write(obj.species)
      ..writeByte(4)
      ..write(obj.age)
      ..writeByte(5)
      ..write(obj.healthStatus)
      ..writeByte(6)
      ..write(obj.location)
      ..writeByte(7)
      ..write(obj.photoUrl)
      ..writeByte(8)
      ..write(obj.localPhotoPath)
      ..writeByte(9)
      ..write(obj.notes)
      ..writeByte(10)
      ..write(obj.serverId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TreeModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
