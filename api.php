<?php
// ÉTOSZ hőhullám-kör — minimális szavazó backend.
// Minden szavazat egy sor a votes.csv végén (append, zárolással). Az állapot (aktív kör) a state.json-ban.
// Végpontok:  ?a=state            → {"round":1|2|0}
//             ?a=results          → {"round":..,"rounds":{"1":{"A":n,...,"n":össz},"2":{...}}}
//             POST ?a=vote        body: cid=..&round=..&opt=A..D   → {"ok":true}
//             ?a=setround&key=..&round=0|1|2      (0 = zárva)
//             ?a=reset&key=..     → törli a szavazatokat (a régi fájlt átnevezi)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$KEY   = 'etosz-2026';            // ← írd át! a vezérlő oldal ezt kéri
$DIR   = __DIR__ . '/data';
$VOTES = $DIR . '/votes.csv';
$STATE = $DIR . '/state.json';
if (!is_dir($DIR)) { mkdir($DIR, 0775, true); file_put_contents($DIR . '/.htaccess', "Deny from all\n"); }

function state($STATE) {
  if (!file_exists($STATE)) return ['round' => 1];
  $s = json_decode(file_get_contents($STATE), true);
  return is_array($s) ? $s : ['round' => 1];
}
function results($VOTES) {
  $last = [];                                   // [round][cid] = opt  (az utolsó szavazat számít)
  if (file_exists($VOTES)) {
    $fh = fopen($VOTES, 'r');
    if (flock($fh, LOCK_SH)) {
      while (($row = fgetcsv($fh)) !== false) {
        if (count($row) < 4) continue;
        [$ts, $cid, $round, $opt] = $row;
        $last[$round][$cid] = $opt;
      }
      flock($fh, LOCK_UN);
    }
    fclose($fh);
  }
  $out = [];
  foreach ([1, 2] as $r) {
    $c = ['A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'n' => 0];
    foreach ($last[$r] ?? [] as $opt) { if (isset($c[$opt])) { $c[$opt]++; $c['n']++; } }
    $out[(string)$r] = $c;
  }
  return $out;
}

$a = $_GET['a'] ?? '';
if ($a === 'state') { echo json_encode(state($STATE)); exit; }
if ($a === 'results') { echo json_encode(['round' => state($STATE)['round'], 'rounds' => results($VOTES)]); exit; }
if ($a === 'vote') {
  $cid = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['cid'] ?? '');
  $round = (int)($_POST['round'] ?? 0);
  $opt = strtoupper(substr($_POST['opt'] ?? '', 0, 1));
  $st = state($STATE);
  if ($cid === '' || !in_array($round, [1, 2]) || !in_array($opt, ['A', 'B', 'C', 'D'])) { http_response_code(400); echo json_encode(['ok' => false, 'err' => 'bad']); exit; }
  if ((int)$st['round'] !== $round) { echo json_encode(['ok' => false, 'err' => 'closed', 'round' => $st['round']]); exit; }
  $fh = fopen($VOTES, 'a');
  if (flock($fh, LOCK_EX)) { fputcsv($fh, [date('c'), $cid, $round, $opt]); fflush($fh); flock($fh, LOCK_UN); }
  fclose($fh);
  echo json_encode(['ok' => true]); exit;
}
if ($a === 'setround' || $a === 'reset') {
  if (($_GET['key'] ?? '') !== $KEY) { http_response_code(403); echo json_encode(['ok' => false, 'err' => 'key']); exit; }
  if ($a === 'reset') { if (file_exists($VOTES)) rename($VOTES, $VOTES . '.' . date('Ymd-His') . '.bak'); file_put_contents($STATE, json_encode(['round' => 1])); echo json_encode(['ok' => true]); exit; }
  $round = (int)($_GET['round'] ?? 0);
  if (!in_array($round, [0, 1, 2])) { http_response_code(400); echo json_encode(['ok' => false]); exit; }
  file_put_contents($STATE, json_encode(['round' => $round]), LOCK_EX);
  echo json_encode(['ok' => true, 'round' => $round]); exit;
}
http_response_code(404); echo json_encode(['ok' => false, 'err' => 'unknown']);
