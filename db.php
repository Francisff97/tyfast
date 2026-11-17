<?php
$host='localhost';$user='root';$pass='';$db='typing_db';
$conn=new mysqli($host,$user,$pass,$db);
if($conn->connect_error) die('Connessione fallita: '.$conn->connect_error);
session_start();
?>