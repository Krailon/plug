import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import XTCIcon from '@assets/icons/XTC.svg';
import {
  Button, Container, USDFormat, AssetFormat,

} from '@ui';
import { USD_PER_TC } from '@shared/constants/currencies';
import { HANDLER_TYPES, sendMessage } from '@background/Keyring';
import useStyles from '../styles';

const cyclesToTC = cycles => cycles ? cycles / 1000000000000 : 0; // eslint-disable-line
const parseXTCInfo = (info) => ({
  ...info?.token,
  amount: cyclesToTC(info.amount),
  image: XTCIcon,
  price: cyclesToTC(info.amount) * USD_PER_TC,
});

const Step2 = ({ selectedToken, handleClose }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const displayToken = selectedToken?.token?.symbol === 'XTC' ? parseXTCInfo(selectedToken) : selectedToken;
  const registerToken = () => {
    setLoading(true);
    sendMessage({
      type: HANDLER_TYPES.ADD_CUSTOM_TOKEN,
      params: selectedToken?.token.canisterId,
    }, async () => {
      setLoading(false);
      handleClose();
    });
  };
  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1">{t('addToken.confirmText')}</Typography>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.confirmToken}>
            <img src={displayToken.image} className={classes.tokenImage} />
            <div className={classes.leftContainer}>
              <Typography variant="h4">{displayToken.name}</Typography>
              <Typography variant="subtitle1"><AssetFormat value={displayToken?.amount} asset={displayToken?.symbol} /></Typography>
            </div>
            <div className={classes.rightContainer}>
              <Typography variant="h4"><USDFormat value={displayToken?.price} /></Typography>
            </div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="rainbow"
            value={t('common.add')}
            onClick={registerToken}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Step2;

Step2.propTypes = {
  selectedToken: PropTypes.objectOf(PropTypes.object).isRequired,
  handleClose: PropTypes.func.isRequired,
};
