'use client';

import {useRef} from 'react';
import {notFound, useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {Textarea} from '@/ui/components/textarea';
import {useToast} from '@/ui/hooks/use-toast';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {cn} from '@/utils/css';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {create} from './action';
import {DynamicIcon} from '@/ui/components/dynamic-icon';

const formSchema = z.object({
  title: z.string().min(1, {message: i18n.t('Title is required')}),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
});

export default function ResourceForm({parent, colors, icons}: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const {toast} = useToast();
  const router = useRouter();
  const {workspaceURI, workspaceURL} = useWorkspace();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '',
      color: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('parent', parent.id);
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('icon', values.icon);
    formData.append('color', values.color);

    const result = await create(formData, workspaceURL);

    if (result.success) {
      toast({
        title: i18n.t('Category created successfully.'),
      });
      router.refresh();
      router.push(
        `${workspaceURI}/resources/categories?id=${result?.data?.id}`,
      );
    } else {
      toast({
        variant: 'destructive',
        title: i18n.t('Error creating category'),
      });
    }
  };

  if (!parent?.id) {
    return notFound();
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Category title')}*</FormLabel>
              <FormControl>
                <Input
                  placeholder={i18n.t('Enter Category title')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>{i18n.t('Parent')}</FormLabel>
          <FormControl>
            <Input
              className="shadow-none h-11 text-black placeholder:text-muted-foreground"
              readOnly
              value={parent?.fileName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Category description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={i18n.t('Enter category description')}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Icon')}</FormLabel>
              <FormControl>
                <div className="border rounded-lg p-6 flex gap-6 flex-wrap">
                  {icons.map((icon: string, i: string) => {
                    return (
                      <DynamicIcon
                        key={i}
                        icon={icon}
                        className={cn(
                          'h-6 w-6 text-main-black shrink-0 cursor-pointer',
                          {
                            'text-green-700': field.value === icon,
                          },
                        )}
                        onClick={() => field.onChange(icon)}
                      />
                    );
                  })}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Color')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={i18n.t('Select a color')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colors.map((color: any) => (
                    <SelectItem value={color.value} key={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" variant="success">
          {i18n.t('Add new category')}
        </Button>
      </form>
    </Form>
  );
}
