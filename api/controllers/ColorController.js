module.exports = {
  get: function(req, res){
    Color.find({}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok({data:results});
      }
    })
  }
}
