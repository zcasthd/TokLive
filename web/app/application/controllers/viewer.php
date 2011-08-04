<?php
class Viewer extends CI_Controller {
	
  public function join($opentokID, $handle)
  {
    try {
      $this->load->model("Viewer_model", "viewer");
      $this->viewer->join($opentokID, $handle);
      $this->load->view("user_view", array("session" => $this->viewer->sessionName));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
  
  public function leave($opentokID, $handle)
  {
    try {
      $this->load->model("Viewer_model", "viewer");
      $this->viewer->leave($opentokID, $handle);
      $this->load->view("user_view", array("session" => $this->viewer->sessionName));
    }
    catch(Exception $e) {
      $this->load->view("error_view", array("e" => $e));
    }
  }
	
}
?>