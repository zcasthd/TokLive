-- phpMyAdmin SQL Dump
-- version 3.2.0.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 23, 2011 at 11:39 AM
-- Server version: 5.1.37
-- PHP Version: 5.2.11

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `toklive`
--

-- --------------------------------------------------------

--
-- Table structure for table `participant`
--

DROP TABLE IF EXISTS `participant`;
CREATE TABLE `participant` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `handle` varchar(50) NOT NULL,
  `sessionID` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `handle` (`handle`),
  KEY `session` (`sessionID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=18 ;

--
-- Dumping data for table `participant`
--

INSERT INTO `participant` VALUES(3, 'cschlegelmilch', 419);
INSERT INTO `participant` VALUES(4, 'tanyacamp', 419);
INSERT INTO `participant` VALUES(17, 'bill', 427);

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `opentokID` varchar(100) NOT NULL,
  `name` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=428 ;

--
-- Dumping data for table `session`
--

INSERT INTO `session` VALUES(419, 'OT2345', 8);
INSERT INTO `session` VALUES(427, 'OT2346', 3);

-- --------------------------------------------------------

--
-- Table structure for table `viewer`
--

DROP TABLE IF EXISTS `viewer`;
CREATE TABLE `viewer` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `handle` varchar(50) NOT NULL,
  `sessionID` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `handle` (`handle`),
  KEY `sessionID` (`sessionID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=18 ;

--
-- Dumping data for table `viewer`
--

INSERT INTO `viewer` VALUES(17, 'elsa', 427);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `participant`
--
ALTER TABLE `participant`
  ADD CONSTRAINT `FK_session` FOREIGN KEY (`sessionID`) REFERENCES `session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `session` FOREIGN KEY (`sessionID`) REFERENCES `session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `viewer`
--
ALTER TABLE `viewer`
  ADD CONSTRAINT `viewer_ibfk_1` FOREIGN KEY (`sessionID`) REFERENCES `session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
