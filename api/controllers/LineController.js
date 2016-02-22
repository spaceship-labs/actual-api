module.exports = {
  get: function(req, res){
    Line.find({}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok({data:results});
      }
    })
  }
}
