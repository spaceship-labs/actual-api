var q = require('q');
var moment = require('moment');
var async = require('async');
var hash = require('object-hash');
var bluebird = require('bluebird');
var _ = require('underscore');

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

    if(sails.config.joins[modelName]){
      resetCounters();

      var handleDataFromSapSuccess = function(res){
        console.log('Iterating data finished ('+modelName+'): ' + new Date());
        syncDateFinish = new Date();
        deferred.resolve({
          model: modelName,
          join: true,
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
      
      //return getDataFromSap(modelName);

      
      getDataFromSap(modelName)
        .then(function(results){
          totalrows = results.length;
          console.log('Iterating data start ('+modelName+'): ' + new Date());
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
  var join = sails.config.joins[modelName];
  var leftTable = sails.config.joins[modelName].left;
  var rightTable = sails.config.joins[modelName].right;
  var tables = [leftTable, rightTable];

  var sql = "SELECT ";
  var i = 0;
  tables.forEach(function(table){
    var columns = table.attributes;
    var alias = table.tableNameSqlServer;
    for(col in columns){
      if (i!=0) sql+=" , ";
      sql += "" + alias + "." + col +" ";
      i++;
    }
  });  
  sql += " FROM " + leftTable.tableNameSqlServer;
  sql += " LEFT JOIN " + rightTable.tableNameSqlServer;
  sql += " ON " + leftTable.tableNameSqlServer + "." + join.key;
  sql += " = " + rightTable.tableNameSqlServer + "." + join.key;
  if(join.where){
    sql += " WHERE " + join.where;
  }
  if(join.orderby){
    sql += " ORDER BY " + join.orderby;
  }
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
function handleDataFromSap(modelName,rowsSap){
  var rowsPromises = [];
  for(row in rowsSap){
    rowsPromises.push(rowProcess(modelName,rowsSap[row]));
  }
  return q.all(rowsPromises);
}


/**
  * @param {string} modelName
  * @param {object} rowSap, data from SAP DB 
  * @param {object} exists, if exists in MySQL an object with the row data, else false value
  * @param {function} cb
  *
*/
function rowProcess(modelName, rowSap){
  //Default promise
  var deferred = q.defer();

  checkIfExistsInMysql(modelName, rowSap)
    .then(function(exists){ 
      
      if(exists){
        //console.log('exists');

        var hashSap = hash(rowSap);
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
          deferred.resolve(updateRowInMysql(modelName, rowSap)); //Devuelve un promise
        }
      }
      else{
        //El registro de SAP no existe en APP DB
        insertedCount++;
        deferred.resolve(insertRowInMysql(modelName, rowSap)); //Devuelve un promise
      }
      
    });

  return deferred.promise;
}


function checkIfExistsInMysql(modelName, rowSap){
  var deferred = q.defer();
  queryIfExistsInMysql(modelName,rowSap)
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
function queryIfExistsInMysql(modelName, rowSap){
  var whereClause = getWhereClauseMysql(modelName, rowSap);
  var join = sails.config.joins[modelName];
  var alias = join.tableName;
  var columns = _.extend(join.left.attributes, join.right.attributes);

  var sql = "SELECT ";
  var i = 0;

  for(col in columns){
    if (i!=0) sql+=" , ";
    sql += "" + col +" ";
    i++;
  }

  sql += ",hash FROM " + sails.config.joins[modelName].tableName + "";
  
  if(whereClause){
    sql += " " + whereClause; 
  }
  //console.log(sql);
  var queryAsync = bluebird.promisify(Mysql_.query);
  return queryAsync(sql)
}




/**
  * @param {string} modelName
  * @param {object} row
  * @param {function} cb
  *
*/
function insertRowInMysql(modelName, rowSap, cb){
  var join = sails.config.joins[modelName];
  var alias = join.tableName;
  var sql = "INSERT INTO " + alias + " ";
  var val = '';
  var date = '';
  var aux = '';
  var columns = _.extend(join.left.attributes, join.right.attributes);

  sql += "( ";
  for(var col in columns){
    sql += "" + col +",";
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);

  //Adding hash field
  sql += " , hash";

  sql+= ") VALUES";

  sql += "(";
  for(var col in columns){
    //Inserting values by column
    if(columns[col].type === 'datetime'){
      aux = String(rowSap[col]);
      if(aux == 'null'){
        date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
      }
      else{
        date = moment(new Date(aux)).format('YYYY-MM-DD h:mm:ss');
      }
      sql += " '" + date +"',";
    }
    else{
      val = String(rowSap[col]).replace(/'/g, "\\'");
      if(val == 'null'){
        sql += ' null,';
      }else{
        sql += " '" + val +"',";
      }
    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);

  //Adding hash field
  var rowHash = hash(rowSap);
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
function updateRowInMysql(modelName, rowSap){
  var join = sails.config.joins[modelName];
  var alias = join.tableName;
  var sql = "UPDATE " + alias + " SET ";
  var val = '';
  var date = '';
  var aux = '';
  var whereClause = getWhereClauseMysql(join,modelName,rowSap);
  var columns = _.extend(join.left.attributes, join.right.attributes);

  for(var col in columns){
    //Inserting values by column
    if(columns[col].type === 'datetime'){
      aux = String(rowSap[col]);
      if(aux == 'null'){
        date = moment(new Date()).format('YYYY-MM-DD h:mm:ss');
      }
      else{
        date = moment(new Date(aux)).format('YYYY-MM-DD h:mm:ss');
      }
      sql +=  col + " = '" + date +"',";
    }
    else{
      val = String(rowSap[col]).replace(/'/g, "\\'");
      if(val == 'null'){
        sql += col + ' =  null,';
      }else{
        sql += col + " = '" + val +"',";
      }
    }
  }
  //Deleting last comma
  sql = sql.substring(0, sql.length - 1);

  //Adding hash field
  var rowSapHash = hash(rowSap);
  sql += " , hash = '" + rowSapHash + "'";
  sql += " " + whereClause;

  var queryAsync = bluebird.promisify(Mysql_.query);
  return queryAsync(sql);

}


/*----------
  HELPER FUNCTIONS
*/

function getWhereClauseMysql(modelName, row){
  var join = sails.config.joins[modelName];
  var alias = join.tableName;
  var columns = _.extend(join.left.attributes, join.right.attributes);
  var whereClause = '';

  for(col in columns){
    if(col == join.key){
      whereClause += "WHERE " +  col + " = '" + row[col] + "' ";
    }
  }
  return whereClause; 
}

function truncateTable(_model){
  var deferred = q.defer();
  var alias = sails.config.joins[_model].tableName;
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







