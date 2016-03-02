var q = require('q');
var moment = require('moment');

module.exports = {

  copyTable: function(_model){
    var deferred = q.defer();
    //console.log(sails.config);
    if(sails.config.tables[_model]){
      getData(_model).then(function(rows){
        truncateTable(_model).then(function(result){
          insertRows(_model, rows).then(deferred.resolve, deferred.reject);
        }, deferred.reject)
      }, deferred.reject);
    }else{
      var err = 'Model not found';
      deferred.reject(err);
    }
    return deferred.promise;
  }
};

/*-----------------------*/
  //USING SQL
/*------------------------*/

function truncateTable(_model){
  var deferred = q.defer();
  var alias = sails.config.tables[_model].tableName;
  var sql = "TRUNCATE TABLE " +   alias + "";

  Mysql_.query(sql,function(err,results){
    if(err){
      console.log(err);
      deferred.reject(err);
    }
    console.log('truncate finish' + new Date());
    deferred.resolve(results);
  });

  return deferred.promise;
}

function checkIfExists(modelName, row, cb){
  var src = sails.config.tables;
  var table = sails.config.tables[_model];
  var alias = _model[modelName].tableName;
  var columns = table.attributes;
  var compositeKeys = '';
  var query = {};
  if(table.compositeKeys){
    for(var i=0;i<table.compositeKeys.length;i++){
      for(col in columns){
        if(col == table.compositeKeys[i]){
          query[col] = row[col];
        }
      }
    }
  }
  else{
    for(col in columns){
      if(col.primaryKey){
        query[col] = row[col];
      }
    }
  }

  conosole.log(query);

  _Model.find({}).limit(1).exec(function(err, results){
    if(err){
      console.log(err);
      cb(true);
    }else{
      console.log('results: ' + results.length);
      if(results.length > 0){
        cb(false);
      }else{
        cb(false);
      }
    }
  });
}

function insertRow(_model, row, cb){
  var src = sails.config.tables;
  var alias = sails.config.tables[_model].tableName;
  var sql = "INSERT INTO " + alias + " ";
  var val = '';
  var date = '';
  var aux = '';

  var columns = sails.config.tables[_model].attributes;

  sql += "( ";
  for(var col in columns){
    if(col != 'id' && col != 'updatedAt'){
      sql += "" + col +",";
    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);
  sql+= ") VALUES";

  sql += "(";
  for(var col in columns){
    //Inserting values by column
    if(col != 'id' && col != 'updatedAt' && !columns[col].excludeSync){

      if(col === 'createdAt'){
        date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
        sql += " '" + date +"',";
      }
      else if(columns[col].type === 'datetime'){
        aux = String(row[col]);
        if(aux == 'null'){
          date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
        }
        else{
          date = moment(new Date(aux)).format('YYYY-MM-DD h:mm:ss');
        }
        sql += " '" + date +"',";
      }
      else{
        val = String(row[col]).replace(/'/g, "\\'");
        if(val == 'null'){
          sql += ' null,';
        }else{
          sql += " '" + val +"',";
        }
      }

    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);
  sql += ")";


  Mysql_.query(sql,function(err,results){
    if(err){
      console.log(err);
      cb();
      //deferred.reject(err);
    }
    cb();
    //console.log('insert finish' + new Date());
    //deferred.resolve(results);
  });

  //return deferred.promise;
}

function insertRows(_model, rows){
  var deferred = q.defer();

  console.log('insert start' + new Date());
  var src = sails.config.tables;
  var alias = sails.config.tables[_model].tableName;
  var sql = "INSERT INTO " + alias + " ";
  var val = '';
  var date = '';
  var aux = '';

  var columns = sails.config.tables[_model].attributes;

  sql += "( ";
  for(var col in columns){
    if(col != 'id' && col != 'updatedAt'){
      sql += "" + col +",";
    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);
  sql+= ") VALUES";

  for(var i=0;i<rows.length;i++){
    sql += "(";
    for(var col in columns){
      //Inserting values by column
      if(col != 'id' && col != 'updatedAt' && !columns[col].excludeSync){

        if(col === 'createdAt'){
          date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
          sql += " '" + date +"',";
        }
        else if(columns[col].type === 'datetime'){
          aux = String(rows[i][col]);
          if(aux == 'null'){
            date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
          }
          else{
            date = moment(new Date(aux)).format('YYYY-MM-DD h:mm:ss');
          }
          sql += " '" + date +"',";
        }
        else{
          val = String(rows[i][col]).replace(/'/g, "\\'");
          if(val == 'null'){
            sql += ' null,';
          }else{
            sql += " '" + val +"',";
          }
        }

      }
    }
    //Deleting last comma
    sql = sql.substring(0, sql.length - 1);
    sql += ")";

    if(i != rows.length - 1 ){
      sql += ","
    }
  }

  Mysql_.query(sql,function(err,results){
    if(err){
      console.log(err);
      deferred.reject(err);
    }
    console.log('insert finish' + new Date());
    deferred.resolve(results);
  });

  return deferred.promise;
}



function getData(_model){
  var deferred = q.defer();

  var columns = sails.config.tables[_model].attributes;
  console.log('read start' + new Date());
  var sql = "SELECT ";
  var i = 0;

  for(col in columns){
    if(col != 'id' && col != 'createdAt' && col != 'updatedAt' && !columns[col].excludeSync){
      if (i!=0) sql+=" , ";
      sql += "" + col +" ";
      i++;
    }
  };

  sql += " FROM [ACTUALKIDS].[dbo].[" + sails.config.tables[_model].tableNameSqlServer + "]";
  console.log(sql);
  Sqlserver_.query(sql, function(err, results){
    if(err){
      deferred.reject(err);
      console.log(err);
    }
    else{
      console.log('read finish' + new Date());
      deferred.resolve(results);
    }
  });

  return deferred.promise;
}


/*-----------------------*/
  //USING WATERLINE
/*------------------------*/

function _getData(_model){
  var deferred = q.defer();
  console.log(new Date());
  var columns = sails.config.tables[_model + '_sqlserver']._attributes;
  var model = sails.config.tables[_model + '_sqlserver'];
  var fields = [];

  for(col in columns){
    if(col != 'id' && col != 'createdAt' && col != 'updatedAt' && !columns[col].excludeSync){
      fields.push(col);
    }
  }

  model.find({},{select: fields}).exec(function(err, results){
    if(err){
      console.log(err);
      deferred.reject(err);
    }else{
      console.log(new Date());
      deferred.resolve(results);
    }
  });

  return deferred.promise;
}

function _copyRows(_model, rows){
  var deferred = q.defer();
  var columns = sails.config.tables[_model].schema;
  Product.create(rows).exec(function(err,created){
    if(err){
      console.log(err);
      deferred.reject(err);
    }else{
      deferred.resolve(created);
    }
  });

  return deferred.promise;
}

