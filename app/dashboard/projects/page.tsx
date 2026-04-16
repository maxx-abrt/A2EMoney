"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDataStore, formatCurrency } from "@/lib/data-store"
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  Link2,
  MoreVertical,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface ProjectBudgetItem {
  id: string
  name: string
  estimated: number
  actual: number
}

interface Project {
  id: string
  name: string
  client?: string
  status: "planning" | "active" | "completed" | "on-hold"
  startDate: string
  endDate?: string
  description?: string
  budgetItems: ProjectBudgetItem[]
  linkedInvoiceIds?: string[]
  linkedExpenseIds?: string[]
}

const initialProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    client: "Acme Corp",
    status: "active",
    startDate: "2024-03-01",
    endDate: "2024-06-30",
    description: "Complete overhaul of company website with modern design and improved UX.",
    budgetItems: [
      { id: "1", name: "Design", estimated: 5000, actual: 4500 },
      { id: "2", name: "Development", estimated: 15000, actual: 12000 },
      { id: "3", name: "Testing", estimated: 2000, actual: 1800 },
      { id: "4", name: "Deployment", estimated: 1000, actual: 800 },
    ],
  },
  {
    id: "2",
    name: "Mobile App Development",
    client: "Tech Solutions",
    status: "planning",
    startDate: "2024-05-01",
    endDate: "2024-10-31",
    description: "Native mobile application for iOS and Android platforms.",
    budgetItems: [
      { id: "1", name: "UI/UX Design", estimated: 8000, actual: 0 },
      { id: "2", name: "iOS Development", estimated: 20000, actual: 0 },
      { id: "3", name: "Android Development", estimated: 18000, actual: 0 },
      { id: "4", name: "Backend API", estimated: 10000, actual: 0 },
    ],
  },
  {
    id: "3",
    name: "Annual Marketing Campaign",
    status: "completed",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    description: "Q1 marketing initiative with digital and print materials.",
    budgetItems: [
      { id: "1", name: "Digital Ads", estimated: 10000, actual: 9500 },
      { id: "2", name: "Print Materials", estimated: 3000, actual: 3200 },
      { id: "3", name: "Events", estimated: 5000, actual: 4800 },
    ],
  },
]

