"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useDataStore, formatCurrency } from "@/lib/data-store"
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Coffee,
  Download,
  Edit2,
  Film,
  Home,
  Lightbulb,
  MoreVertical,
  PieChart,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wifi,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BudgetCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  budget: number
  spent: number
  color: string
}

const iconOptions = [
  { name: "Utensils", icon: Utensils },
  { name: "Car", icon: Car },
  { name: "Home", icon: Home },
  { name: "Film", icon: Film },
  { name: "Coffee", icon: Coffee },
  { name: "Wifi", icon: Wifi },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "ShoppingBag", icon: ShoppingBag },
]

const colorOptions = [
  { name: "Accent", value: "bg-accent" },
  { name: "Secondary", value: "bg-secondary" },
  { name: "Destructive", value: "bg-destructive" },
  { name: "Warning", value: "bg-warning" },
  { name: "Dark", value: "bg-foreground" },
]

const initialCategories: BudgetCategory[] = [
  { id: "1", name: "Food & Dining", icon: Utensils, budget: 600, spent: 450, color: "bg-accent" },
  { id: "2", name: "Transportation", icon: Car, budget: 200, spent: 180, color: "bg-secondary" },
  { id: "3", name: "Housing", icon: Home, budget: 1500, spent: 1500, color: "bg-warning" },
  { id: "4", name: "Entertainment", icon: Film, budget: 150, spent: 120, color: "bg-accent" },
  { id: "5", name: "Utilities", icon: Lightbulb, budget: 250, spent: 220, color: "bg-secondary" },
  { id: "6", name: "Shopping", icon: ShoppingBag, budget: 300, spent: 285, color: "bg-warning" },
]

