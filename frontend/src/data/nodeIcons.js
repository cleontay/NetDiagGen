import routerIcon from '../assets/icons/router.svg';
import serverIcon from '../assets/icons/server.svg';
import workstationIcon from '../assets/icons/workstation.svg';
import iotIcon from '../assets/icons/iot.svg';
import defaultIcon from '../assets/icons/device.svg';

const TYPE_ICONS = {
  router: routerIcon,
  server: serverIcon,
  workstation: workstationIcon,
  iot: iotIcon,
};

export function getDefaultIcon(type) {
  return TYPE_ICONS[type] ?? defaultIcon;
}

// A device's own custom icon (uploaded, stored as a data URI override)
// always wins over the default type icon.
export function getNodeIcon(device) {
  return device.icon || getDefaultIcon(device.type);
}
