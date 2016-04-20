module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},

    IsWood:{type:'boolean'},
    IsMetal:{type:'boolean'},
    IsSynthetic:{type:'boolean'},
    IsOrganic:{type:'boolean'},
    IsGlass:{type:'boolean'},

		Products:{
			collection:'product',
			through: 'product_productmaterial'
		}

	}
}
