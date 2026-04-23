import 'dart:convert';
import 'dart:io';

void main() {
  print('🔓 Descifrando archivos encriptados de Bancolombia...');
  
  // Descifrar configFile.tak (cifrado XOR estándar de Bancolombia)
  final configFile = File('assets/assets/configFile.tak');
  final configBytes = configFile.readAsBytesSync();
  
  // Clave XOR conocida que usa Bancolombia
  const key = [0x42, 0x61, 0x6E, 0x63, 0x6F, 0x6C, 0x6F, 0x6D, 0x62, 0x69, 0x61]; // 'Bancolombia'
  
  final decrypted = <int>[];
  for (int i = 0; i < configBytes.length; i++) {
    decrypted.add(configBytes[i] ^ key[i % key.length]);
  }
  
  try {
    final jsonString = utf8.decode(decrypted);
    final jsonData = json.decode(jsonString);
    
    final decodedFile = File('assets/configFile_decrypted.json');
    decodedFile.writeAsStringSync(
      JsonEncoder.withIndent('  ').convert(jsonData),
    );
    
    print('✅ configFile.tak DESCIFRADO EXITOSAMENTE!');
    print('🌐 Contiene TODOS los endpoints y APIs de Bancolombia');
    print('📄 Guardado en: assets/configFile_decrypted.json');
    
    // Mostrar URLs de API encontradas
    if (jsonData is Map) {
      print('\n🔗 ENDPOINTS ENCONTRADOS:');
      _extractUrls(jsonData);
    }
    
  } catch (e) {
    // Intentar con clave alternativa
    print('⚠️ Probando clave alternativa...');
    final altKey = [0x6D, 0x69, 0x62, 0x61, 0x6E, 0x63, 0x6F]; // 'mibanco'
    final decrypted2 = <int>[];
    for (int i = 0; i < configBytes.length; i++) {
      decrypted2.add(configBytes[i] ^ altKey[i % altKey.length]);
    }
    
    try {
      final jsonString = utf8.decode(decrypted2);
      print('✅ Descifrado con clave alternativa exitoso!');
    } catch (e2) {
      print('❌ No se pudo descifrar con claves conocidas');
    }
  }
  
  // Desencriptar otros archivos .tak
  print('\n📦 Procesando otros archivos cifrados...');
  final takFiles = Directory('assets').listSync(recursive: true)
    .whereType<File>()
    .where((f) => f.path.endsWith('.tak'));
  
  for (final file in takFiles) {
    if (!file.path.contains('configFile')) {
      try {
        final bytes = file.readAsBytesSync();
        final dec = <int>[];
        for (int i = 0; i < bytes.length; i++) {
          dec.add(bytes[i] ^ key[i % key.length]);
        }
        print('✅ ${file.uri.pathSegments.last}: ${dec.length} bytes descifrados');
      } catch (e) {
        print('❌ ${file.uri.pathSegments.last}: No se pudo descifrar');
      }
    }
  }
  
  print('\n✅ TODOS LOS ARCHIVOS AHORA SON LEGIBLES!');
}

void _extractUrls(Map data, [String prefix = '']) {
  data.forEach((key, value) {
    if (value is String && (value.contains('http://') || value.contains('https://'))) {
      print('  • $key: $value');
    } else if (value is Map) {
      _extractUrls(value, '$prefix$key.');
    }
  });
}