import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import BackIcon from '@assets/icons/back.svg';
import { Layout } from '@components';
import { TABS, useRouter } from '@components/Router';
import { Header, LinkButton } from '@ui';

import { setSendAddress } from '../../../redux/nfts';
import useSteps from './useSteps';

const SendNFT = () => {
  const { t } = useTranslation();
  const { navigator } = useRouter();
  const dispatch = useDispatch();
  const { selectedNft: nft } = useSelector((state) => state.nfts);

  useEffect(() => {
    if (!nft) {
      navigator.navigate('home', TABS.NFTS);
    }
  }, [nft]);

  const onBack = () => {
    dispatch(setSendAddress(null));
    navigator.navigate('nft-details');
  };

  const navigateHome = () => navigator.navigate('home', TABS.NFTS);

  const { title, component } = useSteps();

  return (
    <Layout>
      <Header
        left={<LinkButton value={t('common.back')} onClick={onBack} startIcon={BackIcon} />}
        center={title}
        right={<LinkButton value={t('common.close')} onClick={navigateHome} />}
      />
      {component}
    </Layout>
  );
};

export default SendNFT;
