/**
 * Created by zenit1 on 08/09/2016.
 */
"use strict";

const exec     = require('child_process').exec;
const execFile = require('child_process').execFile;


const config      = require('../../config/Config');
const module_name = config.AppModules.OpenSSL;
var logger        = new (require('../utils/Logger'))(module_name);
var csrSubj       = "C=US/ST=Florida/L=Gainesville/O=LFE.COM, Inc/OU=Development/CN=";


class OpenSSLWrapper {
	constructor() {

	}

	createPrivateKey() {
		return new Promise((resolve, reject) => {
			var errMsg;

			/* --------- generate RSA key: ------------------------------------------------*/
			var cmd = "openssl genrsa 2048";

			logger.debug("generating private key with", {"cmd": cmd});

			exec(cmd, function (error, stdout, stderr) {

				if (error !== null) {
					/* -------  put error handler to deal with possible openssl failure -----------*/
					errMsg = logger.formatErrorMessage("Failed to generate Private Key", module_name, {
						"error":  error,
						"stderr": stderr
					}, config.MessageCodes.OpenSSLError);

					reject(errMsg);
					return;
				}

				resolve(stdout);

			});

		});
	}

	createCSR(fqdn, pkFile) {
		return new Promise((resolve, reject) => {
			var errMsg;
			var cmd = "openssl req -key " + pkFile + " -new -subj \"/" + (csrSubj + fqdn) + "\"";
			logger.debug("generating CSR with", {"cmd": cmd});
			try {
				exec(cmd,
					/**
					 *
					 * @param error
					 * @param stdout => return CSR
					 * @param stderr
					 */
					function (error, stdout, stderr) {
						if (error !== null) {
							errMsg = logger.formatErrorMessage("Failed to generate CSR", module_name, {
								"error":  error,
								"stderr": stderr
							}, config.MessageCodes.OpenSSLError);
							reject(errMsg);
						}
						else {
							resolve(stdout);
						}

					});
			}
			catch (error) {
				errMsg = logger.formatErrorMessage("Create Developer CSR", module_name, error, config.MessageCodes.OpenSSLError);
				reject(errMsg);
			}
		});
	}
}


module.exports = OpenSSLWrapper;