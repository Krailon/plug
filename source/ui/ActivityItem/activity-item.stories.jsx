import { CURRENCIES } from '@shared/constants/currencies';
import { ACTIVITY_TYPES, ACTIVITY_STATUS } from '@shared/constants/activity';
import ActivityItem from './index';

export default {
  title: 'UI/ActivityItem',
  component: ActivityItem,
};

const Template = (args) => <ActivityItem {...args} />;

export const Default = Template.bind({});
Default.args = {
  type: ACTIVITY_TYPES.SEND,
  currency: CURRENCIES.ICP,
  wallet: 'rwlgt...ii-cai',
  amount: -182.27,
  value: 2129.12,
  status: ACTIVITY_STATUS.DONE,
  date: 'Apr 12',
  plug: null,
};
