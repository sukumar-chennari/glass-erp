/**
 * Shared UI copy.
 * Only text that appears across multiple features lives here.
 * Feature-specific labels stay in the feature folder.
 */
export const LABELS = {
  app: {
    name:    'Glass ERP Pro',
    tagline: 'Automobile Glass Management',
  },

  actions: {
    add:        '+ Add',
    save:       'Save',
    cancel:     'Cancel',
    delete:     'Delete',
    edit:       'Edit',
    view:       'View',
    export:     'Export',
    create:     'Create',
    update:     'Update',
    submit:     'Submit',
    back:       'Back',
    next:       'Next',
    confirm:    'Confirm',
    close:      'Close',
    search:     'Search',
    filter:     'Filter',
    reset:      'Reset',
    refresh:    'Refresh',
    print:      'Print',
    download:   'Download PDF',
    shareWhatsApp: 'Share on WhatsApp',
    markPaid:   'Mark as Paid',
  },

  table: {
    noData:      'No records found.',
    loading:     'Loading…',
    rowsPerPage: 'Rows per page',
    of:          'of',
    showing:     'Showing',
    results:     'results',
  },

  form: {
    required:         'This field is required.',
    invalidPhone:     'Enter a valid 10-digit mobile number.',
    invalidGst:       'Enter a valid GST number (15 characters).',
    invalidEmail:     'Enter a valid email address.',
    invalidAmount:    'Enter a valid positive amount.',
    invalidDate:      'Enter a valid date.',
    selectPlaceholder: '— Select —',
    searchPlaceholder: 'Search…',
  },

  modal: {
    confirmDelete: 'Are you sure? This action cannot be undone.',
    unsavedChanges:'You have unsaved changes. Leave anyway?',
  },

  nav: {
    main:       'Menu',
    management: 'Management',
  },

  kpi: {
    vsYesterday:   'vs yesterday',
    vsLastMonth:   'vs last month',
    thisMonth:     'This month',
    today:         'Today',
  },

  status: {
    comingSoon: 'Coming Soon',
    underConstruction: 'This module is under development.',
  },
} as const;
