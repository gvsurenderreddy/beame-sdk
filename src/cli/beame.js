#!/usr/bin/env node

"use strict";

var argv = require('minimist')(process.argv.slice(2));
var _    = require('underscore');

var BeameStore    = require("../services/BeameStoreV2");
var config        = require('../../config/Config');
const module_name = config.AppModules.BeameSDKCli;
var BeameLogger   = require('../utils/Logger');
var logger        = new BeameLogger(module_name);

var commands = {};
['creds', 'token', 'crypto', 'servers', 'system'].forEach(cmdName => {
	commands[cmdName] = require('./' + cmdName + '.js');
});

var parametersSchema = {
	'data':               {required: true},
	'developerEmail':     {required: true},
	'developerFqdn':      {required: true},
	'developerName':      {required: true},
	'format':             {required: false, options: ['text', 'json'], default: 'text'},
	'fqdn':               {required: false},
	'signingFqdn':        {required: false},
	'signature':          {required: true},
	'regex':              {required: false},
	'uid':                {required: true},
	'targetFqdn':         {required: true},
	'file':               {required: false},
	'authorizationFqdn':  {required: false},
	'authenticationFqdn': {required: false},
	'pk':                 {required: true},
	'requiredLevel':      {required: false, options: ['Default', 'AuthenticationServer', 'AuthorizationServer']},
	'count':              {required: false, default: 1},
	'sharedFolder':       {required: false},
	'localIp':            {required: false},
	'localPort':          {required: true},
	'sharedSecret':       {required: false},
	// createWithToken
	'signWithFqdn':       {required: false},
	'parent_fqdn':        {required: false},
	'dataToSign':         {required: false},
	'authSrvFqdn':        {required: false},
	'authToken':          {required: true, base64:true},
	'token':              {required: false, base64:true},
	'name':               {required: false},
	'email':              {required: false}
};

// http://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript
function InvalidArgv(message) {
	this.name    = 'InvalidArgv';
	this.message = message;
}

InvalidArgv.prototype = Error.prototype;

