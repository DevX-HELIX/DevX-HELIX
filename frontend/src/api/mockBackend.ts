export interface PolicyViolation {
  id: string;
  name: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Resolved";
  resource: string;
  updated: string;
  codeSnippet: string;
  fixSuggestion: string;
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

const API_BASE = "http://localhost:8080/api";

export const mockApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const [statsRes, policiesRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`).then(r => r.json()),
        fetch(`${API_BASE}/policies`).then(r => r.json()),
        fetch(`${API_BASE}/audit`).then(r => r.json())
      ]);

      const complianceScore = statsRes.compliance_score || 0;
      const activePolicies = policiesRes.length || 0;
      
      const criticalViolations = auditRes.filter((log: any) => 
        log.violations && log.violations.some((v: any) => v.severity && v.severity.toUpperCase() === 'CRITICAL')
      ).length || 0;

      const pieData = [
        { name: 'Compliant', value: complianceScore },
        { name: 'Non-Compliant', value: 100 - complianceScore },
      ];

      const barData = (statsRes.top_violations || []).map((v: any) => ({
        name: (v.issue || 'Unknown').substring(0, 15),
        violations: v.count
      }));

      const recentActivity = (auditRes || []).slice(0, 5).map((log: any) => ({
        time: new Date(log.timestamp).toLocaleTimeString(),
        evt: log.artifact_type ? `Validated ${log.artifact_type}` : 'Validation',
        env: log.environment || 'N/A',
        status: log.status === 'PASSED' ? 'Pass' : 'Fail'
      }));

      const lineData = [
        { name: 'Prev', score: Math.max(0, complianceScore - 2) },
        { name: 'Now', score: complianceScore }
      ];

      return {
        complianceScore,
        activePolicies,
        criticalViolations,
        scansToday: `${statsRes.total_runs || 0}`,
        pieData,
        barData,
        lineData,
        recentActivity
      };
    } catch(e) {
      console.error("Dashboard fetch error:", e);
      // Fallback to mock data to not break UI
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
    }
  },
  
  getPolicies: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/policies`);
      const data = await res.json();
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        severity: p.severity,
        status: p.mode === "enforce" ? "Enforced" : "Audit",
        updated: "Just now"
      }));
    } catch(e) {
      console.error("Policy fetch error:", e);
      return [];
    }
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      const data = await res.json();
      return (data || []).map((log: any) => ({
        id: log.run_id,
        resource: log.artifact_type || 'Unknown',
        policy: log.status,
        user: log.team || 'Unknown',
        status: log.status === 'PASSED' ? 'PASS' : 'FAIL',
        time: new Date(log.timestamp).toLocaleString()
      }));
    } catch(e) {
      console.error("Audit log fetch error:", e);
      // Fallback
      return Array.from({ length: 15 }).map((_, i) => ({
        id: `run-90${i}x${Math.floor(Math.random() * 1000)}`,
        resource: `arn:aws:s3:::prod-bucket-${i}`,
        policy: i % 3 === 0 ? 'S3 buckets must not be public' : 'IAM roles require MFA',
        user: i % 2 === 0 ? 'system:terraform' : 'developer@company.com',
        status: (i % 4 === 0) ? 'FAIL' : 'PASS',
        time: `${i}h ago`,
      }));
    }
  },
  
  getPolicyViolations: async (): Promise<PolicyViolation[]> => {
    // We return UI-friendly mock data for the Policies page since the remote API doesn't fully support these advanced fields yet
    return [
      { 
        id: "VIO-001", 
        name: "S3 buckets must not be public", 
        category: "Storage", 
        severity: "Critical", 
        status: "Open",
        resource: "arn:aws:s3:::customer-data-prod",
        updated: "2m ago",
        codeSnippet: `resource "aws_s3_bucket" "b" {\n  bucket = "customer-data-prod"\n  acl    = "public-read" # VIOLATION\n}`,
        fixSuggestion: "Change the ACL to 'private' and ensure public access blocks are enabled."
      },
      { 
        id: "VIO-002", 
        name: "Security Groups allow unrestricted SSH", 
        category: "Network", 
        severity: "High", 
        status: "Open",
        resource: "sg-0123456789abcdef0",
        updated: "15m ago",
        codeSnippet: `resource "aws_security_group_rule" "ssh" {\n  type        = "ingress"\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n  cidr_blocks = ["0.0.0.0/0"] # VIOLATION\n}`,
        fixSuggestion: "Restrict SSH access to specific trusted IP ranges or use AWS Systems Manager Session Manager."
      },
      { 
        id: "VIO-003", 
        name: "RDS storage is unencrypted", 
        category: "Database", 
        severity: "Critical", 
        status: "Open",
        resource: "arn:aws:rds:us-east-1:123456789012:db:prod-db",
        updated: "1h ago",
        codeSnippet: `resource "aws_db_instance" "default" {\n  allocated_storage    = 100\n  storage_encrypted    = false # VIOLATION\n  instance_class       = "db.t3.micro"\n}`,
        fixSuggestion: "Enable storage encryption by setting 'storage_encrypted = true' and specifying a KMS key."
      }
    ];
  }
};
