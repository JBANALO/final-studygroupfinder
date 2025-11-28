-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Nov 25, 2025 at 03:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `study_group`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `target` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `group_id`, `user_id`, `title`, `description`, `created_at`) VALUES
(1, 50, 30, 'cskndcsvds', 'ashlaeyeknffnfvncmfdbjefjfn,vxv', '2025-11-24 13:27:15'),
(2, 50, 30, 'cv 1', 'omit the part where balh blahcnjdr', '2025-11-24 13:39:19'),
(3, 50, 30, 'hello', 'dapat isa lang', '2025-11-24 14:32:16');

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `size` int(11) NOT NULL,
  `current_members` int(11) DEFAULT 1,
  `course` varchar(100) DEFAULT NULL,
  `topic` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
  `remarks` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_sent` tinyint(1) DEFAULT 0,
  `visibility` enum('visible','hidden') DEFAULT 'visible'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `group_name`, `description`, `created_by`, `size`, `current_members`, `course`, `topic`, `location`, `created_at`, `status`, `remarks`, `updated_at`, `email_sent`, `visibility`) VALUES
(44, 'study group', 'sfndfgbdf', 30, 3, 2, 'bsit', 'algebra', 'library', '2025-11-23 12:03:17', 'approved', NULL, '2025-11-23 15:36:17', 0, 'visible'),
(45, 'study group', 'sfndfgbdf', 30, 3, 2, 'bsit', 'algebra', 'library', '2025-11-23 12:04:38', 'approved', NULL, '2025-11-23 15:14:39', 0, 'visible'),
(46, 'study group', 'test desc', 30, 3, 1, 'bsit', 'algebra', 'library', '2025-11-23 12:05:52', 'approved', NULL, '2025-11-23 12:05:52', 0, 'visible'),
(47, 'studs', 'test pls pls pls', 30, 4, 5, 'bscs', 'algorithm', 'lab 1', '2025-11-23 12:35:16', 'approved', NULL, '2025-11-23 14:37:28', 0, 'visible'),
(48, 'latest', 'another test', 30, 5, 1, 'pls work now', 'so tired', 'potato', '2025-11-23 12:51:36', 'declined', 'test decline', '2025-11-23 12:51:58', 0, 'visible'),
(49, 'fayeee', 'test lang', 32, 5, 2, 'bsit', 'gurl', 'lib', '2025-11-24 07:36:19', 'approved', NULL, '2025-11-24 07:37:57', 0, 'visible'),
(50, 'new ash group', 'another test', 30, 3, 2, 'bscs', 'miss universe', 'room 3', '2025-11-24 11:25:54', 'approved', NULL, '2025-11-25 00:45:13', 0, 'visible'),
(51, 'inbox test', 'ui fixing', 32, 5, 1, 'bsit', 'xmas', 'lab 1', '2025-11-24 11:29:38', 'approved', NULL, '2025-11-24 11:30:07', 0, 'visible');

-- --------------------------------------------------------

--
-- Table structure for table `group_join_requests`
--

CREATE TABLE `group_join_requests` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','approved','declined') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_join_requests`
--

INSERT INTO `group_join_requests` (`id`, `group_id`, `user_id`, `status`, `requested_at`) VALUES
(1, 47, 32, 'pending', '2025-11-23 13:40:21');

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','declined') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_members`
--

INSERT INTO `group_members` (`id`, `group_id`, `user_id`, `joined_at`, `status`, `requested_at`) VALUES
(21, 45, 30, '2025-11-23 12:04:38', 'pending', '2025-11-23 14:02:00'),
(22, 46, 30, '2025-11-23 12:05:52', 'pending', '2025-11-23 14:02:00'),
(23, 47, 30, '2025-11-23 12:35:16', 'approved', '2025-11-23 14:02:00'),
(24, 48, 30, '2025-11-23 12:51:36', 'pending', '2025-11-23 14:02:00'),
(25, 47, 32, '2025-11-23 14:02:55', 'pending', '2025-11-23 14:02:55'),
(26, 46, 32, '2025-11-23 14:38:01', 'pending', '2025-11-23 14:38:01'),
(27, 45, 32, '2025-11-23 15:11:38', 'approved', '2025-11-23 15:11:38'),
(28, 44, 32, '2025-11-23 15:36:10', 'approved', '2025-11-23 15:36:10'),
(29, 49, 32, '2025-11-24 07:36:19', 'pending', '2025-11-24 07:36:19'),
(30, 49, 30, '2025-11-24 07:37:43', 'approved', '2025-11-24 07:37:43'),
(31, 50, 30, '2025-11-24 11:25:54', 'pending', '2025-11-24 11:25:54'),
(33, 51, 32, '2025-11-24 11:29:38', 'pending', '2025-11-24 11:29:38'),
(34, 51, 30, '2025-11-24 11:30:33', 'pending', '2025-11-24 11:30:33'),
(35, 50, 32, '2025-11-25 00:45:06', 'approved', '2025-11-25 00:45:06');

