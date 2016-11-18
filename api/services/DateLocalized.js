module.exports = function(d){
	var date;
	var tz = sails.config.timezone || {label:'America/Cancun', offset:-5};
	if(d){
		date = calcTime(tz.offset, d);
	}else{
		date = calcTime(tz.offset);
	}
	return date;
};

function calcTime(offset, dateString) {
		var date = new Date();
		if(dateString){
			date = new Date(dateString);
		}
    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    // create new Date object for different timezone
    // using supplied offset
    var nd = new Date(utc + (3600000*offset));
    return nd;
}