function getParamsNames(fun) {
	var names       = fun.toString().match(/^[\s(]*function[^(]*\(([^)]*)\)/)[1]
		.replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
		.replace(/\s+/g, '').split(',');
	var ret         = (names.length == 1 && !names[0] ? [] : names);
	var useCallback = false;

	ret             = ret.filter(paramName => {
		if (paramName == 'callback') {
			useCallback = true;
			return false;
		} else {
			return true;
		}
	});
	ret.hasFormat   = !!fun.toText;
	ret.useCallback = useCallback;
	return ret;
}

function main() {
	var cmdName    = argv._[0];
	var subCmdName = argv._[1];

	var cmd = commands[cmdName];

	if (!cmd) {
		logger.fatal("Command '" + cmdName + "' not found. Valid top-level commands are: " + Object.keys(commands));
	}

	if (!commands[cmdName][subCmdName]) {
		logger.fatal("Sub-command '" + subCmdName + "' for command '" + cmdName + "' not found. Valid sub-commands are: " + Object.keys(commands[cmdName]));
	}

	// TODO: handle boolean such as in "--fqdn --some-other-switch" or "--no-fqdn"
	// Validate argv and build arguments for the function
	var paramsNames = getParamsNames(commands[cmdName][subCmdName]);
	var args        = _.map(paramsNames, function (paramName) {

		// Required parameter missing
		if (parametersSchema[paramName].required && !_.has(argv, paramName)) {
			logger.fatal("Command '" + cmdName + ' ' + subCmdName + "' - required argument '" + paramName + "' is missing.");
		}

		// Optional parameter missing
		if (!parametersSchema[paramName].required && !_.has(argv, paramName)) {
			if (parametersSchema[paramName].default) {
				return parametersSchema[paramName].default;
			}
			return null;
		}

		// Parameter must be one of the specified values ("options")
		if (parametersSchema[paramName].options) {
			if (_.indexOf(parametersSchema[paramName].options, argv[paramName]) == -1) {
				logger.fatal("Command '" + cmdName + ' ' + subCmdName + "' - argument '" + paramName + "' must be one of: " + parametersSchema[paramName].options.join(','));
			}
		}

		var arg = argv[paramName];

		// Optionally decode base64-encoded argument.
		// Do not decode what appears to be JSON.
		if(parametersSchema[paramName].base64 && arg[0] != '{' && arg[0] != '"') {
			arg = new Buffer(arg, 'base64').toString();
		}

		return arg;
	});

	/**
	 *
	 * @param {Object} error
	 * @param {Object} output
	 */
	function commandResultsReady(error, output) {

		if (error) {
			logger.fatal(error.message, error.data, error.module)
		}

		if (output === undefined) {
			return;
		}
		if (argv.format == 'json' || !commands[cmdName][subCmdName].toText) {

			//noinspection ES6ModulesDependencies,NodeModulesDependencies
			output = JSON.stringify(output);
		} else {
			output = commands[cmdName][subCmdName].toText(output).toString();
		}

		console.log(output);
	}

	// Run the command
	if (paramsNames.useCallback) {
		args.push(commandResultsReady);
		commands[cmdName][subCmdName].apply(null, args);
	} else {
		var output = commands[cmdName][subCmdName].apply(null, args);
		commandResultsReady(null, output);
	}
}

function usage() {
	var path   = require('path');
	var myname = 'beame.js';
	console.log("Usage:");
	_.each(commands, function (subCommands, cmdName) {
		_.each(subCommands, function (subCmdFunc, subCmdName) {
			var paramsNames = getParamsNames(subCmdFunc);
			if (paramsNames.hasFormat) {
				paramsNames.push('format');
			}
			var params = paramsNames.map(function (paramName) {
				var ret = '--' + paramName;
				if (!parametersSchema[paramName]) {
					console.log(`Internal coding error: missing ${paramName} in parametersSchema`);
					throw new Error(`Internal coding error: missing ${paramName} in parametersSchema`);
				}
				if (parametersSchema[paramName].options) {
					ret = ret + ' {' + parametersSchema[paramName].options.join('|') + '}';
				} else {
					ret = ret + ' ' + paramName;
				}
				if (!parametersSchema[paramName].required) {
					ret = '[' + ret + ']';
				}
				return ret;
			});
			console.log('  ' + myname + ' ' + cmdName + ' ' + subCmdName + ' ' + params.join(' '));
		});
	});
	console.log("");
	console.log("Registration URL: https://registration.beameio.net/");
	console.log("");
	console.log("Setting up bash completion:");
	console.log("  * Make sure you are using bash version 4");
	console.log("  * Make sure you have set up the bash-completion package");
	console.log("	 (check with 'type _init_completion &>/dev/null && echo OK || echo FAIL')");
	console.log("  * Add 'source " + path.resolve(__dirname, 'completion.sh') + "'");
	console.log("	 to your ~/.bashrc or ~/.bash_profile (depends on your system)");
}

if (argv._.length < 2) {
	usage();
	process.exit(1);
}

if (argv._[0] == 'complete') {
	if (argv._[1] == 'commands') {
		console.log(_.keys(commands).join(' '));
		process.exit(0);
	}
	if (argv._[1] == 'sub-commands') {
		console.log(_.keys(commands[argv._[2]]).join(' '));
		process.exit(0);
	}
	if (argv._[1] == 'switches') {
		var f           = commands[argv._[2]][argv._[3]];
		var paramsNames = getParamsNames(f);
		if (paramsNames.hasFormat) {
			paramsNames.push('format');
		}
		var switches = paramsNames.map(function (p) {
			return "--" + p;
		}).join(' ');
		console.log(switches);
		process.exit(0);
	}
	if (argv._[1] == 'switch-value') {
		var sw = argv._[2];
		if (sw == 'fqdn') {
			var fqdnType = argv._[3];
			var store    = new BeameStore();
			var results;
			if (fqdnType) {
				results = store.list(fqdnType);
			} else {
				results = store.list();
			}
			console.log(_.map(results, function (r) {
				return r.hostname;
			}).join(' '));
			process.exit(0);
		}
		if (parametersSchema[sw].options) {
			console.log(parametersSchema[sw].options.join(' '));
			process.exit(0);
		}
		process.exit(0);
	}
	process.exit(1);
}

main();
