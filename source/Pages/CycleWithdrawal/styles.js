import { makeStyles } from '@material-ui/core/styles';

export default makeStyles((theme) => ({
  innerContainer: {
    padding: `0px ${theme.spacing(2)}px`,
  },
  buttonContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: `-${theme.spacing(2)}px`,
  },
  cyclesContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  amountContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
  },
  amount: {
    color: theme.palette.common.blue,
    fontSize: 30,
    lineHeight: '36px',
    fontWeight: 800,
  },
  trillion: {
    color: theme.palette.common.blue,
    fontSize: 20,
    marginLeft: 3,
  },
  requestHandler: {
    width: '100%',
    height: 40,
    background: '#B5B7BB',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
  },
  arrow: {
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    position: 'absolute',
  },
  requestCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: 'auto',
    width: 'fit-content',
  },
  left: {
    left: theme.spacing(2),
  },
  right: {
    right: theme.spacing(2),
  },
}));
