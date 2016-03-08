var q = require('q');
var moment = require('moment');
var async = require('async');
var hash = require('object-hash');

module.exports = {

  /**
  * @param string _model Model name
  * 
  * Flow:
  * getDataFromSap
  * iterateDataFromSap (loop)
  *   checkIfExistsInMysql()
  *   handleRow()
  *     if(exists in MySQL):
  *       checkIfUpdatedInSap()
  *       if(is updated in sap):
  *        updateRowInMysql()
  *       else:
  *         return 
  *     else:
  *       insertRowInMysql()
  * 
  */


  sync: function(modelName){
    var deferred = q.defer();
    var insertedCount = 0;
    var updatedCount = 0;
    var notAffectedCount = 0;
    var totalrows = 0;

    if(sails.config.tables[modelName]){

      getDataFromSap(modelName).then(function(rows){
        console.log('Iterating data start: ' + new Date());
        iterateDataFromSap(modelName,rows).then(
          function(){
            console.log('Iterating data finished: ' + new Date());
            deferred.resolve({
              inserted: insertedCount,
              updated: updatedCount,
              notAffected: notAffectedCount
            });
          },function(err){
            if(err){
              console.log(err);
            }
        });
      }, deferred.reject);
    }
    else{
      var err = 'Model not found';
      deferred.reject(err);
    }
    return deferred.promise;
  }

};

