ALTER TABLE  `Product` CHANGE  `GuaranteeText`  `GuaranteeText` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL;
ALTER TABLE  `Product` CHANGE  `PackageContent`  `PackageContent` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL;
ALTER TABLE  `Product` ADD  `Color` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `productfilter` ADD  `IsMultiple` TINYINT( 1 ) NOT NULL;


ALTER TABLE  `Product` ADD  `OnOffline` TINYINT( 1 ) NOT NULL;
ALTER TABLE  `Product` ADD  `OnStudio` TINYINT( 1 ) NOT NULL;
ALTER TABLE  `Product` ADD  `OnHome` TINYINT( 1 ) NOT NULL;
ALTER TABLE  `Product` ADD  `OnKids` TINYINT( 1 ) NOT NULL;
ALTER TABLE  `Product` ADD  `OnAmueble` TINYINT( 1 ) NOT NULL;


ALTER TABLE  `productmaterial` ADD  `IsWood` TINYINT( 1 ) NOT NULL ,
ADD  `IsMetal` TINYINT( 1 ) NOT NULL ,
ADD  `IsSynthetic` TINYINT( 1 ) NOT NULL ,
ADD  `IsOrganic` TINYINT( 1 ) NOT NULL ,
ADD  `IsGlass` TINYINT( 1 ) NOT NULL
