// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_item_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class SyncItemModelAdapter extends TypeAdapter<SyncItemModel> {
  @override
  final int typeId = 7;

  @override
  SyncItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return SyncItemModel(
      id: fields[0] as String,
      action: fields[1] as String,
      entityType: fields[2] as String,
      localId: fields[3] as String,
      payload: (fields[4] as Map).cast<dynamic, dynamic>(),
      localPhotoPath: fields[5] as String?,
      status: fields[6] as String,
      errorMessage: fields[7] as String?,
      createdAt: fields[8] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, SyncItemModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.action)
      ..writeByte(2)
      ..write(obj.entityType)
      ..writeByte(3)
      ..write(obj.localId)
      ..writeByte(4)
      ..write(obj.payload)
      ..writeByte(5)
      ..write(obj.localPhotoPath)
      ..writeByte(6)
      ..write(obj.status)
      ..writeByte(7)
      ..write(obj.errorMessage)
      ..writeByte(8)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SyncItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
