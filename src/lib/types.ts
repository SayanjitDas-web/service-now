export type Role = 'admin' | 'itil' | 'security_admin' | 'approver' | 'end_user';

export interface User {
  sys_id: string;
  user_name: string;
  name: string;
  email: string;
  roles: Role[];
  avatar?: string;
  title: string;
  department: string;
  phone?: string;
  location?: string;
}

export interface Group {
  sys_id: string;
  name: string;
  description: string;
  manager_id?: string;
  email?: string;
}

export interface ConfigurationItem {
  sys_id: string;
  name: string;
  class_name: string; // e.g. cmdb_ci_server, cmdb_ci_database, cmdb_ci_app
  asset_tag: string;
  status: 'In Service' | 'Maintenance' | 'Retired' | 'In Stock';
  ip_address?: string;
  assigned_to?: string;
}

export type IncidentState = '1' | '2' | '3' | '6' | '7' | '8';
// 1 = New, 2 = In Progress, 3 = On Hold, 6 = Resolved, 7 = Closed, 8 = Canceled

export interface Incident {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: IncidentState;
  hold_reason?: 'Awaiting Caller' | 'Awaiting Evidence' | 'Awaiting Vendor' | 'Awaiting Change';
  caller_id: string; // user sys_id
  category: 'Software' | 'Hardware' | 'Network' | 'Database' | 'Inquiry';
  subcategory?: string;
  impact: '1' | '2' | '3'; // 1-High, 2-Medium, 3-Low
  urgency: '1' | '2' | '3'; // 1-High, 2-Medium, 3-Low
  priority: '1' | '2' | '3' | '4' | '5'; // 1-Critical, 2-High, 3-Moderate, 4-Low, 5-Planning
  assignment_group?: string; // group sys_id
  assigned_to?: string; // user sys_id
  cmdb_ci?: string; // configuration item sys_id
  close_code?: 'Solved (Work Around)' | 'Solved (Permanently)' | 'Closed/Resolved by Caller' | 'Not Solved';
  close_notes?: string;
  work_notes?: string;
  comments?: string;
  parent_incident?: string;
  problem_id?: string;
  change_request_id?: string;
  sys_created_on: string;
  sys_updated_on: string;
  sys_created_by: string;
  resolved_at?: string;
  resolved_by?: string;
  closed_at?: string;
}

