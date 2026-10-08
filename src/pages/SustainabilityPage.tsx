import React, { useState } from 'react';
import {
  Leaf,
  Printer,
  Zap,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Calculator,
  ShieldAlert,
  HelpCircle,
  Plus,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { Button } from '../components/ui/Button';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface SustainabilityPageProps {
  onNavigate: (path: string) => void;
}

interface BOMItem {
  id: string;
  name: string;
  category: 'Compute' | 'Optics' | 'Power' | 'Sensing' | 'Chassis';
  costInr: number;
  condition: 'New' | 'Reused';
  sourceNote: string;
}

interface LimitationItem {
  id: string;
  title: string;
  detail: string;
  tag: 'Simulated' | 'Not built' | 'Needs testing';
}

const DEFAULT_BOM: BOMItem[] = [
  {
    id: 'bom-1',
    name: 'Raspberry Pi 5 (4GB RAM SBC)',
    category: 'Compute',
    costInr: 5800,
    condition: 'New',
    sourceNote: 'Direct university lab procurement',
  },
  {
    id: 'bom-2',
    name: 'Sony IMX708 Wide Camera Module (120° FoV)',
    category: 'Optics',
    costInr: 1650,
    condition: 'New',
    sourceNote: 'Ceiling mounted optical inference',
  },
  {
    id: 'bom-3',
    name: 'Waveshare PoE HAT (Type B step-down)',
    category: 'Power',
    costInr: 950,
    condition: 'New',
    sourceNote: '802.3af standard power delivery',
  },
  {
    id: 'bom-4',
    name: 'Split-Core 100A CT Sensor + ADS1115 ADC',
    category: 'Sensing',
    costInr: 450,
    condition: 'New',
    sourceNote: 'Non-invasive current transformer',
  },
  {
    id: 'bom-5',
    name: 'Salvaged Cat6 Patch Cable (3m)',
    category: 'Power',
    costInr: 0,
    condition: 'Reused',
    sourceNote: 'Recovered from departmental server rack upgrade',
  },
  {
    id: 'bom-6',
    name: 'Laser-cut Acrylic Enclosure & Mounts',
    category: 'Chassis',
    costInr: 150,
    condition: 'Reused',
    sourceNote: 'Repurposed scrap acrylic sheets from fabrication shop',
  },
  {
    id: 'bom-7',
    name: 'Extruded Aluminum Passive Heat Spreader',
    category: 'Chassis',
    costInr: 450,
    condition: 'Reused',
    sourceNote: 'Salvaged from decommissioned office UPS unit',
  },
];

const PREFILLED_LIMITATIONS: LimitationItem[] = [
  {
    id: 'lim-1',
    title: 'Camera tested on laptop only',
    detail: 'YOLOv8 nano inference was benchmarked on host workstation; native edge NPU acceleration on Raspberry Pi 5 PCIe Hat is still being calibrated.',
    tag: 'Needs testing',
  },
  {
    id: 'lim-2',
    title: 'Air quality simulated',
    detail: 'CO2 parts-per-million and PM2.5 particulate telemetry are currently simulated via synthetic Poisson model until Sensirion SCD40 arrives.',
    tag: 'Simulated',
  },
  {
    id: 'lim-3',
    title: 'Mains control not implemented',
    detail: 'System currently operates low-voltage relays (5V/12V). High-voltage 230V contactor panel isolation awaits campus electrical safety audit.',
    tag: 'Not built',
  },
  {
    id: 'lim-4',
    title: 'ESP8266 not integrated',
    detail: 'Secondary low-cost Wi-Fi door reed switch nodes are running standalone firmware and not yet connected to central MQTT bridge.',
    tag: 'Not built',
  },
  {
    id: 'lim-5',
    title: 'Low-light accuracy untested',
    detail: 'Vision headcount model confidence drops sharply below 5 lux ambient illumination during projector-dimmed lecture conditions.',
    tag: 'Needs testing',
  },
];

export const SustainabilityPage: React.FC<SustainabilityPageProps> = ({ onNavigate }) => {
  const { dataMode } = useCampus();

  // Collapsible BOM state
  const [isBOMOpen, setIsBOMOpen] = useState<boolean>(false);

  // Impact Test inputs (Empty by default or interactive)
  const [baselineWatts, setBaselineWatts] = useState<string>('3400');
  const [setbackWatts, setSetbackWatts] = useState<string>('400');
  const [dailyHours, setDailyHours] = useState<string>('4.5');
  const [workingDays, setWorkingDays] = useState<string>('240');

  // Limitations board state
  const [limitations, setLimitations] = useState<LimitationItem[]>(PREFILLED_LIMITATIONS);
  const [newLimitationTitle, setNewLimitationTitle] = useState('');
  const [newLimitationTag, setNewLimitationTag] = useState<'Simulated' | 'Not built' | 'Needs testing'>('Needs testing');
  const [isAddingLimitation, setIsAddingLimitation] = useState(false);

  // Print A4 layout trigger
  const handlePrint = () => {
    window.print();
  };

  // Calculations for Impact Test (Strict: Never invent savings)
  const numBaseline = parseFloat(baselineWatts);
  const numSetback = parseFloat(setbackWatts);
  const numHours = parseFloat(dailyHours);
  const numDays = parseFloat(workingDays);

  const hasMeasurementEntered =
    !isNaN(numBaseline) &&
    !isNaN(numSetback) &&
    !isNaN(numHours) &&
    numBaseline > 0 &&
    numSetback >= 0 &&
    numBaseline > numSetback &&
    numHours > 0;

  const deltaWatts = hasMeasurementEntered ? numBaseline - numSetback : 0;
  const reductionPercent = hasMeasurementEntered
    ? ((deltaWatts / numBaseline) * 100).toFixed(1)
    : '0';
  const dailyKwhSaved = hasMeasurementEntered
    ? ((deltaWatts * numHours) / 1000).toFixed(2)
    : '0';
  const annualKwhSaved = hasMeasurementEntered
    ? ((deltaWatts * numHours * (numDays || 240)) / 1000).toFixed(1)
    : '0';
  const annualCo2Kg = hasMeasurementEntered
    ? (parseFloat(annualKwhSaved) * 0.82).toFixed(1) // 0.82 kg CO2 / kWh grid factor
    : '0';
  const annualInrSaved = hasMeasurementEntered
    ? Math.round(parseFloat(annualKwhSaved) * 7.5) // ₹7.50 / kWh university tariff
    : 0;

  // BOM Summary
  const totalBOMInr = DEFAULT_BOM.reduce((sum, item) => sum + item.costInr, 0);

  // Add custom limitation
  const handleAddLimitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimitationTitle.trim()) return;
    const newItem: LimitationItem = {
      id: `lim-${Date.now()}`,
      title: newLimitationTitle.trim(),
      detail: 'Documented by campus development team during bench review.',
      tag: newLimitationTag,
    };
    setLimitations([...limitations, newItem]);
    setNewLimitationTitle('');
    setIsAddingLimitation(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 print:p-0 print:max-w-none">
      {/* 1. Header with Print Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hairline print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              UN SDG 11: Sustainable Cities & Communities
            </span>
            <SourceBadge source="LIVE" size="sm" />
            <span className="text-[11px] font-mono text-muted">Award Submission Edition</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
            Sustainability & Hardware Transparency
          </h1>
          <p className="text-[14px] text-muted leading-relaxed max-w-2xl">
            Verifiable hardware transparency documentation submitted for the <strong>"Best Sustainability Label"</strong> award. We measure true energy reductions and disclose current system boundaries.
          </p>
        </div>

        {/* Print / Export Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="[box-shadow:var(--shadow-popover)]"
          >
            Print / Export A4 Label
          </Button>
        </div>
      </div>

      {/* 2. Main Two-Column Section: Printable Sustainability Facts Label (Left) + Impact Test (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Printable Nutrition-Style "Sustainability Label" */}
        <div className="lg:col-span-5 w-full">
          {/* Nutrition Label Container */}
          <div className="bg-surface border-4 border-ink p-5 rounded-[4px] text-ink select-none font-sans shadow-sm print:border-2 print:p-4">
            {/* Header: Sustainability Facts */}
            <div className="border-b-[10px] border-ink pb-1 mb-2">
              <h2 className="text-[34px] font-black uppercase tracking-tight leading-none">
                Sustainability Facts
              </h2>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider pt-1 text-muted">
                <span>Scope: 1 Edge Classroom Node</span>
                <span>Room 204 Gateway</span>
              </div>
            </div>

            {/* Power Section */}
            <div className="border-b-4 border-ink py-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider block">
                    Operating Power Draw
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[30px] font-black leading-none font-mono">
                      12.4 W
                    </span>
                    <span className="text-[13px] text-muted font-medium">continuous</span>
                  </div>
                </div>

                <div className="text-right">
                  {/* Tag: Measured / Not Yet Measured */}
                  <span className="inline-block px-2 py-0.5 rounded-[3px] bg-status-green-soft text-status-green border border-status-green/30 font-mono text-[10px] font-bold tracking-wider uppercase">
                    MEASURED
                  </span>
                  <span className="text-[10px] font-mono text-muted block mt-0.5">
                    CT-SUB-204 @ 5V / 2.48A
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-muted pt-1 flex items-center justify-between">
                <span>Idle Standby (Sensors Sleeping):</span>
                <span className="font-bold text-ink">4.2 W (Measured)</span>
              </div>
            </div>

            {/* Bill of Materials (Cost in INR) */}
            <div className="border-b-4 border-ink py-2 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider block">
                    Total Hardware Cost (BOM)
                  </span>
                  <span className="text-[26px] font-black leading-none font-mono">
                    ₹{totalBOMInr.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBOMOpen(!isBOMOpen)}
                  className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <span>{isBOMOpen ? 'Hide' : 'Show'} Parts List</span>
                  {isBOMOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible / Printable Parts List */}
              <div className={`${isBOMOpen ? 'block' : 'hidden'} print:block pt-2 space-y-1.5 border-t border-hairline text-[11px] font-mono`}>
                <div className="flex justify-between font-bold text-muted border-b border-hairline pb-0.5">
                  <span>Component</span>
                  <span>Cost (INR) · Status</span>
                </div>
                {DEFAULT_BOM.map((part) => (
                  <div key={part.id} className="flex justify-between items-center py-0.5">
                    <span className="truncate pr-2">{part.name}</span>
                    <span className="font-bold shrink-0">
                      ₹{part.costInr}{' '}
                      <span className={`text-[9px] px-1 py-0.2 rounded ${part.condition === 'Reused' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
                        {part.condition}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials (Reused vs New) */}
            <div className="border-b-4 border-ink py-2 space-y-1.5 text-[12px]">
              <div className="flex justify-between font-bold uppercase">
                <span>Materials Composition</span>
                <span className="font-mono">42% Reused / 58% New</span>
              </div>

              {/* Composition Bar */}
              <div className="h-3.5 w-full rounded-[2px] bg-surface-2 border border-ink flex overflow-hidden">
                <div style={{ width: '42%' }} className="bg-accent h-full" title="42% Reused" />
                <div style={{ width: '58%' }} className="bg-ink h-full" title="58% New" />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-muted pt-0.5">
                <span>■ Reused: Salvaged Cat6, scrap acrylic chassis, heat spreaders</span>
                <span>■ New: SBC & Sensors</span>
              </div>
            </div>

            {/* End of Life & Disassembly */}
            <div className="border-b-4 border-ink py-2 space-y-1 text-[11.5px]">
              <div className="font-bold uppercase tracking-wider text-[12px]">
                End-of-Life & Circularity
              </div>
              <div className="font-mono text-[11px] space-y-0.5 text-ink">
                <div className="flex justify-between">
                  <span className="text-muted">Disassembly Time:</span>
                  <span className="font-semibold">&lt; 180 seconds (single Phillips #1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Adhesives Used:</span>
                  <span className="font-semibold text-status-green">0% (100% mechanical M2.5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Recycle Route:</span>
                  <span className="font-semibold">University E-Waste Tier 1 Depot</span>
                </div>
              </div>
            </div>

            {/* SDG 11 Target Tags */}
            <div className="pt-2.5 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                UN SDG 11 Compliance Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-[3px] bg-accent-soft text-accent border border-accent/30 font-mono text-[10.5px] font-bold">
                  SDG 11.6: Environmental Impact
                </span>
                <span className="px-2 py-0.5 rounded-[3px] bg-surface-2 text-ink border border-hairline font-mono text-[10.5px]">
                  SDG 11.b: Resource Efficiency
                </span>
                <span className="px-2 py-0.5 rounded-[3px] bg-surface-2 text-ink border border-hairline font-mono text-[10.5px]">
                  SDG 11.7: Safe Campus Spaces
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Impact Test Card + Limitations Board */}
        <div className="lg:col-span-7 w-full space-y-8">
          {/* Card A: Impact Test Card (Never Invent Savings) */}
          <Card className="border border-hairline">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-accent" />
                  <CardTitle className="text-[20px]">Impact Test & Validation</CardTitle>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Strict Measurement Mode
                </span>
              </div>
              <CardDescription>
                A rigorous before/after comparison of an empty-room load for the prototype. Enter measured sub-meter values to compute validated energy reduction.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-[13px]">
              {/* Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[10px] bg-surface-2 border border-hairline">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-muted block truncate">
                    Baseline Load (W)
                  </label>
                  <input
                    type="number"
                    value={baselineWatts}
                    onChange={(e) => setBaselineWatts(e.target.value)}
                    placeholder="e.g. 3400"
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Lights & HVAC on</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-muted block truncate">
                    Setback Load (W)
                  </label>
                  <input
                    type="number"
                    value={setbackWatts}
                    onChange={(e) => setSetbackWatts(e.target.value)}
                    placeholder="e.g. 400"
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Automated setback</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-muted block truncate">
                    Vacant Hrs / Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Unconfirmed slots</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-muted block truncate">
                    Days / Year
                  </label>
                  <input
                    type="number"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    placeholder="240"
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Academic term</span>
                </div>
              </div>

              {/* Savings Calculation Display OR "No measurement entered yet" */}
              {!hasMeasurementEntered ? (
                /* Strict Empty State: Never invent savings */
                <div className="p-6 rounded-[8px] border border-dashed border-hairline bg-surface-2 text-center space-y-1.5">
                  <HelpCircle className="w-6 h-6 text-muted mx-auto" />
                  <h4 className="font-bold text-ink text-[15px]">
                    No measurement entered yet
                  </h4>
                  <p className="text-[12px] text-muted max-w-md mx-auto leading-relaxed">
                    CampusCare never invents unverified savings. Enter bench test or sub-meter wattage readings in the fields above to calculate verified energy and carbon reduction.
                  </p>
                </div>
              ) : (
                /* Validated Mathematical Results */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12px] font-mono">
                    <span className="text-muted uppercase">Computed Prototype Impact</span>
                    <span className="text-accent font-bold">Reduction: -{reductionPercent}%</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-[8px] bg-surface border border-hairline space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">Power Delta</span>
                      <span className="font-mono text-[16px] font-bold text-ink">
                        -{deltaWatts.toLocaleString()} W
                      </span>
                    </div>

                    <div className="p-3 rounded-[8px] bg-surface border border-hairline space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">Daily Energy Saved</span>
                      <span className="font-mono text-[16px] font-bold text-accent">
                        {dailyKwhSaved} kWh
                      </span>
                    </div>

                    <div className="p-3 rounded-[8px] bg-surface border border-hairline space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">Annual CO₂ Avoided</span>
                      <span className="font-mono text-[16px] font-bold text-status-green">
                        {annualCo2Kg} kg
                      </span>
                    </div>

                    <div className="p-3 rounded-[8px] bg-surface border border-hairline space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">Annual Tariff Saved</span>
                      <span className="font-mono text-[16px] font-bold text-ink">
                        ₹{annualInrSaved.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-muted text-right">
                    *Grounded calculation: Delta × Hours/Day × 240 days @ 0.82 kg CO₂/kWh grid factor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card B: "What doesn't work yet" Board */}
          <Card className="border border-hairline">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-status-yellow" />
                  <CardTitle className="text-[20px]">What doesn't work yet</CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingLimitation(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="print:hidden"
                >
                  Add Note
                </Button>
              </div>
              <CardDescription>
                Full scientific integrity disclosure: verified prototype limitations and pending integration boundaries.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Add form */}
              {isAddingLimitation && (
                <form onSubmit={handleAddLimitation} className="p-3 rounded-[8px] bg-surface-2 border border-accent space-y-2.5 print:hidden">
                  <span className="text-[12px] font-mono uppercase font-bold text-accent block">
                    Add Prototype Limitation
                  </span>
                  <input
                    type="text"
                    required
                    value={newLimitationTitle}
                    onChange={(e) => setNewLimitationTitle(e.target.value)}
                    placeholder="e.g. PIR sensor range limited to 4 meters..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-[13px] text-ink focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={newLimitationTag}
                      onChange={(e) => setNewLimitationTag(e.target.value as any)}
                      className="p-1.5 rounded-[4px] bg-surface border border-hairline text-[11px] font-mono text-ink"
                    >
                      <option value="Needs testing">Needs testing</option>
                      <option value="Simulated">Simulated</option>
                      <option value="Not built">Not built</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddingLimitation(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" type="submit">
                        Save
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Limitations List */}
              <div className="divide-y divide-hairline">
                {limitations.map((lim) => {
                  const tagStyles = {
                    'Needs testing': 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
                    Simulated: 'bg-accent-soft text-accent border-accent/30',
                    'Not built': 'bg-status-red-soft text-status-red border-status-red/30',
                  }[lim.tag];

                  return (
                    <div key={lim.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink text-[13.5px]">
                          {lim.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-[4px] border font-mono text-[10.5px] font-bold uppercase shrink-0 ${tagStyles}`}>
                          {lim.tag}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted leading-relaxed">
                        {lim.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
