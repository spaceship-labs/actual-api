module.exports = {

  syncSchema: function(req, res){
    var form = req.params.all();
    var tableName = form.table;
    getColumns(tableName,function(results){
      createTable(tableName,results, function(){
        res.ok({status:'ok'});
      });
      res.json({data:results});

    }); 
  },

  syncData: function(req, res){
    var form = req.params.all();
    var tableName = form.table;
    getData(tableName, function(results){
      copyRows(tableName, results,function(resultCopy){
        res.ok({data:resultCopy});
      });
    });
  }
};

function copyRows(tableName, rows, callback){
  var src = sails.config.tables;
  var alias = src[tableName].alias;
  var sql = "INSERT INTO " + alias + " ";
  var val = '';

  if(src[tableName]){
    var columns = src[tableName].columns;
    if(columns){
      sql += "( "
      for(var i=0;i<columns.length;i++){
        sql += "" + columns[i] +" ";

        if(i != columns.length - 1 ){
          sql += ","
        }       
      }
      sql+= ") VALUES";

      for(var i=0;i<rows.length;i++){
        sql += "(";
        for(var j=0;j<columns.length;j++){
          //Inserting values by column
          val = (rows[i][columns[j]]).replace(/'/g, "\\'");
          sql += " '" + val +"' ";
          if(j != columns.length - 1 ){
            sql += ","
          } 
        }
        sql += ")";
        if(i != rows.length - 1 ){
          sql += ","
        }       
      }
      console.log(sql);
      Mysql_.query(sql,function(err,results){
        if(err) console.log(err);
        callback(results);
      });     
    }
  } 
}

function getData(tableName, callback){
  var sql = "SELECT "
  var src = sails.config.tables;
  if(src[tableName]){
    var columns = src[tableName].columns;
    if(columns){
      for(var i=0;i<columns.length;i++){
        if (i!=0) sql+=" , ";
        sql += "" + columns[i] +" ";
      }
    }
  }

  sql += " FROM " + tableName;

  console.log(sql);

  Sqlserver_.query(sql, function(err, results){
    if(err) console.log(err);
    else{
      callback(results);
    }
  }); 
}

function createTable(tableName, columns, callback){
  var src = sails.config.tables;
  if(src[tableName]){
    var alias = src[tableName].alias || tableName;
    var sql = "CREATE TABLE IF NOT EXISTS " + alias + "(";
    for(var i=0;i<columns.length;i++){
      sql += columns[i].COLUMN_NAME + " ";
      sql += mapDataType(columns[i].DATA_TYPE);
      if(hasMax(columns[i].DATA_TYPE) ){
        sql += "("+columns[i].MAX_LENGTH+")";
      }
      if(isNumeric(columns[i].DATA_TYPE) ){
        sql += "(5,2)";
      }     
      if(columns[i].PRIMARY_KEY){
        sql += " PRIMARY KEY ";
      }
      if(i != columns.length - 1 ){
        sql += ","
      }
    }
    sql += ")";
    console.log(sql);
    
    Mysql_.query(sql,function(err,results){
      if(err) console.log(err);
      console.log(results);
    });
  }
}

function mapDataType(columnName){
  var mapping = sails.config.sqlmapping;
  if(mapping[columnName]){
    return mapping[columnName];
  }
  return columnName;
}

function hasMax(dataType){
  if(dataType === 'nvarchar'){ 
    return true;
  }
  return false;
}

function isNumeric(dataType){
  if(dataType === 'numeric'){
    return true;
  }
  return false;
}

function getColumns(tableName, cb){
    //var sql = " SELECT *FROM information_schema.columns WHERE table_name = '"+tableName+"'";

  var sql = "SELECT c.name 'COLUMN_NAME', t.Name 'DATA_TYPE', c.max_length 'MAX_LENGTH', c.precision , c.scale , c.is_nullable, ISNULL(i.is_primary_key, 0) 'PRIMARY_KEY' FROM sys.columns c INNER JOIN sys.types t ON c.user_type_id = t.user_type_id LEFT OUTER JOIN sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id LEFT OUTER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id WHERE c.object_id = OBJECT_ID('"+tableName+"')";
  var src = sails.config.tables;
  if(src[tableName]){
    var columns = src[tableName].columns;
    if(columns){
      sql += "AND ("; 
      for(var i=0;i<columns.length;i++){
        if (i!=0) sql+=" OR";
        sql += "  c.name = '" + columns[i] +"'";
      }
      sql += ")";
    }
  }

  Sqlserver_.query(sql, function(err, results){
    if(err) console.log(err);
    else{
      cb(results);
    }
  });
}