<?php
require "db.php";

if (isset($_SESSION['user_id'])) {
    header("Location: app.php");
    exit;
}

$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = trim($_POST['username'] ?? '');
    $e = trim($_POST['email'] ?? '');
    $pPlain = $_POST['password'] ?? '';

    if ($u && $e && $pPlain) {
        $p = password_hash($pPlain, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users(username, email, password) VALUES(?, ?, ?)");
        $stmt->bind_param("sss", $u, $e, $p);

        if ($stmt->execute()) {
            header("Location: index.php");
            exit;
        } else {
            $error = "Username o email già usati.";
        }
    } else {
        $error = "Compila tutti i campi.";
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Registrati • lo-fi typing.it</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="auth-body">

  <main class="auth-shell">
    <header class="auth-header">
      <h1 class="auth-title">lo-fi // typing.it</h1>
      <p class="auth-subtitle">crea un profilo e salva i tuoi record</p>
    </header>

    <section class="auth-card">
      <h2 class="auth-section-title">registrazione</h2>

      <?php if ($error): ?>
        <p class="auth-error"><?= htmlspecialchars($error) ?></p>
      <?php endif; ?>

      <form method="POST" class="auth-form">
        <label class="auth-label">
          username
          <input
            type="text"
            name="username"
            class="auth-input"
            autocomplete="username"
            required
          >
        </label>

        <label class="auth-label">
          email
          <input
            type="email"
            name="email"
            class="auth-input"
            autocomplete="email"
            required
          >
        </label>

        <label class="auth-label">
          password
          <input
            type="password"
            name="password"
            class="auth-input"
            autocomplete="new-password"
            required
          >
        </label>

        <button type="submit" class="auth-button">crea account</button>
      </form>

      <p class="auth-footer">
        hai già un account?
        <a href="index.php">vai al login</a>
      </p>
    </section>
  </main>

</body>
</html>
