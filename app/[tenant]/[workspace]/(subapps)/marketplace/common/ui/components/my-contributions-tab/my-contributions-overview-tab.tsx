import {Skeleton} from '@/ui/components/skeleton';
import {Swipe} from '../swipe/swipe';

const stats = [
  {
    label: 'Lifetime revenue',
    value: '$42 240',
    change: '+15.8% vs last month',
    icon: '💰',
    bgColor: 'bg-success/15',
  },
  {
    label: 'App sales',
    value: '287',
    change: '+12.4% vs last month',
    icon: '🛍️',
    bgColor: 'bg-palette-amber-light',
  },
  {
    label: 'Skill installs',
    value: '15 630',
    change: '+8.2% vs last month',
    icon: '📥',
    bgColor: 'bg-palette-blue-light',
  },
  {
    label: 'Avg. rating',
    value: '4.6',
    change: '+0.1 vs last month',
    icon: '⭐',
    bgColor: 'bg-palette-pink-light',
  },
];

const pendingActions = [
  {
    id: 1,
    title: 'Custom CRM Boost is in review',
    description: 'Submitted 2 hours ago',
    icon: '⚠️',
    bgColor: 'bg-palette-amber-light',
  },
  {
    id: 2,
    title: 'Workflow Replay draft',
    description: 'Add screenshots & description',
    icon: '📝',
    bgColor: 'bg-palette-purple-light',
    hasAction: true,
  },
  {
    id: 3,
    title: '3 new reviews on Studio Form Builder',
    description: 'Average 4.5★',
    icon: '🔔',
    bgColor: 'bg-palette-red-light',
  },
];

const recentActivity = [
  {
    id: 1,
    initials: 'S',
    name: 'Sara K.',
    action: 'left a 4★ review on',
    product: 'Studio Form Builder Pro',
    time: '2h ago',
    bgColor: 'bg-palette-amber-light',
  },
  {
    id: 2,
    initials: 'P',
    name: 'Pierre L.',
    action: 'downloaded',
    product: 'Data Quality Linter v1.4.0',
    time: '5h ago',
    bgColor: 'bg-palette-blue-light',
  },
  {
    id: 3,
    initials: 'T',
    name: 'Tom B.',
    action: 'purchased',
    product: 'Helpdesk Boost · $99',
    time: '8h ago',
    bgColor: 'bg-success/15',
  },
  {
    id: 4,
    initials: 'É',
    name: 'Émilie R.',
    action: 'left a 5★ review on',
    product: 'Studio Form Builder Pro',
    time: '1d ago',
    bgColor: 'bg-palette-pink-light',
  },
];

export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats Carousel */}
      <Swipe
        className="!w-[284px] !h-[160px]"
        items={stats.map(stat => (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <div className={`${stat.bgColor} rounded-lg p-2`}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-success-dark">{stat.change}</div>
            </div>
          </div>
        ))}
      />

      {/* Revenue Chart and Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">
              Revenue · last 12 months
            </h3>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              View details →
            </button>
          </div>
          <Skeleton className="w-full h-64 rounded-lg" />
        </div>

        {/* Pending Actions */}
        <div className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
          <h3 className="text-xl font-semibold text-foreground">
            Pending actions
          </h3>
          <div className="space-y-3">
            {pendingActions.map(action => (
              <div
                key={action.id}
                className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div
                    className={`${action.bgColor} rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {action.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                  {action.hasAction && (
                    <button className="ml-2 flex-shrink-0">→</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Recent activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map(activity => (
            <div
              key={activity.id}
              className="border-b border-border pb-4 last:border-0 last:pb-0 flex items-center gap-4">
              <div
                className={`${activity.bgColor} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm`}>
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">
                  <span className="font-bold">{activity.name}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    {activity.action}{' '}
                  </span>
                  <span className="font-bold text-primary">
                    {activity.product}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
