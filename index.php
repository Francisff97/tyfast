<?php
require "db.php";

if (isset($_SESSION['user_id'])) {
    header("Location: app.php");
    exit;
}

$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';

    if ($u && $p) {
        $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
        $stmt->bind_param("s", $u);
        $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $hash);

        if ($stmt->fetch() && password_verify($p, $hash)) {
            $_SESSION['user_id'] = $id;
            header("Location: app.php");
            exit;
        } else {
            $error = "Username o password errati.";
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
  <title>Login • lo-fi typing.it</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="auth-body">

  <main class="auth-shell">
    <header class="auth-header">
      <h1 class="auth-title">lo-fi // typing.it</h1>
      <p class="auth-subtitle">accesso al tuo allenamento di digitazione</p>
    </header>

    <section class="auth-card">
      <h2 class="auth-section-title">login</h2>

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
          password
          <input
            type="password"
            name="password"
            class="auth-input"
            autocomplete="current-password"
            required
          >
        </label>

        <button type="submit" class="auth-button">entra</button>
      </form>

      <p class="auth-footer">
        niente account?
        <a href="register.php">registrati</a>
      </p>
    </section>
  </main>

</body>
</html>
