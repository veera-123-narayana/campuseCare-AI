import React, { useState } from 'react';
import { Copy, Terminal, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { SegmentedControl } from '../ui/SegmentedControl';
import { StatusBadge } from '../ui/StatusBadge';
import { SourceBadge } from '../ui/SourceBadge';
import { Toast } from '../ui/Toast';
import { useCampus } from '../../context/CampusContext';
import { formatTime } from '../../utils/formatTime';

function checkWithinLast60Seconds(timestamp?: string | number | null): boolean {
  if (!timestamp) return false;

  if (typeof timestamp === 'number') {
    const now = Date.now();
    const timeMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
    const diff = now - timeMs;
    return diff >= -5000 && diff <= 60000;
  }

  const str = String(timestamp).trim();
  const lower = str.toLowerCase();

  if (lower === 'just now') return true;

  const secMatch = lower.match(/^(\d+)\s*(?:s|sec|second|seconds)(?:\s*ago)?$/);
  if (secMatch) {
    const seconds = parseInt(secMatch[1], 10);
    return seconds <= 60;
  }

  if (
    lower.includes('min') ||
    lower.includes('hour') ||
    lower.includes('day') ||
    lower.includes('week') ||
    lower.includes('month') ||
    lower.includes('year') ||
    lower.includes('m ago') ||
    lower.includes('h ago') ||
    lower.includes('d ago')
  ) {
    return false;
  }

  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (timeOnlyMatch) {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(timeOnlyMatch[1], 10),
      parseInt(timeOnlyMatch[2], 10),
      parseInt(timeOnlyMatch[3], 10)
    );
    const diff = Math.abs(now.getTime() - target.getTime());
    return diff <= 60000;
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const diff = Date.now() - parsed;
    return diff >= -5000 && diff <= 60000;
  }

  return false;
}

