import { Incident, Problem, ChangeRequest, User } from './types';

export interface GlideRecordExecutionResult {
  logs: string[];
  output: string;
  executionTimeMs: number;
  recordsAffected: number;
  success: boolean;
  error?: string;
}

export function executeBackgroundScript(
  script: string,
  platformData: {
    incidents: Incident[];
    problems: Problem[];
    changes: ChangeRequest[];
    users: User[];
    currentUser: User;
    updateIncidents: (data: Incident[]) => void;
  }
): GlideRecordExecutionResult {
  const startTime = performance.now();
  const logsList: string[] = [];
  let recordsAffected = 0;

  // Clone datasets so modifications can be inspected/applied
  let incidentCopies = JSON.parse(JSON.stringify(platformData.incidents)) as Incident[];
  const problemCopies = JSON.parse(JSON.stringify(platformData.problems)) as Problem[];
  const changeCopies = JSON.parse(JSON.stringify(platformData.changes)) as ChangeRequest[];
  const userCopies = JSON.parse(JSON.stringify(platformData.users)) as User[];

  // GlideSystem (gs) emulator
  const gs = {
    print: (...args: any[]) => {
      logsList.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    log: (...args: any[]) => {
      logsList.push('[LOG] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    info: (...args: any[]) => {
      logsList.push('[INFO] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    error: (...args: any[]) => {
      logsList.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    addInfoMessage: (msg: string) => {
      logsList.push('ℹ️ Info Message: ' + msg);
    },
    addErrorMessage: (msg: string) => {
      logsList.push('❌ Error Message: ' + msg);
    },
    getUserID: () => platformData.currentUser.sys_id,
    getUserName: () => platformData.currentUser.user_name,
    getUser: () => ({
      getName: () => platformData.currentUser.name,
      getUserName: () => platformData.currentUser.user_name,
      getEmail: () => platformData.currentUser.email,
      hasRole: (role: string) => platformData.currentUser.roles.includes(role as any),
    }),
    nowDateTime: () => new Date().toISOString().replace('T', ' ').substring(0, 19),
    beginningOfToday: () => new Date().toISOString().substring(0, 10) + ' 00:00:00',
    nil: (val: any) => val === undefined || val === null || val === '',
  };

  // GlideRecord Class Emulator
  class GlideRecord {
    tableName: string;
    private conditions: { field: string; op: string; val: any }[] = [];
    private matchedRows: any[] = [];
    private currentIndex: number = -1;
    private rowLimit: number = 500;
    private sortField?: string;
    private sortDesc: boolean = false;

    // Current row fields mapped directly onto this object
    [key: string]: any;

    constructor(table: string) {
      this.tableName = table;
    }

    addQuery(field: string, opOrVal?: any, val?: any) {
      if (val !== undefined) {
        this.conditions.push({ field, op: String(opOrVal), val });
      } else {
        this.conditions.push({ field, op: '=', val: opOrVal });
      }
    }

    addActiveQuery() {
      this.addQuery('active', true);
    }

    orderBy(field: string) {
      this.sortField = field;
      this.sortDesc = false;
    }

    orderByDesc(field: string) {
      this.sortField = field;
      this.sortDesc = true;
    }

    setLimit(n: number) {
      this.rowLimit = n;
    }

    private getSourceData(): any[] {
      switch (this.tableName) {
        case 'incident':
          return incidentCopies;
        case 'problem':
          return problemCopies;
        case 'change_request':
          return changeCopies;
        case 'sys_user':
          return userCopies;
        default:
          return [];
      }
    }

    query() {
      const data = this.getSourceData();
      this.matchedRows = data.filter((row) => {
        for (const cond of this.conditions) {
          const rowVal = row[cond.field];
          if (cond.op === '=') {
            if (String(rowVal) !== String(cond.val)) return false;
          } else if (cond.op === '!=') {
            if (String(rowVal) === String(cond.val)) return false;
          } else if (cond.op === 'CONTAINS') {
            if (!String(rowVal || '').toLowerCase().includes(String(cond.val).toLowerCase())) return false;
          } else if (cond.op === 'STARTSWITH') {
            if (!String(rowVal || '').toLowerCase().startsWith(String(cond.val).toLowerCase())) return false;
          } else if (cond.op === '>') {
            if (rowVal <= cond.val) return false;
          } else if (cond.op === '<') {
            if (rowVal >= cond.val) return false;
          }
        }
        return true;
      });

      if (this.sortField) {
        const sf = this.sortField;
        const desc = this.sortDesc;
        this.matchedRows.sort((a, b) => {
          if (a[sf] < b[sf]) return desc ? 1 : -1;
          if (a[sf] > b[sf]) return desc ? -1 : 1;
          return 0;
        });
      }

      if (this.matchedRows.length > this.rowLimit) {
        this.matchedRows = this.matchedRows.slice(0, this.rowLimit);
      }

      this.currentIndex = -1;
    }

    next(): boolean {
      this.currentIndex++;
      if (this.currentIndex < this.matchedRows.length) {
        const cur = this.matchedRows[this.currentIndex];
        Object.assign(this, cur);
        return true;
      }
      return false;
    }

    get(idOrField: string, value?: string): boolean {
      const data = this.getSourceData();
      let match: any;
      if (value !== undefined) {
        match = data.find((r) => r[idOrField] === value);
      } else {
        match = data.find((r) => r.sys_id === idOrField || r.number === idOrField);
      }
      if (match) {
        this.matchedRows = [match];
        this.currentIndex = 0;
        Object.assign(this, match);
        return true;
      }
      return false;
    }

    getValue(field: string) {
      return this[field];
    }

    setValue(field: string, val: any) {
      this[field] = val;
    }

    getRowCount(): number {
      return this.matchedRows.length;
    }

    update(): string {
      if (this.currentIndex >= 0 && this.matchedRows[this.currentIndex]) {
        const target = this.matchedRows[this.currentIndex];
        Object.assign(target, this);
        target.sys_updated_on = gs.nowDateTime();
        recordsAffected++;
        return target.sys_id;
      }
      return '';
    }

    insert(): string {
      const newSysId = 'rec_' + Math.random().toString(36).substring(2, 10);
      const newRec: any = {
        sys_id: newSysId,
        sys_created_on: gs.nowDateTime(),
        sys_updated_on: gs.nowDateTime(),
        sys_created_by: gs.getUserName(),
      };
      for (const key of Object.keys(this)) {
        if (!['tableName', 'conditions', 'matchedRows', 'currentIndex', 'rowLimit', 'sortField', 'sortDesc'].includes(key)) {
          newRec[key] = this[key];
        }
      }
      if (this.tableName === 'incident') {
        const count = incidentCopies.length + 1;
        newRec.number = newRec.number || `INC00${10000 + count}`;
        incidentCopies.unshift(newRec as Incident);
      }
      recordsAffected++;
      return newSysId;
    }

    deleteRecord(): boolean {
      if (this.currentIndex >= 0 && this.matchedRows[this.currentIndex]) {
        const sysId = this.matchedRows[this.currentIndex].sys_id;
        if (this.tableName === 'incident') {
          incidentCopies = incidentCopies.filter((i) => i.sys_id !== sysId);
        }
        recordsAffected++;
        return true;
      }
      return false;
    }
  }

  try {
    // Execute script safely within function scope
    const runner = new Function('GlideRecord', 'gs', script);
    runner(GlideRecord, gs);

    // If records were modified, update store
    if (recordsAffected > 0) {
      platformData.updateIncidents(incidentCopies);
    }

    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      logs: logsList,
      output: logsList.join('\n'),
      executionTimeMs: duration,
      recordsAffected,
      success: true,
    };
  } catch (err: any) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      logs: logsList,
      output: logsList.join('\n'),
      executionTimeMs: duration,
      recordsAffected,
      success: false,
      error: err?.message || String(err),
    };
  }
}
