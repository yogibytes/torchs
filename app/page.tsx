'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Cloud,
  Code2,
  Command,
  Download,
  FileBarChart,
  FileCheck2,
  Filter,
  FolderGit2,
  Gauge,
  HardDrive,
  Layers3,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Server,
  Settings2,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  TerminalSquare,
  X,
  XCircle,
  Zap,
} from 'lucide-react'

type ScanState = 'idle' | 'connecting' | 'scanning' | 'finalizing' | 'completed'
type FindingStatus = 'Pass' | 'Fail' | 'Review' | 'Not run'
type View = 'Dashboard' | 'Systems' | 'Security scan' | 'Hardening' | 'Compliance' | 'Rollback' | 'Reports' | 'Audit logs'

type Finding = {
  id: string
  title: string
  category: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: FindingStatus
  path: string
  evidence?: string
  recommendation: string
}

const TOTAL = 115
const findings: Finding[] = [
  { id: 'AC-2.1', title: 'Inactive accounts are disabled', category: 'Access control', severity: 'High', status: 'Fail', path: 'Access control / Account management', evidence: '3 accounts inactive for more than 90 days.', recommendation: 'Review inactive accounts and disable them through your approved identity workflow.' },
  { id: 'AU-2.1', title: 'Audit events are defined and collected', category: 'Audit & accountability', severity: 'Medium', status: 'Pass', path: 'Audit & accountability / Event logging', evidence: 'Audit policy returned 14 enabled event classes.', recommendation: 'Retain the current audit policy and review it quarterly.' },
  { id: 'CM-6.1', title: 'Configuration settings are documented', category: 'Configuration management', severity: 'Medium', status: 'Review', path: 'Configuration management / Baselines', recommendation: 'Confirm the baseline is approved and attached to the current system owner.' },
  { id: 'IA-5.1', title: 'Authenticator management requirements', category: 'Identification & authentication', severity: 'Critical', status: 'Fail', path: 'Identification & authentication / Authenticators', evidence: 'Scanner could not verify MFA enforcement for the admin group.', recommendation: 'Validate MFA enforcement with the identity provider before changing access.' },
  { id: 'SC-7.2', title: 'Boundary protection is configured', category: 'System & communications', severity: 'High', status: 'Fail', path: 'System & communications / Boundary protection', recommendation: 'Review the approved network boundary diagram and compare it to observed routes.' },
  { id: 'SI-2.1', title: 'Flaw remediation is tracked', category: 'System & information integrity', severity: 'Medium', status: 'Pass', path: 'System & information integrity / Flaw remediation', evidence: 'Patch reporting endpoint returned current remediation SLA.', recommendation: 'Continue weekly remediation review.' },
  { id: 'CP-9.1', title: 'System backups are performed', category: 'Contingency planning', severity: 'Low', status: 'Pass', path: 'Contingency planning / Backup', recommendation: 'Validate restore tests on the documented cadence.' },
  { id: 'RA-5.1', title: 'Vulnerability monitoring is performed', category: 'Risk assessment', severity: 'High', status: 'Review', path: 'Risk assessment / Vulnerability monitoring', evidence: 'Evidence not supplied by scanner.', recommendation: 'Attach the latest vulnerability monitoring report for assessor review.' },
]

const navItems: { label: View; icon: typeof Gauge }[] = [
  { label: 'Dashboard', icon: Gauge },
  { label: 'Systems', icon: Server },
  { label: 'Security scan', icon: Shield },
  { label: 'Hardening', icon: SlidersHorizontal },
  { label: 'Compliance', icon: ClipboardCheck },
  { label: 'Rollback', icon: RefreshCw },
  { label: 'Reports', icon: FileBarChart },
  { label: 'Audit logs', icon: FileCheck2 },
]

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'green' | 'red' | 'amber' | 'blue' }) {
  return <span className={`torch-badge torch-badge-${tone}`}>{children}</span>
}

function StatusIcon({ status }: { status: FindingStatus }) {
  if (status === 'Pass') return <CheckCircle2 className="size-4 text-emerald-400" />
  if (status === 'Fail') return <XCircle className="size-4 text-red-400" />
  if (status === 'Review') return <AlertTriangle className="size-4 text-amber-400" />
  return <Clock3 className="size-4 text-muted-foreground" />
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`torch-panel ${className}`}>{children}</section>
}

