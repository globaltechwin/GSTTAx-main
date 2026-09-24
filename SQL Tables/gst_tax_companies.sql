-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: gst_tax
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3fd18d6c-85d6-11f1-94f2-1bd5ddd17f09:1-16102';

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gstNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `ssiNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panNo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `esiNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `epfNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `bank_account_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_branch_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_holder_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'Touch4bill','','rjszstems@gmail.com','2026-04-28','','','7010991925','','CHENNAI, Tamil Nadu','','2026-08-05 09:24:04.918','2026-08-05 09:24:04.918','active','1789115000001492','NANMANGALAM','ADHITI TECH','KVBL0001789','Karur Vysya Bank','Tamil Nadu','33','www.adhitech.com'),(2,'Company2','33Abcdef1234j1zh','Email@Email.com','2026-04-21','','Asdfs1234a','123456789','','456 Park Avenue, Mumbai','','2026-08-05 09:24:04.918','2026-08-05 09:24:04.918','active','1789115000001492','NANMANGALAM','ADHITI TECH','KVBL0001789','Karur Vysya Bank','Tamil Nadu','33',NULL),(3,'Company1','22aabbccd9221j','','2026-04-21','','23456hjkj1j','','','789 Gandhi Road, Delhi','','2026-08-05 09:24:04.918','2026-08-05 09:24:04.918','active',NULL,NULL,NULL,NULL,NULL,'Delhi','07',NULL),(4,'Infosys Limited','29AAACI1234F1Z5','contact@infosys.com','2025-01-15',NULL,'AAACI1234F','08028520281',NULL,'Electronics City, Hosur Road, Bangalore',NULL,'2026-08-05 16:17:14.755','2026-08-05 16:17:14.755','active','1234567890123','Electronics City','INFOSYS LIMITED','SBIN0001234','State Bank of India','Karnataka','29',NULL),(5,'Wipro Enterprises','29AABCW1234K1ZP','info@wipro.com','2025-03-22',NULL,'AABCW1234K','8028447777',NULL,'Doddakannelli, Sarjapur Road, Bangalore',NULL,'2026-08-05 16:17:14.755','2026-08-05 16:17:14.755','active',NULL,NULL,NULL,NULL,NULL,'Karnataka','29',NULL),(6,'Tata Consultancy','27AAACT1234M1ZQ','tcs@tata.com','2024-11-10',NULL,'AAACT1234M','2267891234',NULL,'Nirlon Knowledge Park, Mumbai',NULL,'2026-08-05 16:17:14.755','2026-08-05 16:17:14.755','active',NULL,NULL,NULL,NULL,NULL,'Maharashtra','27',NULL),(7,'HCL Technologies','29AABCH1234N1ZR','support@hcltech.com','2025-06-01',NULL,'AABCH1234N','1204387654',NULL,'6th Floor, Shiv Nadar Tower, Chennai',NULL,'2026-08-05 16:17:14.755','2026-08-05 16:17:14.755','inactive',NULL,NULL,NULL,NULL,NULL,'Tamil Nadu','33',NULL),(8,'Tech Mahindra','27AABCT1234P1ZS','enterprise@techmahindra.com','2025-02-18',NULL,'AABCT1234P','2033234567',NULL,'Pipeline Road, Pune',NULL,'2026-08-05 16:17:14.755','2026-08-05 16:17:14.755','pending',NULL,NULL,NULL,NULL,NULL,'Maharashtra','27',NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24  9:14:10
