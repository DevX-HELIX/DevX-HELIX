export interface Policy {
  id: string;
  name: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Enforced" | "Audit";
  updated: string;
}

export interface AuditLog {
  id: string;
  resource: string;
  policy: string;
  user: string;
  status: "FAIL" | "PASS";
  time: string;
}

export interface DashboardMetrics {
  complianceScore: number;
  activePolicies: number;
  criticalViolations: number;
  scansToday: string;
  pieData: { name: string; value: number }[];
  barData: { name: string; violations: number }[];
  lineData: { name: string; score: number }[];
  recentActivity: { time: string; evt: string; env: string; status: string }[];
}

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    await mockDelay(1200);
    return {
      complianceScore: 84,
      activePolicies: 142,
      criticalViolations: 3,
      scansToday: "8.4k",
      pieData: [
        { name: 'Compliant', value: 84 },
        { name: 'Non-Compliant', value: 16 },
      ],
      barData: [
        { name: 'S3', violations: 12 },
        { name: 'IAM', violations: 19 },
        { name: 'EC2', violations: 5 },
        { name: 'RDS', violations: 8 },
        { name: 'EKS', violations: 15 },
      ],
      lineData: [
        { name: 'Mon', score: 75 },
        { name: 'Tue', score: 78 },
        { name: 'Wed', score: 76 },
        { name: 'Thu', score: 81 },
        { name: 'Fri', score: 80 },
        { name: 'Sat', score: 84 },
        { name: 'Sun', score: 84 },
      ],
      recentActivity: [
        { time: "2m ago", evt: "IAM Policy Update", env: "Production", status: "Fail" },
        { time: "15m ago", evt: "S3 Bucket Created", env: "Staging", status: "Pass" },
        { time: "1h ago", evt: "Security Group Mod", env: "Production", status: "Fail" },
        { time: "2h ago", evt: "RDS Instance Started", env: "Dev", status: "Pass" },
      ]
    };
  },
  
  getPolicies: async (): Promise<Policy[]> => {
    await mockDelay(1000);
    return [
      { id: "POL-001", name: "S3 buckets must not be public", category: "Storage", severity: "Critical", status: "Enforced", updated: "2d ago" },
      { id: "POL-002", name: "IAM roles require MFA", category: "Identity", severity: "High", status: "Audit", updated: "1w ago" },
      { id: "POL-003", name: "EC2 instances use IMDSv2", category: "Compute", severity: "Medium", status: "Enforced", updated: "3d ago" },
      { id: "POL-004", name: "RDS storage is encrypted", category: "Database", severity: "High", status: "Audit", updated: "5h ago" },
      { id: "POL-005", name: "VPC Flow Logs enabled", category: "Network", severity: "Low", status: "Enforced", updated: "1m ago" },
      { id: "POL-006", name: "Root account access keys disabled", category: "Identity", severity: "Critical", status: "Enforced", updated: "2m ago" },
    ];
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    await mockDelay(1500);
    return Array.from({ length: 15 }).map((_, i) => ({
      id: `run-90${i}x${Math.floor(Math.random() * 1000)}`,
      resource: `arn:aws:s3:::prod-bucket-${i}`,
      policy: i % 3 === 0 ? 'S3 buckets must not be public' : 'IAM roles require MFA',
      user: i % 2 === 0 ? 'system:terraform' : 'developer@company.com',
      status: (i % 4 === 0) ? 'FAIL' : 'PASS',
      time: `${i}h ago`,
    }));
  }
};
