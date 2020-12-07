var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-domoticz-thermostat', 'Thermostat', Thermostat)
}

function Thermostat (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300
  
  //listener TBC
  //this.listener = config.listener || false
  //this.port = config.port || 2000
  //this.requestArray = ['targetHeatingCoolingState', 'targetTemperature']

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.heatOnly = config.heatOnly || false

  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0
  this.maxTemp = config.maxTemp || 30
  this.minTemp = config.minTemp || 15
  this.minStep = config.minStep || 0.5

  this.currentTemperatureIdx = config.currentTemperatureIdx
  this.currentRelativeHumidity = config.currentRelativeHumidity || false
  this.targetTemperatureIdx = config.targetTemperatureIdx
  this.heatingCoolingStateIdx = config.heatingCoolingStateIdx || null
  //this.deviceType = config.deviceType || 'switchlight' // swithlight ou general or ....  
 
 
  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

/*  listener TBC
if (this.listener) {
    this.server = http.createServer(function (request, response) {
      var baseURL = 'http://' + request.headers.host + '/'
      var url = new URL(request.url, baseURL)
      if (this.requestArray.includes(url.pathname.substr(1))) {
        this.log.debug('Handling request')
        response.end('Handling request')
        this._httpHandler(url.pathname.substr(1), url.searchParams.get('value'))
      } else {
        this.log.warn('Invalid request: %s', request.url)
        response.end('Invalid request')
      }
    }.bind(this))
    this.server.listen(this.port, function () {
      this.log('Listen server: http://%s:%s', ip.address(), this.port)
    }.bind(this))
  }
 */
  this.service = new Service.Thermostat(this.name)
}


Thermostat.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
	
  //get Temperature + humidity Data  
	var url1 = this.apiroute + '/json.htm?type=devices&rid=' + this.currentTemperatureIdx
	this.log.debug('Getting status URL1: %s', url1)

	this._httpRequest(url1, '', this.http_method, function (error, response, responseBody) {
	  if (error) {
		this.log.warn('Error getting status: %s', error.message)
		this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(new Error('Polling failed'))
		callback(error)
	  } else {
		this.log.debug('Device response: %s', responseBody)
		var json = JSON.parse(responseBody)
		this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.result[0].Temp)
		this.log.debug('Updated CurrentTemperature to: %s', json.result[0].Temp)
		if (this.currentRelativeHumidity) {
			  this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.result[0].Humidity)
			  this.log.debug('Updated CurrentRelativeHumidity to: %s', json.result[0].Humidity)
		}
		callback()
	  }
	}.bind(this))
    
    
  //get Target temperature
	var url2 = this.apiroute + '/json.htm?type=devices&rid=' + this.targetTemperatureIdx
	this.log.debug('Getting status URL2: %s', url2)

	this._httpRequest(url2, '', this.http_method, function (error, response, responseBody) {
	  if (error) {
      this.log.warn('Error getting status: %s', error.message)
      this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(new Error('Polling failed'))
      callback(error)
	  } else {
      this.log.debug('Device response: %s', responseBody)
      var json = JSON.parse(responseBody)
      this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.result[0].SetPoint)
      this.log.debug('Updated TargetTemperature to: %s', json.result[0].SetPoint)
      callback()
	  }
	}.bind(this))	  
	  
	
	//get current TargetHeatingCoolingState
	this.log.debug('heatingCoolingStateIdx: %s', this.heatingCoolingStateIdx)
	if (this.heatingCoolingStateIdx != null) {
		var url3 = this.apiroute + '/json.htm?type=devices&rid=' + this.heatingCoolingStateIdx
		this.log.debug('Getting status URL3: %s', url3)

		this._httpRequest(url3, '', this.http_method, function (error, response, responseBody) {
		  if (error) {
			this.log.warn('Error getting status: %s', error.message)
			this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(new Error('Polling failed'))
			callback(error)
		  } else {
			this.log.debug('Device response: %s', responseBody)
			var json = JSON.parse(responseBody)
			if ( json.result[0].hasOwnProperty('Level') ) {
				var Level = json.result[0].Level/10 
				this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(Level)
			} else if ( json.result[0].hasOwnProperty('Mode') ) {
				this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.result[0].Mode)
				this.log.debug('Updated TargetHeatingCoolingState to: %s', json.result[0].Mode)
			} else {
				this.log.debug('Updated TargetHeatingCoolingState to: %s', 'error no hasOwnProperty')
			}
			callback()
		  }
		}.bind(this))
	} 
  },
  

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'targetHeatingCoolingState':
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetTemperature':
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },


  setTargetHeatingCoolingState: function (value, callback) {
	if (this.heatingCoolingStateIdx != null) {
	    var nvalue= value 
	    var svalue= value * 10
	    var url = this.apiroute + '/json.htm?type=command&param=udevice&idx=' + this.heatingCoolingStateIdx + '&nvalue=' + nvalue + ' &svalue=' + svalue
	    this.log.debug('Setting targetHeatingCoolingState: %s', url)

	    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
	      if (error) {
		this.log.warn('Error setting targetHeatingCoolingState: %s', error.message)
		callback(error)
	      } else {
		this.log('Set targetHeatingCoolingState to: %s', value)
		this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(value)
		callback()
	      }
	    }.bind(this))
  	}
  },

  setTargetTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/json.htm?type=command&param=setsetpoint&idx=' + this.targetTemperatureIdx + '&setpoint=' + value
    this.log.debug('Setting targetTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },


  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits)

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    if (this.heatOnly) {
      this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps({
          maxValue: Characteristic.TargetHeatingCoolingState.HEAT
        })
    }

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this))
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: this.minStep
      })


    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }
}
