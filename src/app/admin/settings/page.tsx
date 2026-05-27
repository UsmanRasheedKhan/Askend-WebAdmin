'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { useAdminUser, useUpdateAdminUserMutation, usePlatformSettings, useUpdateSettingsMutation } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { data: adminUser, isLoading: isAdminLoading } = useAdminUser(user?.id);
  const { data: settings, isLoading: isSettingsLoading } = usePlatformSettings();
  const updateAdminUserMutation = useUpdateAdminUserMutation();
  const updateSettingsMutation = useUpdateSettingsMutation();
  
  const [platformName, setPlatformName] = useState('Survey Platform');
  const [currency, setCurrency] = useState('PKR');
  const [stripeKey, setStripeKey] = useState('');
  const [platformFee, setPlatformFee] = useState('10');
  const [reportThreshold, setReportThreshold] = useState('25');
  const [suspensionThreshold, setSuspensionThreshold] = useState('3');

  useEffect(() => {
    if (settings) {
      setPlatformName(settings.platform_name || 'Survey Platform');
      setCurrency(settings.currency || 'PKR');
      setStripeKey(settings.stripe_key || '');
      setPlatformFee(String(settings.platform_fee || '10'));
      setReportThreshold(String(settings.report_threshold || '25'));
      setSuspensionThreshold(String(settings.suspension_threshold || '3'));
    }
  }, [settings]);

  const handleSaveProfile = () => {
    if (!user?.id) {
      toast.error('Unable to update profile without a valid admin session.');
      return;
    }

    updateAdminUserMutation.mutate(
      { userId: user.id, data: { full_name: adminUser?.full_name || '' } }, // This part might be for admin profile name
      {
        onSuccess: () => {
          toast.success('Admin profile updated successfully.');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Unable to update profile.');
        },
      }
    );
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(
      {
        platform_name: platformName,
        currency,
        stripe_key: stripeKey,
        platform_fee: parseFloat(platformFee),
        report_threshold: parseInt(reportThreshold),
        suspension_threshold: parseInt(suspensionThreshold),
      },
      {
        onSuccess: () => {
          toast.success('Platform settings saved successfully.');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Unable to save settings.');
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage platform configuration and preferences.</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Platform Name</Label>
                  <Input
                    id="name"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    disabled={isSettingsLoading}
                    placeholder="Survey Platform"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR (₨)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">Select the base currency for the platform</p>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Settings */}
          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-threshold">Reports for Admin Alert</Label>
                  <Input
                    id="report-threshold"
                    type="number"
                    value={reportThreshold}
                    onChange={(e) => setReportThreshold(e.target.value)}
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Admin will be alerted after this many reports on a survey (default: 25)</p>
                </div>
                <div>
                  <Label htmlFor="suspension-threshold">Auto Suspension Threshold</Label>
                  <Input
                    id="suspension-threshold"
                    type="number"
                    value={suspensionThreshold}
                    onChange={(e) => setSuspensionThreshold(e.target.value)}
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Creator will be auto-suspended after this many downed surveys (default: 3)</p>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stripe-key">Stripe Public Key</Label>
                  <Input
                    id="stripe-key"
                    type="password"
                    placeholder="pk_live_..."
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Your public Stripe key for payment processing</p>
                </div>
                <div>
                  <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                  <Input
                    id="platform-fee"
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Percentage fee charged on survey rewards (default: 10%)</p>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Management */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Manage admin access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => toast('Feature coming soon: Add additional admin users')}
                  variant="outline"
                >
                  Add Admin User
                </Button>
                <div className="space-y-2">
                  {isAdminLoading ? (
                    <div className="text-sm text-muted-foreground">Loading admin information...</div>
                  ) : adminUser ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{adminUser.full_name}</p>
                        <p className="text-sm text-muted-foreground">{adminUser.email}</p>
                      </div>
                      <p className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded">{adminUser.role}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No admin information available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
