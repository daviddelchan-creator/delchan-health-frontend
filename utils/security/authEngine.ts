export interface PermissionNode {
  [key: string]: boolean | { submodules: Record<string, any> } | any;
}

export interface UserAccessMatrix {
  modules: {
    [moduleId: string]: {
      enabled: boolean;
      submodules: {
        [submoduleId: string]: {
          enabled: boolean;
          functions: { [functionId: string]: boolean };
          components: { [componentId: string]: boolean };
        };
      };
    };
  };
}

// Master Definition of Global Base Roles (Fallback Profiles)
export const MasterRoleProfiles: Record<string, UserAccessMatrix> = {
  "Administrator": {
    modules: {
      clinical_chart: { enabled: true, submodules: { general: { enabled: true, functions: { edit: true, delete: true }, components: {} } } },
      billing: { enabled: true, submodules: { general: { enabled: true, functions: { manage: true }, components: {} } } }
    }
  },
  "Podiatrist": {
    modules: {
      clinical_chart: {
        enabled: true,
        submodules: {
          podiatry_notes: {
            enabled: true,
            functions: { create_record: true, edit_record: true, delete_record: false },
            components: { vascular_panel: true, dermatological_panel: true }
          }
        }
      }
    }
  },
  "Nutritionist": {
    modules: {
      clinical_chart: {
        enabled: true,
        submodules: {
          nutrition_assessment: {
            enabled: true,
            functions: { create_record: true, edit_record: true, delete_record: false },
            components: { anthropometry_panel: true, protein_calculator: true }
          }
        }
      }
    }
  }
};

/**
 * Resolves permissions in real-time by merging the Base Role Profile with Individual Personal Overrides
 */
export function hasAccess(
  roleName: string,
  overridesJson: string | undefined,
  path: { module: string; submodule?: string; function?: string; component?: string }
): boolean {
  // 1. Resolve Base Profile Group
  const baseProfile = MasterRoleProfiles[roleName];
  if (!baseProfile) return false;

  // 2. Parse User-Specific Personal Overrides
  let overrides: Partial<UserAccessMatrix> = {};
  if (overridesJson) {
    try {
      overrides = JSON.parse(overridesJson);
    } catch (e) {
      console.error("Critical error parsing user-specific individual overrides JSON string", e);
    }
  }

  // Helper utility to safely extract boolean values from nested authorization objects
  const getNestedValue = (obj: any, keys: string[]): boolean | undefined => {
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return typeof current === 'boolean' ? current : undefined;
  };

  const keysToEvaluate = ['modules', path.module];
  if (path.submodule) {
    keysToEvaluate.push('submodules', path.submodule);
    if (path.function) keysToEvaluate.push('functions', path.function);
    else if (path.component) keysToEvaluate.push('components', path.component);
  } else {
    keysToEvaluate.push('enabled');
  }

  // 3. Evaluation Hierarchy: Individual Personal Overrides strictly supersede the Base Profile Role
  const overrideVal = getNestedValue(overrides, keysToEvaluate);
  if (overrideVal !== undefined) return overrideVal;

  const baseVal = getNestedValue(baseProfile, keysToEvaluate);
  return baseVal ?? false;
}
