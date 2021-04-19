import { makeStyles } from '@material-ui/core/styles';

export default makeStyles({
  root: {
    height: 68,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    zIndex: 10,
    position: 'relative',
    background: '#FFFFFF',
    boxShadow:
      '0px 0px 0px rgba(6, 44, 82, 0.1), 0px 1px 3px rgba(64, 66, 69, 0.12), 0px 2px 16px rgba(33, 43, 54, 0.08)',
  },
  walletContainer: {
    flex: 3,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
  flex: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
