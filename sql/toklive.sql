-- phpMyAdmin SQL Dump
-- version 3.2.0.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 31, 2011 at 10:50 PM
-- Server version: 5.1.37
-- PHP Version: 5.2.11

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

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
  `handle` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `sessionID` bigint(20) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session` (`sessionID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=51 ;

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `opentokID` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name` bigint(20) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=438 ;

-- --------------------------------------------------------

--
-- Table structure for table `viewer`
--

DROP TABLE IF EXISTS `viewer`;
CREATE TABLE `viewer` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `handle` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `sessionID` bigint(20) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionID` (`sessionID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
