# lo-fi typing — typing speed game

A small typing-speed web app in **plain PHP and MySQL**: users sign up, take timed typing tests and keep a history of their scores (words per minute) on their profile.

## Features

- Registration and login with hashed passwords (`password_hash` / prepared statements)
- Timed typing test with WPM calculation in vanilla JavaScript
- Scores saved per user, with a personal profile page
- Lo-fi themed UI

## Tech stack

PHP 8 · MySQL (mysqli) · vanilla JavaScript · CSS

## Getting started

1. Create the database by importing `sql/typing_db.sql` into MySQL.
2. Set your database credentials in `db.php`.
3. Serve the folder with PHP:

```bash
php -S localhost:8000
```

4. Open `http://localhost:8000`, create an account and start typing.

## Project structure

```
index.php / register.php / logout.php   # authentication
app.php                                 # typing test
save_score.php                          # stores a result
profile.php                             # score history
assets/                                 # JS and CSS
sql/typing_db.sql                       # database schema
```

---

Made by [Francesco Ferri](https://www.francescoferri.me) — Francesco Design.
