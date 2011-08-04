<?php
class Participant extends CI_Controller {
	
  public function join($opentokID, $handle)
  {
    try {
      $this->load->model("Participant_model", "participant");
      $this->participant->join($opentokID, $handle);
      $this->load->view("user_view", array("session" => $this->participant->sessionName));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
  
  public function leave($opentokID, $handle)
  {
    try {
      $this->load->model("Participant_model", "participant");
      $this->participant->leave($opentokID, $handle);
      $this->load->view("user_view", array("session" => $this->participant->sessionName));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
	
}
?>