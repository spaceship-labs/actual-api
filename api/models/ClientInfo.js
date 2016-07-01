module.exports = {
  migrate: 'alter',
  attributes: {

    title: {type:'string'},
    gender: {type:'string'},
    Client:{
      model:'Client'
    }
  }
};
