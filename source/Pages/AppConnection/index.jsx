import React from 'react';
import ReactDOM from 'react-dom';
import qs from 'query-string';
import { useTranslation, initReactI18next } from 'react-i18next';
import { Layout } from '@components';
import {
  Button, Container, IncomingAction, theme,
} from '@ui';
import { PortRPC } from '@fleekhq/browser-rpc';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import i18n from 'i18next';

import { CONNECTION_STATUS } from '@shared/constants/connectionStatus';
import initConfig from '../../locales';
import useStyles from './styles';

i18n.use(initReactI18next).init(initConfig);

const portRPC = new PortRPC({
  name: 'app-connection-port',
  target: 'bg-script',
  timeout: 5000,
});

portRPC.start();

const AppConnection = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  const { query } = qs.parseUrl(window.location.href);

  const {
    url,
    icon,
    callId,
    portId,
  } = query;

  const onClickHandler = async (status) => {
    await portRPC.call('handleAppConnect', [url, status, callId, portId]);
    window.close();
  };

  // find way to do this
  // window.onbeforeunload = () => { // if user closes the window, reject connection
  //  onClickHandler(CONNECTION_STATUS.rejected);
  // };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Container>
          <IncomingAction url={url} image={icon} action={t('appConnection.connect')} />
          <div className={classes.buttonContainer}>
            <Button variant="default" value={t('common.decline')} onClick={() => onClickHandler(CONNECTION_STATUS.rejected)} style={{ width: '48%' }} />
            <Button variant="rainbow" value={t('common.allow')} onClick={() => onClickHandler(CONNECTION_STATUS.accepted)} style={{ width: '48%' }} />
          </div>
        </Container>
      </Layout>
    </ThemeProvider>
  );
};

ReactDOM.render(<AppConnection />, document.getElementById('notification-root'));
