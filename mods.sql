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


ALTER TABLE  `Product` ADD  `GuaranteeUnit` INT NOT NULL;
ALTER TABLE  `Product` ADD  `GuaranteeUnitMsr` VARCHAR( 30 ) NOT NULL;
ALTER TABLE  `Product` ADD  `DesignedInCountry` VARCHAR( 30 ) NOT NULL;
ALTER TABLE  `Product` ADD  `MadeInCountry` VARCHAR( 30 ) NOT NULL;
ALTER TABLE  `Product` ADD  `EnsembleTime` VARCHAR( 100 ) NOT NULL;

ALTER TABLE  `Product` ADD  `Length` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `Product` ADD  `Width` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `Product` ADD  `Height` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `Product` ADD  `Volume` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `Product` ADD  `Weight` VARCHAR( 255 ) NOT NULL;

ALTER TABLE  `Product` ADD  `icon_description` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `Product` ADD  `Video` TEXT NOT NULL;
ALTER TABLE  `Product` ADD  `Conservation` LONGTEXT NOT NULL;

ALTER TABLE  `Product` ADD  `CommercialPieces` INT NOT NULL;
ALTER TABLE  `Product` ADD  `DeliveryPieces` INT NOT NULL;
ALTER TABLE  `Product` ADD  `SA` VARCHAR( 255 ) NOT NULL;

ALTER TABLE  `Product` ADD  `Handle` VARCHAR( 255 ) NOT NULL;
ALTER TABLE  `productfilter` ADD  `ValuesOrder` VARCHAR( 255 ) NOT NULL;


ALTER TABLE  `user` ADD  `company` VARCHAR( 255 ) NOT NULL;

ALTER TABLE  `Product` ADD  `Brand` INT NOT NULL;
ALTER TABLE  `Product` ADD  `Grouper` VARCHAR( 17 ) NOT NULL;

#COLORS
INSERT INTO `actual_test`.`productcolor` (`Name`, `Handle`, `Code`, `hash`, `id`, `createdAt`, `updatedAt`) VALUES ('Rojo', NULL, '#CC0000', NULL, NULL, NULL, NULL), ('Naranja', NULL, '#FB940B', NULL, NULL, NULL, NULL), ('Amarillo', NULL, '#FFFF00', NULL, NULL, NULL, NULL), ('Verde', NULL, '#00CC00', NULL, NULL, NULL, NULL), ('Turquesa', NULL, '#03C0C6', NULL, NULL, NULL, NULL), ('Azul', NULL, '#0000FF', NULL, NULL, NULL, NULL), ('Morado', NULL, '#762CA7', NULL, NULL, NULL, NULL), ('Rosa', NULL, '#FF98BF', NULL, NULL, NULL, NULL), ('Blanco', NULL, '#FFFFFF', NULL, NULL, NULL, NULL), ('Negro', NULL, '#000000', NULL, NULL, NULL, NULL), ('Gris', NULL, '#999999', NULL, NULL, NULL, NULL), ('Cafe', NULL, '#885418', NULL, NULL, NULL, NULL);
