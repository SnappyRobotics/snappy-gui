"use strict";

const fs = require('fs')
const path = require('path')

const debug = require('debug')("snappy:gui:index")

global.snappy_gui = {}

//--------------------------------SETTINGS--------------------------------

global.snappy_gui.client_PORT = 8000
//------------------------------------------------------------------------

global.snappy_gui.package = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json")))
debug("==========================================================================")
debug("\t\t\t\t\t" + global.snappy_gui.package.name)
debug("\t\t\t\t    " + global.snappy_gui.package.description)
debug("\t\t\t\t\t" + global.snappy_gui.package.version)
debug("==========================================================================")

// const launchers = require(path.join(__dirname, 'scripts', 'launchers'))
//
// launchers.init()

const discovery = require(path.join(__dirname, 'scripts', 'discovery'))

discovery.init()
