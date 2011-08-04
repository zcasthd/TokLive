<?php

class Session_set_model extends CI_Model {

    var $sessions;
        
    function __construct()
    {
        parent::__construct();
    }

    //  Cache these?
    public function getAll()
    {
      $this->sessions = array();
      $query = $this->db->get("session");
      foreach ($query->result() as $row)
      {   
          $session = array();
          $session["opentokID"] = $row->opentokID;
          $session["name"] = $row->name;
       
          log_message("debug", "Loading session: ". $row->opentokID);
          
          $this->db->select("handle");
          $results = $this->db->get_where("participant", array("sessionID" => $row->id));
          $participants = array();
          log_message("debug", "Loading participant list for: ". $row->opentokID);
          foreach($results->result() as $handle) {
            array_push($participants, $handle->handle);
          }
          $session["participants"] = $participants;

                                        
          $this->db->select("handle");
          $results = $this->db->get_where("viewer", array("sessionID" => $row->id));
          $viewers = array();
          log_message("debug", "Loading viewer list for: ". $row->opentokID);
          foreach($results->result() as $handle) {
            array_push($viewers, $handle->handle);
          }
          $session["viewers"] = $viewers;

          array_push($this->sessions, $session);
      }
      
      // Deal with error state.
      if ($this->db->_error_number() != 0) {
        throw new Exception ($this->db->_error_message());
      }
      
    }
}

?>