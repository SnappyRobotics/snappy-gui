require('./preload.js')

window.isDeployed = function() {
  return ($("#btn-deploy").attr("class").indexOf('disabled') > -1);
}
