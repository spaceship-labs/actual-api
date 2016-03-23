var q = require('q');
var moment = require('moment');
var async = require('async');
var hash = require('object-hash');
var bluebird = require('bluebird');

var insertedCount = 0;
var updatedCount = 0;
var notAffectedCount = 0;
var totalrows = 0;
var syncDateStart = '';
var syncDateFinish = '';

module.exports = {

  /**
  * @param string _model Model name
  * 
  * Flow:
  * getDataFromSap
  * handleDataFromSap (loop)
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

    if(sails.config.tables[modelName]){
      resetCounters();

      var handleDataFromSapSuccess = function(res){
        console.log('Iterating data finished: ' + new Date());
        syncDateFinish = new Date();
        deferred.resolve({
          syncDateStart: syncDateStart,
          syncDateFinish: syncDateFinish,
          total: totalrows,
          inserted: insertedCount,
          updated: updatedCount,
          notAffected: notAffectedCount,
        });        
      }

      var handleDataFromSapFail = function(){
        if(err) console.log(err);
      }
      
      getDataFromSap(modelName)
        .then(function(results){
          totalrows = results.length;
          console.log('Iterating data start: ' + new Date());
          syncDateStart = new Date();
          return handleDataFromSap(modelName,results);
        })
        .then(handleDataFromSapSuccess)
        .catch(handleDataFromSapFail);
    
    }
    else{
      var err = 'Model not found';
      deferred.reject(err);
    }
    return deferred.promise;
  }

};

function resetCounters(){
  insertedCount = 0;
  updatedCount = 0;
  notAffectedCount = 0;
  totalrows = 0;
}

/**
  * @param string modelName 
  * @return promise, if success returns data, else error message
*/
function getDataFromSap(modelName){
  var columns = sails.config.tables[modelName].attributes;
  var sql = "SELECT ";
  var i = 0;
  for(col in columns){
    if(col != 'id' && col != 'createdAt' && col != 'updatedAt' && !columns[col].excludeSync){
      if (i!=0) sql+=" , ";
      sql += "" + col +" ";
      i++;
    }
  };
  sql += " FROM [ACTUALKIDS].[dbo].[" + sails.config.tables[modelName].tableNameSqlServer + "]";
  var queryAsync  = bluebird.promisify(Sqlserver_.query);
  return queryAsync(sql);
}

/**
  * @param {string} modelName
  * @param {array} rows, rows from SAP DB reading
  * Iterates rows from SAP DB, check if the row exists in MySQL, the result
  * goes to the handleRow function. 
  * checkIfExistsInMysql() -> handleRow()
*/
function handleDataFromSap(modelName,rows){
  var rowsPromises = [];
  for(row in rows){
    rowsPromises.push(rowProcess(modelName,rows[row]));
  }
  return q.all(rowsPromises);
}

function checkIfExistsInMysql(modelName, row){
  var deferred = q.defer();
  queryIfExistsInMysql(modelName,row)
    .then(function(results){
      if(results && results.length > 0){
        deferred.resolve(results[0]);
      }else{
        deferred.resolve(false);
      }
    })
    .catch(function(err){
      if(err) console.log(err);
    });
  return deferred.promise;
}

/**
* MySQL query to get data from record if it exists
* @param {string} modelName
* @param {string} whereClause
*/
function queryIfExistsInMysql(modelName, row){
  var table = sails.config.tables[modelName];
  var whereClause = getWhereClauseMysql(table, modelName, row);
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
  //console.log(sql);
  var queryAsync = bluebird.promisify(Mysql_.query);
  return queryAsync(sql)
}


/**
  * @param {string} modelName
  * @param {object} row, data from SAP DB 
  * @param {object} exists, if exists in MySQL an object with the row data, else false value
  * @param {function} cb
  *
*/
function rowProcess(modelName, row){
  //Default promise
  var deferred = q.defer();

  checkIfExistsInMysql(modelName, row)
    .then(function(exists){
      //El registro de SAP existe en APP DB
      if(exists){
        var hashSap = hash(row);
        var hashMysql = exists.hash;

        if(hashSap == hashMysql){
          //El registro es igual en ambas DB
          var innerDeferred = q.defer();
          notAffectedCount++;
          innerDeferred.resolve('sin actualizar');
          deferred.resolve(innerDeferred.promise);

        }
        else{
          //Actualizar
          updatedCount++;
          deferred.resolve(updateRowInMysql(modelName, row)); //Devuelve un promise
        }
      }
      else{
        //El registro de SAP no existe en APP DB
        insertedCount++;
        deferred.resolve(insertRowInMysql(modelName, row)); //Devuelve un promise
      }
    });

  return deferred.promise;
}


/**
  * @param {string} modelName
  * @param {object} row
  * @param {function} cb
  *
*/
function insertRowInMysql(modelName, row, cb){
  //console.log('inserting row');
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

  var queryAsync = bluebird.promisify(Mysql_.query);
  return queryAsync(sql);
}

/**
  * @param {string} modelName
  * @param {object} row
  * @param {function} cb
  *
*/
function updateRowInMysql(modelName, row){
  //console.log('updateRowInMysql');
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

  var queryAsync = bluebird.promisify(Mysql_.query);
  return queryAsync(sql);

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
    whereClause += 'WHERE ';
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







