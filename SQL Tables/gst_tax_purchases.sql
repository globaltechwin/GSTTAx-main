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
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gst_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `party_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `taxable_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `igst` decimal(12,2) NOT NULL DEFAULT '0.00',
  `cgst` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sgst` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (2,'URP','SEVALAYA- CITY OFFICE','34','2026-08-06','Tamil Nadu',18.00,208000.00,37440.00,0.00,0.00,245440.00,'2026-08-06 11:47:15.301','2026-08-06 11:59:21.499'),(3,'Gst At To Company Added 1','To Company1','33','2026-08-06','Tamil Nadu',16.00,208000.00,33280.00,0.00,0.00,245440.00,'2026-08-06 11:59:50.398','2026-08-06 11:59:50.398'),(4,'Gst At To Company Added 1','To Company1','33','2026-08-06','Tamil Nadu',16.00,208000.00,33280.00,0.00,0.00,245440.00,'2026-08-07 03:38:34.007','2026-08-07 03:38:34.007'),(5,'URP','SEVALAYA- CITY OFFICE','34','2026-08-06','Tamil Nadu',18.00,208000.00,37440.00,0.00,0.00,245440.00,'2026-08-07 03:38:39.339','2026-08-07 03:38:39.339');
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
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
