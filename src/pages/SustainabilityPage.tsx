import React, { useState } from 'react';
import {
  Printer,
  ChevronDown,
  ChevronRight,
  Calculator,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  Package,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface SustainabilityPageProps {
  onNavigate: (path: string) => void;
}

export type InputTag = 'MEASURED' | 'FROM LABEL' | 'ASSUMED';

export interface BOMItem {
  id: string;
  name: string;
  price: string; // starts blank
  condition: 'New' | 'Reused';
}

export interface LimitationItem {
  id: string;
  title: string;
  status: 'Not tested yet' | 'Simulated values' | 'Not built';
  nextStep: string;
  helpNeeded: string;
}

const INITIAL_BOM: BOMItem[] = [
  { id: 'bom-1', name: 'Raspberry Pi (model: enter)', price: '', condition: 'New' },
  { id: 'bom-2', name: 'IR sensor', price: '', condition: 'New' },
  { id: 'bom-3', name: 'Arduino Uno', price: '', condition: 'New' },
  { id: 'bom-4', name: 'ESP8266', price: '', condition: 'New' },
  { id: 'bom-5', name: 'phone/laptop camera', price: '', condition: 'Reused' },
  { id: 'bom-6', name: 'jumper wires', price: '', condition: 'New' },
];

const INITIAL_LIMITATIONS: LimitationItem[] = [
  {
    id: 'lim-1',
    title: 'Camera tested on laptop only',
    status: 'Not tested yet',
    nextStep: 'Test on edge hardware node.',
    helpNeeded: 'Hardware edge compute testing setup.',
  },
  {
    id: 'lim-2',
    title: 'Air quality simulated',
    status: 'Simulated values',
    nextStep: 'Interface physical sensor hardware.',
    helpNeeded: 'Hardware sensor module availability.',
  },
  {
    id: 'lim-3',
    title: 'Mains control not implemented',
    status: 'Not built',
    nextStep: 'Undergo campus electrical safety review.',
    helpNeeded: 'Certified electrician audit.',
  },
  {
    id: 'lim-4',
    title: 'ESP8266 not integrated',
    status: 'Not built',
    nextStep: 'Configure wireless node networking.',
    helpNeeded: 'Network configuration support.',
  },
  {
    id: 'lim-5',
    title: 'Low-light accuracy untested',
    status: 'Not tested yet',
    nextStep: 'Benchmark accuracy in varied illumination.',
    helpNeeded: 'Validation data collection.',
  },
];

export const SustainabilityPage: React.FC<SustainabilityPageProps> = () => {
  // Collapsible BOM state in Nutrition label
  const [isBOMOpen, setIsBOMOpen] = useState<boolean>(false);

  // 1. Sustainability Calculator Inputs (Start ALL inputs empty; remove hardcoded 0.82 and 7.5)
  const [ratedWatts, setRatedWatts] = useState<string>('');
  const [dailyHours, setDailyHours] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<string>('');
  const [gridEmissionFactor, setGridEmissionFactor] = useState<string>('');
  const [tariff, setTariff] = useState<string>('');

  // Provenance tag on each input: MEASURED, FROM LABEL, or ASSUMED
  const [ratedWattsTag, setRatedWattsTag] = useState<InputTag>('FROM LABEL');
  const [dailyHoursTag, setDailyHoursTag] = useState<InputTag>('ASSUMED');
  const [workingDaysTag, setWorkingDaysTag] = useState<InputTag>('ASSUMED');
  const [gridEmissionFactorTag, setGridEmissionFactorTag] = useState<InputTag>('ASSUMED');
  const [tariffTag, setTariffTag] = useState<InputTag>('ASSUMED');

  // 2. Editable BOM table state
  const [bomItems, setBomItems] = useState<BOMItem[]>(INITIAL_BOM);

  // 3. Limitations Board state
  const [limitations, setLimitations] = useState<LimitationItem[]>(INITIAL_LIMITATIONS);
  const [newLimitationTitle, setNewLimitationTitle] = useState('');
  const [newLimitationStatus, setNewLimitationStatus] = useState<LimitationItem['status']>('Not tested yet');
  const [isAddingLimitation, setIsAddingLimitation] = useState(false);

  // Print A4 layout trigger
  const handlePrint = () => {
    window.print();
  };

  // Calculation values
  const numRatedWatts = parseFloat(ratedWatts);
  const numHours = parseFloat(dailyHours);
  const numDays = parseFloat(workingDays);
  const numEmissionFactor = parseFloat(gridEmissionFactor);
  const numTariff = parseFloat(tariff);

  const areAllInputsFilled =
    !isNaN(numRatedWatts) && numRatedWatts > 0 &&
    !isNaN(numHours) && numHours > 0 &&
    !isNaN(numDays) && numDays > 0 &&
    !isNaN(numEmissionFactor) && numEmissionFactor > 0 &&
    !isNaN(numTariff) && numTariff > 0;

  // Energy avoided: (Rated Watts * hours empty * days) / 1000
  const annualKwhSaved = areAllInputsFilled
    ? ((numRatedWatts * numHours * numDays) / 1000).toFixed(1)
    : null;

  const dailyKwhSaved = areAllInputsFilled
    ? ((numRatedWatts * numHours) / 1000).toFixed(2)
    : null;

  // CO2 reduction: Energy avoided * grid emission factor
  const annualCo2Kg = (areAllInputsFilled && annualKwhSaved)
    ? (parseFloat(annualKwhSaved) * numEmissionFactor).toFixed(1)
    : null;

  // Financial savings: Energy avoided * tariff
  const annualInrSaved = (areAllInputsFilled && annualKwhSaved)
    ? Math.round(parseFloat(annualKwhSaved) * numTariff)
    : null;

  // BOM Calculations
  const totalBOMInr = bomItems.reduce((sum, item) => {
    const p = parseFloat(item.price);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);
  const hasAnyBOMPrice = bomItems.some((item) => item.price.trim() !== '' && !isNaN(parseFloat(item.price)));

  const reusedCount = bomItems.filter((i) => i.condition === 'Reused').length;
  const totalItemsCount = bomItems.length || 1;
  const reusedPct = Math.round((reusedCount / totalItemsCount) * 100);
  const newPct = 100 - reusedPct;

  // BOM Table handlers
  const handleUpdateBOMPrice = (id: string, price: string) => {
    setBomItems((prev) => prev.map((item) => (item.id === id ? { ...item, price } : item)));
  };

  const handleUpdateBOMName = (id: string, name: string) => {
    setBomItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleToggleBOMCondition = (id: string) => {
    setBomItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, condition: item.condition === 'New' ? 'Reused' : 'New' }
          : item
      )
    );
  };

  const handleAddBOMRow = () => {
    const newId = `bom-${Date.now()}`;
    setBomItems((prev) => [...prev, { id: newId, name: 'New Component', price: '', condition: 'New' }]);
  };

  const handleDeleteBOMRow = (id: string) => {
    setBomItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Limitations handlers
  const handleUpdateLimitationField = (
    id: string,
    field: 'nextStep' | 'helpNeeded' | 'status',
    value: string
  ) => {
    setLimitations((prev) =>
      prev.map((lim) => (lim.id === id ? { ...lim, [field]: value } : lim))
    );
  };

  const handleAddLimitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimitationTitle.trim()) return;
    const newItem: LimitationItem = {
      id: `lim-${Date.now()}`,
      title: newLimitationTitle.trim(),
      status: newLimitationStatus,
      nextStep: '',
      helpNeeded: '',
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
            <SourceBadge source="SIMULATED" size="sm" />
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

      {/* 2. Main Two-Column Section: Printable Sustainability Facts Label (Left) + Cards (Right) */}
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

            {/* Avoided Energy & Carbon Section */}
            <div className="border-b-4 border-ink py-2.5 space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider block">
                    Energy Avoided (Estimate)
                  </span>
                  <SourceBadge source="SIMULATED" size="sm" />
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  {areAllInputsFilled ? (
                    <>
                      <span className="text-[26px] font-black leading-none font-mono text-accent">
                        {annualKwhSaved} kWh
                      </span>
                      <span className="text-[11px] font-mono text-muted">/ year</span>
                    </>
                  ) : (
                    <span className="text-[16px] font-mono font-bold text-muted">
                      No values entered
                    </span>
                  )}
                </div>
                {areAllInputsFilled && (
                  <span className="text-[10px] font-mono text-muted block mt-0.5">
                    Formula: ({numRatedWatts}W × {numHours}h × {numDays}d) ÷ 1,000 = {annualKwhSaved} kWh
                  </span>
                )}
                <span className="text-[10px] font-mono text-muted italic block">
                  Demo values. Replace with pilot data.
                </span>
              </div>

              <div className="pt-2 border-t border-hairline">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider block">
                    CO₂ Reduction (Estimate)
                  </span>
                  <SourceBadge source="SIMULATED" size="sm" />
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  {areAllInputsFilled ? (
                    <>
                      <span className="text-[26px] font-black leading-none font-mono text-status-green">
                        {annualCo2Kg} kg
                      </span>
                      <span className="text-[11px] font-mono text-muted">CO₂ / year</span>
                    </>
                  ) : (
                    <span className="text-[16px] font-mono font-bold text-muted">
                      No values entered
                    </span>
                  )}
                </div>
                {areAllInputsFilled && (
                  <span className="text-[10px] font-mono text-muted block mt-0.5">
                    Formula: {annualKwhSaved} kWh × {numEmissionFactor} kg/kWh = {annualCo2Kg} kg CO₂
                  </span>
                )}
                <span className="text-[10px] font-mono text-muted italic block">
                  Demo values. Replace with pilot data.
                </span>
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
                    {hasAnyBOMPrice ? `₹${totalBOMInr.toLocaleString('en-IN')}` : 'No values entered'}
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
                {bomItems.map((part) => (
                  <div key={part.id} className="flex justify-between items-center py-0.5">
                    <span className="truncate pr-2">{part.name}</span>
                    <span className="font-bold shrink-0">
                      {part.price.trim() !== '' ? `₹${part.price}` : '--'}{' '}
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
                <span className="font-mono">{reusedPct}% Reused / {newPct}% New</span>
              </div>

              {/* Composition Bar */}
              <div className="h-3.5 w-full rounded-[2px] bg-surface-2 border border-ink flex overflow-hidden">
                <div style={{ width: `${reusedPct}%` }} className="bg-accent h-full" title={`${reusedPct}% Reused`} />
                <div style={{ width: `${newPct}%` }} className="bg-ink h-full" title={`${newPct}% New`} />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-muted pt-0.5">
                <span>■ Reused: {reusedCount} item(s)</span>
                <span>■ New: {totalItemsCount - reusedCount} item(s)</span>
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

        {/* Right Column (7 cols): Impact Test Card + BOM Card + Limitations Board */}
        <div className="lg:col-span-7 w-full space-y-8">
          {/* Card A: Impact Test Card (Sustainability Calculator) */}
          <Card className="border border-hairline">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-accent" />
                  <CardTitle className="text-[20px]">Impact Test & Validation</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    Interactive Formula Mode
                  </span>
                  <SourceBadge source="SIMULATED" size="sm" />
                </div>
              </div>
              <CardDescription>
                Compute energy and carbon reductions from visible inputs and assumptions. All outputs are labeled as Estimates until real pilot data exists.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-[13px]">
              {/* Inputs Grid: 5 Visible Inputs (All start empty) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-[10px] bg-surface-2 border border-hairline">
                {/* 1. Rated Watts */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-muted block truncate font-semibold">
                      Rated Watts (W)
                    </label>
                    <select
                      value={ratedWattsTag}
                      onChange={(e) => setRatedWattsTag(e.target.value as InputTag)}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-accent"
                    >
                      <option value="MEASURED">MEASURED</option>
                      <option value="FROM LABEL">FROM LABEL</option>
                      <option value="ASSUMED">ASSUMED</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    value={ratedWatts}
                    onChange={(e) => setRatedWatts(e.target.value)}
                    placeholder="Enter rated watts..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Empty room load</span>
                </div>

                {/* 2. Hours Empty / Day */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-muted block truncate font-semibold">
                      Hours Empty / Day
                    </label>
                    <select
                      value={dailyHoursTag}
                      onChange={(e) => setDailyHoursTag(e.target.value as InputTag)}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-accent"
                    >
                      <option value="MEASURED">MEASURED</option>
                      <option value="FROM LABEL">FROM LABEL</option>
                      <option value="ASSUMED">ASSUMED</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    placeholder="Enter vacant hours..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Empty with load on</span>
                </div>

                {/* 3. Academic Days / Year */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-muted block truncate font-semibold">
                      Days / Year
                    </label>
                    <select
                      value={workingDaysTag}
                      onChange={(e) => setWorkingDaysTag(e.target.value as InputTag)}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-accent"
                    >
                      <option value="MEASURED">MEASURED</option>
                      <option value="FROM LABEL">FROM LABEL</option>
                      <option value="ASSUMED">ASSUMED</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    placeholder="Enter academic days..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Academic days/yr</span>
                </div>

                {/* 4. Grid Factor (kg CO2/kWh) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-muted block truncate font-semibold">
                      Grid Factor (kg/kWh)
                    </label>
                    <select
                      value={gridEmissionFactorTag}
                      onChange={(e) => setGridEmissionFactorTag(e.target.value as InputTag)}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-accent"
                    >
                      <option value="MEASURED">MEASURED</option>
                      <option value="FROM LABEL">FROM LABEL</option>
                      <option value="ASSUMED">ASSUMED</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={gridEmissionFactor}
                    onChange={(e) => setGridEmissionFactor(e.target.value)}
                    placeholder="Enter emission factor..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Grid emission factor</span>
                </div>

                {/* 5. Tariff (INR/kWh) */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-muted block truncate font-semibold">
                      Tariff (INR/kWh)
                    </label>
                    <select
                      value={tariffTag}
                      onChange={(e) => setTariffTag(e.target.value as InputTag)}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-accent"
                    >
                      <option value="MEASURED">MEASURED</option>
                      <option value="FROM LABEL">FROM LABEL</option>
                      <option value="ASSUMED">ASSUMED</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={tariff}
                    onChange={(e) => setTariff(e.target.value)}
                    placeholder="Enter tariff (₹/kWh)..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-ink font-mono font-bold text-[14px] focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted block">Electricity tariff</span>
                </div>
              </div>

              {/* Savings Calculation Display */}
              {!areAllInputsFilled ? (
                <div className="p-6 rounded-[8px] border border-dashed border-hairline bg-surface-2 text-center space-y-1.5">
                  <HelpCircle className="w-6 h-6 text-muted mx-auto" />
                  <h4 className="font-bold text-ink text-[15px]">
                    No values entered
                  </h4>
                  <p className="text-[12px] text-muted max-w-md mx-auto leading-relaxed">
                    Provide rated watts, vacant hours, days, grid emission factor, and tariff above to calculate estimates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Notice banner */}
                  <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted">Data provenance:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">Demo values. Replace with pilot data.</span>
                      <SourceBadge source="SIMULATED" size="sm" />
                    </div>
                  </div>

                  {/* Results grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Counter 1: Energy Avoided (Estimate) */}
                    <div className="p-3.5 rounded-[8px] bg-surface border border-hairline space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold text-muted block">
                          Energy Avoided (Estimate)
                        </span>
                        <SourceBadge source="SIMULATED" size="sm" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[22px] font-bold text-accent">
                          {annualKwhSaved}
                        </span>
                        <span className="font-mono text-[13px] text-muted">kWh / year</span>
                      </div>
                      <div className="p-2 rounded bg-surface-2 border border-hairline text-[11px] font-mono text-muted">
                        <span className="text-ink font-semibold block">Formula:</span>
                        <span>(Rated Watts × Hours × Days) ÷ 1,000</span>
                        <div className="text-[10px] text-accent mt-0.5 truncate">
                          ({numRatedWatts} W × {numHours} h × {numDays} d) ÷ 1,000 = {annualKwhSaved} kWh
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted block">
                        Daily avoided: {dailyKwhSaved} kWh/day
                      </span>
                      <span className="text-[10px] font-mono text-muted italic block">
                        Demo values. Replace with pilot data.
                      </span>
                    </div>

                    {/* Counter 2: CO2 Reduction (Estimate) */}
                    <div className="p-3.5 rounded-[8px] bg-surface border border-hairline space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold text-muted block">
                          CO₂ Reduction (Estimate)
                        </span>
                        <SourceBadge source="SIMULATED" size="sm" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[22px] font-bold text-status-green">
                          {annualCo2Kg}
                        </span>
                        <span className="font-mono text-[13px] text-muted">kg CO₂ / year</span>
                      </div>
                      <div className="p-2 rounded bg-surface-2 border border-hairline text-[11px] font-mono text-muted">
                        <span className="text-ink font-semibold block">Formula:</span>
                        <span>Energy Avoided × Grid Emission Factor</span>
                        <div className="text-[10px] text-status-green mt-0.5 truncate">
                          {annualKwhSaved} kWh × {numEmissionFactor} kg/kWh = {annualCo2Kg} kg CO₂
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted italic block">
                        Demo values. Replace with pilot data.
                      </span>
                    </div>

                    {/* Counter 3: Tariff Savings (Estimate) */}
                    <div className="p-3.5 rounded-[8px] bg-surface border border-hairline space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold text-muted block">
                          Tariff Savings (Estimate)
                        </span>
                        <SourceBadge source="SIMULATED" size="sm" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[22px] font-bold text-ink">
                          ₹{annualInrSaved?.toLocaleString('en-IN')}
                        </span>
                        <span className="font-mono text-[13px] text-muted">/ year</span>
                      </div>
                      <div className="p-2 rounded bg-surface-2 border border-hairline text-[11px] font-mono text-muted">
                        <span className="text-ink font-semibold block">Formula:</span>
                        <span>Energy Avoided × Tariff</span>
                        <div className="text-[10px] text-ink mt-0.5 truncate">
                          {annualKwhSaved} kWh × ₹{numTariff}/kWh = ₹{annualInrSaved?.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted italic block">
                        Demo values. Replace with pilot data.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card B: Bill of Materials (Editable Table) */}
          <Card className="border border-hairline">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  <CardTitle className="text-[20px]">Bill of Materials (BOM)</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <SourceBadge source="SIMULATED" size="sm" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddBOMRow}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="print:hidden"
                  >
                    Add Component
                  </Button>
                </div>
              </div>
              <CardDescription>
                Editable bill of materials. Prices start blank. Specify components, condition (New / Reused), and unit costs.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] font-mono">
                  <thead>
                    <tr className="border-b border-hairline text-muted uppercase text-[11px]">
                      <th className="pb-2 font-semibold">Component</th>
                      <th className="pb-2 font-semibold">Condition</th>
                      <th className="pb-2 font-semibold">Price (INR)</th>
                      <th className="pb-2 font-semibold text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {bomItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateBOMName(item.id, e.target.value)}
                            className="w-full p-1.5 rounded-[4px] bg-surface border border-hairline text-ink font-medium focus:outline-none focus:border-accent"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <button
                            type="button"
                            onClick={() => handleToggleBOMCondition(item.id)}
                            className={`px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                              item.condition === 'Reused'
                                ? 'bg-accent-soft text-accent border-accent/30'
                                : 'bg-surface-2 text-ink border-hairline'
                            }`}
                          >
                            {item.condition}
                          </button>
                        </td>
                        <td className="py-2 pr-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-muted text-[12px]">₹</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateBOMPrice(item.id, e.target.value)}
                              placeholder="Enter price..."
                              className="w-full pl-6 pr-2 py-1.5 rounded-[4px] bg-surface border border-hairline text-ink font-bold tabular-nums focus:outline-none focus:border-accent"
                            />
                          </div>
                        </td>
                        <td className="py-2 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteBOMRow(item.id)}
                            className="p-1 rounded text-muted hover:text-status-red hover:bg-surface transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-hairline text-[13px] font-mono">
                <span className="font-semibold text-muted">Total Hardware Cost (BOM):</span>
                <span className="font-bold text-ink text-[16px]">
                  {hasAnyBOMPrice ? `₹${totalBOMInr.toLocaleString('en-IN')}` : 'No values entered'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card C: "What doesn't work yet" Board */}
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
                  Add Item
                </Button>
              </div>
              <CardDescription>
                Full scientific integrity disclosure: verified prototype limitations and pending integration boundaries.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
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
                    placeholder="Limitation title..."
                    className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-[13px] text-ink focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={newLimitationStatus}
                      onChange={(e) => setNewLimitationStatus(e.target.value as any)}
                      className="p-1.5 rounded-[4px] bg-surface border border-hairline text-[11px] font-mono text-ink"
                    >
                      <option value="Not tested yet">Not tested yet</option>
                      <option value="Simulated values">Simulated values</option>
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

              {/* Limitations List with editable Next step and Help needed fields */}
              <div className="divide-y divide-hairline">
                {limitations.map((lim) => {
                  const tagStyles = {
                    'Not tested yet': 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
                    'Simulated values': 'bg-accent-soft text-accent border-accent/30',
                    'Not built': 'bg-status-red-soft text-status-red border-status-red/30',
                  }[lim.status];

                  return (
                    <div key={lim.id} className="py-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink text-[14px]">
                          {lim.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-[4px] border font-mono text-[10.5px] font-bold uppercase shrink-0 ${tagStyles}`}>
                          {lim.status}
                        </span>
                      </div>

                      {/* Editable Next Step and Help Needed fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[12px] font-mono">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-muted block font-semibold">
                            Next step:
                          </label>
                          <input
                            type="text"
                            value={lim.nextStep}
                            onChange={(e) => handleUpdateLimitationField(lim.id, 'nextStep', e.target.value)}
                            placeholder="Enter next step..."
                            className="w-full p-1.5 rounded-[4px] bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-accent text-[11.5px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-muted block font-semibold">
                            Help needed:
                          </label>
                          <input
                            type="text"
                            value={lim.helpNeeded}
                            onChange={(e) => handleUpdateLimitationField(lim.id, 'helpNeeded', e.target.value)}
                            placeholder="Enter help needed..."
                            className="w-full p-1.5 rounded-[4px] bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-accent text-[11.5px]"
                          />
                        </div>
                      </div>
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
