"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Euro,
  DollarSign,
  PoundSterling,
  PiggyBank,
  Briefcase,
  Receipt,
  FileText,
  Scale,
  BarChart3,
  Users,
  User,
  Wallet,
  Sparkles,
  BookOpen,
  FolderOpen,
} from "lucide-react"
import { useDataStore } from "@/lib/data-store"

type ProfileType = "individual" | "company" | "association" | null
type Step = "profile" | "details" | "features" | "complete"

const currencies = [
  { code: "USD", symbol: "$", icon: DollarSign, name: "US Dollar" },
  { code: "EUR", symbol: "€", icon: Euro, name: "Euro" },
  { code: "GBP", symbol: "£", icon: PoundSterling, name: "British Pound" },
]

const individualFeatures = [
  { id: "budgeting", name: "Budget Tracking", icon: PiggyBank, description: "Set and monitor spending limits" },
  { id: "expenses", name: "Expense Tracking", icon: Receipt, description: "Log and categorize expenses" },
  { id: "book", name: "Financial Book", icon: BookOpen, description: "Smart interconnected ledger" },
  { id: "reports", name: "Financial Reports", icon: BarChart3, description: "Visual spending insights" },
  { id: "documents", name: "Document Storage", icon: FolderOpen, description: "100MB free storage" },
]

