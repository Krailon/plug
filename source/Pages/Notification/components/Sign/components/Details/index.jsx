import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { IncomingAction } from '@ui';

import { ASSET_CANISTER_IDS } from '@shared/constants/canisters';

import WarningBox from './components/WarningBox';
import NFTDisplay from './components/NFTDisplay';
import AssetDisplay from './components/AssetDisplay';
import CanisterInfoDisplay from './components/CanisterInfoDisplay';

import useStyles from './styles';

const getDisplayComponent = (request) => {
  const isTransfer = ['transfer', 'transferErc20', 'transfer_to', 'send_dfx'].includes(request?.methodName);
  if (!isTransfer) return CanisterInfoDisplay;
  return ASSET_CANISTER_IDS.includes(request?.canisterId) ? AssetDisplay : NFTDisplay;
};

const Details = ({
  shouldWarn, toggleModal, url, icon, request,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const Display = getDisplayComponent(request);
  return (
    <div className={classes.detailsWrapper}>
      <IncomingAction url={url} image={icon} action={t('sign.warning.action', { canisterName: request.canisterName })} />
      <Display
        toggleModal={toggleModal}
        request={request}
        shouldWarn={shouldWarn}
      />
      { shouldWarn && (
        <WarningBox
          pageUrl={url}
          canisterId={request?.canisterId}
          canisterName={request?.canisterName}
        />
      )}
    </div>
  );
};

Details.propTypes = {
  shouldWarn: PropTypes.bool,
  toggleModal: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired,
  icon: PropTypes.string,
  request: PropTypes.shape({
    canisterDescription: PropTypes.string,
    canisterIcon: PropTypes.string,
    canisterId: PropTypes.string,
    canisterName: PropTypes.string,
    canisterUrl: PropTypes.string,
    methodName: PropTypes.string,
  }).isRequired,
};

Details.defaultProps = {
  shouldWarn: false,
  icon: '',
};

export default Details;
