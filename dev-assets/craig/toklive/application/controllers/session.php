<?php
class Session extends CI_Controller {
	
  public function create($opentokID)
  {
    try {
      $this->load->model("Session_model", "session");
      $this->session->create($opentokID);
      $this->load->view("session_view", array("session" => $this->session));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
  
  public function all()
  {
    try {
      $this->load->model("Session_set_model", "sessions");
      $this->sessions->getAll();
      $this->load->view("session_view", array("session" => $this->sessions));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
  
  public function get($opentokID)
  {
    try {
      $this->load->model("Session_model", "session");
      $this->session->load($opentokID);
      $this->load->view("session_view", array("session" => $this->session));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
	
}
?>