const businessFeatures = [
  { id: "invoicing", name: "Invoicing", icon: FileText, description: "Create and send invoices" },
  { id: "projects", name: "Project Budgets", icon: Briefcase, description: "Track project finances" },
  { id: "expenses", name: "Expense Management", icon: Receipt, description: "Team expense tracking" },
  { id: "book", name: "Financial Book", icon: BookOpen, description: "Smart interconnected ledger" },
  { id: "legal", name: "Legal Compliance", icon: Scale, description: "Regulatory documentation" },
  { id: "reports", name: "Financial Reports", icon: BarChart3, description: "Business analytics" },
  { id: "documents", name: "Document Storage", icon: FolderOpen, description: "100MB free storage" },
  { id: "team", name: "Team Management", icon: Users, description: "Multi-user access" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get("type") as ProfileType
  const { updateUserProfile } = useDataStore()

  const [step, setStep] = useState<Step>(initialType ? "details" : "profile")
  const [profileType, setProfileType] = useState<ProfileType>(initialType)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organizationName: "",
    currency: "EUR",
    selectedFeatures: [] as string[],
  })

  const getProgress = () => {
    switch (step) {
      case "profile": return 25
      case "details": return 50
      case "features": return 75
      case "complete": return 100
      default: return 0
    }
  }

  const handleProfileSelect = (type: ProfileType) => {
    setProfileType(type)
    setStep("details")
  }

  const handleDetailsNext = () => {
    setStep("features")
  }

  const handleFeaturesNext = () => {
    setStep("complete")
  }

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter(f => f !== featureId)
        : [...prev.selectedFeatures, featureId]
    }))
  }

  const handleComplete = () => {
    updateUserProfile({
      name: formData.name,
      email: formData.email,
      type: profileType || "individual",
      businessName: formData.organizationName,
      currency: formData.currency,
    })
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-accent">
              <Wallet className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight">FINFLOW</span>
          </Link>
          <div className="text-sm text-muted-foreground font-mono">
            STEP {step === "profile" ? 1 : step === "details" ? 2 : step === "features" ? 3 : 4}/4
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <div className="h-4 rounded-lg border border-border bg-muted">
          <div 
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Step 1: Profile Selection */}
        {step === "profile" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Welcome to Finflow</h1>
              <p className="mt-2 text-lg text-muted-foreground font-mono">
                Let&apos;s set up your account. First, tell us who you are.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <Card
                className={`cursor-pointer transition-all rounded-lg border border-border shadow-sm hover:-translate-y-1 ${
                  profileType === "individual" ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => handleProfileSelect("individual")}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border ${
                    profileType === "individual" ? "bg-background" : "bg-secondary"
                  }`}>
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black">Individual</h3>
                  <p className="mt-2 text-sm opacity-80 font-mono">
                    Personal finance tracking
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all rounded-lg border border-border shadow-sm hover:-translate-y-1 ${
                  profileType === "company" ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => handleProfileSelect("company")}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border ${
                    profileType === "company" ? "bg-background" : "bg-secondary"
                  }`}>
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black">Company</h3>
                  <p className="mt-2 text-sm opacity-80 font-mono">
                    Business finance management
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all rounded-lg border border-border shadow-sm hover:-translate-y-1 ${
                  profileType === "association" ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => handleProfileSelect("association")}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border ${
                    profileType === "association" ? "bg-background" : "bg-secondary"
                  }`}>
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black">Association</h3>
                  <p className="mt-2 text-sm opacity-80 font-mono">
                    Non-profit organization
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === "details" && (
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setStep("profile")}
              className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight">
                {profileType === "individual" ? "Personal Details" : "Organization Details"}
              </h1>
              <p className="mt-2 text-muted-foreground font-mono">
                Tell us a bit more about {profileType === "individual" ? "yourself" : "your organization"}.
              </p>
            </div>

            <Card className="rounded-lg border border-border shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleDetailsNext(); }} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="rounded-lg border border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="rounded-lg border border-border"
                    />
                  </div>

                  {profileType !== "individual" && (
                    <div className="space-y-2">
                      <Label htmlFor="org" className="font-bold">Organization Name</Label>
                      <Input
                        id="org"
                        placeholder={profileType === "company" ? "Acme Inc." : "My Association"}
                        value={formData.organizationName}
                        onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                        required
                        className="rounded-lg border border-border"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-bold">Primary Currency</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, currency: currency.code }))}
                          className={`flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-all ${
                            formData.currency === currency.code 
                              ? "bg-accent text-accent-foreground shadow-sm -translate-y-0.5" 
                              : "hover:bg-muted"
                          }`}
                        >
                          <currency.icon className="h-5 w-5" />
                          <span className="text-sm font-black">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Feature Selection */}
        {step === "features" && (
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setStep("details")}
              className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight">Customize Your Experience</h1>
              <p className="mt-2 text-muted-foreground font-mono">
                Select the features you want to use. You can always change this later.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(profileType === "individual" ? individualFeatures : businessFeatures).map((feature) => (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all rounded-lg border border-border ${
                    formData.selectedFeatures.includes(feature.id) 
                      ? "bg-accent text-accent-foreground shadow-sm -translate-y-0.5" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleFeature(feature.id)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border ${
                      formData.selectedFeatures.includes(feature.id) ? "bg-background text-foreground" : "bg-secondary"
                    }`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black">{feature.name}</h3>
                        {formData.selectedFeatures.includes(feature.id) && (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>
                      <p className="mt-1 text-sm opacity-80 font-mono">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleFeaturesNext} 
                disabled={formData.selectedFeatures.length === 0}
                className="rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-lg border border-border bg-accent">
              <Sparkles className="h-12 w-12 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">You&apos;re all set!</h1>
            <p className="mt-4 text-lg text-muted-foreground font-mono">
              Your Finflow account is ready. Let&apos;s start managing your finances.
            </p>

            <Card className="mt-8 text-left rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-black">Account Summary</CardTitle>
                <CardDescription className="font-mono text-xs">Review your setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono">Account Type</span>
                  <span className="font-black capitalize">{profileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono">Name</span>
                  <span className="font-bold">{formData.name}</span>
                </div>
                {profileType !== "individual" && formData.organizationName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-mono">Organization</span>
                    <span className="font-bold">{formData.organizationName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono">Currency</span>
                  <span className="font-black">{formData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono">Features</span>
                  <span className="font-bold">{formData.selectedFeatures.length} selected</span>
                </div>
                <div className="flex justify-between border-t-2 border-foreground pt-4">
                  <span className="text-muted-foreground font-mono">Free Storage</span>
                  <span className="font-black text-accent">100 MB</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="mt-8 w-full rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all" 
              onClick={handleComplete}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