/**
  * @param string modelName 
  * @return promise, if success returns data, else error message
*/
function getDataFromSap(modelName){
  var deferred = q.defer();
  var columns = sails.config.tables[modelName].attributes;
  var sql = "SELECT ";
  //sql += ' TOP 5 ';
  var i = 0;

  for(col in columns){
    if(col != 'id' && col != 'createdAt' && col != 'updatedAt' && !columns[col].excludeSync){
      if (i!=0) sql+=" , ";
      sql += "" + col +" ";
      i++;
    }
  };

  sql += " FROM [ACTUALKIDS].[dbo].[" + sails.config.tables[modelName].tableNameSqlServer + "]";
  //console.log(sql);
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

/**
  * @param {string} modelName
  * @param {array} rows, rows from SAP DB reading
  * Iterates rows from SAP DB, check if the row exists in MySQL, the result
  * goes to the handleRow function. 
  * checkIfExistsInMysql() -> handleRow()
*/
function iterateDataFromSap(modelName,rows){
  var deferred = q.defer();

  async.each(rows,function(row,next){
    async.waterfall([
      async.apply(checkIfExistsInMysql, modelName, row),
      handleRow
    ], function(err, result){
      if(err){ 
        console.log(err);
        next();
      }else{
        next();
      }
    });
  }, function(err){
    if(err) console.log(err);
    deferred.resolve();
  });

  return deferred.promise;
}

/**
  * @param {string} modelName
  * @param {object} row, data from SAP DB 
  * @param {object} exists, if exists in MySQL an object with the row data, else false value
  * @param {function} cb
  * @return {function} callback with the row data if exists, else false
*/
function checkIfExistsInMysql(modelName, row, callback){
  //console.log('en checkIfExistsInMysql');
  var table = sails.config.tables[modelName];
  var whereClause = getWhereClauseMysql(table, modelName, row);

  queryIfExistsInMysql(modelName,whereClause).then(function(results){
    //This goes to handleRow()
    if(results.length > 0){
      callback(null,modelName, row, results[0]);
    }else{
      callback(null,modelName,row, false);
    }    
  },function(err){
    console.log(err);
    callback(null,null, null, null);
  });
}

/**
* MySQL query to get data from record if it exists
* @param {string} modelName
* @param {string} whereClause
*/
function queryIfExistsInMysql(modelName, whereClause){
  var deferred = q.defer();

  var columns = sails.config.tables[modelName].attributes;
  var sql = "SELECT ";
  //sql += ' TOP 5 ';
  var i = 0;

  for(col in columns){
    if(col != 'id' && col != 'createdAt' && col != 'updatedAt' && !columns[col].excludeSync){
      if (i!=0) sql+=" , ";
      sql += "" + col +" ";
      i++;
    }
  };

  sql += ",hash FROM " + sails.config.tables[modelName].tableName + "";
  
  if(whereClause){
    sql += " " + whereClause; 
  }

  Mysql_.query(sql, function(err, results){
    if(err){
      deferred.reject(err);
      console.log(err);
    }
    else{
      deferred.resolve(results);
    }
  });

  return deferred.promise;
}


/**
  * @param {string} modelName
  * @param {object} row, data from SAP DB 
  * @param {object} exists, if exists in MySQL an object with the row data, else false value
  * @param {function} cb
  *
*/
function handleRow(modelName, row, exists, cb){ 
  //console.log('row: ' + row.ItemCode); 
  if(exists){
    checkIfUpdatedInSap(modelName, row, exists, cb);    
  }
  else{
    insertRowInMysql(modelName, row, cb);
  }
}

/**
  * @param {string} modelName
  * @param {object} valueSap
  * @param {object} valueMysql
  * @param {function} cb
  *
*/
function checkIfUpdatedInSap(modelName ,valueSap, valueMysql, cb){
  var hashSap = hash(valueSap);
  var hashMysql = valueMysql.hash;

  if(hashSap == hashMysql){
    //console.log('sin actualizar');
    //if(notAffectedCount) notAffectedCount++;
    cb(null,[]);
  }else{
    //console.log('registro modificado en SAP ');
    updateRowInMysql(modelName, valueSap, cb);
  }
}

/**
  * @param {string} modelName
  * @param {object} row
  * @param {function} cb
  *
*/
function insertRowInMysql(modelName, row, cb){
  var src = sails.config.tables;
  var alias = sails.config.tables[modelName].tableName;
  var sql = "INSERT INTO " + alias + " ";
  var val = '';
  var date = '';
  var aux = '';

  var columns = sails.config.tables[modelName].attributes;

  sql += "( ";
  for(var col in columns){
    if(col != 'id' && col != 'updatedAt'){
      sql += "" + col +",";
    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);

  //Adding hash field
  sql += " , hash";

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

  //Adding hash field
  var rowHash = hash(row);
  sql += " , '" + rowHash + "'";

  sql += ")";

  Mysql_.query(sql,function(err,results){
    if(err){
      console.log(err);
      cb(null,err);
    }
    else{
      //if(insertedCount) insertedCount++;
      cb(null, results);
    }
  });  
}

/**
  * @param {string} modelName
  * @param {object} row
  * @param {function} cb
  *
*/
function updateRowInMysql(modelName, row, cb){
  //console.log('en updateRowInMysql');
  var src = sails.config.tables;
  var table = sails.config.tables[modelName];
  var alias = sails.config.tables[modelName].tableName;
  var sql = "UPDATE " + alias + " SET ";
  var val = '';
  var date = '';
  var aux = '';
  var whereClause = getWhereClauseMysql(table,modelName,row);

  var columns = sails.config.tables[modelName].attributes;

  for(var col in columns){
    //Inserting values by column
    if(col != 'id' && col != 'updatedAt' && !columns[col].excludeSync){

      if(col === 'createdAt'){
        date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
        sql += col + " = '" + date +"',";
      }
      else if(columns[col].type === 'datetime'){
        aux = String(row[col]);
        if(aux == 'null'){
          date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
        }
        else{
          date = moment(new Date(aux)).format('YYYY-MM-DD h:mm:ss');
        }
        sql +=  col + " = '" + date +"',";
      }
      else{
        val = String(row[col]).replace(/'/g, "\\'");
        if(val == 'null'){
          sql += col + ' =  null,';
        }else{
          sql += col + " = '" + val +"',";
        }
      }

    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);

  //Adding hash field
  var rowHash = hash(row);
  sql += " , hash = '" + rowHash + "'";
  sql += " " + whereClause;

  //console.log('updateClause');
  //console.log(sql);

  Mysql_.query(sql,function(err,results){
    if(err){
      console.log(err);
      cb(null,err);
    }
    else{
      //if(updatedCount) updatedCount++;
      cb(null, results);
    }
  });
}


/*----------
  HELPER FUNCTIONS
*/

function getWhereClauseMysql(table, modelName, row){
  var alias = table.tableName;
  var columns = table.attributes;
  var compositeKeys = '';
  var query = {};

  var whereClause = '';

  if(table.compositeKeys){
    for(col in columns){
      for(var i=0;i<table.compositeKeys.length;i++){
        if(col == table.compositeKeys[i]){
          query[col] = row[col];
          whereClause += " " + col + " = '" + row[col] + "' AND";
        }
      }
    }
    whereClause = whereClause.replace(/AND$/, '');
  }
  else{
    for(col in columns){
      if(columns[col].primaryKey){
        query[col] = row[col];
        whereClause += "WHERE " +  col + " = '" + row[col] + "' ";
      }
    }
  } 
  return whereClause; 
}

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







