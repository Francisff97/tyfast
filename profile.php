<?php
require "db.php";

if (!isset($_SESSION["user_id"])) {
    header("Location: index.php");
    exit;
}

$userId = $_SESSION["user_id"];
$error = "";
$success = "";

/* --- upload avatar --- */
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["avatar"])) {
    if ($_FILES["avatar"]["error"] === UPLOAD_ERR_OK) {
        $tmp = $_FILES["avatar"]["tmp_name"];
        $name = $_FILES["avatar"]["name"];
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        $allowed = ["jpg","jpeg","png","gif","webp"];
        if (!in_array($ext, $allowed)) {
            $error = "Formato non supportato. Usa jpg, png, gif o webp.";
        } else {
            $destDir = __DIR__ . "/uploads";
            if (!is_dir($destDir)) {
                mkdir($destDir, 0777, true);
            }
            $filename = "avatar_" . $userId . "." . $ext;
            $fullPath = $destDir . "/" . $filename;
            $relPath = "uploads/" . $filename;

            if (move_uploaded_file($tmp, $fullPath)) {
                $stmt = $conn->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmt->bind_param("si", $relPath, $userId);
                $stmt->execute();
                $success = "Avatar aggiornato.";
            } else {
                $error = "Errore nel salvataggio del file.";
            }
        }
    } else {
        $error = "Errore nel caricamento del file.";
    }
}

/* --- carica dati utente --- */
$stmt = $conn->prepare("SELECT username, email, avatar, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->bind_result($username, $email, $avatar, $createdAt);
$stmt->fetch();
$stmt->close();

/* --- statistiche --- */
$stats = [
    "count" => 0,
    "best_wpm" => 0,
    "avg_wpm" => 0,
    "avg_accuracy" => 0
];

$res = $conn->prepare("
    SELECT COUNT(*), MAX(wpm), AVG(wpm), AVG(accuracy)
    FROM scores WHERE user_id = ?
");
$res->bind_param("i", $userId);
$res->execute();
$res->bind_result($stats["count"], $stats["best_wpm"], $stats["avg_wpm"], $stats["avg_accuracy"]);
$res->fetch();
$res->close();

/* --- ultimi risultati --- */
$rows = [];
$list = $conn->prepare("
    SELECT wpm, cpm, accuracy, duration, mode, created_at
    FROM scores WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
");
$list->bind_param("i", $userId);
$list->execute();
$list->bind_result($wpm, $cpm, $acc, $dur, $mode, $created);
while ($list->fetch()) {
    $rows[] = [
        "wpm" => $wpm,
        "cpm" => $cpm,
        "accuracy" => $acc,
        "duration" => $dur,
        "mode" => $mode,
        "created_at" => $created
    ];
}
$list->close();
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Profilo • lo-fi typing.it</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="auth-body">

<div class="profile-card">
  <div class="profile-header">
    <div class="profile-avatar-big">
      <?php if ($avatar): ?>
        <img src="<?= htmlspecialchars($avatar) ?>" alt="avatar">
      <?php else: ?>
        <span><?= strtoupper(substr($username, 0, 1)) ?></span>
      <?php endif; ?>
    </div>
    <div class="profile-info">
      <h1><?= htmlspecialchars($username) ?></h1>
      <p><?= htmlspecialchars($email) ?></p>
      <p class="profile-meta">iscritto il <?= substr($createdAt, 0, 10) ?></p>
    </div>
  </div>

  <div class="profile-stats">
    <div class="profile-stat">
      <span class="label">sessioni</span>
      <span class="value"><?= (int)$stats["count"] ?></span>
    </div>
    <div class="profile-stat">
      <span class="label">best WPM</span>
      <span class="value"><?= (int)$stats["best_wpm"] ?></span>
    </div>
    <div class="profile-stat">
      <span class="label">WPM medio</span>
      <span class="value"><?= (int)$stats["avg_wpm"] ?></span>
    </div>
    <div class="profile-stat">
      <span class="label">accuracy media</span>
      <span class="value"><?= (int)$stats["avg_accuracy"] ?>%</span>
    </div>
  </div>

  <?php if ($error): ?>
    <p class="auth-error"><?= htmlspecialchars($error) ?></p>
  <?php endif; ?>
  <?php if ($success): ?>
    <p class="auth-success"><?= htmlspecialchars($success) ?></p>
  <?php endif; ?>

  <form method="POST" enctype="multipart/form-data" class="profile-upload">
    <label class="auth-label">
      aggiorna avatar
      <input type="file" name="avatar" class="auth-input">
    </label>
    <button class="auth-button" type="submit">carica</button>
  </form>

  <h2 class="profile-table-title">ultimi risultati</h2>
  <div class="profile-table-wrapper">
    <?php if (count($rows) === 0): ?>
      <p class="profile-empty">ancora nessun risultato salvato.</p>
    <?php else: ?>
      <table class="profile-table">
        <thead>
          <tr>
            <th>data</th>
            <th>WPM</th>
            <th>accuracy</th>
            <th>durata</th>
            <th>modalità</th>
          </tr>
        </thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr>
            <td><?= htmlspecialchars($r["created_at"]) ?></td>
            <td><?= (int)$r["wpm"] ?></td>
            <td><?= (int)$r["accuracy"] ?>%</td>
            <td><?= (int)$r["duration"] ?>s</td>
            <td><?= htmlspecialchars($r["mode"]) ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>

  <div class="profile-footer-links">
    <a href="app.php">torna al test</a>
    <a href="logout.php">logout</a>
  </div>
</div>

</body>
</html>
