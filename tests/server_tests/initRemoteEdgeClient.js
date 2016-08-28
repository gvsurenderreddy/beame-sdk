var config        = require('../../config/Config');
console.log('Trying to init first Beame remote edgeClient');
if(config.InitFirstRemoteEdgeClient){
	config.rootDirIndex = config.beameStoreNdxHome;
	var beameSdkDir = config.npmRootDir+"/lib/node_modules/beame-sdk";

	var servers = require(beameSdkDir+"/src/cli/servers");
	var creds = require(beameSdkDir+"/src/cli/creds");

	var atoms         = creds.list("atom", "", "JSON");
	var edgeclients   = creds.list("edgeclient", "", "JSON");
	var remoteclients = creds.list("remoteclient", "", "JSON");
	if (0){//(remoteclients.length > 0) || (atoms.length > 0) || (edgeclients.length > 0)){
		console.log('beame credentials found, initializing FIRST client aborted');
	}
	else{
		var remoteClientServices = new (require(beameSdkDir+'/src/core/RemoteClientServices'))();
		var BeameLogger = require(beameSdkDir+'/src/utils/Logger');


		const module_name = config.AppModules.BeameSDKlauncher;
		var logger        = new BeameLogger(module_name);
		remoteClientServices.createEdgeClient(function(error, message){
			if(!error){
				var hostname = message.hostname;
				logger.info(`Registered new routable host: ${hostname} starting socketio chat`);
				console.log("\n\n                                     x");
				console.log("            X                                 /^^^^^^^\\               X   ");
				console.log("    x                                /=========================\\                           x           X");
				console.log("          X         /************************************************************\\");
				console.log("              /**********Bbbb   EEEEE     A******M       M  EEEEE ***<^^>*** ooo *******\\          X     ");
				console.log("  X      /***************B   B  E        A A*****M*M   M*M  E    ********* oo   oo ***********\\");
				console.log("     <==@@@@*************B==B   EEEE    A   A****M   M   M  EEEE ****i  i oo     oo *******@@@@==>");
				console.log("             \\***********B    B*E      AAAAAAA***M       M  E    ****i  i* oo   oo ******/                 X");
				console.log("              \\**********Bbbbb  EEEEE*A       A**M       M**EEEEE*@**i_ i*** ooo *******/       x");
				console.log("     X              \\************************************************************/");
				console.log("              x                          \\=================/          x                           X");
				console.log("   x                             X            \\@x@y@u@/                      X               x");
				console.log("\n\n<@$@>\n");
/*				var busy = false;
				var safeCounter = 10;
				var runMyChat = setInterval(function () {
					if(!busy){
						busy = true;
						if(--safeCounter < 1)clearInterval(runMyChat);
						try {*/
							servers.launchChat(hostname);
/*							clearInterval(runMyChat);
						}
						catch(e){
							busy = false;
							console.log('.x.x.x.x.x');
						}
					}
				},500);*/
			}else{
				logger.error(JSON.stringify(error));
			}

		}, null, null);
	}
}
