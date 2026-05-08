-- 村级综合管理系统数据库初始化脚本
-- 修复版：与PHP API完全匹配

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 管理员用户表
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `role` varchar(20) DEFAULT 'admin' COMMENT '角色 admin/user',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态 1启用 0禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';

-- 人口死亡登记表（修复版 - 匹配API字段）
DROP TABLE IF EXISTS `death_records`;
CREATE TABLE `death_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '姓名',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `gender` varchar(10) NOT NULL COMMENT '性别',
  `age` int(3) DEFAULT NULL COMMENT '年龄',
  `death_date` date NOT NULL COMMENT '死亡日期',
  `death_time` time DEFAULT NULL COMMENT '死亡时间',
  `death_reason` varchar(200) NOT NULL COMMENT '死亡原因',
  `death_place` varchar(200) DEFAULT NULL COMMENT '死亡地点',
  `village` varchar(50) NOT NULL COMMENT '所属村组',
  `reporter_name` varchar(50) DEFAULT NULL COMMENT '报送人姓名',
  `reporter_phone` varchar(20) DEFAULT NULL COMMENT '报送人电话',
  `reporter_relation` varchar(50) DEFAULT NULL COMMENT '报送人关系',
  `notes` text COMMENT '备注',
  `created_by` int(11) DEFAULT '1' COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人口死亡登记表';

-- 村级联系人表（修复版 - 匹配API字段）
DROP TABLE IF EXISTS `village_contacts`;
CREATE TABLE `village_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '姓名',
  `village` varchar(50) NOT NULL COMMENT '所属村组',
  `position` varchar(50) DEFAULT NULL COMMENT '职务',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `address` varchar(200) DEFAULT NULL COMMENT '地址',
  `notes` text COMMENT '备注',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态 active/inactive',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='村级联系人表';

-- 低保人员表（修复版 - 匹配API字段）
DROP TABLE IF EXISTS `subsistence`;
CREATE TABLE `subsistence` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '姓名',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `gender` varchar(10) DEFAULT NULL COMMENT '性别',
  `age` int(3) DEFAULT NULL COMMENT '年龄',
  `family_count` int(2) DEFAULT NULL COMMENT '家庭人口',
  `village` varchar(50) NOT NULL COMMENT '所属村组',
  `address` varchar(200) DEFAULT NULL COMMENT '家庭住址',
  `allowance_amount` decimal(10,2) DEFAULT NULL COMMENT '补助金额',
  `status` varchar(20) DEFAULT 'active' COMMENT 'status active/inactive',
  `assessment_date` date DEFAULT NULL COMMENT '评定日期',
  `poverty_reason` varchar(200) DEFAULT NULL COMMENT '致贫原因',
  `family_phone` varchar(20) DEFAULT NULL COMMENT '家庭电话',
  `remarks` text COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_card` (`id_card`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='低保人员表';

-- 特困供养人员表（修复版 - 匹配API字段）
DROP TABLE IF EXISTS `special_assistance`;
CREATE TABLE `special_assistance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '姓名',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `gender` varchar(10) DEFAULT NULL COMMENT '性别',
  `age` int(3) DEFAULT NULL COMMENT '年龄',
  `assistance_type` varchar(20) DEFAULT '分散供养' COMMENT '供养类型',
  `allowance_standard` decimal(10,2) DEFAULT NULL COMMENT '补助标准',
  `admission_date` date DEFAULT NULL COMMENT '入住日期(集中供养)',
  `village` varchar(50) NOT NULL COMMENT '所属村组',
  `address` varchar(200) DEFAULT NULL COMMENT '家庭住址',
  `health_status` varchar(50) DEFAULT NULL COMMENT '健康状况',
  `guardian` varchar(50) DEFAULT NULL COMMENT '监护人',
  `guardian_phone` varchar(20) DEFAULT NULL COMMENT '监护人电话',
  `remarks` text COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_card` (`id_card`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='特困供养人员表';

-- 插入默认管理员账号 (密码: admin123)
-- 密码hash使用 password_hash('admin123', PASSWORD_BCRYPT) 生成
INSERT INTO `admin_users` (`username`, `password`, `real_name`, `email`, `role`, `status`) VALUES
('admin', '$2y$10$tAG0SKrmZGLwHYppS1xUje2MLWMOuadHIDjQUNaVn.cLbYbE0WU5S', '系统管理员', 'admin@example.com', 'admin', 1);

-- 插入普通用户测试账号 (密码: user123)
INSERT INTO `admin_users` (`username`, `password`, `real_name`, `email`, `role`, `status`) VALUES
('user', '$2y$10$91Gq07gc77n84VfXF/CjfOEBOEq4jaeOr1UyImmVcUXnLekq1dEHe', '普通用户', 'user@example.com', 'user', 1);

SET FOREIGN_KEY_CHECKS = 1;
