
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/context/settings-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useTrades } from '@/context/trades-context';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address.").optional(),
});

const preferencesFormSchema = z.object({
  timezone: z.string(),
  currency: z.string(),
});

const notificationsFormSchema = z.object({
  dailySummary: z.boolean(),
  tradeAlerts: z.boolean(),
  weeklyReport: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;


function SettingsForms() {
  const { toast } = useToast();
  const { settings, setProfile, setPreferences, setNotifications } = useSettings();

  const profileForm = useForm<ProfileFormValues>({ 
    resolver: zodResolver(profileFormSchema),
    defaultValues: settings.profile,
  });
  const preferencesForm = useForm<PreferencesFormValues>({ 
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: settings.preferences
  });
  const notificationsForm = useForm<NotificationsFormValues>({ 
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: settings.notifications
  });

  useEffect(() => {
    if (settings) {
        profileForm.reset(settings.profile);
        preferencesForm.reset(settings.preferences);
        notificationsForm.reset(settings.notifications);
    }
  }, [settings, profileForm, preferencesForm, notificationsForm]);


  const onProfileSubmit = (data: ProfileFormValues) => {
    setProfile(data);
    toast({ title: 'Profile Updated', description: 'Your profile information has been saved.' });
  };
  
  const onPreferencesSubmit = (data: PreferencesFormValues) => {
    setPreferences(data);
    toast({ title: 'Preferences Updated', description: 'Your preferences have been saved.' });
  };

  const onNotificationsSubmit = (data: NotificationsFormValues) => {
    setNotifications(data);
    toast({ title: 'Notifications Updated', description: 'Your notification settings have been saved.' });
  };

  return (
    <>
      <Card>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormItem>
                 <FormLabel>Profile Picture</FormLabel>
                  <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                          <AvatarImage src={settings.profile.avatarUrl} alt="User Avatar" />
                          <AvatarFallback>
                              <User className="h-10 w-10" />
                          </AvatarFallback>
                      </Avatar>
                      <Button type="button" variant="outline">Upload Picture</Button>
                  </div>
               </FormItem>
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save Profile</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <Form {...preferencesForm}>
          <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={preferencesForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="usd">USD - United States Dollar</SelectItem>
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="gbp">GBP - British Pound</SelectItem>
                        <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="inr">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={preferencesForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gmt-5">EST (GMT-5)</SelectItem>
                        <SelectItem value="gmt+0">GMT (GMT+0)</SelectItem>
                        <SelectItem value="gmt+1">CET (GMT+1)</SelectItem>
                        <SelectItem value="gmt+8">SGT (GMT+8)</SelectItem>
                        <SelectItem value="gmt+5.5">IST (GMT+5:30)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save Preferences</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <Form {...notificationsForm}>
          <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={notificationsForm.control}
                name="dailySummary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Daily Summary Email</FormLabel>
                      <FormDescription>Receive a summary of your trading day.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationsForm.control}
                name="tradeAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Trade Alerts</FormLabel>
                      <FormDescription>Get notified for significant trade events.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={notificationsForm.control}
                name="weeklyReport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Weekly Report</FormLabel>
                      <FormDescription>Receive a weekly performance report via email.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save Notifications</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  )
}


export default function SettingsPage() {
    const { isLoading } = useSettings();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>
                <Separator />
                <Card>
                    <CardHeader>
                        <CardTitle><Skeleton className="h-7 w-24" /></CardTitle>
                        <CardDescription><Skeleton className="h-5 w-48" /></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle><Skeleton className="h-7 w-32" /></CardTitle>
                        <CardDescription><Skeleton className="h-5 w-56" /></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Skeleton className="h-10 w-40" />
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>
            <Separator />
            <SettingsForms />
        </div>
    )
}
