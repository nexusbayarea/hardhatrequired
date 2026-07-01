// Legacy: Grease trap outreach campaign sequence — preserved for future use
export const GREASE_TRAP_OUTREACH = [
  {
    stepNumber: 1,
    channel: 'email',
    delayHours: 0,
    templateId: 'grease_intro',
    subject: 'Grease trap compliance check for {{companyName}}',
    body: `Hi {{firstName}},\n\nWith regulations tightening on grease trap maintenance, I wanted to reach out. We help restaurants stay compliant at 30% below market rates.\n\nCan I send over a quick compliance checklist?\n\nBest,\n[Your Name]`,
  },
  {
    stepNumber: 2,
    channel: 'sms',
    delayHours: 48,
    templateId: 'grease_sms',
    body: `{{firstName}}, this is [Name] — sent you an email about grease trap compliance. Happy to send the checklist via text too. Reply YES or STOP.`,
  },
];
