'use strict';

var SunAngles = require('../../../src/common/SunAngles')


describe("SunAngles", function() {

  beforeEach(function() {
    // calculated from http://www.esrl.noaa.gov/gmd/grad/solcalc/
    this.dataset = [ 
      {place: 'Nairobi, Kenya'
        ,lat:1.17,lng:36.49
        ,angleSolarNoon:88.81}

      , {place: 'Buenos Aires, Argentina'
        ,lat:-34.36,lng:-58.22
        , angleSunriseStart:0.45
        , angleSolarNoon:55.76
        , angleSunsetStart:-0.24}

      , {place:'Yangon, Burma'
        ,lat:16.8,lng:-96.15}
    ] 
  })

  it('should find the correct equinox', function() {
    var northern_equinox = SunAngles.find_sunniest_equinox(this.dataset[2].lat)
    expect(new Date(northern_equinox).getMonth()).toEqual(8);
    expect(new Date(northern_equinox).getDate()).toEqual(23);
    var southern_equinox = SunAngles.find_sunniest_equinox(this.dataset[1].lat)
    expect(new Date(southern_equinox).getMonth()).toEqual(2);
    expect(new Date(southern_equinox).getDate()).toEqual(20);
  })

  it('should find approximately correct sun angles', function() {
    var sunAnglesNairobi = SunAngles.get_sun_angles(this.dataset[0].lat,this.dataset[0].lng)
    expect(sunAnglesNairobi.solarNoon).toBeCloseTo(this.dataset[0].angleSolarNoon,0) 
    var sunAnglesBuenosAires = SunAngles.get_sun_angles(this.dataset[1].lat,this.dataset[1].lng)
    expect(sunAnglesBuenosAires.sunriseEnd).toBeCloseTo(this.dataset[1].angleSunsetStart,0) 
    expect(sunAnglesBuenosAires.solarNoon).toBeCloseTo(this.dataset[1].angleSolarNoon,0) 
    expect(sunAnglesBuenosAires.sunriseStart).toBeCloseTo(this.dataset[1].angleSunsetStart,0) 
  })


})