import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

void main() {
  final file = File('assets/AssetManifest.bin');
  final bytes = file.readAsBytesSync();
  
  // Decodificar formato binario estándar de Flutter AssetManifest
  final manifest = decodeAssetManifest(bytes);
  
  // Guardar como JSON legible
  final jsonFile = File('assets/AssetManifest_decoded.json');
  jsonFile.writeAsStringSync(
    JsonEncoder.withIndent('  ').convert(manifest),
  );
  
  print('✅ AssetManifest.bin descifrado correctamente!');
  print('📄 Guardado en: assets/AssetManifest_decoded.json');
}

Map<String, dynamic> decodeAssetManifest(Uint8List bytes) {
  final buffer = bytes.buffer.asByteData();
  int offset = 0;
  
  // Leer versión
  final version = buffer.getUint32(offset, Endian.little);
  offset += 4;
  
  // Leer cantidad de assets
  final count = buffer.getUint32(offset, Endian.little);
  offset += 4;
  
  final manifest = <String, List<String>>{};
  
  for (int i = 0; i < count; i++) {
    // Leer longitud de la clave
    final keyLength = buffer.getUint32(offset, Endian.little);
    offset += 4;
    
    // Leer clave
    final key = utf8.decode(bytes.sublist(offset, offset + keyLength));
    offset += keyLength;
    
    // Leer cantidad de variantes
    final variantCount = buffer.getUint32(offset, Endian.little);
    offset += 4;
    
    final variants = <String>[];
    for (int j = 0; j < variantCount; j++) {
      final variantLength = buffer.getUint32(offset, Endian.little);
      offset += 4;
      
      final variant = utf8.decode(bytes.sublist(offset, offset + variantLength));
      offset += variantLength;
      variants.add(variant);
    }
    
    manifest[key] = variants;
  }
  
  return {
    'version': version,
    'assets': manifest,
  };
}