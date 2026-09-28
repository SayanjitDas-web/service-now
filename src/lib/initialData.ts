import {
  User,
  Group,
  ConfigurationItem,
  Incident,
  Problem,
  ChangeRequest,
  CatalogItem,
  ServiceRequest,
  KnowledgeArticle,
  TableDefinition,
  ClientScript,
  BusinessRule,
  FlowDefinition,
  UpdateSet,
  ActivityLog,
} from './types';

export const INITIAL_USERS: User[] = [
  {
    sys_id: 'usr_admin',
    user_name: 'admin',
    name: 'System Administrator',
    email: 'admin@service-now.simulator',
    roles: ['admin', 'security_admin', 'itil'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Lead ServiceNow Platform Architect',
    department: 'Enterprise IT Architecture',
    phone: '+1 (408) 555-0100',
    location: 'Santa Clara HQ - Bldg 1',
  },
  {
    sys_id: 'usr_beth',
    user_name: 'beth.anglin',
    name: 'Beth Anglin',
    email: 'beth.anglin@service-now.simulator',
    roles: ['itil'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Service Desk Lead Manager',
    department: 'IT Service Management',
    phone: '+1 (408) 555-0124',
    location: 'San Diego Campus',
  },
  {
    sys_id: 'usr_david',
    user_name: 'david.loo',
    name: 'David Loo',
    email: 'david.loo@service-now.simulator',
    roles: ['itil', 'approver'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Change Advisory Board (CAB) Chair',
    department: 'Infrastructure Operations',
    phone: '+1 (408) 555-0138',
    location: 'Santa Clara HQ - Bldg 2',
  },
  {
    sys_id: 'usr_fred',
    user_name: 'fred.luddy',
    name: 'Fred Luddy',
    email: 'fred.luddy@service-now.simulator',
    roles: ['admin', 'itil'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'Distinguished Engineer & Platform Founder',
    department: 'Core Platform Engineering',
    phone: '+1 (408) 555-0199',
    location: 'San Diego Campus',
  },
  {
    sys_id: 'usr_abel',
    user_name: 'abel.tuter',
    name: 'Abel Tuter',
    email: 'abel.tuter@service-now.simulator',
    roles: ['end_user'],
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Financial Analyst',
    department: 'Corporate Finance',
    phone: '+1 (408) 555-0155',
    location: 'New York Financial Center',
  },
  {
    sys_id: 'usr_itil',
    user_name: 'itil.user',
    name: 'ITIL Support Technician',
    email: 'itil.user@service-now.simulator',
    roles: ['itil'],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    title: 'Tier 2 Incident Responder',
    department: 'Global Service Desk',
    phone: '+1 (408) 555-0162',
    location: 'London Operations Hub',
  },
];

export const INITIAL_GROUPS: Group[] = [
  {
    sys_id: 'grp_servicedesk',
    name: 'Service Desk',
    description: 'Tier 1 and Tier 2 incoming support triage and first-contact resolution.',
    manager_id: 'usr_beth',
    email: 'servicedesk@service-now.simulator',
  },
  {
    sys_id: 'grp_network',
    name: 'Network Engineering',
    description: 'Routing, switching, corporate WAN/LAN, SD-WAN, and edge VPN infrastructure.',
    manager_id: 'usr_david',
    email: 'network-ops@service-now.simulator',
  },
  {
    sys_id: 'grp_database',
    name: 'Database Administrators',
    description: 'Relational and NoSQL clusters, replication, backups, and query performance.',
    manager_id: 'usr_admin',
    email: 'dba-team@service-now.simulator',
  },
  {
    sys_id: 'grp_hardware',
    name: 'Hardware & Asset Support',
    description: 'Workstation provisioning, peripheral deployment, and hardware lifecycle.',
    manager_id: 'usr_beth',
    email: 'hardware-assets@service-now.simulator',
  },
  {
    sys_id: 'grp_software',
    name: 'Software Applications',
    description: 'Enterprise ERP, CRM, development IDEs, and desktop productivity software.',
    manager_id: 'usr_fred',
    email: 'software-apps@service-now.simulator',
  },
];

export const INITIAL_CIS: ConfigurationItem[] = [
  {
    sys_id: 'ci_1',
    name: 'nyc-prd-db01.corp',
    class_name: 'cmdb_ci_database',
    asset_tag: 'AST-DB-9021',
    status: 'In Service',
    ip_address: '10.240.12.8',
    assigned_to: 'usr_admin',
  },
  {
    sys_id: 'ci_2',
    name: 'corp-mail-exch01.corp',
    class_name: 'cmdb_ci_server',
    asset_tag: 'AST-SRV-4412',
    status: 'In Service',
    ip_address: '10.240.10.45',
    assigned_to: 'usr_david',
  },
  {
    sys_id: 'ci_3',
    name: 'sap-prod-app01.corp',
    class_name: 'cmdb_ci_app',
    asset_tag: 'AST-APP-7734',
    status: 'Maintenance',
    ip_address: '10.240.30.99',
    assigned_to: 'usr_fred',
  },
  {
    sys_id: 'ci_4',
    name: 'cisco-core-sw01.nyc',
    class_name: 'cmdb_ci_network',
    asset_tag: 'AST-NET-1109',
    status: 'In Service',
    ip_address: '10.240.1.1',
    assigned_to: 'usr_david',
  },
  {
    sys_id: 'ci_5',
    name: 'vpn-gw-external.corp',
    class_name: 'cmdb_ci_network',
    asset_tag: 'AST-SEC-3329',
    status: 'In Service',
    ip_address: '198.51.100.25',
    assigned_to: 'usr_david',
  },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    sys_id: 'inc_1001',
    number: 'INC0010001',
    short_description: 'Outlook 365 crashing repeatedly on launch after Windows KB5034441 update',
    description: 'Multiple users across the Finance department report that Outlook immediately crashes with fault code 0xc0000005 right after the latest Tuesday update patch. Webmail is functional as workaround.',
    state: '2', // In Progress
    caller_id: 'usr_abel',
    category: 'Software',
    subcategory: 'Email & Messaging',
    impact: '2',
    urgency: '2',
    priority: '3', // Moderate
    assignment_group: 'grp_software',
    assigned_to: 'usr_beth',
    cmdb_ci: 'ci_2',
    work_notes: 'Inspected event logs on Abel\'s workstation. Appears to be an add-in conflict with Zoom Outlook plugin v5.14. Reinstalling add-in solves the crash.',
    comments: 'Hi Abel, we have identified the root issue with the Zoom add-in. Pushing an automated fix via InTune in 15 minutes.',
    sys_created_on: '2026-09-24 09:15:30',
    sys_updated_on: '2026-09-25 11:20:12',
    sys_created_by: 'abel.tuter',
  },
  {
    sys_id: 'inc_1002',
    number: 'INC0010002',
    short_description: 'Critical: Enterprise VPN Gateway completely unreachable for European EMEA workforce',
    description: 'European employees cannot connect to any internal resources or ERP systems through vpn-gw-external.corp. Connection attempts time out at phase 2 IKE negotiation.',
    state: '1', // New
    caller_id: 'usr_itil',
    category: 'Network',
    subcategory: 'VPN Access',
    impact: '1', // High
    urgency: '1', // High
    priority: '1', // Critical
    assignment_group: 'grp_network',
    assigned_to: 'usr_david',
    cmdb_ci: 'ci_5',
    work_notes: 'High priority incident auto-escalated. Incident Commander David Loo paged on PagerDuty.',
    sys_created_on: '2026-09-25 08:00:15',
    sys_updated_on: '2026-09-25 08:05:00',
    sys_created_by: 'itil.user',
  },
  {
    sys_id: 'inc_1003',
    number: 'INC0010003',
    short_description: 'Database query latency exceeding 6500ms on SAP Production cluster',
    description: 'End users experiencing lockups during quarter-end financial batch jobs. Disk I/O wait on nyc-prd-db01 is at 98%.',
    state: '2', // In Progress
    caller_id: 'usr_admin',
    category: 'Database',
    subcategory: 'Performance Degradation',
    impact: '1',
    urgency: '2',
    priority: '2', // High
    assignment_group: 'grp_database',
    assigned_to: 'usr_admin',
    cmdb_ci: 'ci_1',
    work_notes: 'Ran query execution analysis. An unindexed query in the ledger reconciliation module is table-scanning 140 million rows. Applying temporary hint.',
    sys_created_on: '2026-09-24 14:32:10',
    sys_updated_on: '2026-09-25 10:14:40',
    sys_created_by: 'admin',
  },
  {
    sys_id: 'inc_1004',
    number: 'INC0010004',
    short_description: 'Employee payroll direct deposit portal returning HTTP 502 Bad Gateway',
    description: 'Payroll submission deadline is tomorrow at 5 PM. Several employees cannot submit updated direct deposit forms.',
    state: '3', // On Hold
    hold_reason: 'Awaiting Vendor',
    caller_id: 'usr_abel',
    category: 'Software',
    subcategory: 'Web Portal',
    impact: '2',
    urgency: '1',
    priority: '2',
    assignment_group: 'grp_software',
    assigned_to: 'usr_fred',
    cmdb_ci: 'ci_3',
    work_notes: 'Third party cloud SaaS provider Workday has acknowledged an API gateway degradation on their US-East cluster. Ticket opened with Vendor ref: #WD-99412.',
    sys_created_on: '2026-09-24 16:10:00',
    sys_updated_on: '2026-09-25 09:30:15',
    sys_created_by: 'abel.tuter',
  },
  {
    sys_id: 'inc_1005',
    number: 'INC0010005',
    short_description: 'Damaged HDMI cable and faulty display adapter in Executive Boardroom 4A',
    description: 'HDMI cable connector pins are bent. The primary 85-inch display flickers green when connected to laptops.',
    state: '6', // Resolved
    caller_id: 'usr_david',
    category: 'Hardware',
    subcategory: 'AV Equipment',
    impact: '3',
    urgency: '3',
    priority: '4', // Low
    assignment_group: 'grp_hardware',
    assigned_to: 'usr_beth',
    close_code: 'Solved (Permanently)',
    close_notes: 'Replaced braided 4K HDMI cable and tested with MacBook Pro and Windows Dell laptop. Signal clean.',
    resolved_at: '2026-09-23 15:45:00',
    resolved_by: 'usr_beth',
    sys_created_on: '2026-09-23 11:20:00',
    sys_updated_on: '2026-09-23 15:45:00',
    sys_created_by: 'david.loo',
  },
  {
    sys_id: 'inc_1006',
    number: 'INC0010006',
    short_description: 'Zoom Room audio feedback and echo during town hall meetings',
    description: 'Conference room microphone array picking up audio from rear speakers.',
    state: '7', // Closed
    caller_id: 'usr_admin',
    category: 'Hardware',
    subcategory: 'AV Equipment',
    impact: '3',
    urgency: '3',
    priority: '4',
    assignment_group: 'grp_hardware',
    assigned_to: 'usr_beth',
    close_code: 'Solved (Permanently)',
    close_notes: 'Recalibrated DSP acoustic echo cancellation profile.',
    resolved_at: '2026-09-20 17:00:00',
    resolved_by: 'usr_beth',
    closed_at: '2026-09-21 17:00:00',
    sys_created_on: '2026-09-20 10:00:00',
    sys_updated_on: '2026-09-21 17:00:00',
    sys_created_by: 'admin',
  },
  {
    sys_id: 'inc_1007',
    number: 'INC0010007',
    short_description: 'WiFi access point dropping 5GHz connections intermittently on 3rd floor west',
    description: 'Engineers on the 3rd floor experience 10-second disconnections every 30 minutes.',
    state: '2',
    caller_id: 'usr_fred',
    category: 'Network',
    subcategory: 'Wireless',
    impact: '2',
    urgency: '3',
    priority: '3',
    assignment_group: 'grp_network',
    assigned_to: 'usr_david',
    cmdb_ci: 'ci_4',
    work_notes: 'Inspected Cisco Catalyst wireless controller logs. DFS radar detection was triggering channel shifts on channel 100. Pinned to channel 36 non-DFS.',
    sys_created_on: '2026-09-24 11:00:00',
    sys_updated_on: '2026-09-25 12:00:00',
    sys_created_by: 'fred.luddy',
  },
  {
    sys_id: 'inc_1008',
    number: 'INC0010008',
    short_description: 'Security alert: Automated brute force SSH attempts detected on perimeter bastion host',
    description: 'Over 14,000 failed authentication attempts detected from IP range 198.51.100.0/24 in 1 hour.',
    state: '2',
    caller_id: 'usr_admin',
    category: 'Software',
    subcategory: 'Security Incident',
    impact: '1',
    urgency: '2',
    priority: '2',
    assignment_group: 'grp_network',
    assigned_to: 'usr_admin',
    cmdb_ci: 'ci_5',
    work_notes: 'Fail2ban activated. Subnet blocked at upstream Palo Alto firewall. Investigating honeypot logs.',
    sys_created_on: '2026-09-25 04:12:00',
    sys_updated_on: '2026-09-25 09:00:00',
    sys_created_by: 'admin',
  },
];

export const INITIAL_PROBLEMS: Problem[] = [
  {
    sys_id: 'prb_101',
    number: 'PRB000101',
    short_description: 'Recurring Exchange Server memory leak under heavy TLS 1.3 connection pools',
    description: 'Server service worker process fails to deallocate buffer pools, requiring bi-weekly service restarts.',
    state: '3', // Work in Progress
    priority: '2',
    impact: '2',
    urgency: '2',
    assigned_to: 'usr_david',
    assignment_group: 'grp_software',
    root_cause: 'Known Microsoft Exchange CU14 bug with HTTP/2 and TLS 1.3 socket recycling.',
    workaround: 'Automated IIS worker pool recycling scheduled daily at 03:00 UTC.',
    sys_created_on: '2026-09-18 10:00:00',
    sys_updated_on: '2026-09-24 14:00:00',
  },
  {
    sys_id: 'prb_102',
    number: 'PRB000102',
    short_description: 'Cisco switch ASIC buffer overflow causing spontaneous Spanning Tree topology recalculations',
    description: 'Micro-burst traffic causes queue packet drops on core switch interlinks.',
    state: '2', // Assess
    priority: '1',
    impact: '1',
    urgency: '2',
    assigned_to: 'usr_david',
    assignment_group: 'grp_network',
    root_cause: 'Bug in Cisco IOS-XE 17.6.3 QoS dynamic queue threshold allocation.',
    workaround: 'Reallocated static queue memory thresholds via console template.',
    sys_created_on: '2026-09-22 09:30:00',
    sys_updated_on: '2026-09-25 08:30:00',
  },
];

export const INITIAL_CHANGES: ChangeRequest[] = [
  {
    sys_id: 'chg_1001',
    number: 'CHG0030001',
    short_description: 'Emergency security patch deployment for OpenSSL vulnerability on Bastion Hosts',
    description: 'Apply vendor hotfix CVE-2026-38291 to all internet-facing SSH bastion machines.',
    type: 'Emergency',
    state: 'Implement',
    risk: 'Moderate',
    priority: '1',
    impact: '1',
    urgency: '1',
    assigned_to: 'usr_admin',
    assignment_group: 'grp_network',
    start_date: '2026-09-25 18:00:00',
    end_date: '2026-09-25 20:00:00',
    justification: 'Zero-day vulnerability actively exploited in the wild.',
    implementation_plan: '1. Drain connections from node A. 2. Apply RPM patch. 3. Verify daemon. 4. Repeat for node B.',
    rollback_plan: 'Restore LVM snapshot taken immediately prior to patching.',
    test_plan: 'Verify SSH handshake and public key authentication from external test client.',
    sys_created_on: '2026-09-25 07:00:00',
    sys_updated_on: '2026-09-25 12:00:00',
  },
  {
    sys_id: 'chg_1002',
    number: 'CHG0030002',
    short_description: 'Upgrade Oracle Database Server Memory from 128GB to 256GB RAM',
    description: 'Physical server maintenance to double SGA buffer cache for SAP end-of-year close.',
    type: 'Normal',
    state: 'Scheduled',
    risk: 'Moderate',
    priority: '2',
    impact: '2',
    urgency: '2',
    assigned_to: 'usr_admin',
    assignment_group: 'grp_database',
    start_date: '2026-09-27 01:00:00',
    end_date: '2026-09-27 04:00:00',
    justification: 'Prevent recurring memory exhaustion during database batch jobs.',
    implementation_plan: 'Failover cluster to secondary, shutdown primary node, insert 8x 16GB DDR5 DIMMs, boot and test.',
    rollback_plan: 'Remove new DIMMs and boot with previous memory configuration.',
    test_plan: 'Execute memtest86, boot OS, verify Oracle instance mounts and all tablespaces online.',
    sys_created_on: '2026-09-22 14:00:00',
    sys_updated_on: '2026-09-24 16:30:00',
  },
];

export const INITIAL_CATALOG_ITEMS: CatalogItem[] = [
  {
    sys_id: 'cat_macbook',
    name: 'Standard Developer Workstation (MacBook Pro 16")',
    short_description: 'Apple M3 Max, 64GB Unified RAM, 1TB SSD with Retina XDR Display',
    description: 'Recommended standard for all Software Engineering and Platform Developer personnel. Pre-imaged with enterprise security tools, Docker, and developer toolchain.',
    category: 'Hardware',
    price: 3499.00,
    icon: 'Laptop',
    estimated_delivery_days: 3,
    variables: [
      {
        id: 'var_ram',
        name: 'memory_configuration',
        label: 'Unified Memory',
        type: 'choice',
        choices: [
          { label: '48 GB Unified Memory', value: '48gb' },
          { label: '64 GB Unified Memory (Standard)', value: '64gb' },
          { label: '128 GB Unified Memory (High Performance)', value: '128gb' },
        ],
        mandatory: true,
        default_value: '64gb',
      },
      {
        id: 'var_storage',
        name: 'storage_configuration',
        label: 'Internal Storage',
        type: 'choice',
        choices: [
          { label: '1 TB SSD Storage', value: '1tb' },
          { label: '2 TB SSD Storage', value: '2tb' },
          { label: '4 TB SSD Storage', value: '4tb' },
        ],
        mandatory: true,
        default_value: '1tb',
      },
      {
        id: 'var_justification',
        name: 'business_justification',
        label: 'Business Justification',
        type: 'string',
        mandatory: true,
        default_value: 'Replacing outdated laptop for development work.',
      },
    ],
  },
  {
    sys_id: 'cat_jetbrains',
    name: 'JetBrains All Products Pack License',
    short_description: 'Full suite including IntelliJ IDEA Ultimate, WebStorm, PyCharm, and DataGrip',
    description: '1-year enterprise floating license subscription for JetBrains development tools.',
    category: 'Software',
    price: 499.00,
    icon: 'Code2',
    estimated_delivery_days: 1,
    variables: [
      {
        id: 'var_ide_reason',
        name: 'primary_language',
        label: 'Primary Development Language',
        type: 'choice',
        choices: [
          { label: 'Java / Kotlin', value: 'java' },
          { label: 'TypeScript / React / Node.js', value: 'typescript' },
          { label: 'Python / AI / ML', value: 'python' },
          { label: 'Full Stack Polyglot', value: 'polyglot' },
        ],
        mandatory: true,
        default_value: 'typescript',
      },
      {
        id: 'var_github_handle',
        name: 'github_username',
        label: 'Corporate GitHub Username',
        type: 'string',
        mandatory: true,
      },
    ],
  },
  {
    sys_id: 'cat_cloud_sandbox',
    name: 'AWS / Azure Isolated Developer Sandbox',
    short_description: 'Dedicated cloud sandbox account with $500 monthly budget ceiling',
    description: 'Provision an ephemeral, secure cloud sandbox linked to corporate Single Sign-On with GuardDuty and automated cost alerts.',
    category: 'Access',
    price: 0.00,
    icon: 'Cloud',
    estimated_delivery_days: 1,
    variables: [
      {
        id: 'var_cloud_provider',
        name: 'provider',
        label: 'Cloud Provider',
        type: 'choice',
        choices: [
          { label: 'Amazon Web Services (AWS)', value: 'aws' },
          { label: 'Microsoft Azure', value: 'azure' },
          { label: 'Google Cloud Platform (GCP)', value: 'gcp' },
        ],
        mandatory: true,
        default_value: 'aws',
      },
      {
        id: 'var_project_name',
        name: 'project_name',
        label: 'Project or Initiative Name',
        type: 'string',
        mandatory: true,
      },
    ],
  },
  {
    sys_id: 'cat_mfa_reset',
    name: 'Reset Multi-Factor Authentication (MFA Token)',
    short_description: 'Reset lost, broken, or newly replaced authenticator phone registration',
    description: 'Immediate automated reset of your Okta / Duo MFA profile with secondary manager verification.',
    category: 'Access',
    price: 0.00,
    icon: 'KeyRound',
    estimated_delivery_days: 0,
    variables: [
      {
        id: 'var_mfa_reason',
        name: 'reset_reason',
        label: 'Reason for MFA Reset',
        type: 'choice',
        choices: [
          { label: 'New Mobile Phone Device', value: 'new_device' },
          { label: 'Phone Lost / Stolen', value: 'lost_stolen' },
          { label: 'Authenticator App Glitched / Reinstalled', value: 'app_glitch' },
        ],
        mandatory: true,
        default_value: 'new_device',
      },
    ],
  },
];

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    sys_id: 'req_1001',
    number: 'REQ0010001',
    ritm_number: 'RITM0010001',
    sctask_number: 'SCTASK0010001',
    catalog_item_id: 'cat_macbook',
    catalog_item_name: 'Standard Developer Workstation (MacBook Pro 16")',
    requested_for: 'usr_abel',
    requested_by: 'usr_admin',
    stage: 'Fulfillment',
    state: '2',
    price: 3499.00,
    variable_responses: {
      memory_configuration: '64gb',
      storage_configuration: '1tb',
      business_justification: 'New hire onboarding package for Senior Financial Analyst.',
    },
    sys_created_on: '2026-09-24 10:00:00',
    sys_updated_on: '2026-09-25 11:30:00',
  },
];

export const INITIAL_KNOWLEDGE: KnowledgeArticle[] = [
  {
    sys_id: 'kb_1001',
    number: 'KB0010001',
    short_description: 'How to connect to GlobalProtect Corporate VPN on Windows 11 and macOS Sequoia',
    text: 'To connect to the corporate network securely from home or remote locations:\n1. Open GlobalProtect from your system tray or menu bar.\n2. Portal address: vpn-gw-external.corp\n3. Click Connect and authenticate with your corporate SSO credentials.\n4. Complete the Okta Verify MFA push on your phone.\n\nTroubleshooting: If you experience timeout error code 1002, flush your DNS cache (ipconfig /flushdns) and retry.',
    category: 'IT',
    author: 'Beth Anglin',
    views: 1420,
    rating: 4.8,
    sys_created_on: '2026-08-10 12:00:00',
  },
  {
    sys_id: 'kb_1002',
    number: 'KB0010002',
    short_description: 'Fixing Outlook OST profile corruption and rebuilding local mailbox cache',
    text: 'If Microsoft Outlook freezes on "Loading Profile..." or closes with crash code 0xc0000005:\n1. Close Outlook completely via Task Manager.\n2. Press Win + R, type: "outlook.exe /safe" and press Enter.\n3. If Outlook starts in safe mode, navigate to File > Options > Add-ins and disable third-party plugins.\n4. To rebuild the cache: Rename %localappdata%\\Microsoft\\Outlook\\*.ost to *.ost.old and relaunch Outlook.',
    category: 'Troubleshooting',
    author: 'Beth Anglin',
    views: 890,
    rating: 4.9,
    sys_created_on: '2026-08-22 15:30:00',
  },
  {
    sys_id: 'kb_1003',
    number: 'KB0010003',
    short_description: 'Change Management: Standard vs Normal vs Emergency CAB submission guidelines',
    text: 'This policy document outlines criteria for change ticket creation:\n- Standard Changes: Pre-authorized, low risk, documented recurring procedures (e.g., quarterly cert rotation, routine patch updates).\n- Normal Changes: Requires CAB review and approval prior to scheduling window.\n- Emergency Changes: Unplanned critical fix required to restore Sev 1 outage or address critical zero-day security flaw. Requires ECAB approval.',
    category: 'Security',
    author: 'David Loo',
    views: 654,
    rating: 4.7,
    sys_created_on: '2026-09-01 09:00:00',
  },
];

export const INITIAL_TABLES: TableDefinition[] = [
  {
    sys_id: 'tbl_inc',
    name: 'incident',
    label: 'Incident',
    super_class: 'task',
    is_custom: false,
    sys_created_on: '2026-01-01 00:00:00',
    columns: [
      { name: 'number', label: 'Number', type: 'string', read_only: true },
      { name: 'short_description', label: 'Short description', type: 'string', mandatory: true, max_length: 160 },
      { name: 'description', label: 'Description', type: 'string', max_length: 4000 },
      {
        name: 'state',
        label: 'State',
        type: 'choice',
        mandatory: true,
        choices: [
          { label: 'New', value: '1' },
          { label: 'In Progress', value: '2' },
          { label: 'On Hold', value: '3' },
          { label: 'Resolved', value: '6' },
          { label: 'Closed', value: '7' },
          { label: 'Canceled', value: '8' },
        ],
      },
      { name: 'caller_id', label: 'Caller', type: 'reference', reference_table: 'sys_user', mandatory: true },
      {
        name: 'category',
        label: 'Category',
        type: 'choice',
        choices: [
          { label: 'Software', value: 'Software' },
          { label: 'Hardware', value: 'Hardware' },
          { label: 'Network', value: 'Network' },
          { label: 'Database', value: 'Database' },
          { label: 'Inquiry', value: 'Inquiry' },
        ],
      },
      {
        name: 'impact',
        label: 'Impact',
        type: 'choice',
        choices: [
          { label: '1 - High', value: '1' },
          { label: '2 - Medium', value: '2' },
          { label: '3 - Low', value: '3' },
        ],
      },
      {
        name: 'urgency',
        label: 'Urgency',
        type: 'choice',
        choices: [
          { label: '1 - High', value: '1' },
          { label: '2 - Medium', value: '2' },
          { label: '3 - Low', value: '3' },
        ],
      },
      {
        name: 'priority',
        label: 'Priority',
        type: 'choice',
        read_only: true,
        choices: [
          { label: '1 - Critical', value: '1' },
          { label: '2 - High', value: '2' },
          { label: '3 - Moderate', value: '3' },
          { label: '4 - Low', value: '4' },
          { label: '5 - Planning', value: '5' },
        ],
      },
      { name: 'assignment_group', label: 'Assignment group', type: 'reference', reference_table: 'sys_user_group' },
      { name: 'assigned_to', label: 'Assigned to', type: 'reference', reference_table: 'sys_user' },
      { name: 'cmdb_ci', label: 'Configuration item', type: 'reference', reference_table: 'cmdb_ci' },
      { name: 'work_notes', label: 'Work notes', type: 'journal' },
      { name: 'comments', label: 'Additional comments (Customer visible)', type: 'journal' },
      { name: 'close_notes', label: 'Resolution notes', type: 'string' },
    ],
  },
  {
    sys_id: 'tbl_prb',
    name: 'problem',
    label: 'Problem',
    super_class: 'task',
    is_custom: false,
    sys_created_on: '2026-01-01 00:00:00',
    columns: [
      { name: 'number', label: 'Number', type: 'string', read_only: true },
      { name: 'short_description', label: 'Short description', type: 'string', mandatory: true },
      { name: 'description', label: 'Description', type: 'string' },
      {
        name: 'state',
        label: 'State',
        type: 'choice',
        choices: [
          { label: 'New', value: '1' },
          { label: 'Assess', value: '2' },
          { label: 'Work in Progress', value: '3' },
          { label: 'Resolved', value: '4' },
        ],
      },
      { name: 'assigned_to', label: 'Assigned to', type: 'reference', reference_table: 'sys_user' },
      { name: 'root_cause', label: 'Root cause', type: 'string' },
      { name: 'workaround', label: 'Workaround', type: 'string' },
    ],
  },
  {
    sys_id: 'tbl_chg',
    name: 'change_request',
    label: 'Change Request',
    super_class: 'task',
    is_custom: false,
    sys_created_on: '2026-01-01 00:00:00',
    columns: [
      { name: 'number', label: 'Number', type: 'string', read_only: true },
      { name: 'short_description', label: 'Short description', type: 'string', mandatory: true },
      {
        name: 'type',
        label: 'Type',
        type: 'choice',
        choices: [
          { label: 'Normal', value: 'Normal' },
          { label: 'Standard', value: 'Standard' },
          { label: 'Emergency', value: 'Emergency' },
        ],
      },
      {
        name: 'state',
        label: 'State',
        type: 'choice',
        choices: [
          { label: 'Draft', value: 'Draft' },
          { label: 'Assess', value: 'Assess' },
          { label: 'Authorize', value: 'Authorize' },
          { label: 'Scheduled', value: 'Scheduled' },
          { label: 'Implement', value: 'Implement' },
          { label: 'Review', value: 'Review' },
          { label: 'Closed', value: 'Closed' },
        ],
      },
      { name: 'assigned_to', label: 'Assigned to', type: 'reference', reference_table: 'sys_user' },
      { name: 'justification', label: 'Justification', type: 'string' },
    ],
  },
  {
    sys_id: 'tbl_user',
    name: 'sys_user',
    label: 'User',
    is_custom: false,
    sys_created_on: '2026-01-01 00:00:00',
    columns: [
      { name: 'user_name', label: 'User ID', type: 'string', mandatory: true },
      { name: 'name', label: 'Name', type: 'string', mandatory: true },
      { name: 'email', label: 'Email', type: 'string' },
      { name: 'title', label: 'Title', type: 'string' },
      { name: 'department', label: 'Department', type: 'string' },
    ],
  },
  {
    sys_id: 'tbl_custom_asset',
    name: 'u_loaner_laptop',
    label: 'Loaner Laptop Registry',
    super_class: 'cmdb_ci',
    is_custom: true,
    sys_created_on: '2026-09-20 14:00:00',
    columns: [
      { name: 'u_asset_tag', label: 'Asset Tag', type: 'string', mandatory: true },
      { name: 'u_borrower', label: 'Borrower', type: 'reference', reference_table: 'sys_user', mandatory: true },
      { name: 'u_checkout_date', label: 'Checkout Date', type: 'datetime' },
      { name: 'u_expected_return', label: 'Expected Return', type: 'datetime' },
      {
        name: 'u_status',
        label: 'Loan Status',
        type: 'choice',
        choices: [
          { label: 'Checked Out', value: 'checked_out' },
          { label: 'Returned', value: 'returned' },
          { label: 'Overdue', value: 'overdue' },
        ],
      },
    ],
  },
];

export const INITIAL_CLIENT_SCRIPTS: ClientScript[] = [
  {
    sys_id: 'cs_1',
    name: 'Highlight P1 Critical Incidents',
    table: 'incident',
    type: 'onChange',
    field_name: 'priority',
    ui_type: 'All',
    active: true,
    description: 'Displays a critical banner and makes work notes mandatory when an incident is set to Priority 1.',
    script: `function onChange(control, oldValue, newValue, isLoading) {
  if (isLoading || newValue === '') {
    return;
  }
  
  if (newValue === '1') {
    g_form.addErrorMessage('⚠️ CRITICAL P1 INCIDENT: Major Incident protocols are active! Escalating to on-call manager.');
    g_form.setMandatory('work_notes', true);
  } else {
    g_form.clearMessages();
  }
}`,
  },
  {
    sys_id: 'cs_2',
    name: 'Require Resolution Notes on Resolve',
    table: 'incident',
    type: 'onChange',
    field_name: 'state',
    ui_type: 'All',
    active: true,
    description: 'Ensures resolution notes and close code cannot be skipped when moving ticket to Resolved.',
    script: `function onChange(control, oldValue, newValue, isLoading) {
  if (isLoading) return;

  // State 6 = Resolved
  if (newValue === '6') {
    g_form.setMandatory('close_notes', true);
    g_form.addInfoMessage('ℹ️ Please document the steps taken to resolve this incident in Resolution notes.');
  } else {
    g_form.setMandatory('close_notes', false);
  }
}`,
  },
  {
    sys_id: 'cs_3',
    name: 'Caller VIP Notice on Load',
    table: 'incident',
    type: 'onLoad',
    ui_type: 'All',
    active: true,
    description: 'Notifies the technician on form load if the caller holds an executive title.',
    script: `function onLoad() {
  var callerId = g_form.getValue('caller_id');
  if (callerId === 'usr_admin' || callerId === 'usr_fred') {
    g_form.addInfoMessage('⭐ VIP User: Caller is a platform executive. SLA threshold reduced by 50%.');
  }
}`,
  },
];

export const INITIAL_BUSINESS_RULES: BusinessRule[] = [
  {
    sys_id: 'br_1',
    name: 'Calculate Priority from Impact and Urgency',
    table: 'incident',
    when: 'before',
    operation: { insert: true, update: true, delete: false },
    active: true,
    description: 'Computes Priority (1 to 5) automatically based on standard ITIL Impact × Urgency matrix.',
    script: `(function executeRule(current, previous /*null when async*/) {
  var impact = parseInt(current.impact) || 3;
  var urgency = parseInt(current.urgency) || 3;
  
  // Standard ITIL Matrix:
  // Impact 1, Urgency 1 => P1
  // Impact 1, Urgency 2 or Impact 2, Urgency 1 => P2
  // Impact 2, Urgency 2 or Impact 1, Urgency 3 or Impact 3, Urgency 1 => P3
  // Impact 2, Urgency 3 or Impact 3, Urgency 2 => P4
  // Impact 3, Urgency 3 => P5
  
  var score = impact + urgency;
  if (impact === 1 && urgency === 1) {
    current.priority = '1';
  } else if (score === 3) {
    current.priority = '2';
  } else if (score === 4) {
    current.priority = '3';
  } else if (score === 5) {
    current.priority = '4';
  } else {
    current.priority = '5';
  }
  
  gs.addInfoMessage('Priority calculated as ' + current.priority);
})(current, previous);`,
  },
  {
    sys_id: 'br_2',
    name: 'Auto-stamp Resolved By and Resolved Time',
    table: 'incident',
    when: 'before',
    operation: { insert: false, update: true, delete: false },
    filter_field: 'state',
    filter_operator: 'is',
    filter_value: '6',
    active: true,
    description: 'Automatically records sys_user ID and current timestamp when an incident transitions to Resolved.',
    script: `(function executeRule(current, previous) {
  if (current.state === '6' && previous.state !== '6') {
    current.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    current.resolved_by = gs.getUserID();
    gs.addInfoMessage('Incident marked as Resolved by ' + gs.getUserName());
  }
})(current, previous);`,
  },
];

export const INITIAL_FLOWS: FlowDefinition[] = [
  {
    sys_id: 'flow_1',
    name: 'High Severity Incident VIP Escalation',
    trigger_table: 'incident',
    trigger_condition: 'Priority is 1 - Critical',
    active: true,
    description: 'Automatically pages on-call engineering leads, creates a Teams war room, and flags the incident.',
    actions: [
      { id: 'act_1', type: 'send_email', label: 'Send Incident Commander Alert', config: { recipient: 'incident-commander@corp.com', template: 'P1_Alert' } },
      { id: 'act_2', type: 'create_task', label: 'Create Major Incident Management Task', config: { assignment_group: 'grp_servicedesk', title: 'Coordinate Executive Bridge' } },
      { id: 'act_3', type: 'log_message', label: 'Log Flow Execution to System Log', config: { message: 'P1 Major Incident flow triggered successfully.' } },
    ],
    execution_history: [
      {
        id: 'hist_1',
        timestamp: '2026-09-25 08:00:16',
        status: 'Success',
        log: [
          'Trigger matched: Incident INC0010002 Priority = 1',
          'Action 1 [Send Incident Commander Alert]: Dispatched email to incident-commander@corp.com',
          'Action 2 [Create Major Incident Management Task]: Created Task #TSK009412',
          'Action 3 [Log Message]: Completed in 32ms',
        ],
      },
    ],
  },
  {
    sys_id: 'flow_2',
    name: 'Standard Hardware Catalog Fulfillment',
    trigger_table: 'sc_req_item',
    trigger_condition: 'Catalog Item is Developer Workstation',
    active: true,
    description: 'Routes request for manager approval, provisions IT procurement task, and tracks shipping.',
    actions: [
      { id: 'act_21', type: 'ask_approval', label: 'Ask for Manager Approval', config: { approver_role: 'manager' } },
      { id: 'act_22', type: 'create_task', label: 'Create Hardware Provisioning SCTASK', config: { assignment_group: 'grp_hardware' } },
      { id: 'act_23', type: 'update_record', label: 'Update Request Stage to Fulfillment', config: { stage: 'Fulfillment' } },
    ],
    execution_history: [
      {
        id: 'hist_2',
        timestamp: '2026-09-24 10:00:05',
        status: 'Success',
        log: [
          'Trigger matched: RITM0010001 (MacBook Pro 16")',
          'Action 1 [Ask for Manager Approval]: Auto-approved per delegation',
          'Action 2 [Create SCTASK]: SCTASK0010001 assigned to Hardware Support',
          'Action 3 [Update Record]: Stage updated to Fulfillment',
        ],
      },
    ],
  },
];

export const INITIAL_UPDATE_SETS: UpdateSet[] = [
  {
    sys_id: 'us_default',
    name: 'Default [Global]',
    state: 'in_progress',
    application: 'Global',
    created_by: 'system',
    sys_created_on: '2026-01-01 00:00:00',
    changes_count: 3,
    changes: [
      { sys_id: 'chg_u1', type: 'Table', target_name: 'u_loaner_laptop', action: 'Insert', timestamp: '2026-09-20 14:00:00' },
      { sys_id: 'chg_u2', type: 'Client Script', target_name: 'Highlight P1 Critical Incidents', action: 'Insert', timestamp: '2026-09-21 10:30:00' },
      { sys_id: 'chg_u3', type: 'Business Rule', target_name: 'Calculate Priority from Impact and Urgency', action: 'Insert', timestamp: '2026-09-22 11:15:00' },
    ],
  },
  {
    sys_id: 'us_telephony',
    name: 'ITSM-2026-Telephony-Enhancement',
    state: 'complete',
    application: 'Global',
    created_by: 'admin',
    sys_created_on: '2026-09-15 09:00:00',
    changes_count: 5,
    changes: [
      { sys_id: 'chg_u4', type: 'Field', target_name: 'u_callback_number', action: 'Insert', timestamp: '2026-09-15 10:00:00' },
      { sys_id: 'chg_u5', type: 'Client Script', target_name: 'Validate Phone Format', action: 'Insert', timestamp: '2026-09-15 11:00:00' },
    ],
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    sys_id: 'act_log_1',
    table_name: 'incident',
    record_id: 'inc_1001',
    user_name: 'Abel Tuter',
    user_id: 'usr_abel',
    type: 'field_change',
    field_name: 'State',
    old_value: 'New',
    new_value: 'In Progress',
    created_at: '2026-09-24 09:30:00',
  },
  {
    sys_id: 'act_log_2',
    table_name: 'incident',
    record_id: 'inc_1001',
    user_name: 'Beth Anglin',
    user_id: 'usr_beth',
    type: 'work_notes',
    text: 'Inspected event logs on Abel\'s workstation. Appears to be an add-in conflict with Zoom Outlook plugin v5.14. Reinstalling add-in solves the crash.',
    created_at: '2026-09-24 10:45:00',
  },
  {
    sys_id: 'act_log_3',
    table_name: 'incident',
    record_id: 'inc_1001',
    user_name: 'Beth Anglin',
    user_id: 'usr_beth',
    type: 'comments',
    text: 'Hi Abel, we have identified the root issue with the Zoom add-in. Pushing an automated fix via InTune in 15 minutes.',
    created_at: '2026-09-24 11:20:12',
  },
];
