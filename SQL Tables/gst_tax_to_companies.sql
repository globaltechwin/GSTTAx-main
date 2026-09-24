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
-- Table structure for table `to_companies`
--

DROP TABLE IF EXISTS `to_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `to_companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gstNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `to_companies`
--

LOCK TABLES `to_companies` WRITE;
/*!40000 ALTER TABLE `to_companies` DISABLE KEYS */;
INSERT INTO `to_companies` VALUES (1,'SRP IT SOLUTIONS','URP','10001','2026-05-25','2026-08-05 09:25:03.302','2026-08-05 09:25:03.302','No-12,F2, FIRST FLOOR,ANANDA ROAD,ALWARPET, CHENNAI, Tamil Nadu, 600018',NULL,'Tamil Nadu','33'),(2,'To Company1','Gst At To Company Added 1','Vendor Code 1 At To Company Added','2026-04-21','2026-08-05 09:25:03.302','2026-08-05 09:25:03.302','POOTHAPEDU, PORUR, CHENNAI, Tamil Nadu',NULL,'Tamil Nadu','33'),(3,'SRP IT SOLUTIONS PRIVATE LIMITED','29AABCS1234K1ZP','VND-1001','2025-01-20','2026-08-05 16:22:09.121','2026-08-05 16:22:09.121','56/1, Hosur Road, Bommanahalli, BANGALORE, Karnataka, 560068',NULL,'Karnataka','29'),(4,'Tata Communications Limited','27AABCT1234L1ZQ','VND-1002','2025-03-15','2026-08-05 16:22:09.121','2026-08-05 16:22:09.121','FC 601, 6th Floor, Marathon Futurex, Mafatlal Mills Compound, N.M. Joshi Marg, Lower Parel, MUMBAI, Maharashtra, 400013',NULL,'Maharashtra','27'),(5,'Infosys BPM Limited','29AABCI1234M1ZR','VND-1003','2024-11-08','2026-08-05 16:22:09.121','2026-08-05 16:22:09.121','Plot No. 44/45, Survey No. 30/1, Hitech City, HYDERABAD, Telangana, 500081',NULL,'Karnataka','29'),(6,'Zoho Corporation Pvt Ltd','29AABCZ1234N1ZS','VND-1004','2025-06-22','2026-08-05 16:22:09.121','2026-08-05 16:22:09.121','Estancia IT Park, Plot No. 140, GST Road, Vikram Iyapakkam, CHENNAI, Tamil Nadu, 600130',NULL,'Tamil Nadu','33'),(7,'Freshworks Technologies','29AABCF1234P1ZT','','2025-02-10','2026-08-05 16:22:09.121','2026-08-05 16:22:09.121','Surya Towers, 2nd Floor, #19, Village Road, Nungambakkam, CHENNAI, Tamil Nadu, 600034',NULL,'Tamil Nadu','33');
/*!40000 ALTER TABLE `to_companies` ENABLE KEYS */;
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
