/*
 Navicat Premium Data Transfer

 Source Server         : HOSXP_Slave_7
 Source Server Type    : MySQL
 Source Server Version : 101111
 Source Host           : 192.168.1.7:3306
 Source Schema         : lmwccdb

 Target Server Type    : MySQL
 Target Server Version : 101111
 File Encoding         : 65001

 Date: 13/10/2026 15:57:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for nationality
-- ----------------------------
DROP TABLE IF EXISTS `nationality`;
CREATE TABLE `nationality`  (
  `name` varchar(50) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `nationality` char(3) CHARACTER SET tis620 COLLATE tis620_thai_ci NOT NULL,
  `nhso_code` varchar(3) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `hos_guid` varchar(38) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `zip09_code` varchar(10) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  `inv_unuse` char(1) CHARACTER SET tis620 COLLATE tis620_thai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`nationality`) USING BTREE,
  UNIQUE INDEX `ix_name`(`name`) USING BTREE,
  INDEX `ix_hos_guid`(`hos_guid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = tis620 COLLATE = tis620_thai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of nationality
-- ----------------------------
INSERT INTO `nationality` VALUES ('ไม่ระบุ', '00', '000', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อเมริกา', '03', '029', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เยอรมัน', '04', '004', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ผรั่งเศส', '05', '005', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เดนมาร์ก', '06', '006', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('สวีเดน', '07', '007', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('สวีสเซอร์แลนด์', '08', '008', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อิตาลี', '09', '009', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('นอร์เวย์', '10', '010', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ออสเตรีย', '11', '011', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไอร์แลนด์', '12', '012', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ฟินแลนด์', '13', '013', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เบลเยี่ยม', '14', '014', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เสปน', '15', '015', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('รัสเซีย', '16', '016', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('โปแลนด์', '17', '017', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เชคโกสโลวาเกีย', '18', '018', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ฮังการี', '19', '019', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('กรีก', '20', '020', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ยูโกสลาเวีย', '21', '021', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ลักเซมเบอร์ก', '22', '022', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('วาติกัน', '23', '023', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('มอลต้า', '24', '024', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อัลบาเนีย', '25', '025', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('บัลกาเรีย', '26', '026', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('รูเมเนีย', '27', '027', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไซปรัส', '28', '028', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('โปรตุเกส', '29', '029', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('คานาดา', '30', '030', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เม็กซิโก', '31', '031', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('คิวบา', '32', '032', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อาร์เจนตินา', '33', '033', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('บราซิล', '34', '034', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ชิลี', '35', '035', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อีคัวดอร์', '36', '036', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('โคลัมเบีย', '37', '037', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('บาร์บาดอส', '38', '038', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เปรู', '39', '039', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ปานามา', '40', '040', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อุรุกวัย', '41', '041', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เวเนสุเอล่า', '42', '042', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เปอร์โตริโก้', '43', '043', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('จีน', '44', '044', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อินเดีย', '45', '045', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เวียดนาม', '46', '046', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ญี่ปุ่น', '47', '047', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('พม่า', '48', '048', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ฟิลิปปินส์', '49', '049', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('มาเลเซีย', '50', '050', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อินโดนีเซีย', '51', '051', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ปากีสถาน', '52', '052', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เกาหลีใต้', '53', '053', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('สิงคโปร์', '54', '054', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เนปาล', '55', '055', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ลาว', '56', '056', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('กัมพูชา', '57', '057', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ศรีลังกา', '58', '058', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ซาอุดิอารเบีย', '59', '059', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อิสราเอล', '60', '060', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เลบานอน', '61', '061', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อิหร่าน (เปอร์เซีย)', '62', '062', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เตอร์กี', '63', '063', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('บังคลาเทศ', '64', '064', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อาหรับ', '65', '065', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ซีเรีย', '66', '066', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อิรัค', '67', '067', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('คูเวต', '68', '068', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('บรูไน', '69', '069', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อาฟริกาใต้', '70', '070', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ยูดาน', '71', '071', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ตูนีเซีย', '72', '072', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เคนยา', '73', '073', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อียิปต์', '74', '074', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เอธิโอเปีย', '75', '075', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ออสเตรเลีย', '79', '079', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('นิวซีแลนด์', '80', '080', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ชาวเขาที่ไม่ได้สัญชาติไทย', '84', '084', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ญวนอพยพ', '85', '085', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('จีนฮ่อ', '86', '086', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อดีตทหารจีนคณะชาติ', '87', '087', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('พม่าพลัดถิ่น', '88', '088', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('เขมรเกาะกงกัมพูชา', '89', '089', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ผู้อพยพอินโดจีนสัญชาติลาว', '90', '090', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ผู้อพยพอินโดจีนสัญชาติกัมพูชา', '91', '091', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ผู้อพยพอินโดจีนสัญชาติเวียดนาม', '92', '092', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไทย-อิสลาม, อิสลาม-ไทย', '94', '094', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไทย-จีน, จีน-ไทย', '95', '095', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไร้สัญชาติ', '96', '096', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('อื่น ๆ', '97', '097', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไม่ได้สัญชาติไทยตาม ปว.337', '98', '098', NULL, NULL, NULL);
INSERT INTO `nationality` VALUES ('ไทย', '99', '099', NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
