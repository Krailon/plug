import React from 'react';
import PropTypes from 'prop-types';
import { IncomingAction, USDFormat } from '@ui';
import { useTranslation } from 'react-i18next';
import { Typography } from '@material-ui/core';
import { CURRENCIES } from '@shared/constants/currencies';
import NumberFormat from 'react-number-format';
import useStyles from '../styles';
import SIZES from '../constants';

const Details = ({
  cycles, image, url, requestCount,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const asset = CURRENCIES.get('CYCLES');
  const value = cycles * asset.price;

  window.resizeTo(SIZES.width, requestCount > 1
    ? SIZES.detailsHeightBig
    : SIZES.detailHeightSmall);

  return (
    <div className={classes.innerContainer}>
      <IncomingAction image={image} url={url} action={t('cycleTransactions.withdraw')} />

      <div className={classes.cyclesContainer}>
        <Typography variant="h3">{t('cycleTransactions.amount')}</Typography>

        <div className={classes.amountContainer}>
          <span className={classes.amount}>
            <NumberFormat value={cycles} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale />
            <span className={classes.trillion}>T</span>
          </span>
          <Typography variant="subtitle1">
            <USDFormat value={value} />
          </Typography>
        </div>

      </div>
    </div>
  );
};

export default Details;

Details.propTypes = {
  cycles: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  requestCount: PropTypes.number.isRequired,
};
