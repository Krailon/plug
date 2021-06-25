import React, { useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import DepositIcon from '@material-ui/icons/AddRounded';
import SendIcon from '@material-ui/icons/Telegram';
import SwapIcon from '@material-ui/icons/SwapHorizRounded';
import { Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import useStyles from './styles';
import HoverAnimation from '../HoverAnimation';

const ACTION_SETTINGS = {
  deposit: {
    name: 'Deposit',
    icon: <DepositIcon style={{ fontSize: '1.3em' }} />,
    iconClass: 'iconDeposit',
    textClass: 'textDeposit',
  },
  send: {
    name: 'Send',
    icon: <SendIcon style={{ fontSize: '1.3em' }} />,
    iconClass: 'iconSend',
    textClass: 'textSend',
  },
  swap: {
    name: 'Swap',
    icon: <SwapIcon style={{ fontSize: '1.3em' }} />,
    iconClass: 'iconSwap',
    textClass: 'textSwap',
    disabled: true,
    tooltip: 'Coming soon!',
  },
};

const ActionButton = ({ type, onClick }) => {
  const {
    name,
    icon,
    iconClass,
    textClass,
    disabled,
    tooltip,
  } = ACTION_SETTINGS[type];

  const classes = useStyles();
  const [hovered, setHovered] = useState(false);
  const onMouseOver = () => setHovered(true);
  const onMouseLeave = () => setHovered(false);

  return (
    <HoverAnimation disabled={disabled}>
      <Tooltip
        title={tooltip}
        arrow
        open={!!tooltip && hovered}
        placement="top"
      >
        <div
          className={classes.root}
          onClick={onClick}
          onMouseEnter={onMouseOver}
          onMouseLeave={onMouseLeave}
        >
          <IconButton className={clsx(classes.icon, classes[iconClass])} disabled={disabled}>
            {icon}
          </IconButton>
          <span className={clsx(classes.text, classes[textClass])}>
            {name}
          </span>
        </div>
      </Tooltip>
    </HoverAnimation>
  );
};

export default ActionButton;

ActionButton.propTypes = {
  type: PropTypes.oneOf(['deposit', 'send', 'swap']).isRequired,
  onClick: PropTypes.func.isRequired,
};