export const PiPhoneCameraSetupCard: React.FC = () => {
  const { devices, rooms, events, connectionStatus, backendOffline } = useCampus();

  // 1. Inputs (React state only)
  const [laptopIp, setLaptopIp] = useState<string>('');
  const [phoneIp, setPhoneIp] = useState<string>('');
  const [phonePort, setPhonePort] = useState<string>('8080');
  const [roomId, setRoomId] = useState<string>('room-204');
  const [cameraSource, setCameraSource] = useState<'phone' | 'usb'>('phone');
  const [irModuleType, setIrModuleType] = useState<'high' | 'low'>('high');
  const [saveDebug, setSaveDebug] = useState<boolean>(false);
  const [testedOnHardware, setTestedOnHardware] = useState<string>('Not tested yet');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 2. Generated command construction
  const backendIpArg = laptopIp.trim() || 'enter the IP address';
  const targetRoomArg = roomId.trim() || 'room-204';
  const phoneIpArg = phoneIp.trim() || 'enter the IP address';
  const portArg = phonePort.trim() || '8080';

  const cameraArg =
    cameraSource === 'phone'
      ? `http://${phoneIpArg}:${portArg}/video`
      : '0';

  let generatedCommand = `python3 pi_node.py --backend http://${backendIpArg}:8000 --room ${targetRoomArg} --camera ${cameraArg} --ir`;
  if (irModuleType === 'low') {
    generatedCommand += ' --active-low';
  }
  if (saveDebug) {
    generatedCommand += ' --save-debug /tmp/dbg';
  }

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(generatedCommand);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3500);
    } catch {
      // clipboard fallback
    }
  };

  // 4. Live link status calculation
  const isHttpMode = (import.meta.env.VITE_DATA_MODE || '').toLowerCase() === 'http';

  // Find recent readings in HTTP mode
  const room204 = rooms.find((r) => r.id === 'room-204' || r.number === '204');

  // Backend reachable
  let backendReceived = false;
  let backendTime: string | null = null;
  let backendSource = 'SIMULATED';

  // Pi heartbeat
  let piHeartbeatReceived = false;
  let piHeartbeatTime: string | null = null;
  let piHeartbeatSource = 'SIMULATED';

  // IR / motion reading
  let irReceived = false;
  let irTime: string | null = null;
  let irSource = 'SIMULATED';

  // Camera headcount
  let cameraReceived = false;
  let cameraTime: string | null = null;
  let cameraSourceVal = 'SIMULATED';

  if (isHttpMode) {
    // Check Pi devices
    const piGateway = devices.find(
      (d) =>
        (d.type === 'PI_GATEWAY' || d.deviceId.toLowerCase().includes('pi')) &&
        d.source === 'PI' &&
        checkWithinLast60Seconds(d.lastPing)
    );
    if (piGateway) {
      piHeartbeatReceived = true;
      piHeartbeatTime = piGateway.lastPing;
      piHeartbeatSource = 'PI';
    }

    // Check IR / Motion
    const motionEvent = events.find(
      (e) =>
        e.source === 'PI' &&
        (e.type === 'sensor.reading' || e.type.includes('motion') || e.type.includes('sensor')) &&
        checkWithinLast60Seconds(e.timestamp)
    );
    const motionDevice = devices.find(
      (d) =>
        d.source === 'PI' &&
        (d.type.includes('PIR') || d.type.includes('SENSOR') || d.name.toLowerCase().includes('ir')) &&
        checkWithinLast60Seconds(d.lastPing)
    );
    if (motionEvent) {
      irReceived = true;
      irTime = motionEvent.timestamp;
      irSource = 'PI';
    } else if (motionDevice) {
      irReceived = true;
      irTime = motionDevice.lastPing;
      irSource = 'PI';
    } else if (room204 && room204.source === 'PI' && room204.motionDetected) {
      irReceived = true;
      irTime = 'Just now';
      irSource = 'PI';
    }

    // Check Camera Headcount
    const visionEvent = events.find(
      (e) =>
        e.source === 'PI' &&
        e.type === 'vision.headcount' &&
        checkWithinLast60Seconds(e.timestamp)
    );
    const cameraDevice = devices.find(
      (d) =>
        d.source === 'PI' &&
        d.type === 'PI_CAMERA' &&
        checkWithinLast60Seconds(d.lastPing)
    );
    if (visionEvent) {
      cameraReceived = true;
      cameraTime = visionEvent.timestamp;
      cameraSourceVal = 'PI';
    } else if (cameraDevice) {
      cameraReceived = true;
      cameraTime = cameraDevice.lastPing;
      cameraSourceVal = 'PI';
    } else if (room204 && room204.source === 'PI' && room204.observedHeadcount > 0) {
      cameraReceived = true;
      cameraTime = 'Just now';
      cameraSourceVal = 'PI';
    }

    // Backend reachable: received real PI reading in last 60s
    const anyPiReadingReceived = piHeartbeatReceived || irReceived || cameraReceived;
    if (!backendOffline && connectionStatus === 'Connected' && anyPiReadingReceived) {
      backendReceived = true;
      backendTime = irTime || cameraTime || piHeartbeatTime || 'Just now';
      backendSource = 'PI';
    }
  }

  const rows = [
    {
      name: 'Backend reachable',
      received: backendReceived,
      time: backendTime,
      source: backendSource,
    },
    {
      name: 'Pi heartbeat',
      received: piHeartbeatReceived,
      time: piHeartbeatTime,
      source: piHeartbeatSource,
    },
    {
      name: 'IR / motion sensor reading',
      received: irReceived,
      time: irTime,
      source: irSource,
    },
    {
      name: 'Camera headcount',
      received: cameraReceived,
      time: cameraTime,
      source: cameraSourceVal,
    },
  ];

  return (
    <Card className="border border-hairline shadow-2xs">
      <CardHeader className="pb-4 border-b border-hairline">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent shrink-0" />
            <CardTitle className="text-[16px]">Pi + phone camera + IR setup</CardTitle>
          </div>
          <SourceBadge source={isHttpMode ? 'LIVE' : 'SIMULATED'} size="sm" />
        </div>
        <CardDescription className="text-[12px]">
          Configure real hardware node telemetry: camera streaming, IR detection, and backend gateway ingestion.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-6 text-[13px]">
        {/* 1. Configuration Inputs */}
        <div className="space-y-4">
          <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wide font-mono">
            Node Configuration Inputs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[12px] font-mono text-muted mb-1">
                Laptop IP
              </label>
              <input
                type="text"
                placeholder="192.168.x.x"
                value={laptopIp}
                onChange={(e) => setLaptopIp(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[12px] font-mono text-muted mb-1">
                Phone IP
              </label>
              <input
                type="text"
                placeholder="192.168.x.x"
                value={phoneIp}
                onChange={(e) => setPhoneIp(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[12px] font-mono text-muted mb-1">
                Phone Port
              </label>
              <input
                type="text"
                placeholder="8080"
                value={phonePort}
                onChange={(e) => setPhonePort(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[12px] font-mono text-muted mb-1">
                Room ID
              </label>
              <input
                type="text"
                placeholder="room-204"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[12px] font-mono text-muted mb-1.5">
                Camera source
              </label>
              <SegmentedControl
                options={[
                  { value: 'phone', label: 'Phone (IP Webcam app)' },
                  { value: 'usb', label: 'USB webcam on the Pi' },
                ]}
                value={cameraSource}
                onChange={(val) => setCameraSource(val as 'phone' | 'usb')}
                size="sm"
                className="w-full justify-start"
              />
            </div>

            <div>
              <label className="block text-[12px] font-mono text-muted mb-1.5">
                IR module type
              </label>
              <SegmentedControl
                options={[
                  { value: 'high', label: 'Outputs HIGH when it detects' },
                  { value: 'low', label: 'Outputs LOW when it detects (active-low)' },
                ]}
                value={irModuleType}
                onChange={(val) => setIrModuleType(val as 'high' | 'low')}
                size="sm"
                className="w-full justify-start"
              />
            </div>
          </div>

          <div className="pt-1">
            <Switch
              checked={saveDebug}
              onChange={setSaveDebug}
              label="Save debug image on the Pi"
              description="Adds --save-debug /tmp/dbg"
            />
          </div>
        </div>

        {/* 2. Generated Command */}
        <div className="space-y-2 pt-2 border-t border-hairline">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] font-semibold text-ink uppercase tracking-wide">
              Generated Command
            </span>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-status-green" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyCommand}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline overflow-x-auto">
            <pre className="font-mono text-[12px] text-ink whitespace-pre select-all leading-relaxed">
              {generatedCommand}
            </pre>
          </div>
        </div>

        {/* 3. Setup Checklist */}
        <div className="space-y-2.5 pt-2 border-t border-hairline">
          <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wide font-mono">
            Setup Checklist
          </h4>
          <ol className="space-y-2 text-[13px] text-ink leading-relaxed list-decimal list-inside pl-1">
            <li>Phone: install "IP Webcam", tap Start server, keep the screen on and charging.</li>
            <li>Put the phone, Pi and laptop on the same Wi-Fi or phone hotspot. If using a USB cable, it must be a DATA cable with USB tethering turned on.</li>
            <li>
              On the Pi, test the stream:{' '}
              <code className="font-mono text-[11px] bg-surface-2 px-1.5 py-0.5 rounded border border-hairline">
                curl -I http://&lt;phone-ip&gt;:&lt;port&gt;/video
              </code>
            </li>
            <li>
              Wire the IR sensor: VCC to 3.3V (pin 1), GND to pin 6, OUT to GPIO17 (pin 11). Pi GPIO pins are 3.3 V only. If the module needs 5 V power, divide its OUT with 1k + 2k before GPIO17.
            </li>
            <li>
              Start the backend on the laptop:{' '}
              <code className="font-mono text-[11px] bg-surface-2 px-1.5 py-0.5 rounded border border-hairline">
                python3 backend/server.py
              </code>
            </li>
            <li>Run the generated command on the Pi.</li>
            <li>
              The top bar changes from SIMULATION to {'PI' + ' CONNECTED'} when real readings arrive.
            </li>
          </ol>
          <p className="text-[12px] text-muted italic pt-1 pl-1">
            If the IR reading looks inverted, switch the IR module type above.
          </p>
        </div>

        {/* 4. Live Link Status */}
        <div className="space-y-3 pt-2 border-t border-hairline">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wide font-mono">
              Live Link Status
            </h4>
            <span className="text-[11px] font-mono text-muted">
              {isHttpMode ? 'Backend Link: HTTP' : 'Simulation Mode'}
            </span>
          </div>

          {!isHttpMode && (
            <div className="p-3 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[12px] text-muted">
              Not connected. Running in simulation mode.
            </div>
          )}

          <div className="overflow-x-auto rounded-[8px] border border-hairline">
            <table className="w-full text-[13px] border-collapse bg-surface">
              <thead>
                <tr className="border-b border-hairline bg-surface-2 text-left text-[11px] font-mono text-muted uppercase">
                  <th className="py-2.5 px-3 font-semibold">Feed / Link</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Last Message</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((row) => (
                  <tr key={row.name} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-ink">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={row.received ? 'normal' : 'inactive'}
                        label={row.received ? 'Received' : 'Waiting'}
                        size="sm"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-muted">
                      {row.received && row.time ? formatTime(row.time) : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <SourceBadge source={row.source} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Honest Notes */}
        <div className="space-y-2 border-t border-hairline pt-4 text-[12px] text-muted">
          <p>
            • Face detection counts faces turned toward the camera and can undercount. This is a headcount, not attendance.
          </p>
          <p>
            • Only the headcount leaves the Pi. Images are never sent.
          </p>
          <div className="flex items-center gap-2 pt-1.5 flex-wrap">
            <label className="font-medium text-ink text-[12px]">
              Tested on real hardware:
            </label>
            <input
              type="text"
              value={testedOnHardware}
              onChange={(e) => setTestedOnHardware(e.target.value)}
              className="px-2.5 py-1 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[12px] text-ink focus:outline-none focus:border-accent min-w-[200px]"
            />
          </div>
        </div>
      </CardContent>

      {/* Toast Notification when Command is Copied */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in duration-200">
          <Toast
            type="success"
            title="Command copied"
            message="Paste and execute in the Raspberry Pi terminal."
            onDismiss={() => setShowToast(false)}
          />
        </div>
      )}
    </Card>
  );
};
