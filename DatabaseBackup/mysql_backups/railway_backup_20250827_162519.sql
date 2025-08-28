-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: shortline.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `railway`
--

CREATE DATABASE IF NOT EXISTS `railway_local` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `railway_local`;

--
-- Table structure for table `authorized_admins`
--

DROP TABLE IF EXISTS `authorized_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authorized_admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bhaktgan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seva_interest` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name_email` (`name`,`email`),
  UNIQUE KEY `bhaktgan_unique_entry` (`name`,`email`,`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bhaktgan`
--

LOCK TABLES `bhaktgan` WRITE;
/*!40000 ALTER TABLE `bhaktgan` DISABLE KEYS */;
INSERT INTO `bhaktgan` VALUES (38,'Nitin Sandipan Jadhav','jadhavnitin75@gmail.com','09552271965','Ashram seva','Pune','2025-08-07 12:53:38'),(41,'Rameshwar parekar ','parekarrameshwar03@gmail.com','8793056601','Guru seva ','Latur','2025-08-14 15:45:59');
/*!40000 ALTER TABLE `bhaktgan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_details`
--

DROP TABLE IF EXISTS `contact_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_programs`
--

LOCK TABLES `daily_programs` WRITE;
/*!40000 ALTER TABLE `daily_programs` DISABLE KEYS */;
INSERT INTO `daily_programs` VALUES (12,'2025-07-30','आज मौजे टाकळी(जेवळी) येथे काळभैरव नाथ मंदिरात मुर्ती प्राणप्रतिष्ठा सोहळ्याच्या आयोजना निमित्त सायंकाळी ७ वाजता ग्रामस्थ टाकळी व परिसरातील भक्ताच्या उपस्थितीत नियोजन मिटींग होणार आहे.ज्यांना शक्य आहे त्या गुरुबंधु नी सायंकाळी ७ वाजता टाकळी येथे हजर राहावे.','Nitin'),(13,'2025-07-30','आज मौजे टाकळी(जीवळी) येथे कालभैरवनाथ मंदिरात मुर्ती प्राणप्रतिष्ठा सोहळ्यानिमित्त प.पु.गुरुदेव मार्गदर्शन करीत आहेत.','Nitin'),(14,'2025-08-07','आज प.पु.बाबाजी बोपला आश्रमात आहेत ज्या भक्तांना दर्शन घ्यायचे आहे त्यांनी यावे.','Nitin'),(19,'2025-08-07','आज जगतमाता गोशाळा(वडवळ जानवळ) येथे प.पु.गुरुदेव बाबांच्या मार्गदर्शनात गोशाळेच्या व्यवस्थापनाची मिटींग पार पडली. त्या प्रसंगी ह.भ.प.गोविंद महाराज,श्री ह.भ.प. बळीराम महाराज,बाबा माने महाराज,गिरी महाराज,यज्ञकांत महाराज सर्वांनी बाबांची पाद्यपुजा करुन आशीर्वाद घेतला.','Nitin'),(20,'2025-08-08','आज टाकळी जीवळी येथील भक्तांनी विकास मार्ट 5नंबर चौक लातूर येथे येऊन बाबांची भेट घेऊन टाकळी येथे 21नोव्हेम्बर2025  पासून प्रारंभ होणाऱ्या महायज्ञाच्या संदर्भात मार्गदर्शन घेतले.','Nitin'),(21,'2025-08-14','आज बाबा आश्रमात आहेत ज्या भक्तांना दर्शन घ्यायचे आहे त्यांनी दर्शन घ्यावे.','Nitin'),(22,'2025-08-14',' ततो रुद्र प्रचोदितात ||  \r\n🕉️ || सत्य संकल्पाचा दाता नारायण ||\r\n\r\n📅 उद्य दि. 15 ऑगष्ट 2025 रोजी  \r\n📍 श्री राधाकृष्ण मंदिर, गातेगाव येथे  \r\n🙏 श्री कृष्ण जन्माष्टमी निमित्त प.पू. बाबाजी\r\n\r\n🕑 दुपारी 2 वाजेपासून  \r\nप.पू. बाबाजी गातेगाव येथील मंदिरात उपस्थित राहणार आहेत.\r\n\r\n🌙 रात्री 10 ते 12 वाजता  \r\nया ठिकाणी प.पू. बाबांचे प्रवचन होईल  \r\n🎉 जन्माष्टमीचा कार्यक्रम होईल  \r\n🪔 नंतर आरती व प्रसाद होईल\r\n\r\n📣 तरी आपण सर्वांनी सायंकाळी 4 वाजेपासूनच हजर राहावे  \r\nही बाबांची आज्ञा आहे.','Nitin'),(32,'2025-08-23','आज काही कार्यक्रम नाही','Nitin');
/*!40000 ALTER TABLE `daily_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `japa_daily_counts`
--

