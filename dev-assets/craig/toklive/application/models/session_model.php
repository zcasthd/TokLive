<?php

class Session_model extends CI_Model {

    var $opentokID;
    var $name;
    var $participants;
    var $viewers;
    
    function __construct()
    {
        parent::__construct();
    }
    
    public function fill($row, $participants, $viewers) 
    {
      $this->opentokID = $row->opentokID;
      $this->name = $row->name;
      
      $this->participants = $participants;
      $this->viewers = $viewers; 
    }
    
    public function load($opentokID)
    {
      $sessionID = -1;
      $query = $this->db->get_where("session", array("opentokID" => $opentokID));
      if ($query->num_rows() == 1)
      {
          $row = $query->row(1);
          $this->opentokID = $row->opentokID;
          $this->name = $row->name;
          $sessionID = $row->id;
      }
      else
      {
        // Error condition.  Deal with it.
        throw new Exception ("Enable to find session with opentokID.");
      }
      
      $query = $this->db->get_where("viewer", array("sessionID" => $sessionID));
      $this->viewers = array();
      foreach ($query->result() as $row)
      {
          array_push($this->viewers, $row->handle);
      }
      
      $query = $this->db->get_where("participant", array("sessionID" => $sessionID));
      $this->participants = array();
      foreach ($query->result() as $row)
      {
          array_push($this->participants, $row->handle);
      }
    }
    
    public function create($opentokID)
    {
      $maxSessionCount = 10;
      
      // Check for full session set
      if ($this->db->count_all("session") >= $maxSessionCount)
      {
        throw new Exception ("Maximum number of sessions reached.");
      }
      log_message("debug", "No session max reached");
      
      // Check for existing session
      $this->db->where("opentokID", $opentokID);
      if ($this->db->count_all_results("session") > 0)
      {
        throw new Exception ("Session already exists with opentokID ".$opentokID);
      }
      
      log_message("debug", "Creating new session.");
      
      // Populate session information
      $this->opentokID = $opentokID;   
      
      // Asign a number
      do {
        $this->name = rand(1, $maxSessionCount);         
        $data = array(
           "opentokID" => $this->opentokID ,
           "name" => $this->name
        );
        
        log_message("debug", "Attempting assignment of session number: ".$this->name);

        
        $this->db->insert("session", $data);
      }
      while ($this->db->_error_number() == 1062);
      
      log_message("debug", "Successfully assigned session number: ".$this->name);
      
      // Deal with error state.
      if ($this->db->_error_number() != 0) {
        throw new Exception ($this->db->_error_message());
      }
    }
}

?>