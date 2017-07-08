module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'userweb';
    var extraParams = {
      searchFields: ['firstName','email'],
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    
    var userQuery =  UserWeb.findOne({id: id});

    userQuery.then(function(result){
      res.ok({data:result});
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });      
  },

  create: function(req, res){
    var form = req.allParams();
    UserWeb.create(form)
      .then(function(_user){
        return res.ok({user: _user});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });     
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    delete form.password;
    UserWeb.update({id: id}, form)
      .then(function(user){
        return res.ok({
          user: user
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }
};