-- --------------------------------------------------------

--
-- Table structure for table `group_messages`
--

CREATE TABLE `group_messages` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `text` text DEFAULT NULL,
  `file_link` text DEFAULT NULL,
  `time` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_messages`
--

INSERT INTO `group_messages` (`id`, `group_id`, `sender_id`, `text`, `file_link`, `time`) VALUES
(1, 47, 30, 'hiiiii', NULL, '2025-11-24 01:15:04'),
(2, 47, 32, 'hello', NULL, '2025-11-24 01:15:17'),
(3, 47, 30, 'Screenshot 2025-08-18 221008.png', 'http://localhost:5000/uploads/file-1763918135232-400234623.png', '2025-11-24 01:15:35'),
(4, 47, 32, 'thanks', NULL, '2025-11-24 01:15:50'),
(5, 47, 30, 'hi again!', NULL, '2025-11-24 01:21:14'),
(6, 47, 32, 'yes?', NULL, '2025-11-24 01:21:28'),
(7, 47, 32, 'help me pls', NULL, '2025-11-24 01:25:59'),
(8, 47, 30, 'why?', NULL, '2025-11-24 01:26:17'),
(9, 47, 30, 'plsss', NULL, '2025-11-24 01:28:48'),
(10, 47, 32, 'fine', NULL, '2025-11-24 01:29:04'),
(11, 47, 30, 'tanginang yan', NULL, '2025-11-24 01:32:16'),
(12, 47, 30, 'porke seh?', NULL, '2025-11-24 01:32:47'),
(13, 47, 30, 'tnaginosnvosdv', NULL, '2025-11-24 01:35:11'),
(14, 47, 30, 'fdfbdb', NULL, '2025-11-24 01:35:44'),
(15, 47, 30, 'vdfd', NULL, '2025-11-24 01:35:56'),
(16, 47, 30, 'vdfbd', NULL, '2025-11-24 01:36:04'),
(17, 47, 30, 'fgbfgn', NULL, '2025-11-24 01:36:30'),
(18, 47, 30, 'gfbbd', NULL, '2025-11-24 01:41:29'),
(19, 47, 30, 'ccccc', NULL, '2025-11-24 01:41:37'),
(20, 47, 30, 'ccccccccccccc', NULL, '2025-11-24 01:42:15'),
(21, 47, 30, 'g', NULL, '2025-11-24 01:44:49'),
(22, 47, 32, 'alnsdnvsan;va', NULL, '2025-11-24 01:48:11'),
(23, 47, 32, 'nnn\'', NULL, '2025-11-24 01:48:17'),
(24, 47, 30, 'fffff', NULL, '2025-11-24 01:48:30'),
(25, 47, 32, 'gfbf', NULL, '2025-11-24 01:48:42'),
(26, 47, 30, 'ffff', NULL, '2025-11-24 01:52:10'),
(27, 47, 30, 'fffff', NULL, '2025-11-24 01:53:45'),
(28, 47, 30, 'fffffff', NULL, '2025-11-24 01:58:49'),
(29, 47, 30, 'ffffererf', NULL, '2025-11-24 01:58:54'),
(30, 47, 32, 'vdvdd', NULL, '2025-11-24 01:59:02'),
(31, 45, 32, 'hi', NULL, '2025-11-24 02:04:21'),
(32, 45, 30, 'yeah?', NULL, '2025-11-24 02:04:29'),
(33, 45, 32, 'luh', NULL, '2025-11-24 02:04:40'),
(34, 45, 30, 'inamo', NULL, '2025-11-24 02:04:48'),
(35, 45, 32, 'Screenshot 2025-08-17 202132.png', 'http://localhost:5000/uploads/file-1763921095234-296015378.png', '2025-11-24 02:04:55'),
(36, 45, 32, 'bat ayaw?', NULL, '2025-11-24 04:26:55'),
(37, 45, 30, 'boba tea', NULL, '2025-11-24 04:27:04'),
(38, 45, 32, 'gnarly', NULL, '2025-11-24 04:27:14'),
(39, 49, 30, 'hiiiii', NULL, '2025-11-24 15:38:23'),
(40, 49, 32, 'haluuu', NULL, '2025-11-24 15:38:35'),
(41, 50, 32, 'hii', NULL, '2025-11-24 21:40:33'),
(42, 50, 30, 'helaurn', NULL, '2025-11-24 21:40:42'),
(43, 50, 30, 'BATADCNKD', NULL, '2025-11-25 00:11:01'),
(44, 50, 32, 'huh?', NULL, '2025-11-25 00:11:10'),
(45, 50, 30, 'wala gagi hahaha, wrong sent', NULL, '2025-11-25 00:11:20'),
(46, 50, 32, 'ayy okie', NULL, '2025-11-25 00:11:29'),
(47, 50, 32, 'Screenshot 2025-08-17 202132.png', 'http://localhost:5000/uploads/file-1764000697632-425788236.png', '2025-11-25 00:11:37'),
(48, 50, 30, 'halaaa', NULL, '2025-11-25 00:14:28'),
(49, 50, 30, 'ddffdfdf', NULL, '2025-11-25 00:14:57'),
(50, 50, 30, 'na namanaaaa', NULL, '2025-11-25 00:15:08'),
(51, 50, 30, 'bakit yanaananana', NULL, '2025-11-25 00:15:18'),
(52, 50, 30, 'kimi', NULL, '2025-11-25 00:16:24'),
(53, 50, 30, 'luh', NULL, '2025-11-25 00:16:57'),
(54, 50, 32, 'slr', NULL, '2025-11-25 00:17:09'),
(55, 50, 30, 'btat man daw invalid date na naman?', NULL, '2025-11-25 08:44:27');

-- --------------------------------------------------------

--
-- Table structure for table `group_pending_requests`
--

CREATE TABLE `group_pending_requests` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_starred` tinyint(1) DEFAULT 0,
  `is_archived` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `type` varchar(50) DEFAULT 'general',
  `related_id` int(11) DEFAULT NULL,
  `requester_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`, `is_starred`, `is_archived`, `is_deleted`, `type`, `related_id`, `requester_id`) VALUES
