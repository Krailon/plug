import { StorageMock } from '@components';

import Options from './Options';

export default {
  title: 'Options',
  component: Options,
};

const Template = (args) => <Options {...args} />;

export const Default = Template.bind({});
Default.args = {
  storage: new StorageMock(),
};
