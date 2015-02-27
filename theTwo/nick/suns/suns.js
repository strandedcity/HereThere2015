var SunCalc = require('suncalc')
  , _ = require('lodash')
  , CoordinateTZ = require('coordinate-tz')
  , TZDate = require('zoneinfo').TZDate

// find the date of the sunniest equinox at given coordinates
function find_sunniest_equinox(lat) {
  var d = new Date()
  // if southern altitude, sunnier equinox is march 20
  if (lat<0) return d.setMonth(3,20)
  // if northern, september 23
  return d.setMonth(9,23)
}

// shifts date shifed to the timezone at given coordinates
// returns a TZObject
function date_at_timezone(lat, lng, date) {
  var d = new TZDate(date)
  d.setTimezone(
    CoordinateTZ.calculate(lat,lng)
  ); return d._date
}

// returns an array of three sun angles - noon, noon+3, noon-3
// returns angles in radians
function get_sun_angles(lat, lng, date) {
  date = date_at_timezone(lat, lng, date)
  return _.map( 
      [9,12,15]
      , function (hour) {
        return Math.abs(SunCalc
                          .getPosition(date.setHours(hour), lat, lng)
                          .altitude) 
    })
}


// demo
$(function() { 
  var places = [ {place: 'Nairobi, Kenya',lat:1.17,lng:36.49}
    , {place: 'Buenos Aires, Argentina',lat:-34.36,lng:-58.22}
    , {place:'Yangon, Burma',lat:16.8,lng:-96.15}]

  _.forEach(places, function (place) {
    $('#suns').append(
      place.place + ': ' 
      +  get_sun_angles(
        place.lat
        , place.lng
        , find_sunniest_equinox(place.lat))
      + '<br>')
  })
})