(27, 30, 'New Join Request!', 'faye_test wants to join \"study group\"', 1, '2025-11-23 15:36:10', 0, 1, 0, 'join_request', 44, 32),
(28, 32, 'You\'re In!', 'You have been approved to join \"study group\"!', 1, '2025-11-23 15:36:17', 0, 0, 0, 'general', 44, NULL),
(29, 30, 'Member Approved', 'You approved faye_test to join \"study group\"', 0, '2025-11-23 15:36:17', 0, 0, 0, 'general', 44, NULL),
(30, 32, 'Your Study Group was APPROVED!', 'Great news! Your group \"fayeee\" has been approved and is now visible to all students. Start inviting members!', 0, '2025-11-24 07:36:50', 0, 0, 0, 'general', NULL, NULL),
(31, 32, 'New Join Request!', 'villanueva wants to join \"fayeee\"', 1, '2025-11-24 07:37:43', 0, 1, 0, 'join_request', 49, 30),
(32, 30, 'You\'re In!', 'You have been approved to join \"fayeee\"!', 0, '2025-11-24 07:37:57', 0, 1, 0, 'general', 49, NULL),
(33, 32, 'Member Approved', 'You approved villanueva to join \"fayeee\"', 0, '2025-11-24 07:37:57', 0, 0, 0, 'general', 49, NULL),
(34, 30, 'Your Study Group was APPROVED!', 'Great news! Your group \"new ash group\" has been approved and is now visible to all students. Start inviting members!', 1, '2025-11-24 11:26:06', 0, 0, 0, 'general', NULL, NULL),
(35, 30, 'New Join Request!', 'faye_test wants to join \"new ash group\"', 1, '2025-11-24 11:26:24', 0, 1, 0, 'join_request', 50, 32),
(36, 32, 'You\'re In!', 'You have been approved to join \"new ash group\"!', 0, '2025-11-24 11:26:30', 0, 0, 0, 'general', 50, NULL),
(37, 30, 'Member Approved', 'You approved faye_test to join \"new ash group\"', 0, '2025-11-24 11:26:30', 1, 0, 0, 'general', 50, NULL),
(38, 32, 'Your Study Group was APPROVED!', 'Great news! Your group \"inbox test\" has been approved and is now visible to all students. Start inviting members!', 0, '2025-11-24 11:30:07', 0, 0, 0, 'general', NULL, NULL),
(39, 32, 'New Join Request!', 'villanueva wants to join \"inbox test\"', 0, '2025-11-24 11:30:33', 0, 0, 0, 'join_request', 51, 30),
(40, 30, 'New Join Request!', 'faye_test wants to join \"new ash group\"', 1, '2025-11-25 00:45:06', 0, 1, 0, 'join_request', 50, 32),
(41, 32, 'You\'re In!', 'You have been approved to join \"new ash group\"!', 0, '2025-11-25 00:45:13', 0, 0, 0, 'general', 50, NULL),
(42, 30, 'Member Approved', 'You approved faye_test to join \"new ash group\"', 0, '2025-11-25 00:45:13', 0, 0, 0, 'general', 50, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reported_by` int(11) NOT NULL,
  `reported_user` int(11) DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','resolved') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `groupId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `meetingLink` varchar(255) DEFAULT NULL,
  `attendees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `googleEventId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `meetingType` enum('physical','online') NOT NULL DEFAULT 'physical',
  CHECK (json_valid(`attendees`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `groupId`, `title`, `description`, `start`, `end`, `location`, `meetingLink`, `attendees`, `googleEventId`, `createdAt`, `updatedAt`, `meetingType`) VALUES
(7, 45, 'algebra', 'quiz 2', '2025-11-24 01:00:00', '2025-11-24 02:00:00', 'library', NULL, '[]', '2h4jhsu4nip5rv8d000gftvvao', '2025-11-23 18:06:37', '2025-11-23 18:06:37', 'physical'),
(8, 45, 'algebra', 'quiz 2', '2025-11-24 01:00:00', '2025-11-24 02:00:00', 'library', NULL, '[]', 'g7gamdh2frap49n1qi48ok7aq0', '2025-11-23 18:06:38', '2025-11-23 18:06:38', 'physical'),
(9, 45, 'algebra', 'quiz 2', '2025-11-24 01:00:00', '2025-11-24 02:00:00', 'library', NULL, '[]', 'epf8oabqctor8cn0kgbmluetuk', '2025-11-23 18:06:38', '2025-11-23 18:06:38', 'physical'),
(10, 45, 'pls pls', 'busy scheds', '2025-11-25 01:00:00', '2025-11-25 02:00:00', 'online', NULL, '[]', '2sbmb37pvomhk5pa04p4j4p3b4', '2025-11-23 18:21:50', '2025-11-23 18:21:50', 'physical'),
(11, 45, 'realtime', '', '2025-11-23 18:26:00', '2025-11-23 19:27:00', 'lab', NULL, '[]', 'qohuar8344l7h89pviltcnc034', '2025-11-23 18:27:19', '2025-11-23 18:27:19', 'physical'),
(12, 45, 'sna real na', '', '2025-11-23 18:32:00', '2025-11-23 20:32:00', 'lab 2', NULL, '[]', 'bg5b0a7pl4gfvhl19k04o9v2b8', '2025-11-23 18:32:26', '2025-11-23 18:32:26', 'physical'),
(13, 45, 'last na to ', '', '2025-11-23 18:36:00', '2025-11-23 22:36:00', 'lib', NULL, '[]', '79c1k6uot8vaisvva537b75q70', '2025-11-23 18:36:52', '2025-11-23 18:36:52', 'physical'),
(14, 45, 'alam mo', 'sdvdsv', '2025-11-23 18:39:00', '2025-11-23 20:39:00', 'bfbd', NULL, '[]', '0a7su0f1qrq24e993alpno1qc8', '2025-11-23 18:39:20', '2025-11-23 18:39:20', 'physical'),
(15, 45, 'fortnight', 'vevrr', '2025-11-23 20:42:00', '2025-11-23 22:42:00', 'feve', NULL, '[]', '8lpblorjpm74ignv385dhsfsis', '2025-11-23 18:43:07', '2025-11-23 18:43:07', 'physical'),
(16, 45, 'SE', 'virtual', '2025-11-23 19:40:00', '2025-11-23 21:40:00', 'Online', NULL, '[]', 'bv6c42vebh8m5scp0hop25ovg0', '2025-11-23 19:41:04', '2025-11-23 19:41:04', 'online'),
(17, 45, 'SE', 'virtual', '2025-11-23 19:40:00', '2025-11-23 21:40:00', 'Online', NULL, '[]', 'p7d99mjfqbaqjinnbk2d7lqb6k', '2025-11-23 19:41:05', '2025-11-23 19:41:05', 'online'),
(18, 45, 'SE', 'virtual', '2025-11-23 19:40:00', '2025-11-23 21:40:00', 'Online', NULL, '[]', '2sravud3hj30qe4g7hmem9fso0', '2025-11-23 19:41:05', '2025-11-23 19:41:05', 'online'),
(19, 45, 'meet', 'virtual', '2025-11-23 19:48:00', '2025-11-23 19:48:00', 'Online', NULL, '[]', '59ef2ra0tupgvtd7m8t22qvio4', '2025-11-23 19:48:26', '2025-11-23 19:48:26', 'online'),
(20, 45, 'kingina', 'iiyak ako', '2025-11-23 20:24:00', '2025-11-23 21:24:00', 'Online', NULL, '[]', 'h252fiqksnfgvqp2viedqq0tg0', '2025-11-23 20:25:08', '2025-11-23 20:25:08', 'online'),
(21, 49, 'se', 'need to finalize flow', '2025-11-24 09:00:00', '2025-11-24 10:00:00', 'Online', NULL, '[]', 'a8rhssbm6c8tnfcrjbeunqo6eo', '2025-11-24 07:46:45', '2025-11-24 07:46:45', 'online'),
(22, 50, 'cv2', 'sdsdsdsdds', '2025-11-24 13:46:00', '2025-11-24 14:46:00', 'lib', NULL, '[]', 'r7crfcl0fm1or1vi9fntaaplsc', '2025-11-24 13:46:59', '2025-11-24 13:46:59', 'physical'),
(23, 50, 'study date test again', 'kingkang', '2025-11-24 14:15:00', '2025-11-24 14:15:00', 'Online', NULL, '[]', 'j9ptrmq8rvd1gsfod1kq66v59g', '2025-11-24 14:15:40', '2025-11-24 14:15:40', 'online'),
(24, 50, 'another test again ', 'pls dapat isa lang', '2025-11-24 14:21:00', '2025-11-24 15:21:00', 'room 101', NULL, '[]', '6etpgq1edto2gp78sekteosek8', '2025-11-24 14:21:41', '2025-11-24 14:21:41', 'physical'),
(25, 50, 'plsss dapat isa lang', 'aaaaaaaaaaaaaaaaaaaa', '2025-11-24 14:29:00', '2025-11-24 15:29:00', 'lr3', NULL, '[]', '982l0opmjq78t2d123r59l91v4', '2025-11-24 14:30:13', '2025-11-24 14:30:13', 'physical'),
(26, 50, 'last naaaa', 'aaaaaaaaaaaaaa', '2025-11-24 14:30:00', '2025-11-24 15:30:00', 'lr5', NULL, '[]', 'jlosaekeocm7qsdpccqb2fpqvs', '2025-11-24 14:30:55', '2025-11-24 14:30:55', 'physical'),
(27, 50, '1 only', 'wwwwwwwwwwwwwww', '2025-11-24 14:44:00', '2025-11-24 15:44:00', 'lr2', NULL, '[]', 'ed5c9a2gkftg1qdocat95slkdg', '2025-11-24 14:44:48', '2025-11-24 14:44:48', 'physical'),
(28, 50, 'last na talaga', 'qwerty', '2025-11-24 03:45:00', '2025-11-24 04:45:00', 'canteen b', NULL, '[]', 'l4gvbmisulbfte9pj6iejbau8g', '2025-11-24 14:47:16', '2025-11-24 14:47:16', 'physical'),
(29, 50, 'peste', 'qqqqqqqqqqqqqq', '2025-11-24 14:48:00', '2025-11-24 15:49:00', 'canteen', NULL, '[]', 'cqr8146vbhv1sef9bqbc8ctkd0', '2025-11-24 14:49:15', '2025-11-24 14:49:15', 'physical'),
(30, 50, 'wiww', '', '2025-11-25 00:03:00', '2025-11-25 01:03:00', 'Online', NULL, '[]', 'd0k4d7ntear51kh33fu4prep8o', '2025-11-24 15:04:07', '2025-11-24 15:04:07', 'online'),
(31, 50, 'witwis', '', '2025-11-25 00:06:00', '2025-11-25 01:06:00', 'Online', NULL, '[]', 'jm3prbjjg3f7q9uqjkpf6f2luk', '2025-11-24 15:06:55', '2025-11-24 15:06:55', 'online'),
(32, 50, 'ookokokokoko', '', '2025-11-24 21:12:00', '2025-11-24 22:12:00', 'Online', NULL, '[]', 'ipu2qaaa4sqmvga41totuge0lk', '2025-11-24 15:12:30', '2025-11-24 15:12:30', 'online'),
(33, 50, 'temp', '', '2025-11-25 07:21:00', '2025-11-25 08:21:00', 'Online', NULL, '[]', 'u7daa90ps0es7i75p4jg27ptm4', '2025-11-24 15:21:34', '2025-11-24 15:21:34', 'online'),
(34, 50, 'try ulitttt', '', '2025-11-26 06:29:00', '2025-11-26 07:29:00', 'Online', NULL, '[]', 'ba6s5lnr5tlbusm5pmp717d7e8', '2025-11-24 15:29:19', '2025-11-24 15:29:19', 'online'),
(35, 50, 'tnagina bat wla pa rin', '', '2025-11-25 07:41:00', '2025-11-25 08:42:00', 'Online', 'https://meet.google.com/ust-mbhq-nfq', '[]', '1dmiq00fqjnosrg7h58u2ab3t0', '2025-11-24 15:42:15', '2025-11-24 15:42:15', 'online');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_code` varchar(10) DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expire` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','banned') DEFAULT 'active',
  `bio` text DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `username`, `email`, `password`, `google_id`, `is_verified`, `verification_code`, `reset_password_token`, `reset_password_expire`, `created_at`, `status`, `bio`, `profile_photo`, `is_admin`) VALUES
(30, 'Ashley Nicole', 'Natividad', 'Villanueva', 'kingkang', 'hz202300368@wmsu.edu.ph', '$2b$10$PKkK8XMpZpXMM9tgJQOjMuodsexDzvQ2vHuO680UhLQ7k.D2qkGdu', '100842068459846969411', 1, NULL, NULL, NULL, '2025-11-23 11:29:57', 'active', 'senyoraaaa', 'profile_1763897491311.png', 0),
(32, 'Ashley Faye', 'Mapula', 'Vega', 'faye_test', 'hz202304005@wmsu.edu.ph', '$2b$10$iAVc2QlrlzMQOaAOyqK7kuSPqTcho6ej3jhX/2hxqjyE01i./P.9S', NULL, 1, NULL, NULL, NULL, '2025-11-23 13:34:36', 'active', 'plsssssss', 'profile_1763909618696.png', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_groups_created_by` (`created_by`);

--
-- Indexes for table `group_join_requests`
--
ALTER TABLE `group_join_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`group_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_membership` (`group_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `group_messages`
--
ALTER TABLE `group_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `group_pending_requests`
--
ALTER TABLE `group_pending_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`group_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reported_by` (`reported_by`),
  ADD KEY `reported_user` (`reported_user`),
  ADD KEY `group_id` (`group_id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `groupId` (`groupId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `group_join_requests`
--
ALTER TABLE `group_join_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `group_messages`
--
ALTER TABLE `group_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `group_pending_requests`
--
ALTER TABLE `group_pending_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `fk_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `group_join_requests`
--
ALTER TABLE `group_join_requests`
  ADD CONSTRAINT `group_join_requests_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_join_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `group_messages`
--
ALTER TABLE `group_messages`
  ADD CONSTRAINT `group_messages_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`),
  ADD CONSTRAINT `group_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `group_pending_requests`
--
ALTER TABLE `group_pending_requests`
  ADD CONSTRAINT `group_pending_requests_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_pending_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_user`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
