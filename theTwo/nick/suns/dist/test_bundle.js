(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window: false */

var App = require('../../../src/browser/App');
var HelloWorld = require('../../../src/common/HelloWorld');

describe("HelloJQuery", function() {
    it("running App.main() should create an element with 'hello' id, with text set to helloUnderscore()", function() {
        App.main();
        var expected = HelloWorld.helloUnderscore();
        var actual = window.document.getElementById('hello').innerHTML;
        expect(actual).toEqual(expected);
    });
});

},{"../../../src/browser/App":"bkCrPi","../../../src/common/HelloWorld":"k+sgVk"}],2:[function(require,module,exports){
'use strict';

var HelloJquery = require('../../../src/browser/HelloJquery');

describe("HelloJQuery", function() {
    it("hello() should return a jquery element with hello innertext", function() {
        expect(HelloJquery.hello().text()).toEqual("hello");
    });
});


},{"../../../src/browser/HelloJquery":"82PsBr"}],3:[function(require,module,exports){
'use strict';

var ReaderWriter = require('../../../src/common/PersistentReaderWriter');

/* Note: The test would use whichever implementation is given,
according to the environment the test is being run at (node/browser) */
describe("PersistentReaderWriter", function() {
    it("read() should read what was written with write()", function() {
        var key = "someKey";
        var randomValue = Math.random().toString();
        ReaderWriter.write(key, randomValue);
        expect(ReaderWriter.read(key)).toEqual(randomValue);
    });
});


},{"../../../src/common/PersistentReaderWriter":"o7Wu7e"}],4:[function(require,module,exports){
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

  it('should find correct sun angles', function() {
    var sunAnglesNairobi = SunAngles.get_sun_angles(this.dataset[0].lat,this.dataset[0].lng)
    expect(sunAnglesNairobi.solarNoon).toBeCloseTo(this.dataset[0].angleSolarNoon,0) 
    var sunAnglesBuenosAires = SunAngles.get_sun_angles(this.dataset[1].lat,this.dataset[1].lng)
    expect(sunAnglesBuenosAires.sunriseEnd).toBeCloseTo(this.dataset[1].angleSunsetStart,0) 
    expect(sunAnglesBuenosAires.solarNoon).toBeCloseTo(this.dataset[1].angleSolarNoon,0) 
    expect(sunAnglesBuenosAires.sunriseStart).toBeCloseTo(this.dataset[1].angleSunsetStart,0) 
  })


})
},{"../../../src/common/SunAngles":"H98RRB"}]},{},[3,4,1,2]);