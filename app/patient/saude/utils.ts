import { Observation } from '@medplum/fhirtypes';

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
    const values = obs.component.map(comp => {
      if (comp.valueQuantity?.value !== undefined) {
        return comp.valueQuantity.value;
      }
      return '?';
    });
    const unit = obs.component[0]?.valueQuantity?.unit || '';
    return `${values.join('/')} ${unit}`.trim();
  }

  return 'Sem valor registrado';
}

export function getObservationProvenance(obs: Observation): string {
  let source = 'Registro Clínico';

  if (obs.meta?.source) {
    if (obs.meta.source === 'health_connect') {
      source = 'Health Connect';
    } else {
      source = obs.meta.source;
    }
  }

  // Check for the extension mentioned in HealthConnectService.ts
  const originExt = obs.meta?.extension?.find(e => e.url === 'http://delchan.site/health-connect-origin');
  if (originExt && originExt.valueString) {
    source += ` (${originExt.valueString})`;
  }

  return source;
}
