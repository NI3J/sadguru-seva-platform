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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_programs`
--

LOCK TABLES `daily_programs` WRITE;
/*!40000 ALTER TABLE `daily_programs` DISABLE KEYS */;
INSERT INTO `daily_programs` VALUES (12,'2025-07-30','आज मौजे टाकळी(जेवळी) येथे काळभैरव नाथ मंदिरात मुर्ती प्राणप्रतिष्ठा सोहळ्याच्या आयोजना निमित्त सायंकाळी ७ वाजता ग्रामस्थ टाकळी व परिसरातील भक्ताच्या उपस्थितीत नियोजन मिटींग होणार आहे.ज्यांना शक्य आहे त्या गुरुबंधु नी सायंकाळी ७ वाजता टाकळी येथे हजर राहावे.','Nitin'),(13,'2025-07-30','आज मौजे टाकळी(जीवळी) येथे कालभैरवनाथ मंदिरात मुर्ती प्राणप्रतिष्ठा सोहळ्यानिमित्त प.पु.गुरुदेव मार्गदर्शन करीत आहेत.','Nitin'),(14,'2025-08-07','आज प.पु.बाबाजी बोपला आश्रमात आहेत ज्या भक्तांना दर्शन घ्यायचे आहे त्यांनी यावे.','Nitin'),(19,'2025-08-07','आज जगतमाता गोशाळा(वडवळ जानवळ) येथे प.पु.गुरुदेव बाबांच्या मार्गदर्शनात गोशाळेच्या व्यवस्थापनाची मिटींग पार पडली. त्या प्रसंगी ह.भ.प.गोविंद महाराज,श्री ह.भ.प. बळीराम महाराज,बाबा माने महाराज,गिरी महाराज,यज्ञकांत महाराज सर्वांनी बाबांची पाद्यपुजा करुन आशीर्वाद घेतला.','Nitin'),(20,'2025-08-08','आज टाकळी जीवळी येथील भक्तांनी विकास मार्ट 5नंबर चौक लातूर येथे येऊन बाबांची भेट घेऊन टाकळी येथे 21नोव्हेम्बर2025  पासून प्रारंभ होणाऱ्या महायज्ञाच्या संदर्भात मार्गदर्शन घेतले.','Nitin'),(21,'2025-08-14','आज बाबा आश्रमात आहेत ज्या भक्तांना दर्शन घ्यायचे आहे त्यांनी दर्शन घ्यावे.','Nitin'),(22,'2025-08-14',' ततो रुद्र प्रचोदितात ||  \r\n🕉️ || सत्य संकल्पाचा दाता नारायण ||\r\n\r\n📅 उद्य दि. 15 ऑगष्ट 2025 रोजी  \r\n📍 श्री राधाकृष्ण मंदिर, गातेगाव येथे  \r\n🙏 श्री कृष्ण जन्माष्टमी निमित्त प.पू. बाबाजी\r\n\r\n🕑 दुपारी 2 वाजेपासून  \r\nप.पू. बाबाजी गातेगाव येथील मंदिरात उपस्थित राहणार आहेत.\r\n\r\n🌙 रात्री 10 ते 12 वाजता  \r\nया ठिकाणी प.पू. बाबांचे प्रवचन होईल  \r\n🎉 जन्माष्टमीचा कार्यक्रम होईल  \r\n🪔 नंतर आरती व प्रसाद होईल\r\n\r\n📣 तरी आपण सर्वांनी सायंकाळी 4 वाजेपासूनच हजर राहावे  \r\nही बाबांची आज्ञा आहे.','Nitin');
/*!40000 ALTER TABLE `daily_programs` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_number` (`page_number`),
  KEY `date_index` (`date`),
  KEY `active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `satsang`
--

LOCK TABLES `satsang` WRITE;
/*!40000 ALTER TABLE `satsang` DISABLE KEYS */;
INSERT INTO `satsang` VALUES (2,1,'शुभ कर्म व अशुभ कर्म',' जीवनात मनुष्यांच्या हातून शुभ व अशुभ कर्म कळत नकळत होत असते. त्याचे फळ देखील त्या कर्मा बरोबरच जोडलेले आहे. शुभ कर्म/ छान कर्म केल्याने त्याचे फळ ह्याच जीवनात मिळतें, तुम्हास सुखी जीवन प्राप्त होते. तसेच अशुभ कर्म केल्याने त्याचे फळ देखील ह्याच जीवनात भोगावे लागते. कर्म करावयास परमेश्वराने सर्व जीवास स्वतंत्रता दिली आहे. कर्मा प्रमाणे सर्वांना फळ ह्याच जीवनात मिळते. त्यात परमेश्वराचे अजिबात हस्तक्षेप नसते. तुम्ही देवासमोर कितीही प्रार्थना करा कर्मा प्रमाणे फळ लागूनच असते व ते भोगावेच लागते. पुण्य, शुभ कर्म केल्याने मिळते व त्याचे फळ म्हणून सुखी जीवन प्राप्त होते. हिंदू सनातन धर्मात एक कुटुंबास फार महत्व दिले आहे, तसेच एक पत्नीव्रत /सतिवृता असणे फार आवश्यक व अध्यत्मिक दृष्टीने अतिशय महत्वाचे आहे. जर कुटुंबा पैकी कोणीही व्यक्ती बाह्य अनैतिक संबंध ठेवले तर त्या माध्यमातून त्या कुटुंबात पाप कर्म आपोआपच संचित/ हस्तांतरीत होतात व त्याचे परिणाम त्या कुटुंबास भोगावे लागतात. हया कारणाने हिंदू धर्मात एक पत्नीव्रत/सतिवृत असणे फार आवश्यक आहे. नसता त्याचे परिणाम दुखदायी असतात. सद्गुरूंनी स्पष्टपने सांगितल आहे की पर-स्त्री पासून सावधान असावे त्याचे कारणं म्हणजे, परस्त्रीसी संबंध ठेवल्याने त्या व्यक्तीचे सर्व पापकर्म नकळत आपोआपच हस्तांतरित होतात. त्याचे फळ त्या पुरुषास व स्त्रीस भोगावे लागतात. म्हणूनच राम ऊत्तम परम पुरूष संबोधिले जातात कारणं ते शेवट पर्यंत एक पत्नीव्रत होतें. अध्यत्मात उच्चतम शिखर गाठण्यासाठी एक पत्नीव्रत असणे फार आवश्यक आहे. हेच ब्रह्मचर्य आहे. तसेच गुरुशी देखील एकनिष्टता असणे फार आवश्यक आहे तरच तुमची आत्मप्रगती होते व शेवटच्या क्षणी आत्म्दर्शन/ परमेश्वराचे दर्शन घडते. स्वतःच्या आत्म्यावर निष्ठा असणे अती आवश्यक आहे, तरच परमेश्वराचे दर्शन घडते. सद्गुरू कडे मनुष्य ह्याच उद्देशाने जातो की त्यांच्या आशिर्वादाने सर्व पाप कर्म शुद्ध व्हावे म्हणून. सद्गुरू आपल्या योग शक्तीने, ध्यान अग्निने भक्तांचे सर्व दुःख पापाचे निवारण करतात. चित्त शुध्दी होऊन नंतर आत्म्प्रगती साठी आम्ही योग्य होतो. जेंव्हा आम्ही त्यांचें चरण स्पर्श करतो त्यासंग आमचे सर्व अवगुण सद्गुरू स्वीकार करून ते आशिर्वाद रूपाने आमचं अंतःकरण शुद्ध करून टाकतात. जगात सद्गुरुंचे स्थान हे एकच आहे जेथे तुमचे सर्व कर्म शुद्ध होऊन अध्यात्मात व संसारात प्रगति करू शकतो. हया व्यतिरिक्त दुसरें स्थान जे आहेत ते फक्त संसारातील इच्छा पूर्ण करण्यासाठी ',' In life, humans unknowingly perform both good and bad deeds. The fruits of these deeds are intertwined with them. Good deeds yield their rewards in this very life, leading to a happy existence, while bad deeds also have consequences that must be endured in this life. God has granted all living beings the freedom to act, and everyone receives rewards appropriate to their deeds in this life; there is no divine interference in this. No matter how much you pray to God, the results are tied to your actions, and you must experience them. Merit and happiness come from performing good deeds. In Hindu Sanatan Dharma, great importance is placed on the concept of family, and being devoted to one’s wife is considered essential and profoundly significant from a spiritual perspective. If any member of the family engages in unethical external relationships, the sins naturally accumulate or transfer within that family, and its members have to face the consequences. For this reason, it is crucial to uphold the principle of having a single wife or being devoted to one’s spouse in Hinduism; otherwise, the results can be unfortunate. The Satguru (spiritual teacher) has clearly stated that one must be cautious around other women, because engaging with them can unknowingly result in all of one’s sins transferring. The outcomes of these actions must be experienced by both the man and the woman. Hence, Rama is referred to as the supreme person, as he adhered to the vow of a single wife until the end. To reach the highest peak in spirituality, being committed to one wife is essential; this is also the essence of Brahmacharya (celibacy). Moreover, having unwavering faith in the Guru is necessary for personal progress, allowing for a vision of the Self or God in the end. Dedication to one’s own soul is critically important, as this leads to the realization of God. People approach the Satguru with the intention that through their blessings, all sins may be purified. The Satguru, through their yogic powers and the fire of meditation, alleviates all the devotees\' pains and sins. Once the mind is purified, we become eligible for spiritual progress. When we touch their feet, the Satguru accepts all our flaws and purifies our inner selves through their blessings. In this world, the place of the Satguru is unique, where all your deeds can be cleansed, allowing progress in spirituality and worldly matters. Besides this, other places exist only for the fulfillment of worldly desires. 🪷🌺🕉🙏🏻  ','प.पु.श्री.अशोककाका शास्त्री','2025-08-17',1,'2025-08-17 09:55:25','2025-08-17 09:55:25'),(4,2,'सद्गुरू वाणी','सत्य, सुंदर आणि स्वतंत्र विचार: मनुष्य मनोमय ( विचार मय)  आहे .  तो सर्वथा असाच आहे, जसं त्याचे विचार, मन व अंतःकरण आहे.    विचार, मन व अंतःकरनास  कोणतीही शक्ती परतंत्र करू शकत नाही, जर तो स्वतःहुन परतंत्र होण्याची इच्छा ठेवत नसेल तर.  सुखी, मुक्त होणे व स्वाधीनता दुसऱ्याच्या हातात नसून आपल्याच हाती आहे.  जर तुम्हास खरंच स्वतंत्र होण्याची इच्छा असेल तर आजच तुम्ही स्वतंत्र आहात.  मनुष्य एक मनोमय प्राणी आहे,  जर त्याचे मन, विचार बुध्दी आणि अंतःकरण निष्पक्ष , स्वाधीन आणि स्वतंत्र  असेल तर तो देखील स्वतंत्रच आहे.  संसारात अशी कोणतीच शक्ती नाही जी खऱ्या स्वतंत्र व स्वालंबी पुरुषास दाबू शके.   मनुष्य जो गुलाम बनतो  तो आपल्या विचारानेच.   भारत वासियांना कोण सांगितल की आपल भल्याच काम न करता ईश्वरा समोर  रात्रं दिवस प्रार्थना करीत राहा?  हिंदू मुसलमानच्या ईश्वराने केंव्हा सांगितल की त्यांच्या करीता एकमेका विरुद्ध लढत  रहा?   अमेरिका आणि युरोपीय ह्यांना कोणी सांगितल की तुम्ही धनाचे गुलाम बना?  कोणीच नाही.  मनुष्य स्वतःच आपल्या विचाराने दुःख व संकटात सापडून आहे.   इंग्रजांला आम्ही म्हणू शकतो की आमच्या देशावर बळजबरीने राज्य केलें,  पण आज तुम्हीं शेकडो वर्षांपासून जे मूर्ती, देवतांचे गुलाम बनून आहात किंवा ईश्वरा समोर नत मस्तक होता, असं करावयास कोणी सांगितलं?  का खरंच कोणत्या ईश्वराने,  मुर्तीने व देवांनी सांगितलं की  तुम्हीं आमची गुलामी करा, आह्मास आपले मालक समजा?  का ईश्वराला आमची सेवेची आणि सहायतेची आवश्यकता आहे?  का केंव्हा ईश्वराने सांगितल की सर्व काम सोडुन घंटी वाजवत राहा?   का ईश्वराने केंव्हा सांगितल की आमचं नाम घेउन ढोलकी वाजत नाचत राहा?  का केंव्हा ईश्वराने सांगितल की तुम्ही लोक आह्मस आपल स्वामी, मालक आणि राजा समजून स्वतःला गुलाम समजा?  का ईश्वराने कधी सांगितल की त्यांच्या इच्छे विरुद्ध एक तृण देखील हलू शकत नाही आणि त्यामुळे आळसी व  काम न करता बसून राहा?  केंव्हाच नाही.  असे कांहींच नसून हे सर्व ईश्वराच्या नावावर पुस्तकात लिहून संसार समोर ठेवलं आहे .  हयात ईश्वराच कांहीच दोष नाही. सर्व काही आमच्याच विचाराचं दोष आहे. भारतीय लोकांना रामदास, कृष्ण सेवक आणि गुलाम हुसेन म्हणून घेण्यास फार आनंद होतो.  ते स्वामी मालक बनण्याची इच्छाच ठेवत नाही.   परतंत्राचे भाव प्रथम विचार रुपात मनात निर्माण होतात. नंतर तेच विचार स्थूलास प्राप्त होतात.  सर्व काही विचारावराच अवलंबून असते. जर तुम्ही स्वतंत्र, स्वाधीन व मुक्त होऊ इच्छिता तर आपले विचार बदलून टाका . विचार द्वारा स्वतंत्र व स्वाधीन होण्यास कोणतीच अडचण  नाही.  संसारात अशी कोणतीच शक्ती नाही की  तुमच्या बुध्दीला व स्वतंत्र होण्यास अडथळा आणू शकते.  जर तुम्ही पूर्णतः स्वतंत्र होऊ इच्छिता तर ईश्वराचे देखील गुलाम होऊ नका. गुलामी आणि सेवक भाव कोणासाठेही असो तो मुक्त होऊ शकतं नाही.  डोक्यातून जुने विचार आणि गुलामीचे भाव काढून टाका तर तुम्ही आताच मुक्त आहा.  मुक्तीचे मार्ग हेचं आहे. 🪷🌼🕉️🙏🏻','True, beautiful and independent thought: Man is a mental being (Vichār Maya). He is exactly as his thoughts, mind and heart are. No power can free his thoughts, mind and heart, if he does not want to be free from himself. Happiness, liberation and independence are not in the hands of others but in your own hands. If you really want to be free, then you are free today. Man is a mental being, if his mind, thoughts, intellect and heart are impartial, independent and independent, then he is also free. There is no such power in the world that can suppress a truly independent and self-reliant man. A man becomes a slave only because of his thoughts. Who will tell the people of India that without doing good deeds, you should pray day and night before God? When will the God of Hindus and Muslims tell you to fight against each other for them? Who will tell America and Europeans that you should become slaves of money? No one. Man himself is in trouble and trouble because of his own thoughts. We can say to the British that they ruled our country by force, but who told you to do what you have been doing for hundreds of years, becoming slaves to idols and gods or bowing your heads before God? Which God, idol and gods told you to become our slaves, to consider us your masters? Why does God need our service and help? When will God tell you to leave all your work and keep ringing the bell? When will God tell you to keep dancing and beating drums in our name? When will God tell you to consider yourself as slaves, considering us your masters, owners and kings? When will God tell you that not even a blade of grass can move against his will and therefore you should sit idle and do nothing? Never. There is no such thing, all this has been written in the name of God and placed before the world. There is no fault of the living God. Everything is the fault of our own thoughts. Indians are very happy to be called Ramdas, Krishna as a servant and Hussain as a slave. They do not want to become masters. The feelings of independence are first created in the mind in the form of thoughts. Later those thoughts reach the physical body. Everything depends on thoughts. If you want to be independent, free and liberated, then change your thoughts. There is no problem in becoming independent and liberated through thoughts. There is no such power in the world that can hinder your intelligence and freedom. If you want to be completely free, then do not become a slave of God either. No one can be free from slavery and servanthood. Remove old thoughts and feelings of slavery from your head, then you are already free. This is the path to liberation. 🪷🌼🕉️🙏🏻','प.पु.श्री.अशोककाका शास्त्री','2025-08-18',1,'2025-08-18 10:26:15','2025-08-18 10:26:15'),(5,3,'स्वप्न सृष्टि:','स्वप्न सृष्टि:   स्वप्नांत आम्ही वेग वेगळे दृश्य, व्यक्ती, प्रसंग, देवी देवतानची मूर्ती , मृत प्रिय व्यक्तींस पाहतो व भेट होते  व सांगतो की आज स्वप्नांत माझे इष्ट देव आले होते, कुटुंबातील प्रीय व्यक्ती येऊन गेलेत, ईत्यादि.  मी मुंबई ला गेलो होतो असे सांगतो.   हयात सत्य काय आहे ते जाणून घेऊ.  पहिली गोष्ट स्वप्नांत आम्ही जे भाव चित्र, देवी देवता किंवा वेग वेगळे चित्र पाहतो, दुसऱ्या देशाला जावून येतो ते सर्व विचार तुमच्या मनात किंवा चित्तात अंकित झालेले असतात. ते वारंवार सदा तेच विचार केल्याने स्वप्नांत तुमचा आत्माच ते सर्व प्रसंग, व्यक्ती, देव ईत्यादि होऊन त्या रुपात  दाखवितो.   जागे झाल्या नंतर तुम्ही सांगता की मी स्वप्नांत हे हे पाहिले.  स्वप्नांत तुम्हीं जे जे पाहता ते सर्व तुमचा आत्माच  तेवढे रूप घेऊन करून दाखवितो.  त्यात तुमच आत्मशक्तीच खर्च होतो.  म्हणुन ज्याना स्वप्न पडतात ते उठल्या नंतर फ्रेश उत्साही नसतात.  ज्यांना गाढ झोप ( स्वप्न नसलेली झोप ) येते ते उठल्या नंतर ताजे टव टवित दिसतात.  त्यांच्यात भरपूर उत्साह असतो.   तर जे स्वप्नांत पाहतो ते सर्व असत्य आहे.  त्यास सत्य समजुन चुकीची समजूत करून घेऊ नये.   स्वप्न न येण्यास , दिवसा झोपू नये, शरीरा पासून काम घ्यावे, शरीर थकल्या नंतर गाढ  झोप येते.  रात्री झोपताना आपल्या इष्ट ईश्वराचे किंवा सद्गुरंचे ध्यान करून झोपावे.   झोपण्याच्या आगोदर 30 -40 मिनटा पुर्वी tv, mobile, paper पासून वेगळे/बंद करून असावे.  हात पाय तोंड धुवून ध्यान, चिंतन, नाम स्मरण करून झोपावे.  सुखाची झोप येते, प्रकृती छान राहते. येणारा दिवस उत्साही व आनंद मय होतो. आत्मदेव की जय हो, तोच तुमचा ईश्वर आहे, अगदी समीप, झोपल्या नंतर तोच तुमची रक्षा करतो व दुसऱ्या दिवशी लागणारी शक्ती पण तोच देतो. 🪷🌞🪷🕉️🙏🏻','Dream Creation: In dreams we see a different view, person, occasion, idol of the goddess, the deity of the goddess, and meets the deceased, and tells that my desirable God came in today, the family of the family has come, etc.  I say that I went to Mumbai.   Let\'s know what the truth is.  The first thing in the dream we see a different picture, the goddess or a different picture, all the thoughts that come to the second country are all in your mind or in the mind. They often think that in the dream, and your soul shows all the occasions, the person, the God, etc. in the dream.   After waking up, you say that I saw this in dreams.  In the dream, what you see in the dream shows all your soul.  It costs your self -power.  Therefore, those who dream are not enthusiastic after they get up.  Those who have a deep sleep (no dreamless sleep) appear to be freshly twisting after getting up.  They have a lot of excitement.   So what is dreaming is all false.  It should not be misunderstood by understanding the truth.   Do not dream, do not sleep during the day, work from the body, the body gets a deep sleep after tired.  When sleeping at night, you should sleep by meditating on your desirable God or Sadgur.   30-40 minutes before bedtime should be separated/closed from TV, Mobile, Paper.  Wash hands and feet and sleep by meditation, memory of the name.  Sleep of happiness comes, nature remains nice. The coming days are excited and joyful. Selfishness Ki Jai Ho, he is your God, even when you sleep, he protects you and gives the same power the next day.','प.पु.श्री.अशोककाका शास्त्री','2025-08-18',1,'2025-08-19 04:56:04','2025-08-19 04:56:04');
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

-- Dump completed on 2025-08-20  5:42:40
