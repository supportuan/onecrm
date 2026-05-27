export function hardwareUserKey(deviceIp, empId) {
  return `${deviceIp}::${empId}`;
}

export function mergeDeviceUserBatches(batches) {
  const mergedMap = new Map();
  const warnings = [];
  let skippedNoHardwareId = 0;

  for (const batch of batches) {
    if (!batch.success) {
      warnings.push(`Failed to fetch from device ${batch.deviceIp}: ${batch.error || 'Unknown error'}`);
      continue;
    }

    const users = batch.users || [];
    for (const u of users) {
      const empId = u.emp_id || u.empId || u.userId || u.employeeId;
      if (!empId) {
        skippedNoHardwareId++;
        continue;
      }

      const key = String(empId);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          emp_id: empId,
          name: u.name,
          enrolled: u.enrolled,
          lastMatch: u.lastMatch,
          devices: [batch.deviceIp]
        });
      } else {
        const existing = mergedMap.get(key);
        existing.devices.push(batch.deviceIp);
        if (u.enrolled) existing.enrolled = true;
        if (u.lastMatch && (!existing.lastMatch || new Date(u.lastMatch) > new Date(existing.lastMatch))) {
          existing.lastMatch = u.lastMatch;
        }
      }
    }
  }

  return {
    merged: Array.from(mergedMap.values()),
    warnings,
    skippedNoHardwareId
  };
}
