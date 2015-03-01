var SunCalc = require('suncalc'),
  _ = require('lodash')

var SunAngles = {

  // find the date of the sunniest equinox at given latitude
  find_sunniest_equinox: function (lat) {
    var d = new Date()
    // if southern altitude, sunnier equinox is march 20
    if (lat<0) return d.setMonth(2,20)
    // if northern, september 23
    return d.setMonth(8,23)
  }

  // returns an object with three sun angles 
  // 1. sunriseEnd (bottom edge of sun touches horizon)
  // 2. solarNoon (sun's highest position)
  // 3. sunsetStart (bottom edge of sun touches horizon)
  , get_sun_angles: function (lat, lng) {

    var times = SunCalc.getTimes(
      new Date(SunAngles.find_sunniest_equinox(lat))
      , lat
      , lng)

    return _.zipObject(
      ['sunriseEnd', 'solarNoon', 'sunriseStart']
      , _.map([times.sunriseEnd, times.solarNoon, times.sunsetStart]
        , function (time) {
          return SunCalc.getPosition(time, lat, lng)
                        .altitude * (180 / Math.PI); // convert to degrees
        }
      )
    )
  }

}

module.exports = SunAngles;
