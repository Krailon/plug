import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Info } from 'react-feather';
import { useTranslation } from 'react-i18next';
import extension from 'extensionizer';

import ICNS_IMG from '@assets/icons/icns.svg';
import { Switch } from '@components';
import { Button } from '@ui';

import useStyles from './styles';
import ICNSSelector from '../ICNSSelector';
import InfoModal from '../InfoModal';

const ICNSToggle = ({ active, handleToggle }) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { names } = useSelector((state) => state.icns);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <div className={clsx(
        classes.icnsContainer,
        active && classes.active,
      )}
      >
        <div className={classes.toggleContainer}>
          <div className={classes.titleContainer}>
            <img
              className={classes.icnsImg}
              src={ICNS_IMG}
            />
            <Info
              className={classes.info}
              size={20}
              onClick={() => setInfoOpen(true)}
            />
          </div>
          <Switch
            checked={active}
            onChange={handleToggle}
          />
        </div>
        {active && (
        <>
          <ICNSSelector />
          {!names?.length && (
            <Button
              onClick={() => extension.tabs.create({ url: 'https://icns.id' })}
              value={t('walletDetails.getICNS')}
              fullWidth
              variant="blue"
              wrapperStyle={{ textAlign: 'center' }}
            />
          )}
        </>
        )}
      </div>
      <InfoModal
        title={t('walletDetails.icnsInfoTitle')}
        onClose={() => setInfoOpen(false)}
        isOpen={infoOpen}
        content={t('walletDetails.icnsDescription')}
        buttonText={t('walletDetails.icnsLearnMore')}
      />
    </>
  );
};

ICNSToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  handleToggle: PropTypes.func.isRequired,
};

export default ICNSToggle;
