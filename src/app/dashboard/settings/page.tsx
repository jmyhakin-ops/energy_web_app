"use client"

import { useState } from "react"
import { Building2, Bell, Shield, Smartphone, Database, Save, CheckCircle, User, Palette, Globe } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600">{icon}</div>
                    <div>
                        <h3 className="font-bold text-gray-900">{title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-normal">{description}</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (val: boolean) => void; label: string }) {
    return (
        <label className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm text-gray-700 font-medium">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-6' : 'left-1'}`} />
            </button>
        </label>
    )
}

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        companyName: "Energy Solutions Ltd",
        companyEmail: "info@energy.co.ke",
        companyPhone: "+254700000000",
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        lowStockAlerts: true,
        mpesaTillNumber: "123456",
        mpesaShortCode: "174379",
        mpesaPasskey: "••••••••••••",
        autoBackup: true,
        maintenanceMode: false,
        debugMode: false,
    })

    const handleSave = () => {
        toast.loading("Saving...")
        setTimeout(() => {
            toast.dismiss()
            toast.success("Saved!", "Changes applied")
        }, 1500)
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">⚙️ Settings</h1>
                        <p className="text-sm text-gray-500">Manage your preferences</p>
                    </div>
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4" /> Save Changes
                    </Button>
                </div>

                {/* Company Settings */}
                <SettingsSection icon={<Building2 className="w-5 h-5" />} title="Company Info" description="Your organization details">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={settings.companyEmail}
                                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={settings.companyPhone}
                                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection icon={<Bell className="w-5 h-5" />} title="Notifications" description="How you receive alerts">
                    <div className="space-y-3">
                        <Toggle label="📧 Email Notifications" checked={settings.emailNotifications} onChange={(val) => setSettings({ ...settings, emailNotifications: val })} />
                        <Toggle label="📱 SMS Notifications" checked={settings.smsNotifications} onChange={(val) => setSettings({ ...settings, smsNotifications: val })} />
                        <Toggle label="🔔 Push Notifications" checked={settings.pushNotifications} onChange={(val) => setSettings({ ...settings, pushNotifications: val })} />
                        <Toggle label="⏰ Shift Reminders" checked={settings.shiftReminders} onChange={(val) => setSettings({ ...settings, shiftReminders: val })} />
                        <Toggle label="⚠️ Low Stock Alerts" checked={settings.lowStockAlerts} onChange={(val) => setSettings({ ...settings, lowStockAlerts: val })} />
                    </div>
                </SettingsSection>

                {/* M-Pesa */}
                <SettingsSection icon={<Smartphone className="w-5 h-5" />} title="M-Pesa" description="Payment integration">
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-2 text-green-700 mb-1">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium text-sm">Connected</span>
                            </div>
                            <p className="text-xs text-green-600">M-Pesa integration is active</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Till Number</label>
                                <input type="text" value={settings.mpesaTillNumber} onChange={(e) => setSettings({ ...settings, mpesaTillNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Short Code</label>
                                <input type="text" value={settings.mpesaShortCode} onChange={(e) => setSettings({ ...settings, mpesaShortCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* System */}
                <SettingsSection icon={<Database className="w-5 h-5" />} title="System" description="Advanced settings">
                    <div className="space-y-3">
                        <Toggle label="☁️ Auto Backups" checked={settings.autoBackup} onChange={(val) => setSettings({ ...settings, autoBackup: val })} />
                        <Toggle label="🔧 Maintenance Mode" checked={settings.maintenanceMode} onChange={(val) => setSettings({ ...settings, maintenanceMode: val })} />
                        <Toggle label="🐛 Debug Mode" checked={settings.debugMode} onChange={(val) => setSettings({ ...settings, debugMode: val })} />
                    </div>
                </SettingsSection>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                            <Shield className="w-5 h-5" /> Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50 rounded-xl">
                            <div>
                                <p className="font-medium text-red-700 text-sm">Delete All Data</p>
                                <p className="text-xs text-red-500">Cannot be undone</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => toast.warning("Cancelled", "Action cancelled")}>
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