export default function ProjectsPage() {
  const { userProfile, invoices, expenses } = useDataStore()
  const currency = userProfile?.currency || "EUR"
  const [projects, setProjects] = useState(initialProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkingProject, setLinkingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "planning" as Project["status"],
  })

  const getProjectTotal = (project: Project, type: "estimated" | "actual") => 
    project.budgetItems.reduce((sum, item) => sum + item[type], 0)

  const getStatusStyle = (status: Project["status"]) => {
    switch (status) {
      case "completed": return "border-accent bg-accent/10 text-accent"
      case "active": return "border-foreground bg-foreground text-background"
      case "planning": return "border-warning bg-warning/10 text-warning"
      case "on-hold": return "border-muted-foreground bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-3 w-3" />
      case "active": return <Clock className="h-3 w-3" />
      case "planning": return <Calendar className="h-3 w-3" />
      case "on-hold": return <Clock className="h-3 w-3" />
    }
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    totalBudget: projects.reduce((sum, p) => sum + getProjectTotal(p, "estimated"), 0),
    totalSpent: projects.reduce((sum, p) => sum + getProjectTotal(p, "actual"), 0),
  }

  const handleCreateProject = () => {
    if (!newProject.name) return
    const project: Project = {
      id: Date.now().toString(),
      ...newProject,
      budgetItems: [],
    }
    setProjects([project, ...projects])
    setNewProject({
      name: "",
      client: "",
      startDate: "",
      endDate: "",
      description: "",
      status: "planning",
    })
    setDialogOpen(false)
  }

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  const exportProjects = () => {
    const data = projects.map(p => ({
      name: p.name,
      client: p.client || "",
      status: p.status,
      estimated: getProjectTotal(p, "estimated"),
      actual: getProjectTotal(p, "actual"),
      variance: getProjectTotal(p, "estimated") - getProjectTotal(p, "actual")
    }))
    const csv = [
      ["Project", "Client", "Status", "Estimated", "Actual", "Variance"].join(","),
      ...data.map(row => [row.name, row.client, row.status, row.estimated, row.actual, row.variance].join(","))
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "projects-export.csv"
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-muted-foreground font-mono text-sm">Manage project budgets and track spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportProjects} className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg border border-border shadow-sm">
              <DialogHeader>
                <DialogTitle className="font-semibold">Create Project</DialogTitle>
                <DialogDescription className="font-mono text-sm">Set up a new project with budget tracking</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-bold">Project Name</Label>
                  <Input
                    placeholder="e.g., Website Redesign"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Client (optional)</Label>
                  <Input
                    placeholder="Client name"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Start Date</Label>
                    <Input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="rounded-lg border border-border font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">End Date</Label>
                    <Input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="rounded-lg border border-border font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Status</Label>
                  <Select
                    value={newProject.status}
                    onValueChange={(v) => setNewProject({ ...newProject, status: v as Project["status"] })}
                  >
                    <SelectTrigger className="rounded-lg border border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-foreground">
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Description</Label>
                  <Textarea
                    placeholder="Project description..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg border border-border">Cancel</Button>
                <Button onClick={handleCreateProject} className="rounded-lg border border-border shadow-sm">Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">Total Projects</span>
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.total}</div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{stats.active} active</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">Total Budget</span>
              <Target className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(stats.totalBudget, currency)}</div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">Across all projects</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">Total Spent</span>
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(stats.totalSpent, currency)}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full border border-border overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round((stats.totalSpent / stats.totalBudget) * 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {Math.round((stats.totalSpent / stats.totalBudget) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm bg-accent text-accent-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-80 text-xs font-medium">Remaining</span>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(stats.totalBudget - stats.totalSpent, currency)}
            </div>
            <p className="mt-1 text-sm opacity-80 font-mono">Available budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-9 rounded-lg border border-border"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      <Tabs defaultValue="all">
        <TabsList className="rounded-lg border border-border bg-background p-1">
          <TabsTrigger value="all" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">All</TabsTrigger>
          <TabsTrigger value="active" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">Active</TabsTrigger>
          <TabsTrigger value="planning" className="font-mono data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">Planning</TabsTrigger>
          <TabsTrigger value="completed" className="font-mono data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Completed</TabsTrigger>
        </TabsList>

        {["all", "active", "planning", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects
                .filter(p => tab === "all" || p.status === tab)
                .map((project) => {
                  const estimated = getProjectTotal(project, "estimated")
                  const actual = getProjectTotal(project, "actual")
                  const percentage = estimated > 0 ? Math.round((actual / estimated) * 100) : 0
                  
                  return (
                    <Card key={project.id} className="flex flex-col rounded-lg border border-border shadow-sm hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                      <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                            {project.client && (
                              <CardDescription className="flex items-center gap-1 font-mono text-xs">
                                <Users className="h-3 w-3" />
                                {project.client}
                              </CardDescription>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-lg border border-border">
                              <DropdownMenuItem onClick={() => setViewingProject(project)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setLinkingProject(project); setLinkDialogOpen(true); }}>
                                <Link2 className="mr-2 h-4 w-4" />
                                Link Records
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Badge className={`w-fit font-mono text-xs rounded border ${getStatusStyle(project.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </Badge>
                      </CardHeader>
                      <CardContent className="flex-1 pt-4">
                        {project.description && (
                          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="space-y-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-mono">Budget Progress</span>
                              <span className="font-semibold font-mono">{percentage}%</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full border border-border overflow-hidden">
                              <div 
                                className="h-full bg-accent transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-sm font-mono">
                            <div>
                              <span className="text-muted-foreground">Est: </span>
                              <span className="font-bold">{formatCurrency(estimated, currency)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spent: </span>
                              <span className="font-bold">{formatCurrency(actual, currency)}</span>
                            </div>
                          </div>
                          {project.startDate && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.startDate).toLocaleDateString()}
                              {project.endDate && (
                                <>
                                  <ArrowRight className="h-4 w-4" />
                                  {new Date(project.endDate).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Project Details Dialog */}
      <Dialog open={!!viewingProject} onOpenChange={(open) => !open && setViewingProject(null)}>
        <DialogContent className="max-w-2xl rounded-lg border border-border shadow-sm">
          <DialogHeader>
            <DialogTitle className="font-semibold">{viewingProject?.name}</DialogTitle>
            <DialogDescription className="font-mono text-sm">Project budget breakdown</DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-6">
              {viewingProject.description && (
                <p className="text-muted-foreground">{viewingProject.description}</p>
              )}
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-foreground text-background">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">ITEM</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold">ESTIMATED</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold">ACTUAL</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold">VARIANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingProject.budgetItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-bold">{item.name}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono">
                          {formatCurrency(item.estimated, currency)}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono">
                          {formatCurrency(item.actual, currency)}
                        </td>
                        <td className={`px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono font-bold ${
                          item.estimated - item.actual >= 0 ? "text-accent" : "text-destructive"
                        }`}>
                          {item.estimated - item.actual >= 0 ? "+" : ""}
                          {formatCurrency(item.estimated - item.actual, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-secondary">
                    <tr>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold">TOTAL</td>
                      <td className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono font-bold">
                        {formatCurrency(getProjectTotal(viewingProject, "estimated"), currency)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono font-bold">
                        {formatCurrency(getProjectTotal(viewingProject, "actual"), currency)}
                      </td>
                      <td className={`px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-mono font-semibold ${
                        getProjectTotal(viewingProject, "estimated") - getProjectTotal(viewingProject, "actual") >= 0
                          ? "text-accent" : "text-destructive"
                      }`}>
                        {getProjectTotal(viewingProject, "estimated") - getProjectTotal(viewingProject, "actual") >= 0 ? "+" : ""}
                        {formatCurrency(
                          getProjectTotal(viewingProject, "estimated") - getProjectTotal(viewingProject, "actual"),
                          currency
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Records Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="rounded-lg border border-border shadow-sm">
          <DialogHeader>
            <DialogTitle className="font-semibold">Link Records</DialogTitle>
            <DialogDescription className="font-mono text-sm">Connect invoices and expenses to {linkingProject?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Available Invoices</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                {invoices.map(inv => (
                  <label key={inv.id} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border border-border" />
                    <span className="font-mono text-sm">{inv.invoiceNumber}</span>
                    <span className="text-sm text-muted-foreground">- {inv.clientName}</span>
                    <span className="ml-auto font-mono text-sm font-bold">{formatCurrency(inv.total, currency)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Available Expenses</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                {expenses.slice(0, 5).map(exp => (
                  <label key={exp.id} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border border-border" />
                    <span className="text-sm">{exp.description}</span>
                    <span className="ml-auto font-mono text-sm font-bold">{formatCurrency(exp.amount, currency)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="rounded-lg border border-border">Cancel</Button>
            <Button onClick={() => setLinkDialogOpen(false)} className="rounded-lg border border-border shadow-sm">Link Records</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
