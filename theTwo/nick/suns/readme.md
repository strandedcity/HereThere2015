## about
given a latitude and longitude,  
find the day of that location's sunniest equinox,  
then find the angles of sun there, on that day, at three hours: 9a, 12p, 3p  

## demo
open `index.html` up in your web browser

### build
`browserify suns.js -o build.js`

### notes
the built js is 2MB, vast majority of which is the list of timezones+coordinates.  
in deployment, this could be done serverside.
