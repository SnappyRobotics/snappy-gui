'use strict';

require('./preload.js')

window.isDeployed = function() {
  return ($("#btn-deploy").attr("class").indexOf('disabled') > -1);
}
$(function() {
  $("#btn-deploy").click(function() {
    ipc.send('mainWindow:onDeploy');
  })
})