DROP TABLE IF EXISTS `japa_daily_counts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `japa_daily_counts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `japa_date` date NOT NULL,
  `total_rounds` int DEFAULT '0',
  `total_words` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`japa_date`),
  KEY `idx_user_date` (`user_id`,`japa_date`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `japa_daily_counts`
--

LOCK TABLES `japa_daily_counts` WRITE;
/*!40000 ALTER TABLE `japa_daily_counts` DISABLE KEYS */;
INSERT INTO `japa_daily_counts` VALUES (1,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-25',3,48,'2025-08-25 15:59:16','2025-08-25 16:05:34'),(4,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-26',16,256,'2025-08-26 05:18:26','2025-08-26 15:26:41'),(20,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-27',5,80,'2025-08-27 08:57:08','2025-08-27 09:00:33'),(25,'1','2025-08-27',15,240,'2025-08-27 15:57:39','2025-08-27 16:19:38');
/*!40000 ALTER TABLE `japa_daily_counts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `japa_sessions`
--

DROP TABLE IF EXISTS `japa_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `japa_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_start` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_count` int DEFAULT '0',
  `current_word_index` int DEFAULT '1',
  `session_active` tinyint(1) DEFAULT '1',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `session_end` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_active` (`user_id`,`session_active`),
  KEY `idx_session_start` (`session_start`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `japa_sessions`
--

LOCK TABLES `japa_sessions` WRITE;
/*!40000 ALTER TABLE `japa_sessions` DISABLE KEYS */;
INSERT INTO `japa_sessions` VALUES (2,'0e73432f-f6f6-4a20-ba1c-08712fb55c1b','2025-08-25 14:17:41',0,1,1,'2025-08-25 14:17:41',NULL),(3,'ac0c216c-0d89-44ea-b7fa-68f65e31a5cb','2025-08-25 14:18:49',0,1,1,'2025-08-25 14:18:49',NULL),(4,'96d2888a-fe36-4a78-b277-0d74ea1b9be8','2025-08-25 14:29:48',0,1,0,'2025-08-25 14:30:07',NULL),(5,'96d2888a-fe36-4a78-b277-0d74ea1b9be8','2025-08-25 14:30:19',0,1,0,'2025-08-25 14:30:31',NULL),(6,'6b00f449-b390-42f7-a309-6b2fff82eb90','2025-08-25 14:32:45',0,1,0,'2025-08-25 14:33:14',NULL),(7,'6b00f449-b390-42f7-a309-6b2fff82eb90','2025-08-25 14:33:41',0,1,0,'2025-08-25 14:34:03',NULL),(8,'b97c1940-3c5f-47ea-b10b-55c5d7f45c8c','2025-08-25 15:29:21',0,1,1,'2025-08-25 15:29:21',NULL),(9,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-25 15:54:07',280,9,0,'2025-08-26 15:24:33','2025-08-26 15:24:33'),(10,'03cad57e-eda6-4964-a9e1-66cf6542b684','2025-08-26 03:46:01',0,1,0,'2025-08-26 04:40:55','2025-08-26 04:40:55'),(11,'03cad57e-eda6-4964-a9e1-66cf6542b684','2025-08-26 04:52:50',0,1,0,'2025-08-26 04:52:52','2025-08-26 04:52:52'),(12,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-26 15:24:46',17,2,0,'2025-08-26 15:25:51','2025-08-26 15:25:51'),(13,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-26 15:25:52',18,3,0,'2025-08-26 15:27:07','2025-08-26 15:27:07'),(14,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-26 15:27:56',17,2,0,'2025-08-27 08:57:16','2025-08-27 08:57:16'),(15,'434cb128-1473-408f-8f6c-6a98fcd6dd48','2025-08-27 04:23:46',0,1,1,'2025-08-27 04:23:46',NULL),(16,'b155e62b-38da-4c35-8711-6f8f5b0426b8','2025-08-27 08:57:18',69,6,1,'2025-08-27 09:00:53',NULL),(17,'1','2025-08-27 15:00:47',0,1,0,'2025-08-27 15:00:50','2025-08-27 15:00:50'),(18,'1','2025-08-27 15:01:22',0,1,0,'2025-08-27 15:01:24','2025-08-27 15:01:24'),(19,'1','2025-08-27 15:01:35',0,1,0,'2025-08-27 15:01:36','2025-08-27 15:01:36'),(20,'1','2025-08-27 15:01:56',0,1,0,'2025-08-27 15:01:58','2025-08-27 15:01:58'),(21,'1','2025-08-27 15:03:04',0,1,0,'2025-08-27 15:03:06','2025-08-27 15:03:06'),(22,'1','2025-08-27 15:56:13',11,12,0,'2025-08-27 15:56:37','2025-08-27 15:56:37'),(23,'1','2025-08-27 15:56:58',97,2,0,'2025-08-27 16:01:07','2025-08-27 16:01:07'),(24,'1','2025-08-27 16:04:26',97,2,0,'2025-08-27 16:09:13','2025-08-27 16:09:13'),(25,'1','2025-08-27 16:09:37',45,14,0,'2025-08-27 16:11:49','2025-08-27 16:11:49'),(26,'1','2025-08-27 16:16:27',5,6,0,'2025-08-27 16:16:52','2025-08-27 16:16:52'),(27,'1','2025-08-27 16:17:11',28,13,0,'2025-08-27 16:20:52','2025-08-27 16:20:52'),(28,'1','2025-08-27 16:20:53',11,12,0,'2025-08-27 16:21:41','2025-08-27 16:21:41');
/*!40000 ALTER TABLE `japa_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `krasha_jap`
--

DROP TABLE IF EXISTS `krasha_jap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `krasha_jap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `word_order` int NOT NULL,
  `word_devanagari` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `word_english` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `word_order` (`word_order`),
  KEY `idx_word_order` (`word_order`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `krasha_jap`
--

LOCK TABLES `krasha_jap` WRITE;
/*!40000 ALTER TABLE `krasha_jap` DISABLE KEYS */;
INSERT INTO `krasha_jap` VALUES (1,1,'राधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(2,2,'कृष्णा','krishna','2025-08-25 16:14:33','2025-08-25 16:14:33'),(3,3,'राधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(4,4,'कृष्णा','krishna','2025-08-25 16:14:33','2025-08-25 16:14:33'),(5,5,'कृष्णा','krishna','2025-08-25 16:14:33','2025-08-25 16:14:33'),(6,6,'कृष्णा','krishna','2025-08-25 16:14:33','2025-08-25 16:14:33'),(7,7,'राधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(8,8,'राधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(9,9,'ऱाधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(10,10,'श्याम','shyam','2025-08-25 16:14:33','2025-08-26 05:59:00'),(11,11,'राधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(12,12,'श्यामा','shyama','2025-08-25 16:14:33','2025-08-26 05:59:16'),(13,13,'श्याम','shyam','2025-08-25 16:14:33','2025-08-26 05:59:00'),(14,14,'श्यामा','shyama','2025-08-25 16:14:33','2025-08-26 05:59:16'),(15,15,'ऱाधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33'),(16,16,'ऱाधे','radhe','2025-08-25 16:14:33','2025-08-25 16:14:33');
/*!40000 ALTER TABLE `krasha_jap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_storage`
--

DROP TABLE IF EXISTS `otp_storage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_storage` (
  `mobile` varchar(10) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expiry` datetime NOT NULL,
  `attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_sms_sent` timestamp NULL DEFAULT NULL,
  `sms_count_today` int DEFAULT '0',
  `last_sms_date` date DEFAULT NULL,
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_storage`
--

LOCK TABLES `otp_storage` WRITE;
/*!40000 ALTER TABLE `otp_storage` DISABLE KEYS */;
INSERT INTO `otp_storage` VALUES ('9552271965','814622','2025-08-26 16:41:55',0,'2025-08-26 16:36:57',NULL,0,NULL),('9588437122','140374','2025-08-26 16:43:32',0,'2025-08-26 16:38:33','2025-08-26 16:38:38',1,'2025-08-26');
/*!40000 ALTER TABLE `otp_storage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sadguru_thoughts`
--

DROP TABLE IF EXISTS `sadguru_thoughts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sadguru_thoughts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `added_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sadguru_thoughts`
--

LOCK TABLES `sadguru_thoughts` WRITE;
/*!40000 ALTER TABLE `sadguru_thoughts` DISABLE KEYS */;
INSERT INTO `sadguru_thoughts` VALUES (1,'सेवा म्हणजेच अध्यात्माचे मूळ आहे.','2025-07-22 15:50:14'),(2,'बे वजह किसी पर अधिकार जमाने का प्रयत्न ना करो||\n आपका उतना समर्पण होगा तो अधिकार भी अपने आप सिध्द होगा.','2025-07-23 05:52:48'),(3,'सब को एक दोरे मे बांधते-बांधते शरीर पुरी तरह थक चुका है|\n अब डर लगता है कही डोरी तुटते ही सब बीखर न जाये.','2025-07-23 06:11:26'),(4,'हे महादेव! सब चीज हाशील है दुनिया की मुझे\n बस अब तुमसे एकरुप होने की तमन्ना है मुझे','2025-07-23 06:11:26'),(5,'प्रत्येक व्यक्ती अपने अपने कार्यक्षेत्र मे अपने\n कर्तव्य को पुरी निष्ठा से बरकरार रखे||','2025-07-23 06:11:26'),(6,'सब को एक दोरे मे बांधते-बांधते शरीर पुरी तरह थक चुका है|\n अब डर लगता है कही डोरी तुटते ही सब बीखर न जाये.','2025-07-24 14:31:35'),(7,'हे महादेव! सब चीज हाशील है दुनिया की मुझे\n बस अब तुमसे एकरुप होने की तमन्ना है मुझे','2025-07-24 14:31:35'),(8,'प्रत्येक व्यक्ती अपने अपने कार्यक्षेत्र मे अपने\n कर्तव्य को पुरी निष्ठा से बरकरार रखे||','2025-07-24 14:31:35'),(9,'आपके \"पुरुषार्थ\" के बल से सब कुछ प्राप्त करणे की क्षमता रखो ||,\nचालाखी से प्राप्त कि हुई कोई भी चीज आपको अंतिम समय पर आनंद नही दे सकती||,\nWith the strength of your \"effort\",\nyou have the ability to achieve everything,\nAnything obtained through cunning will not bring you joy in the end.','2025-08-07 12:27:32'),(10,'ज्यादा तर लोग अपनी \"बेवकुबी\" से नही बल्की जरुरत से ज्यादा \"चालाखी\" करणे से ही फस जाते है||\nMost people get caught not because of their \"foolishness\",\nbut rather due to being overly \"cunning\" out of necessity','2025-08-07 12:32:59'),(11,'जीवन मे अच्छा सिद्धांन्त अगर अपने प्राप्त किया, तो वही सुत्र आपके लिए मित्र का कार्य करते है,\nऔर आगे चलकर वहि आपके \"नेत्र\" बनकर आपको दिशा भी देते है||\nIf you have achieved good principles in life, \nthose principles act as friends for you, \nand later on, they become your \"eyes\" and guide you in the right direction.','2025-08-07 12:38:26'),(12,'ज्यादा तर लोग बुढापे तक जीवन का प्रवाह समज नही पाये,\nऔर किसी ने जवानी मे दुनिया परख ली| अनुभुती उम्र की मोहताज नही होती||\nMost people do not understand the flow of life until old age, \nand some have understood the world in their youth. Experience is not dependent on age.','2025-08-07 12:42:19');
/*!40000 ALTER TABLE `sadguru_thoughts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `satsang`
--

DROP TABLE IF EXISTS `satsang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `satsang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_number` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_en` text COLLATE utf8mb4_unicode_ci,
  `author` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `marathi_content` text COLLATE utf8mb4_unicode_ci,
  `english_content` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_number` (`page_number`),
  KEY `date_index` (`date`),
  KEY `active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `satsang`
--

LOCK TABLES `satsang` WRITE;
/*!40000 ALTER TABLE `satsang` DISABLE KEYS */;
INSERT INTO `satsang` VALUES (2,1,'शुभ कर्म व अशुभ कर्म',' जीवनात मनुष्यांच्या हातून शुभ व अशुभ कर्म कळत नकळत होत असते. त्याचे फळ देखील त्या कर्मा बरोबरच जोडलेले आहे. शुभ कर्म/ छान कर्म केल्याने त्याचे फळ ह्याच जीवनात मिळतें, तुम्हास सुखी जीवन प्राप्त होते. तसेच अशुभ कर्म केल्याने त्याचे फळ देखील ह्याच जीवनात भोगावे लागते. कर्म करावयास परमेश्वराने सर्व जीवास स्वतंत्रता दिली आहे. कर्मा प्रमाणे सर्वांना फळ ह्याच जीवनात मिळते. त्यात परमेश्वराचे अजिबात हस्तक्षेप नसते. तुम्ही देवासमोर कितीही प्रार्थना करा कर्मा प्रमाणे फळ लागूनच असते व ते भोगावेच लागते. पुण्य, शुभ कर्म केल्याने मिळते व त्याचे फळ म्हणून सुखी जीवन प्राप्त होते. हिंदू सनातन धर्मात एक कुटुंबास फार महत्व दिले आहे, तसेच एक पत्नीव्रत /सतिवृता असणे फार आवश्यक व अध्यत्मिक दृष्टीने अतिशय महत्वाचे आहे. जर कुटुंबा पैकी कोणीही व्यक्ती बाह्य अनैतिक संबंध ठेवले तर त्या माध्यमातून त्या कुटुंबात पाप कर्म आपोआपच संचित/ हस्तांतरीत होतात व त्याचे परिणाम त्या कुटुंबास भोगावे लागतात. हया कारणाने हिंदू धर्मात एक पत्नीव्रत/सतिवृत असणे फार आवश्यक आहे. नसता त्याचे परिणाम दुखदायी असतात. सद्गुरूंनी स्पष्टपने सांगितल आहे की पर-स्त्री पासून सावधान असावे त्याचे कारणं म्हणजे, परस्त्रीसी संबंध ठेवल्याने त्या व्यक्तीचे सर्व पापकर्म नकळत आपोआपच हस्तांतरित होतात. त्याचे फळ त्या पुरुषास व स्त्रीस भोगावे लागतात. म्हणूनच राम ऊत्तम परम पुरूष संबोधिले जातात कारणं ते शेवट पर्यंत एक पत्नीव्रत होतें. अध्यत्मात उच्चतम शिखर गाठण्यासाठी एक पत्नीव्रत असणे फार आवश्यक आहे. हेच ब्रह्मचर्य आहे. तसेच गुरुशी देखील एकनिष्टता असणे फार आवश्यक आहे तरच तुमची आत्मप्रगती होते व शेवटच्या क्षणी आत्म्दर्शन/ परमेश्वराचे दर्शन घडते. स्वतःच्या आत्म्यावर निष्ठा असणे अती आवश्यक आहे, तरच परमेश्वराचे दर्शन घडते. सद्गुरू कडे मनुष्य ह्याच उद्देशाने जातो की त्यांच्या आशिर्वादाने सर्व पाप कर्म शुद्ध व्हावे म्हणून. सद्गुरू आपल्या योग शक्तीने, ध्यान अग्निने भक्तांचे सर्व दुःख पापाचे निवारण करतात. चित्त शुध्दी होऊन नंतर आत्म्प्रगती साठी आम्ही योग्य होतो. जेंव्हा आम्ही त्यांचें चरण स्पर्श करतो त्यासंग आमचे सर्व अवगुण सद्गुरू स्वीकार करून ते आशिर्वाद रूपाने आमचं अंतःकरण शुद्ध करून टाकतात. जगात सद्गुरुंचे स्थान हे एकच आहे जेथे तुमचे सर्व कर्म शुद्ध होऊन अध्यात्मात व संसारात प्रगति करू शकतो. हया व्यतिरिक्त दुसरें स्थान जे आहेत ते फक्त संसारातील इच्छा पूर्ण करण्यासाठी ',' In life, humans unknowingly perform both good and bad deeds. The fruits of these deeds are intertwined with them. Good deeds yield their rewards in this very life, leading to a happy existence, while bad deeds also have consequences that must be endured in this life. God has granted all living beings the freedom to act, and everyone receives rewards appropriate to their deeds in this life; there is no divine interference in this. No matter how much you pray to God, the results are tied to your actions, and you must experience them. Merit and happiness come from performing good deeds. In Hindu Sanatan Dharma, great importance is placed on the concept of family, and being devoted to one’s wife is considered essential and profoundly significant from a spiritual perspective. If any member of the family engages in unethical external relationships, the sins naturally accumulate or transfer within that family, and its members have to face the consequences. For this reason, it is crucial to uphold the principle of having a single wife or being devoted to one’s spouse in Hinduism; otherwise, the results can be unfortunate. The Satguru (spiritual teacher) has clearly stated that one must be cautious around other women, because engaging with them can unknowingly result in all of one’s sins transferring. The outcomes of these actions must be experienced by both the man and the woman. Hence, Rama is referred to as the supreme person, as he adhered to the vow of a single wife until the end. To reach the highest peak in spirituality, being committed to one wife is essential; this is also the essence of Brahmacharya (celibacy). Moreover, having unwavering faith in the Guru is necessary for personal progress, allowing for a vision of the Self or God in the end. Dedication to one’s own soul is critically important, as this leads to the realization of God. People approach the Satguru with the intention that through their blessings, all sins may be purified. The Satguru, through their yogic powers and the fire of meditation, alleviates all the devotees\' pains and sins. Once the mind is purified, we become eligible for spiritual progress. When we touch their feet, the Satguru accepts all our flaws and purifies our inner selves through their blessings. In this world, the place of the Satguru is unique, where all your deeds can be cleansed, allowing progress in spirituality and worldly matters. Besides this, other places exist only for the fulfillment of worldly desires. 🪷🌺🕉🙏🏻  ','प.पु.श्री.अशोककाका शास्त्री','2025-08-17',1,'2025-08-17 09:55:25','2025-08-17 09:55:25',NULL,NULL),(4,2,'सद्गुरू वाणी','सत्य, सुंदर आणि स्वतंत्र विचार: मनुष्य मनोमय ( विचार मय)  आहे .  तो सर्वथा असाच आहे, जसं त्याचे विचार, मन व अंतःकरण आहे.    विचार, मन व अंतःकरनास  कोणतीही शक्ती परतंत्र करू शकत नाही, जर तो स्वतःहुन परतंत्र होण्याची इच्छा ठेवत नसेल तर.  सुखी, मुक्त होणे व स्वाधीनता दुसऱ्याच्या हातात नसून आपल्याच हाती आहे.  जर तुम्हास खरंच स्वतंत्र होण्याची इच्छा असेल तर आजच तुम्ही स्वतंत्र आहात.  मनुष्य एक मनोमय प्राणी आहे,  जर त्याचे मन, विचार बुध्दी आणि अंतःकरण निष्पक्ष , स्वाधीन आणि स्वतंत्र  असेल तर तो देखील स्वतंत्रच आहे.  संसारात अशी कोणतीच शक्ती नाही जी खऱ्या स्वतंत्र व स्वालंबी पुरुषास दाबू शके.   मनुष्य जो गुलाम बनतो  तो आपल्या विचारानेच.   भारत वासियांना कोण सांगितल की आपल भल्याच काम न करता ईश्वरा समोर  रात्रं दिवस प्रार्थना करीत राहा?  हिंदू मुसलमानच्या ईश्वराने केंव्हा सांगितल की त्यांच्या करीता एकमेका विरुद्ध लढत  रहा?   अमेरिका आणि युरोपीय ह्यांना कोणी सांगितल की तुम्ही धनाचे गुलाम बना?  कोणीच नाही.  मनुष्य स्वतःच आपल्या विचाराने दुःख व संकटात सापडून आहे.   इंग्रजांला आम्ही म्हणू शकतो की आमच्या देशावर बळजबरीने राज्य केलें,  पण आज तुम्हीं शेकडो वर्षांपासून जे मूर्ती, देवतांचे गुलाम बनून आहात किंवा ईश्वरा समोर नत मस्तक होता, असं करावयास कोणी सांगितलं?  का खरंच कोणत्या ईश्वराने,  मुर्तीने व देवांनी सांगितलं की  तुम्हीं आमची गुलामी करा, आह्मास आपले मालक समजा?  का ईश्वराला आमची सेवेची आणि सहायतेची आवश्यकता आहे?  का केंव्हा ईश्वराने सांगितल की सर्व काम सोडुन घंटी वाजवत राहा?   का ईश्वराने केंव्हा सांगितल की आमचं नाम घेउन ढोलकी वाजत नाचत राहा?  का केंव्हा ईश्वराने सांगितल की तुम्ही लोक आह्मस आपल स्वामी, मालक आणि राजा समजून स्वतःला गुलाम समजा?  का ईश्वराने कधी सांगितल की त्यांच्या इच्छे विरुद्ध एक तृण देखील हलू शकत नाही आणि त्यामुळे आळसी व  काम न करता बसून राहा?  केंव्हाच नाही.  असे कांहींच नसून हे सर्व ईश्वराच्या नावावर पुस्तकात लिहून संसार समोर ठेवलं आहे .  हयात ईश्वराच कांहीच दोष नाही. सर्व काही आमच्याच विचाराचं दोष आहे. भारतीय लोकांना रामदास, कृष्ण सेवक आणि गुलाम हुसेन म्हणून घेण्यास फार आनंद होतो.  ते स्वामी मालक बनण्याची इच्छाच ठेवत नाही.   परतंत्राचे भाव प्रथम विचार रुपात मनात निर्माण होतात. नंतर तेच विचार स्थूलास प्राप्त होतात.  सर्व काही विचारावराच अवलंबून असते. जर तुम्ही स्वतंत्र, स्वाधीन व मुक्त होऊ इच्छिता तर आपले विचार बदलून टाका . विचार द्वारा स्वतंत्र व स्वाधीन होण्यास कोणतीच अडचण  नाही.  संसारात अशी कोणतीच शक्ती नाही की  तुमच्या बुध्दीला व स्वतंत्र होण्यास अडथळा आणू शकते.  जर तुम्ही पूर्णतः स्वतंत्र होऊ इच्छिता तर ईश्वराचे देखील गुलाम होऊ नका. गुलामी आणि सेवक भाव कोणासाठेही असो तो मुक्त होऊ शकतं नाही.  डोक्यातून जुने विचार आणि गुलामीचे भाव काढून टाका तर तुम्ही आताच मुक्त आहा.  मुक्तीचे मार्ग हेचं आहे. 🪷🌼🕉️🙏🏻','True, beautiful and independent thought: Man is a mental being (Vichār Maya). He is exactly as his thoughts, mind and heart are. No power can free his thoughts, mind and heart, if he does not want to be free from himself. Happiness, liberation and independence are not in the hands of others but in your own hands. If you really want to be free, then you are free today. Man is a mental being, if his mind, thoughts, intellect and heart are impartial, independent and independent, then he is also free. There is no such power in the world that can suppress a truly independent and self-reliant man. A man becomes a slave only because of his thoughts. Who will tell the people of India that without doing good deeds, you should pray day and night before God? When will the God of Hindus and Muslims tell you to fight against each other for them? Who will tell America and Europeans that you should become slaves of money? No one. Man himself is in trouble and trouble because of his own thoughts. We can say to the British that they ruled our country by force, but who told you to do what you have been doing for hundreds of years, becoming slaves to idols and gods or bowing your heads before God? Which God, idol and gods told you to become our slaves, to consider us your masters? Why does God need our service and help? When will God tell you to leave all your work and keep ringing the bell? When will God tell you to keep dancing and beating drums in our name? When will God tell you to consider yourself as slaves, considering us your masters, owners and kings? When will God tell you that not even a blade of grass can move against his will and therefore you should sit idle and do nothing? Never. There is no such thing, all this has been written in the name of God and placed before the world. There is no fault of the living God. Everything is the fault of our own thoughts. Indians are very happy to be called Ramdas, Krishna as a servant and Hussain as a slave. They do not want to become masters. The feelings of independence are first created in the mind in the form of thoughts. Later those thoughts reach the physical body. Everything depends on thoughts. If you want to be independent, free and liberated, then change your thoughts. There is no problem in becoming independent and liberated through thoughts. There is no such power in the world that can hinder your intelligence and freedom. If you want to be completely free, then do not become a slave of God either. No one can be free from slavery and servanthood. Remove old thoughts and feelings of slavery from your head, then you are already free. This is the path to liberation. 🪷🌼🕉️🙏🏻','प.पु.श्री.अशोककाका शास्त्री','2025-08-18',1,'2025-08-18 10:26:15','2025-08-18 10:26:15',NULL,NULL),(5,3,'स्वप्न सृष्टि:','स्वप्न सृष्टि:   स्वप्नांत आम्ही वेग वेगळे दृश्य, व्यक्ती, प्रसंग, देवी देवतानची मूर्ती , मृत प्रिय व्यक्तींस पाहतो व भेट होते  व सांगतो की आज स्वप्नांत माझे इष्ट देव आले होते, कुटुंबातील प्रीय व्यक्ती येऊन गेलेत, ईत्यादि.  मी मुंबई ला गेलो होतो असे सांगतो.   हयात सत्य काय आहे ते जाणून घेऊ.  पहिली गोष्ट स्वप्नांत आम्ही जे भाव चित्र, देवी देवता किंवा वेग वेगळे चित्र पाहतो, दुसऱ्या देशाला जावून येतो ते सर्व विचार तुमच्या मनात किंवा चित्तात अंकित झालेले असतात. ते वारंवार सदा तेच विचार केल्याने स्वप्नांत तुमचा आत्माच ते सर्व प्रसंग, व्यक्ती, देव ईत्यादि होऊन त्या रुपात  दाखवितो.   जागे झाल्या नंतर तुम्ही सांगता की मी स्वप्नांत हे हे पाहिले.  स्वप्नांत तुम्हीं जे जे पाहता ते सर्व तुमचा आत्माच  तेवढे रूप घेऊन करून दाखवितो.  त्यात तुमच आत्मशक्तीच खर्च होतो.  म्हणुन ज्याना स्वप्न पडतात ते उठल्या नंतर फ्रेश उत्साही नसतात.  ज्यांना गाढ झोप ( स्वप्न नसलेली झोप ) येते ते उठल्या नंतर ताजे टव टवित दिसतात.  त्यांच्यात भरपूर उत्साह असतो.   तर जे स्वप्नांत पाहतो ते सर्व असत्य आहे.  त्यास सत्य समजुन चुकीची समजूत करून घेऊ नये.   स्वप्न न येण्यास , दिवसा झोपू नये, शरीरा पासून काम घ्यावे, शरीर थकल्या नंतर गाढ  झोप येते.  रात्री झोपताना आपल्या इष्ट ईश्वराचे किंवा सद्गुरंचे ध्यान करून झोपावे.   झोपण्याच्या आगोदर 30 -40 मिनटा पुर्वी tv, mobile, paper पासून वेगळे/बंद करून असावे.  हात पाय तोंड धुवून ध्यान, चिंतन, नाम स्मरण करून झोपावे.  सुखाची झोप येते, प्रकृती छान राहते. येणारा दिवस उत्साही व आनंद मय होतो. आत्मदेव की जय हो, तोच तुमचा ईश्वर आहे, अगदी समीप, झोपल्या नंतर तोच तुमची रक्षा करतो व दुसऱ्या दिवशी लागणारी शक्ती पण तोच देतो. 🪷🌞🪷🕉️🙏🏻','Dream Creation: In dreams we see a different view, person, occasion, idol of the goddess, the deity of the goddess, and meets the deceased, and tells that my desirable God came in today, the family of the family has come, etc.  I say that I went to Mumbai.   Let\'s know what the truth is.  The first thing in the dream we see a different picture, the goddess or a different picture, all the thoughts that come to the second country are all in your mind or in the mind. They often think that in the dream, and your soul shows all the occasions, the person, the God, etc. in the dream.   After waking up, you say that I saw this in dreams.  In the dream, what you see in the dream shows all your soul.  It costs your self -power.  Therefore, those who dream are not enthusiastic after they get up.  Those who have a deep sleep (no dreamless sleep) appear to be freshly twisting after getting up.  They have a lot of excitement.   So what is dreaming is all false.  It should not be misunderstood by understanding the truth.   Do not dream, do not sleep during the day, work from the body, the body gets a deep sleep after tired.  When sleeping at night, you should sleep by meditating on your desirable God or Sadgur.   30-40 minutes before bedtime should be separated/closed from TV, Mobile, Paper.  Wash hands and feet and sleep by meditation, memory of the name.  Sleep of happiness comes, nature remains nice. The coming days are excited and joyful. Selfishness Ki Jai Ho, he is your God, even when you sleep, he protects you and gives the same power the next day.','प.पु.श्री.अशोककाका शास्त्री','2025-08-18',1,'2025-08-19 04:56:04','2025-08-19 04:56:04',NULL,NULL),(6,4,'आत्मदेव::','आत्मदेव:- मनुष्य जन्मास येऊन घरातल्या संस्कारा प्रमाणे वेग वेगळ्या देवाची पुजा करतो,  रुढी परंपरा पाहून आपणही पुजा प्रार्थना करीत जातो.  कोणत्याही देवाचं साक्षात दर्शन घडलेलं नसत.  तरीही विश्र्वास व श्रद्धा नी आपल मनोभाव त्या देवासमोर व्यक्त करतो.   सोमवारी महादेव, मंगळ वारी मारुतीच, बुधवारी सरस्वती, गुरू वारी दत्ताच, शुक्रवारी लक्ष्मीचं, शनिवारी शनी देवतेच, व रविवारी सूर्य देवाचं असे जीवनात अनेक देवी देवतांचे पूजन करतो. सर्व करण्याचा उद्देश हेच असतो की संसार सुखानी शांतीनी पुढे चालत जावे.   जेथे तुमची ईच्छा पूर्ण होऊ लागते त्या देवावर जास्तीच विश्र्वास बसतो.   बारकाईन पाहिलं तर तुमची इच्छा,  तुमचं विश्र्वास असल्याने,  तुमचे काम पूर्ण होत असते पण शंभर टक्के नाही,  विस ते पंचवीस टक्केच. तुम्हास असा भास होतो की पुढच्या देवामुळ काम झाल म्हणुन. पण प्रत्यक्षात तसं नाही तुम्ही देवासमोर हात जोडून डोळे बंद करून पूर्ण एकाग्रतेने तुमची इच्छा व्यक्त करता व ती प्रार्थना तुमच्या आत असलेल आत्मा ती पूर्ण करतो. खर पाहता तुमचा आत्माच ईश्वर असुन जीवनातील प्रत्येक ईच्छा तोच पूर्ण करीत आला आहे व पुढेही करतो.   खर पाहता जीवन सुखी आनंदी करण्यास मनुष्याने एकच देवाची / गुरूची पूजा करावे, ते महादेव असेल तर स्वतः आत्म्यास महादेव समजुन ध्यान पूजा करीत असावे,  असेच कोणी राम,  तर कोणी कृष्ण, माऊली, तर कोणी विठ्ठल, आपल्या आवडी नुसार एकाच शक्तीची उपासना करीत जावे ते सर्व आपल्या आत्मदेवालाच समजुन, त्याच्यानी फार लाभ होतो, विश्र्वास ,श्रद्धा व एकाग्रता वाढत जाते.  जीवन सुखी व सरळ होऊन जात.  तसेच आम्ही जीवनात बरेचं गुरु देखील  करतो व त्यांचे दर्शन घेऊन आशिर्वाद घेतो. सर्व देवांची पूजा व अनेक गुरु कडे जातो, त्याच मुख्य कारण म्हणजे जीवन सुखमय व शांत होण्या करीताच. पण अस शोधण चालूच  राहत ,तेंव्हा पर्यन्त जेंव्हा तुम्हाला अती समीप असलेला देवाचं/ईश्वराचे दर्शन होत नाही.  तो ईश्वर तुमचा आत्मदेवच आहे.  हा ईश्वर सदगुरु च्या कृपेनें दिव्य नेत्रानी  तुमच्या आतच दिसते. एकदा तुम्हास तुमच स्व आत्माच दर्शन घडले  कि तेंव्हा कुठे तुमची जीवनाची धावपळ थांबते.  मन तृप्त समाधानी होऊन संतोष आनंदी होते. मग जीवनाचं खर आनंद प्राप्त होऊन  तुम्ही जीवन मुक्त होता.🪷🕉️🌺🙏🏻','Aatma-dev: Man, upon taking birth, performs worship of various deities according to the customs of his household, and observing traditions, he continues to do prayers and worship. He does not have a direct vision of any deity. Still, with faith and devotion, he expresses his inner feelings before that deity. On Mondays, he worships Mahadev, on Tuesdays, Hanuman, on Wednesdays, Saraswati, on Thursdays, Dattatreya, on Fridays, Lakshmi, on Saturdays, Shani, and on Sundays, Surya; thus, in life, he worships many deities. The purpose of this is that life should proceed happily and peacefully. The more he wishes for something, the more trust he places in the deity fulfilling that wish. Upon close inspection, it can be seen that due to your faith, your work is completed, but not fully—only about twenty-five percent. You may feel that, because of the next deity, your work has been accomplished. But in reality, it is not like that; you join your hands before the deity, close your eyes, and express your wishes with complete concentration, and that prayer is fulfilled by the spirit within you. In fact, your spirit is God, and it has been fulfilling every desire in life and will continue to do so. Truly, to make life happy and joyful, one should worship only one deity or guru; if it is Mahadev, then one should consider themselves as Mahadev and perform meditation and worship accordingly; some may worship Ram, some Krishna, some Mauli, and some Vithhal, dedicating themselves to one power according to their preference. Understanding it all as an extension of your own spirit, they receive immense benefits—trust, faith, and concentration increase, making life happier and simpler. Likewise, we also have many gurus in our lives, and we take their blessings through their vision. We worship all gods and visit various gurus, with the main reason being to make life enjoyable and peaceful. However, this search continues until you achieve a close vision of the God/God which is with you. That God is your Aatma-dev. This God, through the grace of the Sadguru, is seen within you as Divine Eyes. Once you have the vision of your own spirit, only then does the hustle of your life come to a halt. The mind becomes fulfilled, and it rests in contentment and joy. Then, true happiness in life is attained, and you become liberated in life.','प.पु.श्री.अशोककाका शास्त्री','2025-08-20',1,'2025-08-20 06:19:56','2025-08-20 06:19:56',NULL,NULL),(8,5,'आत्मदेव::','आत्मदेव:- मनुष्य जन्मास येऊन घरातल्या संस्कारा प्रमाणे वेग वेगळ्या देवाची पुजा करतो,  रुढी परंपरा पाहून आपणही पुजा प्रार्थना करीत जातो.  कोणत्याही देवाचं साक्षात दर्शन घडलेलं नसत.  तरीही विश्र्वास व श्रद्धा नी आपल मनोभाव त्या देवासमोर व्यक्त करतो.   सोमवारी महादेव, मंगळ वारी मारुतीच, बुधवारी सरस्वती, गुरू वारी दत्ताच, शुक्रवारी लक्ष्मीचं, शनिवारी शनी देवतेच, व रविवारी सूर्य देवाचं असे जीवनात अनेक देवी देवतांचे पूजन करतो. सर्व करण्याचा उद्देश हेच असतो की संसार सुखानी शांतीनी पुढे चालत जावे.   जेथे तुमची ईच्छा पूर्ण होऊ लागते त्या देवावर जास्तीच विश्र्वास बसतो.   बारकाईन पाहिलं तर तुमची इच्छा,  तुमचं विश्र्वास असल्याने,  तुमचे काम पूर्ण होत असते पण शंभर टक्के नाही,  विस ते पंचवीस टक्केच. तुम्हास असा भास होतो की पुढच्या देवामुळ काम झाल म्हणुन. पण प्रत्यक्षात तसं नाही तुम्ही देवासमोर हात जोडून डोळे बंद करून पूर्ण एकाग्रतेने तुमची इच्छा व्यक्त करता व ती प्रार्थना तुमच्या आत असलेल आत्मा ती पूर्ण करतो. खर पाहता तुमचा आत्माच ईश्वर असुन जीवनातील प्रत्येक ईच्छा तोच पूर्ण करीत आला आहे व पुढेही करतो.   खर पाहता जीवन सुखी आनंदी करण्यास मनुष्याने एकच देवाची / गुरूची पूजा करावे, ते महादेव असेल तर स्वतः आत्म्यास महादेव समजुन ध्यान पूजा करीत असावे,  असेच कोणी राम,  तर कोणी कृष्ण, माऊली, तर कोणी विठ्ठल, आपल्या आवडी नुसार एकाच शक्तीची उपासना करीत जावे ते सर्व आपल्या आत्मदेवालाच समजुन, त्याच्यानी फार लाभ होतो, विश्र्वास ,श्रद्धा व एकाग्रता वाढत जाते.  जीवन सुखी व सरळ होऊन जात.  तसेच आम्ही जीवनात बरेचं गुरु देखील  करतो व त्यांचे दर्शन घेऊन आशिर्वाद घेतो. सर्व देवांची पूजा व अनेक गुरु कडे जातो, त्याच मुख्य कारण म्हणजे जीवन सुखमय व शांत होण्या करीताच. पण अस शोधण चालूच  राहत ,तेंव्हा पर्यन्त जेंव्हा तुम्हाला अती समीप असलेला देवाचं/ईश्वराचे दर्शन होत नाही.  तो ईश्वर तुमचा आत्मदेवच आहे.  हा ईश्वर सदगुरु च्या कृपेनें दिव्य नेत्रानी  तुमच्या आतच दिसते. एकदा तुम्हास तुमच स्व आत्माच दर्शन घडले  कि तेंव्हा कुठे तुमची जीवनाची धावपळ थांबते.  मन तृप्त समाधानी होऊन संतोष आनंदी होते. मग जीवनाचं खर आनंद प्राप्त होऊन  तुम्ही जीवन मुक्त होता.🪷🕉️🌺🙏🏻','Aatma-dev: Man, upon taking birth, performs worship of various deities according to the customs of his household, and observing traditions, he continues to do prayers and worship. He does not have a direct vision of any deity. Still, with faith and devotion, he expresses his inner feelings before that deity. On Mondays, he worships Mahadev, on Tuesdays, Hanuman, on Wednesdays, Saraswati, on Thursdays, Dattatreya, on Fridays, Lakshmi, on Saturdays, Shani, and on Sundays, Surya; thus, in life, he worships many deities. The purpose of this is that life should proceed happily and peacefully. The more he wishes for something, the more trust he places in the deity fulfilling that wish. Upon close inspection, it can be seen that due to your faith, your work is completed, but not fully—only about twenty-five percent. You may feel that, because of the next deity, your work has been accomplished. But in reality, it is not like that; you join your hands before the deity, close your eyes, and express your wishes with complete concentration, and that prayer is fulfilled by the spirit within you. In fact, your spirit is God, and it has been fulfilling every desire in life and will continue to do so. Truly, to make life happy and joyful, one should worship only one deity or guru; if it is Mahadev, then one should consider themselves as Mahadev and perform meditation and worship accordingly; some may worship Ram, some Krishna, some Mauli, and some Vithhal, dedicating themselves to one power according to their preference. Understanding it all as an extension of your own spirit, they receive immense benefits—trust, faith, and concentration increase, making life happier and simpler. Likewise, we also have many gurus in our lives, and we take their blessings through their vision. We worship all gods and visit various gurus, with the main reason being to make life enjoyable and peaceful. However, this search continues until you achieve a close vision of the God/God which is with you. That God is your Aatma-dev. This God, through the grace of the Sadguru, is seen within you as Divine Eyes. Once you have the vision of your own spirit, only then does the hustle of your life come to a halt. The mind becomes fulfilled, and it rests in contentment and joy. Then, true happiness in life is attained, and you become liberated in life.','प.पु.श्री.अशोककाका शास्त्री','2025-08-20',1,'2025-08-20 12:01:21','2025-08-20 12:01:21','आत्मदेव:- मनुष्य जन्मास येऊन घरातल्या संस्कारा प्रमाणे वेग वेगळ्या देवाची पुजा करतो,  रुढी परंपरा पाहून आपणही पुजा प्रार्थना करीत जातो.  कोणत्याही देवाचं साक्षात दर्शन घडलेलं नसत.  तरीही विश्र्वास व श्रद्धा नी आपल मनोभाव त्या देवासमोर व्यक्त करतो.   सोमवारी महादेव, मंगळ वारी मारुतीच, बुधवारी सरस्वती, गुरू वारी दत्ताच, शुक्रवारी लक्ष्मीचं, शनिवारी शनी देवतेच, व रविवारी सूर्य देवाचं असे जीवनात अनेक देवी देवतांचे पूजन करतो. सर्व करण्याचा उद्देश हेच असतो की संसार सुखानी शांतीनी पुढे चालत जावे.   जेथे तुमची ईच्छा पूर्ण होऊ लागते त्या देवावर जास्तीच विश्र्वास बसतो.   बारकाईन पाहिलं तर तुमची इच्छा,  तुमचं विश्र्वास असल्याने,  तुमचे काम पूर्ण होत असते पण शंभर टक्के नाही,  विस ते पंचवीस टक्केच. तुम्हास असा भास होतो की पुढच्या देवामुळ काम झाल म्हणुन. पण प्रत्यक्षात तसं नाही तुम्ही देवासमोर हात जोडून डोळे बंद करून पूर्ण एकाग्रतेने तुमची इच्छा व्यक्त करता व ती प्रार्थना तुमच्या आत असलेल आत्मा ती पूर्ण करतो. खर पाहता तुमचा आत्माच ईश्वर असुन जीवनातील प्रत्येक ईच्छा तोच पूर्ण करीत आला आहे व पुढेही करतो.   खर पाहता जीवन सुखी आनंदी करण्यास मनुष्याने एकच देवाची / गुरूची पूजा करावे, ते महादेव असेल तर स्वतः आत्म्यास महादेव समजुन ध्यान पूजा करीत असावे,  असेच कोणी राम,  तर कोणी कृष्ण, माऊली, तर कोणी विठ्ठल, आपल्या आवडी नुसार एकाच शक्तीची उपासना करीत जावे ते सर्व आपल्या आत्मदेवालाच समजुन, त्याच्यानी फार लाभ होतो, विश्र्वास ,श्रद्धा व एकाग्रता वाढत जाते.  जीवन सुखी व सरळ होऊन जात.  तसेच आम्ही जीवनात बरेचं गुरु देखील  करतो व त्यांचे दर्शन घेऊन आशिर्वाद घेतो. सर्व देवांची पूजा व अनेक गुरु कडे जातो, त्याच मुख्य कारण म्हणजे जीवन सुखमय व शांत होण्या करीताच. पण अस शोधण चालूच  राहत ,तेंव्हा पर्यन्त जेंव्हा तुम्हाला अती समीप असलेला देवाचं/ईश्वराचे दर्शन होत नाही.  तो ईश्वर तुमचा आत्मदेवच आहे.  हा ईश्वर सदगुरु च्या कृपेनें दिव्य नेत्रानी  तुमच्या आतच दिसते. एकदा तुम्हास तुमच स्व आत्माच दर्शन घडले  कि तेंव्हा कुठे तुमची जीवनाची धावपळ थांबते.  मन तृप्त समाधानी होऊन संतोष आनंदी होते. मग जीवनाचं खर आनंद प्राप्त होऊन  तुम्ही जीवन मुक्त होता.🪷🕉️🌺🙏🏻','Aatma-dev: Man, upon taking birth, performs worship of various deities according to the customs of his household, and observing traditions, he continues to do prayers and worship. He does not have a direct vision of any deity. Still, with faith and devotion, he expresses his inner feelings before that deity. On Mondays, he worships Mahadev, on Tuesdays, Hanuman, on Wednesdays, Saraswati, on Thursdays, Dattatreya, on Fridays, Lakshmi, on Saturdays, Shani, and on Sundays, Surya; thus, in life, he worships many deities. The purpose of this is that life should proceed happily and peacefully. The more he wishes for something, the more trust he places in the deity fulfilling that wish. Upon close inspection, it can be seen that due to your faith, your work is completed, but not fully—only about twenty-five percent. You may feel that, because of the next deity, your work has been accomplished. But in reality, it is not like that; you join your hands before the deity, close your eyes, and express your wishes with complete concentration, and that prayer is fulfilled by the spirit within you. In fact, your spirit is God, and it has been fulfilling every desire in life and will continue to do so. Truly, to make life happy and joyful, one should worship only one deity or guru; if it is Mahadev, then one should consider themselves as Mahadev and perform meditation and worship accordingly; some may worship Ram, some Krishna, some Mauli, and some Vithhal, dedicating themselves to one power according to their preference. Understanding it all as an extension of your own spirit, they receive immense benefits—trust, faith, and concentration increase, making life happier and simpler. Likewise, we also have many gurus in our lives, and we take their blessings through their vision. We worship all gods and visit various gurus, with the main reason being to make life enjoyable and peaceful. However, this search continues until you achieve a close vision of the God/God which is with you. That God is your Aatma-dev. This God, through the grace of the Sadguru, is seen within you as Divine Eyes. Once you have the vision of your own spirit, only then does the hustle of your life come to a halt. The mind becomes fulfilled, and it rests in contentment and joy. Then, true happiness in life is attained, and you become liberated in life.'),(9,6,':अध्यात्म मार्गातील पायऱ्या:','अध्यात्म मार्गातील पायऱ्या:    जीवात्मा संसारात जन्म घेतल्या नंतर त्यास वेग वेगल्या परिस्थितीतून जावे लागते , वेगवेगळे अनुभव घेऊन  त्याच्या कर्मानुसार पूढे जातो व शेवटची पायरी म्हणजे ध्यान भक्ती मार्गा  वर येऊन पोहचतो.   तेथे आल्यानंतर त्याची भेट सद्गुरू संग होते.   नव्यानव टक्के असल्या जीवाच शोध घेत सद्गुरूच त्याच्या जवळ येतात.  राहिलेले दोन टक्के जीव कोणाच्या तरी माध्यम व्दारे सद्गुरू पर्यन्त पोहचतो.    नंतर सद्गुरू त्याच्या चित्तात बी पेरून त्यास स्वचा (आत्मा ) बोध करून देतात.  दिव्य नेत्र त्यांच्या कृपेनेच उघडते व त्यास ईश्वरीय जगाच दर्शन घडवून स्व (आत्म स्वरूपाचं)  दर्शन ( सूक्ष्म शरीर) करून देतात. हेच ईश्वराचे/ परमेश्वराचे दर्शन व अनुभूती आहे.     जीवात्मा संसारात जन्म घेतल्या नंतर प्रथम वेगवेगळ्या विषययाचे अनुभव घेतो.   पूढे त्याच्या शुभ कर्मानुसार तीर्थ क्षेत्र/यात्रा सुरू होते.  नंतर हे सर्व सोडून मंत्र यज्ञ हवन करीत करीत अनुभव प्राप्त करतों.  थोडी थोडी ईश्वराची शक्ती देखील अनुभवास येते.   घरीच आपल्या आवडीच्या देवाची पूजा करतो.  हे अनुभव प्राप्त झाल्यास तो  पुराण, कथा वाचत व अभ्यास करीत वेद उपनिषद च्या उंबरठ्यावर येऊन थांबतो, तेथे त्यास समझते की जीवच/ मनुष्यच ईश्वर आहे.  वेदात स्पष्ट केले आहे की तुम्हीच ( मनुष्यच) ब्रह्म आहात . वेद उपनिषद हे  ग्रंथ,  मनुष्य स्वतः योग साधने व्दारे आत्मज्ञान प्राप्त करून  स्वतः अनुभूती करून लिहले गेले आहेत.  त्यात त्यांनी स्पष्ट केलं आहे की प्रत्येक जीव (मनुष्य)   तो नियमाच पालन करून  योग साधने व्दारे स्वतः ईश्वरत्व प्राप्त करू शकतो.  हेच कारण आहे की परमेश्र्वर स्वतः सद्गुरू रूपांनी येऊन जीवांच शोध घेत, सर्वांना मार्गदर्शन करून शेवटी हे दाखवतात व सिद्ध करतात की तुम्हीच ( मनुष्यच ) ईश्वर आहात .  तर शेवटची पायरी म्हणजे ध्यान ज्या व्दारे जीव प्रथम आई वडीलांच्या पोटी जन्म घेउन  सद्गुरुच्या संपर्कात येऊन आत्मज्ञानी होतो व ईश्वरत्व प्राप्त करतो.   सारांश हेच की    संसारात  विषय वासनात वेळ घालविण्या पेक्षा तीर्थ यात्रा करणे छान,  त्यापेक्षा ऊत्तम मंत्र, यज्ञ, घरीच देव पुजा केलेले छान,   त्यापेक्षा  श्रेष्ठ  वेद उपनिषद ग्रंथ व ईतर कथेंचा  अभ्यास, शेवटीं सर्वांहून श्रेष्ठ योग साधना व ध्यान.  ध्यान भक्ती द्वारेच मनुष्य ईश्वर व आत्मज्ञानी होतो.','Steps on the Spiritual Path: After the soul takes birth in the world, it has to pass through various circumstances, acquiring different experiences, and progresses according to its karmas, with the final step being reaching the path of meditation and devotion. Upon reaching there, it encounters the true guru. The true gurus come close to those souls that are 98% new. The remaining 2% of souls reach the true guru through some medium. The guru then sows the seed of awareness in their mind and grants them self-realization (knowledge of the soul). The divine eye opens through their grace, allowing them to witness the divine realm and experience the essence of the self (soul\'s form) through the subtle body. This is the vision and experience of God/Paramatma. After taking birth in the world, the soul first experiences various subjects. Then, according to its good deeds, it embarks on a pilgrimage/journey. After that, it leaves all else behind and, through mantra, yajna, and havan, gains experiences, gradually sensing the divine power. It worships its chosen deity at home. Upon acquiring these experiences, it comes to study and contemplate the Puranas and stories, ultimately arriving at the threshold of the Vedas and Upanishads, where it realizes that the soul/human itself is God. The Vedas explicitly state that you (human) are Brahman. The Vedas and Upanishads were written by humans through their own experiences of self-realization gained through yoga practices. They have made it clear that every living being (human) can attain divinity by following those principles and engaging in yoga practices. This is why the Supreme Being Himself comes in the form of a guru, searching for souls, guiding everyone, and ultimately demonstrating and proving that you (human) are God. Thus, the final step is meditation, through which the soul, after taking birth from its parents, meets the guru and becomes self-realized, attaining divinity. In summary, it is better to undertake a pilgrimage than to waste time in sensory desires; it is even better to perform mantras, yajnas, and worship of God at home; however, the best of all is the study of the sacred Vedas and Upanishads, culminating in the supreme practice of yoga and meditation. Through the path of meditation and devotion, a human becomes one with God and gains self-realization.','प.पु.श्री.अशोककाका शास्त्री','2025-08-22',1,'2025-08-22 05:49:51','2025-08-22 05:49:51','अध्यात्म मार्गातील पायऱ्या:    जीवात्मा संसारात जन्म घेतल्या नंतर त्यास वेग वेगल्या परिस्थितीतून जावे लागते , वेगवेगळे अनुभव घेऊन  त्याच्या कर्मानुसार पूढे जातो व शेवटची पायरी म्हणजे ध्यान भक्ती मार्गा  वर येऊन पोहचतो.   तेथे आल्यानंतर त्याची भेट सद्गुरू संग होते.   नव्यानव टक्के असल्या जीवाच शोध घेत सद्गुरूच त्याच्या जवळ येतात.  राहिलेले दोन टक्के जीव कोणाच्या तरी माध्यम व्दारे सद्गुरू पर्यन्त पोहचतो.    नंतर सद्गुरू त्याच्या चित्तात बी पेरून त्यास स्वचा (आत्मा ) बोध करून देतात.  दिव्य नेत्र त्यांच्या कृपेनेच उघडते व त्यास ईश्वरीय जगाच दर्शन घडवून स्व (आत्म स्वरूपाचं)  दर्शन ( सूक्ष्म शरीर) करून देतात. हेच ईश्वराचे/ परमेश्वराचे दर्शन व अनुभूती आहे.     जीवात्मा संसारात जन्म घेतल्या नंतर प्रथम वेगवेगळ्या विषययाचे अनुभव घेतो.   पूढे त्याच्या शुभ कर्मानुसार तीर्थ क्षेत्र/यात्रा सुरू होते.  नंतर हे सर्व सोडून मंत्र यज्ञ हवन करीत करीत अनुभव प्राप्त करतों.  थोडी थोडी ईश्वराची शक्ती देखील अनुभवास येते.   घरीच आपल्या आवडीच्या देवाची पूजा करतो.  हे अनुभव प्राप्त झाल्यास तो  पुराण, कथा वाचत व अभ्यास करीत वेद उपनिषद च्या उंबरठ्यावर येऊन थांबतो, तेथे त्यास समझते की जीवच/ मनुष्यच ईश्वर आहे.  वेदात स्पष्ट केले आहे की तुम्हीच ( मनुष्यच) ब्रह्म आहात . वेद उपनिषद हे  ग्रंथ,  मनुष्य स्वतः योग साधने व्दारे आत्मज्ञान प्राप्त करून  स्वतः अनुभूती करून लिहले गेले आहेत.  त्यात त्यांनी स्पष्ट केलं आहे की प्रत्येक जीव (मनुष्य)   तो नियमाच पालन करून  योग साधने व्दारे स्वतः ईश्वरत्व प्राप्त करू शकतो.  हेच कारण आहे की परमेश्र्वर स्वतः सद्गुरू रूपांनी येऊन जीवांच शोध घेत, सर्वांना मार्गदर्शन करून शेवटी हे दाखवतात व सिद्ध करतात की तुम्हीच ( मनुष्यच ) ईश्वर आहात .  तर शेवटची पायरी म्हणजे ध्यान ज्या व्दारे जीव प्रथम आई वडीलांच्या पोटी जन्म घेउन  सद्गुरुच्या संपर्कात येऊन आत्मज्ञानी होतो व ईश्वरत्व प्राप्त करतो.   सारांश हेच की    संसारात  विषय वासनात वेळ घालविण्या पेक्षा तीर्थ यात्रा करणे छान,  त्यापेक्षा ऊत्तम मंत्र, यज्ञ, घरीच देव पुजा केलेले छान,   त्यापेक्षा  श्रेष्ठ  वेद उपनिषद ग्रंथ व ईतर कथेंचा  अभ्यास, शेवटीं सर्वांहून श्रेष्ठ योग साधना व ध्यान.  ध्यान भक्ती द्वारेच मनुष्य ईश्वर व आत्मज्ञानी होतो.','Steps on the Spiritual Path: After the soul takes birth in the world, it has to pass through various circumstances, acquiring different experiences, and progresses according to its karmas, with the final step being reaching the path of meditation and devotion. Upon reaching there, it encounters the true guru. The true gurus come close to those souls that are 98% new. The remaining 2% of souls reach the true guru through some medium. The guru then sows the seed of awareness in their mind and grants them self-realization (knowledge of the soul). The divine eye opens through their grace, allowing them to witness the divine realm and experience the essence of the self (soul\'s form) through the subtle body. This is the vision and experience of God/Paramatma. After taking birth in the world, the soul first experiences various subjects. Then, according to its good deeds, it embarks on a pilgrimage/journey. After that, it leaves all else behind and, through mantra, yajna, and havan, gains experiences, gradually sensing the divine power. It worships its chosen deity at home. Upon acquiring these experiences, it comes to study and contemplate the Puranas and stories, ultimately arriving at the threshold of the Vedas and Upanishads, where it realizes that the soul/human itself is God. The Vedas explicitly state that you (human) are Brahman. The Vedas and Upanishads were written by humans through their own experiences of self-realization gained through yoga practices. They have made it clear that every living being (human) can attain divinity by following those principles and engaging in yoga practices. This is why the Supreme Being Himself comes in the form of a guru, searching for souls, guiding everyone, and ultimately demonstrating and proving that you (human) are God. Thus, the final step is meditation, through which the soul, after taking birth from its parents, meets the guru and becomes self-realized, attaining divinity. In summary, it is better to undertake a pilgrimage than to waste time in sensory desires; it is even better to perform mantras, yajnas, and worship of God at home; however, the best of all is the study of the sacred Vedas and Upanishads, culminating in the supreme practice of yoga and meditation. Through the path of meditation and devotion, a human becomes one with God and gains self-realization.'),(11,7,':सद्गुरू वाणी:मृत्यू नंतर::','सद्गुरू वाणी: मृत्यू नंतर: स्थूल शरीर त्याग केल्या नंतर आत्मा सूक्ष्म शरीरात राहतो.   सूक्ष्म शरीराला,  हे संभव नाही की कोणी धरू शके.    सूक्ष्म शरीर जेवढं सूक्ष्म असतो तेवढ आत्मा आणि मन सोडून संसारात कोणतंच तत्व संसारात नाही.  एवढ्या मोठ्या सूक्ष्म तत्वास यमदूत का त्याचा बाप देखील पकडू शकत नाही.  यमराज, यमदूत, स्वर्ग, नरकाची  हे सर्व कल्पना स्थान  आहे, हे धार्मिक लोकांची कल्पना आहे.   अतः यमदूत आणि यमराज मृत्यू नंतर त्याच लोकांना धरून नेते जे त्यांची कल्पना करतात किंवा मानतात.  खालच्या स्थराचे लोक जे भूतास मानतात त्यांनाच भूत त्रास देतात.  जे लोक भुताला मानत नाहीत त्यांच्या जवळ भूत येत नाही.   स्वर्ग, नरक, यमदूत, यमराज, भूत प्रेत, देवी देवता आणि धर्माच्या ईश्वराला मानल्यास कांहींच लाभ नाही पण नुकसान फार होते.  प्रत्येक वेळी त्यांच्या मनावर,  बुध्दीत त्यांचेच विचार घोळत असतात. त्याच परिणाम हे होते की मनुष्य मेल्यानंतर जेंव्हा सूक्ष्म शरीरात/ मनोमय शरीरात राहतो तेंव्हा तो यमराज, यमदूत व नर्कालाच पाहतो आणि रडतो.                           आज कालचे कांहीं योगी जड समाधी लावुन जड होउन आपल्या चेतन स्वरुपाला  मिटवून टाकण्याच्या तयारीत आहेत.  अतः असल्या विचाराला जो सोडत नाही तो केंव्हाही सुखी होऊ शकत नाही, आणि बंधनातून,  दुःख, नर्काच्या आगीतून वाचू शकत नाही.      अतः जर पूर्ण सुखी होऊ इच्छिता, नरकाच्या त्रासातून सुटका करून प्रगतीच्या शिखरावर जाऊ इच्छिता  तर आपल्या सत्य स्वरूपाचं ज्ञान प्राप्त करून घ्या आणि आत्मशक्तीच परिचय करून घ्या,  मनुष्य हे सर्व विसरल्या मुळे संसारात दुःखी झाला आहे.   ....🕉️🪷🙏🏻.. समापन.','Words of the True Guru: After death, once the physical body is relinquished, the soul resides in the subtle body. The subtle body cannot be grasped by anyone. As subtle as it is, there is no element in the world that can exist without the soul and mind. Such a vast subtle essence cannot be held even by the agents of death or their father. Yamaraj, Yamdutas, heaven, and hell are all conceptual places; they exist in the minds of those who are religious. Thus, the agents of death and Yamaraj take away only those who believe in their existence. People from lower realms who believe in spirits are the ones troubled by them. Spirits do not approach those who do not believe in them. Belief in heaven, hell, Yamdutas, Yamaraj, spirits, ghosts, deities, and the God of religion offers no benefits but rather causes harm. Again and again, such thoughts circulate in their minds. The result is that after death, when a person dwells in the subtle body/mind body, they only see Yamaraj, Yamdutas, and hell, and they weep. Nowadays, some yogis are becoming heavy with dead meditation, preparing to extinguish their conscious form. Those who cannot release such thoughts can never find happiness or escape from binding, suffering, and the fires of hell. Therefore, if you wish to achieve complete happiness, to be freed from the torments of hell and reach the peak of progress, acquire knowledge of your true nature and acknowledge your inner strength; humanity has become unhappy due to forgetting all of this. ....🕉️🪷🙏🏻.. End.','प.पु.श्री.अशोककाका शास्त्री','2025-08-23',1,'2025-08-23 06:15:28','2025-08-23 06:15:28','सद्गुरू वाणी: मृत्यू नंतर: स्थूल शरीर त्याग केल्या नंतर आत्मा सूक्ष्म शरीरात राहतो.   सूक्ष्म शरीराला,  हे संभव नाही की कोणी धरू शके.    सूक्ष्म शरीर जेवढं सूक्ष्म असतो तेवढ आत्मा आणि मन सोडून संसारात कोणतंच तत्व संसारात नाही.  एवढ्या मोठ्या सूक्ष्म तत्वास यमदूत का त्याचा बाप देखील पकडू शकत नाही.  यमराज, यमदूत, स्वर्ग, नरकाची  हे सर्व कल्पना स्थान  आहे, हे धार्मिक लोकांची कल्पना आहे.   अतः यमदूत आणि यमराज मृत्यू नंतर त्याच लोकांना धरून नेते जे त्यांची कल्पना करतात किंवा मानतात.  खालच्या स्थराचे लोक जे भूतास मानतात त्यांनाच भूत त्रास देतात.  जे लोक भुताला मानत नाहीत त्यांच्या जवळ भूत येत नाही.   स्वर्ग, नरक, यमदूत, यमराज, भूत प्रेत, देवी देवता आणि धर्माच्या ईश्वराला मानल्यास कांहींच लाभ नाही पण नुकसान फार होते.  प्रत्येक वेळी त्यांच्या मनावर,  बुध्दीत त्यांचेच विचार घोळत असतात. त्याच परिणाम हे होते की मनुष्य मेल्यानंतर जेंव्हा सूक्ष्म शरीरात/ मनोमय शरीरात राहतो तेंव्हा तो यमराज, यमदूत व नर्कालाच पाहतो आणि रडतो.                           आज कालचे कांहीं योगी जड समाधी लावुन जड होउन आपल्या चेतन स्वरुपाला  मिटवून टाकण्याच्या तयारीत आहेत.  अतः असल्या विचाराला जो सोडत नाही तो केंव्हाही सुखी होऊ शकत नाही, आणि बंधनातून,  दुःख, नर्काच्या आगीतून वाचू शकत नाही.      अतः जर पूर्ण सुखी होऊ इच्छिता, नरकाच्या त्रासातून सुटका करून प्रगतीच्या शिखरावर जाऊ इच्छिता  तर आपल्या सत्य स्वरूपाचं ज्ञान प्राप्त करून घ्या आणि आत्मशक्तीच परिचय करून घ्या,  मनुष्य हे सर्व विसरल्या मुळे संसारात दुःखी झाला आहे.   ....🕉️🪷🙏🏻.. समापन.','Words of the True Guru: After death, once the physical body is relinquished, the soul resides in the subtle body. The subtle body cannot be grasped by anyone. As subtle as it is, there is no element in the world that can exist without the soul and mind. Such a vast subtle essence cannot be held even by the agents of death or their father. Yamaraj, Yamdutas, heaven, and hell are all conceptual places; they exist in the minds of those who are religious. Thus, the agents of death and Yamaraj take away only those who believe in their existence. People from lower realms who believe in spirits are the ones troubled by them. Spirits do not approach those who do not believe in them. Belief in heaven, hell, Yamdutas, Yamaraj, spirits, ghosts, deities, and the God of religion offers no benefits but rather causes harm. Again and again, such thoughts circulate in their minds. The result is that after death, when a person dwells in the subtle body/mind body, they only see Yamaraj, Yamdutas, and hell, and they weep. Nowadays, some yogis are becoming heavy with dead meditation, preparing to extinguish their conscious form. Those who cannot release such thoughts can never find happiness or escape from binding, suffering, and the fires of hell. Therefore, if you wish to achieve complete happiness, to be freed from the torments of hell and reach the peak of progress, acquire knowledge of your true nature and acknowledge your inner strength; humanity has become unhappy due to forgetting all of this. ....🕉️🪷🙏🏻.. End.'),(12,8,':सद्गुरू वाणी:ईश्र्वरावर विश्र्वास किंवा विसंबून राहणे:','सद्गुरू वाणी: ईश्र्वरावर विश्र्वास किंवा विसंबून राहणे: लोक सामान्य पने म्हणतात, आम्ही तर ईश्र्वरावर विश्र्वास ठेवून आहोत.  जर ईश्वराची इच्छा झाल्यास आमचं उद्धार होऊन जाईल.  हया संसारात ईश्वराच्या भरोस्या वर राहणारे सर्वात अधिक आमचे भारतवासीच आहेत आणि प्रगतीच्या वाटेवर  पाहिल्यास सर्वात मागे आहेत.   रशिया देश जेंव्हा पर्यन्त ईश्वराच्या भरोस्या वर होता त्यानी नरकच भोगला.  जेंव्हा ईश्वरावर त्यांनी भरोसा सोडला त्यांच जीवन मजेत झाल.  जर रशिया चया लोकांनी आत्मज्ञानी प्राप्त केलं असतं तर अधिक सूखी झाले असते.   हया ( रशिया) देशाला पतन होण्याची भीती असते कारण की ते आत्मबलास मानत नाहीत, ते सर्व जड विज्ञानावर विसंबून आहेत. भारतवर्ष ईश्र्वरावर अवलंबून असल्यानेच  आलसी ( निषकर्मण्य ) झाला आहे.  सद्गुरू विश्वासाने सांगतात की ईश्वराच्या इच्छेने कांहीच होणार नाही, जे होईल तुमच्या इच्छेनेच होईल.  जे तुम्हास पाहिजे, जसं व्हायचं असेल तस आत्मविश्र्वास व दृढतेने  ईच्छा करा,  अवश्य तसच होऊन जाता.   तुम्ही स्वतःस निर्बल समजू नका,  जर स्वतः तुम्ही आत्मबलावर शंका न केल्यास, जर स्वतः मनानि कोणत्या बंधनात न पडल्यास, हया संसारात अशी कोणतीच शक्ती नाही जे तुमच्या मार्गात अडथळा करेल, बंधनात अडकून ठेवू शकेल किंवा तुमच मनोरथ ( मनाची ईच्छा) पूर्ण होण्यास अडचण करेल.   सच्चा गुरुच उपदेश हेचं आहे की  हे सर्व सोडून स्वावलंबी होऊन जा.  जेंव्हा पर्यन्त स्वावलंबी होणार नाही तेंव्हा पर्यन्त तुमचं आत्मबळ विकसित होणार नाही, तेंव्हा पर्यन्त तुम्ही पूर्ण सुखी व जीवनमुक्त होऊ शकत नाही.   मुक्ती, आनंद, शक्ती, आरोग्य आणि ज्ञान प्राप्ती साठी सर्वात ऊत्तम साधन स्वावलंबी होण, आत्मज्ञानी आणि आत्मबल आहे.  आत्मबळ सर्वात मोठी शक्ती आहे.  आम्हाला जे पाहिजे ते प्राप्त करू शकतो.   आम्ही जे होऊ इच्छितो ते होऊ शकतो पण आमचं त्यावर दृढ विश्वास पाहिजे.  मनुष्य स्वतः हुन गुलामी करतो,  स्वतः हुन दारू पितो आणि  जुव्वा खेळतो ( कष्ट न करता पैसै मिळवणे हा हेतू असतो) . मनुष्य आपण हुन कल्पित व धार्मिक ईश्वराचे दास बनतो. जर मनुष्य आपण हुन वाईट मार्गावर न गेल्यास,  वाईट विचारांच अनुसरण न केल्यास, संसारात अशी कोणतीच शक्ती नाही जी त्याच्या आत्म प्रगतीस थांबवू शकते.आत्म्यात अनंत शक्ती आहे.  🕉️🪷🌞🙏🏻','Sadhguru Vani: Believing or relying on God: People say ordinary people, we are trusting God.  If God wants, we will be saved.  In this world, our Indians who live on the trust of God are our residents and are at the forefront of progress.   When Russia was on the verge of God, he was hell.  When they left the trust on God, they were fun.  If Russia had gained self -realization, it would have been more dry.   This (Russia) country is afraid of falling because they do not believe in self -esteem, they all rely on heavy science. India has relys on God because of its rely on God.  Sadhguru believes that there will be nothing to do with God\'s will, which will happen by your will.  Whatever you want, want to be self -confident and firmly, you must go.   Do not understand yourself, if you do not doubt your self -esteem, if you do not have any obligation to yourself, there is no power in the world that will obstruct your path, stuck in a bond or difficulty in fulfilling your mind.   The true Guru preaching is that it should be self -reliant.  Until you will not be self -sufficient, you will not be able to be full of happiness and life unless you will not develop your self -esteem.   The most excellent tool for liberation, happiness, power, health and knowledge is self -reliant, self -realized and self -reliant.  Self -esteem is the largest power.  We can get what we want.   Whatever we want to happen, we need strong faith in it.  A man himself slaves him, drinks himself and plays Jupva (the intention is to get money without hard work). Man becomes a slave of a fantasy and religious God. If a man does not follow the bad ways, he does not follow the bad thoughts, there is no power in the world that can stop his self -progress.  The soul has an infinite power.','प.पु.श्री.अशोककाका शास्त्री','2025-08-24',1,'2025-08-24 16:43:09','2025-08-24 16:43:09','सद्गुरू वाणी: ईश्र्वरावर विश्र्वास किंवा विसंबून राहणे: लोक सामान्य पने म्हणतात, आम्ही तर ईश्र्वरावर विश्र्वास ठेवून आहोत.  जर ईश्वराची इच्छा झाल्यास आमचं उद्धार होऊन जाईल.  हया संसारात ईश्वराच्या भरोस्या वर राहणारे सर्वात अधिक आमचे भारतवासीच आहेत आणि प्रगतीच्या वाटेवर  पाहिल्यास सर्वात मागे आहेत.   रशिया देश जेंव्हा पर्यन्त ईश्वराच्या भरोस्या वर होता त्यानी नरकच भोगला.  जेंव्हा ईश्वरावर त्यांनी भरोसा सोडला त्यांच जीवन मजेत झाल.  जर रशिया चया लोकांनी आत्मज्ञानी प्राप्त केलं असतं तर अधिक सूखी झाले असते.   हया ( रशिया) देशाला पतन होण्याची भीती असते कारण की ते आत्मबलास मानत नाहीत, ते सर्व जड विज्ञानावर विसंबून आहेत. भारतवर्ष ईश्र्वरावर अवलंबून असल्यानेच  आलसी ( निषकर्मण्य ) झाला आहे.  सद्गुरू विश्वासाने सांगतात की ईश्वराच्या इच्छेने कांहीच होणार नाही, जे होईल तुमच्या इच्छेनेच होईल.  जे तुम्हास पाहिजे, जसं व्हायचं असेल तस आत्मविश्र्वास व दृढतेने  ईच्छा करा,  अवश्य तसच होऊन जाता.   तुम्ही स्वतःस निर्बल समजू नका,  जर स्वतः तुम्ही आत्मबलावर शंका न केल्यास, जर स्वतः मनानि कोणत्या बंधनात न पडल्यास, हया संसारात अशी कोणतीच शक्ती नाही जे तुमच्या मार्गात अडथळा करेल, बंधनात अडकून ठेवू शकेल किंवा तुमच मनोरथ ( मनाची ईच्छा) पूर्ण होण्यास अडचण करेल.   सच्चा गुरुच उपदेश हेचं आहे की  हे सर्व सोडून स्वावलंबी होऊन जा.  जेंव्हा पर्यन्त स्वावलंबी होणार नाही तेंव्हा पर्यन्त तुमचं आत्मबळ विकसित होणार नाही, तेंव्हा पर्यन्त तुम्ही पूर्ण सुखी व जीवनमुक्त होऊ शकत नाही.   मुक्ती, आनंद, शक्ती, आरोग्य आणि ज्ञान प्राप्ती साठी सर्वात ऊत्तम साधन स्वावलंबी होण, आत्मज्ञानी आणि आत्मबल आहे.  आत्मबळ सर्वात मोठी शक्ती आहे.  आम्हाला जे पाहिजे ते प्राप्त करू शकतो.   आम्ही जे होऊ इच्छितो ते होऊ शकतो पण आमचं त्यावर दृढ विश्वास पाहिजे.  मनुष्य स्वतः हुन गुलामी करतो,  स्वतः हुन दारू पितो आणि  जुव्वा खेळतो ( कष्ट न करता पैसै मिळवणे हा हेतू असतो) . मनुष्य आपण हुन कल्पित व धार्मिक ईश्वराचे दास बनतो. जर मनुष्य आपण हुन वाईट मार्गावर न गेल्यास,  वाईट विचारांच अनुसरण न केल्यास, संसारात अशी कोणतीच शक्ती नाही जी त्याच्या आत्म प्रगतीस थांबवू शकते.आत्म्यात अनंत शक्ती आहे.  🕉️🪷🌞🙏🏻','Sadhguru Vani: Believing or relying on God: People say ordinary people, we are trusting God.  If God wants, we will be saved.  In this world, our Indians who live on the trust of God are our residents and are at the forefront of progress.   When Russia was on the verge of God, he was hell.  When they left the trust on God, they were fun.  If Russia had gained self -realization, it would have been more dry.   This (Russia) country is afraid of falling because they do not believe in self -esteem, they all rely on heavy science. India has relys on God because of its rely on God.  Sadhguru believes that there will be nothing to do with God\'s will, which will happen by your will.  Whatever you want, want to be self -confident and firmly, you must go.   Do not understand yourself, if you do not doubt your self -esteem, if you do not have any obligation to yourself, there is no power in the world that will obstruct your path, stuck in a bond or difficulty in fulfilling your mind.   The true Guru preaching is that it should be self -reliant.  Until you will not be self -sufficient, you will not be able to be full of happiness and life unless you will not develop your self -esteem.   The most excellent tool for liberation, happiness, power, health and knowledge is self -reliant, self -realized and self -reliant.  Self -esteem is the largest power.  We can get what we want.   Whatever we want to happen, we need strong faith in it.  A man himself slaves him, drinks himself and plays Jupva (the intention is to get money without hard work). Man becomes a slave of a fantasy and religious God. If a man does not follow the bad ways, he does not follow the bad thoughts, there is no power in the world that can stop his self -progress.  The soul has an infinite power.');
/*!40000 ALTER TABLE `satsang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shivtandav_lyrics`
--

DROP TABLE IF EXISTS `shivtandav_lyrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shivtandav_lyrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `verse_number` int NOT NULL,
  `content` text NOT NULL,
  `language` varchar(10) DEFAULT 'mr',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shivtandav_lyrics`
--

LOCK TABLES `shivtandav_lyrics` WRITE;
/*!40000 ALTER TABLE `shivtandav_lyrics` DISABLE KEYS */;
INSERT INTO `shivtandav_lyrics` VALUES (18,1,'॥ अथ रावणकृतशिवताण्डवस्तोत्रम् ॥\n\n               ॥ श्रीगणेशाय नमः ॥\n\nजटाटवीगलज्जलप्रवाहपावितस्थले\n  गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं\n  चकार चण्डताण्डवं तनोतु नः शिवः शिवम्','mr'),(19,2,'जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी-\n     -विलोलवीचिवल्लरीविराजमानमूर्धनि ।\nधगद्धगद्धगज्ज्वलल्ललाटपट्टपावके\n      किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम','mr'),(20,3,'धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुर\n      स्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे ।\nकृपाकटाक्षधोरणीनिरुद्धदुर्धरापदि\n      क्वचिद्दिगम्बरे(क्वचिच्चिदम्बरे) मनो विनोदमेतु वस्तुनि','mr'),(21,4,'जटाभुजङ्गपिङ्गलस्फुरत्फणामणिप्रभा\n      कदम्बकुङ्कुमद्रवप्रलिप्तदिग्वधूमुखे ।\nमदान्धसिन्धुरस्फुरत्त्वगुत्तरीयमेदुरे\n     मनो विनोदमद्भुतं बिभर्तु भूतभर्तरि','mr'),(22,5,'सहस्रलोचनप्रभृत्यशेषलेखशेखर\n     प्रसूनधूलिधोरणी विधूसराङ्घ्रिपीठभूः ।\nभुजङ्गराजमालया निबद्धजाटजूटक\n     श्रियै चिराय जायतां चकोरबन्धुशेखरः','mr'),(23,6,'ललाटचत्वरज्वलद्धनञ्जयस्फुलिङ्गभा-\n    -निपीतपञ्चसायकं नमन्निलिम्पनायकम् ।\nसुधामयूखलेखया विराजमानशेखरं\n     महाकपालिसम्पदेशिरोजटालमस्तु नः','mr'),(24,7,'करालभालपट्टिकाधगद्धगद्धगज्ज्वल-\n     द्धनञ्जयाहुतीकृतप्रचण्डपञ्चसायके ।\nधराधरेन्द्रनन्दिनीकुचाग्रचित्रपत्रक-\n    -प्रकल्पनैकशिल्पिनि त्रिलोचने रतिर्मम','mr'),(25,8,'नवीनमेघमण्डली निरुद्धदुर्धरस्फुरत्-\n     कुहूनिशीथिनीतमः प्रबन्धबद्धकन्धरः ।\nनिलिम्पनिर्झरीधरस्तनोतु कृत्तिसिन्धुरः\n     कलानिधानबन्धुरः श्रियं जगद्धुरन्धरः','mr'),(26,9,'प्रफुल्लनीलपङ्कजप्रपञ्चकालिमप्रभा-\n    -वलम्बिकण्ठकन्दलीरुचिप्रबद्धकन्धरम् ।\nस्मरच्छिदं पुरच्छिदं भवच्छिदं मखच्छिदं\n     गजच्छिदान्धकच्छिदं तमन्तकच्छिदं भजे','mr'),(27,10,'अखर्व(अगर्व)सर्वमङ्गलाकलाकदम्बमञ्जरी\n     रसप्रवाहमाधुरी विजृम्भणामधुव्रतम् ।\nस्मरान्तकं पुरान्तकं भवान्तकं मखान्तकं\n     गजान्तकान्धकान्तकं तमन्तकान्तकं भजे','mr'),(28,11,'जयत्वदभ्रविभ्रमभ्रमद्भुजङ्गमश्वस-\n    -द्विनिर्गमत्क्रमस्फुरत्करालभालहव्यवाट् ।\nधिमिद्धिमिद्धिमिध्वनन्मृदङ्गतुङ्गमङ्गल\n     ध्वनिक्रमप्रवर्तित प्रचण्डताण्डवः शिवः','mr'),(29,12,'दृषद्विचित्रतल्पयोर्भुजङ्गमौक्तिकस्रजोर्-\n    -गरिष्ठरत्नलोष्ठयोः सुहृद्विपक्षपक्षयोः ।\nतृणारविन्दचक्षुषोः प्रजामहीमहेन्द्रयोः\n     समं प्रवर्तयन्मनः कदा सदाशिवं भजे','mr'),(30,13,'कदा निलिम्पनिर्झरीनिकुञ्जकोटरे वसन्\n     विमुक्तदुर्मतिः सदा शिरः स्थमञ्जलिं वहन् ।\nविमुक्तलोललोचनो ललामभाललग्नकः\n     शिवेति मन्त्रमुच्चरन् कदा सुखी भवाम्यहम्','mr'),(31,14,'निलिम्पनाथनागरीकदम्बमौलमल्लिका-\n     निगुम्फनिर्भरक्षरन्मधूष्णिकामनोहरः ।\nतनोतु नो मनोमुदं विनोदिनीमहर्निशं\n     परश्रियः परं पदंतदङ्गजत्विषां चयः','mr'),(32,15,'प्रचण्डवाडवानलप्रभाशुभप्रचारणी\n     महाष्टसिद्धिकामिनीजनावहूतजल्पना ।\nविमुक्तवामलोचनाविवाहकालिकध्वनिः\n     शिवेति मन्त्रभूषणा जगज्जयाय जायताम्','mr'),(33,16,'इदम् हि नित्यमेवमुक्तमुत्तमोत्तमं स्तवं\n     पठन्स्मरन्ब्रुवन्नरो विशुद्धिमेतिसन्ततम् ।\nहरे गुरौ सुभक्तिमाशु याति नान्यथा गतिं\n     विमोहनं हि देहिनां सुशङ्करस्य चिन्तनम्','mr'),(34,17,'पूजावसानसमये दशवक्त्रगीतं\n     यः शम्भुपूजनपरं पठति प्रदोषे ।\nतस्य स्थिरां रथगजेन्द्रतुरङ्गयुक्तां\n     लक्ष्मीं सदैव  सुमुखिं प्रददाति शम्भुः','mr');
/*!40000 ALTER TABLE `shivtandav_lyrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(10) NOT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  `otp_verified` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Nitin','9552271965','830692','2025-08-27 16:13:06',1,'2025-08-27 16:03:21','2025-08-27 14:55:53','2025-08-27 16:03:21');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `virtuous_photos`
--

DROP TABLE IF EXISTS `virtuous_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `virtuous_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `alt_text` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `virtuous_photos`
--

LOCK TABLES `virtuous_photos` WRITE;
/*!40000 ALTER TABLE `virtuous_photos` DISABLE KEYS */;
INSERT INTO `virtuous_photos` VALUES (1,'/static/images/virtue1.jpg','सत्य','सत्य ही परम धर्म आहे','सत्य का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31'),(2,'/static/images/virtue2.jpg','अहिंसा','अहिंसा परमो धर्म:','अहिंसा का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31'),(3,'/static/images/virtue3.jpg','करुणा','करुणा ही सर्वोच्च गुण आहे','करुणा का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31'),(4,'/static/images/virtue4.jpg','प्रेम','प्रेम ही ईश्वराची भेट आहे','प्रेम का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31'),(5,'/static/images/virtue5.jpg','धैर्य','धैर्य धर्माचा आधार आहे','धैर्य का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31'),(6,'/static/images/virtue6.jpg','सेवा','सेवा ही सर्वोत्तम साधना आहे','सेवा का चित्र',1,'2025-08-24 06:41:31','2025-08-24 06:41:31');
/*!40000 ALTER TABLE `virtuous_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wisdom_quotes`
--

DROP TABLE IF EXISTS `wisdom_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wisdom_quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
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

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-27 16:27:08
