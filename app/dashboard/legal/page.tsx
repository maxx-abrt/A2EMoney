"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/lib/user-context"
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  Upload, 
  Building2,
  Users,
  Scale,
  FileCheck,
  Bell,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Send
} from "lucide-react"

// Mock legal duties data
const legalDuties = {
  company: [
    { id: 1, title: "Annual Accounts Filing", dueDate: "2024-03-31", status: "upcoming", category: "financial", description: "Submit annual financial statements to Companies House" },
    { id: 2, title: "Corporation Tax Return", dueDate: "2024-04-15", status: "upcoming", category: "tax", description: "File CT600 return with HMRC" },
    { id: 3, title: "VAT Return Q1", dueDate: "2024-02-07", status: "overdue", category: "tax", description: "Submit quarterly VAT return" },
    { id: 4, title: "Confirmation Statement", dueDate: "2024-06-15", status: "pending", category: "compliance", description: "Annual confirmation statement to Companies House" },
    { id: 5, title: "Payroll RTI Submission", dueDate: "2024-01-19", status: "completed", category: "payroll", description: "Real Time Information submission for payroll" },
    { id: 6, title: "Board Meeting Minutes", dueDate: "2024-01-31", status: "completed", category: "governance", description: "Record and file quarterly board meeting minutes" },
  ],
  association: [
    { id: 1, title: "Annual General Meeting", dueDate: "2024-04-30", status: "upcoming", category: "governance", description: "Hold AGM within 6 months of year end" },
    { id: 2, title: "Annual Return", dueDate: "2024-03-31", status: "upcoming", category: "compliance", description: "Submit annual return to relevant authority" },
    { id: 3, title: "Charity Commission Filing", dueDate: "2024-02-28", status: "overdue", category: "compliance", description: "Annual report to Charity Commission" },
    { id: 4, title: "Member Register Update", dueDate: "2024-01-31", status: "completed", category: "governance", description: "Update and maintain member register" },
    { id: 5, title: "Financial Audit", dueDate: "2024-05-15", status: "pending", category: "financial", description: "Independent audit of annual accounts" },
  ],
  individual: [
    { id: 1, title: "Self-Assessment Tax Return", dueDate: "2024-01-31", status: "completed", category: "tax", description: "Annual tax return submission" },
    { id: 2, title: "Tax Payment on Account", dueDate: "2024-07-31", status: "pending", category: "tax", description: "Second payment on account for income tax" },
  ]
}

const templates = [
  { id: 1, name: "Board Resolution", category: "Governance", downloads: 234 },
  { id: 2, name: "Meeting Minutes Template", category: "Governance", downloads: 189 },
  { id: 3, name: "Annual Report Template", category: "Financial", downloads: 156 },
  { id: 4, name: "Privacy Policy", category: "Compliance", downloads: 312 },
  { id: 5, name: "Employment Contract", category: "HR", downloads: 278 },
  { id: 6, name: "NDA Template", category: "Legal", downloads: 201 },
]

export default function LegalPage() {
  const { userProfile } = useUser()
  const [activeTab, setActiveTab] = useState("duties")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  const duties = legalDuties[userProfile?.type || "company"] || legalDuties.company
  
  const filteredDuties = duties.filter(duty => {
    const matchesSearch = duty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          duty.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || duty.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const overdueDuties = duties.filter(d => d.status === "overdue")
  const upcomingDuties = duties.filter(d => d.status === "upcoming")
  const completedDuties = duties.filter(d => d.status === "completed")
  const pendingDuties = duties.filter(d => d.status === "pending")
  
  const completionRate = Math.round((completedDuties.length / duties.length) * 100)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-destructive text-destructive-foreground"
      case "upcoming": return "bg-warning text-warning-foreground"
      case "completed": return "bg-accent text-accent-foreground"
      case "pending": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "upcoming": return <Clock className="h-4 w-4" />
      case "completed": return <CheckCircle2 className="h-4 w-4" />
      case "pending": return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial": return <FileText className="h-4 w-4" />
      case "tax": return <Scale className="h-4 w-4" />
      case "compliance": return <FileCheck className="h-4 w-4" />
      case "governance": return <Building2 className="h-4 w-4" />
      case "payroll": return <Users className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }
  
  const categories = ["all", ...new Set(duties.map(d => d.category))]

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Legal Duties</h1>
          <p className="text-muted-foreground">
            Manage compliance requirements and legal obligations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border border-border">
            <Bell className="mr-2 h-4 w-4" />
            Set Reminders
          </Button>
          <Button className="rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Duty
          </Button>
        </div>
      </div>

      {/* Alert for overdue items */}
      {overdueDuties.length > 0 && (
        <Card className="rounded-xl border border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                {overdueDuties.length} Overdue {overdueDuties.length === 1 ? "Duty" : "Duties"}
              </p>
              <p className="text-sm text-muted-foreground">
                Immediate attention required to avoid penalties
              </p>
            </div>
            <Button variant="destructive" size="sm">
              View All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{overdueDuties.length}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{upcomingDuties.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingDuties.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{completedDuties.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="rounded-xl border border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Compliance Progress</span>
            <span className="text-sm font-mono font-semibold">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedDuties.length} of {duties.length} duties completed this period
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-lg border border-border bg-muted/50">
          <TabsTrigger value="duties" className="data-[state=active]:bg-background">
            <FileText className="mr-2 h-4 w-4" />
            All Duties
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-background">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background">
            <FileCheck className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="duties" className="mt-6 space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search duties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize whitespace-nowrap rounded-lg border"
                >
                  {cat === "all" ? "All" : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Duties List */}
          <div className="space-y-3">
            {filteredDuties.map((duty) => (
              <Card 
                key={duty.id} 
                className={`rounded-lg border transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer ${
                  duty.status === "overdue" ? "border-destructive" : "border-border"
                }`}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getStatusColor(duty.status)}`}>
                    {getStatusIcon(duty.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{duty.title}</h3>
                      <Badge variant="outline" className="capitalize text-xs rounded border">
                        {getCategoryIcon(duty.category)}
                        <span className="ml-1">{duty.category}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{duty.description}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(duty.status)}>
                      {duty.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      Due: {new Date(duty.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card className="rounded-xl border border-border">
            <CardHeader>
              <CardTitle>Compliance Calendar</CardTitle>
              <CardDescription>Visual timeline of upcoming legal obligations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline view */}
                {duties
                  .filter(d => d.status !== "completed")
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((duty, index) => (
                    <div key={duty.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${
                          duty.status === "overdue" ? "bg-destructive" : 
                          duty.status === "upcoming" ? "bg-warning" : "bg-muted"
                        }`} />
                        {index < duties.filter(d => d.status !== "completed").length - 1 && (
                          <div className="w-0.5 flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{duty.title}</p>
                            <p className="text-sm text-muted-foreground">{duty.description}</p>
                          </div>
                          <Badge className={getStatusColor(duty.status)}>
                            {new Date(duty.dueDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="rounded-xl border border-border hover:shadow-sm hover:-translate-y-0.5 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-6 w-6" />
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="mt-4 font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.category}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template.downloads} downloads
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                      <Button size="sm" className="rounded-lg border border-border">
                        <Download className="mr-1 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
