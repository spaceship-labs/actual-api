//APP COLLECTION
module.exports = {
  schema: true,
	attributes:{
    Length:{type:'number', columnType: 'float'},
    LengthUnitMsr:{type:'string'},
    Width:{type:'number', columnType: 'float'},
    WidthUnitMsr:{type:'string'},
    Height:{type:'number', columnType: 'float'},
    HeightUnitMsr:{type:'string'},
    Volume:{type:'number', columnType: 'float'},
    VolumeUnitMsr:{type:'string'},
    Weight:{type:'number', columnType: 'float'},
    WeightUnitMsr:{type:'string'},

    Product:{
      model:'product',
      columnName:'ItemCode',
    }
	}
}
