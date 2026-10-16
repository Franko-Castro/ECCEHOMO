<?php
/**
 * publicar.php - Endpoint de publicación del panel de administración Eccehomo
 * ---------------------------------------------------------------
 * Recibe desde admin.html el contenido nuevo (contenido.json) y archivos
 * (imágenes/PDF) y los escribe en el servidor. NO usa base de datos.
 *
 * Seguridad:
 *  - Valida correo + contraseña del panel contra admin-config.json
 *    (hash SHA-256 con sal; la contraseña nunca viaja en claro al archivo).
 *  - Solo escribe contenido.json y archivos dentro de imagenes/ o documentos/
 *    con formatos permitidos, nombres seguros y límites de tamaño.
 *
 * Sube este archivo a la RAÍZ del sitio (junto a index.html) una sola vez.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Pre-flight de CORS (cuando el panel corre en otro dominio)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function responder(int $codigo, array $datos): void {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function leerConfig(string $ruta): ?array {
    if (!is_file($ruta)) return null;
    $texto = file_get_contents($ruta);
    if ($texto === false) return null;
    // Algunos editores guardan UTF-8 con BOM; json_decode lo rechaza.
    if (strncmp($texto, "\xEF\xBB\xBF", 3) === 0) {
        $texto = substr($texto, 3);
    }
    $datos = json_decode($texto, true);
    return is_array($datos) ? $datos : null;
}

function escribirAtomico(string $ruta, string $contenido): bool {
    $tmp = $ruta . '.tmp.' . getmypid();
    if (file_put_contents($tmp, $contenido, LOCK_EX) === false) return false;
    if (!rename($tmp, $ruta)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

// ---------- Límites ----------
const MAX_ARCHIVO = 15 * 1024 * 1024; // 15 MB por archivo
const MAX_TOTAL   = 40 * 1024 * 1024; // 40 MB por publicación
$EXT_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];

// ---------- 1. Método y cuerpo ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido. Usa POST desde el panel.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    responder(400, ['ok' => false, 'error' => 'Cuerpo de la petición vacío.']);
}
if (strlen($raw) > MAX_TOTAL + 4 * 1024 * 1024) {
    responder(413, ['ok' => false, 'error' => 'Los datos superan el tamaño máximo permitido (40 MB).']);
}

$peticion = json_decode($raw, true);
if (!is_array($peticion)) {
    responder(400, ['ok' => false, 'error' => 'El cuerpo no es JSON válido.']);
}

// ---------- 2. Credenciales del panel ----------
$cfg = leerConfig(__DIR__ . '/admin-config.json');
if (!$cfg || empty($cfg['sal']) || empty($cfg['correoHash'])) {
    responder(500, ['ok' => false, 'error' => 'No se pudo leer admin-config.json en la raíz del sitio.']);
}

$correo = isset($peticion['correo']) ? trim((string) $peticion['correo']) : '';
$clave  = isset($peticion['clave']) ? (string) $peticion['clave'] : '';
if ($correo === '' || $clave === '') {
    responder(401, ['ok' => false, 'error' => 'Faltan credenciales del panel.']);
}

$hashCalculado = hash('sha256', (string) $cfg['sal'] . strtolower($correo) . '|' . $clave);
if (!hash_equals((string) $cfg['correoHash'], $hashCalculado)) {
    responder(401, ['ok' => false, 'error' => 'Correo o contraseña incorrectos.']);
}

// ---------- 3. contenido.json ----------
$escritos = [];

if (isset($peticion['contenido']) && $peticion['contenido'] !== null && $peticion['contenido'] !== '') {
    $texto = (string) $peticion['contenido'];
    json_decode($texto);
    if (json_last_error() !== JSON_ERROR_NONE) {
        responder(400, ['ok' => false, 'error' => 'contenido.json no es JSON válido (' . json_last_error_msg() . ').']);
    }
    if (!escribirAtomico(__DIR__ . '/contenido.json', $texto)) {
        responder(500, ['ok' => false, 'error' => 'No se pudo escribir contenido.json (permisos de escritura).']);
    }
    $escritos[] = 'contenido.json';
}

// ---------- 4. Archivos nuevos (imágenes / PDF) ----------
$archivos = (isset($peticion['archivos']) && is_array($peticion['archivos'])) ? $peticion['archivos'] : [];
$total = 0;

foreach ($archivos as $a) {
    $ruta  = (is_array($a) && isset($a['ruta'])) ? (string) $a['ruta'] : '';
    $datos = (is_array($a) && isset($a['datos'])) ? (string) $a['datos'] : '';

    // Ruta permitida: imagenes/ o documentos/ + nombre seguro (sin espacios ni acentos)
    if (!preg_match('#^(imagenes|documentos)/([A-Za-z0-9._-]+)$#', $ruta, $m)) {
        responder(400, ['ok' => false, 'error' => 'Ruta de archivo no permitida: ' . $ruta]);
    }
    $carpetaRel = $m[1];
    $nombre = $m[2];
    if ($nombre === '.' || $nombre === '..' || strpos($nombre, '..') !== false) {
        responder(400, ['ok' => false, 'error' => 'Nombre de archivo no permitido.']);
    }

    $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
    if ($ext === '' || !in_array($ext, $EXT_PERMITIDAS, true)) {
        responder(400, ['ok' => false, 'error' => 'Formato no permitido: .' . $ext . '. Permitidos: ' . implode(', ', $EXT_PERMITIDAS) . '.']);
    }

    $binario = base64_decode($datos, true);
    if ($binario === false) {
        responder(400, ['ok' => false, 'error' => 'Archivo dañado (base64 inválido): ' . $nombre]);
    }
    if (strlen($binario) > MAX_ARCHIVO) {
        responder(413, ['ok' => false, 'error' => 'El archivo supera los 15 MB: ' . $nombre]);
    }
    $total += strlen($binario);
    if ($total > MAX_TOTAL) {
        responder(413, ['ok' => false, 'error' => 'Los archivos superan los 40 MB en total.']);
    }

    $carpeta = __DIR__ . '/' . $carpetaRel;
    if (!is_dir($carpeta) && !mkdir($carpeta, 0755, true)) {
        responder(500, ['ok' => false, 'error' => 'No se pudo crear la carpeta ' . $carpetaRel . '.']);
    }

    if (!escribirAtomico($carpeta . '/' . $nombre, $binario)) {
        responder(500, ['ok' => false, 'error' => 'No se pudo escribir ' . $ruta . ' (permisos de escritura).']);
    }
    $escritos[] = $ruta;
}

// ---------- 5. admin-config.json (cambio de credenciales desde la pestaña Cuenta) ----------
// La autenticación de arriba ya se hizo contra el config ANTIGUO leído en memoria,
// por lo que este bloque solo se alcanza con credenciales válidas.
if (isset($peticion['config']) && $peticion['config'] !== null && $peticion['config'] !== '') {
    $textoCfg = (string) $peticion['config'];
    if (strncmp($textoCfg, "\xEF\xBB\xBF", 3) === 0) {
        $textoCfg = substr($textoCfg, 3);
    }
    $nuevoCfg = json_decode($textoCfg, true);
    if (!is_array($nuevoCfg) || json_last_error() !== JSON_ERROR_NONE) {
        responder(400, ['ok' => false, 'error' => 'admin-config.json no es JSON válido.']);
    }
    if (empty($nuevoCfg['sal']) || empty($nuevoCfg['correoHash'])) {
        responder(400, ['ok' => false, 'error' => 'admin-config.json sin campos de autenticación (sal/correoHash).']);
    }
    if (!escribirAtomico(__DIR__ . '/admin-config.json', $textoCfg)) {
        responder(500, ['ok' => false, 'error' => 'No se pudo escribir admin-config.json (permisos de escritura).']);
    }
    $escritos[] = 'admin-config.json';
}

if (!$escritos) {
    responder(400, ['ok' => false, 'error' => 'No hay nada que publicar.']);
}

responder(200, ['ok' => true, 'escritos' => $escritos]);
