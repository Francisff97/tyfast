<?php
require 'db.php';
if(!isset($_SESSION['user_id'])){http_response_code(401);exit;}
$data=json_decode(file_get_contents("php://input"),true);
$stmt=$conn->prepare("INSERT INTO scores(user_id,wpm,cpm,accuracy,duration,mode) VALUES(?,?,?,?,?,?)");
$stmt->bind_param("iiiiis",$_SESSION['user_id'],$data['wpm'],$data['cpm'],$data['accuracy'],$data['duration'],$data['mode']);
$stmt->execute(); echo "ok";
?>