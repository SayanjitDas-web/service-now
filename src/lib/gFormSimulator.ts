import { User } from './types';

export interface FormFieldState {
  value: any;
  mandatory: boolean;
  visible: boolean;
  readOnly: boolean;
}

export interface FormSandboxResult {
  fields: Record<string, FormFieldState>;
  infoMessages: string[];
  errorMessages: string[];
  preventSubmit?: boolean;
}

export function createGForm(
  initialFields: Record<string, any>,
  schemaRules: Record<string, { mandatory?: boolean; readOnly?: boolean }>,
  currentUser: User,
  onStateUpdate?: (updates: Partial<Record<string, FormFieldState>>) => void
) {
  const fieldStates: Record<string, FormFieldState> = {};
  const infoMessages: string[] = [];
  const errorMessages: string[] = [];

  // Initialize states
  for (const [key, val] of Object.entries(initialFields)) {
    fieldStates[key] = {
      value: val ?? '',
      mandatory: schemaRules[key]?.mandatory ?? false,
      visible: true,
      readOnly: schemaRules[key]?.readOnly ?? false,
    };
  }

  const g_form = {
    getValue: (field: string) => {
      return fieldStates[field] ? String(fieldStates[field].value ?? '') : '';
    },
    setValue: (field: string, val: any) => {
      if (fieldStates[field]) {
        fieldStates[field].value = val;
        if (onStateUpdate) {
          onStateUpdate({ [field]: { ...fieldStates[field], value: val } });
        }
      }
    },
    setMandatory: (field: string, isMandatory: boolean) => {
      if (fieldStates[field]) {
        fieldStates[field].mandatory = isMandatory;
        if (onStateUpdate) {
          onStateUpdate({ [field]: { ...fieldStates[field], mandatory: isMandatory } });
        }
      }
    },
    isMandatory: (field: string) => {
      return fieldStates[field]?.mandatory ?? false;
    },
    setVisible: (field: string, isVisible: boolean) => {
      if (fieldStates[field]) {
        fieldStates[field].visible = isVisible;
        if (onStateUpdate) {
          onStateUpdate({ [field]: { ...fieldStates[field], visible: isVisible } });
        }
      }
    },
    setReadOnly: (field: string, isReadOnly: boolean) => {
      if (fieldStates[field]) {
        fieldStates[field].readOnly = isReadOnly;
        if (onStateUpdate) {
          onStateUpdate({ [field]: { ...fieldStates[field], readOnly: isReadOnly } });
        }
      }
    },
    addInfoMessage: (msg: string) => {
      infoMessages.push(msg);
    },
    addErrorMessage: (msg: string) => {
      errorMessages.push(msg);
    },
    clearMessages: () => {
      infoMessages.length = 0;
      errorMessages.length = 0;
    },
  };

  const g_user = {
    userName: currentUser.user_name,
    userID: currentUser.sys_id,
    firstName: currentUser.name.split(' ')[0],
    lastName: currentUser.name.split(' ').slice(1).join(' '),
    hasRole: (role: string) => currentUser.roles.includes(role as any),
    hasRoles: () => currentUser.roles.length > 0,
  };

  return {
    g_form,
    g_user,
    fieldStates,
    infoMessages,
    errorMessages,
  };
}

export function executeClientScript(
  type: 'onLoad' | 'onChange' | 'onSubmit',
  scriptContent: string,
  g_form: any,
  g_user: any,
  params?: { control?: string; oldValue?: any; newValue?: any; isLoading?: boolean }
): { success: boolean; error?: string } {
  try {
    if (type === 'onLoad') {
      const runner = new Function('g_form', 'g_user', `${scriptContent}\n if (typeof onLoad === 'function') { onLoad(); }`);
      runner(g_form, g_user);
    } else if (type === 'onChange') {
      const { control = '', oldValue = '', newValue = '', isLoading = false } = params || {};
      const runner = new Function(
        'g_form',
        'g_user',
        'control',
        'oldValue',
        'newValue',
        'isLoading',
        `${scriptContent}\n if (typeof onChange === 'function') { onChange(control, oldValue, newValue, isLoading); }`
      );
      runner(g_form, g_user, control, oldValue, newValue, isLoading);
    } else if (type === 'onSubmit') {
      const runner = new Function('g_form', 'g_user', `${scriptContent}\n if (typeof onSubmit === 'function') { return onSubmit(); } return true;`);
      const result = runner(g_form, g_user);
      if (result === false) {
        return { success: false, error: 'Submission prevented by client script onSubmit return false.' };
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error('Client script error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
