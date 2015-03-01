# parametric lamp 

Currently we have a few essentials:
 * Gruntfile
 * Jasmine testing framework
 * Sun angle calculation module (`common/SunAngles.js`)
 * File reader/writers (so the browser can write cutfiles to disk, eventually)
 * Travis yml file

## Setup

Install node.js, and grunt-cli globally.

```
npm install -g grunt-cli
```

Install dependencies:
```
npm install
```

Build/test:
```
# build one time
grunt 
# continously watch for changes and build when they occur
grunt watch
```

## Documentation

### Project structure
```
- src          : application code
  - browser    : browser only code
  - common     : both for node.js and browser
  - node       : node.js only code
- test
  - specs      : jasmine test specs
    - browser  : run with jasmine browser only
    - common   : run with jasmine + jasmine-node
    - node     : ruh with jasmine-node only
- resources    : resource files
- libs         : external libraries
- dist         : build output
GruntFile.js   : buld configuration


```

### Running tests

Tests can be run in 3 modes:

1. Jasmine-node:

    The only tests that are using the source code directly (i.e. pre build). They are run as part of the main build, or you can run `jasmine_node`
  
2. Jasmine through automated PhantomJS browser
 
    Runs with the browserified code, using a headless PhantomJS server, as part of the build, or by `grunt jasmine`
    To run:

3. Jasmine in the browser

    Runs with the browserified code. Build the project and open the test bootstrap page with any browser, i.e. `firefox test/SpecRunner.html`

### Running the "Application"

One of the browserify targets creates a bundle just for the "src/browser/App" module (and its dependencies).

The module is aliased as "ParametricLamp", so it can be loaded and run by an external html file.
A client could load it in javascript using:
```
        var parametricLamp = require('ParametricLamp');
        parametricLamp.main();
```

You can see the application running at [test/AppRunner.html](test/AppRunner.html)

### Notes
 * Jquery is loaded as a window global and not as a module for require(). An alternative would be to use a jquery version which supports being exposed as a commonJS module, or using browserify-shim to wrap it so it could be used with a require().
