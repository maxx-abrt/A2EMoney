"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore } from "@/lib/data-store"
import {
  Bell,
  Building2,
  CreditCard,
  Download,
  Globe,
  Key,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  Upload,
  User,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const { userProfile, updateUserProfile } = useDataStore()
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    businessName: userProfile?.businessName || "",
    businessType: userProfile?.businessType || "",
    taxId: userProfile?.taxId || "",
    address: userProfile?.address || "",
    currency: userProfile?.currency || "EUR",
    language: "en",
    theme: "light",
    notifications: {
      email: true,
      invoiceReminders: true,
      budgetAlerts: true,
      weeklyReport: false,
    },
    privacy: {
      twoFactor: false,
      sessionTimeout: "30",
    },
  })

  const handleSave = () => {
    updateUserProfile({
      name: settings.name,
      email: settings.email,
      businessName: settings.businessName,
      businessType: settings.businessType,
      taxId: settings.taxId,
      address: settings.address,
      currency: settings.currency,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportAllData = () => {
    const data = {
      profile: userProfile,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "finflow-export.json"
    a.click()
  }

  const isBusiness = userProfile?.type !== "individual"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
          <p className="text-muted-foreground font-mono text-sm">Manage your account and preferences</p>
        </div>
        <Button 
          onClick={handleSave}
          className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Save className="mr-2 h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="rounded-lg border border-border bg-background p-1 flex-wrap h-auto">
          <TabsTrigger value="profile" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          {isBusiness && (
            <TabsTrigger value="business" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Building2 className="mr-2 h-4 w-4" />
              Business
            </TabsTrigger>
          )}
          <TabsTrigger value="preferences" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Palette className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Download className="mr-2 h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Personal Information</CardTitle>
              <CardDescription className="font-mono text-xs">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold">Full Name</Label>
                  <Input
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Email Address</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="rounded-lg border border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Address</Label>
                <Textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Your address..."
                  className="rounded-lg border border-border"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        {isBusiness && (
          <TabsContent value="business" className="space-y-6">
            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Business Information</CardTitle>
                <CardDescription className="font-mono text-xs">Update your business details for invoices and legal documents</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Business Name</Label>
                    <Input
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      className="rounded-lg border border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Business Type</Label>
                    <Select
                      value={settings.businessType}
                      onValueChange={(v) => setSettings({ ...settings, businessType: v })}
                    >
                      <SelectTrigger className="rounded-lg border border-foreground">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-foreground">
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="association">Association</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Tax ID / VAT Number</Label>
                    <Input
                      value={settings.taxId}
                      onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                      placeholder="e.g., FR12345678901"
                      className="rounded-lg border border-border font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Registration Number</Label>
                    <Input
                      placeholder="SIRET, SIREN, etc."
                      className="rounded-lg border border-border font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Business Address</Label>
                  <Textarea
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Your business address..."
                    className="rounded-lg border border-border"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Invoice Settings</CardTitle>
                <CardDescription className="font-mono text-xs">Customize your invoice appearance</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Invoice Prefix</Label>
                    <Input
                      placeholder="INV-"
                      className="rounded-lg border border-border font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Default Payment Terms</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="rounded-lg border border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-foreground">
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="45">45 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Default Invoice Notes</Label>
                  <Textarea
                    placeholder="Thank you for your business..."
                    className="rounded-lg border border-border"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Regional Settings</CardTitle>
              <CardDescription className="font-mono text-xs">Configure your locale and currency</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Currency
                  </Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(v) => setSettings({ ...settings, currency: v })}
                  >
                    <SelectTrigger className="rounded-lg border border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-foreground">
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </Label>
                  <Select
                    value={settings.language}
                    onValueChange={(v) => setSettings({ ...settings, language: v })}
                  >
                    <SelectTrigger className="rounded-lg border border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-foreground">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Appearance</CardTitle>
              <CardDescription className="font-mono text-xs">Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="font-bold">Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={settings.theme === "light" ? "default" : "outline"}
                    onClick={() => setSettings({ ...settings, theme: "light" })}
                    className="flex-1 rounded-lg border border-border"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={settings.theme === "dark" ? "default" : "outline"}
                    onClick={() => setSettings({ ...settings, theme: "dark" })}
                    className="flex-1 rounded-lg border border-border"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Notification Preferences</CardTitle>
              <CardDescription className="font-mono text-xs">Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Email Notifications</p>
                  <p className="text-sm text-muted-foreground font-mono">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Invoice Reminders</p>
                  <p className="text-sm text-muted-foreground font-mono">Get notified about overdue invoices</p>
                </div>
                <Switch
                  checked={settings.notifications.invoiceReminders}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, invoiceReminders: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Budget Alerts</p>
                  <p className="text-sm text-muted-foreground font-mono">Alert when approaching budget limits</p>
                </div>
                <Switch
                  checked={settings.notifications.budgetAlerts}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, budgetAlerts: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Weekly Summary</p>
                  <p className="text-sm text-muted-foreground font-mono">Receive weekly financial summary</p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, weeklyReport: v }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Security Settings</CardTitle>
              <CardDescription className="font-mono text-xs">Protect your account</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={settings.privacy.twoFactor}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, twoFactor: v }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Session Timeout</Label>
                <Select
                  value={settings.privacy.sessionTimeout}
                  onValueChange={(v) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, sessionTimeout: v }
                  })}
                >
                  <SelectTrigger className="rounded-lg border border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-foreground">
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="rounded-lg border border-border">
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Export Data</CardTitle>
              <CardDescription className="font-mono text-xs">Download your financial data</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Export all your data including transactions, invoices, expenses, and documents.
              </p>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={exportAllData}
                  className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Import Data</CardTitle>
              <CardDescription className="font-mono text-xs">Import data from other sources</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Import transactions, invoices, or other financial data from CSV or JSON files.
              </p>
              <Button 
                variant="outline" 
                className="rounded-lg border border-border shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import File
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-destructive shadow-brutal">
            <CardHeader className="border-b-2 border-destructive">
              <CardTitle className="font-semibold text-destructive">Danger Zone</CardTitle>
              <CardDescription className="font-mono text-xs">Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button 
                variant="outline" 
                className="rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