export interface Problem {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: '1' | '2' | '3' | '4'; // 1-New, 2-Assess, 3-Work in Progress, 4-Resolved
  priority: '1' | '2' | '3' | '4';
  impact: '1' | '2' | '3';
  urgency: '1' | '2' | '3';
  assigned_to?: string;
  assignment_group?: string;
  root_cause?: string;
  workaround?: string;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface ChangeRequest {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  type: 'Normal' | 'Standard' | 'Emergency';
  state: 'Draft' | 'Assess' | 'Authorize' | 'Scheduled' | 'Implement' | 'Review' | 'Closed';
  risk: 'High' | 'Moderate' | 'Low';
  priority: '1' | '2' | '3' | '4';
  impact: '1' | '2' | '3';
  urgency: '1' | '2' | '3';
  assigned_to?: string;
  assignment_group?: string;
  start_date?: string;
  end_date?: string;
  justification?: string;
  implementation_plan?: string;
  rollback_plan?: string;
  test_plan?: string;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface CatalogItem {
  sys_id: string;
  name: string;
  short_description: string;
  description: string;
  category: 'Hardware' | 'Software' | 'Services' | 'Access';
  price: number;
  icon: string;
  estimated_delivery_days: number;
  variables: CatalogVariable[];
}

export interface CatalogVariable {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'choice' | 'boolean' | 'reference';
  reference_table?: string;
  choices?: { label: string; value: string }[];
  mandatory?: boolean;
  default_value?: string;
}

export interface ServiceRequest {
  sys_id: string;
  number: string; // REQ0010001
  ritm_number: string; // RITM0010001
  sctask_number: string; // SCTASK0010001
  catalog_item_id: string;
  catalog_item_name: string;
  requested_for: string;
  requested_by: string;
  assigned_to?: string;
  assignment_group?: string;
  short_description?: string;
  description?: string;
  stage: 'Waiting for Approval' | 'Fulfillment' | 'Delivery' | 'Completed' | 'Closed Incomplete';
  state: '1' | '2' | '3' | '4';
  price: number;
  variable_responses: Record<string, any>;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface KnowledgeArticle {
  sys_id: string;
  number: string; // KB0010001
  short_description: string;
  text: string;
  category: 'IT' | 'Security' | 'HR' | 'Troubleshooting';
  author: string;
  views: number;
  rating: number;
  sys_created_on: string;
}

export interface ColumnDefinition {
  name: string;
  label: string;
  type: 'string' | 'integer' | 'boolean' | 'choice' | 'reference' | 'datetime' | 'journal';
  reference_table?: string;
  mandatory?: boolean;
  read_only?: boolean;
  max_length?: number;
  choices?: { label: string; value: string }[];
  default_value?: string;
}

export interface TableDefinition {
  sys_id: string;
  name: string; // e.g. 'incident' or 'u_cloud_inventory'
  label: string; // e.g. 'Incident' or 'Cloud Inventory'
  super_class?: string; // e.g. 'task'
  is_custom: boolean;
  columns: ColumnDefinition[];
  sys_created_on: string;
}

export interface ClientScript {
  sys_id: string;
  name: string;
  table: string;
  type: 'onLoad' | 'onChange' | 'onSubmit';
  field_name?: string; // for onChange
  ui_type: 'Desktop' | 'Mobile / Service Portal' | 'All';
  active: boolean;
  description: string;
  script: string;
}

export interface BusinessRule {
  sys_id: string;
  name: string;
  table: string;
  when: 'before' | 'after' | 'async' | 'display';
  operation: {
    insert: boolean;
    update: boolean;
    delete: boolean;
  };
  filter_field?: string;
  filter_operator?: string;
  filter_value?: string;
  active: boolean;
  description: string;
  script: string;
}

export interface FlowAction {
  id: string;
  type: 'ask_approval' | 'create_task' | 'send_email' | 'update_record' | 'log_message';
  label: string;
  config: Record<string, any>;
}

export interface FlowDefinition {
  sys_id: string;
  name: string;
  trigger_table: string;
  trigger_condition: string;
  active: boolean;
  description: string;
  actions: FlowAction[];
  execution_history: {
    id: string;
    timestamp: string;
    status: 'Success' | 'Failed' | 'Running';
    log: string[];
  }[];
}

export interface UpdateSet {
  sys_id: string;
  name: string;
  state: 'in_progress' | 'complete' | 'ignore';
  application: string;
  created_by: string;
  sys_created_on: string;
  changes_count: number;
  changes: {
    sys_id: string;
    type: 'Table' | 'Field' | 'Client Script' | 'Business Rule' | 'Catalog Item' | 'Flow';
    target_name: string;
    action: 'Insert' | 'Update' | 'Delete';
    timestamp: string;
  }[];
}

export interface ActivityLog {
  sys_id: string;
  table_name: string;
  record_id: string;
  user_name: string;
  user_id: string;
  type: 'work_notes' | 'comments' | 'field_change';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  text?: string;
  created_at: string;
}

export interface Attachment {
  sys_id: string;
  table_name: string;
  table_sys_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  url: string;
  imagekit_file_id?: string;
  created_by: string;
  created_at: string;
}

export interface FilterCondition {
  field: string;
  operator: 'is' | 'is_not' | 'contains' | 'not_contains' | 'starts_with' | 'greater_than' | 'less_than' | 'is_empty';
  value: string;
}

export interface PracticeScenario {
  id: string;
  title: string;
  category: 'CSA (System Admin)' | 'CAD (Application Dev)' | 'ITSM Implementation';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  instructions: string[];
  verificationCriteria: string;
  verify: (state: any) => { success: boolean; message: string };
  hint: string;
}
