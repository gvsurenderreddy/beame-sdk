"use strict";

/** @namespace System **/

/**
 *  @typedef {Object} VersionStatus
 *  @property {String} installed => installed version
 *  @property {String} available => latest available version
 *  @property {Boolean} update-available
 */

const request = require('sync-request');

/**
 * Check current SDK version
 * @public
 * @method System.checkVersion
 * @returns {VersionStatus}
 */
function checkVersion() {
	var currentVersion = require("../../package.json");
	//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedVariable
	var npmStatus      = JSON.parse(request('GET', 'https://registry.npmjs.org/beame-sdk/').body);

	//noinspection JSUnresolvedVariable
	return {
		'installed':        currentVersion.version,
		'available':        npmStatus['dist-tags'].latest,
		'update-available': npmStatus['dist-tags'].latest !== currentVersion.version
	}

}

checkVersion.toText = data => {
	if (data['update-available']) {
		return `You are using and older ${data.installed} version of beame sdk but the latest version is ${data.available}`;
	} else {
		return `You are using the latest beame-sdk version ${data.installed}`;
	}
};

module.exports =
{
	checkVersion
};
