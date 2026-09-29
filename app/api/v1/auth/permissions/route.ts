import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

// Interfaz para estructurar el camino del objeto
interface OverrideRule {
  path: string;
  value: boolean;
}

// Función real que fusiona el Perfil Base con las Excepciones de la Persona
function resolvePermissions(baseProfile: any, individualOverrides: OverrideRule[]): any {
  // Clonamos profundamente el perfil base para no mutar los datos maestros
  const resolved = JSON.parse(JSON.stringify(baseProfile));

  if (!individualOverrides || !Array.isArray(individualOverrides)) return resolved;

  // Aplicamos la cascada sobre las rutas específicas indicadas en el override
  individualOverrides.forEach((rule) => {
    const keys = rule.path.split('.');
    let current = resolved;

    // Navegamos por el JSON dinámicamente hasta el penúltimo nivel
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}; // Auto-vivification for safety
      }
      current = current[keys[i]];
    }

    // Aplicamos la sobrescritura real en el último nodo (Boolean)
    const lastKey = keys[keys.length - 1];
    if (current) {
      current[lastKey] = rule.value;
    }
  });

  return resolved;
}

// Mapeo por defecto del sistema
const DEFAULT_SYSTEM_PROFILE = {
  modules: {
    CRM: {
      visible: true,
      submodules: {
        patient_registry: {
          visible: true,
          functions: {
            create_patient: true,
            read_clinical_notes: false,
            read_existence_only: true
          },
          components: {
            btn_delete_patient: false,
            alert_pending_signatures: true,
            qr_folder_scanner: true
          }
        },
        scheduling: {
          visible: true,
          functions: {
            book_appointment: true,
            cancel_appointment: false
          }
        }
      }
    },
    Billing: {
      visible: true,
      submodules: {
        cash_register: {
          visible: true,
          functions: {
            open_drawer: true,
            process_pix_payment: true,
            apply_discounts: false
          }
        }
      }
    },
    Telefonia: {
      visible: false,
      submodules: {
        gestao: { visible: false },
        hotdesking: { visible: false },
        seguranca: { visible: false }
      }
    }
  }
};

export async function GET(req: Request) {
  try {
    const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/' });

    // Authenticate client if secrets are present (ideally we should use the user's token here via headers)
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      medplum.setAccessToken(authHeader.replace('Bearer ', ''));
    } else if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET);
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await medplum.readProfile();
    let overrides: OverrideRule[] = [];

    // Check for custom extension 'individual_permission_overrides'
    if (profile.extension) {
      const overrideExt = profile.extension.find((e: any) => e.url === 'https://delchan.com/fhir/StructureDefinition/individual_permission_overrides');
      if (overrideExt && overrideExt.valueString) {
        try {
          const parsed = JSON.parse(overrideExt.valueString);
          if (parsed && parsed.overrides) {
            overrides = parsed.overrides;
          }
        } catch (e) {
            // Ignore parse errors, fallback to empty overrides
        }
      }
    }

    const resolvedPermissions = resolvePermissions(DEFAULT_SYSTEM_PROFILE, overrides);

    const responsePayload = {
      practitionerId: profile.id,
      name: profile.name?.[0]?.text || "Unknown",
      identityFederation: {
        provider: "medplum",
        email: profile.telecom?.find((t: any) => t.system === 'email')?.value || "",
        groups: []
      },
      accessStructure: {
        profileGroup: {
          id: "grp_default",
          name: "Standard Users"
        },
        baseProfile: {
          id: "role_standard",
          name: "Standard Role"
        }
      },
      resolvedPermissions,
      meta: {
        evaluationTimestamp: new Date().toISOString(),
        authFactorUsed: "Medplum_Token"
      }
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
