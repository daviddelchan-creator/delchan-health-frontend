import { Observation } from '@medplum/fhirtypes';

function parseDate(dateString?: string): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

// Single helper to retrieve proper date strings specifically for Observations
export function getObservationDate(obs: Observation): { dStr: string, dateObj: Date | null } {
  const dateString = obs.effectiveDateTime || obs.effectivePeriod?.start || obs.issued;
  const safeStr = dateString || 'Data não informada';
  return { dStr: safeStr, dateObj: parseDate(dateString) };
}

export function getObservationTitle(obs: Observation): string {
  if (obs.code?.text) {
    return obs.code.text;
  }
  if (obs.code?.coding && obs.code.coding.length > 0) {
    const display = obs.code.coding[0].display;
    if (display) return display;
    const code = obs.code.coding[0].code;
    if (code) return `Medição (${code})`;
  }
  return 'Observação';
}

export function formatObservationValue(obs: Observation): string {
  // Simple valueQuantity
  if (obs.valueQuantity) {
    const val = obs.valueQuantity.value;
    const unit = obs.valueQuantity.unit || '';
    if (val !== undefined) {
      return `${val} ${unit}`.trim();
    }
  }

  // ValueString
  if (obs.valueString) {
    return obs.valueString;
  }

  // Component (like blood pressure systolic/diastolic)
  if (obs.component && obs.component.length > 0) {
    const syst = obs.component.find(c => c.code?.coding?.[0]?.code === '8480-6' || c.code?.text?.toLowerCase().includes('systolic'));
    const dias = obs.component.find(c => c.code?.coding?.[0]?.code === '8462-4' || c.code?.text?.toLowerCase().includes('diastolic'));

    if (syst?.valueQuantity?.value !== undefined && dias?.valueQuantity?.value !== undefined) {
        const unit = syst.valueQuantity.unit || dias.valueQuantity.unit;
        if (unit) {
            return `${syst.valueQuantity.value}/${dias.valueQuantity.value} ${unit}`;
        } else {
            return `${syst.valueQuantity.value}/${dias.valueQuantity.value}`;
        }
    } else {
        const componentsText = obs.component.map(c => {
            if (c.valueQuantity) {
                return c.valueQuantity.unit ? `${c.valueQuantity.value} ${c.valueQuantity.unit}` : `${c.valueQuantity.value}`;
            } else if (c.valueString) {
                return c.valueString;
            }
            return null;
        }).filter(Boolean).join(', ');

        if (componentsText) {
            return componentsText;
        }
    }
  }

  return 'Sem valor registrado';
}

export function getObservationProvenance(obs: Observation): string {
  let source = 'Registro Clínico';

  // Only consider Health Connect if the explicit extension exists
  const originExt = obs.extension?.find(e => e.url === 'http://delchan.site/health-connect-origin');
  if (originExt) {
    return 'Health Connect';
  }

  if (obs.meta?.source) {
    source = obs.meta.source;
  }

  return source;
}
