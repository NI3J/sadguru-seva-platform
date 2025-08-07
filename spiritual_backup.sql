-- MySQL dump 10.13  Distrib 5.7.42, for Linux (i686)
--
-- Host: localhost    Database: spiritual_db
-- ------------------------------------------------------
-- Server version	5.7.42-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `authorized_admins`
--

DROP TABLE IF EXISTS `authorized_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `authorized_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authorized_admins`
--

LOCK TABLES `authorized_admins` WRITE;
/*!40000 ALTER TABLE `authorized_admins` DISABLE KEYS */;
INSERT INTO `authorized_admins` VALUES (1,'Nitin','9552271965');
/*!40000 ALTER TABLE `authorized_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bhaktgan`
--

DROP TABLE IF EXISTS `bhaktgan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bhaktgan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 DEFAULT NULL,
  `seva_interest` mediumtext COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name_email` (`name`,`email`),
  UNIQUE KEY `bhaktgan_unique_entry` (`name`,`email`,`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bhaktgan`
--

LOCK TABLES `bhaktgan` WRITE;
/*!40000 ALTER TABLE `bhaktgan` DISABLE KEYS */;
INSERT INTO `bhaktgan` VALUES (12,'Pratiksha Jadhav','pratikshasuryawanshi1994@gmail.com','9588437122','Rangoli kadhne','Pune','2025-07-21 16:30:04'),(18,'Nitin Jadhav','jadhavnitin75@gmail.com','9552271965','Ashram seva','Pune','2025-07-25 13:44:34');
/*!40000 ALTER TABLE `bhaktgan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_details`
--

DROP TABLE IF EXISTS `contact_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_contact_entry` (`name`,`phone`,`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_details`
--

LOCK TABLES `contact_details` WRITE;
/*!40000 ALTER TABLE `contact_details` DISABLE KEYS */;
INSERT INTO `contact_details` VALUES (1,'Nitin','jadhavnitin75@gmail.com',NULL,'धन्यवाद','2025-07-21 07:07:15'),(4,'Nitin','jadhavnitin75@gmail.com','9552271965','Hi','2025-07-21 09:03:52');
/*!40000 ALTER TABLE `contact_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_programs`
--

DROP TABLE IF EXISTS `daily_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_programs`
--

LOCK TABLES `daily_programs` WRITE;
/*!40000 ALTER TABLE `daily_programs` DISABLE KEYS */;
INSERT INTO `daily_programs` VALUES (7,'2025-07-27','आज बाबा बद्रिनाथ धामचे दर्शन करुन परत लातुरला आले त्यानिमित्त आज रात्री ०७ वाजता बोपला येथे स्नेह भोजनाचा कार्यक्रम आयोजीत केला आहे.','Nitin'),(8,'2025-07-28','आज श्रावण महिण्यातला पहीला सोमवार आसल्यामुळे बाबा महादेवाची भक्ती करीत आहेत.','Nitin'),(9,'2025-07-30','आज प.पु.बाबजी आश्रमात आहेत ज्या भक्तांना दर्शन घ्यायचे आहे त्यांनी यावे.','Nitin'),(10,'2025-07-30','आज काही कार्यक्रम नाही','Nitin');
/*!40000 ALTER TABLE `daily_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sadguru_thoughts`
--

DROP TABLE IF EXISTS `sadguru_thoughts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sadguru_thoughts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `added_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sadguru_thoughts`
--

LOCK TABLES `sadguru_thoughts` WRITE;
/*!40000 ALTER TABLE `sadguru_thoughts` DISABLE KEYS */;
INSERT INTO `sadguru_thoughts` VALUES (1,'सेवा म्हणजेच अध्यात्माचे मूळ आहे.','2025-07-22 15:50:14'),(2,'बे वजह किसी पर अधिकार जमाने का प्रयत्न ना करो||\n आपका उतना समर्पण होगा तो अधिकार भी अपने आप सिध्द होगा.','2025-07-23 05:52:48'),(3,'सब को एक दोरे मे बांधते-बांधते शरीर पुरी तरह थक चुका है|\n अब डर लगता है कही डोरी तुटते ही सब बीखर न जाये.','2025-07-23 06:11:26'),(4,'हे महादेव! सब चीज हाशील है दुनिया की मुझे\n बस अब तुमसे एकरुप होने की तमन्ना है मुझे','2025-07-23 06:11:26'),(5,'प्रत्येक व्यक्ती अपने अपने कार्यक्षेत्र मे अपने\n कर्तव्य को पुरी निष्ठा से बरकरार रखे||','2025-07-23 06:11:26'),(6,'सब को एक दोरे मे बांधते-बांधते शरीर पुरी तरह थक चुका है|\n अब डर लगता है कही डोरी तुटते ही सब बीखर न जाये.','2025-07-24 14:31:35'),(7,'हे महादेव! सब चीज हाशील है दुनिया की मुझे\n बस अब तुमसे एकरुप होने की तमन्ना है मुझे','2025-07-24 14:31:35'),(8,'प्रत्येक व्यक्ती अपने अपने कार्यक्षेत्र मे अपने\n कर्तव्य को पुरी निष्ठा से बरकरार रखे||','2025-07-24 14:31:35');
/*!40000 ALTER TABLE `sadguru_thoughts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wisdom_quotes`
--

DROP TABLE IF EXISTS `wisdom_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wisdom_quotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote` text NOT NULL,
  `author` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wisdom_quotes`
--

LOCK TABLES `wisdom_quotes` WRITE;
/*!40000 ALTER TABLE `wisdom_quotes` DISABLE KEYS */;
INSERT INTO `wisdom_quotes` VALUES (1,'Yoga is the journey of the self, through the self, to the self.','Bhagavad Gita'),(2,'Responsibility is the highest form of action.','Sadhguru'),(3,'Silence isn’t empty — it’s full of answers.','Anonymous');
/*!40000 ALTER TABLE `wisdom_quotes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-30 12:24:45
