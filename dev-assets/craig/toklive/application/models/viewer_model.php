<?php

class Viewer_model extends CI_Model {
    
    function __construct()
    {
        parent::__construct();
    }
    
    public function join($opentokID, $handle) 
    { 
      
      // Check for maximum connections
      $maxParticipants = 50;
      $sql = "SELECT id FROM  `viewer` WHERE sessionID = ( SELECT ID FROM `session` WHERE  `opentokID` =  ? )";
      $query = $this->db->query($sql, array($opentokID));
      $results = $query->result_array();
      $count = count($results);
      
      log_message("debug", "Found ".$count." viewers in the session ".$opentokID);
      
      if ($count < $maxParticipants) {
        // Complex subquery -- can't use ActiveRecord
        $sql = "INSERT INTO `viewer` (`id` ,`handle` ,`sessionID`)VALUES (NULL ,  ?,  (SELECT ID FROM `session` WHERE `opentokID` = ?))";
        $this->db->query($sql, array($handle, $opentokID));
        
        log_message("debug", "Inserting viewer ".$handle." into session ".$opentokID);
         // Deal with error state.
        if ($this->db->_error_number() == 1048) {
          throw new Exception ("Session does not exist with opentokID ".$opentokID);
        }
        else if ($this->db->_error_number() != 0) {
          throw new Exception ($this->db->_error_message());
        }
      }
      else {
        throw new Exception ("Maximum number of viewers reached for session.");
      }
    }
    
    public function leave($opentokID, $handle)
    {
      // Remove viewer from session
      $this->db->delete('viewer', array('handle' => $handle)); 
      
      log_message("debug", "Deleting ".$this->db->affected_rows()." viewers.");
      
      // Deal with error state.
      if ($this->db->_error_number() != 0) {
        throw new Exception ($this->db->_error_message());
      }
      else if ($this->db->affected_rows() < 1) {
        throw new Exception ("No viewer found with handle ".$handle.".  Are you sure this session (".$opentokID.") exists?");
      }    
    }
}

?>