window.homeManagementSampleData = {
  members: {
    mom: { name: 'Mom', role: 'parent', color: '#f4d9e2', colorClass: 'profile-mom', displayOrder: 1, active: true },
    dad: { name: 'Dad', role: 'parent', color: '#d6e5f3', colorClass: 'profile-dad', displayOrder: 2, active: true },
    'child-1': { name: 'Child 1', role: 'child', color: '#f5dfbb', colorClass: 'profile-child-one', displayOrder: 3, active: true },
    'child-2': { name: 'Child 2', role: 'child', color: '#dcd8f2', colorClass: 'profile-child-two', displayOrder: 4, active: true },
    'child-3': { name: 'Child 3', role: 'child', color: '#d5eadb', colorClass: 'profile-child-three', displayOrder: 5, active: true },
    toddler: { name: 'Toddler', role: 'child', color: '#f4e6ae', colorClass: 'profile-toddler', displayOrder: 6, active: true }
  },
  overrides: [
    {
      choreId: 'clean-out-fridge',
      date: '2026-08-19',
      assignedTo: 'child-2',
      skipped: false
    },
    {
      choreId: 'vacuum-under-dining-table',
      date: '2026-08-19',
      assignedTo: null,
      skipped: true
    }
  ],
  chores: [
    {
      id: 'unload-dishwasher',
      name: 'Unload dishwasher',
      room: 'Kitchen',
      defaultOwner: 'child-1',
      frequency: 'daily',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'wipe-dining-table',
      name: 'Wipe dining table',
      room: 'Dining Area',
      defaultOwner: 'child-2',
      frequency: 'daily',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'vacuum-under-dining-table',
      name: 'Vacuum under dining table',
      room: 'Dining Area',
      defaultOwner: 'child-3',
      frequency: 'daily',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'put-toys-away',
      name: 'Put toys away',
      room: 'Living Room / Family Room',
      defaultOwner: 'toddler',
      frequency: 'daily',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'review-meal-plan',
      name: 'Review meal plan',
      room: 'Household Admin',
      defaultOwner: 'mom',
      frequency: 'weekdays',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'kitchen-close',
      name: 'Kitchen close',
      room: 'Kitchen',
      defaultOwner: 'child-1',
      frequency: 'daily',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'take-out-recycling',
      name: 'Take out recycling',
      room: 'Whole House',
      defaultOwner: 'dad',
      frequency: 'weekends',
      dayOfWeek: null,
      dayOfMonth: null,
      active: true,
      familyReset: true,
      notes: null
    },
    {
      id: 'clean-primary-bathroom',
      name: 'Clean primary bathroom',
      room: 'Primary Bathroom',
      defaultOwner: 'mom',
      frequency: 'weekly',
      dayOfWeek: 2,
      dayOfMonth: null,
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'wash-bedding',
      name: 'Wash bedding',
      room: 'Whole House',
      defaultOwner: 'dad',
      frequency: 'every-2-weeks',
      dayOfWeek: 3,
      dayOfMonth: null,
      recurrenceStartDate: '2026-08-19',
      active: true,
      familyReset: false,
      notes: null
    },
    {
      id: 'clean-out-fridge',
      name: 'Clean out fridge',
      room: 'Kitchen',
      defaultOwner: 'mom',
      frequency: 'monthly',
      dayOfWeek: null,
      dayOfMonth: 19,
      active: true,
      familyReset: false,
      notes: null
    }
  ]
};
