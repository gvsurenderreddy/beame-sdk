var os = require('os');
var beameApi = require('../src/services/collectAuthData.js');

beameApi.scanBeameDir(os.homedir()+'/.beame/',function(data){


    console.log("testttttt:" +JSON.stringify(data)); 
});
