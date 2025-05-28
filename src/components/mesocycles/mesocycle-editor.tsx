'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const mesocycleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  weeks: z
    .number()
    .min(1, 'Must be at least 1 week')
    .max(52, 'Maximum 52 weeks'),
  startDate: z.date({ required_error: 'Start date is required' }),
});

type MesocycleFormData = z.infer<typeof mesocycleSchema>;

export function MesocycleEditor({ mesocycleId }: { mesocycleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<MesocycleFormData>({
    resolver: zodResolver(mesocycleSchema),
    defaultValues: {
      title: '',
      weeks: 4,
      startDate: new Date(),
    },
  });

  useEffect(() => {
    const fetchMesocycle = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mesocycles')
        .select('*')
        .eq('id', mesocycleId)
        .single();

      if (error) {
        console.error('Failed to fetch mesocycle:', error);
        toast.error('Could not load mesocycle');
        router.push('/dashboard');
        return;
      }

      form.reset({
        title: data.title,
        weeks: data.weeks,
        startDate: new Date(data.start_date),
      });
      setLoading(false);
    };

    fetchMesocycle();
  }, [mesocycleId, form, router]);

  const onSubmit = async (data: MesocycleFormData) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('mesocycles')
      .update({
        title: data.title,
        weeks: data.weeks,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
      })
      .eq('id', mesocycleId);

    if (error) {
      console.error('Failed to update mesocycle:', error);
      toast.error('Failed to save mesocycle');
    } else {
      toast.success('Mesocycle updated');
      router.push('/dashboard');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Mesocycle</CardTitle>
            <CardDescription>Update your mesocycle details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesocycle Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hypertrophy Block" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (weeks)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
