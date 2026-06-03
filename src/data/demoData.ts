import type { Customer } from '../types';

export type DemoTemplate = 'cooperative' | 'hostile';

export interface DemoEntry {
  speaker: 'agent' | 'customer';
  text: string;
  delay: number;
}

export const demoCustomer: Customer = {
  name: 'James Mwangi',
  phone: '+254 712 345 678',
  accountNumber: 'ACC-2024-0789',
  debtAmount: 45000,
};

export const hostileCustomer: Customer = {
  name: 'Sarah Wanjiku',
  phone: '+254 723 456 789',
  accountNumber: 'ACC-2023-1456',
  debtAmount: 78000,
};

const cooperativeScript: DemoEntry[] = [
  {
    speaker: 'agent',
    text: 'Hello, am I speaking with James Mwangi?',
    delay: 1000,
  },
  {
    speaker: 'customer',
    text: 'Yes, this is James. Who\'s speaking?',
    delay: 3000,
  },
  {
    speaker: 'agent',
    text: 'Good morning Mr. Mwangi. This is Mary from CreditCare Services. I\'m calling regarding your outstanding account balance of KES 45,000. How are you doing today?',
    delay: 5000,
  },
  {
    speaker: 'customer',
    text: 'Ah, I was expecting this call. To be honest, things have been really difficult lately. I lost my job three months ago.',
    delay: 7000,
  },
  {
    speaker: 'agent',
    text: 'I\'m very sorry to hear about your job loss, Mr. Mwangi. That must be very challenging. I appreciate you being open with me about your situation.',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'Yes, it\'s been tough. I\'ve been looking for work but nothing yet. I want to pay my debt but I simply can\'t afford the full amount right now.',
    delay: 6500,
  },
  {
    speaker: 'agent',
    text: 'I completely understand, and I want you to know we\'re here to help. We have a hardship assistance program that offers flexible payment plans. Could I tell you more about it?',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'Really? That would be helpful. What kind of payment plan are we looking at?',
    delay: 4000,
  },
  {
    speaker: 'agent',
    text: 'Based on your situation, we could set up a monthly payment plan. For example, you could pay KES 5,000 per month for the next 9 months. Would that be manageable?',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'KES 5,000 a month... I think I can manage that. Let me check my budget. Yes, I can commit to KES 5,000 per month.',
    delay: 5000,
  },
  {
    speaker: 'agent',
    text: 'That\'s great, Mr. Mwangi! I\'m glad we could find a solution that works for you. The first payment would be due on the 15th of this month. Shall I send you the M-Pesa payment details?',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'Yes, please send the M-Pesa Paybill. I\'ll make the first payment on the 15th as agreed. Thank you so much for working with me on this.',
    delay: 5000,
  },
  {
    speaker: 'agent',
    text: 'You\'re welcome, Mr. Mwangi. I\'ll send the M-Pesa details to your phone right away. Just to confirm: KES 5,000 on the 15th of each month for 9 months. We\'ll also send you monthly reminders. Is there anything else I can help you with?',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'No, that covers everything. Thank you for understanding my situation and helping me find a way forward. I appreciate it.',
    delay: 4000,
  },
  {
    speaker: 'agent',
    text: 'It\'s my pleasure, Mr. Mwangi. We\'ll get through this together. Have a great day!',
    delay: 3000,
  },
];

const hostileScript: DemoEntry[] = [
  {
    speaker: 'agent',
    text: 'Good afternoon, am I speaking with Sarah Wanjiku?',
    delay: 1000,
  },
  {
    speaker: 'customer',
    text: 'Who is this? Why are you calling me?',
    delay: 2500,
  },
  {
    speaker: 'agent',
    text: 'This is Mary from CreditCare Services, Ms. Wanjiku. I\'m calling regarding your outstanding account balance of KES 78,000.',
    delay: 4000,
  },
  {
    speaker: 'customer',
    text: 'Oh, another debt collector. I\'m tired of you people harassing me! This debt is not even mine!',
    delay: 3000,
  },
  {
    speaker: 'agent',
    text: 'I understand you\'re frustrated, Ms. Wanjiku, and I apologise for any inconvenience. Could you help me understand which part of the account you\'re disputing?',
    delay: 5000,
  },
  {
    speaker: 'customer',
    text: 'I already told your company! This is ridiculous. I disputed this months ago and you keep calling. Don\'t you people listen? This is harassment!',
    delay: 4000,
  },
  {
    speaker: 'agent',
    text: 'I hear your frustration and I want to help resolve this. Let me check the notes on your account regarding the dispute. I apologise that this hasn\'t been handled properly before.',
    delay: 5000,
  },
  {
    speaker: 'customer',
    text: 'You\'re just going to say the same thing as the last person. I\'ve had enough. Take me off your list or I\'ll report you to the Communications Authority!',
    delay: 4000,
  },
  {
    speaker: 'agent',
    text: 'I completely understand why you\'re upset, and I want to personally ensure this gets resolved today. I will flag this account for immediate investigation and put a hold on all collection activity while we review. Does that sound fair?',
    delay: 6000,
  },
  {
    speaker: 'customer',
    text: 'Well... I suppose that sounds reasonable. But I want this sorted out properly. I\'m tired of being called about something that isn\'t mine.',
    delay: 4000,
  },
  {
    speaker: 'agent',
    text: 'Absolutely, Ms. Wanjiku. I\'m noting your account right now: dispute flagged, collection activity paused, investigation requested. You should receive a call from our disputes team within 48 hours. Is there anything else I can note for the investigation?',
    delay: 5500,
  },
  {
    speaker: 'customer',
    text: 'No, just make sure someone actually looks into it this time. I don\'t want to have to call again.',
    delay: 3500,
  },
  {
    speaker: 'agent',
    text: 'I promise you, this will be escalated personally. You can also reach me directly if you don\'t hear back within 48 hours. I\'ll give you my extension. Thank you for your patience, Ms. Wanjiku.',
    delay: 4500,
  },
];

export const demoTemplates: Record<DemoTemplate, { customer: Customer; script: DemoEntry[] }> = {
  cooperative: {
    customer: demoCustomer,
    script: cooperativeScript,
  },
  hostile: {
    customer: hostileCustomer,
    script: hostileScript,
  },
};