export default function Page() {
  const [view, setView] = useState<View>('Dashboard')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<Finding | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | FindingStatus>('All')
  const [mobileNav, setMobileNav] = useState(false)
  const [target, setTarget] = useState('prod-api-01')
  const [scope, setScope] = useState('Full control catalog')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (scanState === 'idle' || scanState === 'completed') return
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + (current < 40 ? 8 : 5), 100)
        if (next >= 100) {
          window.clearInterval(timer)
          setScanState('completed')
        } else if (next > 82) setScanState('finalizing')
        else if (next > 8) setScanState('scanning')
        return next
      })
    }, 550)
    return () => window.clearInterval(timer)
  }, [scanState])

  const counts = useMemo(() => {
    const passed = scanState === 'idle' ? 92 : Math.round((92 / 100) * progress)
    const failed = scanState === 'idle' ? 11 : Math.round((11 / 100) * progress)
    const review = scanState === 'idle' ? 7 : Math.round((7 / 100) * progress)
    return { passed, failed, review, notRun: Math.max(0, TOTAL - passed - failed - review) }
  }, [progress, scanState])

  const filteredFindings = findings.filter((finding) => {
    const matchesQuery = `${finding.id} ${finding.title} ${finding.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'All' || finding.status === statusFilter)
  })

  function startScan() {
    if (scanState !== 'idle' && scanState !== 'completed') return
    setProgress(0)
    setScanState('connecting')
    setView('Security scan')
    setNotice('Scan started in demonstration mode. No changes will be made to the target system.')
  }

  function resetScan() {
    setProgress(0)
    setScanState('idle')
    setNotice('')
  }

  function downloadReport() {
    setNotice('Report export queued for the current demonstration dataset.')
  }

  return (
    <main className="torch-app">
      <aside className={`torch-sidebar ${mobileNav ? 'torch-sidebar-open' : ''}`}>
        <div className="torch-brand">
          <div className="torch-mark"><FlameMark /></div>
          <div><p className="torch-brand-name">TORCH</p><p className="torch-brand-sub">Security console</p></div>
          <button className="torch-icon-button torch-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button>
        </div>
        <div className="torch-env"><span className="torch-pulse" /> V0 DEMONSTRATION <ChevronDown className="size-3" /></div>
        <nav className="torch-nav" aria-label="Primary navigation">
          <p className="torch-nav-label">Workspace</p>
          {navItems.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} onClick={() => { setView(label); setMobileNav(false) }} className={`torch-nav-item ${view === label ? 'is-active' : ''}`}><Icon className="size-4" /><span>{label}</span>{label === 'Security scan' && scanState !== 'idle' && <span className="torch-nav-dot" />}</button>)}
          <p className="torch-nav-label torch-nav-label-spaced">Operations</p>
          {navItems.slice(5).map(({ label, icon: Icon }) => <button key={label} onClick={() => { setView(label); setMobileNav(false) }} className={`torch-nav-item ${view === label ? 'is-active' : ''}`}><Icon className="size-4" /><span>{label}</span></button>)}
        </nav>
        <div className="torch-sidebar-footer"><div className="torch-avatar">AS</div><div className="min-w-0"><p className="truncate text-sm font-medium">Alex Stone</p><p className="truncate text-xs text-muted-foreground">Security operator</p></div><MoreHorizontal className="ml-auto size-4 text-muted-foreground" /></div>
      </aside>

      <div className="torch-main">
        <header className="torch-topbar"><button className="torch-icon-button torch-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div className="torch-breadcrumb"><span>Workspace</span><ChevronRight className="size-3" /><strong>{view}</strong></div><div className="torch-top-actions"><button className="torch-command"><Command className="size-3.5" /> Search <kbd>⌘ K</kbd></button><button className="torch-icon-button" aria-label="Notifications"><Bell /><span className="torch-alert-dot" /></button><button className="torch-icon-button" aria-label="Settings"><Settings2 /></button></div></header>
        <div className="torch-content">
          {notice && <div className="torch-notice"><CheckCircle2 className="size-4 text-emerald-400" /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X className="size-4" /></button></div>}
          {view === 'Dashboard' && <Dashboard counts={counts} scanState={scanState} startScan={startScan} setView={setView} setSelected={setSelected} />}
          {view === 'Security scan' && <ScanView scanState={scanState} progress={progress} counts={counts} target={target} setTarget={setTarget} scope={scope} setScope={setScope} startScan={startScan} resetScan={resetScan} setSelected={setSelected} />}
          {view === 'Systems' && <SystemsView startScan={startScan} />}
          {view === 'Hardening' && <HardeningView />}
          {view === 'Compliance' && <ComplianceView counts={counts} />}
          {view === 'Rollback' && <SimpleView title="Rollback" eyebrow="Change safety" icon={RefreshCw} description="Review simulated rollback points before any hardening action is approved." rows={['Baseline snapshot · 18 Jun 2026', 'Pre-scan configuration · 12 Jun 2026', 'Quarterly audit baseline · 01 Jun 2026']} />}
          {view === 'Reports' && <ReportsView downloadReport={downloadReport} />}
          {view === 'Audit logs' && <SimpleView title="Audit logs" eyebrow="Operator activity" icon={FileCheck2} description="An immutable-style activity view for this V0 demonstration workspace." rows={['Scan configuration viewed · Alex Stone · just now', 'Control IA-5.1 opened · Alex Stone · 4 min ago', 'Report export requested · Jordan Lee · yesterday']} />}
        </div>
      </div>
      {selected && <FindingDrawer finding={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}

function FlameMark() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-none stroke-current"><path d="M12 21c4.4 0 7-2.9 7-6.8 0-3.1-1.6-5.6-4.6-8.2.2 2.4-1 3.7-2.1 4.4.2-3.6-1.9-6.3-4.8-8.4.1 3.7-2.5 5.9-2.5 9.5C5 17.9 7.6 21 12 21Z" strokeWidth="1.7" strokeLinejoin="round" /><path d="M12 21c-1.8-1-2.6-2.5-2.5-4.3.1-1.3.8-2.4 1.9-3.5 0 1.3.6 2.2 1.6 2.8.4-1.2 1.2-2.1 2.2-2.8.2 3.5-1.1 6.4-3.2 7.8Z" strokeWidth="1.5" /></svg> }

function Dashboard({ counts, scanState, startScan, setView, setSelected }: { counts: { passed: number; failed: number; review: number; notRun: number }; scanState: ScanState; startScan: () => void; setView: (view: View) => void; setSelected: (finding: Finding) => void }) {
  return <>
    <div className="torch-page-heading"><div><p className="torch-eyebrow">Overview / 18 Jun 2026</p><h1>Security posture</h1><p className="torch-subheading">A clear view of control health across your monitored systems.</p></div><button className="torch-button torch-button-primary" onClick={startScan}><Play className="size-4" /> Start security scan</button></div>
    <div className="torch-summary-grid"><Panel className="torch-posture-card"><div className="torch-panel-header"><div><p className="torch-panel-kicker">Overall posture</p><h2 className="torch-score">78<span>/100</span></h2></div><Badge tone="amber">Needs attention</Badge></div><div className="torch-meter"><span style={{ width: '78%' }} /></div><div className="torch-posture-foot"><span>Based on latest assessment</span><button onClick={() => setView('Compliance')}>View breakdown <ArrowRight className="size-3.5" /></button></div></Panel><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">Controls assessed</p><h2 className="torch-stat">{counts.passed + counts.failed + counts.review}<span> / {TOTAL}</span></h2></div><ClipboardCheck className="torch-stat-icon" /></div><div className="torch-stat-list"><div><span className="status-dot dot-green" />{counts.passed} passed</div><div><span className="status-dot dot-red" />{counts.failed} failed</div><div><span className="status-dot dot-amber" />{counts.review} review</div></div></Panel><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">Last assessment</p><h2 className="torch-date">18 Jun 2026</h2></div><Clock3 className="torch-stat-icon" /></div><p className="torch-muted-line">Completed 09:42 UTC · 12m 18s</p><button className="torch-inline-link" onClick={() => setView('Security scan')}>Open assessment <ArrowRight className="size-3.5" /></button></Panel></div>
    <div className="torch-section-grid"><Panel className="torch-findings-panel"><div className="torch-panel-header"><div><p className="torch-panel-kicker">Priority findings</p><h2 className="torch-section-title">What needs attention</h2></div><button className="torch-quiet-button" onClick={() => setView('Compliance')}>View all <ArrowRight className="size-3.5" /></button></div><div className="torch-finding-list">{findings.filter((f) => f.status !== 'Pass').slice(0, 4).map((finding) => <button className="torch-finding-row" key={finding.id} onClick={() => setSelected(finding)}><div className="torch-finding-icon"><ShieldAlert className="size-4" /></div><div className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className="torch-finding-id">{finding.id}</span><Badge tone={finding.severity === 'Critical' ? 'red' : finding.severity === 'High' ? 'amber' : 'muted'}>{finding.severity}</Badge></div><p className="truncate text-sm font-medium">{finding.title}</p><p className="truncate text-xs text-muted-foreground">{finding.category}</p></div><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div></Panel><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">Systems</p><h2 className="torch-section-title">Monitored assets</h2></div><button className="torch-quiet-button" onClick={() => setView('Systems')}>Manage <ArrowRight className="size-3.5" /></button></div><div className="torch-system-list"><div className="torch-system-row"><span className="torch-system-icon"><Server className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">prod-api-01</p><p className="text-xs text-muted-foreground">Linux · Production</p></div><Badge tone="green">Healthy</Badge></div><div className="torch-system-row"><span className="torch-system-icon"><Cloud className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">identity-platform</p><p className="text-xs text-muted-foreground">Cloud service · Production</p></div><Badge tone="amber">Review</Badge></div><div className="torch-system-row"><span className="torch-system-icon"><HardDrive className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">backup-vault-02</p><p className="text-xs text-muted-foreground">Storage · Continuity</p></div><Badge tone="green">Healthy</Badge></div></div></Panel></div>
    <div className="torch-activity-strip"><Activity className="size-4 text-cyan-400" /><span className="torch-activity-label">Latest activity</span><span className="torch-activity-text">Assessment completed on prod-api-01</span><span className="torch-activity-time">8 minutes ago</span><button onClick={() => setView('Audit logs')}><ArrowRight className="size-4" /></button></div>
    {scanState !== 'idle' && <div className="torch-scan-banner"><div className="torch-spinner"><RefreshCw className="size-4" /></div><div><p className="text-sm font-medium">Security scan {scanState === 'completed' ? 'completed' : 'in progress'}</p><p className="text-xs text-muted-foreground">{scanState === 'completed' ? 'Results are ready for review.' : 'Evaluating controls without making system changes.'}</p></div><button className="torch-button torch-button-secondary ml-auto" onClick={() => setView('Security scan')}>Open scan</button></div>}
  </>
}

function ScanView({ scanState, progress, counts, target, setTarget, scope, setScope, startScan, resetScan, setSelected }: { scanState: ScanState; progress: number; counts: { passed: number; failed: number; review: number; notRun: number }; target: string; setTarget: (value: string) => void; scope: string; setScope: (value: string) => void; startScan: () => void; resetScan: () => void; setSelected: (finding: Finding) => void }) {
  const active = scanState !== 'idle' && scanState !== 'completed'
  return <><div className="torch-page-heading"><div><p className="torch-eyebrow">Operations / Assessment</p><h1>Security scan</h1><p className="torch-subheading">Run a read-only evaluation against the selected control catalog.</p></div>{scanState === 'completed' ? <button className="torch-button torch-button-secondary" onClick={resetScan}><RefreshCw className="size-4" /> New scan</button> : <Badge tone={active ? 'blue' : 'muted'}>{active ? `Running · ${progress}%` : 'Ready to run'}</Badge>}</div>
    <div className="torch-scan-layout"><Panel className="torch-scan-config"><div className="torch-panel-header"><div><p className="torch-panel-kicker">Assessment setup</p><h2 className="torch-section-title">Configure your scan</h2></div><div className="torch-read-only"><LockKeyhole className="size-3" /> Read-only</div></div><label className="torch-field"><span>Target system</span><select value={target} onChange={(e) => setTarget(e.target.value)} disabled={active}><option>prod-api-01</option><option>identity-platform</option><option>backup-vault-02</option></select></label><label className="torch-field"><span>Control scope</span><select value={scope} onChange={(e) => setScope(e.target.value)} disabled={active}><option>Full control catalog</option><option>Access & identity</option><option>Audit & accountability</option><option>System integrity</option></select></label><div className="torch-scope-note"><BookOpenCheck className="size-4 text-cyan-400" /><div><p>Catalog source</p><span>NIST 800-53 Rev. 5 · 115 controls</span></div></div><div className="torch-scan-disclaimer"><Shield className="size-4" /><p>This assessment reads available system evidence. TORCH will not change configuration, install software, or apply hardening.</p></div><button className="torch-button torch-button-primary w-full justify-center" onClick={startScan} disabled={active}><Play className="size-4" /> {active ? 'Assessment running' : scanState === 'completed' ? 'Scan completed' : 'Start assessment'}</button></Panel><Panel className="torch-scan-live"><div className="torch-panel-header"><div><p className="torch-panel-kicker">Live assessment</p><h2 className="torch-section-title">{scanState === 'idle' ? 'Ready when you are' : scanState === 'completed' ? 'Assessment complete' : scanState === 'finalizing' ? 'Finalizing results' : scanState === 'connecting' ? 'Connecting to target' : 'Evaluating controls'}</h2></div>{scanState !== 'idle' && <div className="torch-live-indicator"><span className="torch-pulse" /> LIVE</div>}</div>{scanState === 'idle' ? <div className="torch-empty-scan"><div className="torch-empty-icon"><Zap className="size-5" /></div><p className="text-sm font-medium">No active assessment</p><p className="max-w-xs text-center text-xs leading-5 text-muted-foreground">Start a scan to stream read-only control evaluations and derive a complete result set.</p></div> : <><div className="torch-progress-wrap"><div className="flex items-end justify-between"><span className="torch-progress-label">{progress}% complete</span><span className="text-xs text-muted-foreground">{Math.round(TOTAL * progress / 100)} / {TOTAL} controls</span></div><div className="torch-meter torch-meter-large"><span style={{ width: `${progress}%` }} /></div></div><div className="torch-count-grid"><div><strong>{counts.passed}</strong><span>Passed</span></div><div><strong className="text-red-400">{counts.failed}</strong><span>Failed</span></div><div><strong className="text-amber-400">{counts.review}</strong><span>Review</span></div><div><strong>{counts.notRun}</strong><span>Not run</span></div></div><div className="torch-evaluating"><div className="torch-evaluating-icon"><TerminalSquare className="size-4" /></div><div><p className="text-xs text-muted-foreground">Currently evaluating</p><p className="text-sm font-medium">{findings[Math.min(Math.floor(progress / 13), findings.length - 1)].id} · {findings[Math.min(Math.floor(progress / 13), findings.length - 1)].title}</p><p className="text-xs text-muted-foreground">{findings[Math.min(Math.floor(progress / 13), findings.length - 1)].path}</p></div></div><div className="torch-live-feed">{findings.slice(0, 4).map((finding, index) => <button key={finding.id} onClick={() => setSelected(finding)} className="torch-feed-row" disabled={progress < (index + 1) * 18}><StatusIcon status={progress < (index + 1) * 18 ? 'Not run' : finding.status} /><span>{finding.id}</span><span className="truncate text-muted-foreground">{finding.title}</span><span className="ml-auto text-xs text-muted-foreground">{progress < (index + 1) * 18 ? 'Queued' : finding.status}</span></button>)}</div></>}</Panel></div><FindingsTable filteredFindings={findings} query={''} setQuery={() => {}} statusFilter="All" setStatusFilter={() => {}} setSelected={setSelected} compact /></>
}

function FindingsTable({ filteredFindings, query, setQuery, statusFilter, setStatusFilter, setSelected, compact = false }: { filteredFindings: Finding[]; query: string; setQuery: (value: string) => void; statusFilter: 'All' | FindingStatus; setStatusFilter: (value: 'All' | FindingStatus) => void; setSelected: (finding: Finding) => void; compact?: boolean }) {
  return <Panel className={compact ? 'torch-findings-table compact' : 'torch-findings-table'}><div className="torch-panel-header"><div><p className="torch-panel-kicker">Control results</p><h2 className="torch-section-title">{compact ? 'Recent control evaluations' : 'Findings register'}</h2></div><div className="torch-table-tools"><div className="torch-search"><Search className="size-3.5" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search controls" aria-label="Search controls" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | FindingStatus)} aria-label="Filter by status"><option>All</option><option>Pass</option><option>Fail</option><option>Review</option><option>Not run</option></select><button className="torch-icon-button" aria-label="More filters"><Filter /></button></div></div><div className="torch-table-wrap"><table><thead><tr><th>Control</th><th>Requirement</th><th>Category</th><th>Status</th><th>Severity</th><th /></tr></thead><tbody>{filteredFindings.map((finding) => <tr key={finding.id} onClick={() => setSelected(finding)}><td><span className="torch-finding-id">{finding.id}</span></td><td className="font-medium">{finding.title}</td><td className="text-muted-foreground">{finding.category}</td><td><div className="flex items-center gap-2"><StatusIcon status={finding.status} /><span>{finding.status}</span></div></td><td><Badge tone={finding.severity === 'Critical' ? 'red' : finding.severity === 'High' ? 'amber' : finding.severity === 'Medium' ? 'blue' : 'muted'}>{finding.severity}</Badge></td><td><ChevronRight className="size-4 text-muted-foreground" /></td></tr>)}</tbody></table></div></Panel>
}

function FindingDrawer({ finding, onClose }: { finding: Finding; onClose: () => void }) { return <div className="torch-drawer-backdrop" onClick={onClose}><aside className="torch-drawer" onClick={(e) => e.stopPropagation()}><div className="torch-drawer-header"><div><p className="torch-eyebrow">Control detail</p><h2>{finding.id}</h2></div><button className="torch-icon-button" onClick={onClose} aria-label="Close control detail"><X /></button></div><div className="torch-drawer-content"><Badge tone={finding.status === 'Fail' ? 'red' : finding.status === 'Review' ? 'amber' : 'green'}>{finding.status}</Badge><h3>{finding.title}</h3><p className="torch-drawer-category">{finding.category} · {finding.severity} severity</p><div className="torch-detail-block"><p className="torch-detail-label">Hierarchy</p><p>{finding.path}</p></div><div className="torch-detail-block"><p className="torch-detail-label">Evidence</p><p className={!finding.evidence ? 'torch-evidence-missing' : ''}>{finding.evidence || 'Evidence not supplied by scanner.'}</p></div><div className="torch-detail-block"><p className="torch-detail-label">Recommended next step</p><p>{finding.recommendation}</p></div><div className="torch-drawer-actions"><button className="torch-button torch-button-secondary" onClick={() => {}}>Preview hardening</button><button className="torch-button torch-button-primary" onClick={onClose}>Done</button></div><p className="torch-simulated-note"><CircleHelp className="size-3.5" /> Preview only · no privileged action was performed</p></div></aside></div> }

function SystemsView({ startScan }: { startScan: () => void }) { return <><div className="torch-page-heading"><div><p className="torch-eyebrow">Workspace / Inventory</p><h1>Systems</h1><p className="torch-subheading">Assets currently included in your assessment workspace.</p></div><button className="torch-button torch-button-primary" onClick={startScan}><Play className="size-4" /> Scan selected</button></div><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">3 monitored systems</p><h2 className="torch-section-title">System inventory</h2></div><button className="torch-quiet-button"><FolderGit2 className="size-4" /> Add system</button></div><div className="torch-system-cards">{[['prod-api-01', 'Linux server', 'Production', 'Healthy', 'green'], ['identity-platform', 'Cloud service', 'Production', 'Review', 'amber'], ['backup-vault-02', 'Storage appliance', 'Continuity', 'Healthy', 'green']].map(([name, type, env, state, tone]) => <div className="torch-system-card" key={name}><div className="torch-system-icon"><Server className="size-5" /></div><div className="flex-1"><h3>{name}</h3><p>{type} · {env}</p><div className="torch-system-meta"><Badge tone={tone as 'green' | 'amber'}>{state}</Badge><span>Last scan 18 Jun 2026</span></div></div><MoreHorizontal className="size-4 text-muted-foreground" /></div>)}</div></Panel></> }

function HardeningView() { return <SimpleView title="Hardening" eyebrow="Change management" icon={SlidersHorizontal} description="Safely review remediation suggestions before routing them to an approved change process." rows={['MFA enforcement · IA-5.1 · Preview available', 'Inactive account review · AC-2.1 · Needs owner', 'Boundary documentation · SC-7.2 · Needs evidence']} /> }
function ComplianceView({ counts }: { counts: { passed: number; failed: number; review: number; notRun: number } }) { return <><div className="torch-page-heading"><div><p className="torch-eyebrow">Workspace / Framework</p><h1>Compliance</h1><p className="torch-subheading">NIST 800-53 Rev. 5 control coverage for the latest assessment.</p></div><Badge tone="amber">Assessment required</Badge></div><div className="torch-summary-grid"><Panel><p className="torch-panel-kicker">Passed controls</p><h2 className="torch-stat">{counts.passed}<span> / {TOTAL}</span></h2><div className="torch-meter"><span style={{ width: `${counts.passed / TOTAL * 100}%` }} /></div></Panel><Panel><p className="torch-panel-kicker">Open failures</p><h2 className="torch-stat text-red-400">{counts.failed}</h2><p className="torch-muted-line">Require owner review</p></Panel><Panel><p className="torch-panel-kicker">Pending evidence</p><h2 className="torch-stat text-amber-400">{counts.review}</h2><p className="torch-muted-line">Scanner did not verify</p></Panel></div><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">Family coverage</p><h2 className="torch-section-title">Control families</h2></div><button className="torch-quiet-button"><Download className="size-4" /> Export matrix</button></div><div className="torch-family-list">{['Access control', 'Audit & accountability', 'Configuration management', 'Identification & authentication', 'System & communications'].map((family, index) => <div className="torch-family-row" key={family}><span>{family}</span><div className="torch-family-bar"><span style={{ width: `${[72, 94, 81, 61, 76][index]}%` }} /></div><strong>{[18, 15, 13, 11, 9][index]} / {[25, 16, 16, 18, 12][index]}</strong></div>)}</div></Panel></> }
function ReportsView({ downloadReport }: { downloadReport: () => void }) { return <><div className="torch-page-heading"><div><p className="torch-eyebrow">Operations / Evidence</p><h1>Reports</h1><p className="torch-subheading">Generate review-ready artifacts from the latest assessment snapshot.</p></div><button className="torch-button torch-button-primary" onClick={downloadReport}><Download className="size-4" /> Export report</button></div><div className="torch-report-grid"><Panel><FileBarChart className="torch-report-icon" /><h2>Assessment summary</h2><p>Executive overview, posture score, control counts, and affected systems.</p><button className="torch-inline-link" onClick={downloadReport}>Preview report <ArrowRight className="size-3.5" /></button></Panel><Panel><FileCheck2 className="torch-report-icon" /><h2>Control matrix</h2><p>Detailed status, severity, evidence, and recommendations for each control.</p><button className="torch-inline-link" onClick={downloadReport}>Export matrix <ArrowRight className="size-3.5" /></button></Panel></div></> }
function SimpleView({ title, eyebrow, icon: Icon, description, rows }: { title: string; eyebrow: string; icon: typeof RefreshCw; description: string; rows: string[] }) { return <><div className="torch-page-heading"><div><p className="torch-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="torch-subheading">{description}</p></div><Icon className="torch-heading-icon" /></div><Panel><div className="torch-panel-header"><div><p className="torch-panel-kicker">Workspace activity</p><h2 className="torch-section-title">Recent records</h2></div><button className="torch-quiet-button"><ArrowDownToLine className="size-4" /> Export log</button></div><div className="torch-record-list">{rows.map((row) => <div className="torch-record-row" key={row}><CheckCircle2 className="size-4 text-emerald-400" /><span>{row}</span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></div>)}</div></Panel></> }

