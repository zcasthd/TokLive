<?php
  $error = array();
  $error["status"] = "error";
  $error["message"] = $e->getMessage();
  echo json_encode($error);
?>