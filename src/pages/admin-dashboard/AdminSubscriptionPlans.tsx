import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { SubscriptionPlan, SubscriptionTier, TargetAudience } from "@/types/subscription";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Plus, Edit2, Trash2, Crown, Users, Briefcase, Loader2 } from "lucide-react";

const defaultPlanForm = {
  name: "",
  description: "",
  target_audience: "customer" as TargetAudience,
  tier: "basic" as SubscriptionTier,
  monthly_price: 0,
  features: [] as string[],
  priority_listing_boost: 0,
  commission_discount: 0,
  includes_verification_badge: false,
  includes_analytics_access: false,
  booking_discount_percent: 0,
  priority_booking: false,
  premium_support: false,
  express_booking: false,
  is_active: true,
};

const AdminSubscriptionPlans = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const { formatCurrency } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<TargetAudience>("customer");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState(defaultPlanForm);
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

  const filteredPlans = plans.filter(p => p.target_audience === activeTab);

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description || "",
        target_audience: plan.target_audience,
        tier: plan.tier,
        monthly_price: plan.monthly_price,
        features: plan.features,
        priority_listing_boost: plan.priority_listing_boost,
        commission_discount: plan.commission_discount,
        includes_verification_badge: plan.includes_verification_badge,
        includes_analytics_access: plan.includes_analytics_access,
        booking_discount_percent: plan.booking_discount_percent,
        priority_booking: plan.priority_booking,
        premium_support: plan.premium_support,
        express_booking: plan.express_booking,
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({ ...defaultPlanForm, target_audience: activeTab });
    }
    setIsDialogOpen(true);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setPlanForm(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm);
      } else {
        await createPlan(planForm);
      }
      setIsDialogOpen(false);
      setPlanForm(defaultPlanForm);
      setEditingPlan(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic': return 'secondary';
      case 'pro': return 'default';
      case 'premium': return 'destructive';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">Manage membership plans for cleaners and customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              <DialogDescription>
                {editingPlan ? "Update the subscription plan details" : "Add a new subscription plan"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Pro Plan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={planForm.monthly_price}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select
                    value={planForm.target_audience}
                    onValueChange={(value: TargetAudience) => setPlanForm(prev => ({ ...prev, target_audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={planForm.tier}
                    onValueChange={(value: SubscriptionTier) => setPlanForm(prev => ({ ...prev, tier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the plan benefits..."
                />
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  />
                  <Button type="button" onClick={handleAddFeature} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {planForm.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {feature}
                      <button onClick={() => handleRemoveFeature(index)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              {planForm.target_audience === 'cleaner' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Cleaner Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority Listing Boost (%)</Label>
                        <Input
                          type="number"
                          value={planForm.priority_listing_boost}
                          onChange={(e) => setPlanForm(prev => ({ ...prev, priority_listing_boost: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Commission Discount (%)</Label>
                        <Input
                          type="number"
                          value={planForm.commission_discount}
                          onChange={(e) => setPlanForm(prev => ({ ...prev, commission_discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Verification Badge</Label>
                      <Switch
                        checked={planForm.includes_verification_badge}
                        onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, includes_verification_badge: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Analytics Access</Label>
                      <Switch
                        checked={planForm.includes_analytics_access}
                        onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, includes_analytics_access: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {planForm.target_audience === 'customer' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Customer Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Booking Discount (%)</Label>
                      <Input
                        type="number"
                        value={planForm.booking_discount_percent}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, booking_discount_percent: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Priority Booking</Label>
                      <Switch
                        checked={planForm.priority_booking}
                        onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, priority_booking: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Premium Support</Label>
                      <Switch
                        checked={planForm.premium_support}
                        onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, premium_support: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Express Booking</Label>
                      <Switch
                        checked={planForm.express_booking}
                        onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, express_booking: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <Label>Plan Active</Label>
                <Switch
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving || !planForm.name}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TargetAudience)}>
        <TabsList>
          <TabsTrigger value="customer" className="gap-2">
            <Users className="h-4 w-4" />
            Customer Plans
          </TabsTrigger>
          <TabsTrigger value="cleaner" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Cleaner Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Key Benefits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(plan.tier)}>
                        {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(plan.monthly_price)}/mo
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.features.slice(0, 2).map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(plan)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPlanToDelete(plan);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No {activeTab} plans found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone and will affect all users subscribed to this plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionPlans;