export default function BudgetPage() {
  const { userProfile } = useDataStore()
  const currency = userProfile?.currency || "EUR"
  const [categories, setCategories] = useState(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: "",
    icon: "Utensils",
    color: "bg-accent",
  })

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0)
  const remaining = totalBudget - totalSpent

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.budget) return
    
    const iconObj = iconOptions.find(i => i.name === newCategory.icon)
    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      icon: iconObj?.icon || Utensils,
      budget: parseFloat(newCategory.budget),
      spent: 0,
      color: newCategory.color,
    }
    setCategories([...categories, category])
    setNewCategory({ name: "", budget: "", icon: "Utensils", color: "bg-accent" })
    setDialogOpen(false)
  }

  const handleEditCategory = () => {
    if (!editingCategory) return
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? editingCategory : cat
    ))
    setEditingCategory(null)
  }

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id))
  }

  const getStatusColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return "text-destructive"
    if (percentage >= 80) return "text-warning"
    return "text-accent"
  }

  const getStatusIcon = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4 text-destructive" />
    if (percentage >= 80) return <AlertTriangle className="h-4 w-4 text-warning" />
    return <CheckCircle2 className="h-4 w-4 text-accent" />
  }

  const exportBudget = () => {
    const data = categories.map(cat => ({
      category: cat.name,
      budget: cat.budget,
      spent: cat.spent,
      remaining: cat.budget - cat.spent,
      percentage: Math.round((cat.spent / cat.budget) * 100)
    }))
    const csv = [
      ["Category", "Budget", "Spent", "Remaining", "Percentage"].join(","),
      ...data.map(row => [row.category, row.budget, row.spent, row.remaining, `${row.percentage}%`].join(","))
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "budget-export.csv"
    a.click()
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Budget</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Manage your spending limits and track progress across every category.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportBudget} className="rounded-full transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle className="font-semibold">Add Budget Category</DialogTitle>
                <DialogDescription className="font-mono text-sm">Create a new category to track your spending</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Category Name</Label>
                  <Input
                    placeholder="e.g., Groceries"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Monthly Budget</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                    className="rounded-lg border border-border font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Icon</Label>
                    <Select
                      value={newCategory.icon}
                      onValueChange={(v) => setNewCategory({ ...newCategory, icon: v })}
                    >
                      <SelectTrigger className="rounded-lg border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-border">
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center gap-2">
                              <icon.icon className="h-4 w-4" />
                              {icon.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Color</Label>
                    <Select
                      value={newCategory.color}
                      onValueChange={(v) => setNewCategory({ ...newCategory, color: v })}
                    >
                      <SelectTrigger className="rounded-lg border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-border">
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 border border-border ${color.value}`} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg border border-border">Cancel</Button>
                <Button onClick={handleAddCategory} className="rounded-lg border border-border shadow-sm">Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
              <PieChart className="h-5 w-5" />
            </div>
            <div className="mt-2 text-3xl font-semibold">{formatCurrency(totalBudget, currency)}</div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">Monthly allocation</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Spent</span>
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="mt-2 text-3xl font-semibold">{formatCurrency(totalSpent, currency)}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-3 bg-muted rounded-lg border border-border">
                <div 
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {Math.round((totalSpent / totalBudget) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border shadow-sm bg-accent text-accent-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-80 text-xs font-medium">Remaining</span>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className={`mt-2 text-3xl font-semibold ${remaining < 0 ? "text-destructive" : ""}`}>
              {formatCurrency(Math.abs(remaining), currency)}
              {remaining < 0 && " over"}
            </div>
            <p className="mt-1 text-sm opacity-80 font-mono">
              {remaining >= 0 ? "Left to spend" : "Over budget"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="rounded-lg border border-border bg-background p-1">
          <TabsTrigger value="all" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">All</TabsTrigger>
          <TabsTrigger value="ontrack" className="font-mono data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">On Track</TabsTrigger>
          <TabsTrigger value="warning" className="font-mono data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">Warning</TabsTrigger>
          <TabsTrigger value="over" className="font-mono data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Over</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const percentage = Math.round((category.spent / category.budget) * 100)
              const Icon = category.icon
              return (
                <Card key={category.id} className="group rounded-xl border border-border shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border border-border ${category.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {formatCurrency(category.spent, currency)} / {formatCurrency(category.budget, currency)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg border border-border">
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-sm font-semibold font-mono ${getStatusColor(category.spent, category.budget)}`}>
                          {percentage}%
                        </span>
                        {getStatusIcon(category.spent, category.budget)}
                      </div>
                      <div className="h-3 rounded-lg border border-border bg-muted">
                        <div
                          className={`h-full transition-all ${category.color}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground font-mono">
                      {category.budget - category.spent >= 0
                        ? `${formatCurrency(category.budget - category.spent, currency)} remaining`
                        : `${formatCurrency(category.spent - category.budget, currency)} over budget`}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="ontrack" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter(cat => (cat.spent / cat.budget) < 0.8)
              .map((category) => {
                const percentage = Math.round((category.spent / category.budget) * 100)
                const Icon = category.icon
                return (
                  <Card key={category.id} className="rounded-xl border border-border shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent bg-accent/10">
                          <Icon className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-lg border border-border">
                              <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-sm font-mono text-accent font-semibold">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="warning" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter(cat => (cat.spent / cat.budget) >= 0.8 && (cat.spent / cat.budget) < 1)
              .map((category) => {
                const percentage = Math.round((category.spent / category.budget) * 100)
                const Icon = category.icon
                return (
                  <Card key={category.id} className="rounded-xl border border-warning shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-warning bg-warning/10">
                          <Icon className="h-6 w-6 text-warning" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-lg border border-border">
                              <div className="h-full bg-warning" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-sm font-mono text-warning font-semibold">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="over" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter(cat => (cat.spent / cat.budget) >= 1)
              .map((category) => {
                const percentage = Math.round((category.spent / category.budget) * 100)
                const Icon = category.icon
                return (
                  <Card key={category.id} className="rounded-xl border border-destructive shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-destructive bg-destructive/10">
                          <Icon className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-lg border border-border">
                              <div className="h-full bg-destructive" style={{ width: `100%` }} />
                            </div>
                            <span className="text-sm font-mono text-destructive font-semibold">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="rounded-xl border border-border shadow-md">
          <DialogHeader>
            <DialogTitle className="font-semibold">Edit Category</DialogTitle>
            <DialogDescription className="font-mono text-sm">Update your budget category settings</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-semibold">Category Name</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="rounded-lg border border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Monthly Budget</Label>
                <Input
                  type="number"
                  value={editingCategory.budget}
                  onChange={(e) => setEditingCategory({ ...editingCategory, budget: parseFloat(e.target.value) || 0 })}
                  className="rounded-lg border border-border font-mono"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)} className="rounded-lg border border-border">Cancel</Button>
            <Button onClick={handleEditCategory} className="rounded-lg border border-border shadow-sm">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
