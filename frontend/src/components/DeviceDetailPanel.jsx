const KNOWN_FIELDS = new Set(['id', 'name', 'type', 'status', 'ip', 'networkId', 'networkName']);

export default function DeviceDetailPanel({ device }) {
  if (!device) {
    return (
      <div className="node-info">
        <h3>Device Details</h3>
        <div id="infoContent">Click on any node to see details</div>
      </div>
    );
  }

  const extraFields = Object.entries(device).filter(
    ([key, value]) => !KNOWN_FIELDS.has(key) && value !== undefined
  );

  return (
    <div className="node-info">
      <h3>Device Details</h3>
      <div id="infoContent">
        <strong>{device.name}</strong>
        <br />
        ID: {device.id}
        <br />
        Type: {device.type}
        <br />
        {device.ip && (
          <>
            IP: {device.ip}
            <br />
          </>
        )}
        {device.networkName && (
          <>
            Network: {device.networkName}
            <br />
          </>
        )}
        Status: {device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Unknown'}
        <br />
        {extraFields.length > 0 && (
          <>
            <hr />
            {extraFields.map(([key, value]) => (
              <div key={key}>
                {key}: {String(value)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
