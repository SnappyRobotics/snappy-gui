const nock = require('nock')

const debug = require('debug')("snappy:gui:test:gui:discovery_nocks")

switch (process.env.GUI_TEST) {
  case 'NOCKS':
    nock(/192.168.108.([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5]):8000/)
      .get('/info')
      .times(256)
      .reply(200, {
        name: "Snappy Robotics Software",
        version: '1.0.2',
        description: 'sdf .....',
        snappy: true
      })
    break;
  default:
    break;
}
