var MILLISECONDS_IN_HOUR = 3600000
var MILLISECONDS_IN_MINUTE = 60000

var parseTokenDateTimeDelimeter = /[T ]/
var parseTokenPlainTime = /:/

// date tokens
var parseTokenYYYY = /^(\d{4})$/
var parseTokenYYYYMM = /^(\d{4})-(\d{2})$/
var parseTokenYYYYDDD = /^(\d{4})-?(\d{3})$/
var parseTokenYYYYMMDD = /^(\d{4})-?(\d{2})-?(\d{2})$/
var parseTokenYYYYWww = /^(\d{4})-?W(\d{2})$/
var parseTokenYYYYWwwD = /^(\d{4})-?W(\d{2})-?(\d{1})$/

// time tokens
var parseTokenHH = /^(\d{2}([.,]\d*)?)$/
var parseTokenHHMM = /^(\d{2}):?(\d{2}([.,]\d*)?)$/
var parseTokenHHMMSS = /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/

// timezone tokens
var parseTokenTimezone = /([Z+-].*)$/
var parseTokenTimezoneZ = /^(Z)$/
var parseTokenTimezoneHH = /^([+-])(\d{2})$/
var parseTokenTimezoneHHMM = /^([+-])(\d{2}):?(\d{2})$/

/**
 * Parses date string representation. It accepts ISO 8601 format as well as
 * partial implementation.
 *
 * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
 *
 * @param {string} dateStr
 * @return {date} parsed date in local time zone.
 */
var parse = function(dateStr) {
  if (typeof dateStr !== 'string') {
    return new Date(dateStr)
  } 

  var dateStrings = splitDateString(dateStr)

  var date = parseDate(dateStrings.date)

  if (date) {
    if (dateStrings.time) {
      var time = parseTime(dateStrings.time)
      date.setMilliseconds(date.getMilliseconds() + time)
    }

    if (dateStrings.timezone) {
      var offset = parseTimezone(dateStrings.timezone)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset() - offset)
    }

    return date
  } else {
    return new Date(dateStr)
  }
}

var splitDateString = function(dateStr) {
  var dateStrings = {}
  var array = dateStr.split(parseTokenDateTimeDelimeter)
  var timeString

  if (parseTokenPlainTime.test(array[0])) {
    dateStrings.date = null
    timeString = array[0]
  } else {
    dateStrings.date = array[0]
    timeString = array[1]
  }

  if (timeString) {
    var token
    if (token = parseTokenTimezone.exec(timeString)) {
      dateStrings.time = timeString.replace(token[1], '')
      dateStrings.timezone = token[1]
    } else {
      dateStrings.time = timeString
    }
  }

  return dateStrings
}

var parseDate = function(dateString) {
  var token

  // YYYY
  if (token = parseTokenYYYY.exec(dateString)) {
    var year = parseInt(token[1], 10)
    return new Date(year, 0, 1)

  // YYYY-MM
  } else if (token = parseTokenYYYYMM.exec(dateString)) {
    var year = parseInt(token[1], 10)
    var month = parseInt(token[2], 10) - 1
    return new Date(year, month, 1)

  // YYYY-DDD or YYYYDDD
  } else if (token = parseTokenYYYYDDD.exec(dateString)) {
    var year = parseInt(token[1], 10)
    var dayOfYear = parseInt(token[2], 10)
    return new Date(year, 0, dayOfYear)

  // YYYY-MM-DD or YYYYMMDD
  } else if (token = parseTokenYYYYMMDD.exec(dateString)) {
    var year = parseInt(token[1], 10)
    var month = parseInt(token[2], 10) - 1
    var day = parseInt(token[3], 10)
    return new Date(year, month, day)

  // YYYY-Www or YYYYWww
  } else if (token = parseTokenYYYYWww.exec(dateString)) {
    var year = parseInt(token[1])
    var week = parseInt(token[2], 10) - 1
    return dayOfISOYear(year, week)

  // YYYY-Www-D or YYYYWwwD
  } else if (token = parseTokenYYYYWwwD.exec(dateString)) {
    var year = parseInt(token[1])
    var week = parseInt(token[2], 10) - 1
    var dayOfWeek = parseInt(token[3], 10) - 1
    return dayOfISOYear(year, week, dayOfWeek)

  // invalid ISO-formated date
  } else {
    return null
  }
}

var parseTime = function(timeString) {
  var token

  // hh
  if (token = parseTokenHH.exec(timeString)) {
    var hours = parseFloat(token[1].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR

  // hh:mm or hhmm
  } else if (token = parseTokenHHMM.exec(timeString)) {
    var hours = parseInt(token[1], 10)
    var minutes = parseFloat(token[2].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR
      + minutes * MILLISECONDS_IN_MINUTE

  // hh:mm:ss or hhmmss
  } else if (token = parseTokenHHMMSS.exec(timeString)) {
    var hours = parseInt(token[1], 10)
    var minutes = parseInt(token[2], 10)
    var seconds = parseFloat(token[3].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR
      + minutes * MILLISECONDS_IN_MINUTE
      + seconds * 1000

  // invalid ISO-formated time
  } else {
    return null
  }
}

var parseTimezone = function(timezoneString) {
  var token
  var offset = 0

  // Z
  if (token = parseTokenTimezoneZ.exec(timezoneString)) {
    offset = 0

  // ±hh
  } else if (token = parseTokenTimezoneHH.exec(timezoneString)) {
    var absoluteOffset = parseInt(token[2], 10) * 60
    offset = (token[1] == '+') ? absoluteOffset : -absoluteOffset

  // ±hh:mm or ±hhmm
  } else if (token = parseTokenTimezoneHHMM.exec(timezoneString)) {
    var absoluteOffset = parseInt(token[2], 10) * 60 + parseInt(token[3], 10)
    offset = (token[1] == '+') ? absoluteOffset : -absoluteOffset
  }

  return offset
}

var dayOfISOYear = function(isoYear, week, day) {
  week = week || 0
  day = day || 0
  var date = new Date(isoYear, 0, 4)
  var diff = week * 7 + day + 1 - date.getDay()
  date.setDate(date.getDate() + diff)
  return date
}

module.exports = parse

