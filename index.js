const path = require('path')
const fs = require('fs')
const discovery = require(path.join(__dirname, 'scripts', 'discovery'))

const debug = require('debug')("snappy:gui:index")

//--------------------------------SETTINGS--------------------------------

global.PORT = 8000

//------------------------------------------------------------------------

global.package = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json")))
debug("==========================================================================")
debug("\t\t\t\t\t" + global.package.name)
debug("\t\t\t\t    " + global.package.description)
debug("\t\t\t\t\t" + global.package.version)
debug("==========================================================================")

/*
discovery.ping("localhost")
  .then(function(reply) {
    if (reply) {
      debug("Found snappy core")
    }
  })
*/
discovery.autoScan(function(er, o) {
  debug(o)
})
