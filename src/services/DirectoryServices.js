/**
 * Created by zenit1 on 03/07/2016.
 */
'use strict';

const path        = require('path');
const fs          = require('fs');
const async       = require('async');
const rimraf      = require('rimraf');
const config      = require('../../config/Config');
const module_name = config.AppModules.DataServices;
const logger      = new (require('../utils/Logger'))(module_name);
const CommonUtils = require('../utils/CommonUtils');
const BeameUtils  = require('../utils/BeameUtils');
/** @const {String} */


/**
 *
 * @constructor
 */
class DataServices {

	/**
	 * check if directory or file exists
	 * @param {String} dir
	 * @returns {boolean}
	 */
	static doesPathExists(dir) {
		try {
			fs.accessSync(dir, fs.F_OK);
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * create directory for supplied path
	 * @param {String} dirPath
	 */
	static createDir(dirPath) {
		try {
			fs.accessSync(dirPath, fs.F_OK);
		}
		catch (e) {
			fs.mkdirSync(dirPath);
		}
	}

	/**
	 *
	 * @param {String} dirPath
	 * @param fileName
	 * @param {Object} data
	 * @param {Function|null} [cb]
	 */
	static saveFile(dirPath, fileName, data, cb) {
		try {
			fs.writeFileSync(path.join(dirPath, fileName), data);
			cb && cb(null, true);
		}
		catch (error) {
			cb && cb(error, null);
		}

	}

	/**
	 * @param {String} dirPath
	 * @param {Function} callback
	 */
	static deleteFolder(dirPath, callback) {
		rimraf(dirPath, callback);
	}

	static readMetadataSync(dir, fqdn) {
		let p         = BeameUtils.makePath(dir, fqdn, config.metadataFileName);
		var metadata  = DataServices.readJSON(p);
		metadata.path = BeameUtils.makePath(dir, fqdn);
		return metadata;
	}

	static writeMetadataSync(dir, fqdn, metadata) {
		let dirPath = BeameUtils.makePath(dir, fqdn);
		DataServices.saveFile(dirPath, config.metadataFileName, CommonUtils.stringify(metadata, false));
	}

	/**
	 *
	 * @param {String} filename
	 * @returns {Object}
	 */
	static readObject(filename) {
		if (DataServices.doesPathExists(filename)) {
			try {
				return fs.readFileSync(filename);
			}
			catch (error) {
				return {};
			}
		}

		return {};
	}

	/**
	 * read JSON file
	 * @param {String} dirPath
	 */
	static readJSON(dirPath) {
		if (DataServices.doesPathExists(dirPath)) {
			try {
				var file = fs.readFileSync(dirPath);
				//noinspection ES6ModulesDependencies,NodeModulesDependencies
				return JSON.parse(file);
			}
			catch (error) {
				return {};
			}
		}

		return {};
	}

	/**
	 *
	 * @param {String} dirPath
	 * @param {OrderPemResponse} payload
	 */
	saveCerts(dirPath, payload) {
		let self = this,
		    errMsg;


		var saveCert = function (responseField, targetName, callback) {
			if (!payload.hasOwnProperty(responseField)) {
				errMsg = logger.formatErrorMessage(`${responseField} missing in API response on ${dirPath}`, module_name, null, config.MessageCodes.ApiRestError);
				callback(errMsg, null);
			}

			//save cert
			self.saveFileAsync(path.join(dirPath, targetName), payload[responseField], function (error) {
				if (error) {
					errMsg = logger.formatErrorMessage(`Saving ${responseField} failed on path ${dirPath}`, module_name);
					callback(errMsg, null);
					return;
				}

				callback(null, 'done');
			});
		};

		return new Promise((resolve, reject) => {
				async.parallel(
					[
						function (callback) {
							saveCert(config.CertResponseFields.x509, config.CertFileNames.X509, callback);
						},
						function (callback) {
							saveCert(config.CertResponseFields.ca, config.CertFileNames.CA, callback);
						},
						function (callback) {
							saveCert(config.CertResponseFields.pkcs7, config.CertFileNames.PKCS7, callback);
						}

					],
					function (error) {
						if (error) {
							reject(error, null);
							return;
						}
						resolve(null, true);

					}
				);
			}
		);


	}

	/**
	 *
	 * @param {String} dirPath
	 * @param {Object} data
	 * @param {Function|null} [cb]
	 */
	saveFileAsync(dirPath, data, cb) {
		fs.writeFile(dirPath, data, function (error) {
			if (!cb) return;
			if (error) {
				cb(error, null);
				return;
			}
			cb(null, true);
		});
	}

	scanDir(src) {
		return fs.readdirSync(src).filter(item => fs.lstatSync(path.join(src, item)).isDirectory());
	}
}


module.exports = DataServices;
