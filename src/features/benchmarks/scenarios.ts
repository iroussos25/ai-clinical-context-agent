import { BenchmarkTestScenario } from "./types";

export const BENCHMARK_SCENARIOS: BenchmarkTestScenario[] = [
  {
    id: "sepsis-1",
    name: "Sepsis with Elevated Lactate",
    description: "Challenge: Rapid assessment of critical sepsis presentation with biomarker findings",
    context: `72-year-old male admitted to ICU with fever (39.2°C), hypotension (MAP 58), tachycardia (118 bpm), and altered mental status. 
Labs: WBC 16.2 K/uL, Lactate 4.8 mmol/L (ref <2), PCR 28 mg/dL. Urinalysis shows leukocytes and nitrites. 
Chest X-ray pending. Patient on empiric broad-spectrum antibiotics (piperacillin-tazobactam) for just 2 hours.
Currently on norepinephrine 0.15 mcg/kg/min, MAP responding at 62 mmHg. Fluid resuscitation: 2L crystalloid given so far.
CVP 8 mmHg, mixed venous O2 sat 62%.`,
    question: "Summarize the key findings, assess the severity and trajectory of this patient's sepsis, and recommend immediate next steps in management based on sepsis bundle guidelines.",
  },
  {
    id: "ards-1",
    name: "ARDS with Severe Hypoxemia",
    description: "Challenge: Multi-factorial respiratory failure requiring ventilator optimization",
    context: `54-year-old female, day 5 post-Op abdominal surgery (small bowel resection), now with progressive dyspnea and PaO2/FiO2 ratio declining.
Current vent settings: AC/VC, VT 450 mL, RR 16, PEEP 8, FiO2 80%. 
ABG: pH 7.28, PCO2 52, PaO2 68, HCO3 24. CXR shows bilateral infiltrates, predominantly lower lobes.
Labs: WBC 14.2, Lactate 2.1, Procalcitonin 1.8 ng/mL. Plateau pressure 28 cmH2O.
No fever, hemodynamically stable on low-dose vasopressor. Extubation attempt yesterday failed.
Lung compliance suspects pneumonia secondary to aspiration risk.`,
    question: "Evaluate the ARDS presentation, interpret current ventilatory parameters, and suggest evidence-based adjustments to optimize oxygenation and minimize ventilator-induced injury.",
  },
  {
    id: "aki-1",
    name: "Acute Kidney Injury Post-Sepsis",
    description: "Challenge: Complex AKI management with multiple competing priorities",
    context: `66-year-old male, day 3 of sepsis recovery, now AKI Stage 3. 
Baseline creatinine 1.0, current creatinine 4.2 (4.2x increase). Urine output 120 mL/24h (oliguric).
BUN 68, K 6.1 (elevated), PO4 5.8 (elevated), Metabolic acidosis pH 7.12.
Urine sodium 8 mEq/L, Urine osmolality 580 mOsm/kg. FENa <0.1% suggests prerenal pattern but worsening despite adequate fluid resuscitation.
Previous MI 3 years ago (ejection fraction 40%), now on minimal vasopressor. Medications: ACE inhibitor (held), contrast dye given yesterday for imaging.
Urine sediment shows muddy brown casts.`,
    question: "Assess the etiology of this AKI, evaluate readiness for renal replacement therapy, and outline management including fluid strategy and expected timeline for recovery.",
  },
  {
    id: "cardiogenic-1",
    name: "Cardiogenic Shock Post-MI",
    description: "Challenge: Hemodynamic optimization with limited cardiac reserve",
    context: `61-year-old male, STEMI 18 hours post-primary PCI with stent to LAD. 
Complains of persistent chest discomfort. Echo shows anterior wall hypokinesis, EF 28%, moderate MR.
Hemodynamics: SBP 92, MAP 68, HR 108, CVP 18 cmHg, PCWP 24 mmHg, CI 1.8 L/min/m2 (low).
On mechanical support: IABP, dopamine 5 mcg/kg/min, dobutamine 7.5 mcg/kg/min. 
Urine output 0.3 mL/kg/h, Lactate 3.2 mmol/L. Chest X-ray shows mild pulmonary edema. Troponin peak 18 (ongoing necrosis).
No right-sided involvement on EKG. Troponin still rising, suggesting ongoing ischemia.`,
    question: "Evaluate the hemodynamic profile, consider need for escalation to ECMO, and outline a comprehensive inotropic/mechanical support strategy including endpoints for weaning.",
  },
  {
    id: "delirium-1",
    name: "Post-Operative Delirium with Complications",
    description: "Challenge: Multifactorial delirium requiring systematic workup and management",
    context: `78-year-old female, post-op day 2 (hip replacement). 
Acutely confused, agitated, psychomotor restless type delirium (CAM-ICU positive). Baseline cognitive function: independent, played bridge twice weekly.
Medications: oxycodone PRN (has gotten it 4x since surgery), diphenhydramine PRN × 2 doses, propofol sedation 50 mcg/kg/min just weaned.
Vitals: T 38.1°C, HR 102, RR 22, SpO2 91% on 2L NC. Labs: sodium 128 (low), BUN 32, Cr 1.4 (baseline 0.9).
UA with LE/Nitrites suggests UTI. No recent medications added. Placement on surgical floor (high noise). Pain score 7/10 despite analgesia.
MSO4 still on board but at lower dose. Catheter in place since surgery. Blood cultures pending (fever spike 4 hours ago).`,
    question: "Identify potential reversible contributors to delirium, prioritize investigations and interventions, and propose a management plan that balances sedation, analgesia, and cognitive recovery.",
  },
];
