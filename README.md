
<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-domoticz-thermostat

</span>

## Description
When including or creating Thermostat with Domoticz, the platform separate into several devices (Temparature, setpoint, switch, ...). This [homebridge](https://github.com/nfarina/homebridge) plugin allow to rebuilt thermostat that fit with the Homebridge thermostat display. Using simple HTTP requests to the [Domoticz Json API](https://www.domoticz.com/wiki/Domoticz_API/JSON_URL's), the plugin allows you to get the room temperature (Humidity also if available), set the thermostat mode and control the target temperature.

## Preparation
The switch Controlling your heater must be a Domoticz "Selector Switch" with 4 levels even each are not used.
| Homebridge Level | Name | Domoticz Level  |
| --- | --- | --- |
| `0` | `Off` | `0` |
| `1` | `Heat` | `10` |
| `2` | `Cool` | `20` |
| `3` | `Auto` | `30` |

**Note:** This project is based on [homebridge-web-thermostat](https://github.com/Tommrodrigues/homebridge-web-thermostat)

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g git+https://github.com/MLO881/homebridge-domoticz-thermostat.git`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
  {
    "accessory": "Thermostat",
    "name": "Thermostat",
    "apiroute": "http://localhost",
    "currentTemperatureIdx": "IDX",
    "targetTemperatureIdx" : "IDX",
    "heatingCoolingStateIdx": "IDX"
  }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `Thermostat` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `currentRelativeHumidity` | Wheteher your temerature sensor is also humitity sensor | `false` |
| `temperatureDisplayUnits` | Whether you want °C (`0`) or °F (`1`) as your units | `0` |
| `heatOnly` | Whether to only expose the heating characteristic, and not cooling/auto | `false` |
| `maxTemp` | Upper bound for the temperature selector in the Home app | `30` |
| `minTemp` | Lower bound for the temperature selector in the Home app | `15` |
| `minStep` | Minimum increment value for the temperature selector in the Home app | `0.5` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |
