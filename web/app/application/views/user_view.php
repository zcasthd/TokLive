<?php
  $status = array();
  $status["status"] = "ok";
  if (!is_null($session)) {
    $status["sessionName"] = $session;
  }
  echo json_encode($status);
?>